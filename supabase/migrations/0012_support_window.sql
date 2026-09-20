-- C.O.R.E. Projetos — Fase 8, seção 1 do ADENDO:
-- "A data final do acompanhamento será inicialmente: Data de conclusão + 30
-- dias corridos. A administradora poderá alterar essa data quando houver
-- condição contratual específica."
--
-- Ao definir/alterar execution_completed_at, calcula automaticamente
-- support_started_at e support_ends_at (+30 dias). Se a administradora editar
-- support_ends_at manualmente NA MESMA operação (mesmo UPDATE), o valor dela
-- prevalece — o cálculo automático só entra quando support_ends_at não foi
-- explicitamente alterado junto.

create or replace function trg_projects_support_window()
returns trigger as $$
begin
  if new.execution_completed_at is distinct from old.execution_completed_at and new.execution_completed_at is not null then
    new.support_started_at := new.execution_completed_at;
    if new.support_ends_at is not distinct from old.support_ends_at then
      new.support_ends_at := new.execution_completed_at + 30;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_projects_support_window_bu
  before update of execution_completed_at on projects
  for each row execute function trg_projects_support_window();
