import { describe, it, expect } from 'vitest'
import { can_register, can_vote, get_current_phase } from '../../src/lib/phases'
import type { ContestDates } from '../../src/types'

describe('S10/S11 — validação de fases só no frontend', () => {
  const ended_dates: ContestDates = {
    registration_start: '2020-01-01T00:00:00Z',
    registration_end: '2020-02-01T00:00:00Z',
    validation_end: '2020-03-01T00:00:00Z',
    voting_end: '2020-04-01T00:00:00Z',
  }

  it('S10: can_register retorna false fora da janela — mas Supabase não replica esta regra', () => {
    const phase = get_current_phase(ended_dates, new Date('2025-01-01T00:00:00Z'))
    expect(phase).toBe('ended')
    expect(can_register('ended', ended_dates, new Date('2025-01-01T00:00:00Z'))).toBe(false)
  })

  it('S11: can_vote retorna false fora da votação — backend não tem equivalente', () => {
    const registration_dates: ContestDates = {
      registration_start: '2026-01-01T00:00:00Z',
      registration_end: '2026-12-31T00:00:00Z',
      validation_end: '2027-01-15T00:00:00Z',
      voting_end: '2027-02-01T00:00:00Z',
    }
    const phase = get_current_phase(registration_dates, new Date('2026-06-01T00:00:00Z'))
    expect(phase).toBe('registration')
    expect(can_vote(phase)).toBe(false)
  })
})
