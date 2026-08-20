# C.O.R.E. PROJETOS V1

> Documento-fonte original: CORE Projetos.docx (Ferramentas). Convertido para Markdown sem alteração de conteúdo.

C.O.R.E. PROJETOS V1
Especificação Funcional, Técnica e de Implementação
Responsável pelo negócio: Andréia Paula SilvaMetodologia: C.O.R.E. — Clareza · Organização · Rotina · ExpansãoAplicação: C.O.R.E. ProjetosFinalidade: Gestão e acompanhamento dos projetos executados para clientesAmbiente de desenvolvimento: Claude CodeFrontend / aplicação web: React + TypeScriptHospedagem: NetlifyBackend, banco, autenticação e storage: SupabaseStatus: Documento definitivo para início da construção


## 1. DEFINIÇÕES IMPORTANTES
### 1.1 Metodologia C.O.R.E.
É a metodologia criada por Andréia Paula Silva e que orienta suas soluções.
C.O.R.E.:
Clareza
Organização
Rotina
Expansão
### 1.2 Base C.O.R.E.
É a aplicação de gestão interna do negócio de Andréia.
Centraliza informações como:
clientes;
produtos;
vendas;
pagamentos;
contratos;
mentorias;
sessões;
operação;
indicadores;
histórico do relacionamento;
visão gerencial do negócio.
A Base C.O.R.E. não é o Painel de Gestão C.O.R.E.
### 1.3 Painel de Gestão C.O.R.E.
É um produto independente destinado à comercialização para terceiros.
Não integra o escopo desta documentação.
### 1.4 C.O.R.E. Projetos
É a aplicação destinada à gestão dos projetos personalizados executados para clientes.
Será uma aplicação separada da Base C.O.R.E., porém preparada para integração.


## 2. PRINCÍPIO DE ARQUITETURA
A regra será:
Sistemas separados. Ecossistema integrado.
Base C.O.R.E. e C.O.R.E. Projetos não deverão ser construídos como uma única aplicação monolítica.
Cada aplicação terá:
código próprio;
deploy próprio;
projeto Supabase próprio;
banco de dados próprio;
regras de segurança próprias.
Posteriormente compartilharão somente os dados necessários por integração controlada.


## 3. ARQUITETURA TECNOLÓGICA
Desenvolvimento
Claude Code.
O código deverá permanecer independente de qualquer construtor proprietário.
Repositório
Git.
Preferencialmente GitHub.
Frontend
ReactTypeScriptVite
Interface
Aplicação web responsiva.
Prioridade:
desktop administrativo;
tablet;
mobile;
Portal do Cliente otimizado também para celular.
Banco de dados
Supabase PostgreSQL.
Autenticação
Supabase Auth.
Arquivos
Supabase Storage e links externos quando necessário.
Hospedagem
Netlify.
Segurança dos dados
Row Level Security — RLS.
Todas as tabelas expostas ao frontend deverão possuir políticas explícitas de acesso.


## 4. DOMÍNIO
Preparar aplicação para domínio próprio.
Exemplo futuro:
projetos.mentoriacore.com.br
ou
projetos.core.com.br
O domínio não deverá ser hardcoded no sistema.


## 5. AMBIENTES
Preparar projeto para:
Desenvolvimento
Execução local.
Produção
Netlify.
Opcionalmente poderá existir ambiente de homologação posteriormente.


## 6. VARIÁVEIS DE AMBIENTE
Nunca armazenar credenciais diretamente no código.
Prever:
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
E demais variáveis que forem necessárias.
Credenciais administrativas ou chaves de serviço nunca deverão ser disponibilizadas no frontend.


## 7. OBJETIVO CENTRAL
O sistema deverá permitir que Andréia responda rapidamente:
O que está acontecendo em cada projeto?
O que precisa acontecer agora?
Quem precisa agir?
Existe algum atraso?
Estamos aguardando o cliente?
Qual será a próxima entrega?
O projeto está saudável?
E deverá permitir que o cliente responda:
Como está o meu projeto?
O que já foi realizado?
O que acontecerá agora?
Existe algo que eu preciso fazer?
Quando será a próxima entrega?


## 8. PERFIS DE USUÁRIO
Existirão três papéis:
admin
team
client


## 9. ADMINISTRADOR
O administrador deverá poder:
acessar todos os projetos;
acessar todos os clientes;
criar e editar projetos;
definir escopo;
criar etapas;
criar tarefas;
alterar datas;
atualizar progresso;
cadastrar entregáveis;
registrar dependências;
registrar decisões;
registrar riscos;
anexar documentos;
solicitar aprovação;
visualizar histórico;
gerar relatórios;
publicar relatórios;
arquivar projetos;
definir visibilidade de informações.


## 10. EQUIPE
Usuário de equipe poderá receber acesso apenas aos projetos autorizados.
Permissões poderão incluir:
visualizar projeto;
editar tarefas;
atualizar andamento;
anexar arquivos;
adicionar comentários internos;
registrar conclusão.
Não terá acesso automático a todos os projetos.


