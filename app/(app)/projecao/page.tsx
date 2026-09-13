import { loadFinanceSnapshot } from "@/lib/dashboardData";
import { ProjecaoScreen } from "@/components/screens/ProjecaoScreen";
import { PageError } from "@/components/ui/PageError";

export default async function ProjecaoPage() {
  const result = await loadFinanceSnapshot();
  if (!result.ok) return <PageError error={result.error} />;
  const { data } = result;

  return (
    <ProjecaoScreen
      items={data.items}
      lancamentos={data.lancamentos}
      gastosDiarios={data.gastosDiarios}
      saldoAtual={data.saldoContas + data.totalAplicado}
    />
  );
}
