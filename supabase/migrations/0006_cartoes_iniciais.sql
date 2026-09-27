-- Grana+ | cadastro inicial dos cartoes de credito
--
-- Cria um item "despesa" fixo, marcado como cartao, pra cada cartao com
-- seu respectivo limite. Assume app de uso pessoal (uma linha em
-- public.config) -- o user_id vem de la em vez de precisar colar o uuid
-- manualmente.

insert into public.items (user_id, tipo, nome, fixo, cartao, limite)
select c.user_id, 'despesa', v.nome, true, true, v.limite
from public.config c
cross join (
  values
    ('Nubank', 4300.00),
    ('Bradesco', 20500.00),
    ('BV', 4200.00),
    ('Caixa', 2900.00),
    ('Next', 5000.00),
    ('Digio', 3000.00),
    ('Mercado Pago', 1500.00)
) as v(nome, limite);