## 11. CLIENTE
Cliente poderá visualizar exclusivamente projetos associados à própria conta.
Poderá:
acompanhar andamento;
consultar etapas liberadas;
consultar cronograma;
visualizar entregáveis;
visualizar documentos liberados;
visualizar relatórios;
visualizar solicitações destinadas a ele;
enviar arquivos;
comentar;
aprovar entregáveis;
solicitar ajustes.
Não poderá:
alterar percentual de progresso;
alterar prazo;
alterar status;
excluir registros;
visualizar anotações internas;
acessar outro cliente;
alterar escopo;
alterar responsáveis.


## 12. SEGURANÇA CRÍTICA
A separação dos clientes deverá ocorrer no banco através de RLS.
Não é suficiente esconder elementos da interface.
Regra obrigatória
Cliente A jamais poderá acessar:
projeto do Cliente B;
documentos do Cliente B;
relatórios do Cliente B;
comentários do Cliente B;
entregáveis do Cliente B.
Nem mesmo alterando manualmente a URL.
Esse requisito é impeditivo para publicação.


## 13. CLIENTES
Até a integração com a Base C.O.R.E., haverá cadastro mínimo local.
Campos:
id técnico;
código amigável;
nome;
empresa;
e-mail;
telefone;
segmento;
origem;
observação interna;
status;
data de criação.
Código:
CLI-0001

14. ORIGEM DO CLIENTE / PROJETO
Opções iniciais:
Mentoria;
Origem Estratégica;
Fluxo Estruturado;
Projeto Avulso;
Indicação;
Outro.
Não usar “Mentoria C.O.R.E.” como nome da organização.


## 15. PROJETOS
Campos principais:
ID;
código;
cliente;
nome;
descrição;
contexto;
problema identificado;
objetivo;
resultado esperado;
escopo incluído;
fora do escopo;
premissas;
responsável principal;
data de início;
previsão de término;
data real de término;
status;
saúde;
prioridade;
progresso;
responsabilidade atual;
data de criação;
data de atualização.
Código:
PRJ-0001


## 16. STATUS DO PROJETO
Padronizar:
Planejamento
Não iniciado
Em andamento
Aguardando cliente
Aguardando terceiro
Em revisão
Em atenção
Bloqueado
Pausado
Concluído
Cancelado
Evitar criação livre de status.


## 17. SAÚDE DO PROJETO
Separar status de saúde.
Verde
Saudável.
Amarelo
Atenção.
Vermelho
Crítico.
Exemplo:
Status: Em andamentoSaúde: Vermelho
é possível.


## 18. RESPONSABILIDADE ATUAL
Campo fundamental.
Valores:
C.O.R.E.;
Cliente;
Terceiro;
Equipe;
Nenhuma.
Serve para responder:
Quem precisa agir agora?


## 19. ETAPAS
Um projeto possui várias etapas.
Campos:
ID;
projeto;
nome;
descrição;
objetivo;
ordem;
responsável;
início previsto;
fim previsto;
início real;
fim real;
status;
progresso;
visibilidade;
observações.


## 20. TAREFAS
Uma etapa poderá conter várias tarefas.
Campos:
etapa;
projeto;
título;
descrição;
responsável;
prioridade;
status;
data prevista;
conclusão;
visibilidade;
observações.
Status:
Não iniciada
Em andamento
Aguardando
Em revisão
Concluída
Cancelada


## 21. PROGRESSO
O progresso não deverá depender apenas de digitação manual.
Na V1:
Progresso da etapa
Quantidade de tarefas concluídas / total de tarefas válidas.
Progresso do projeto
Média do progresso das etapas ativas.
Tarefas canceladas não entram no cálculo.
Etapas canceladas não entram no cálculo.
A arquitetura deverá permitir pesos diferentes futuramente.


## 22. ALTERAÇÃO DE PRAZOS
Toda alteração de data relevante deverá registrar:
data anterior;
nova data;
motivo;
usuário responsável;
data da alteração.
Se alteração da etapa afetar o prazo geral do projeto, o sistema deverá alertar a administradora.
Não alterar automaticamente a data final sem confirmação.


## 23. ATRASO
Será considerado atrasado quando:
prazo < data atual
e
status != concluído
O atraso deverá aparecer automaticamente no dashboard.


## 24. ATRASO CAUSADO POR DEPENDÊNCIA
Quando houver atraso decorrente do cliente ou terceiro, preservar:
prazo original;
data em que surgiu a dependência;
responsável;
quantidade de dias aguardando;
impacto previsto.
Não sobrescrever silenciosamente o prazo original.


## 25. DEPENDÊNCIAS
Campos:
projeto;
etapa;
tarefa;
descrição;
responsável;
data da solicitação;
prazo esperado;
impacto;
status;
resolução;
data de resolução.
Status:
Aberta
Aguardando
Bloqueadora
Resolvida


