"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { TopHeader } from "@/components/TopHeader";
import { Card, EmptyState } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { DespesaDiariaCard } from "@/components/screens/DespesaDiariaCard";
import { MonthSelector } from "@/components/ui/MonthSelector";
import { buildMonthlyProjection } from "@/lib/projection";
import { currentCompetencia, formatMoney } from "@/lib/format";
import type { GastoDiario, Item, Lancamento } from "@/lib/types";

export function DashboardScreen({
  items,
  lancamentos,
  initialGastosDiarios,
  saldoContas,
  totalAplicado,
  totalDividas,
  totalBens,
}: {
  items: Item[];
  lancamentos: Lancamento[];
  initialGastosDiarios: GastoDiario[];
  saldoContas: number;
  totalAplicado: number;
  totalDividas: number;
  totalBens: number;
}) {
  const [competencia, setCompetencia] = useState(currentCompetencia());
  const [gastosDiarios, setGastosDiarios] = useState(initialGastosDiarios);

  const saldoAtual = saldoContas + totalAplicado;
  const patrimonioLiquido = saldoAtual + totalBens - totalDividas;

  const series = useMemo(
    () =>
      buildMonthlyProjection({
        saldoBase: saldoAtual,
        items,
        lancamentos,
        gastosDiarios,
        monthsBefore: 12,
        monthsAfter: 24,
      }),
    [saldoAtual, items, lancamentos, gastosDiarios]
  );

  const mes = series.find((s) => s.competencia === competencia) ?? series[0];

  const proximosVencimentos = useMemo(
    () =>
      items
        .filter((i) => (i.tipo === "cartao" || i.tipo === "fixa") && i.dia_vencimento)
        .map((i) => {
          const lanc = lancamentos.find((l) => l.item_id === i.id && l.competencia === competencia);
          return {
            id: i.id,
            nome: i.nome,
            tipo: i.tipo as "cartao" | "fixa",
            dia: i.dia_vencimento as number,
            valor: Number(lanc?.valor ?? 0),
            pago: lanc?.pago ?? false,
          };
        })
        .filter((v) => !v.pago && v.valor > 0)
        .sort((a, b) => a.dia - b.dia),
    [items, lancamentos, competencia]
  );

  const chartData = [
    { name: "Receitas", valor: mes.receitaTotal, fill: "#14b8a6" },
    { name: "Despesas", valor: mes.despesaTotal, fill: "#f43f5e" },
  ];
  const saldoMes = mes.receitaTotal - mes.despesaTotal;

  const proximoSemestre = useMemo(() => {
    const idxAtual = series.findIndex((s) => s.isCurrent);
    return idxAtual >= 0 ? series.slice(idxAtual, idxAtual + 6) : series.slice(0, 6);
  }, [series]);

  const resumoSemestre = useMemo(() => {
    const cartoes = proximoSemestre.reduce((s, m) => s + m.despesaCartao, 0);
    const fixas = proximoSemestre.reduce((s, m) => s + m.despesaFixa, 0);
    const receitas = proximoSemestre.reduce((s, m) => s + m.receitaTotal, 0);
    const comprometimento = receitas > 0 ? ((cartoes + fixas) / receitas) * 100 : 0;
    return { cartoes, fixas, receitas, comprometimento };
  }, [proximoSemestre]);

  const comprometimentoTone =
    resumoSemestre.comprometimento >= 80
      ? { bg: "bg-coral-500/10", text: "text-coral-500" }
      : resumoSemestre.comprometimento >= 50
        ? { bg: "bg-sun-500/10", text: "text-sun-500" }
        : { bg: "bg-brand-100", text: "text-brand-700" };

  return (
    <div>
      <TopHeader emoji="👋" title="Olá!" subtitle="Aqui está o resumo das suas finanças" />

      <div className="space-y-4 px-4 pt-4">
        <MonthSelector competencia={competencia} onChange={setCompetencia} />

        <Card className="bg-gradient-to-br from-brand-500 to-grape-500 text-white">
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
                {mes.isCurrent ? "Saldo atual" : "Saldo inicial do mês"}
              </p>
              <p className="mt-1 whitespace-nowrap text-lg font-extrabold leading-tight">
                {formatMoney(mes.saldoInicial)}
              </p>
            </div>
            <div className="min-w-0 border-l border-white/20 pl-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
                Previsão fim do mês
              </p>
              <p className="mt-1 whitespace-nowrap text-lg font-extrabold leading-tight">
                {formatMoney(mes.saldoFinal)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-white/80">
            {mes.isCurrent
              ? "Saldo atual + receitas a receber − contas e cartões a pagar"
              : "Saldo inicial do mês + receitas a receber − contas e cartões a pagar"}
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <StatCard emoji="📊" label="Investido" value={formatMoney(totalAplicado)} tone="grape" />
          <StatCard emoji="🧾" label="Dívidas" value={formatMoney(totalDividas)} tone="coral" />
          <StatCard emoji="🏡" label="Bens" value={formatMoney(totalBens)} tone="sun" />
          <StatCard emoji="💎" label="Patrimônio líquido" value={formatMoney(patrimonioLiquido)} tone="sky" />
        </div>

        <DespesaDiariaCard
          competencia={competencia}
          gastosDiarios={gastosDiarios}
          onChange={setGastosDiarios}
        />

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
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-sm font-bold text-ink-800">Resumo dos próximos 6 meses</p>
            <Link href="/semestre" className="text-xs font-bold text-brand-600">
              Ver mais →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              emoji="💳"
              label="Cartões"
              value={formatMoney(resumoSemestre.cartoes)}
              tone="coral"
              compact
            />
            <StatCard
              emoji="🧺"
              label="Fixas"
              value={formatMoney(resumoSemestre.fixas)}
              tone="sun"
              compact
            />
            <StatCard
              emoji="📈"
              label="Crédito"
              value={formatMoney(resumoSemestre.receitas)}
              tone="brand"
              compact
            />
          </div>
          <Card className={`mt-2 flex items-center justify-between ${comprometimentoTone.bg}`}>
            <div>
              <p className={`text-xs font-bold ${comprometimentoTone.text}`}>Comprometimento de renda</p>
              <p className="text-[11px] text-ink-500">
                (cartões + contas fixas) ÷ créditos previstos nos próx. 6 meses
              </p>
            </div>
            <p className={`text-xl font-extrabold ${comprometimentoTone.text}`}>
              {resumoSemestre.comprometimento.toFixed(0)}%
            </p>
          </Card>
        </div>

        <div>
          <p className="mb-2 px-1 text-sm font-bold text-ink-800">Vencimentos do mês</p>
          {proximosVencimentos.length === 0 ? (
            <EmptyState emoji="🎉" title="Nada vencendo neste mês" />
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
