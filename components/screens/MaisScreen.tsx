"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { TopHeader } from "@/components/TopHeader";
import { Card } from "@/components/ui/Card";
import { AccountSyncCard } from "@/components/screens/AccountSyncCard";

export function MaisScreen({
  isAnonymous,
  email,
  userId,
}: {
  isAnonymous: boolean;
  email: string | null;
  userId: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copiarId() {
    if (!userId) return;
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard indisponível (ex: http sem TLS) -- o texto já fica selecionável na tela
    }
  }

  return (
    <div>
      <TopHeader icon={Sparkles} title="Mais" subtitle="Configurações e categorias" />

      <div className="space-y-4 px-4 pt-1">
        <AccountSyncCard isAnonymous={isAnonymous} email={email} />

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            ID desta sessão
          </p>
          <p className="mt-1 break-all font-mono text-xs text-ink-600">{userId ?? "—"}</p>
          <p className="mt-1 text-[11px] text-ink-400">
            Compare com a coluna "user_id" no Supabase se os dados não estiverem aparecendo — se
            for diferente, os dados foram importados para outra conta.
          </p>
          {userId && (
            <button
              onClick={copiarId}
              className="mt-2 rounded-xl bg-ink-100 px-3 py-1.5 text-xs font-bold text-ink-700"
            >
              {copied ? "Copiado!" : "Copiar ID"}
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
