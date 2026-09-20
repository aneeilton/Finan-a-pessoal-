import { currentCompetencia, shiftCompetencia } from "@/lib/format";
import type { GastoDiario, Item, Lancamento } from "@/lib/types";

export type MonthProjection = {
  competencia: string;
  receitaTotal: number;
  despesaTotal: number;
  despesaFixa: number;
  despesaPontual: number;
  receitaPendente: number;
  despesaPendente: number;
  gastosDiarios: number;
  saldoInicial: number;
  saldoFinal: number;
  isCurrent: boolean;
};

type MesBucket = {
  receitaTotal: number;
  despesaFixa: number;
  despesaPontual: number;
  receitaPendente: number;
  despesaPendente: number;
};

/**
 * Projeta o saldo mes a mes a partir do saldo real das contas hoje
 * (saldoBase). O mes atual e a ancora: saldo inicial dele = saldoBase.
 * Meses futuros encadeiam a partir do fechamento do mes anterior (o que
 * ainda vai acontecer). Meses passados sao calculados isoladamente a
 * partir do saldoBase (nao encadeados "pra tras"), ja que nao temos o
 * saldo real historico -- na pratica tendem a ficar perto do saldoBase
 * porque contas passadas ja estao maioria paga/recebida.
 */
export function buildMonthlyProjection({
  saldoBase,
  items,
  lancamentos,
  gastosDiarios,
  monthsBefore,
  monthsAfter,
}: {
  saldoBase: number;
  items: Item[];
  lancamentos: Lancamento[];
  gastosDiarios: GastoDiario[];
  monthsBefore: number;
  monthsAfter: number;
}): MonthProjection[] {
  const itemsById = new Map(items.map((i) => [i.id, i]));
  const current = currentCompetencia();

  const porMes = new Map<string, MesBucket>();
  function ensure(mes: string): MesBucket {
    if (!porMes.has(mes)) {
      porMes.set(mes, {
        receitaTotal: 0,
        despesaFixa: 0,
        despesaPontual: 0,
        receitaPendente: 0,
        despesaPendente: 0,
      });
    }
    return porMes.get(mes)!;
  }

  for (const l of lancamentos) {
    const item = itemsById.get(l.item_id);
    if (!item) continue;
    const bucket = ensure(l.competencia);
    const valor = Number(l.valor);
    if (item.tipo === "receita") {
      bucket.receitaTotal += valor;
      if (!l.pago) bucket.receitaPendente += valor;
    } else {
      if (item.fixo) bucket.despesaFixa += valor;
      else bucket.despesaPontual += valor;
      if (!l.pago) bucket.despesaPendente += valor;
    }
  }

  const gastosPorMes = new Map<string, number>();
  for (const g of gastosDiarios) {
    const mes = `${g.data.slice(0, 7)}-01`;
    gastosPorMes.set(mes, (gastosPorMes.get(mes) ?? 0) + Number(g.valor));
  }

  function dadosDoMes(competencia: string) {
    const base = porMes.get(competencia) ?? {
      receitaTotal: 0,
      despesaFixa: 0,
      despesaPontual: 0,
      receitaPendente: 0,
      despesaPendente: 0,
    };
    const gastos = gastosPorMes.get(competencia) ?? 0;
    return {
      receitaTotal: base.receitaTotal,
      despesaFixa: base.despesaFixa,
      despesaPontual: base.despesaPontual,
      despesaTotal: base.despesaFixa + base.despesaPontual + gastos,
      receitaPendente: base.receitaPendente,
      despesaPendente: base.despesaPendente + gastos,
      gastosDiarios: gastos,
    };
  }

  const porCompetencia = new Map<string, MonthProjection>();

  // meses passados: cada um calculado isoladamente a partir do saldoBase
  for (let i = 1; i <= monthsBefore; i++) {
    const competencia = shiftCompetencia(current, -i);
    const dados = dadosDoMes(competencia);
    const saldoFinal = saldoBase + dados.receitaPendente - dados.despesaPendente;
    porCompetencia.set(competencia, {
      competencia,
      ...dados,
      saldoInicial: saldoBase,
      saldoFinal,
      isCurrent: false,
    });
  }

  // mes atual + meses futuros: encadeados a partir do saldoBase
  let saldo = saldoBase;
  for (let i = 0; i <= monthsAfter; i++) {
    const competencia = shiftCompetencia(current, i);
    const dados = dadosDoMes(competencia);
    const saldoInicial = saldo;
    const saldoFinal = saldoInicial + dados.receitaPendente - dados.despesaPendente;
    porCompetencia.set(competencia, {
      competencia,
      ...dados,
      saldoInicial,
      saldoFinal,
      isCurrent: competencia === current,
    });
    saldo = saldoFinal;
  }

  return Array.from(porCompetencia.values()).sort((a, b) => a.competencia.localeCompare(b.competencia));
}
