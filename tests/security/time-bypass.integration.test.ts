import { describe, it } from 'vitest'
import { assert_probe_expects_rejection } from './helpers/run-probe'

// @vitest-environment node

describe('Fase 2 — bypass de fases por tempo (integração)', () => {
  it('S10: inscrição fora da fase registration deve ser rejeitada no backend', () => {
    assert_probe_expects_rejection('tests/security/probes/s10-registration-time-bypass.mjs', 'S10')
  })

  it('S11: voto fora da fase voting deve ser rejeitado no backend', () => {
    assert_probe_expects_rejection('tests/security/probes/s11-voting-time-bypass.mjs', 'S11')
  })
})
