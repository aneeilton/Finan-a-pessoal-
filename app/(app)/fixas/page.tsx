import { createClient } from "@/lib/supabase/server";
import { MonthlyItemsScreen } from "@/components/screens/MonthlyItemsScreen";
import { PageError } from "@/components/ui/PageError";
import { currentCompetencia } from "@/lib/format";

export default async function FixasPage() {
  const supabase = createClient();
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("*")
    .eq("tipo", "fixa")
    .order("created_at", { ascending: true });

  if (itemsError) return <PageError error={itemsError} />;

  const itemIds = (items ?? []).map((i) => i.id);
  const { data: lancamentos, error: lancError } = itemIds.length
    ? await supabase
        .from("lancamentos")
        .select("*")
        .eq("competencia", currentCompetencia())
        .in("item_id", itemIds)
    : { data: [], error: null };

  if (lancError) return <PageError error={lancError} />;

  return (
    <MonthlyItemsScreen
      tipo="fixa"
      title="Contas fixas"
      tone="sun"
      valueDoneLabel="Pago"
      showDia={true}
      showExpectativa={false}
      initialItems={items ?? []}
      initialLancamentos={lancamentos ?? []}
    />
  );
}
