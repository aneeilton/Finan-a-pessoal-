"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TopHeader } from "@/components/TopHeader";
import { Card, EmptyState } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import type { Divida, DividaTipo } from "@/lib/types";

export function DividasScreen({ initialDividas }: { initialDividas: Divida[] }) {
  const supabase = createClient();
  const [dividas, setDividas] = useState(initialDividas);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<DividaTipo>("curto");
  const [saving, setSaving] = useState(false);

  const totalCurto = useMemo(
    () => dividas.filter((d) => d.tipo === "curto").reduce((s, d) => s + Number(d.valor), 0),
    [dividas]
  );
  const totalLongo = useMemo(
    () => dividas.filter((d) => d.tipo === "longo").reduce((s, d) => s + Number(d.valor), 0),
    [dividas]
  );

  async function addDivida(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("dividas")
      .insert({ user_id: user!.id, nome: nome.trim(), valor: Number(valor || 0), tipo })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setDividas((prev) => [...prev, data as Divida]);
      setNome("");
      setValor("");
      setTipo("curto");
      setOpen(false);
    }
  }

  async function removeDivida(id: string) {
    setDividas((prev) => prev.filter((d) => d.id !== id));
    await supabase.from("dividas").delete().eq("id", id);
  }

  return (
    <div>
      <TopHeader
        emoji="🧾"
        title="Dívidas"
        subtitle={`Total ${formatMoney(totalCurto + totalLongo)}`}
      />

      <div className="space-y-4 px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-coral-500/10 text-coral-500">
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
              Curto prazo
            </p>
            <p className="text-lg font-extrabold">{formatMoney(totalCurto)}</p>
          </Card>
          <Card className="bg-sun-500/10 text-sun-500">
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
              Longo prazo
            </p>
            <p className="text-lg font-extrabold">{formatMoney(totalLongo)}</p>
          </Card>
        </div>

        {dividas.length === 0 ? (
          <EmptyState emoji="🎉" title="Nenhuma dívida cadastrada" hint="Ótimo sinal!" />
        ) : (
          <div className="space-y-2">
            {dividas.map((divida) => (
              <Card key={divida.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink-800">{divida.nome}</p>
                  <span
                    className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      divida.tipo === "curto"
                        ? "bg-coral-500/10 text-coral-500"
                        : "bg-sun-500/10 text-sun-500"
                    }`}
                  >
                    {divida.tipo === "curto" ? "Curto prazo" : "Longo prazo"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-extrabold text-ink-800">{formatMoney(Number(divida.valor))}</p>
                  <button
                    onClick={() => removeDivida(divida.id)}
                    className="text-ink-400 hover:text-coral-500"
                    aria-label="Remover dívida"
                  >
                    ✕
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {open ? (
          <form onSubmit={addDivida} className="space-y-2 rounded-3xl bg-white p-4 shadow-card">
            <input
              autoFocus
              placeholder="Nome da dívida"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Valor"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
              />
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as DividaTipo)}
                className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
              >
                <option value="curto">Curto prazo</option>
                <option value="longo">Longo prazo</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
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
            className="w-full rounded-2xl border-2 border-dashed border-brand-300 py-3 text-sm font-bold text-brand-600"
          >
            + Adicionar dívida
          </button>
        )}
      </div>
    </div>
  );
}
