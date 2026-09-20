-- Corrige bug de fabrica (desde 0001_schema.sql): generate_friendly_code()
-- sempre escrevia em NEW.code, mas support_tickets usa a coluna
-- `ticket_code` (não `code`). Nunca tinha sido detectado porque nenhum
-- chamado real havia sido criado até os testes da Fase 8 (Central de
-- Chamados) — toda tentativa de INSERT em support_tickets falhava com
-- "record 'new' has no field 'code'".
--
-- Torna a função genérica de novo: aceita o nome da coluna como 3º
-- argumento do trigger (default 'code', mantendo clients/projects como
-- estavam).

create or replace function generate_friendly_code()
returns trigger as $$
declare
  prefix text := TG_ARGV[0];
  seq_name text := TG_ARGV[1];
  col_name text := coalesce(TG_ARGV[2], 'code');
  next_val bigint;
  current_value text;
begin
  execute format('select ($1).%I', col_name) into current_value using new;
  if current_value is null then
    execute format('select nextval(%L)', seq_name) into next_val;
    new := jsonb_populate_record(new, jsonb_build_object(col_name, prefix || '-' || lpad(next_val::text, 4, '0')));
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_support_tickets_code on support_tickets;

create trigger trg_support_tickets_code
  before insert on support_tickets
  for each row execute function generate_friendly_code('CHM', 'support_tickets_code_seq', 'ticket_code');