## 26. ALTERAÇÃO DE ESCOPO
Criar funcionalidade de:
Solicitação de Alteração de Escopo
Campos:
projeto;
descrição;
solicitante;
data;
motivo;
impacto estimado;
impacto em prazo;
decisão;
observação.
Decisão:
Em análise
Aprovada
Recusada
Incorporada ao projeto
Nenhuma alteração relevante deverá apagar o escopo original.


## 27. ENTREGÁVEIS
Campos:
projeto;
etapa;
nome;
descrição;
versão;
responsável;
prazo;
data de entrega;
status;
link/arquivo;
exige aprovação;
visibilidade.
Status:
Em produção
Em revisão interna
Aguardando aprovação
Ajustes solicitados
Aprovado
Entregue


## 28. APROVAÇÃO DO CLIENTE
Quando aplicável:
Aprovar
ou
Solicitar ajuste
Registrar:
usuário;
data;
horário;
versão;
decisão;
comentário.
Solicitar ajuste exigirá comentário.


## 29. REABERTURA DE ENTREGÁVEL
Se o cliente solicitar mudança depois de uma aprovação:
não apagar a aprovação anterior.
Criar novo ciclo/versão.
Exemplo:
V1 — aprovadaV2 — alteração posterior solicitada
Preservar histórico.


## 30. DOCUMENTOS
Categorias:
Contratos
Briefings
Materiais recebidos
Entregáveis
Relatórios
Referências
Documentos finais
Outros
Campos:
projeto;
etapa;
nome;
categoria;
arquivo ou URL;
responsável;
data;
visibilidade.


## 31. FERRAMENTAS E LINKS
Registrar:
ferramenta;
finalidade;
URL;
observação.
Não armazenar senha, token ou credencial em campo de texto comum.


## 32. DECISÕES
Campos:
projeto;
data;
decisão;
contexto;
responsável pela decisão;
impacto;
etapa;
registrado por.


## 33. RISCOS
Campos:
projeto;
risco;
descrição;
probabilidade;
impacto;
mitigação;
responsável;
status.
Probabilidade:
Baixa
Média
Alta
Impacto:
Baixo
Médio
Alto


## 34. HISTÓRICO
Criar timeline automática por projeto.
Registrar eventos relevantes:
projeto criado;
status alterado;
prazo alterado;
etapa criada;
etapa concluída;
tarefa concluída;
entregável enviado;
aprovação recebida;
ajuste solicitado;
dependência aberta;
dependência resolvida;
relatório publicado;
projeto concluído.


## 35. VISIBILIDADE
Registros relevantes possuirão:
internal
client
ou
both
O Portal do Cliente nunca deverá carregar conteúdo marcado exclusivamente como interno.


## 36. DASHBOARD ADMINISTRATIVO
Indicadores:
projetos ativos;
dentro do prazo;
em atenção;
críticos;
atrasados;
aguardando cliente;
bloqueados;
próximas entregas;
entregas vencidas.


## 37. CENTRAL DE ATENÇÃO
Bloco:
PRECISA DA MINHA ATENÇÃO
Reunir:
tarefas vencidas;
entregas vencidas;
aprovações retornadas com ajuste;
riscos críticos;
decisões pendentes;
projetos críticos;
bloqueios.


## 38. AGUARDANDO CLIENTE
Bloco específico.
Exibir:
cliente;
projeto;
solicitação;
desde quando;
dias aguardando;
impacto;
ação.


## 39. PÁGINA DO PROJETO
Cabeçalho:
cliente;
projeto;
status;
saúde;
progresso;
responsável atual;
início;
previsão de conclusão.
Abas:
Visão Geral
Etapas
Tarefas
Entregáveis
Dependências
Documentos
Decisões
Riscos
Histórico
Relatórios


## 40. PORTAL DO CLIENTE
Interface simplificada.
Não copiar integralmente o ambiente administrativo.
Tela:
Olá, [nome]
Seu Projeto
NomeObjetivoStatusProgressoPrevisão de conclusão
Etapa Atual
NomeDescriçãoProgresso
Próxima Entrega
NomeData
Precisamos de Você
Pendências e solicitações.
Aprovações
Itens aguardando decisão.
Entregáveis
Itens liberados.
Últimas Atualizações
Timeline simplificada.
Relatórios
Relatórios publicados.


## 41. MÚLTIPLOS USUÁRIOS DO CLIENTE
Um cliente/empresa poderá futuramente possuir mais de um usuário.
Exemplo:
Empresa XYZ
Maria — principal
João — financeiro
Ana — operacional
Na V1 a estrutura de banco deverá suportar múltiplos usuários, mesmo que inicialmente apenas um seja criado.


## 42. RELATÓRIO DE ACOMPANHAMENTO
Função:
Gerar Relatório
Conteúdo:
cliente;
projeto;
período;
data;
status;
saúde;
progresso;
resumo executivo;
concluído no período;
em andamento;
aguardando cliente;
próximos passos;
próximas entregas;
riscos;
decisões;
observações.


## 43. RELATÓRIO NÃO SERÁ AUTOMATICAMENTE PUBLICADO
Fluxo:
Gerar
→ Pré-visualizar
→ Revisar
→ Editar
→ Publicar
Somente depois ficará disponível ao cliente.


