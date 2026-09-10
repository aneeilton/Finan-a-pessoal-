import { createClient } from "@/lib/supabase/server";
import { MonthlyItemsScreen } from "@/components/screens/MonthlyItemsScreen";
import { currentCompetencia } from "@/lib/format";

export default async function ReceitasPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("tipo", "receita")
    .order("created_at", { ascending: true });

  const itemIds = (items ?? []).map((i) => i.id);
  const { data: lancamentos } = itemIds.length
    ? await supabase
        .from("lancamentos")
        .select("*")
        .eq("competencia", currentCompetencia())
        .in("item_id", itemIds)
    : { data: [] };

  return (
    <MonthlyItemsScreen
      tipo="receita"
      title="Receitas"
      emoji="📈"
      tone="brand"
      valueDoneLabel="Recebido"
      showDia={false}
      showExpectativa={true}
      initialItems={items ?? []}
      initialLancamentos={lancamentos ?? []}
    />
  );
}
