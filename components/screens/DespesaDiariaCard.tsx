"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { CATEGORIAS_GASTO, categoriaIcon, categoriaLabel } from "@/lib/categoriasGasto";
import { formatMoney, monthLabel } from "@/lib/format";
import type { GastoDiario } from "@/lib/types";

export function DespesaDiariaCard({
  competencia,
  gastosDiarios,
  onChange,
}: {
  competencia: string;
  gastosDiarios: GastoDiario[];
  onChange: (updater: (prev: GastoDiario[]) => GastoDiario[]) => void;
}) {
  const supabase = createClient();
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_GASTO[0].id);
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doMes = useMemo(
    () =>
      gastosDiarios
        .filter((g) => `${g.data.slice(0, 7)}-01` === competencia)
        .sort((a, b) => b.data.localeCompare(a.data)),
    [gastosDiarios, competencia]
  );

  const total = useMemo(() => doMes.reduce((s, g) => s + Number(g.valor), 0), [doMes]);

  async function addGasto(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(valor.replace(",", "."));
    if (!num || num <= 0) return;
    setSaving(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("Sessão não encontrada");
      return;
    }
    const hoje = new Date();
    const data =
      competencia === `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`
        ? hoje.toISOString().slice(0, 10)
        : competencia;

    const { data: row, error } = await supabase
      .from("gastos_diarios")
      .insert({
        user_id: user.id,
        data,
        categoria,
        descricao: descricao.trim() || null,
        valor: num,
      })
      .select()
      .single();
    setSaving(false);
    if (error) return setError(error.message);
    onChange((prev) => [...prev, row as GastoDiario]);
    setValor("");
    setDescricao("");
  }

  async function remover(id: string) {
    onChange((prev) => prev.filter((g) => g.id !== id));
    await supabase.from("gastos_diarios").delete().eq("id", id);
  }

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-ink-800">Gastos do dia a dia</p>
        <span className="text-xs font-extrabold text-coral-500">{formatMoney(total)}</span>
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {CATEGORIAS_GASTO.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoria(c.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
              categoria === c.id ? "bg-coral-500 text-white" : "bg-ink-100 text-ink-500"
            }`}
          >
            <c.icon size={14} strokeWidth={2.25} />
            {c.label}
          </button>
        ))}
      </div>

      <form onSubmit={addGasto} className="mt-2 flex items-center gap-2">
        <input
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="0,00"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-24 rounded-xl border border-ink-100 bg-ink-50 px-3 py-2 text-sm font-bold text-coral-500 outline-none focus:border-coral-400"
        />
        <input
          type="text"
          placeholder="Descrição (opcional)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-ink-100 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-coral-400"
        />
        <button
          type="submit"
          disabled={saving}
          className="shrink-0 rounded-xl bg-ink-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {saving ? "..." : "+ Add"}
        </button>
      </form>
      {error && <p className="mt-1.5 text-xs font-medium text-coral-500">Erro: {error}</p>}

      {doMes.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-ink-100 pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            {monthLabel(competencia)}
          </p>
          {doMes.slice(0, 6).map((g) => {
            const Icon = categoriaIcon(g.categoria);
            return (
              <div key={g.id} className="flex items-center justify-between text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon size={14} strokeWidth={2} className="shrink-0 text-ink-400" />
                  <span className="truncate text-ink-600">
                    {g.descricao || categoriaLabel(g.categoria)}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold text-ink-800">{formatMoney(Number(g.valor))}</span>
                  <button
                    onClick={() => remover(g.id)}
                    className="text-ink-300 hover:text-coral-500"
                    aria-label="Remover gasto"
                  >
                    <X size={14} strokeWidth={2.25} />
                  </button>
                </div>
              </div>
            );
          })}
          {doMes.length > 6 && (
            <p className="text-[11px] text-ink-400">+{doMes.length - 6} outros gastos este mês</p>
          )}
        </div>
      )}
    </Card>
  );
}