## 44. SNAPSHOT DO RELATÓRIO
Ao publicar relatório, congelar seu conteúdo.
Mudanças posteriores no projeto não podem modificar relatório antigo.
Criar:
versão;
data;
período;
conteúdo congelado;
usuário responsável.


## 45. PDF
Preparar estrutura para exportação em PDF.
Não deverá impedir o lançamento inicial caso a geração de PDF exija esforço desproporcional.
O relatório visual dentro do Portal é obrigatório.
PDF poderá entrar logo após estabilização da V1.


## 46. NOTIFICAÇÕES
V1:
Central interna de notificações.
Eventos prioritários:
tarefa vencida;
aprovação recebida;
ajuste solicitado;
dependência vencida;
entrega próxima.
E-mails serão evolução posterior, salvo se implementação simples.


## 47. PESQUISA
Buscar por:
projeto;
cliente;
responsável.


## 48. FILTROS
Filtros:
status;
saúde;
cliente;
responsável;
prioridade;
atrasado;
aguardando cliente;
prazo.


## 49. ENCERRAMENTO
Criar checklist de encerramento:
etapas concluídas;
entregáveis finais concluídos;
aprovações registradas;
dependências resolvidas;
documentos organizados;
relatório final emitido;
data final registrada.
Botão:
Encerrar Projeto


## 50. ARQUIVAMENTO
Projeto concluído não deverá ser apagado.
Depois de encerrado poderá ser arquivado.
Arquivados continuam pesquisáveis.


## 51. BANCO DE DADOS
Criar inicialmente tabelas equivalentes a:
profiles
clients
client_users
projects
project_members
project_stages
tasks
dependencies
deliverables
approvals
scope_changes
project_files
project_links
project_decisions
project_risks
project_history
project_reports
report_items
notifications


## 52. RELACIONAMENTOS
Client
→ muitos Projects
Client
→ muitos Users
Project
→ muitas Stages
Stage
→ muitas Tasks
Project
→ muitos Deliverables
Deliverable
→ muitas Versions/Approvals
Project
→ muitas Dependencies
Project
→ muitos Risks
Project
→ muitas Decisions
Project
→ muitos Files
Project
→ muitos Reports

53. BANCO DA BASE C.O.R.E.
Não utilizar diretamente o banco de produção da Base C.O.R.E. para o Portal do Cliente.
O C.O.R.E. Projetos terá projeto Supabase próprio.

54. INTEGRAÇÃO FUTURA COM BASE C.O.R.E.
Base C.O.R.E. poderá enviar:
base_client_id;
nome;
empresa;
contato;
produto/serviço de origem;
data da contratação;
projeto contratado.
C.O.R.E. Projetos poderá devolver:
project_id;
projeto;
status;
saúde;
progresso;
previsão;
conclusão;
URL do projeto.


## 55. IDENTIFICADOR DE INTEGRAÇÃO
Clientes oriundos da Base deverão possuir:
base_core_client_id
Esse campo permitirá sincronização futura sem depender de nome ou e-mail.


## 56. ESTRUTURA DE PASTAS DO CÓDIGO
Sugestão:
src/
  components/
    common/
    dashboard/
    projects/
    clients/
    reports/
    portal/

  pages/
    admin/
    portal/
    auth/

  services/
    supabase/
    projects/
    reports/

  hooks/

  lib/

  types/

  utils/

  contexts/

supabase/
  migrations/
  policies/
  seeds/

docs/
  architecture/
  database/
  rules/
  tests/


## 57. DOCUMENTAÇÃO DENTRO DO REPOSITÓRIO
Criar:
README.md
CLAUDE.md
docs/ARCHITECTURE.md
docs/DATABASE.md
docs/BUSINESS_RULES.md
docs/RLS_POLICIES.md
docs/TEST_PLAN.md

58. CLAUDE.MD
O Claude Code deverá possuir instruções persistentes sobre o projeto.
Incluir:
objetivo;
nomenclatura;
arquitetura;
padrões técnicos;
regras que não podem ser quebradas;
critérios de segurança;
regra de não alterar funcionalidades já validadas sem necessidade;
obrigação de testar após mudanças.


## 59. REGRA DE DESENVOLVIMENTO
Não implementar o sistema inteiro de uma única vez.
Construir incrementalmente.
Cada fase deverá:
implementar;
rodar;
testar;
corrigir;
registrar;
somente então seguir.

60. FASE 0 — INICIALIZAÇÃO
Criar:
projeto;
Git;
React;
TypeScript;
Vite;
Supabase client;
configuração Netlify;
variáveis de ambiente;
estrutura de pastas;
documentação.
Não construir telas complexas ainda.

61. FASE 1 — BANCO E AUTENTICAÇÃO
Implementar:
schema;
migrations;
profiles;
roles;
clientes;
usuários;
projetos;
relacionamentos;
autenticação;
políticas RLS.
Testar segurança antes de avançar.

62. FASE 2 — ADMINISTRAÇÃO BÁSICA
Implementar:
login;
layout administrativo;
clientes;
projetos;
criação;
edição;
listagem;
filtros básicos.

