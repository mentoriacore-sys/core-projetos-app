-- C.O.R.E. Projetos — Timeline automática do projeto
-- Fonte: docs/CORE_PROJETOS_SPEC_V1.md, seção 34.
-- project_history nunca é escrita diretamente pelo frontend: cada evento
-- relevante é registrado por trigger, garantindo que o histórico reflita
-- a realidade independentemente de qual tela originou a mudança.

create or replace function log_project_history(
  p_project_id uuid, p_event_type text, p_description text, p_visibility text default 'both'
) returns void as $$
begin
  insert into project_history (project_id, event_type, description, actor, visibility)
  values (p_project_id, p_event_type, p_description, auth.uid(), p_visibility);
end;
$$ language plpgsql security definer set search_path = public;

-- projects: criado, status alterado, prazo alterado, concluído
create or replace function trg_projects_history()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    perform log_project_history(new.id, 'projeto_criado', 'Projeto criado.');
    return new;
  end if;

  if new.status <> old.status then
    perform log_project_history(new.id, 'status_alterado', format('Status alterado de "%s" para "%s".', old.status, new.status));
    if new.status = 'Concluído' then
      perform log_project_history(new.id, 'projeto_concluido', 'Projeto concluído.');
    end if;
  end if;

  if new.expected_end_date is distinct from old.expected_end_date then
    perform log_project_history(new.id, 'prazo_alterado', format(
      'Previsão de conclusão alterada de %s para %s.',
      coalesce(old.expected_end_date::text, '(sem data)'),
      coalesce(new.expected_end_date::text, '(sem data)')
    ));
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_projects_history_aiu
  after insert or update of status, expected_end_date on projects
  for each row execute function trg_projects_history();

-- project_stages: criada, concluída
create or replace function trg_stages_history()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    perform log_project_history(new.project_id, 'etapa_criada', format('Etapa "%s" criada.', new.name), new.visibility);
    return new;
  end if;

  if new.status <> old.status and new.status = 'Concluída' then
    perform log_project_history(new.project_id, 'etapa_concluida', format('Etapa "%s" concluída.', new.name), new.visibility);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_stages_history_aiu
  after insert or update of status on project_stages
  for each row execute function trg_stages_history();

-- tasks: concluída
create or replace function trg_tasks_history()
returns trigger as $$
begin
  if new.status <> old.status and new.status = 'Concluída' then
    perform log_project_history(new.project_id, 'tarefa_concluida', format('Tarefa "%s" concluída.', new.title), new.visibility);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_tasks_history_au
  after update of status on tasks
  for each row execute function trg_tasks_history();

-- dependencies: aberta, resolvida
create or replace function trg_dependencies_history()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    perform log_project_history(new.project_id, 'dependencia_aberta', format('Dependência aberta: %s', new.description));
    return new;
  end if;

  if new.status <> old.status and new.status = 'Resolvida' then
    perform log_project_history(new.project_id, 'dependencia_resolvida', format('Dependência resolvida: %s', new.description));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_dependencies_history_aiu
  after insert or update of status on dependencies
  for each row execute function trg_dependencies_history();

-- deliverables: enviado
create or replace function trg_deliverables_history()
returns trigger as $$
begin
  if new.status <> old.status and new.status = 'Entregue' then
    perform log_project_history(new.project_id, 'entregavel_enviado', format('Entregável "%s" enviado.', new.name), new.visibility);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_deliverables_history_au
  after update of status on deliverables
  for each row execute function trg_deliverables_history();

-- approvals: aprovação recebida / ajuste solicitado
create or replace function trg_approvals_history()
returns trigger as $$
declare
  v_project_id uuid;
  v_deliverable_name text;
begin
  select project_id, name into v_project_id, v_deliverable_name
    from deliverables where id = new.deliverable_id;

  if new.decision = 'Aprovado' then
    perform log_project_history(v_project_id, 'aprovacao_recebida', format('Entregável "%s" aprovado pelo cliente.', v_deliverable_name));
  else
    perform log_project_history(v_project_id, 'ajuste_solicitado', format('Ajuste solicitado no entregável "%s".', v_deliverable_name));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_approvals_history_ai
  after insert on approvals
  for each row execute function trg_approvals_history();

-- scope_changes: decisão registrada
create or replace function trg_scope_changes_history()
returns trigger as $$
begin
  if TG_OP = 'UPDATE' and new.decision <> old.decision then
    perform log_project_history(new.project_id, 'alteracao_escopo', format('Solicitação de alteração de escopo: %s.', new.decision));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_scope_changes_history_au
  after update of decision on scope_changes
  for each row execute function trg_scope_changes_history();

-- project_reports: publicado (usado a partir da Fase 7)
create or replace function trg_reports_history()
returns trigger as $$
begin
  if new.status <> old.status and new.status = 'Publicado' then
    perform log_project_history(new.project_id, 'relatorio_publicado', 'Relatório de acompanhamento publicado.');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_reports_history_au
  after update of status on project_reports
  for each row execute function trg_reports_history();
