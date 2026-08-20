-- C.O.R.E. Projetos — Cálculo automático de progresso
-- Fonte: docs/CORE_PROJETOS_SPEC_V1.md, seção 21.
-- Progresso da etapa = tarefas concluídas / total de tarefas válidas (exclui canceladas).
-- Progresso do projeto = média do progresso das etapas ativas (exclui canceladas).
-- Nunca digitado manualmente — recalculado por trigger sempre que tasks/stages mudam.

create or replace function recalc_stage_progress(p_stage_id uuid)
returns void as $$
declare
  v_total int;
  v_done int;
  v_progress numeric(5,2);
  v_project_id uuid;
begin
  select count(*) filter (where status <> 'Cancelada'),
         count(*) filter (where status = 'Concluída')
    into v_total, v_done
    from tasks where stage_id = p_stage_id;

  v_progress := case when v_total = 0 then 0 else round(v_done::numeric / v_total * 100, 2) end;

  update project_stages set progress = v_progress where id = p_stage_id
  returning project_id into v_project_id;

  if v_project_id is not null then
    perform recalc_project_progress(v_project_id);
  end if;
end;
$$ language plpgsql;

create or replace function recalc_project_progress(p_project_id uuid)
returns void as $$
declare
  v_avg numeric(5,2);
begin
  select coalesce(round(avg(progress), 2), 0)
    into v_avg
    from project_stages
    where project_id = p_project_id and status <> 'Cancelada';

  update projects set progress = v_avg where id = p_project_id;
end;
$$ language plpgsql;

create or replace function trg_tasks_progress()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform recalc_stage_progress(old.stage_id);
    return old;
  end if;

  perform recalc_stage_progress(new.stage_id);
  if TG_OP = 'UPDATE' and old.stage_id <> new.stage_id then
    perform recalc_stage_progress(old.stage_id);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_tasks_progress_aiud
  after insert or update of status, stage_id or delete on tasks
  for each row execute function trg_tasks_progress();

create or replace function trg_stages_progress()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform recalc_project_progress(old.project_id);
    return old;
  end if;

  perform recalc_project_progress(new.project_id);
  if TG_OP = 'UPDATE' and old.project_id <> new.project_id then
    perform recalc_project_progress(old.project_id);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_stages_progress_aiud
  after insert or update of status, project_id or delete on project_stages
  for each row execute function trg_stages_progress();
