import { createClient } from "@/lib/supabase/server";
import { BensScreen } from "@/components/screens/BensScreen";

export default async function BensPage() {
  const supabase = createClient();
  const { data: bens } = await supabase
    .from("bens")
    .select("*")
    .order("created_at", { ascending: true });

  return <BensScreen initialBens={bens ?? []} />;
}
