-- Gastos do dia a dia (despesas variaveis lancadas manualmente, com categoria)
-- Alimenta a projecao mensal junto com cartoes e contas fixas.

create table if not exists public.gastos_diarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  categoria text not null,
  descricao text,
  valor numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists gastos_diarios_user_data_idx on public.gastos_diarios (user_id, data);

alter table public.gastos_diarios enable row level security;

create policy "select_own_gastos_diarios" on public.gastos_diarios for select using (auth.uid() = user_id);
create policy "insert_own_gastos_diarios" on public.gastos_diarios for insert with check (auth.uid() = user_id);
create policy "update_own_gastos_diarios" on public.gastos_diarios for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_gastos_diarios" on public.gastos_diarios for delete using (auth.uid() = user_id);
