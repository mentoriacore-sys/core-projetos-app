# Processo — Cadastro de projeto a partir de uma pasta de documentos

Este documento descreve o processo que o Claude (rodando no Claude Code, dentro deste repositório) deve seguir sempre que a Andréia pedir para cadastrar um projeto novo a partir de uma pasta de documentos do cliente.

**Gatilho:** a Andréia diz algo como *"cadastra o projeto do [cliente] com base nessa pasta: [caminho]"*.

Este é um processo manual assistido (Camada 1 — ver `docs/DECISIONS.md`), preparado para ser automatizado depois (Camada 2/3), mas hoje depende de um pedido explícito da Andréia em uma sessão do Claude Code.

## 1. Convenção de pasta

Cada cliente/projeto tem uma pasta própria, geralmente em `Clientes/<Nome do Cliente>/<Nome do Projeto>/`, contendo tipicamente:

- **Termo de Abertura (ou "Termo de Abertura e Plano do Projeto")** — a fonte principal: contexto, escopo, cronograma, marcos, critérios de aceite.
- **Proposta** — detalha as frentes/etapas de execução, entregáveis (geralmente marcados com ✓) e prazos.
- Outros documentos (roteiros de reunião, guias, atas) — geralmente **não** viram registros diretos no sistema; servem só de contexto adicional. Se tiverem decisões relevantes já tomadas, podem virar uma Decisão (`project_decisions`).

Nem todo projeto terá exatamente esses nomes de arquivo — o processo deve se adaptar ao que existir na pasta, não exigir nomes exatos.

## 2. Mapeamento — de onde vem cada campo

| Campo no C.O.R.E. Projetos | Onde buscar |
|---|---|
| `clients.name`, `company`, `email`, `phone` | Cabeçalho do Termo de Abertura (Contratante) — se o cliente já existir no sistema (buscar por nome/e-mail antes de criar outro) |
| `projects.name` | Título do Termo/Proposta |
| `projects.context` | Seção "Contexto" do Termo |
| `projects.objective` | Objetivo declarado no Termo/Proposta |
| `projects.scope_included` / `scope_excluded` | Seção de escopo — "Fora do escopo" costuma vir explícito |
| `projects.start_date` / `expected_end_date` | Datas do cronograma (marco inicial e marco final) |
| `project_stages` | Cada "Frente" ou "Fase" do cronograma vira uma etapa, na ordem em que aparecem. `expected_start`/`expected_end` vêm das datas de cada frente. |
| `tasks` | Itens de checklist (✓) dentro de cada frente/etapa viram tarefas daquela etapa |
| `deliverables` | Quando um item do checklist é claramente um entregável final da frente (não uma sub-tarefa), cadastrar também como `deliverables`, vinculado à etapa |
| `project_decisions` | Pontos explicitamente marcados como "decisão tomada" (não confundir com pontos "a validar" — esses não são decisões ainda) |

**Nunca inventar dados que não estão nos documentos.** Campos sem informação clara ficam em branco — não adivinhar prazos, valores ou responsáveis.

## 3. Passo a passo

1. Ler todos os documentos da pasta indicada (extração de `.docx` — ver skill `docx` deste ambiente).
2. Verificar se o cliente já existe no sistema (`select * from clients where name ilike ...` ou pelo e-mail) — nunca duplicar cliente.
3. Montar o payload estruturado (ver formato em `scripts/import-project.mjs`, seção "Formato esperado").
4. **Apresentar um resumo em texto para a Andréia** — cliente, projeto, etapas com datas, tarefas por etapa — antes de gravar qualquer coisa.
5. Só depois da aprovação dela (explícita, na conversa), rodar `npm run import-project -- caminho/para/payload.json` para gravar.
6. Confirmar o que foi criado (códigos gerados: CLI-000X, PRJ-000X) e informar à Andréia.

## 4. Preparado para automação futura

Quando fizer sentido automatizar (Camada 2/3 — ver conversa registrada e `docs/DECISIONS.md`):

- A extração dos documentos (passos 1-3) é a parte que hoje só o Claude faz bem — é a parte "inteligente".
- A gravação (passo 5) já está isolada em `scripts/import-project.mjs`, que aceita um JSON estruturado — qualquer automação futura (Make.com, outra IA, etc.) que conseguir produzir esse mesmo formato de JSON pode chamar o mesmo script, sem precisar reescrever a lógica de gravação.
- Ou seja: o "gargalo manual" de hoje está isolado numa única etapa (extração), o que facilita substituí-la depois sem mexer no resto.
