-- Decisao de negocio (docs/DECISIONS.md, 2026-09-20): o botao "Abrir
-- chamado" NAO deve ser bloqueado pela data de fim do acompanhamento
-- (support_ends_at). Motivo da Andreia: algo que surge no fim do periodo
-- pode exigir mais tempo de correcao/implantacao, e bloquear o botao tira
-- do cliente a oportunidade de comunicar exatamente quando mais precisa.
--
-- O controle de acesso real continua existindo e continua efetivo: quando
-- a administradora desativa o acesso do cliente (client_users.access_status
-- <> 'Ativo'), my_client_ids() fica vazia e TODAS as políticas de RLS do
-- cliente — incluindo esta — deixam de retornar qualquer linha. Ou seja,
-- remover o check de support_ends_at aqui não abre brecha nenhuma; só
-- transfere o corte de acesso inteiramente para o mecanismo que já existia
-- e já é a fonte da verdade (seção 4 da spec).

drop policy if exists client_insert_tickets on support_tickets;

create policy client_insert_tickets on support_tickets
  for insert with check (
    client_id in (select my_client_ids())
    and is_my_project(project_id)
    and opened_by = auth.uid()
  );
