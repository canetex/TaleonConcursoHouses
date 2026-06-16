# Expansão de Testes e Segurança: Taleon Concurso Houses (Fase 2)

**Para a IA do Cursor:** Você continua no papel de QA Engineer e agora também assume o chapéu de Especialista em Segurança (Red Team). Nosso objetivo é estressar o sistema, encontrar vulnerabilidades avançadas (além do cenário S02 já mapeado) e expandir a suíte de testes do projeto.

Revise o código atual (especialmente a comunicação com Supabase, Edge Functions e regras de tempo) e implemente/documente os seguintes cenários avançados na pasta `/testPlan/tests/`:

## 1. Testes de Abuso de Votação e Concorrência (*Race Conditions*)
* **Múltiplos votos simultâneos:** Simule disparos paralelos (ex: 10 requisições assíncronas no mesmo milissegundo) para o endpoint de votação com o mesmo `discord_id`. O banco (Supabase) consegue bloquear todos menos um, ou o contador de votos da casa soma 10?
* **Manipulação de Payload:** Tente votar passando o ID de uma casa que não existe, ou um ID de casa que está desclassificada/em rascunho.
* **Abuso de Dummies/Hirelings:** Verifique as regras que calculam os pontos (se dependem de nível, premium, ou quantidade de chars na conta). O que acontece se a API receber um payload forjado simulando 50 hirelings? A regra de backend valida isso adequadamente?

## 2. Manipulação de Tempo e Datas (Timezones)
* **Bypass de Frontend (Inscrição):** Altere a data/hora local do navegador simulado para uma data onde as inscrições estão abertas, enquanto a data real do servidor diz que estão fechadas. Tente enviar uma inscrição. O backend (Supabase/Edge Functions) barra a requisição, ou confia apenas na validação do frontend?
* **Bypass de Frontend (Votação):** Mesma lógica acima, mas para estender o período de votação.

## 3. Segurança de Arquivos e Armazenamento (Storage/Imagens)
* **XSS via Upload de Imagem:** Tente fazer upload (ou linkar, se for Imgur) de um arquivo `.svg` contendo um script malicioso `<script>alert(1)</script>`. O sistema sanitiza ou renderiza e executa o script na tela da casa?
* **Bypass de Tamanho/Formato:** Tente submeter via API um arquivo de 50MB disfarçado de `.png` ou um executável `.exe` renomeado para `.jpg`. O Supabase Storage e o código rejeitam a operação de forma segura?

## 4. Auditoria Profunda de RLS (Row Level Security)
Além do cenário S02 (Update de Casas), investigue e crie testes que tentem falhar para as seguintes tabelas:
* **Tabela de Votos (`votes`):** Um usuário comum consegue ler (`SELECT`) a tabela inteira e descobrir quem votou em quem (quebrando o voto secreto, se aplicável)? Consegue deletar (`DELETE`) o voto de um rival?
* **Tabela de Usuários/Profiles:** Um usuário consegue ler dados sensíveis de outros participantes do Discord?

## Ação Requerida (Fase 2)
1. Escreva esses novos testes (unitários e E2E de segurança) dentro da suíte existente.
2. Documente e atualize os novos cenarios no arquivo `testPlan/cenarios.md`
3. Execute todos os testes criados.
4. Atualize o arquivo `testPlan/status-dos-testes.md` adicionando os novos cenários na seção de Fragilidades Documentadas caso eles passem indevidamente (indicando falhas no sistema).