import { monthYearLabel, shiftCompetencia } from "@/lib/format";

export function MonthSelector({
  competencia,
  onChange,
}: {
  competencia: string;
  onChange: (competencia: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-card">
      <button
        onClick={() => onChange(shiftCompetencia(competencia, -1))}
        className="h-8 w-8 rounded-xl bg-ink-50 text-ink-500"
        aria-label="Mês anterior"
      >
        ‹
      </button>
      <span className="text-sm font-bold text-ink-800">{monthYearLabel(competencia)}</span>
      <button
        onClick={() => onChange(shiftCompetencia(competencia, 1))}
        className="h-8 w-8 rounded-xl bg-ink-50 text-ink-500"
        aria-label="Próximo mês"
      >
        ›
      </button>
    </div>
  );
}
