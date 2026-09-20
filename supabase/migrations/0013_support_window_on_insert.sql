-- Corrige 0012: o trigger só disparava em UPDATE OF execution_completed_at,
-- então um projeto criado já com execution_completed_at preenchido nunca
-- tinha support_started_at/support_ends_at calculados no INSERT.

create or replace function trg_projects_support_window()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if new.execution_completed_at is not null then
      new.support_started_at := new.execution_completed_at;
      if new.support_ends_at is null then
        new.support_ends_at := new.execution_completed_at + 30;
      end if;
    end if;
    return new;
  end if;

  if new.execution_completed_at is distinct from old.execution_completed_at and new.execution_completed_at is not null then
    new.support_started_at := new.execution_completed_at;
    if new.support_ends_at is not distinct from old.support_ends_at then
      new.support_ends_at := new.execution_completed_at + 30;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_support_window_bu on projects;

create trigger trg_projects_support_window_biu
  before insert or update of execution_completed_at on projects
  for each row execute function trg_projects_support_window();
