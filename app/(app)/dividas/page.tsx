import { createClient } from "@/lib/supabase/server";
import { DividasScreen } from "@/components/screens/DividasScreen";

export default async function DividasPage() {
  const supabase = createClient();
  const { data: dividas } = await supabase
    .from("dividas")
    .select("*")
    .order("created_at", { ascending: true });

  return <DividasScreen initialDividas={dividas ?? []} />;
}
