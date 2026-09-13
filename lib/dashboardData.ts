import { createClient } from "@/lib/supabase/server";
import type { Bem, Conta, Divida, GastoDiario, Item, Lancamento } from "@/lib/types";

export type FinanceSnapshot = {
  contas: Conta[];
  dividas: Divida[];
  bens: Bem[];
  items: Item[];
  lancamentos: Lancamento[];
  gastosDiarios: GastoDiario[];
  variaveis: number;
  saldoContas: number;
  totalAplicado: number;
  totalDividas: number;
  totalBens: number;
};

export type FinanceSnapshotResult =
  | { ok: true; data: FinanceSnapshot }
  | { ok: false; error: string };

export async function loadFinanceSnapshot(): Promise<FinanceSnapshotResult> {
  const supabase = createClient();

  const [contasRes, dividasRes, bensRes, itemsRes, gastosRes, configRes] = await Promise.all([
    supabase.from("contas").select("*"),
    supabase.from("dividas").select("*"),
    supabase.from("bens").select("*"),
    supabase.from("items").select("*"),
    supabase.from("gastos_diarios").select("*"),
    supabase.from("config").select("*"),
  ]);

  for (const [label, res] of [
    ["contas", contasRes],
    ["dividas", dividasRes],
    ["bens", bensRes],
    ["items", itemsRes],
    ["gastos_diarios", gastosRes],
    ["config", configRes],
  ] as const) {
    if (res.error) {
      return { ok: false, error: `Falha ao consultar "${label}": ${res.error.message}` };
    }
  }

  const items = (itemsRes.data ?? []) as Item[];
  const itemIds = items.map((i) => i.id);
  let lancamentos: Lancamento[] = [];
  if (itemIds.length) {
    const { data, error } = await supabase.from("lancamentos").select("*").in("item_id", itemIds);
    if (error) return { ok: false, error: `Falha ao consultar "lancamentos": ${error.message}` };
    lancamentos = (data ?? []) as Lancamento[];
  }

  const contas = (contasRes.data ?? []) as Conta[];
  const dividas = (dividasRes.data ?? []) as Divida[];
  const bens = (bensRes.data ?? []) as Bem[];

  return {
    ok: true,
    data: {
      contas,
      dividas,
      bens,
      items,
      lancamentos,
      gastosDiarios: (gastosRes.data ?? []) as GastoDiario[],
      variaveis: Number(configRes.data?.[0]?.variaveis ?? 0),
      saldoContas: contas.reduce((s, c) => s + Number(c.saldo_corrente), 0),
      totalAplicado: contas.reduce((s, c) => s + Number(c.saldo_aplicado), 0),
      totalDividas: dividas.reduce((s, d) => s + Number(d.valor), 0),
      totalBens: bens.reduce((s, b) => s + Number(b.valor), 0),
    },
  };
}
