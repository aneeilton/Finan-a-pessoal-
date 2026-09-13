import { createClient } from "@/lib/supabase/server";
import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { PageError } from "@/components/ui/PageError";
import { currentCompetencia } from "@/lib/format";
import type { Item, Lancamento } from "@/lib/types";

export default async function DashboardPage() {
  try {
    return await renderDashboard();
  } catch (err) {
    return <PageError error={err} />;
  }
}

async function renderDashboard() {
  const supabase = createClient();
  const competencia = currentCompetencia();

  const [contasRes, dividasRes, bensRes, itemsRes, configRes] = await Promise.all([
    supabase.from("contas").select("*"),
    supabase.from("dividas").select("*"),
    supabase.from("bens").select("*"),
    supabase.from("items").select("*"),
    supabase.from("config").select("*"),
  ]);

  for (const [label, res] of [
    ["contas", contasRes],
    ["dividas", dividasRes],
    ["bens", bensRes],
    ["items", itemsRes],
    ["config", configRes],
  ] as const) {
    if (res.error) {
      throw new Error(`Falha ao consultar "${label}": ${res.error.message}`);
    }
  }

  const contas = contasRes.data;
  const dividas = dividasRes.data;
  const bens = bensRes.data;
  const items = itemsRes.data;
  const config = configRes.data;

  const itemIds = (items ?? []).map((i) => i.id);
  let lancamentos: Lancamento[] = [];
  if (itemIds.length) {
    const { data, error } = await supabase
      .from("lancamentos")
      .select("*")
      .eq("competencia", competencia)
      .in("item_id", itemIds);
    if (error) throw new Error(`Falha ao consultar "lancamentos": ${error.message}`);
    lancamentos = data ?? [];
  }

  const variaveis = Number(config?.[0]?.variaveis ?? 0);

  const saldoContas = (contas ?? []).reduce((s, c) => s + Number(c.saldo_corrente), 0);
  const totalAplicado = (contas ?? []).reduce((s, c) => s + Number(c.saldo_aplicado), 0);
  const totalDividas = (dividas ?? []).reduce((s, d) => s + Number(d.valor), 0);
  const totalBens = (bens ?? []).reduce((s, b) => s + Number(b.valor), 0);

  const itemsById = new Map<string, Item>((items ?? []).map((i) => [i.id, i as Item]));
  const receitaMes = lancamentos
    .filter((l) => itemsById.get(l.item_id)?.tipo === "receita")
    .reduce((s, l) => s + Number(l.valor), 0);
  const cartoesMes = lancamentos
    .filter((l) => itemsById.get(l.item_id)?.tipo === "cartao")
    .reduce((s, l) => s + Number(l.valor), 0);
  const fixasMes = lancamentos
    .filter((l) => itemsById.get(l.item_id)?.tipo === "fixa")
    .reduce((s, l) => s + Number(l.valor), 0);
  const despesaMes = cartoesMes + fixasMes + variaveis;

  const receitasAReceber = lancamentos
    .filter((l) => itemsById.get(l.item_id)?.tipo === "receita" && !l.pago)
    .reduce((s, l) => s + Number(l.valor), 0);
  const despesasAPagar =
    lancamentos
      .filter(
        (l) => (itemsById.get(l.item_id)?.tipo === "cartao" || itemsById.get(l.item_id)?.tipo === "fixa") && !l.pago
      )
      .reduce((s, l) => s + Number(l.valor), 0) + variaveis;
  const previsaoFechamento = saldoContas + receitasAReceber - despesasAPagar;

  const proximosVencimentos = (items ?? [])
    .filter((i) => (i.tipo === "cartao" || i.tipo === "fixa") && i.dia_vencimento)
    .map((i) => {
      const lanc = lancamentos.find((l) => l.item_id === i.id);
      return {
        id: i.id,
        nome: i.nome,
        tipo: i.tipo as "cartao" | "fixa",
        dia: i.dia_vencimento as number,
        valor: Number(lanc?.valor ?? 0),
        pago: lanc?.pago ?? false,
      };
    })
    .filter((v) => !v.pago)
    .sort((a, b) => a.dia - b.dia)
    .slice(0, 5);

  return (
    <DashboardScreen
      saldoAtual={saldoContas}
      previsaoFechamento={previsaoFechamento}
      patrimonioLiquido={saldoContas + totalAplicado + totalBens - totalDividas}
      totalAplicado={totalAplicado}
      totalDividas={totalDividas}
      totalBens={totalBens}
      receitaMes={receitaMes}
      despesaMes={despesaMes}
      proximosVencimentos={proximosVencimentos}
    />
  );
}
