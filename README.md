# Grana+ — Finanças pessoais

App de controle financeiro pessoal (contas, cartões, dívidas, patrimônio,
receitas e contas fixas) com visual de aplicativo, feito em **Next.js** e
**Supabase**, pronto para hospedar na **Vercel**.

Veja `ANALYSIS.md` para a análise do app anterior e as decisões de design.

## 1. Criar o projeto no Supabase

1. Crie um projeto em https://supabase.com.
2. Em **SQL Editor**, rode o conteúdo de `supabase/migrations/0001_init.sql`.
   Isso cria as tabelas (`contas`, `dividas`, `bens`, `items`, `lancamentos`,
   `config`), ativa Row Level Security e garante que cada usuário só acesse os
   próprios dados.
3. Em **Authentication → Providers**, deixe **Email** habilitado (padrão). Se
   quiser liberar login sem confirmação de e-mail durante os testes, desative
   "Confirm email" em **Authentication → Settings**.
4. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (só usada localmente pelo
     script de importação, nunca no navegador/Vercel público)

## 2. Rodar localmente

```bash
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev
```

Abra http://localhost:3000, crie sua conta na tela de login (mesmo e-mail que
você vai usar para importar o backup) e navegue pelo app.

## 3. Importar o backup antigo (opcional)

Depois de criar sua conta pelo app (passo acima), preencha também no
`.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=...
IMPORT_USER_EMAIL=seu-email@exemplo.com
```

Então rode:

```bash
npm run import-backup -- /caminho/para/financas_backup_20260910.json
```

Isso importa contas, dívidas, bens, receitas, cartões e contas fixas para o seu
usuário no Supabase, recriando o histórico mensal a partir dos arrays antigos
(`v[]`) e dos mapas de pago/recebido. Por padrão o índice `0` do array vira o
mês corrente; para ancorar em outro mês, passe `YYYY-MM` como segundo
argumento, ex.: `npm run import-backup -- backup.json 2026-04`.

> O arquivo de backup não fica versionado no repositório (contém saldos e
> dívidas reais) — mantenha-o local ou em um local seguro.

## 4. Deploy

- **Vercel:** importe este repositório em https://vercel.com/new, framework
  "Next.js" é detectado automaticamente. Adicione as variáveis de ambiente
  `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no projeto da
  Vercel (Settings → Environment Variables) e faça o deploy.
- **Supabase:** nenhuma configuração extra é necessária além da migration do
  passo 1 — o app fala diretamente com o Supabase pelo client/anon key.

## Estrutura

```
app/(app)/            telas autenticadas (dashboard, contas, cartões, ...)
app/login/            tela de login/cadastro
components/screens/   componentes de cada tela
lib/supabase/         clients Supabase (browser e server)
supabase/migrations/  schema SQL
scripts/import-backup.ts  importador do backup antigo
```
