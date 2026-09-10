export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl bg-white p-4 shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({
  emoji,
  title,
  hint,
}: {
  emoji: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-3xl border border-dashed border-ink-100 bg-white/60 px-6 py-10 text-center">
      <span className="text-3xl">{emoji}</span>
      <p className="text-sm font-semibold text-ink-700">{title}</p>
      {hint && <p className="text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