63. FASE 3 — GESTÃO DO PROJETO
Implementar:
página do projeto;
etapas;
tarefas;
progresso;
status;
saúde;
responsabilidade atual;
prazos.

64. FASE 4 — OPERAÇÃO
Implementar:
dependências;
entregáveis;
aprovações;
alteração de escopo;
decisões;
riscos;
arquivos;
links;
histórico.

65. FASE 5 — DASHBOARD
Implementar:
indicadores;
projetos críticos;
próximos prazos;
atrasos;
Central de Atenção;
Aguardando Cliente.

66. FASE 6 — PORTAL DO CLIENTE
Implementar:
área separada;
login;
projetos permitidos;
progresso;
cronograma simplificado;
entregáveis;
pendências;
aprovações;
documentos;
histórico simplificado.
Rodar testes rigorosos de isolamento.

67. FASE 7 — RELATÓRIOS
Implementar:
geração;
preview;
edição;
publicação;
snapshot;
histórico no portal.

68. FASE 8 — FINALIZAÇÃO
Testar:
desktop;
tablet;
celular;
autenticação;
RLS;
fluxo administrativo;
fluxo cliente;
formulários;
datas;
histórico;
relatórios.
Depois:
deploy de produção no Netlify.


## 69. TESTE CRÍTICO DE SEGURANÇA
Criar:
Cliente A
Cliente B
Projeto A
Projeto B
Fazer login como Cliente A.
Testar acesso direto pela URL ao Projeto B.
Resultado obrigatório:
ACESSO NEGADO
Repetir para:
documentos;
entregáveis;
relatórios;
dependências;
aprovações.

70. CRITÉRIO DE V1 PRONTA
A V1 está operacional quando for possível:
autenticar administrador;
cadastrar cliente;
criar projeto;
cadastrar etapas;
cadastrar tarefas;
controlar prazos;
visualizar progresso;
registrar dependências;
registrar entregáveis;
solicitar aprovação;
cliente acessar;
cliente acompanhar projeto;
cliente aprovar entrega;
cliente enviar informação;
visualizar atraso;
identificar quem precisa agir;
gerar relatório;
publicar relatório;
encerrar projeto;
recuperar todo o histórico.


## 71. DIRETRIZ DE DESIGN
A interface deverá ser:
limpa;
profissional;
elegante;
simples;
de leitura rápida.
Evitar aparência:
ERP;
planilha;
software técnico;
dashboard excessivamente carregado.


## 72. PRINCÍPIO DO ADMINISTRADOR
A primeira tela precisa responder:
O que precisa da minha atenção hoje?


## 73. PRINCÍPIO DO CLIENTE
A primeira tela precisa transmitir:
Eu sei exatamente como está o meu projeto.

74. FORA DA V1
Não implementar agora:
WhatsApp;
CRM completo;
faturamento;
gestão financeira;
cobrança;
assinatura eletrônica;
aplicativo mobile;
chat completo;
IA complexa;
Gantt avançado;
timesheet;
rentabilidade;
integração total com Base C.O.R.E.


## 75. REGRA DE PORTABILIDADE
Não depender desnecessariamente de componentes proprietários do Netlify ou Supabase quando uma implementação padrão e simples for suficiente.
Manter:
código versionado;
migrations SQL versionadas;
documentação de banco;
políticas RLS documentadas;
configuração reproduzível.


## 76. PROMPT INICIAL PARA O CLAUDE CODE
Você irá construir o C.O.R.E. Projetos, aplicação web de gestão e acompanhamento de projetos da Metodologia C.O.R.E.
Leia integralmente este documento antes de escrever código.
Não implemente todo o sistema imediatamente.
Primeiro:
analise os requisitos;
inspecione o repositório existente;
identifique o estado atual;
proponha a arquitetura técnica;
identifique riscos ou inconsistências;
crie ou atualize o arquivo CLAUDE.md;
apresente o plano de implementação dividido pelas fases definidas neste documento.
Não altere a Base C.O.R.E.
O C.O.R.E. Projetos é uma aplicação independente.
Stack preferencial:
React;
TypeScript;
Vite;
Supabase;
Netlify.
Prioridades absolutas:
segurança;
simplicidade;
clareza;
persistência real dos dados;
isolamento entre clientes;
facilidade de manutenção.
Não crie dados falsos como solução permanente.
Não simule backend.
Não implemente botões sem funcionalidade real.
Não deixe recursos visualmente disponíveis se ainda não funcionarem.
Não avance de fase sem testar a anterior.
Ao final desta primeira análise, não construa o sistema inteiro.
Apresente:
arquitetura proposta;
estrutura de pastas;
schema inicial;
estratégia RLS;
fases;
arquivos que pretende criar ou modificar;
riscos identificados.
Aguarde autorização para iniciar a Fase 0.


