"use client";

import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart as LineChartIcon, TrendingDown, TrendingUp } from "lucide-react";
import { TopHeader } from "@/components/TopHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { buildMonthlyProjection } from "@/lib/projection";
import { formatMoney, monthLabel } from "@/lib/format";
import type { GastoDiario, Item, Lancamento } from "@/lib/types";

export function ProjecaoScreen({
  items,
  lancamentos,
  gastosDiarios,
  saldoAtual,
}: {
  items: Item[];
  lancamentos: Lancamento[];
  gastosDiarios: GastoDiario[];
  saldoAtual: number;
}) {
  const series = useMemo(
    () =>
      buildMonthlyProjection({
        saldoBase: saldoAtual,
        items,
        lancamentos,
        gastosDiarios,
        monthsBefore: 3,
        monthsAfter: 12,
      }),
    [saldoAtual, items, lancamentos, gastosDiarios]
  );

  const atual = series.find((s) => s.isCurrent) ?? series[0];
  const chartData = series.map((s) => ({ name: monthLabel(s.competencia), saldo: s.saldoFinal }));

  return (
    <div>
      <TopHeader icon={LineChartIcon} title="Projeção" subtitle="Saldo previsto mês a mês" />

      <div className="space-y-4 px-4 pt-1">
        <Card className="bg-gradient-to-br from-brand-600 to-brand-900 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
            Este mês ({monthLabel(atual.competencia)})
          </p>
          <p className="mt-1 text-3xl font-extrabold [font-variant-numeric:tabular-nums]">
            {formatMoney(atual.saldoFinal)}
          </p>
          <p className="mt-1 text-xs text-white/70">Previsão de fechamento do mês atual</p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={TrendingUp} label="Receitas do mês" value={formatMoney(atual.receitaTotal)} tone="brand" />
          <StatCard icon={TrendingDown} label="Despesas do mês" value={formatMoney(atual.despesaTotal)} tone="coral" />
        </div>

        <Card>
          <p className="mb-2 text-sm font-bold text-ink-800">Tendência de saldo</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: -20 }}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#8B9995" }}
                  interval={Math.ceil(chartData.length / 6)}
                />
                <YAxis hide />
                <Tooltip formatter={(value: number) => formatMoney(value)} />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke="#1F8570"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-2">
          <p className="px-1 text-sm font-bold text-ink-800">Mês a mês</p>
          {series.map((mes) => (
            <Card
              key={mes.competencia}
              className={`flex items-center justify-between ${
                mes.isCurrent ? "ring-2 ring-brand-400" : ""
              }`}
            >
              <div>
                <p className="text-sm font-semibold capitalize text-ink-800">
                  {monthLabel(mes.competencia)}
                  {mes.isCurrent && (
                    <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                      atual
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink-400">
                  +{formatMoney(mes.receitaTotal)} · −{formatMoney(mes.despesaTotal)}
                </p>
              </div>
              <p
                className={`font-extrabold ${mes.saldoFinal >= 0 ? "text-ink-800" : "text-coral-500"}`}
              >
                {formatMoney(mes.saldoFinal)}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
