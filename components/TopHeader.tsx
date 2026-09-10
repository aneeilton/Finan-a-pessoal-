export function TopHeader({
  title,
  subtitle,
  emoji,
  right,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 rounded-b-3xl bg-gradient-to-br from-brand-500 to-brand-700 px-5 pb-6 pt-6 text-white shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            {emoji && <span>{emoji}</span>}
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 text-sm text-white/80">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
