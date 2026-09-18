import { createClient } from "@/lib/supabase/server";
import { ContasScreen } from "@/components/screens/ContasScreen";
import { PageError } from "@/components/ui/PageError";

export default async function ContasPage() {
  const supabase = createClient();
  const [{ data: contas, error }, { data: config }] = await Promise.all([
    supabase.from("contas").select("*").order("created_at", { ascending: true }),
    supabase.from("config").select("conta_padrao_id"),
  ]);

  if (error) return <PageError error={error} />;

  return (
    <ContasScreen
      initialContas={contas ?? []}
      initialContaPadraoId={config?.[0]?.conta_padrao_id ?? null}
    />
  );
}
