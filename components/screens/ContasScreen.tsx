"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TopHeader } from "@/components/TopHeader";
import { Card, EmptyState } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import type { Conta } from "@/lib/types";

export function ContasScreen({ initialContas }: { initialContas: Conta[] }) {
  const supabase = createClient();
  const [contas, setContas] = useState(initialContas);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [corrente, setCorrente] = useState("");
  const [aplicado, setAplicado] = useState("");
  const [saving, setSaving] = useState(false);

  const totalCorrente = useMemo(
    () => contas.reduce((sum, c) => sum + Number(c.saldo_corrente), 0),
    [contas]
  );
  const totalAplicado = useMemo(
    () => contas.reduce((sum, c) => sum + Number(c.saldo_aplicado), 0),
    [contas]
  );

  async function addConta(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("contas")
      .insert({
        user_id: user!.id,
        nome: nome.trim(),
        saldo_corrente: Number(corrente || 0),
        saldo_aplicado: Number(aplicado || 0),
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setContas((prev) => [...prev, data as Conta]);
      setNome("");
      setCorrente("");
      setAplicado("");
      setOpen(false);
    }
  }

  async function removeConta(id: string) {
    setContas((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("contas").delete().eq("id", id);
  }

  return (
    <div>
      <TopHeader
        emoji="🏦"
        title="Contas"
        subtitle={`Saldo total ${formatMoney(totalCorrente + totalAplicado)}`}
      />

      <div className="space-y-4 px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-sky-500/10 text-sky-500">
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
              Em conta
            </p>
            <p className="text-lg font-extrabold">{formatMoney(totalCorrente)}</p>
          </Card>
          <Card className="bg-grape-500/10 text-grape-500">
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
              Aplicado
            </p>
            <p className="text-lg font-extrabold">{formatMoney(totalAplicado)}</p>
          </Card>
        </div>

        {contas.length === 0 ? (
          <EmptyState emoji="🏦" title="Nenhuma conta ainda" hint="Adicione seu primeiro banco ou carteira" />
        ) : (
          <div className="space-y-2">
            {contas.map((conta) => (
              <Card key={conta.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink-800">{conta.nome}</p>
                  <p className="text-xs text-ink-400">
                    Aplicado: {formatMoney(Number(conta.saldo_aplicado))}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-extrabold text-brand-700">
                    {formatMoney(Number(conta.saldo_corrente))}
                  </p>
                  <button
                    onClick={() => removeConta(conta.id)}
                    className="text-ink-400 hover:text-coral-500"
                    aria-label="Remover conta"
                  >
                    ✕
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {open ? (
          <form onSubmit={addConta} className="space-y-2 rounded-3xl bg-white p-4 shadow-card">
            <input
              autoFocus
              placeholder="Nome do banco"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Saldo em conta"
                value={corrente}
                onChange={(e) => setCorrente(e.target.value)}
                className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Aplicado"
                value={aplicado}
                onChange={(e) => setAplicado(e.target.value)}
                className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
              />
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
            + Adicionar conta
          </button>
        )}
      </div>
    </div>
  );
}
