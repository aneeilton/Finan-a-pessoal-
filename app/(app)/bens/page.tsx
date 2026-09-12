import { createClient } from "@/lib/supabase/server";
import { BensScreen } from "@/components/screens/BensScreen";
import { PageError } from "@/components/ui/PageError";

export default async function BensPage() {
  const supabase = createClient();
  const { data: bens, error } = await supabase
    .from("bens")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return <PageError error={error} />;

  return <BensScreen initialBens={bens ?? []} />;
}
