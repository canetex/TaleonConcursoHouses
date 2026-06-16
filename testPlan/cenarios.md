# Cenários de Teste — Taleon Concurso Houses

> Baseado no código em `main` (commit com edição de inscrição, Tibia Wiki, partilha).

## Stack proposta

| Camada | Ferramenta |
|--------|------------|
| Unitários / regras de negócio | **Vitest** |
| E2E / UI | **Playwright** |
| Bypass OAuth Discord | `localStorage` key `taleon_discord_session` via `addInitScript` |

## Fase 1 — Stack do projeto

- **Frontend:** React 19 + Vite 6 + TypeScript + Tailwind 4 + React Router 7
- **Backend:** Supabase (PostgreSQL, RLS, Edge Functions)
- **Auth:** Discord OAuth PKCE → sessão em `localStorage` (`taleon_discord_session`)
- **Deploy:** GitHub Pages (`/TaleonConcursoHouses/`)

## Fase 2 — Bypass de autenticação

Sessão simulada injetada antes de cada teste E2E autenticado:

```json
{
  "discord_id": "999999999999999001",
  "discord_username": "E2E_TestUser",
  "discord_avatar": null
}
```

**Nota:** rotas protegidas **não redirecionam** — exibem prompt de login inline. Os testes validam o comportamento real.

---

## Fluxo: Utilizador deslogado

| ID | Cenário | Resultado esperado |
|----|---------|-------------------|
| G01 | Aceder à home `/` | Carrega título do concurso e fase atual |
| G02 | Aceder `/ranking` | Ranking visível (público) |
| G03 | Aceder `/regras` | Página de regras visível |
| G04 | Aceder `/inscrever` | Mensagem pedindo login Discord (sem formulário) |
| G05 | Aceder `/votar` | Mensagem pedindo login Discord |
| G06 | Aceder `/admin` | Mensagem pedindo login (não painel admin) |
| G07 | Aceder `/house/:id` válido | Detalhe da casa visível (rota pública) |
| G08 | Tentar votar deslogado | Botão de login, sem interface de swipe |

## Fluxo: Utilizador logado (bypass)

| ID | Cenário | Resultado esperado |
|----|---------|-------------------|
| L01 | `/inscrever` sem casa existente | Formulário "Inscrever Casa" visível |
| L02 | `/inscrever` com casa existente (mock) | Título "Editar Inscrição" e botão "Guardar Alterações" |
| L03 | Submeter inscrição (mock API) | POST para `houses` com dados do formulário |
| L04 | Editar inscrição (mock API) | PATCH/UPDATE com `.eq(discord_user_id)` |
| L05 | `/votar` fora da fase voting | Mensagem de período encerrado |
| L06 | `/admin` sem ser admin | Acesso negado |

## Testes unitários — Regras de negócio

| ID | Módulo | Cenário | Resultado esperado |
|----|--------|---------|-------------------|
| U01 | `phases.ts` | Datas em período de inscrição | `can_register === true` |
| U02 | `phases.ts` | Datas em votação | `can_vote === true`, `can_register === false` |
| U03 | `phases.ts` | Concurso encerrado | fase `ended` |
| U04 | `images.ts` | URL `.png` direta | `is_direct_image_url === true` |
| U05 | `images.ts` | Álbum Imgur | `needs_image_resolution === true` |
| U06 | `images.ts` | Normalização Imgur | converte para `i.imgur.com/...png` |
| U07 | `auth.ts` | `is_admin` | true só para IDs na lista |
| U08 | `permalink.ts` | Gerar permalink | URL com `/house/{id}` |
| U09 | `session.ts` | get/set/clear sessão | round-trip no localStorage |
| U10 | `scoring` | Fórmula de pontos | matches÷5 + org×2 + bónus utilidade |
| U11 | `tibia-houses-catalog` | Filtrar por cidade/tipo | lista correta |

## Testes de segurança / fragilidade