## 77. REGRA DE OURO
O C.O.R.E. Projetos não precisa ter o maior número possível de funções.
Ele precisa garantir que:
Andréia saiba exatamente o estado de cada projeto e que cada cliente tenha clareza sobre o que está acontecendo, o que já foi entregue, o que acontecerá em seguida e quando sua participação é necessária.
Essa regra deve orientar todas as decisões de produto e desenvolvimento.

ADENDO DEFINITIVO — C.O.R.E. PROJETOS V1
Módulo de Acompanhamento Pós-Projeto e Central de Chamados
Este módulo passa a fazer parte do escopo obrigatório do C.O.R.E. Projetos V1.


## 1. CICLO COMPLETO DO PROJETO
O ciclo do projeto não termina imediatamente com a entrega técnica.
O fluxo correto será:
Projeto em execução→ Entrega do projeto→ Início do período de acompanhamento→ 30 dias de acompanhamento→ Encerramento definitivo→ Desativação do acesso externo
O projeto deverá possuir, portanto, duas datas distintas:
Data de conclusão da execução;
Data final do acompanhamento.
A data final do acompanhamento será inicialmente:
Data de conclusão + 30 dias corridos
A administradora poderá alterar essa data quando houver condição contratual específica.

2. STATUS PÓS-PROJETO
Adicionar aos status do projeto:
Em acompanhamento;
Acompanhamento encerrado.
Fluxo recomendado:
Em andamento→ Em revisão→ Entregue→ Em acompanhamento→ Acompanhamento encerrado→ Arquivado


## 3. ACESSO DO CLIENTE DURANTE O ACOMPANHAMENTO
Durante os 30 dias de acompanhamento, o cliente deverá continuar tendo acesso ao Portal do Cliente.
Nesse período ele poderá:
consultar o projeto;
acessar documentos e entregáveis liberados;
consultar relatórios;
consultar histórico visível;
abrir chamados;
acompanhar chamados;
responder chamados;
anexar arquivos e imagens aos chamados.
Ele não poderá alterar:
projeto;
escopo;
cronograma;
entregáveis aprovados;
progresso;
status;
informações internas.


## 4. ENCERRAMENTO DO ACESSO
Após o término do acompanhamento:
o usuário não poderá abrir novos chamados;
o acesso ao portal poderá ser desativado pela administradora;
todos os dados deverão permanecer preservados internamente;
os chamados permanecem no histórico do projeto.
A desativação do acesso não deverá excluir o usuário nem apagar seus registros.
Utilizar status de usuário, por exemplo:
Ativo;
Acesso encerrado;
Bloqueado.


## 5. EXCEÇÃO PARA CHAMADOS AINDA ABERTOS
Se um chamado tiver sido aberto dentro dos 30 dias e ainda estiver em tratamento quando o período terminar:
o chamado deverá continuar ativo até a resolução.
Nesse cenário, o cliente poderá manter acesso restrito exclusivamente:
ao chamado aberto;
às respostas;
aos anexos;
à confirmação de solução.
Ele não poderá abrir novos chamados.
Após a conclusão do último chamado elegível:
o acesso poderá ser definitivamente encerrado.


## 6. CENTRAL DE CHAMADOS
Criar módulo chamado:
CENTRAL DE CHAMADOS
O módulo estará disponível:
no painel administrativo;
no Portal do Cliente.


## 7. ABERTURA DE CHAMADO PELO CLIENTE
Botão:
ABRIR CHAMADO
Campos obrigatórios:
Projeto
Preenchido automaticamente.
Área relacionada
Opções:
Funcionalidade;
Automação;
Integração;
Acesso;
Documento;
Processo;
Configuração;
Entregável;
Outro.
Título
Resumo objetivo do problema.
Exemplo:
“Formulário não está enviando os dados.”
Descrição
Campo livre com orientação:
Conte o que aconteceu, o que você esperava que acontecesse e, se possível, quais passos realizou antes do problema aparecer.
Impacto percebido
Opções:
Baixo;
Médio;
Alto;
Bloqueia minha operação.
Anexos
Permitir upload.
Enviar chamado


## 8. UPLOAD DE PRINTS E ARQUIVOS
O chamado deverá permitir anexos.
Tipos permitidos na V1:
PNG;
JPG;
JPEG;
WEBP;
PDF.
Recomendação inicial:
até 5 arquivos por chamado;
tamanho máximo de 6 MB por arquivo.
Esse limite poderá ser alterado posteriormente.
Arquivos deverão ser armazenados no Supabase Storage.
O armazenamento deverá ser privado.
O cliente poderá acessar somente arquivos vinculados:
aos próprios projetos;
aos próprios chamados.
A administradora poderá acessar todos os arquivos autorizados.


## 9. ORGANIZAÇÃO DOS ARQUIVOS
Estrutura sugerida no Storage:
support-tickets/
  client_id/
    project_id/
      ticket_id/
        arquivo.ext
Não usar nomes de clientes como único identificador.
Utilizar IDs.


