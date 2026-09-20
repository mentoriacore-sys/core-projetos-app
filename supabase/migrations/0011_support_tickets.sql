-- C.O.R.E. Projetos — Fase 8: Central de Chamados
-- Fonte: docs/CORE_PROJETOS_SPEC_V1.md, ADENDO "Módulo de Acompanhamento
-- Pós-Projeto e Central de Chamados" (seções 1-38).
--
-- As tabelas support_tickets / support_ticket_messages /
-- support_ticket_attachments / support_ticket_history já existiam desde a
-- 0001_schema.sql (RLS admin já habilitado na 0002). Esta migration completa
-- o que faltava: configuração de SLA (seção 18: "deverão ficar
-- configuráveis. Não hardcode"), automações de histórico/prazo, e as
-- políticas de RLS para o papel 'client'.

-- ---------------------------------------------------------------------------
-- SLA_CONFIG — seção 18. Configurável pela administradora (Configurações),
-- nunca hardcoded no código da aplicação.
-- ---------------------------------------------------------------------------
create table sla_config (
  priority text primary key check (priority in ('P1', 'P2', 'P3', 'P4')),
  label text not null,
  first_response_hours integer not null check (first_response_hours > 0),
  updated_at timestamptz not null default now()
);

insert into sla_config (priority, label, first_response_hours) values
  ('P1', 'Crítica', 4),
  ('P2', 'Alta', 24),
  ('P3', 'Normal', 48),
  ('P4', 'Baixa', 72);

alter table sla_config enable row level security;
create policy admin_full_access on sla_config for all using (is_admin()) with check (is_admin());

-- Resolução exige resumo antes de marcar como Resolvido (seção 27).
alter table support_tickets
  add constraint support_tickets_resolution_summary_check
  check (status not in ('Resolvido', 'Encerrado') or resolution_summary is not null);

-- ---------------------------------------------------------------------------
-- Histórico do chamado (seção 26) — mesmo padrão de log_project_history.
-- ---------------------------------------------------------------------------
create or replace function log_ticket_history(p_ticket_id uuid, p_event_type text, p_description text)
returns void as $$
begin
  insert into support_ticket_history (ticket_id, event_type, description, actor)
  values (p_ticket_id, p_event_type, p_description, auth.uid());
end;
$$ language plpgsql security definer set search_path = public;

-- BEFORE: só ajusta campos da própria linha (resolved_at, closed_at, due_at).
-- Nunca grava histórico aqui — no INSERT a linha ainda não existe em
-- support_tickets, e uma gravação em support_ticket_history nesse momento
-- violaria a foreign key (ticket_id inexistente ainda).
create or replace function trg_tickets_before()
returns trigger as $$
begin
  if TG_OP = 'UPDATE' then
    if new.status <> old.status then
      if new.status = 'Resolvido' and old.resolved_at is null then
        new.resolved_at := now();
      end if;
      if new.status = 'Encerrado' and old.closed_at is null then
        new.closed_at := now();
      end if;
    end if;

    if new.priority is distinct from old.priority and new.priority is not null then
      new.due_at := new.opened_at + (
        select (first_response_hours || ' hours')::interval from sla_config where priority = new.priority
      );
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_tickets_before_biu
  before insert or update on support_tickets
  for each row execute function trg_tickets_before();

-- AFTER: a linha já existe de verdade — aqui sim pode gravar histórico.
create or replace function trg_tickets_after()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    perform log_ticket_history(new.id, 'chamado_aberto', format('Chamado aberto: %s', new.title));
    return new;
  end if;

  if new.status <> old.status then
    perform log_ticket_history(new.id, 'status_alterado', format('Status alterado de "%s" para "%s".', old.status, new.status));
  end if;

  if new.priority is distinct from old.priority then
    perform log_ticket_history(new.id, 'prioridade_alterada', format(
      'Prioridade alterada de %s para %s.', coalesce(old.priority, '(sem prioridade)'), coalesce(new.priority, '(sem prioridade)')
    ));
  end if;

  if new.assigned_to is distinct from old.assigned_to then
    perform log_ticket_history(new.id, 'responsavel_alterado', 'Responsável pelo chamado alterado.');
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_tickets_after_aiu
  after insert or update on support_tickets
  for each row execute function trg_tickets_after();

create or replace function trg_ticket_messages_history()
returns trigger as $$
begin
  perform log_ticket_history(new.ticket_id, 'mensagem_enviada', 'Nova mensagem no chamado.');
  return new;
end;
$$ language plpgsql;

create trigger trg_ticket_messages_history_ai
  after insert on support_ticket_messages
  for each row execute function trg_ticket_messages_history();

-- Primeira resposta da administradora (author_id = admin) marca first_response_at.
create or replace function trg_ticket_first_response()
returns trigger as $$
begin
  if new.visibility = 'cliente' and is_admin() then
    update support_tickets
      set first_response_at = coalesce(first_response_at, now())
      where id = new.ticket_id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_ticket_first_response_ai
  after insert on support_ticket_messages
  for each row execute function trg_ticket_first_response();

create or replace function trg_ticket_attachments_history()
returns trigger as $$
begin
  perform log_ticket_history(new.ticket_id, 'anexo_enviado', format('Anexo enviado: %s', new.file_name));
  return new;
end;
$$ language plpgsql;

create trigger trg_ticket_attachments_history_ai
  after insert on support_ticket_attachments
  for each row execute function trg_ticket_attachments_history();

-- ---------------------------------------------------------------------------
-- RLS para o papel 'client' — mesmo padrão de isolamento de 0009_client_rls.sql.
-- ---------------------------------------------------------------------------

-- Abrir chamado só é permitido dentro da janela de acompanhamento (seção 3,
-- 32, teste 3): support_ends_at nulo (ainda não definida) ou >= hoje.
create policy client_read_own_tickets on support_tickets
  for select using (client_id in (select my_client_ids()));

create policy client_insert_tickets on support_tickets
  for insert with check (
    client_id in (select my_client_ids())
    and is_my_project(project_id)
    and opened_by = auth.uid()
    and exists (
      select 1 from projects p
      where p.id = project_id
        and (p.support_ends_at is null or p.support_ends_at >= current_date)
    )
  );

create policy client_read_ticket_messages on support_ticket_messages
  for select using (
    visibility = 'cliente'
    and exists (select 1 from support_tickets t where t.id = ticket_id and t.client_id in (select my_client_ids()))
  );

create policy client_insert_ticket_messages on support_ticket_messages
  for insert with check (
    author_id = auth.uid()
    and visibility = 'cliente'
    and exists (select 1 from support_tickets t where t.id = ticket_id and t.client_id in (select my_client_ids()))
  );

create policy client_read_ticket_attachments on support_ticket_attachments
  for select using (
    exists (select 1 from support_tickets t where t.id = ticket_id and t.client_id in (select my_client_ids()))
  );

create policy client_insert_ticket_attachments on support_ticket_attachments
  for insert with check (
    uploaded_by = auth.uid()
    and exists (select 1 from support_tickets t where t.id = ticket_id and t.client_id in (select my_client_ids()))
  );

-- ---------------------------------------------------------------------------
-- Storage: anexos de chamado (seção 8-9, 33). Bucket privado, caminho
-- client_id/project_id/ticket_id/arquivo — nunca nome de cliente.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('support-tickets', 'support-tickets', false)
on conflict (id) do nothing;

create policy client_read_ticket_files on storage.objects
  for select using (
    bucket_id = 'support-tickets'
    and split_part(name, '/', 1) in (select my_client_ids()::text)
  );

create policy client_upload_ticket_files on storage.objects
  for insert with check (
    bucket_id = 'support-tickets'
    and split_part(name, '/', 1) in (select my_client_ids()::text)
  );

create policy admin_read_ticket_files on storage.objects
  for select using (bucket_id = 'support-tickets' and is_admin());

create policy admin_upload_ticket_files on storage.objects
  for insert with check (bucket_id = 'support-tickets' and is_admin());

create policy admin_delete_ticket_files on storage.objects
  for delete using (bucket_id = 'support-tickets' and is_admin());
