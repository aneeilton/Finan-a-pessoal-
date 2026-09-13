import { loadFinanceSnapshot } from "@/lib/dashboardData";
import { SemestreScreen } from "@/components/screens/SemestreScreen";
import { PageError } from "@/components/ui/PageError";

export default async function SemestrePage() {
  const result = await loadFinanceSnapshot();
  if (!result.ok) return <PageError error={result.error} />;
  const { data } = result;

  return (
    <SemestreScreen
      items={data.items}
      lancamentos={data.lancamentos}
      gastosDiarios={data.gastosDiarios}
      saldoAtual={data.saldoContas + data.totalAplicado}
    />
  );
}
