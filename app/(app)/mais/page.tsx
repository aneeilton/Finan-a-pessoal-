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

  return (
    <MaisScreen
      isAnonymous={user?.is_anonymous ?? true}
      email={user?.email ?? null}
      userId={user?.id ?? null}
    />
  );
}
