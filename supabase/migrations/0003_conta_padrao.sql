-- Grana+ | conta padrao para baixa automatica de saldo
-- Ao marcar uma receita como recebida ou uma despesa (cartao/fixa) como paga,
-- o valor passa a somar/subtrair do saldo_corrente desta conta.

alter table public.config
  add column if not exists conta_padrao_id uuid references public.contas(id) on delete set null;
