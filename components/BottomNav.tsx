"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, CalendarRange, Landmark, Sparkles } from "lucide-react";

const TABS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/projecao", label: "Projeção", icon: LineChart },
  { href: "/semestre", label: "Semestre", icon: CalendarRange },
  { href: "/contas", label: "Contas", icon: Landmark },
  { href: "/mais", label: "Mais", icon: Sparkles },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom sticky bottom-0 z-20 border-t border-ink-100 bg-white/95 backdrop-blur">
      <ul className="flex items-stretch justify-between px-1">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className="flex flex-col items-center gap-0.5 px-2 py-2.5 text-[11px] font-semibold"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl transition ${
                    active ? "bg-brand-100 text-brand-700" : "text-ink-400"
                  }`}
                >
                  <Icon size={19} strokeWidth={active ? 2.25 : 1.9} />
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
