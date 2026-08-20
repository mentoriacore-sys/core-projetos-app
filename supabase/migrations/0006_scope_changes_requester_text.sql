-- C.O.R.E. Projetos — scope_changes.requester como texto livre
-- Consistente com "responsible" em dependencies/tasks: nem todo solicitante
-- de alteração de escopo é necessariamente um usuário cadastrado no sistema.
alter table scope_changes drop constraint if exists scope_changes_requester_fkey;
alter table scope_changes alter column requester type text using requester::text;
