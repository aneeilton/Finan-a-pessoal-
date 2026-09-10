import { createClient } from "@/lib/supabase/server";
import { ContasScreen } from "@/components/screens/ContasScreen";

export default async function ContasPage() {
  const supabase = createClient();
  const { data: contas } = await supabase
    .from("contas")
    .select("*")
    .order("created_at", { ascending: true });

  return <ContasScreen initialContas={contas ?? []} />;
}
