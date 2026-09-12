import { createClient } from "@/lib/supabase/server";
import { ContasScreen } from "@/components/screens/ContasScreen";
import { PageError } from "@/components/ui/PageError";

export default async function ContasPage() {
  const supabase = createClient();
  const { data: contas, error } = await supabase
    .from("contas")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return <PageError error={error} />;

  return <ContasScreen initialContas={contas ?? []} />;
}
