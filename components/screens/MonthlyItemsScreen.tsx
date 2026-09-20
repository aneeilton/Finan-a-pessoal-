"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, CreditCard, Pencil, Repeat, TrendingUp, Wallet, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TopHeader } from "@/components/TopHeader";
import { Card, EmptyState } from "@/components/ui/Card";
import { MonthSelector } from "@/components/ui/MonthSelector";
import { currentCompetencia, formatMoney, monthLabel } from "@/lib/format";
import type { Conta, Item, ItemTipo, Lancamento } from "@/lib/types";

type Tone = "brand" | "sky" | "sun" | "coral" | "grape";

const TONE_CLASSES: Record<Tone, { chip: string; value: string; dash: string }> = {
  brand: { chip: "bg-brand-100 text-brand-700", value: "text-brand-700", dash: "border-brand-300 text-brand-600" },
  sky: { chip: "bg-sky-500/10 text-sky-500", value: "text-sky-500", dash: "border-sky-400 text-sky-500" },
  sun: { chip: "bg-sun-500/10 text-sun-500", value: "text-sun-500", dash: "border-sun-400 text-sun-500" },
  coral: { chip: "bg-coral-500/10 text-coral-500", value: "text-coral-500", dash: "border-coral-400 text-coral-500" },
  grape: { chip: "bg-grape-500/10 text-grape-500", value: "text-grape-500", dash: "border-grape-400 text-grape-500" },
};

// O icone e derivado do tipo aqui dentro (nao recebido via prop) porque
// esse componente e montado a partir de Server Components: referencia de
// componente nao atravessa a fronteira server/client de forma serializavel.
const TIPO_ICON = {
  receita: TrendingUp,
  despesa: Wallet,
} as const;

