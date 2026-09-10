"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { TopHeader } from "@/components/TopHeader";
import { Card, EmptyState } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatMoney } from "@/lib/format";

type Vencimento = {
  id: string;
  nome: string;
  tipo: "cartao" | "fixa";
  dia: number;
  valor: number;
  pago: boolean;
};

export function DashboardScreen({
  patrimonioLiquido,
  saldoContas,
  totalAplicado,
  totalDividas,
  totalBens,
  receitaMes,
  despesaMes,
  proximosVencimentos,
}: {
  patrimonioLiquido: number;
  saldoContas: number;
  totalAplicado: number;
  totalDividas: number;
  totalBens: number;
  receitaMes: number;
  despesaMes: number;
  proximosVencimentos: Vencimento[];
}) {
  const chartData = [
    { name: "Receitas", valor: receitaMes, fill: "#14b8a6" },
    { name: "Despesas", valor: despesaMes, fill: "#f43f5e" },
  ];
  const saldoMes = receitaMes - despesaMes;

  return (
    <div>
      <TopHeader
        emoji="👋"
        title="Olá!"
        subtitle="Aqui está o resumo das suas finanças"
      />

      <div className="space-y-4 px-4 pt-4">
        <Card className="bg-gradient-to-br from-brand-500 to-grape-500 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
            Patrimônio líquido
          </p>
          <p className="mt-1 text-3xl font-extrabold">{formatMoney(patrimonioLiquido)}</p>
          <p className="mt-1 text-xs text-white/80">
            Contas + investimentos + bens − dívidas
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <StatCard emoji="🏦" label="Em contas" value={formatMoney(saldoContas)} tone="sky" />
          <StatCard emoji="📊" label="Investido" value={formatMoney(totalAplicado)} tone="grape" />
          <StatCard emoji="🧾" label="Dívidas" value={formatMoney(totalDividas)} tone="coral" />
          <StatCard emoji="🏡" label="Patrimônio" value={formatMoney(totalBens)} tone="sun" />
        </div>

        <Card>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-ink-800">Este mês</p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                saldoMes >= 0 ? "bg-brand-100 text-brand-700" : "bg-coral-500/10 text-coral-500"
              }`}
            >
              {saldoMes >= 0 ? "+" : ""}
              {formatMoney(saldoMes)}
            </span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={44}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  formatter={(value: number) => formatMoney(value)}
                />
                <Bar dataKey="valor" radius={[10, 10, 10, 10]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div>
          <p className="mb-2 px-1 text-sm font-bold text-ink-800">Próximos vencimentos</p>
          {proximosVencimentos.length === 0 ? (
            <EmptyState emoji="🎉" title="Nada vencendo em breve" />
          ) : (
            <div className="space-y-2">
              {proximosVencimentos.map((v) => (
                <Card key={v.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-ink-50 text-sm">
                      {v.tipo === "cartao" ? "💳" : "🧺"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-800">{v.nome}</p>
                      <p className="text-xs text-ink-400">Vence dia {v.dia}</p>
                    </div>
                  </div>
                  <p className="font-extrabold text-ink-800">{formatMoney(v.valor)}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
