-- C.O.R.E. Projetos — tasks.responsible como categoria (não usuário do sistema)
-- Decisão (docs/DECISIONS.md, 2026-08-20): tarefas precisam indicar QUEM deve agir
-- usando a mesma categoria de projects.current_responsibility (spec seção 18),
-- não um usuário específico — permite responder "de quem é a bola" mesmo quando
-- o responsável é o Cliente ou um Terceiro, que não necessariamente têm login.
alter table tasks drop constraint if exists tasks_responsible_fkey;
alter table tasks alter column responsible type text using responsible::text;
alter table tasks add constraint tasks_responsible_check
  check (responsible in ('C.O.R.E.', 'Cliente', 'Terceiro', 'Equipe', 'Nenhuma'));

-- Mesma correção em project_stages, para quando a UI de etapas expuser o campo.
alter table project_stages drop constraint if exists project_stages_responsible_fkey;
alter table project_stages alter column responsible type text using responsible::text;
alter table project_stages add constraint project_stages_responsible_check
  check (responsible in ('C.O.R.E.', 'Cliente', 'Terceiro', 'Equipe', 'Nenhuma'));
