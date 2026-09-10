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
}: {
  emoji: string;
  label: string;
  value: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className={`flex flex-col gap-1 rounded-2xl p-3 ${TONES[tone]}`}>
      <span className="text-lg leading-none">{emoji}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
        {label}
      </span>
      <span className="text-base font-extrabold leading-tight">{value}</span>
    </div>
  );
}
