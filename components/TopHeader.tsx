import type { LucideIcon } from "lucide-react";

export function TopHeader({
  title,
  subtitle,
  icon: Icon,
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  right?: React.ReactNode;
}) {
  return (
    <header className="px-5 pb-4 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-700 text-white">
              <Icon size={19} strokeWidth={2} />
            </span>
          )}
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-ink-900">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
    </header>
  );
}
