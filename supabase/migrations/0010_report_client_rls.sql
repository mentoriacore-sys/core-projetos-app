-- C.O.R.E. Projetos — Fase 7 (Relatórios): acesso do cliente a relatórios PUBLICADOS.
-- Fonte: docs/CORE_PROJETOS_SPEC_V1.md, seções 40 (Portal do Cliente: "Relatórios
-- Relatórios publicados"), 42-44 (geração, publicação e snapshot).
--
-- Cliente só pode ler relatórios com status = 'Publicado' do(s) próprio(s)
-- projeto(s) — rascunhos nunca são visíveis (seção 43: "Relatório não será
-- automaticamente publicado"). Mesmo padrão de isolamento via is_my_project()
-- já usado em 0009_client_rls.sql.

create policy client_read_published_reports on project_reports
  for select using (status = 'Publicado' and is_my_project(project_id));

create policy client_read_published_report_items on report_items
  for select using (
    exists (
      select 1 from project_reports r
      where r.id = report_items.report_id
        and r.status = 'Publicado'
        and is_my_project(r.project_id)
    )
  );
