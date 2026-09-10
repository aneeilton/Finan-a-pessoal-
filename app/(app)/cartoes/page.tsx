import { createClient } from "@/lib/supabase/server";
import { MonthlyItemsScreen } from "@/components/screens/MonthlyItemsScreen";
import { currentCompetencia } from "@/lib/format";

export default async function CartoesPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("tipo", "cartao")
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
      tipo="cartao"
      title="Cartões"
      emoji="💳"
      tone="coral"
      valueDoneLabel="Pago"
      showDia={true}
      showExpectativa={false}
      initialItems={items ?? []}
      initialLancamentos={lancamentos ?? []}
    />
  );
}