## 10. TABELA DE CHAMADOS
Criar tabela:
support_tickets
Campos mínimos:
id;
ticket_code;
project_id;
client_id;
opened_by;
category;
title;
description;
reported_impact;
priority;
status;
opened_at;
first_response_at;
due_at;
resolved_at;
closed_at;
assigned_to;
resolution_summary;
created_at;
updated_at.
Código amigável:
CHM-0001
ou
SUP-0001
Preferência:
CHM-0001


## 11. TABELA DE MENSAGENS DO CHAMADO
Criar:
support_ticket_messages
Cada chamado deverá funcionar como uma conversa organizada.
Campos:
id;
ticket_id;
author_id;
message;
visibility;
created_at.
Visibilidade:
cliente;
interno.
Mensagens internas não deverão aparecer no Portal do Cliente.


## 12. TABELA DE ANEXOS
Criar:
support_ticket_attachments
Campos:
id;
ticket_id;
message_id;
uploaded_by;
storage_path;
file_name;
mime_type;
file_size;
created_at.


## 13. STATUS DO CHAMADO
Padronizar:
Aberto;
Em análise;
Em atendimento;
Aguardando cliente;
Resolvido;
Encerrado;
Cancelado.


## 14. DIFERENÇA ENTRE RESOLVIDO E ENCERRADO
Resolvido
A solução foi aplicada ou orientação foi fornecida.
Encerrado
O atendimento foi oficialmente finalizado.
A administradora poderá marcar como resolvido e posteriormente encerrar.


## 15. PRIORIDADE
Não permitir que a ordem da fila seja definida somente pela preferência do cliente.
O cliente informa o impacto percebido.
O sistema ou a administradora define a prioridade operacional.
Prioridades:
P1 — Crítica
Problema impede completamente o funcionamento de uma entrega essencial.
P2 — Alta
Problema relevante, com impacto direto na operação, mas existe alguma alternativa temporária.
P3 — Normal
Problema que precisa ser tratado, mas não interrompe a operação.
P4 — Baixa
Dúvida, pequeno ajuste ou situação sem impacto operacional relevante.


## 16. ORDEM DE ATENDIMENTO
Regra:
Prioridade primeiro. Ordem de chegada dentro da mesma prioridade.
Exemplo:
P1 aberto às 14hé tratado antes deP3 aberto às 10h.
Entre dois chamados P2:
o chamado aberto primeiro possui precedência.
A administradora poderá alterar a prioridade mediante justificativa.
Toda alteração deverá ficar no histórico.


## 17. SLA
Separar:
SLA DE PRIMEIRA RESPOSTA
Tempo máximo para a cliente receber confirmação humana de que o chamado foi analisado.
PRAZO DE RESOLUÇÃO
Não prometer prazo fixo universal, pois depende da natureza do problema.
O prazo de resolução poderá ser informado depois da análise inicial.


## 18. SLA INICIAL SUGERIDO
Para a V1, utilizar como regra interna inicial:
P1 — Crítica
Primeira resposta: até 4 horas úteis.
P2 — Alta
Primeira resposta: até 1 dia útil.
P3 — Normal
Primeira resposta: até 2 dias úteis.
P4 — Baixa
Primeira resposta: até 3 dias úteis.
Estes valores deverão ficar configuráveis.
Não hardcode.


## 19. HORÁRIO DE ATENDIMENTO
O sistema deverá permitir futuramente definir:
dias úteis;
horário de atendimento;
feriados.
Na V1, os SLAs poderão ser registrados como referência administrativa sem necessidade de um motor complexo de calendário.


## 20. FLUXO DO CHAMADO
Cliente:
Abre chamado
↓
Sistema:
Aberto
↓
Administradora avalia:
categoria;
impacto;
prioridade;
responsável.
↓
Status:
Em análise
↓
Se iniciar tratamento:
Em atendimento
↓
Se precisar de informação:
Aguardando cliente
↓
Cliente responde.
↓
Em atendimento
↓
Solução aplicada.
↓
Resolvido
↓
Registrar resolução.
↓
Encerrado


## 21. CHAMADO AGUARDANDO CLIENTE
Quando status:
Aguardando cliente
o sistema deverá registrar:
data da solicitação;
informação solicitada;
quantidade de dias aguardando.
Esse tempo não deverá ser interpretado como atraso da Metodologia C.O.R.E.


## 22. DASHBOARD DE CHAMADOS
Criar área administrativa:
CHAMADOS
Indicadores:
Abertos;
Em atendimento;
Aguardando cliente;
Críticos;
Vencendo SLA;
SLA vencido;
Resolvidos no período.


## 23. FILA DE ATENDIMENTO
Tabela:
Prioridade
Chamado
Cliente
Projeto
Categoria
Aberto em
Status
SLA
Responsável
Ordenação padrão:
prioridade;
SLA mais próximo;
data de abertura.


## 24. ALERTAS
Central de Atenção deverá também mostrar:
chamado crítico novo;
chamado próximo de vencer SLA;
SLA vencido;
cliente respondeu;
chamado aguardando resposta administrativa.


## 25. PÁGINA DO CHAMADO
Cabeçalho:
código;
cliente;
projeto;
prioridade;
status;
categoria;
data de abertura;
SLA;
responsável.
Conteúdo:
Descrição inicial
Anexos
Conversa
Informações internas
Histórico
Resolução


