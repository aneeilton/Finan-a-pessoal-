-- Grana+ | schema inicial
-- Substitui os arrays "v[7]" e os mapas soltos "pagos"/"recebidos" do backup antigo
-- por tabelas relacionais normais (items + lancamentos), mais faceis de consultar,
-- de auditar e de estender no Supabase/Postgres.

create extension if not exists "pgcrypto";

-- ---------- contas correntes / investimentos ----------
create table if not exists public.contas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  saldo_corrente numeric(14,2) not null default 0,
  saldo_aplicado numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- dividas (curto / longo prazo) ----------
create table if not exists public.dividas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  valor numeric(14,2) not null default 0,
  tipo text not null check (tipo in ('curto', 'longo')),
  created_at timestamptz not null default now()
);

-- ---------- bens / patrimonio ----------
create table if not exists public.bens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  valor numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- itens recorrentes: receitas, cartoes, contas fixas ----------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('receita', 'cartao', 'fixa')),
  nome text not null,
  dia_vencimento smallint check (dia_vencimento between 1 and 31),
  expectativa boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- lancamentos mensais de cada item (substitui o array v[]) ----------
create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  competencia date not null, -- sempre dia 1 do mes, ex: 2026-09-01
  valor numeric(14,2) not null default 0,
  pago boolean not null default false,
  created_at timestamptz not null default now(),
  unique (item_id, competencia)
);

create index if not exists lancamentos_item_idx on public.lancamentos (item_id);
create index if not exists lancamentos_competencia_idx on public.lancamentos (user_id, competencia);

-- ---------- configuracoes por usuario (ex: orcamento de gastos variaveis) ----------
create table if not exists public.config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  variaveis numeric(14,2) not null default 0
);

-- ================= RLS =================
alter table public.contas enable row level security;
alter table public.dividas enable row level security;
alter table public.bens enable row level security;
alter table public.items enable row level security;
alter table public.lancamentos enable row level security;
alter table public.config enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['contas', 'dividas', 'bens', 'items', 'lancamentos', 'config']
  loop
    execute format(
      'create policy "select_own_%1$s" on public.%1$s for select using (auth.uid() = user_id);',
      t
    );
    execute format(
      'create policy "insert_own_%1$s" on public.%1$s for insert with check (auth.uid() = user_id);',
      t
    );
    execute format(
      'create policy "update_own_%1$s" on public.%1$s for update using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
    execute format(
      'create policy "delete_own_%1$s" on public.%1$s for delete using (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

-- garante uma linha de config assim que o usuario se cadastra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.config (user_id, variaveis) values (new.id, 0)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
