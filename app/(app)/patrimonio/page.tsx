import { createClient } from "@/lib/supabase/server";
import { PatrimonioScreen } from "@/components/screens/PatrimonioScreen";
import { PageError } from "@/components/ui/PageError";
import { loadContaPadrao } from "@/lib/contaPadrao";
import type { Bem, Divida } from "@/lib/types";

export default async function PatrimonioPage() {
  const supabase = createClient();
  const [{ contas, contaPadraoId }, { data: dividas, error: dividasError }, { data: bens, error: bensError }] =
    await Promise.all([
      loadContaPadrao(),
      supabase.from("dividas").select("*").order("created_at", { ascending: true }),
      supabase.from("bens").select("*").order("created_at", { ascending: true }),
    ]);

  if (dividasError) return <PageError error={dividasError} />;
  if (bensError) return <PageError error={bensError} />;

  return (
    <PatrimonioScreen
      initialContas={contas}
      initialContaPadraoId={contaPadraoId}
      initialDividas={(dividas ?? []) as Divida[]}
      initialBens={(bens ?? []) as Bem[]}
    />
  );
}
