-- Grana+ | cartao de credito como categoria propria dentro de despesas
--
-- Uma despesa marcada como "cartao" ganha limite de credito, pra
-- acompanhar o quanto da fatura do mes ja compromete o limite. Continua
-- sendo uma despesa "fixa" comum pro motor de projecao (voce sempre tem
-- fatura desse cartao -- so o valor muda todo mes).

alter table public.items add column if not exists cartao boolean not null default false;
alter table public.items add column if not exists limite numeric(14,2);
