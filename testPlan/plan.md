# Plano de Testes Automatizados: Taleon Concurso Houses

**Para a IA do Cursor:** Você é um QA Engineer e Analista de Segurança focado neste projeto (TaleonConcursoHouses). Este é um sistema web que possui autenticação via Discord OAuth. 
Seu objetivo é estruturar e executar os testes automatizados para ele.

Siga as etapas abaixo, pausando para a minha confirmação onde for solicitado.

## Fase 1: Análise do Repositório
1. Analise o `package.json` e a estrutura de pastas para identificar a stack do projeto (ex: Next.js, React, Node, ORM, banco de dados usado, etc).
2. Proponha a stack de testes mais adequada (sugestão inicial: **Playwright** para E2E/API e **Vitest** ou **Jest** para unitários/componentes).

## Fase 2: Estratégia de Autenticação (Discord OAuth Bypass)
A autenticação real via Discord já foi validada manualmente e não deve ser testada via UI (para evitar bloqueios de anti-bot do Discord).
* **Tarefa para a IA:** Analise como o sistema salva a sessão (ex: JWT em cookies, NextAuth, local storage). 
* Proponha um script de utilidade (ex: `global-setup.ts` no Playwright) que injete uma sessão válida/simulada no navegador para que os testes E2E possam rodar diretamente nas rotas protegidas, sem passar pela tela de login do Discord.

## Fase 3: Mapeamento de Cenários Específicos
Crie uma lista (em formato `.md` no caminho `/testPlan/`), detalhando os cenários que serão testados e o resultado esperado, baseando-se no código que você leu. A lista deve incluir, no mínimo:

* **Fluxo de Usuário Deslogado:** Visualização da home, tentativa de acessar rotas protegidas (deve redirecionar), visualização de casas/concursos públicos, garantia de que não é possível votar ou se inscrever, visualização de diversas casas sem votar e visualização do ranking.
* **Fluxo de Usuário Logado (Bypass ativo):** Envio de uma casa para o concurso, edição de submissão, listagem de participações e edição de uma inscrição.
* **Testes de Componentes/Unitários:** Validação de regras de negócio (ex: limites de peso/tamanho/formato de imagens, formatação de datas do concurso, bloqueios de envio fora do prazo estipulado, votação de organizador, votação automática com base no número de *hirelings/dummies*, e votação do público).
* **Testes de Segurança e Vulnerabilidade (Fragilidade):** Validação contra votação indevida (ex: *Race conditions* para multiplicação de votos), proteção contra edição direta de dados por usuários sem permissão, *SQL/NoSQL Injections* no banco de dados e injeção/exploração nas APIs (se houver).

*PAUSA: Pergunte ao usuário se a lista de cenários está correta antes de começar a escrever o código.*

## Fase 4: Mão na Massa e Relatório Final
Após a minha aprovação dos cenários:
1. Instale as dependências necessárias via terminal.
2. Crie os mocks e o script de bypass da autenticação do Discord.
3. Crie a estrutura na pasta `/testPlan/tests/` e escreva os testes passo a passo. Priorize testes resilientes (use locators confiáveis, prefira atributos como `data-testid` ou papéis de acessibilidade ao invés de classes CSS).
4. Execute todos os testes criados via terminal. Leia os resultados e forneça um arquivo chamado `status-dos-testes.md` detalhando quais testes passaram, quais falharam e o motivo de cada falha.
5. Se algum teste falhar ou necessitar de um debug mais profundo, forneça-me os comandos exatos de terminal para rodar (ex: rodar em modo UI com `--ui` ou em modo de *debug*).