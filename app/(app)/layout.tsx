import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <main className="flex-1 pb-4">{children}</main>
      <BottomNav />
    </div>
  );
}
