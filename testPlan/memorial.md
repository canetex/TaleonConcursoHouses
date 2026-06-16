# Memorial Descritivo — Taleon Concurso Houses

> Documento de referência para avaliação integral do projeto (negócio + técnica).  
> **Repositório:** [canetex/TaleonConcursoHouses](https://github.com/canetex/TaleonConcursoHouses)  
> **Última atualização do memorial:** 2026-06-16  
> **Commit de referência:** `b2b8d43` (`main`)

---

## 1. Resumo executivo

**Taleon Concurso Houses** é um portal web para um concurso de decoração de casas (*houses*) no servidor privado de Tibia **Taleon — San**, organizado pela guilda/comunidade **The Crusty**. Participantes inscrevem a decoração da sua casa, pagam taxa simbólica de **10 TC (Tibia Coins)**, passam por validação manual dos organizadores e disputam prémios via votação pública estilo *match/dislike* (swipe) e pontuação dos organizadores.

O sistema é **SPA React** hospedada em **GitHub Pages**, com backend **Supabase** (PostgreSQL + Edge Functions Deno). Autenticação via **Discord OAuth PKCE**; operações sensíveis (inscrição, voto, perfil, admin) passam por **Edge Functions** com token de sessão HMAC, não por escrita direta no banco.

| Dimensão | Estado geral |
|----------|----------------|
| Funcionalidade core | ✅ Implementada |
| Segurança (RLS + Edge Functions) | ✅ Endurecida (P0–P3 concluídos) |
| Testes automatizados | ✅ ~77 testes (unit + security + E2E) |
| Deploy frontend | ✅ CI/CD GitHub Actions → Pages |
| Deploy backend | ✅ Edge Functions v3 em produção |

---

## 2. Contexto de negócio

### 2.1 Stakeholders

| Papel | Descrição |
|-------|-----------|
| **Organização (The Crusty)** | Define regras, valida pagamentos, aprova/rejeita inscrições, atribui votos de organizador e menção honrosa |
| **Participante** | Jogador do Taleon San com conta Discord; inscreve uma casa por conta Discord |
| **Votante** | Qualquer jogador autenticado na fase de votação; valida personagem no Taleon San antes de votar |
| **Público** | Consulta casas, ranking e regras sem login |

### 2.2 Objetivos do produto

1. Centralizar inscrições com formulário estruturado (casa do catálogo Tibia, screenshots, tema, andar, dummies/hirelings).
2. Exibir casas inscritas com galeria, lightbox, partilha e minimapa.
3. Permitir votação gamificada (swipe) apenas em casas **aprovadas**.
4. Calcular ranking em tempo real com fórmula transparente.
5. Dar painel admin aos organizadores para moderação.

### 2.3 Restrições de negócio importantes

- **Uma inscrição por utilizador Discord** (`UNIQUE(discord_user_id)` em `houses`).
- **Uma inscrição por nome de personagem** (`UNIQUE(character_name)`).
- **Um voto por utilizador por casa** (`UNIQUE(discord_user_id, house_id)` em `house_votes`).
- Casa deve estar **aberta ao público** durante votação (regra `aleta sio` + asterisco no nome — documentada em `/regras`).
- Screenshots apenas via **Imgur** (allowlist de segurança).
- Taxa de inscrição: **10 TC** transferidas manualmente ao organizador; status inicial `pending` até confirmação.

---

## 3. Fases do concurso e cronograma

As datas vivem em `contest_config` (PostgreSQL) e são interpretadas em **UTC** pelo servidor (`get-contest-phase`, `assert_registration_open`, `assert_voting_open`).

### 3.1 Fases (`ContestPhase`)

| Fase | Código | Comportamento no portal |
|------|--------|-------------------------|
| Inscrições | `registration` | Formulário de inscrição/edição ativo |
| Validação | `validation` | Inscrições fechadas; organizadores validam pagamentos |
| Votação | `voting` | Interface swipe ativa; apenas casas `approved` |
| Encerrado | `ended` | Apenas consulta (ranking, detalhes) |

### 3.2 Datas seed (migration inicial)

| Chave | Valor (UTC) |
|-------|-------------|
| `registration_start` | 2026-06-15T00:00:00Z |
| `registration_end` | 2026-06-30T00:00:00Z |
| `validation_end` | 2026-07-02T00:00:00Z |
| `voting_end` | 2026-07-17T00:00:00Z |

> Duração documentada nas regras: 15 dias inscrições → 2 dias validação → 15 dias votação.

### 3.3 Validação de fase

| Operação | Validação UI (`src/lib/phases.ts`) | Validação servidor |
|----------|-----------------------------------|-------------------|
| Inscrição/edição | `can_register(phase)` | `upsert-house` → `assert_registration_open` |
| Voto | `can_vote(phase)` | `cast-vote` → `assert_voting_open` |

**Nota:** A UI pode ser enganada alterando o relógio do browser (E-S10/E-S11 documentam bypass visual), mas a **API rejeita** operações fora da fase correta.

---

## 4. Regras de pontuação e premiação

### 4.1 Fórmula de pontos (view `house_leaderboard`)

Aplicada apenas a casas com `status = 'approved'`:

```
popular_points   = floor(total_matches / 5)
organizer_points = organizer_votes × 2
utility_bonus    = 2 se 1º em (dummies + hirelings); 1 se 2º; senão 0
total_points     = popular_points + organizer_points + utility_bonus
```

Desempate: `total_matches` descendente.

### 4.2 Prémios em GP + fundo de inscrições

| Posição | GP base | % das taxas (10 TC × inscrições aprovadas) |
|---------|---------|---------------------------------------------|
| 1º | 30 KK | 50% |
| 2º | 20 KK | 35% |
| 3º | 10 KK | 15% |

Prémio base total documentado: **60 KK**. Cálculo dinâmico em `Leaderboard.tsx` / `PrizeCalculator`.

### 4.3 Menção honrosa

Flag booleana `honorable_mention` atribuída manualmente pelos organizadores no painel admin (critério temático, sem impacto automático na fórmula de pontos).

---

## 5. Fluxos de utilizador

### 5.1 Rotas (`src/App.tsx`)

| Rota | Página | Auth | Público |
|------|--------|------|---------|
| `/` | HomePage | — | ✅ |
| `/regras` | RulesPage | — | ✅ |
| `/ranking` | RankingPage | — | ✅ |
| `/house/:id` | HouseDetailPage | — | ✅ |
| `/login` | LoginPage | — | ✅ |
| `/auth/callback` | AuthCallbackPage | OAuth | ✅ |
| `/inscrever` | RegisterPage | ✅ Discord | ❌ → redirect `/login` |
| `/votar` | VotePage | ✅ Discord | ❌ → redirect `/login` |
| `/admin` | AdminPage | ✅ Admin | ❌ → redirect `/login` |

Base path: `/TaleonConcursoHouses/` (GitHub Pages).

### 5.2 Autenticação Discord

1. Utilizador clica «Entrar com Discord» → redirect OAuth PKCE (`sign_in_with_discord`).
2. Callback em `/auth/callback` troca `code` por perfil via Edge Function `discord-auth`.
3. Sessão guardada em `localStorage` (`taleon_discord_session`):
   ```json
   {
     "discord_id": "...",
     "discord_username": "...",
     "discord_avatar": "...",
     "session_token": "<HMAC payload.signature>"
   }
   ```
4. `AuthProvider` sincroniza perfil via `update-profile`.
5. `is_authenticated` exige `discord_id` **e** `session_token` válido.

### 5.3 Inscrição (`RegisterPage`)

1. Valida personagem no Taleon San (`validate-character` Edge Function — scrape de `san.taleon.online`).
2. Seleciona tipo (casa/guildhall), cidade e casa (catálogo local, 1097 entradas).
3. Preenche andar, nome customizado, tema, contagem dummies/hirelings (0–20).
4. URLs Imgur resolvidas via `resolve-image-url` (álbum → link direto).
5. Coordenadas do mapa obtidas via `house-wiki-coords` (scrape Tibia Wiki BR).
6. Submissão via `upsert-house` (cria ou atualiza; rejeitadas voltam a `pending`).

### 5.4 Votação (`VotePage`)

1. Confirma personagem votante no Taleon San.
2. Lista casas `approved` ordenadas por `created_at`.
3. Interface `SwipeCard` (react-swipeable): `match` ou `dislike`.
4. Voto enviado via `cast-vote`; histórico via `get-my-votes`.

### 5.5 Admin (`AdminPage` em `RankingPage.tsx`)

- Acesso: `discord_id` ∈ `admin_discord_ids` (DB + `VITE_ADMIN_DISCORD_IDS`).
- Ações via `admin-update-house`: aprovar/rejeitar, votos organizador, menção honrosa, ajuste dummies/hirelings.
- Validação de admin **no servidor** (não só frontend).

### 5.6 Visualização de casas

- **Home:** carrossel `HouseCarousel` → `HouseShowcaseCard` (galeria, lightbox, partilhar, minimapa).
- **Detalhe:** `/house/:id` reutiliza `HouseShowcaseCard`.
- **Imagens:** `ImageWithFallback` + `HouseImagePlaceholder` (blur Tibia quando sem screenshot).
- **Mapa:** preview estático por andar (`tibiamaps.github.io/tibia-map-data`) com marcador; links externos para TibiaMaps e Tibia Wiki.

---

## 6. Arquitetura técnica

### 6.1 Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7 |
| Backend | Supabase PostgreSQL, RLS, Realtime (subscriptions) |
| Serverless | Supabase Edge Functions (Deno) |
| Auth | Discord OAuth 2.0 PKCE + session token HMAC (`CONTEST_SESSION_SECRET`) |
| Deploy FE | GitHub Actions → GitHub Pages |
| Deploy BE | Supabase CLI / MCP (`deploy_edge_function`) |
| Testes | Vitest (unit + security), Playwright (E2E) |

### 6.2 Diagrama lógico

```
[Browser SPA]
    │
    ├─ READ  ──► Supabase REST (anon) ──► houses, contest_config, house_leaderboard
    │
    ├─ AUTH  ──► discord-auth (OAuth code → session_token)
    │
    └─ WRITE ──► Edge Functions (session_token HMAC)
                    │
                    ├─ upsert-house      (service role)
                    ├─ cast-vote
                    ├─ update-profile
                    ├─ get-my-votes
                    └─ admin-update-house
                         │
                         ▼
                   [PostgreSQL + RLS]
```

### 6.3 Princípio arquitetural de segurança

> **Escritas no banco não usam Supabase Auth JWT.** O cliente anon envia `session_token` no body/header `x-contest-session`. Edge Functions validam HMAC e usam `SUPABASE_SERVICE_ROLE_KEY` para persistir.

Correção crítica em `_shared/session.ts`: o header `Authorization: Bearer <anon_jwt>` do cliente Supabase **não** deve ser confundido com o token do concurso (JWT tem 3 segmentos; token HMAC tem 2).

---

## 7. Modelo de dados

### 7.1 Tabelas principais

#### `contest_users`
- Perfil Discord (`discord_id` PK lógica, username, avatar).
- `validated_character` opcional.

#### `houses`
- Inscrição completa + `status` (`pending` | `approved` | `rejected`).
- Campos wiki: `house_city`, `house_tibia_name`, `house_wiki_slug`, `house_wiki_url`, `house_type`, `map_x/y/z`.
- `organizer_votes`, `honorable_mention`.
- `screenshot_urls` (array texto).

#### `house_votes`
- `vote_type`: `match` | `dislike`.
- `voter_character` (validado na UI, não revalidado server-side em cada voto).

#### `contest_config`
- Pares chave/valor: datas do concurso, `admin_discord_ids`, credenciais Discord (opcional).

#### View `house_leaderboard`
- Ranking calculado (ver secção 4.1).

### 7.2 Migrations (ordem)

| Arquivo | Conteúdo |
|---------|----------|
| `20260615152643_create_house_contest_schema.sql` | Schema base, enums, view leaderboard, RLS permissivo inicial |
| `20260615180000_add_discord_config_keys.sql` | Chaves Discord em `contest_config` |
| `20260616100000_set_admin_discord_id.sql` | Admin IDs |
| `20260616190000_add_house_wiki_fields.sql` | Campos wiki/mapa em `houses` |
| `20260617120000_security_hardening.sql` | REVOKE writes, DROP políticas permissivas, CHECK 0–20 |

### 7.3 RLS pós-hardening

| Tabela | anon/authenticated |
|--------|-------------------|
| `houses` | SELECT apenas |
| `house_votes` | Sem acesso direto |
| `contest_users` | Sem acesso direto |
| `contest_config` | SELECT |
| `house_leaderboard` | SELECT |

---

## 8. Edge Functions

| Função | Auth | Responsabilidade |
|--------|------|------------------|
| `discord-auth` | Pública | Troca OAuth code; emite `session_token` |
| `validate-character` | Pública | Valida personagem em taleon.online |
| `resolve-image-url` | Pública | Resolve álbum Imgur → URL direta |
| `house-wiki-coords` | Pública | Extrai coordenadas da Tibia Wiki BR |
| `get-contest-phase` | Pública | Fase + datas + admin_ids (servidor) |
| `upsert-house` | Sessão HMAC | Criar/atualizar inscrição |
| `cast-vote` | Sessão HMAC | Registar voto (casa approved, fase voting) |
| `update-profile` | Sessão HMAC | Upsert `contest_users` |
| `get-my-votes` | Sessão HMAC | Lista votos do utilizador |
| `admin-update-house` | Sessão HMAC + admin | Moderação |

Módulos partilhados: `_shared/{session,cors,phases,validation,rate-limit,supabase-admin}.ts`

Rate limit: 60 req/min/IP por função.

---

## 9. Frontend — estrutura de pastas

```
src/
├── pages/           # Rotas (Home, Register, Vote, Rules, Ranking, Admin, Login, AuthCallback, HouseDetail)
├── components/      # UI (Layout, HouseShowcaseCard, SwipeCard, HouseMinimap, Leaderboard, …)
├── hooks/           # useAuth, usePhase
├── lib/             # auth, session, contest-api, phases, images, tibia-houses-catalog, tibia-map, links
├── data/            # tibia-houses.json (1097 casas, gerado por script)
└── index.css        # Design tokens Tailwind @theme
```

### 9.1 Identidade visual (commit `9f36fdd`+)

| Token | Hex |
|-------|-----|
| brand-black | `#040300` |
| brand-brandy | `#75371e` |
| brand-olive | `#776a54` |
| brand-cream | `#e9e4c2` |
| brand-smoke | `#f6f5f3` |

- Logo: `public/logo.png` (classe `.contest-logo` → `border-radius: 50%`).
- Favicon: `public/favicon.png`.
- Placeholder imagem: `https://i.redd.it/vwhos583l2d91.png` com blur suave.

### 9.2 Catálogo de casas

- Fonte: TibiaData API + fallback Fandom (`scripts/generate-tibia-houses.mjs`).
- **1097** entradas com cidade, nome, tipo, slug/url wiki.
- Formulário usa `<select>` nativo (cidade e casa) com mesma estética.

---

## 10. Integrações externas

| Serviço | Uso |
|---------|-----|
| Discord OAuth | Login |
| Taleon San (`san.taleon.online`) | Validação de personagens |
| Tibia Wiki BR | Coordenadas de casas, links |
| TibiaMaps (tiles estáticos) | Preview de mapa |
| Imgur (`i.imgur.com`, `imgur.com`) | Screenshots (único host permitido) |
| Supabase | DB, Realtime, Edge Functions |

**Não há Supabase Storage** — imagens são hotlinked do Imgur.

---

## 11. Variáveis de ambiente

### Frontend (`.env` / GitHub Secrets)

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anon pública |
| `VITE_DISCORD_CLIENT_ID` | Client ID Discord OAuth |
| `VITE_ADMIN_DISCORD_IDS` | IDs admin (fallback/complemento ao DB) |

### Supabase Edge (secrets)

| Secret | Descrição |
|--------|-----------|
| `CONTEST_SESSION_SECRET` | HMAC para `session_token` |
| `SUPABASE_SERVICE_ROLE_KEY` | Injetado automaticamente |
| `DISCORD_CLIENT_SECRET` | Opcional se PKCE sem secret |

---

## 12. Deploy e operações

### 12.1 Frontend

- Push em `main` → workflow `.github/workflows/deploy.yml`.
- Build `npm run build` → artefacto `dist/` → GitHub Pages.
- URL: `https://canetex.github.io/TaleonConcursoHouses/`
- SPA fallback: `404.html` = cópia de `index.html`.

### 12.2 Backend

- Migrations via Supabase MCP/`apply_migration`.
- Edge Functions: `scripts/prepare-edge-deploy.mjs` + deploy MCP (versão 3 em produção para funções secured).
- Projeto Supabase referência: `wyzpqnwhsrycncvqgqiq` (`.env.example`).

### 12.3 Comandos úteis

```bash
npm run dev              # desenvolvimento local
npm run build            # build produção
npm run test:unit        # 32 testes unitários
npm run test:security    # 26+ testes segurança + probes
npm run test:e2e         # 18 testes Playwright
npm run test:all         # suíte completa
```

---

## 13. Testes e qualidade

### 13.1 Estrutura

| Pasta | Conteúdo |
|-------|----------|
| `tests/unit/` | Regras de negócio (fases, imagens, scoring, catálogo, sessão) |
| `tests/security/` | RLS estático, integração API, probes `s02–s18` |
| `tests/e2e/` | Fluxos guest, logado, OAuth callback, bypass de fase, XSS imagem |
| `tests/fixtures/` | Mocks Supabase, injeção de sessão Discord |

### 13.2 Bypass E2E

Sessão injetada em `localStorage` (`taleon_discord_session`) via `inject_discord_session` — evita OAuth real no CI.

### 13.3 Vulnerabilidades mitigadas (resumo)

| ID | Mitigação |
|----|-----------|
| S02, S15, S18 | REVOKE + Edge Functions |
| S08–S11 | Validação fase/status em `cast-vote` / `upsert-house` |
| S09 | CHECK 0–20 + validação server |
| S04 | Admin server-side |
| S13/E-S12 | Allowlist Imgur; sem SVG; sem execução de script |
| S14, S17 | Sem SELECT público em votos/users |

Documentação detalhada: `testPlan/status-dos-testes.md`, `testPlan/backlog.md`, `testPlan/cenarios.md`.

> **Nota:** `cenarios.md` contém estados históricos pré-hardening em algumas linhas; `backlog.md` e `status-dos-testes.md` refletem o estado atual.

---

## 14. Limitações conhecidas e dívida técnica

| Item | Severidade | Descrição |
|------|------------|-----------|
| Inscrições legadas | Média | Casas criadas antes dos campos wiki podem ter `house_city`/`house_tibia_name` NULL; edição exige re-seleção no formulário |
| Validação `voter_character` | Baixa | Personagem do votante validado só na UI, não revalidado a cada `cast-vote` |
| Bypass UI de fase | Baixa | Relógio do browser pode mostrar formulários; API bloqueia |
| Sem upload de imagens | Info | Dependência total do Imgur; sem verificação de tamanho real do ficheiro |
| Rate limit em memória | Baixa | `_shared/rate-limit.ts` não persiste entre instâncias Edge |
| `cenarios.md` desatualizado | Info | Alguns cenários marcam vulnerabilidades já corrigidas |
| OAuth Discord em E2E | Info | Não testado end-to-end (anti-bot); callback testado com mock |

---

## 15. Histórico de commits relevante

| Commit | Descrição |
|--------|-----------|
| `b2b8d43` | Logo circular, blur suave, mapa estático |
| `9f36fdd` | Identidade visual, logo, favicon, placeholder, fix sessão |
| `8a3ac1b` | Carrossel detalhado, catálogo 1097 casas |
| `a52509a` | Login único OAuth, fase via servidor |
| `206e1e6` | Hardening P0–P3, Edge Functions, RLS |
| `0aa3bc8` | Inscrição Tibia Wiki, edição, partilha |

---

## 16. Checklist para IA avaliadora

Use esta lista para auditar o projeto de forma sistemática:

### Negócio
- [ ] As regras em `/regras` estão implementadas no código (fases, taxa 10 TC, uma inscrição por Discord)?
- [ ] A fórmula de pontuação na view SQL coincide com o que é mostrado no ranking?
- [ ] O fluxo pending → approved → votação está coerente?
- [ ] Prémios calculados refletem o edital (60 KK + splits de TC)?

### Segurança
- [ ] Escritas diretas via REST anon estão bloqueadas (probes S02, S14–S18)?
- [ ] `session_token` é validado corretamente (prioridade sobre JWT anon)?
- [ ] Admin não pode ser impersonado só alterando frontend?
- [ ] URLs de imagem maliciosas (SVG, data:, javascript:) são rejeitadas?
- [ ] Voto em casa não aprovada é rejeitado server-side?

### Funcionalidade
- [ ] OAuth PKCE completa sem double-login?
- [ ] Edição de inscrição funciona com sessão válida?
- [ ] Catálogo de casas cobre cidades principais do Taleon?
- [ ] Realtime atualiza ranking/votos?

### UX / Acessibilidade
- [ ] Rotas protegidas redirecionam para `/login?redirect=...`?
- [ ] Placeholder e galeria funcionam sem screenshots?
- [ ] Mapa não captura scroll da página inteira?

### Operações
- [ ] CI passa em `main`?
- [ ] Secrets necessários documentados?
- [ ] Migrations aplicadas em produção?

### Testes
- [ ] `npm run test:all` passa?
- [ ] Cobertura de cenários críticos (S02, S08–S11, E-S12, L03/L04)?

---

## 17. Documentos relacionados no repositório

| Ficheiro | Propósito |
|----------|-----------|
| `testPlan/plan.md` | Plano original de testes para IA |
| `testPlan/cenarios.md` | Cenários mapeados (parcialmente histórico) |
| `testPlan/status-dos-testes.md` | Resultado da suíte e vulnerabilidades |
| `testPlan/backlog.md` | Backlog de segurança P0–P3 (concluído) |
| `testPlan/plan_phase2.md` | Fase 2 red team |
| `testPlan/memorial.md` | **Este documento** |

---

*Memorial gerado para suportar revisão arquitetural, auditoria de segurança e onboarding técnico. Para dados em tempo real (datas do concurso, casas inscritas, estado do deploy), consultar Supabase e GitHub Actions.*
