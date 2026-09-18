"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  Check,
  CreditCard,
  FileWarning,
  Gem,
  PartyPopper,
  PiggyBank,
  Repeat,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TopHeader } from "@/components/TopHeader";
import { Card, EmptyState } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { DespesaDiariaCard } from "@/components/screens/DespesaDiariaCard";
import { MonthSelector } from "@/components/ui/MonthSelector";
import { buildMonthlyProjection } from "@/lib/projection";
import { currentCompetencia, formatMoney } from "@/lib/format";
import type { Conta, GastoDiario, Item, Lancamento } from "@/lib/types";

export function DashboardScreen({
  items,
  initialLancamentos,
  initialGastosDiarios,
  initialContas,
  contaPadraoId,
  totalAplicado,
  totalDividas,
  totalBens,
}: {
  items: Item[];
  initialLancamentos: Lancamento[];
  initialGastosDiarios: GastoDiario[];
  initialContas: Conta[];
  contaPadraoId: string | null;
  totalAplicado: number;
  totalDividas: number;
  totalBens: number;
}) {
  const supabase = createClient();
  const [competencia, setCompetencia] = useState(currentCompetencia());
  const [gastosDiarios, setGastosDiarios] = useState(initialGastosDiarios);
  const [lancamentos, setLancamentos] = useState(initialLancamentos);
  const [contas, setContas] = useState(initialContas);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleErrors, setToggleErrors] = useState<Record<string, string>>({});

  const saldoContas = useMemo(
    () => contas.reduce((s, c) => s + Number(c.saldo_corrente), 0),
    [contas]
  );
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

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const receitasDoMes = useMemo(
    () =>
      items
        .filter((i) => i.tipo === "receita")
        .map((i) => {
          const lanc = lancamentos.find((l) => l.item_id === i.id && l.competencia === competencia);
          return { id: i.id, nome: i.nome, valor: Number(lanc?.valor ?? 0), pago: lanc?.pago ?? false };
        })
        .filter((v) => v.valor > 0)
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [items, lancamentos, competencia]
  );

  const despesasDoMes = useMemo(
    () =>
      items
        .filter((i) => i.tipo === "cartao" || i.tipo === "fixa")
        .map((i) => {
          const lanc = lancamentos.find((l) => l.item_id === i.id && l.competencia === competencia);
          return {
            id: i.id,
            nome: i.nome,
            tipo: i.tipo as "cartao" | "fixa",
            dia: i.dia_vencimento,
            valor: Number(lanc?.valor ?? 0),
            pago: lanc?.pago ?? false,
          };
        })
        .filter((v) => v.valor > 0)
        .sort((a, b) => (a.dia ?? 99) - (b.dia ?? 99)),
    [items, lancamentos, competencia]
  );

  async function ajustarSaldoConta(delta: number) {
    if (!contaPadraoId || delta === 0) return;
    const conta = contas.find((c) => c.id === contaPadraoId);
    if (!conta) return;
    const novoSaldo = Number(conta.saldo_corrente) + delta;
    const { data, error } = await supabase
      .from("contas")
      .update({ saldo_corrente: novoSaldo })
      .eq("id", contaPadraoId)
      .select()
      .single();
    if (!error && data) {
      setContas((prev) => prev.map((c) => (c.id === contaPadraoId ? (data as Conta) : c)));
    }
  }

  async function togglePago(itemId: string) {
    setTogglingId(itemId);
    setToggleErrors((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    const existing = lancamentos.find((l) => l.item_id === itemId && l.competencia === competencia);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setTogglingId(null);
      setToggleErrors((prev) => ({ ...prev, [itemId]: "Sessão não encontrada" }));
      return;
    }

    const novoPago = !(existing?.pago ?? false);
    const valor = existing?.valor ?? 0;

    const { data, error } = await supabase
      .from("lancamentos")
      .upsert(
        {
          id: existing?.id,
          item_id: itemId,
          user_id: user.id,
          competencia,
          valor,
          pago: novoPago,
        },
        { onConflict: "item_id,competencia" }
      )
      .select()
      .single();

    setTogglingId(null);
    if (error || !data) {
      setToggleErrors((prev) => ({ ...prev, [itemId]: error?.message ?? "Falha ao salvar" }));
      return;
    }
    setLancamentos((prev) => {
      const found = prev.some((l) => l.id === (data as Lancamento).id);
      return found
        ? prev.map((l) => (l.id === (data as Lancamento).id ? (data as Lancamento) : l))
        : [...prev, data as Lancamento];
    });

    const tipo = itemsById.get(itemId)?.tipo;
    if (tipo && valor > 0) {
      const sinal = tipo === "receita" ? 1 : -1;
      await ajustarSaldoConta(novoPago ? sinal * valor : -sinal * valor);
    }
  }

  const chartData = [
    { name: "Receitas", valor: mes.receitaTotal, fill: "#2FA084" },
    { name: "Despesas", valor: mes.despesaTotal, fill: "#E15D4C" },
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
      <TopHeader title="Olá!" subtitle="Aqui está o resumo das suas finanças" />

      <div className="space-y-4 px-4 pt-1">
        <MonthSelector competencia={competencia} onChange={setCompetencia} />

        <Card className="bg-gradient-to-br from-brand-600 to-brand-900 text-white">
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                {mes.isCurrent ? "Saldo atual" : "Saldo inicial do mês"}
              </p>
              <p className="mt-1 whitespace-nowrap text-lg font-extrabold leading-tight [font-variant-numeric:tabular-nums]">
                {formatMoney(mes.saldoInicial)}
              </p>
            </div>
            <div className="min-w-0 border-l border-white/15 pl-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                Previsão fim do mês
              </p>
              <p className="mt-1 whitespace-nowrap text-lg font-extrabold leading-tight [font-variant-numeric:tabular-nums]">
                {formatMoney(mes.saldoFinal)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-white/70">
            {mes.isCurrent
              ? "Saldo atual + receitas a receber − contas e cartões a pagar"
              : "Saldo inicial do mês + receitas a receber − contas e cartões a pagar"}
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={PiggyBank} label="Investido" value={formatMoney(totalAplicado)} tone="grape" />
          <StatCard icon={FileWarning} label="Dívidas" value={formatMoney(totalDividas)} tone="coral" />
          <StatCard icon={Gem} label="Bens" value={formatMoney(totalBens)} tone="sun" />
          <StatCard icon={TrendingUp} label="Patrimônio líquido" value={formatMoney(patrimonioLiquido)} tone="sky" />
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
              className={`rounded-full px-2 py-0.5 text-xs font-extrabold [font-variant-numeric:tabular-nums] ${
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
                  tick={{ fontSize: 12, fill: "#5F706C" }}
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
              icon={CreditCard}
              label="Cartões"
              value={formatMoney(resumoSemestre.cartoes)}
              tone="coral"
              compact
            />
            <StatCard
              icon={Repeat}
              label="Fixas"
              value={formatMoney(resumoSemestre.fixas)}
              tone="sun"
              compact
            />
            <StatCard
              icon={TrendingUp}
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
            <p className={`text-xl font-extrabold [font-variant-numeric:tabular-nums] ${comprometimentoTone.text}`}>
              {resumoSemestre.comprometimento.toFixed(0)}%
            </p>
          </Card>
        </div>

        <div>
          <p className="mb-1 px-1 text-sm font-bold text-ink-800">Lançamentos do mês</p>
          {!contaPadraoId && (
            <p className="mb-2 px-1 text-[11px] text-ink-400">
              Defina uma conta padrão em <Link href="/contas" className="font-bold text-brand-600">Contas</Link> para
              que marcar como pago/recebido atualize o saldo automaticamente.
            </p>
          )}
          {receitasDoMes.length === 0 && despesasDoMes.length === 0 ? (
            <EmptyState icon={PartyPopper} title="Nada lançado neste mês" />
          ) : (
            <div className="space-y-3">
              {receitasDoMes.length > 0 && (
                <div className="space-y-2">
                  <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">
                    A receber
                  </p>
                  {receitasDoMes.map((r) => (
                    <Card key={r.id} className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                          <TrendingUp size={16} strokeWidth={2} />
                        </span>
                        <p className={`truncate text-sm font-semibold ${r.pago ? "text-ink-400" : "text-ink-800"}`}>
                          {r.nome}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <p className="font-extrabold text-ink-800 [font-variant-numeric:tabular-nums]">
                          {formatMoney(r.valor)}
                        </p>
                        <button
                          onClick={() => togglePago(r.id)}
                          disabled={togglingId === r.id}
                          className={`flex items-center gap-1 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
                            r.pago ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-500"
                          }`}
                        >
                          {r.pago && <Check size={12} strokeWidth={2.5} />}
                          Recebido
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {despesasDoMes.length > 0 && (
                <div className="space-y-2">
                  <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">A pagar</p>
                  {despesasDoMes.map((v) => {
                    const VencIcon = v.tipo === "cartao" ? CreditCard : Repeat;
                    return (
                      <Card key={v.id} className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                              v.tipo === "cartao" ? "bg-coral-500/10 text-coral-500" : "bg-sun-500/10 text-sun-500"
                            }`}
                          >
                            <VencIcon size={16} strokeWidth={2} />
                          </span>
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-semibold ${v.pago ? "text-ink-400" : "text-ink-800"}`}>
                              {v.nome}
                            </p>
                            {v.dia && <p className="text-xs text-ink-400">Vence dia {v.dia}</p>}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <p className="font-extrabold text-ink-800 [font-variant-numeric:tabular-nums]">
                            {formatMoney(v.valor)}
                          </p>
                          <button
                            onClick={() => togglePago(v.id)}
                            disabled={togglingId === v.id}
                            className={`flex items-center gap-1 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
                              v.pago ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-500"
                            }`}
                          >
                            {v.pago && <Check size={12} strokeWidth={2.5} />}
                            Pago
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {Object.entries(toggleErrors).map(([id, msg]) => (
                <p key={id} className="px-1 text-xs font-medium text-coral-500">
                  {itemsById.get(id)?.nome ?? "Item"}: {msg}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
