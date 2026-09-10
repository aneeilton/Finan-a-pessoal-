import { createClient } from "@/lib/supabase/server";
import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { currentCompetencia } from "@/lib/format";
import type { Item, Lancamento } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = createClient();
  const competencia = currentCompetencia();

  const [{ data: contas }, { data: dividas }, { data: bens }, { data: items }, { data: config }] =
    await Promise.all([
      supabase.from("contas").select("*"),
      supabase.from("dividas").select("*"),
      supabase.from("bens").select("*"),
      supabase.from("items").select("*"),
      supabase.from("config").select("*"),
    ]);

  const itemIds = (items ?? []).map((i) => i.id);
  const { data: lancamentos } = itemIds.length
    ? await supabase.from("lancamentos").select("*").eq("competencia", competencia).in("item_id", itemIds)
    : { data: [] as Lancamento[] };

  const variaveis = Number(config?.[0]?.variaveis ?? 0);

  const saldoContas = (contas ?? []).reduce((s, c) => s + Number(c.saldo_corrente), 0);
  const totalAplicado = (contas ?? []).reduce((s, c) => s + Number(c.saldo_aplicado), 0);
  const totalDividas = (dividas ?? []).reduce((s, d) => s + Number(d.valor), 0);
  const totalBens = (bens ?? []).reduce((s, b) => s + Number(b.valor), 0);

  const itemsById = new Map<string, Item>((items ?? []).map((i) => [i.id, i as Item]));
  const receitaMes = (lancamentos ?? [])
    .filter((l) => itemsById.get(l.item_id)?.tipo === "receita")
    .reduce((s, l) => s + Number(l.valor), 0);
  const cartoesMes = (lancamentos ?? [])
    .filter((l) => itemsById.get(l.item_id)?.tipo === "cartao")
    .reduce((s, l) => s + Number(l.valor), 0);
  const fixasMes = (lancamentos ?? [])
    .filter((l) => itemsById.get(l.item_id)?.tipo === "fixa")
    .reduce((s, l) => s + Number(l.valor), 0);
  const despesaMes = cartoesMes + fixasMes + variaveis;

  const proximosVencimentos = (items ?? [])
    .filter((i) => (i.tipo === "cartao" || i.tipo === "fixa") && i.dia_vencimento)
    .map((i) => {
      const lanc = (lancamentos ?? []).find((l) => l.item_id === i.id);
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
      patrimonioLiquido={saldoContas + totalAplicado + totalBens - totalDividas}
      saldoContas={saldoContas}
      totalAplicado={totalAplicado}
      totalDividas={totalDividas}
      totalBens={totalBens}
      receitaMes={receitaMes}
      despesaMes={despesaMes}
      proximosVencimentos={proximosVencimentos}
    />
  );
}
