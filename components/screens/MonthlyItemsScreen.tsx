"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TopHeader } from "@/components/TopHeader";
import { Card, EmptyState } from "@/components/ui/Card";
import { currentCompetencia, formatMoney, monthLabel, shiftCompetencia } from "@/lib/format";
import type { Item, ItemTipo, Lancamento } from "@/lib/types";

type Tone = "brand" | "sky" | "sun" | "coral" | "grape";

const TONE_CLASSES: Record<Tone, { chip: string; value: string; dash: string }> = {
  brand: { chip: "bg-brand-100 text-brand-700", value: "text-brand-700", dash: "border-brand-300 text-brand-600" },
  sky: { chip: "bg-sky-500/10 text-sky-500", value: "text-sky-500", dash: "border-sky-400 text-sky-500" },
  sun: { chip: "bg-sun-500/10 text-sun-500", value: "text-sun-500", dash: "border-sun-400 text-sun-500" },
  coral: { chip: "bg-coral-500/10 text-coral-500", value: "text-coral-500", dash: "border-coral-400 text-coral-500" },
  grape: { chip: "bg-grape-500/10 text-grape-500", value: "text-grape-500", dash: "border-grape-400 text-grape-500" },
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function MonthlyItemsScreen({
  tipo,
  title,
  emoji,
  tone,
  valueDoneLabel,
  showDia,
  showExpectativa,
  initialItems,
  initialLancamentos,
}: {
  tipo: ItemTipo;
  title: string;
  emoji: string;
  tone: Tone;
  valueDoneLabel: string;
  showDia: boolean;
  showExpectativa: boolean;
  initialItems: Item[];
  initialLancamentos: Lancamento[];
}) {
  const supabase = createClient();
  const tones = TONE_CLASSES[tone];
  const [items, setItems] = useState(initialItems);
  const [competencia, setCompetencia] = useState(currentCompetencia());
  const [lancamentos, setLancamentos] = useState<Record<string, Lancamento>>(
    Object.fromEntries(initialLancamentos.map((l) => [l.item_id, l]))
  );
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(initialLancamentos.map((l) => [l.item_id, String(l.valor)]))
  );
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [dia, setDia] = useState("");
  const [expectativa, setExpectativa] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("lancamentos")
        .select("*")
        .eq("competencia", competencia)
        .in("item_id", items.map((i) => i.id).length ? items.map((i) => i.id) : ["00000000-0000-0000-0000-000000000000"]);
      if (!cancelled) {
        const byItem: Record<string, Lancamento> = Object.fromEntries(
          (data ?? []).map((l) => [l.item_id, l as Lancamento])
        );
        setLancamentos(byItem);
        setDrafts(Object.fromEntries(Object.entries(byItem).map(([id, l]) => [id, String(l.valor)])));
        setSaveState({});
        setSaveErrors({});
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competencia]);

  const total = useMemo(
    () => Object.values(lancamentos).reduce((s, l) => s + Number(l.valor), 0),
    [lancamentos]
  );

  function isDirty(item: Item) {
    const draft = drafts[item.id] ?? "";
    const saved = lancamentos[item.id]?.valor ?? 0;
    return Number(draft || 0) !== Number(saved);
  }

  function closeForm() {
    setOpen(false);
    setEditingId(null);
    setNome("");
    setDia("");
    setExpectativa(false);
    setFormError(null);
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setNome(item.nome);
    setDia(item.dia_vencimento ? String(item.dia_vencimento) : "");
    setExpectativa(item.expectativa);
    setFormError(null);
    setOpen(true);
  }

  async function submitItem(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSaving(true);
    setFormError(null);

    if (editingId) {
      const { data, error } = await supabase
        .from("items")
        .update({
          nome: nome.trim(),
          dia_vencimento: showDia && dia ? Number(dia) : null,
          expectativa: showExpectativa ? expectativa : false,
        })
        .eq("id", editingId)
        .select()
        .single();
      setSaving(false);
      if (error) return setFormError(error.message);
      setItems((prev) => prev.map((i) => (i.id === editingId ? (data as Item) : i)));
      closeForm();
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("items")
      .insert({
        user_id: user!.id,
        tipo,
        nome: nome.trim(),
        dia_vencimento: showDia && dia ? Number(dia) : null,
        expectativa: showExpectativa ? expectativa : false,
      })
      .select()
      .single();
    setSaving(false);
    if (error) return setFormError(error.message);
    setItems((prev) => [...prev, data as Item]);
    closeForm();
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("items").delete().eq("id", id);
  }

  async function saveValor(item: Item) {
    const valor = Number(drafts[item.id] || 0);
    setSaveState((prev) => ({ ...prev, [item.id]: "saving" }));
    setSaveErrors((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setSaveState((prev) => ({ ...prev, [item.id]: "error" }));
      setSaveErrors((prev) => ({ ...prev, [item.id]: userError?.message ?? "Sessão não encontrada" }));
      return;
    }

    const existing = lancamentos[item.id];
    const { data, error } = await supabase
      .from("lancamentos")
      .upsert(
        {
          id: existing?.id,
          item_id: item.id,
          user_id: user.id,
          competencia,
          valor,
          pago: existing?.pago ?? false,
        },
        { onConflict: "item_id,competencia" }
      )
      .select()
      .single();

    if (error || !data) {
      setSaveState((prev) => ({ ...prev, [item.id]: "error" }));
      setSaveErrors((prev) => ({ ...prev, [item.id]: error?.message ?? "Falha ao salvar" }));
      return;
    }

    setLancamentos((prev) => ({ ...prev, [item.id]: data as Lancamento }));
    setDrafts((prev) => ({ ...prev, [item.id]: String((data as Lancamento).valor) }));
    setSaveState((prev) => ({ ...prev, [item.id]: "saved" }));
    setTimeout(() => {
      setSaveState((prev) => (prev[item.id] === "saved" ? { ...prev, [item.id]: "idle" } : prev));
    }, 1800);
  }

  async function togglePago(item: Item) {
    const existing = lancamentos[item.id];
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("lancamentos")
      .upsert(
        {
          id: existing?.id,
          item_id: item.id,
          user_id: user.id,
          competencia,
          valor: existing?.valor ?? Number(drafts[item.id] || 0),
          pago: !(existing?.pago ?? false),
        },
        { onConflict: "item_id,competencia" }
      )
      .select()
      .single();
    if (error || !data) {
      setSaveErrors((prev) => ({ ...prev, [item.id]: error?.message ?? "Falha ao salvar" }));
      return;
    }
    setLancamentos((prev) => ({ ...prev, [item.id]: data as Lancamento }));
    setDrafts((prev) => ({ ...prev, [item.id]: String((data as Lancamento).valor) }));
  }

  return (
    <div>
      <TopHeader
        emoji={emoji}
        title={title}
        subtitle={`Total em ${monthLabel(competencia)} · ${formatMoney(total)}`}
      />

      <div className="space-y-4 px-4 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-card">
          <button
            onClick={() => setCompetencia((c) => shiftCompetencia(c, -1))}
            className="h-8 w-8 rounded-xl bg-ink-50 text-ink-500"
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <span className="text-sm font-bold capitalize text-ink-800">
            {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
              new Date(competencia)
            )}
          </span>
          <button
            onClick={() => setCompetencia((c) => shiftCompetencia(c, 1))}
            className="h-8 w-8 rounded-xl bg-ink-50 text-ink-500"
            aria-label="Próximo mês"
          >
            ›
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState emoji={emoji} title="Nada por aqui ainda" hint="Adicione o primeiro item" />
        ) : (
          <div className={`space-y-2 ${loading ? "opacity-60" : ""}`}>
            {items.map((item) => {
              const lanc = lancamentos[item.id];
              const dirty = isDirty(item);
              const state = saveState[item.id] ?? "idle";
              return (
                <Card key={item.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-800">{item.nome}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {showDia && item.dia_vencimento && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tones.chip}`}>
                            Vence dia {item.dia_vencimento}
                          </span>
                        )}
                        {showExpectativa && item.expectativa && (
                          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-500">
                            Expectativa
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="text-ink-400 hover:text-brand-600"
                        aria-label="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-ink-400 hover:text-coral-500"
                        aria-label="Remover"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={drafts[item.id] ?? ""}
                      placeholder="0,00"
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveValor(item);
                      }}
                      className={`w-full rounded-xl border border-ink-100 bg-ink-50 px-3 py-2 text-sm font-bold outline-none focus:border-brand-400 ${tones.value}`}
                    />
                    <button
                      onClick={() => saveValor(item)}
                      disabled={!dirty || state === "saving"}
                      className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition ${
                        state === "saved"
                          ? "bg-brand-600 text-white"
                          : dirty
                            ? "bg-ink-800 text-white"
                            : "bg-ink-100 text-ink-400"
                      }`}
                    >
                      {state === "saving" ? "Salvando..." : state === "saved" ? "✓ Salvo" : "Salvar"}
                    </button>
                    <button
                      onClick={() => togglePago(item)}
                      className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition ${
                        lanc?.pago
                          ? "bg-brand-600 text-white"
                          : "bg-ink-100 text-ink-500"
                      }`}
                    >
                      {lanc?.pago ? `✓ ${valueDoneLabel}` : valueDoneLabel}
                    </button>
                  </div>
                  {saveErrors[item.id] && (
                    <p className="mt-1.5 text-xs font-medium text-coral-500">
                      Erro ao salvar: {saveErrors[item.id]}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {open ? (
          <form onSubmit={submitItem} className="space-y-2 rounded-3xl bg-white p-4 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
              {editingId ? "Editar" : "Novo item"}
            </p>
            <input
              autoFocus
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
            />
            {showDia && (
              <input
                type="number"
                min={1}
                max={31}
                placeholder="Dia de vencimento"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
              />
            )}
            {showExpectativa && (
              <label className="flex items-center gap-2 px-1 text-sm text-ink-600">
                <input
                  type="checkbox"
                  checked={expectativa}
                  onChange={(e) => setExpectativa(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-600"
                />
                É uma expectativa (não garantido)
              </label>
            )}
            {formError && <p className="text-xs font-medium text-coral-500">Erro: {formError}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 rounded-2xl bg-ink-100 py-2.5 text-sm font-semibold text-ink-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-2xl bg-brand-600 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                Salvar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className={`w-full rounded-2xl border-2 border-dashed py-3 text-sm font-bold ${tones.dash}`}
          >
            + Adicionar
          </button>
        )}
      </div>
    </div>
  );
}
