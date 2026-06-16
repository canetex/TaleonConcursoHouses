import { describe, it, expect } from 'vitest'
import {
  get_current_phase,
  can_register,
  can_vote,
} from '../../src/lib/phases'
import type { ContestDates } from '../../src/types'

const dates: ContestDates = {
  registration_start: '2026-06-01T00:00:00Z',
  registration_end: '2026-06-30T00:00:00Z',
  validation_end: '2026-07-02T00:00:00Z',
  voting_end: '2026-07-17T00:00:00Z',
}

describe('phases', () => {
  it('U01: período de inscrição permite registo', () => {
    const now = new Date('2026-06-15T12:00:00Z')
    expect(get_current_phase(dates, now)).toBe('registration')
    expect(can_register('registration')).toBe(true)
    expect(can_vote('registration')).toBe(false)
  })

  it('U02: período de votação permite votar', () => {
    const now = new Date('2026-07-10T12:00:00Z')
    expect(get_current_phase(dates, now)).toBe('voting')
    expect(can_vote('voting')).toBe(true)
    expect(can_register('voting')).toBe(false)
  })

  it('U03: concurso encerrado', () => {
    const now = new Date('2026-08-01T00:00:00Z')
    expect(get_current_phase(dates, now)).toBe('ended')
    expect(can_register('ended')).toBe(false)
    expect(can_vote('ended')).toBe(false)
  })

  it('fase de validação bloqueia inscrição e votação', () => {
    const now = new Date('2026-07-01T12:00:00Z')
    expect(get_current_phase(dates, now)).toBe('validation')
    expect(can_register('validation')).toBe(false)
    expect(can_vote('validation')).toBe(false)
  })
})
