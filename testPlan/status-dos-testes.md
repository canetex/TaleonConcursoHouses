# Status dos Testes — Taleon Concurso Houses

**Data:** 2026-06-17  
**Fase:** 4 — Auth + fase server-side  
**Pasta de testes:** `/tests/`

---

## Resultado geral

| Suite | Passou | Falhou | Skip | Total |
|-------|--------|--------|------|-------|
| Unitários (Vitest) | 32 | 0 | 0 | 32 |
| Segurança (Vitest) | **26** | 0 | 0 | 26 |
| E2E (Playwright) | **18** | 0 | 0 | 18 |
| **Total** | **77** | **0** | **0** | **77** |

Todas as vulnerabilidades documentadas na fase 2 foram mitigadas via migration RLS + Edge Functions com sessão HMAC.

---

## Vulnerabilidades — status após correções

| ID | Severidade | Status | Mitigação |
|----|------------|--------|-----------|
| **S02** | 🔴 Crítico | ✅ Resolvida | REVOKE UPDATE em `houses` + `upsert-house` |
| **S08** | 🟠 Alto | ✅ Resolvida | `cast-vote` valida `status = approved` |
| **S09** | 🟠 Alto | ✅ Resolvida | CHECK 0–20 + validação em `upsert-house` |
| **S10** | 🟠 Alto | ✅ Resolvida | `upsert-house` valida fase `registration` |
| **S11** | 🟠 Alto | ✅ Resolvida | `cast-vote` valida fase `voting` |
| **S14** | 🟠 Alto | ✅ Resolvida | REVOKE SELECT em `house_votes` + `get-my-votes` |
| **S15** | 🔴 Crítico | ✅ Resolvida | REVOKE UPDATE em `house_votes` + `cast-vote` |
| **S17** | 🟡 Médio | ✅ Resolvida | REVOKE SELECT público em `contest_users` |
| **S18** | 🔴 Crítico | ✅ Resolvida | REVOKE UPDATE em `contest_users` + `update-profile` |
| **S04** | 🟠 Alto | ✅ Resolvida | `admin-update-house` valida admin server-side |
| **S13** | 🟡 Médio | ✅ Resolvida | Allowlist Imgur em `validation.ts` + `images.ts` |
| **E-S10/E-S11** | 🟡 Médio | ✅ Resolvida | `get-contest-phase` calcula fase no servidor; UI não confia no relógio do browser |

### Comportamentos seguros confirmados

| ID | Resultado |
|----|-----------|
| S05 | Edge Functions com auth customizada (session token HMAC) + rate limit |
| S06 | Concorrência: UNIQUE `(discord_user_id, house_id)` + upsert → 1 voto |
| S07 | FK rejeita `house_id` inexistente |
| S16 | DELETE em `house_votes` negado (sem política DELETE) |
| S12 / E-S12 | SVG malicioso não executa script |

---

## Testes unitários — `tests/unit/` (32/32 ✅)

Inclui fase 1 (U01–U11, S01/S03/S04) + fase 2:

| Arquivo | IDs | Testes |
|---------|-----|--------|
| `vote-abuse.test.ts` | S06, S09 | 2 |
| `time-bypass.test.ts` | S10, S11 | 2 |
| `image-security.test.ts` | S12, S13 | 4 |

---

## Testes de segurança — `tests/security/` (26/26 ✅)

| Arquivo | Cenários | Resultado |
|---------|----------|-----------|
| `rls-policy-static.test.ts` | S02, S06, S14–S18 (estático) | ✅ |
| `s02-unauthorized-house-update.test.ts` | S02 | ✅ |
| `vote-abuse.integration.test.ts` | S06–S09 | ✅ |
| `time-bypass.integration.test.ts` | S10, S11 | ✅ |
| `rls-votes.integration.test.ts` | S14–S16 | ✅ |
| `rls-users.integration.test.ts` | S17, S18 | ✅ |
| `edge-functions.test.ts` | S05 + novas funções | ✅ |

**Probes:** `tests/security/probes/s02, s06–s18-probe.mjs` — todos exit 0

---

## Testes E2E — `tests/e2e/` (17/17 ✅)

| ID | Cenário | Status |
|----|---------|--------|
| G01–G08 | Rotas públicas e protegidas | ✅ |
| L01–L06 | Fluxos logado + admin | ✅ |
| L03, L04 | Inscrição/edição via `upsert-house` | ✅ |
| L07 | Callback OAuth aplica sessão no primeiro login | ✅ |
| E-S10 | Relógio manipulado → inscrição bloqueada (fase servidor) | ✅ |
| E-S11 | Relógio manipulado → votação bloqueada (fase servidor) | ✅ |
| E-S12 | SVG malicioso não dispara dialog | ✅ |

---

## Comandos

```bash
npm run test:unit          # 32 testes
npm run test:security      # 26 testes
npm run test:e2e           # 17 testes
npm run test:all           # suíte completa

# Probe individual
node tests/security/probes/s14-votes-select-all.mjs
# exit 0 = seguro | 1 = vulnerável | 2 = skip
```

---

## Deploy em produção

| Item | Status |
|------|--------|
| Migration `20260617120000_security_hardening.sql` | ✅ Aplicada |
| Edge Functions (6 novas/atualizadas) | ✅ Deployadas |
| `get-contest-phase` | ✅ Fase calculada no servidor |
| Secret `CONTEST_SESSION_SECRET` | ✅ Configurado pelo utilizador |

---

## Conclusão

A fase 3 fechou **8 vulnerabilidades RLS/API** críticas e altas, migrou escritas para Edge Functions com token de sessão HMAC, e expandiu a suíte para **75 testes** sem falhas. O bypass de fase via manipulação de relógio no browser permanece possível na UI, mas a API rejeita operações fora da fase correta.
