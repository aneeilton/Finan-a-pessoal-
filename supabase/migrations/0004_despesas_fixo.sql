-- Grana+ | despesas unificadas + marcacao fixa/pontual
--
-- 1) Une "cartao" e "fixa" num unico tipo "despesa" -- na pratica ja eram a
--    mesma coisa (um valor mensal a pagar), so ficavam em telas separadas.
-- 2) Adiciona "fixo": indica se o item se repete todo mes (recorrente) ou se
--    e um lancamento pontual (unico, so daquele mes). Vale tanto para
--    despesas quanto para receitas.
-- 3) Para itens pontuais, "competencia_unica" guarda a qual mes ele pertence
--    -- sem isso, um item pontual aparecia (vazio) em todos os meses, e
--    excluir ele num mes sem valor apagava o lancamento de outro mes que
--    tinha valor (mesmo item, mesma linha da tabela "items").

alter table public.items add column if not exists fixo boolean not null default true;
alter table public.items add column if not exists competencia_unica date;

-- precisa soltar a constraint antiga ANTES do update: ela so aceitava
-- 'receita'/'cartao'/'fixa', entao gravar 'despesa' com ela ainda ativa falha.
alter table public.items drop constraint if exists items_tipo_check;

update public.items set tipo = 'despesa' where tipo in ('cartao', 'fixa');

alter table public.items add constraint items_tipo_check check (tipo in ('receita', 'despesa'));
