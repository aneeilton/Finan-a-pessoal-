"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TopHeader } from "@/components/TopHeader";
import { Card } from "@/components/ui/Card";
import { AccountSyncCard } from "@/components/screens/AccountSyncCard";

const LINKS = [
  { href: "/dividas", label: "Dívidas", emoji: "🧾", hint: "Curto e longo prazo" },
  { href: "/bens", label: "Patrimônio", emoji: "🏡", hint: "Bens e propriedades" },
  { href: "/fixas", label: "Contas fixas", emoji: "🧺", hint: "Aluguel, escola, internet..." },
];

export function MaisScreen({
  initialVariaveis,
  isAnonymous,
  email,
}: {
  initialVariaveis: number;
  isAnonymous: boolean;
  email: string | null;
}) {
  const supabase = createClient();
  const [variaveis, setVariaveis] = useState(String(initialVariaveis || ""));
  const [savingVar, setSavingVar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [varError, setVarError] = useState<string | null>(null);

  async function saveVariaveis() {
    setSavingVar(true);
    setSaved(false);
    setVarError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavingVar(false);
      setVarError("Sessão não encontrada");
      return;
    }
    const { error } = await supabase
      .from("config")
      .upsert({ user_id: user.id, variaveis: Number(variaveis || 0) }, { onConflict: "user_id" });
    setSavingVar(false);
    if (error) {
      setVarError(error.message);
      return;
    }
    setSaved(true);
  }

  return (
    <div>
      <TopHeader emoji="✨" title="Mais" subtitle="Configurações e categorias" />

      <div className="space-y-4 px-4 pt-4">
        <AccountSyncCard isAnonymous={isAnonymous} email={email} />

        <div className="grid grid-cols-1 gap-2">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-lg">
                    {link.emoji}
                  </span>
                  <div>
                    <p className="font-semibold text-ink-800">{link.label}</p>
                    <p className="text-xs text-ink-400">{link.hint}</p>
                  </div>
                </div>
                <span className="text-ink-300">›</span>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <p className="mb-2 text-sm font-semibold text-ink-800">
            Orçamento de gastos variáveis (mercado, lazer...)
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={variaveis}
              onChange={(e) => setVariaveis(e.target.value)}
              className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
            />
            <button
              onClick={saveVariaveis}
              disabled={savingVar}
              className="shrink-0 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              Salvar
            </button>
          </div>
          {saved && <p className="mt-2 text-xs font-semibold text-brand-600">Salvo!</p>}
          {varError && (
            <p className="mt-2 text-xs font-semibold text-coral-500">Erro ao salvar: {varError}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
