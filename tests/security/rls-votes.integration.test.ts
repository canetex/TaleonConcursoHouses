import { describe, it } from 'vitest'
import { assert_probe_expects_rejection } from './helpers/run-probe'

// @vitest-environment node

describe('Fase 2 — auditoria RLS house_votes (integração)', () => {
  it('S14: SELECT global em house_votes deve ser restrito (voto secreto)', () => {
    assert_probe_expects_rejection('tests/security/probes/s14-votes-select-all.mjs', 'S14')
  })

  it('S15: UPDATE de voto de rival deve ser rejeitado', () => {
    assert_probe_expects_rejection('tests/security/probes/s15-votes-update-rival.mjs', 'S15')
  })

  it('S16: DELETE de voto de rival deve ser rejeitado', () => {
    assert_probe_expects_rejection('tests/security/probes/s16-votes-delete-rival.mjs', 'S16')
  })
})
