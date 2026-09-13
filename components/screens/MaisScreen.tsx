"use client";

import Link from "next/link";
import { TopHeader } from "@/components/TopHeader";
import { Card } from "@/components/ui/Card";
import { AccountSyncCard } from "@/components/screens/AccountSyncCard";

const LINKS = [
  { href: "/cartoes", label: "Cartões", emoji: "💳", hint: "Faturas mensais" },
  { href: "/receitas", label: "Receitas", emoji: "📈", hint: "Fontes de renda" },
  { href: "/fixas", label: "Contas fixas", emoji: "🧺", hint: "Aluguel, escola, internet..." },
  { href: "/dividas", label: "Dívidas", emoji: "🧾", hint: "Curto e longo prazo" },
  { href: "/bens", label: "Patrimônio", emoji: "🏡", hint: "Bens e propriedades" },
];

export function MaisScreen({
  isAnonymous,
  email,
}: {
  isAnonymous: boolean;
  email: string | null;
}) {
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
      </div>
    </div>
  );
}
