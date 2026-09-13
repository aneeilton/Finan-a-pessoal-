"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";

export function AccountSyncCard({
  isAnonymous,
  email,
}: {
  isAnonymous: boolean;
  email: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<"criar" | "entrar">("criar");
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isAnonymous) {
    return (
      <Card>
        <p className="text-sm font-semibold text-ink-800">Conta sincronizada</p>
        <p className="mt-1 text-xs text-ink-500">
          Conectado como <span className="font-semibold text-ink-700">{email}</span>. Seus dados
          acompanham você em qualquer aparelho — é só entrar com esse e-mail e senha.
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.refresh();
          }}
          className="mt-3 w-full rounded-2xl border-2 border-coral-500/30 py-2.5 text-sm font-bold text-coral-500"
        >
          Sair da conta
        </button>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    if (mode === "criar") {
      const { error } = await supabase.auth.updateUser({ email: emailInput, password });
      setLoading(false);
      if (error) return setError(traduzErro(error.message));
      setNotice(
        "Quase lá! Enviamos um e-mail de confirmação — depois de confirmar, você já pode entrar com esse e-mail e senha em qualquer aparelho, sem perder nada do que já cadastrou aqui."
      );
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password });
      setLoading(false);
      if (error) return setError(traduzErro(error.message));
      router.refresh();
    }
  }

  return (
    <Card>
      <p className="text-sm font-semibold text-ink-800">Acessar de outros aparelhos</p>
      <p className="mt-1 text-xs text-ink-500">
        Seus dados aqui estão presos a este navegador. Crie um login para acessar de qualquer
        celular ou computador, sem perder o que já foi cadastrado.
      </p>

      <div className="mt-3 flex gap-1 rounded-2xl bg-ink-50 p-1">
        <button
          onClick={() => {
            setMode("criar");
            setError(null);
            setNotice(null);
          }}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
            mode === "criar" ? "bg-white text-brand-700 shadow-card" : "text-ink-500"
          }`}
        >
          Criar login
        </button>
        <button
          onClick={() => {
            setMode("entrar");
            setError(null);
            setNotice(null);
          }}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
            mode === "entrar" ? "bg-white text-brand-700 shadow-card" : "text-ink-500"
          }`}
        >
          Já tenho conta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <input
          type="email"
          required
          placeholder="seu-email@exemplo.com"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Senha (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
        />

        {error && (
          <p className="rounded-xl bg-coral-500/10 px-3 py-2 text-xs font-medium text-coral-500">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-xl bg-brand-100 px-3 py-2 text-xs font-medium text-brand-700">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-brand-600 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? "Aguarde..." : mode === "criar" ? "Criar login" : "Entrar"}
        </button>
      </form>

      {mode === "entrar" && (
        <p className="mt-2 text-[11px] text-ink-400">
          Atenção: ao entrar em uma conta existente, os dados anônimos deste navegador (se houver)
          deixam de aparecer — você passa a ver os dados da conta em que entrou.
        </p>
      )}
    </Card>
  );
}

function traduzErro(message: string): string {
  if (message.includes("Invalid login credentials")) return "E-mail ou senha inválidos.";
  if (message.includes("already been registered") || message.includes("already registered"))
    return "Este e-mail já está cadastrado. Tente entrar em vez de criar.";
  if (message.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  return message;
}
