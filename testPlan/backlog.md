# Backlog de Correções — Taleon Concurso Houses

> Gerado com base em `status-dos-testes.md` e `cenarios.md` (fases 1 e 2).  
> **Decisão Arquitetural Ativa:** Escritas no banco de dados (`INSERT`/`UPDATE`) não usarão Supabase Auth. Serão isoladas em Edge Functions utilizando a `SUPABASE_SERVICE_ROLE_KEY` após validação da sessão do Discord.

Legenda de severidade: 🔴 Crítico · 🟠 Alto · 🟡 Médio · 🟢 Baixo / melhoria

---

## Resumo executivo

| Prioridade sugerida | Itens | Foco | Status |
|---------------------|-------|------|--------|
| P0 | 3 | RLS crítico — fechamento do banco e migração para Edge Functions | ✅ Concluído |
| P1 | 6 | Validação server-side + RLS de leitura | ✅ Concluído |
| P2 | 4 | Endurecimento complementar (admin, imagens, edge functions) | ✅ Concluído |
| P3 | 4 | UX / melhorias não bloqueantes | ✅ Concluído |
| — | 4 | Sem ação (comportamento já seguro) | — |

**Suíte:** 77/77 testes passando (`test:unit` 32 · `test:security` 27 · `test:e2e` 18)

---

## P0 — Segurança crítica ✅

### [S02] RLS `houses` — UPDATE global via API direta — ✅

- Migration `20260617120000_security_hardening.sql` revoga UPDATE/INSERT para `anon`
- Edge Function `upsert-house` com validação de sessão
- Frontend refatorado para `invoke('upsert-house')`
- Probe S02: exit 0

### [S15] RLS `house_votes` — UPDATE global de votos — ✅

- Migration revoga UPDATE/INSERT direto
- Edge Function `cast-vote`
- Frontend refatorado
- Probe S15: exit 0

### [S18] RLS `contest_users` — UPDATE global de perfis — ✅

- Migration revoga UPDATE/INSERT direto
- Edge Function `update-profile`
- Frontend refatorado (`auth.ts`)
- Probe S18: exit 0

---

## P1 — Validação de backend e RLS de leitura ✅

### [S14] RLS `house_votes` — SELECT global — ✅

- REVOKE SELECT em `house_votes` para `anon`
- `get-my-votes` retorna apenas votos do utilizador autenticado

### [S17] RLS `contest_users` — SELECT global — ✅

- REVOKE SELECT público; leituras via service role nas Edge Functions

### [S08] Voto em casa não aprovada — ✅

- `cast-vote` rejeita casas `pending`/`rejected`

### [S09] Hirelings / dummies forjados — ✅

- CHECK constraints 0–20 + validação em `upsert-house`

### [S10 + S11] Fases do concurso sem validação server-side — ✅

- `upsert-house` → fase `registration`
- `cast-vote` → fase `voting`

---

## P2 — Endurecimento complementar ✅

### [S05] Edge Functions públicas — ✅

- `verify_jwt: false` + session token HMAC + rate limiting

### [S04] Admin apenas no frontend — ✅

- `admin-update-house` valida `admin_discord_ids` server-side

### [S13] Validação fraca de URLs de imagem — ✅

- Allowlist Imgur em `_shared/validation.ts` e `src/lib/images.ts`

---

## P3 — UX e melhorias ✅

1. **Redirect de Login** — `/login` dedicada + redirect de rotas protegidas ✅
2. **Timezone** — datas UTC em `/regras` ✅
3. **Hierarquia Visual** — Minimap e Tibia Wiki destacados em `HouseDetailPage` ✅
4. **E2E Pendentes** — G07, G08, L03, L04 concluídos ✅

---

## Critérios de «done» por item

- [x] Migration ou Edge Function aplicada em produção (Supabase)
- [x] Probe/ teste de segurança do ID correspondente passa (`npm run test:security`)
- [x] Sem regressão em `npm run test:unit` e `npm run test:e2e`
- [x] Entrada atualizada em `status-dos-testes.md`

---

## Pendência operacional

| Item | Status |
|------|--------|
| `CONTEST_SESSION_SECRET` | ✅ Configurado |
| Deploy frontend (auth + fase server-side) | Push em `main` dispara GitHub Actions |

---

## Fase 4 — Correções pós-deploy ✅

| Item | Mitigação |
|------|-----------|
| Login duplo (OAuth callback) | `AuthProvider` + `apply_discord_session()` |
| E-S10 / E-S11 bypass UI | Edge Function `get-contest-phase` + `usePhase` refatorado |
| L07 | E2E `auth-callback.spec.ts` |

---

*Backlog P0–P3 + fase 4 implementados em 2026-06-17.*
