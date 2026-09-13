"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/projecao", label: "Projeção", icon: "📈" },
  { href: "/semestre", label: "Semestre", icon: "🗓️" },
  { href: "/contas", label: "Contas", icon: "🏦" },
  { href: "/mais", label: "Mais", icon: "✨" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom sticky bottom-0 z-20 border-t border-ink-100 bg-white/95 backdrop-blur">
      <ul className="flex items-stretch justify-between px-1">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className="flex flex-col items-center gap-0.5 px-2 py-2.5 text-[11px] font-semibold"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl text-base transition ${
                    active ? "bg-brand-100 text-brand-700" : "text-ink-400"
                  }`}
                >
                  {tab.icon}
                </span>
                <span className={active ? "text-brand-700" : "text-ink-400"}>
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
