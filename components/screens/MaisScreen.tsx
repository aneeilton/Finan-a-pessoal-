"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CreditCard,
  FileWarning,
  Gem,
  Repeat,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { TopHeader } from "@/components/TopHeader";
import { Card } from "@/components/ui/Card";
import { AccountSyncCard } from "@/components/screens/AccountSyncCard";

const LINKS: { href: string; label: string; icon: LucideIcon; hint: string }[] = [
  { href: "/cartoes", label: "Cartões", icon: CreditCard, hint: "Faturas mensais" },
  { href: "/receitas", label: "Receitas", icon: TrendingUp, hint: "Fontes de renda" },
  { href: "/fixas", label: "Contas fixas", icon: Repeat, hint: "Aluguel, escola, internet..." },
  { href: "/dividas", label: "Dívidas", icon: FileWarning, hint: "Curto e longo prazo" },
  { href: "/bens", label: "Patrimônio", icon: Gem, hint: "Bens e propriedades" },
];

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

        <div className="grid grid-cols-1 gap-2">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <link.icon size={18} strokeWidth={2} />
                  </span>
                  <div>
                    <p className="font-semibold text-ink-800">{link.label}</p>
                    <p className="text-xs text-ink-400">{link.hint}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-ink-300" />
              </Card>
            </Link>
          ))}
        </div>

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
