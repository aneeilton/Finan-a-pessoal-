import { createClient } from "@/lib/supabase/server";
import type { Conta } from "@/lib/types";

export async function loadContaPadrao(): Promise<{ contas: Conta[]; contaPadraoId: string | null }> {
  const supabase = createClient();
  const [contasRes, configRes] = await Promise.all([
    supabase.from("contas").select("*"),
    supabase.from("config").select("conta_padrao_id"),
  ]);
  return {
    contas: (contasRes.data ?? []) as Conta[],
    contaPadraoId: configRes.data?.[0]?.conta_padrao_id ?? null,
  };
}
