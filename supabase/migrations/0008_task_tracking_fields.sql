-- C.O.R.E. Projetos — Redesign Fase C
-- Campos adicionais de tarefa (spec do redesign, seções 9 e 14-17):
-- bloqueadora, impacto no cronograma (avaliado pelo admin, nunca automático),
-- autor da última atualização, comentários e anexos por tarefa.

alter table tasks add column if not exists is_blocking boolean not null default false;

alter table tasks add column if not exists schedule_impact_status text
  not null default 'Não avaliado'
  check (schedule_impact_status in ('Não avaliado', 'Sem impacto', 'Impacto confirmado'));

alter table tasks add column if not exists schedule_impact_note text;

alter table tasks add column if not exists updated_by uuid references profiles(id);

-- Autor da última atualização: capturado automaticamente a cada UPDATE.
create or replace function set_updated_by()
returns trigger as $$
begin
  new.updated_by = auth.uid();
  return new;
end;
$$ language plpgsql;

create trigger trg_tasks_updated_by
  before update on tasks
  for each row execute function set_updated_by();

-- ---------------------------------------------------------------------------
-- Comentários por tarefa
-- ---------------------------------------------------------------------------
create table task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  author_id uuid references profiles (id),
  message text not null,
  visibility text not null default 'both' check (visibility in ('internal', 'client', 'both')),
  created_at timestamptz not null default now()
);

create index idx_task_comments_task_id on task_comments (task_id);

alter table task_comments enable row level security;
create policy admin_full_access on task_comments for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Anexos por tarefa (Supabase Storage)
-- ---------------------------------------------------------------------------
create table task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  uploaded_by uuid references profiles (id),
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 10485760), -- 10 MB
  created_at timestamptz not null default now()
);

create index idx_task_attachments_task_id on task_attachments (task_id);

alter table task_attachments enable row level security;
create policy admin_full_access on task_attachments for all using (is_admin()) with check (is_admin());

-- Bucket privado para anexos de tarefa (nunca público — seção 17 do redesign)
insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false)
on conflict (id) do nothing;

create policy admin_full_access_task_attachments on storage.objects
  for all
  using (bucket_id = 'task-attachments' and is_admin())
  with check (bucket_id = 'task-attachments' and is_admin());

-- ---------------------------------------------------------------------------
-- Histórico automático: bloqueio e impacto confirmado
-- ---------------------------------------------------------------------------
create or replace function trg_tasks_tracking_history()
returns trigger as $$
begin
  if new.is_blocking and not old.is_blocking then
    perform log_project_history(new.project_id, 'tarefa_bloqueadora', format('Tarefa "%s" marcada como bloqueadora.', new.title), new.visibility);
  end if;

  if new.schedule_impact_status = 'Impacto confirmado' and old.schedule_impact_status <> 'Impacto confirmado' then
    perform log_project_history(new.project_id, 'impacto_confirmado', format('Impacto no cronograma confirmado pela tarefa "%s".', new.title));
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_tasks_tracking_history_au
  after update of is_blocking, schedule_impact_status on tasks
  for each row execute function trg_tasks_tracking_history();
