-- Grana+ | limpeza dos lancamentos de setembro/2026
--
-- Voce ja atualizou o saldo das contas manualmente, entao os lancamentos
-- de receitas/despesas de setembro (todos ja pagos/recebidos) nao sao
-- mais necessarios. Os itens fixos continuam cadastrados normalmente --
-- so o historico desse mes especifico e apagado.

delete from public.lancamentos where competencia = '2026-09-01';
