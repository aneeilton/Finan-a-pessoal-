"use client";

import { useState } from "react";
import { TrendingUp, Wallet } from "lucide-react";
import { TopHeader } from "@/components/TopHeader";
import { MonthlyItemsScreen } from "@/components/screens/MonthlyItemsScreen";
import type { Conta, Item, Lancamento } from "@/lib/types";

type TipoDados = { items: Item[]; lancamentos: Lancamento[] };

export function FluxoScreen({
  receita,
  despesa,
  contas,
  contaPadraoId,
}: {
  receita: TipoDados;
  despesa: TipoDados;
  contas: Conta[];
  contaPadraoId: string | null;
}) {
  const [aba, setAba] = useState<"receita" | "despesa">("receita");

  return (
    <div>
      <TopHeader
        icon={aba === "receita" ? TrendingUp : Wallet}
        title="Fluxo"
        subtitle={aba === "receita" ? "Suas fontes de renda" : "Suas contas e cartões"}
      />

      <div className="flex gap-1.5 px-4 pb-2">
        <button
          onClick={() => setAba("receita")}
          className={`flex-1 rounded-2xl py-2.5 text-sm font-bold transition ${
            aba === "receita" ? "bg-brand-600 text-white shadow-card" : "bg-ink-100 text-ink-500"
          }`}
        >
          Receitas
        </button>
        <button
          onClick={() => setAba("despesa")}
          className={`flex-1 rounded-2xl py-2.5 text-sm font-bold transition ${
            aba === "despesa" ? "bg-coral-500 text-white shadow-card" : "bg-ink-100 text-ink-500"
          }`}
        >
          Despesas
        </button>
      </div>

      {aba === "receita" ? (
        <MonthlyItemsScreen
          key="receita"
          tipo="receita"
          title="Receitas"
          tone="brand"
          valueDoneLabel="Recebido"
          showDia={false}
          showExpectativa={true}
          initialItems={receita.items}
          initialLancamentos={receita.lancamentos}
          initialContas={contas}
          contaPadraoId={contaPadraoId}
          hideHeader
        />
      ) : (
        <MonthlyItemsScreen
          key="despesa"
          tipo="despesa"
          title="Despesas"
          tone="coral"
          valueDoneLabel="Pago"
          showDia={true}
          showExpectativa={false}
          initialItems={despesa.items}
          initialLancamentos={despesa.lancamentos}
          initialContas={contas}
          contaPadraoId={contaPadraoId}
          hideHeader
        />
      )}
    </div>
  );
}