function itemIcon(tipo: ItemTipo, fixo: boolean) {
  if (tipo === "receita") return TrendingUp;
  return fixo ? Repeat : CreditCard;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function MonthlyItemsScreen({
  tipo,
  title,
  tone,
  valueDoneLabel,
  showDia,
  showExpectativa,
  initialItems,
  initialLancamentos,
  initialContas,
  contaPadraoId,
  hideHeader,
}: {
  tipo: ItemTipo;
  title: string;
  tone: Tone;
  valueDoneLabel: string;
  showDia: boolean;
  showExpectativa: boolean;
  initialItems: Item[];
  initialLancamentos: Lancamento[];
  initialContas: Conta[];
  contaPadraoId: string | null;
  hideHeader?: boolean;
}) {
  const supabase = createClient();
  const tones = TONE_CLASSES[tone];
  const icon = TIPO_ICON[tipo];
  const [items, setItems] = useState(initialItems);
  const [contas, setContas] = useState(initialContas);
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
  const [fixo, setFixo] = useState(false);
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

  const itemsVisiveis = useMemo(
    () => items.filter((i) => i.fixo || i.competencia_unica === competencia),
    [items, competencia]
  );

  function ordenarPorPendente(lista: Item[]) {
    return [...lista].sort(
      (a, b) => Number(lancamentos[a.id]?.pago ?? false) - Number(lancamentos[b.id]?.pago ?? false)
    );
  }

  const itemsFixos = useMemo(
    () => ordenarPorPendente(itemsVisiveis.filter((i) => i.fixo)),
    [itemsVisiveis, lancamentos]
  );
  const itemsPontuais = useMemo(
    () => ordenarPorPendente(itemsVisiveis.filter((i) => !i.fixo)),
    [itemsVisiveis, lancamentos]
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
    setFixo(false);
    setFormError(null);
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setNome(item.nome);
    setDia(item.dia_vencimento ? String(item.dia_vencimento) : "");
    setExpectativa(item.expectativa);
    setFixo(item.fixo);
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
          fixo,
          competencia_unica: fixo ? null : competencia,
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
        fixo,
        competencia_unica: fixo ? null : competencia,
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

  async function ajustarSaldoConta(delta: number): Promise<string | null> {
    if (delta === 0 || !contaPadraoId) return null;
    const conta = contas.find((c) => c.id === contaPadraoId);
    if (!conta) return "Conta padrão não encontrada";
    const novoSaldo = Number(conta.saldo_corrente) + delta;
    const { data, error } = await supabase
      .from("contas")
      .update({ saldo_corrente: novoSaldo })
      .eq("id", contaPadraoId)
      .select()
      .single();
    if (error || !data) {
      return error?.message ?? "Falha ao atualizar saldo da conta";
    }
    setContas((prev) => prev.map((c) => (c.id === contaPadraoId ? (data as Conta) : c)));
    return null;
  }

  async function togglePago(item: Item) {
    const existing = lancamentos[item.id];
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const valor = existing?.valor ?? Number(drafts[item.id] || 0);
    const novoPago = !(existing?.pago ?? false);
    const { data, error } = await supabase
      .from("lancamentos")
      .upsert(
        {
          id: existing?.id,
          item_id: item.id,
          user_id: user.id,
          competencia,
          valor,
          pago: novoPago,
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

    if (valor > 0) {
      const sinal = tipo === "receita" ? 1 : -1;
      const saldoError = await ajustarSaldoConta(novoPago ? sinal * valor : -sinal * valor);
      if (saldoError) {
        setSaveErrors((prev) => ({
          ...prev,
          [item.id]: `Lançamento salvo, mas saldo não foi ajustado: ${saldoError}`,
        }));
      }
    }
  }

  function renderItem(item: Item) {
    const lanc = lancamentos[item.id];
    const dirty = isDirty(item);
    const state = saveState[item.id] ?? "idle";
    const ItemIcon = itemIcon(tipo, item.fixo);
    return (
      <Card key={item.id}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${tones.chip}`}>
              <ItemIcon size={16} strokeWidth={2} />
            </span>
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
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => startEdit(item)}
              className="text-ink-400 hover:text-brand-600"
              aria-label="Editar"
            >
              <Pencil size={15} strokeWidth={2.25} />
            </button>
            <button
              onClick={() => removeItem(item.id)}
              className="text-ink-400 hover:text-coral-500"
              aria-label="Remover"
            >
              <X size={16} strokeWidth={2.25} />
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
            className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition ${
              state === "saved"
                ? "bg-brand-600 text-white"
                : dirty
                  ? "bg-ink-800 text-white"
                  : "bg-ink-100 text-ink-400"
            }`}
          >
            {state === "saved" && <Check size={13} strokeWidth={2.5} />}
            {state === "saving" ? "Salvando..." : state === "saved" ? "Salvo" : "Salvar"}
          </button>
          <button
            onClick={() => togglePago(item)}
            className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition ${
              lanc?.pago
                ? "bg-brand-600 text-white"
                : "bg-ink-100 text-ink-500"
            }`}
          >
            {lanc?.pago && <Check size={13} strokeWidth={2.5} />}
            {lanc?.pago ? valueDoneLabel : "Pendente"}
          </button>
        </div>
        {saveErrors[item.id] && (
          <p className="mt-1.5 text-xs font-medium text-coral-500">
            Erro ao salvar: {saveErrors[item.id]}
          </p>
        )}
      </Card>
    );
  }

  return (
    <div>
      {hideHeader ? (
        <p className="px-4 pb-2 text-sm text-ink-500">
          Total em {monthLabel(competencia)} · <span className="font-bold text-ink-800">{formatMoney(total)}</span>
        </p>
      ) : (
        <TopHeader
          icon={icon}
          title={title}
          subtitle={`Total em ${monthLabel(competencia)} · ${formatMoney(total)}`}
        />
      )}

      <div className="space-y-4 px-4 pt-1">
        <MonthSelector competencia={competencia} onChange={setCompetencia} />

        {!contaPadraoId && (
          <p className="px-1 text-[11px] text-ink-400">
            Defina uma conta padrão em <Link href="/patrimonio" className="font-bold text-brand-600">Patrimônio</Link> para
            que marcar como {valueDoneLabel.toLowerCase()} atualize o saldo automaticamente.
          </p>
        )}

        {items.length === 0 ? (
          <EmptyState icon={icon} title="Nada por aqui ainda" hint="Adicione o primeiro item" />
        ) : itemsVisiveis.length === 0 ? (
          <EmptyState icon={icon} title="Nada neste mês" hint="Itens pontuais só aparecem no mês em que ocorreram" />
        ) : (
          <div className={`space-y-4 ${loading ? "opacity-60" : ""}`}>
            {itemsFixos.length > 0 && (
              <div className="space-y-2">
                <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">Fixas</p>
                {itemsFixos.map(renderItem)}
              </div>
            )}
            {itemsPontuais.length > 0 && (
              <div className="space-y-2">
                <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">Pontuais</p>
                {itemsPontuais.map(renderItem)}
              </div>
            )}
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
            <label className="flex items-center gap-2 px-1 text-sm text-ink-600">
              <input
                type="checkbox"
                checked={fixo}
                onChange={(e) => setFixo(e.target.checked)}
                className="h-4 w-4 rounded accent-brand-600"
              />
              É {tipo === "receita" ? "uma receita" : "uma despesa"} fixa (repete todo mês)
            </label>
            {!fixo && (
              <p className="px-1 text-[11px] text-ink-400">
                Sem marcar, fica pontual: só aparece em {monthLabel(competencia)}.
              </p>
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
