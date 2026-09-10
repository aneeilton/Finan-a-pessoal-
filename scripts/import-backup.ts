/**
 * Importa um backup JSON do app antigo (formato "financas_backup_*.json") para o
 * novo schema no Supabase.
 *
 * Uso:
 *   npm run import-backup -- caminho/para/backup.json [YYYY-MM]
 *
 * Variaveis de ambiente necessarias (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (Project Settings -> API -> service_role, NUNCA no browser)
 *   IMPORT_USER_ID              (uuid do usuario dono dos dados)
 *
 * Como o app nao tem mais tela de login (sessao anonima automatica), pegue o
 * IMPORT_USER_ID assim: abra o app uma vez no navegador para criar sua sessao,
 * depois em Supabase -> Authentication -> Users copie o UUID do usuario
 * "Anonymous". Se o projeto ainda usar contas com e-mail/senha, informe
 * IMPORT_USER_EMAIL em vez de IMPORT_USER_ID.
 *
 * O segundo argumento opcional define para qual mes (YYYY-MM) o indice 0 dos
 * arrays "v" do backup antigo deve apontar. Os indices seguintes (1, 2, 3...)
 * avancam um mes cada. Sem esse argumento, usa o mes corrente.
 *
 * O formato antigo guardava cada receita/cartao/conta fixa como um array de 7
 * posicoes (v[0..6]) e um mapa solto de "pago/recebido" por string
 * ("fixa_<indice>_<id>", "rec_<indice>_<id>", ou o formato legado "<id>_<indice>"
 * dentro de dados.pagos). Este script converte isso para linhas normais nas
 * tabelas "items" e "lancamentos".
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

type BackupItem = {
  id: string;
  nome: string;
  dia?: number;
  v?: number[];
  expectativa?: boolean;
};

type Backup = {
  dados: {
    pagos?: Record<string, boolean>;
    contas: { id: string; nome: string; corrente: number; aplicado: number }[];
    dividas: { id: string; nome: string; valor: number; tipo: "curto" | "longo" }[];
    bens: { id: string; nome: string; valor: number }[];
    receitas: BackupItem[];
    cartoes: BackupItem[];
    fixas: BackupItem[];
  };
  pagos?: Record<string, boolean>;
  recebidos?: Record<string, boolean>;
  variaveis?: number;
};

async function main() {
  const [, , filePath, anchorArg] = process.argv;
  if (!filePath) {
    console.error("Uso: npm run import-backup -- caminho/para/backup.json [YYYY-MM]");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const userIdEnv = process.env.IMPORT_USER_ID;
  const email = process.env.IMPORT_USER_EMAIL;
  if (!url || !serviceKey || (!userIdEnv && !email)) {
    console.error(
      "Defina NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e IMPORT_USER_ID (ou IMPORT_USER_EMAIL) em .env.local"
    );
    process.exit(1);
  }

  const backup: Backup = JSON.parse(readFileSync(filePath, "utf-8"));
  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const userId = userIdEnv ?? (await findUserIdByEmail(supabase, email!));
  console.log(`Importando para o usuario ${userId}`);

  const now = anchorArg ? new Date(`${anchorArg}-01T00:00:00`) : new Date();
  const anchorYear = now.getFullYear();
  const anchorMonth = now.getMonth(); // 0-indexed
  const competenciaFromIndex = (idx: number) => {
    const d = new Date(anchorYear, anchorMonth + idx, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  };

  // ---------- contas ----------
  if (backup.dados.contas?.length) {
    const { error } = await supabase.from("contas").insert(
      backup.dados.contas.map((c) => ({
        user_id: userId,
        nome: c.nome,
        saldo_corrente: c.corrente ?? 0,
        saldo_aplicado: c.aplicado ?? 0,
      }))
    );
    if (error) throw error;
    console.log(`✔ ${backup.dados.contas.length} contas importadas`);
  }

  // ---------- dividas ----------
  if (backup.dados.dividas?.length) {
    const { error } = await supabase.from("dividas").insert(
      backup.dados.dividas.map((d) => ({
        user_id: userId,
        nome: d.nome,
        valor: d.valor ?? 0,
        tipo: d.tipo,
      }))
    );
    if (error) throw error;
    console.log(`✔ ${backup.dados.dividas.length} dividas importadas`);
  }

  // ---------- bens ----------
  if (backup.dados.bens?.length) {
    const { error } = await supabase.from("bens").insert(
      backup.dados.bens.map((b) => ({ user_id: userId, nome: b.nome, valor: b.valor ?? 0 }))
    );
    if (error) throw error;
    console.log(`✔ ${backup.dados.bens.length} bens importados`);
  }

  // ---------- items recorrentes (receitas / cartoes / fixas) ----------
  await importGroup(supabase, userId, backup.dados.receitas, "receita", competenciaFromIndex, (idx, id) =>
    isMarked(backup, ["rec", idx, id], [id, idx])
  );
  await importGroup(supabase, userId, backup.dados.cartoes, "cartao", competenciaFromIndex, (idx, id) =>
    isMarked(backup, ["cartao", idx, id], [id, idx])
  );
  await importGroup(supabase, userId, backup.dados.fixas, "fixa", competenciaFromIndex, (idx, id) =>
    isMarked(backup, ["fixa", idx, id], [id, idx])
  );

  // ---------- config (orcamento de gastos variaveis) ----------
  await supabase
    .from("config")
    .upsert({ user_id: userId, variaveis: backup.variaveis ?? 0 }, { onConflict: "user_id" });
  console.log("✔ configuracao (gastos variaveis) importada");

  console.log("Importacao concluida.");
}

async function importGroup(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  list: BackupItem[] | undefined,
  tipo: "receita" | "cartao" | "fixa",
  competenciaFromIndex: (idx: number) => string,
  isPago: (idx: number, id: string) => boolean
) {
  if (!list?.length) return;
  let itemsCount = 0;
  let lancCount = 0;

  for (const raw of list) {
    const { data: item, error } = await supabase
      .from("items")
      .insert({
        user_id: userId,
        tipo,
        nome: raw.nome,
        dia_vencimento: raw.dia ?? null,
        expectativa: raw.expectativa ?? false,
      })
      .select()
      .single();
    if (error) throw error;
    itemsCount += 1;

    const values = raw.v ?? [];
    const rows = values
      .map((valor, idx) => ({ valor, idx }))
      .filter(({ valor, idx }) => valor !== 0 || isPago(idx, raw.id))
      .map(({ valor, idx }) => ({
        item_id: item!.id as string,
        user_id: userId,
        competencia: competenciaFromIndex(idx),
        valor,
        pago: isPago(idx, raw.id),
      }));

    if (rows.length) {
      const { error: lancError } = await supabase.from("lancamentos").insert(rows);
      if (lancError) throw lancError;
      lancCount += rows.length;
    }
  }

  console.log(`✔ ${itemsCount} itens (${tipo}) e ${lancCount} lancamentos mensais importados`);
}

function isMarked(
  backup: Backup,
  [tipoPrefix, idx, id]: [string, number, string],
  [legacyId, legacyIdx]: [string, number]
): boolean {
  const topLevelMap = tipoPrefix === "rec" ? backup.recebidos : backup.pagos;
  const topLevelKey = `${tipoPrefix}_${idx}_${id}`;
  const legacyKey = `${legacyId}_${legacyIdx}`;
  return Boolean(topLevelMap?.[topLevelKey] ?? backup.dados.pagos?.[legacyKey]);
}

async function findUserIdByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string
): Promise<string> {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  throw new Error(`Usuario ${email} nao encontrado no Supabase Auth.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
