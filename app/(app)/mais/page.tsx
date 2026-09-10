import { createClient } from "@/lib/supabase/server";
import { MaisScreen } from "@/components/screens/MaisScreen";

export default async function MaisPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: config } = await supabase
    .from("config")
    .select("*")
    .eq("user_id", user?.id)
    .maybeSingle();

  return <MaisScreen email={user?.email ?? ""} initialVariaveis={Number(config?.variaveis ?? 0)} />;
}