## 26. HISTÓRICO DO CHAMADO
Registrar:
abertura;
alteração de status;
alteração de prioridade;
responsável alterado;
mensagem enviada;
anexo enviado;
solução registrada;
encerramento.


## 27. RESOLUÇÃO
Antes de marcar chamado como resolvido, exigir:
Resumo da solução
Exemplo:
“Configuração da integração corrigida e envio testado com sucesso.”
Essa informação será preservada.


## 28. BASE DE CONHECIMENTO FUTURA
A arquitetura deverá permitir posteriormente transformar soluções recorrentes em uma base de conhecimento.
Não implementar na V1.


## 29. RELATÓRIO FINAL DE ACOMPANHAMENTO
No encerramento dos 30 dias, o sistema poderá gerar um:
Relatório Final de Acompanhamento
Contendo:
período acompanhado;
chamados abertos;
categorias;
chamados resolvidos;
pendências;
ajustes realizados;
situação final do projeto.
Esse relatório poderá integrar o encerramento definitivo.

30. PORTAL DO CLIENTE DURANTE OS 30 DIAS
Adicionar bloco:
ACOMPANHAMENTO
Seu período de acompanhamento vai até: [data]
Chamados
Botão:
Abrir chamado
Listagem:
código;
assunto;
data;
status;
última atualização.


## 31. AVISO DE ENCERRAMENTO
Quando faltarem 7 dias:
exibir aviso no portal:
Seu período de acompanhamento termina em 7 dias.
Quando faltarem 2 dias:
Seu acompanhamento termina em 2 dias. Caso exista alguma ocorrência relacionada ao projeto, registre-a pela Central de Chamados.


## 32. APÓS O PERÍODO
Ao término:
O período de acompanhamento deste projeto foi encerrado.
O botão:
Abrir chamado
deverá ser desabilitado.
Chamados elegíveis já abertos permanecem acessíveis até conclusão.


## 33. SEGURANÇA DOS ANEXOS
Arquivos de chamados nunca deverão ser públicos.
Aplicar RLS e/ou URLs assinadas temporárias.
Cliente somente poderá:
inserir arquivo no próprio chamado;
visualizar arquivos do próprio chamado.
Não permitir enumeração ou acesso direto aos arquivos de outros projetos.


## 34. TESTES OBRIGATÓRIOS
Teste 1
Cliente A tenta abrir chamado para Projeto B.
Resultado:
NEGADO
Teste 2
Cliente A altera URL de arquivo tentando acessar print do Cliente B.
Resultado:
NEGADO
Teste 3
Cliente tenta abrir chamado após fim dos 30 dias.
Resultado:
NEGADO
Teste 4
Cliente possui chamado aberto antes da data final.
Após o fim do acompanhamento:
consegue responder ao chamado existente.
Não consegue criar novo chamado.
Teste 5
Cliente envia PNG.
Arquivo aparece no chamado correto.
Teste 6
Cliente envia PDF.
Arquivo aparece no chamado correto.
Teste 7
Cliente tenta enviar tipo de arquivo não permitido.
Upload rejeitado.


## 35. ALTERAÇÕES NO MODELO DE DADOS
Adicionar às entidades principais:
support_tickets
support_ticket_messages
support_ticket_attachments
support_ticket_history
Adicionar a projects:
execution_completed_at
support_started_at
support_ends_at
support_status
Adicionar a client_users ou estrutura equivalente:
access_status
access_ends_at


## 36. ALTERAÇÃO NA FASE DE DESENVOLVIMENTO
Adicionar nova fase:
FASE 8 — ACOMPANHAMENTO E CHAMADOS
Implementar:
período de acompanhamento;
regra de 30 dias;
Central de Chamados;
abertura de chamado;
anexos;
imagens;
mensagens;
prioridade;
fila;
SLA;
histórico;
encerramento de chamado;
limitação de acesso após acompanhamento.
Depois renumerar a fase de finalização para:
FASE 9 — FINALIZAÇÃO E TESTES

37. CRITÉRIO ADICIONAL DE V1 PRONTA
A V1 somente poderá entrar em uso quando for possível:
concluir a execução de um projeto;
iniciar os 30 dias de acompanhamento;
manter acesso do cliente nesse período;
cliente abrir chamado;
cliente anexar print;
administradora visualizar o chamado;
classificar prioridade;
responder;
solicitar informação;
cliente responder;
registrar solução;
encerrar chamado;
impedir novos chamados após o prazo;
manter histórico;
desativar acesso do cliente.


## 38. REGRA DE NEGÓCIO FINAL
O período de acompanhamento não transforma o C.O.R.E. Projetos em suporte permanente.
O objetivo é garantir uma janela formal, organizada e rastreável após a entrega.
O sistema deverá deixar claro:
o que está coberto pelo acompanhamento;
até quando o acompanhamento é válido;
como registrar uma ocorrência;
qual é o status dessa ocorrência;
quando o atendimento foi concluído.



