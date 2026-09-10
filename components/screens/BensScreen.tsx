"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TopHeader } from "@/components/TopHeader";
import { Card, EmptyState } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import type { Bem } from "@/lib/types";

export function BensScreen({ initialBens }: { initialBens: Bem[] }) {
  const supabase = createClient();
  const [bens, setBens] = useState(initialBens);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [saving, setSaving] = useState(false);

  const total = useMemo(() => bens.reduce((s, b) => s + Number(b.valor), 0), [bens]);

  async function addBem(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("bens")
      .insert({ user_id: user!.id, nome: nome.trim(), valor: Number(valor || 0) })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setBens((prev) => [...prev, data as Bem]);
      setNome("");
      setValor("");
      setOpen(false);
    }
  }

  async function removeBem(id: string) {
    setBens((prev) => prev.filter((b) => b.id !== id));
    await supabase.from("bens").delete().eq("id", id);
  }

  return (
    <div>
      <TopHeader emoji="🏡" title="Patrimônio" subtitle={`Total ${formatMoney(total)}`} />

      <div className="space-y-4 px-4 pt-4">
        {bens.length === 0 ? (
          <EmptyState emoji="🏡" title="Nenhum bem cadastrado" hint="Casa, carro, eletrônicos..." />
        ) : (
          <div className="space-y-2">
            {bens.map((bem) => (
              <Card key={bem.id} className="flex items-center justify-between">
                <p className="font-semibold text-ink-800">{bem.nome}</p>
                <div className="flex items-center gap-3">
                  <p className="font-extrabold text-grape-500">{formatMoney(Number(bem.valor))}</p>
                  <button
                    onClick={() => removeBem(bem.id)}
                    className="text-ink-400 hover:text-coral-500"
                    aria-label="Remover bem"
                  >
                    ✕
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {open ? (
          <form onSubmit={addBem} className="space-y-2 rounded-3xl bg-white p-4 shadow-card">
            <input
              autoFocus
              placeholder="Nome do bem"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Valor estimado"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
            />
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
            + Adicionar bem
          </button>
        )}
      </div>
    </div>
  );
}
