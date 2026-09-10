"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError(traduzErro(error.message));
      router.replace("/");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) return setError(traduzErro(error.message));
      setNotice("Conta criada! Verifique seu e-mail para confirmar o acesso.");
    }
  }

  return (
    <div className="flex min-h-dvh w-full flex-1 flex-col justify-center bg-gradient-to-br from-brand-500 via-brand-600 to-grape-500 px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-sm animate-pop-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-3xl backdrop-blur">
            💸
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Grana+</h1>
          <p className="mt-1 text-sm text-white/80">
            Suas finanças, do seu jeito. Simples e sem enrolação.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-3xl bg-white p-6 text-ink-900 shadow-card"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-500">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-500">
              Senha
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

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
            className="mt-2 w-full rounded-2xl bg-brand-600 py-3 text-sm font-bold text-white shadow-pop transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setNotice(null);
            }}
            className="w-full pt-1 text-center text-xs font-semibold text-ink-500"
          >
            {mode === "login"
              ? "Não tem conta? Criar agora"
              : "Já tem conta? Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function traduzErro(message: string): string {
  if (message.includes("Invalid login credentials")) return "E-mail ou senha inválidos.";
  if (message.includes("User already registered")) return "Este e-mail já está cadastrado.";
  if (message.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  return message;
}
