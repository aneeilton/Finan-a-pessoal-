-- Grana+ | item parcelado: repete o mesmo valor por N meses e depois para
--
-- Diferente de "fixo" (repete pra sempre) e "pontual" (só um mês), um
-- item parcelado tem um número definido de parcelas. Ao salvar o valor
-- num mês, a tela espelha o mesmo valor automaticamente nos próximos
-- (parcelas_total - 1) meses -- sem precisar digitar de novo em cada um.

alter table public.items add column if not exists parcelas_total smallint check (parcelas_total is null or parcelas_total > 1);