| ID | Cenário | Resultado esperado | Estado atual |
|----|---------|-------------------|--------------|
| S01 | Duplo voto simultâneo | Apenas 1 voto por `(discord_id, house_id)` | UNIQUE no DB; upsert no cliente |
| S02 | Editar casa de outro utilizador | Operação rejeitada | Cliente filtra por `discord_user_id`; **RLS permite UPDATE global** ⚠️ |
| S03 | SQL injection em `character_name` | Tratado como string | Parametrizado via Supabase client |
| S04 | Acesso admin com ID falso | Negado | `is_admin` no frontend; IDs em `contest_config` |
| S05 | Edge functions sem JWT | Acessíveis com anon key | `verify_jwt: false` em funções públicas |

**⚠️ Fragilidade documentada:** política RLS `houses_update USING (true)` permite update de qualquer casa via API direta. Teste S02 documenta risco; correção seria migration futura.

---

## Fase 2 — Red Team / cenários avançados

### Abuso de votação e concorrência

| ID | Cenário | Resultado esperado | Estado / teste |
|----|---------|-------------------|----------------|
| S06 | 10 upserts paralelos mesmo `(discord_id, house_id)` | Apenas 1 voto persistido | ✅ UNIQUE + upsert (`s06-vote-race.mjs`) |
| S07 | Voto em `house_id` inexistente | Rejeitado por FK | ✅ (`s07-vote-invalid-house.mjs`) |
| S08 | Voto em casa `pending` / não aprovada | Rejeitado no backend | ❌ **API aceita** — filtro só no `VotePage` |
| S09 | Payload com 50 hirelings/dummies forjados | Rejeitado ou validado server-side | ❌ **API aceita** — afeta bónus de utilidade |

### Manipulação de tempo (timezones)

| ID | Cenário | Resultado esperado | Estado / teste |
|----|---------|-------------------|----------------|
| S10 | Inscrição via API fora da fase `registration` | Rejeitado no Supabase | ⏭️ SKIP se fase atual = registration; análise estática confirma ausência de validação |
| S11 | Voto via API fora da fase `voting` | Rejeitado no Supabase | ❌ **API aceita** (`s11-voting-time-bypass.mjs`) |
| E-S10 | Relógio do browser manipulado reabre UI de inscrição | UI bloqueada independente do relógio | ❌ **Bypass UI confirmado** (E2E) |
| E-S11 | Relógio manipulado reabre UI de votação | Idem | ❌ **Bypass UI confirmado** (E2E) |

### Segurança de imagens / storage

| ID | Cenário | Resultado esperado | Estado / teste |
|----|---------|-------------------|----------------|
| S12 | URL `.svg` com `<script>` em screenshots | Não executar JS | ✅ `.svg` fora do allowlist; `<img>` não executa script (E-S12) |
| S13 | Arquivo 50MB / `.exe` disfarçado de `.jpg` | Rejeitado | ⚠️ Sem upload Supabase Storage; extensão `.jpg` na URL passa validação client-side |
| E-S12 | Renderização de casa com SVG malicioso | Sem `alert()` | ✅ Playwright |

### Auditoria RLS além de S02

| ID | Cenário | Resultado esperado | Estado / teste |
|----|---------|-------------------|----------------|
| S14 | `SELECT` global em `house_votes` | Restrito | ❌ **Qualquer anon lê votos** (quebra sigilo) |
| S15 | `UPDATE` voto de rival | Rejeitado | ❌ **RLS `house_votes_update USING (true)`** |
| S16 | `DELETE` voto de rival | Rejeitado | ✅ Sem política DELETE — operação negada |
| S17 | `SELECT` dados de outros `contest_users` | Restrito | ❌ **Leitura global** (username, avatar, personagem) |
| S18 | `UPDATE` perfil alheio | Rejeitado | ❌ **RLS `contest_users_update USING (true)`** |

**Arquivos de teste:** `tests/security/probes/s06–s18*.mjs`, `tests/security/*.integration.test.ts`, `tests/unit/{vote-abuse,time-bypass,image-security}.test.ts`, `tests/e2e/security/*.spec.ts`
