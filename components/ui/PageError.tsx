export function PageError({ error }: { error: unknown }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-ink-50 p-6 text-center">
      <span className="text-3xl">😵</span>
      <p className="text-sm font-bold text-ink-800">Erro ao carregar essa tela</p>
      <pre className="max-w-sm overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-white p-3 text-left text-xs text-coral-500 shadow-card">
        {error instanceof Error ? `${error.name}: ${error.message}` : String(error)}
      </pre>
    </div>
  );
}
