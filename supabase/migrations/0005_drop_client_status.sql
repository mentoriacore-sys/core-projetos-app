-- C.O.R.E. Projetos — Remove status do cliente
-- Decisão registrada em docs/DECISIONS.md (2026-08-20):
-- Projeto só é cadastrado quando contratado, então todo cliente com
-- projeto ativo é, por definição, cliente ativo. Não há necessidade de
-- um status independente no cadastro de cliente.
alter table clients drop column if exists status;
