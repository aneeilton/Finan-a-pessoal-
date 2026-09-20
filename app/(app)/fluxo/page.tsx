import { createClient } from "@/lib/supabase/server";
import { FluxoScreen } from "@/components/screens/FluxoScreen";
import { PageError } from "@/components/ui/PageError";
import { currentCompetencia } from "@/lib/format";
import { loadContaPadrao } from "@/lib/contaPadrao";
import type { Item, Lancamento } from "@/lib/types";

async function loadTipo(tipo: "receita" | "despesa") {
  const supabase = createClient();
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("*")
    .eq("tipo", tipo)
    .order("created_at", { ascending: true });

  if (itemsError) return { error: itemsError };

  const itemIds = (items ?? []).map((i) => i.id);
  const { data: lancamentos, error: lancError } = itemIds.length
    ? await supabase
        .from("lancamentos")
        .select("*")
        .eq("competencia", currentCompetencia())
        .in("item_id", itemIds)
    : { data: [], error: null };

  if (lancError) return { error: lancError };

  return { items: (items ?? []) as Item[], lancamentos: (lancamentos ?? []) as Lancamento[] };
}

export default async function FluxoPage() {
  const [receita, despesa] = await Promise.all([loadTipo("receita"), loadTipo("despesa")]);

  if (receita.error) return <PageError error={receita.error} />;
  if (despesa.error) return <PageError error={despesa.error} />;

  const { contas, contaPadraoId } = await loadContaPadrao();

  return (
    <FluxoScreen
      receita={{ items: receita.items!, lancamentos: receita.lancamentos! }}
      despesa={{ items: despesa.items!, lancamentos: despesa.lancamentos! }}
      contas={contas}
      contaPadraoId={contaPadraoId}
    />
  );
}
