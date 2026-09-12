import { createClient } from "@/lib/supabase/server";
import { DividasScreen } from "@/components/screens/DividasScreen";
import { PageError } from "@/components/ui/PageError";

export default async function DividasPage() {
  const supabase = createClient();
  const { data: dividas, error } = await supabase
    .from("dividas")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return <PageError error={error} />;

  return <DividasScreen initialDividas={dividas ?? []} />;
}
