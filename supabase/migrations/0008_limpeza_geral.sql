-- Grana+ | limpeza geral pra relançar tudo do zero
--
-- Apaga todos os lancamentos mensais (receitas/despesas/cartoes) e os
-- gastos diarios, e zera saldo de contas, dividas e bens. Os ITENS
-- (Agua, Salario, cartoes com limite etc.) continuam cadastrados -- so
-- ficam sem valor lancado ate voce preencher de novo.

delete from public.lancamentos;
delete from public.gastos_diarios;

update public.contas set saldo_corrente = 0, saldo_aplicado = 0;
update public.dividas set valor = 0;
update public.bens set valor = 0;
