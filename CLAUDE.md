# C.O.R.E. Projetos — Instruções permanentes

## Objetivo

Construir o **C.O.R.E. Projetos**, aplicação web independente para gestão e acompanhamento dos projetos personalizados executados para clientes da Metodologia C.O.R.E., seguindo estritamente `docs/CORE_PROJETOS_SPEC_V1.md` e as decisões registradas em `docs/DECISIONS.md`.

Este projeto é **separado da Base C.O.R.E.** (outro repositório, outra aplicação, outro escopo). Não é uma tela nem um módulo da Base C.O.R.E.

## Princípio de arquitetura

**Sistemas separados. Ecossistema integrado.**

- Código próprio, repositório próprio, deploy próprio.
- Projeto Supabase próprio e banco de dados próprio (nunca o banco de produção da Base C.O.R.E.).
- Regras de segurança próprias.
- Integração futura com a Base C.O.R.E. ocorrerá apenas por troca controlada de dados (ver spec, seções 54–55), nunca por acesso direto a bancos ou código um do outro.

## Regras inegociáveis

1. Não implementar o sistema inteiro de uma vez. Construir por fases (ver spec, seções 60–68 e adendo, seção 36) — uma fase por vez, com autorização explícita da Andréia antes de iniciar a próxima.
2. Não alterar a Base C.O.R.E. sob nenhuma circunstância a partir deste projeto.
3. Não inventar regras de negócio, campos, status, prioridades, SLAs ou fluxos além do que está em `docs/CORE_PROJETOS_SPEC_V1.md`. Quando faltar decisão de negócio, registrar PENDÊNCIA e perguntar.
4. Segurança de dados entre clientes é requisito **impeditivo para publicação** (spec, seção 12). Isolamento entre clientes deve ser garantido no banco via RLS — nunca apenas escondendo elementos na interface.
5. Toda tabela exposta ao frontend precisa de políticas RLS explícitas.
6. Nunca hardcode credenciais, domínio ou chaves de serviço. Variáveis de ambiente apenas (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.). Chaves administrativas/de serviço nunca no frontend.
7. Não simular backend, não criar dados falsos como solução permanente, não implementar botões sem funcionalidade real, não deixar recursos visíveis que ainda não funcionam.
8. Não avançar de fase sem testar a fase anterior (rodar, testar, corrigir, registrar — só então seguir).
9. Não trocar a stack (React + TypeScript + Vite + Supabase + Netlify) sem necessidade demonstrada.
10. Não refatorar amplamente por preferência técnica.
11. Antes de declarar uma fase pronta, executar os critérios de aceite da fase (spec, seções 70 e 37 do adendo).
12. Design: interface limpa, profissional, elegante, simples, de leitura rápida — evitar aparência de ERP, planilha ou dashboard sobrecarregado (spec, seção 71).
13. Regra de ouro: o sistema existe para que a Andréia saiba exatamente o estado de cada projeto e cada cliente tenha clareza sobre o que está acontecendo, o que foi entregue, o que vem a seguir e quando sua participação é necessária (spec, seção 77).

## Fluxo de trabalho

- Ler `docs/CORE_PROJETOS_SPEC_V1.md` integralmente antes de qualquer mudança relevante.
- Antes de escrever código: analisar requisitos, inspecionar o estado atual do repositório, propor arquitetura/schema/estratégia RLS, identificar riscos, e apresentar o plano por fases.
- Implementar em incrementos pequenos, um por vez.
- Rodar testes/lint/build disponíveis após cada incremento relevante.
- Teste crítico de segurança (spec, seção 69) e testes obrigatórios do módulo de chamados (adendo, seção 34) são obrigatórios antes de considerar o Portal do Cliente pronto.
- Informar arquivos alterados, testes executados, pendências e riscos ao final de cada etapa.

## Fases (ver spec para detalhe de cada uma)

0. Inicialização (projeto, Git, React/TS/Vite, Supabase client, Netlify config, env vars, estrutura de pastas, documentação)
1. Banco e autenticação (schema, migrations, RLS, roles)
2. Administração básica (login, layout admin, clientes, projetos — CRUD)
3. Gestão do projeto (página do projeto, etapas, tarefas, progresso, status, saúde)
4. Operação (dependências, entregáveis, aprovações, alteração de escopo, decisões, riscos, arquivos, links, histórico)
5. Dashboard administrativo (indicadores, Central de Atenção, Aguardando Cliente)
6. Portal do Cliente (área separada, isolamento testado rigorosamente)
7. Relatórios (geração, preview, edição, publicação, snapshot)
8. Acompanhamento pós-projeto e Central de Chamados (30 dias, tickets, anexos, SLA, prioridade)
9. Finalização e testes (todos os dispositivos, RLS, fluxos completos) → deploy de produção no Netlify

**Não iniciar uma fase sem autorização explícita da Andréia.**

## Fora do escopo da V1

WhatsApp, CRM completo, faturamento, gestão financeira, cobrança, assinatura eletrônica, aplicativo mobile nativo, chat completo, IA complexa, Gantt avançado, timesheet, rentabilidade, integração total com a Base C.O.R.E., base de conhecimento (chamados).
