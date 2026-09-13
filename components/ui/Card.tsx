import type { LucideIcon } from "lucide-react";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div className={`rounded-3xl bg-white p-4 shadow-card ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-ink-100 bg-white/60 px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <p className="text-sm font-semibold text-ink-700">{title}</p>
      {hint && <p className="text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
