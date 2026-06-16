import { describe, it } from 'vitest'
import { assert_probe_expects_rejection } from './helpers/run-probe'

// @vitest-environment node

describe('Fase 2 — abuso de votação (integração)', () => {
  it('S06: concorrência paralela mantém 1 voto por (discord_id, house_id)', () => {
    assert_probe_expects_rejection('tests/security/probes/s06-vote-race.mjs', 'S06')
  })

  it('S07: voto em casa inexistente é rejeitado por FK', () => {
    assert_probe_expects_rejection('tests/security/probes/s07-vote-invalid-house.mjs', 'S07')
  })

  it('S08: voto em casa pending deve ser rejeitado no backend', () => {
    assert_probe_expects_rejection('tests/security/probes/s08-vote-pending-house.mjs', 'S08')
  })

  it('S09: hirelings/dummies forjados não devem ser aceites', () => {
    assert_probe_expects_rejection('tests/security/probes/s09-forged-hirelings.mjs', 'S09')
  })
})
