# Plano de testes — C.O.R.E. Projetos

## Teste crítico de segurança (spec seção 69)

Criar Cliente A, Cliente B, Projeto A, Projeto B. Logar como Cliente A e tentar acessar diretamente pela URL o Projeto B, seus documentos, entregáveis, relatórios, dependências e aprovações. Resultado obrigatório em todos os casos: **ACESSO NEGADO**.

**Executado em 2026-09 (Fase G do redesign) — resultado: aprovado.** Com dois clientes e projetos reais, testado não só pela tela mas direto na API do Supabase (contornando a interface por completo, como a spec exige):
- Cliente A lendo `projects`/`clients`/`tasks` do Cliente B por ID → array vazio (RLS filtrou, não é 403 nem erro — simplesmente não existe para ele)
- Cliente A tentando `POST` um comentário numa tarefa do Cliente B → `403`, `"new row violates row-level security policy"`
- Mesmo teste com os papéis invertidos (Cliente B → Cliente A) → mesmo resultado
- Cliente A comentando na própria tarefa → `201`, funciona normalmente (confirma que a política não ficou restritiva demais)

Reexecutar este teste sempre que uma tabela nova ganhar política de `client` (ver `docs/RLS_POLICIES.md`).

## Testes obrigatórios do módulo de chamados (adendo seção 34)

1. Cliente A tenta abrir chamado para Projeto B → NEGADO
2. Cliente A altera URL de arquivo tentando acessar print do Cliente B → NEGADO
3. Cliente tenta abrir chamado após fim dos 30 dias de acompanhamento → NEGADO
4. Cliente com chamado aberto antes do fim do acompanhamento: consegue responder ao chamado existente, não consegue abrir novo chamado
5. Cliente envia PNG → arquivo aparece no chamado correto
6. Cliente envia PDF → arquivo aparece no chamado correto
7. Cliente tenta enviar tipo de arquivo não permitido → upload rejeitado

## Regra geral de teste por fase (spec seção 59 / CLAUDE.md)

Cada fase deve ser implementada, rodada, testada e corrigida antes de iniciar a fase seguinte. Fase 1 (banco/autenticação/RLS) exige teste de segurança antes de avançar para qualquer tela.

## Checklist de finalização (Fase 9 / spec seção 68)

Testar em desktop, tablet e celular: autenticação, RLS, fluxo administrativo completo, fluxo do cliente completo, formulários, datas, histórico e relatórios — antes do deploy de produção no Netlify.
