const TONES: Record<string, string> = {
  brand: "bg-brand-50 text-brand-700",
  coral: "bg-coral-500/10 text-coral-500",
  sun: "bg-sun-500/10 text-sun-500",
  grape: "bg-grape-500/10 text-grape-500",
  sky: "bg-sky-500/10 text-sky-500",
};

export function StatCard({
  emoji,
  label,
  value,
  tone = "brand",
  compact = false,
}: {
  emoji: string;
  label: string;
  value: string;
  tone?: keyof typeof TONES;
  compact?: boolean;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 rounded-2xl p-3 ${TONES[tone]}`}>
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 text-base leading-none">{emoji}</span>
        <span className="truncate text-[10px] font-semibold uppercase tracking-wide opacity-80">
          {label}
        </span>
      </div>
      <span
        className={`whitespace-nowrap font-extrabold leading-tight ${compact ? "text-sm" : "text-base"}`}
      >
        {value}
      </span>
    </div>
  );
}
