import { createClient } from "@/lib/supabase/server";
import { MaisScreen } from "@/components/screens/MaisScreen";
import { PageError } from "@/components/ui/PageError";

export default async function MaisPage() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) return <PageError error={userError} />;

  const { data: config, error } = await supabase
    .from("config")
    .select("*")
    .eq("user_id", user?.id)
    .maybeSingle();

  if (error) return <PageError error={error} />;

  return (
    <MaisScreen
      initialVariaveis={Number(config?.variaveis ?? 0)}
      isAnonymous={user?.is_anonymous ?? true}
      email={user?.email ?? null}
    />
  );
}
