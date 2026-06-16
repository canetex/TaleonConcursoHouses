import { describe, it } from 'vitest'
import { assert_probe_expects_rejection } from './helpers/run-probe'

// @vitest-environment node

describe('Fase 2 — auditoria RLS contest_users (integração)', () => {
  it('S17: leitura de perfis alheios deve ser restrita', () => {
    assert_probe_expects_rejection('tests/security/probes/s17-users-read-others.mjs', 'S17')
  })

  it('S18: UPDATE de perfil alheio deve ser rejeitado', () => {
    assert_probe_expects_rejection('tests/security/probes/s18-users-update-others.mjs', 'S18')
  })
})
