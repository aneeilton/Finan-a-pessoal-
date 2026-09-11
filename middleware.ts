import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Sem tela de login por enquanto: se não houver sessão, cria uma sessão
// anônima automaticamente. Os dados continuam isolados por usuário (RLS),
// só que o "usuário" é criado nos bastidores em vez de pedir cadastro.
// Exige "Allow anonymous sign-ins" habilitado em Authentication > Sign In /
// Providers no painel do Supabase.
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error("Falha ao criar sessão anônima:", error.message);
      }
    }
  } catch (err) {
    // Nunca deixa o middleware derrubar o site inteiro por causa de auth.
    console.error("Erro no middleware de auth:", err);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
