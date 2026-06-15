import type { ContestDates, ContestPhase } from '../types'

export function get_current_phase(dates: ContestDates, now = new Date()): ContestPhase {
  const registration_start = new Date(dates.registration_start)
  const registration_end = new Date(dates.registration_end)
  const validation_end = new Date(dates.validation_end)
  const voting_end = new Date(dates.voting_end)

  if (now < registration_start) return 'registration'
  if (now < registration_end) return 'registration'
  if (now < validation_end) return 'validation'
  if (now < voting_end) return 'voting'
  return 'ended'
}

export const phase_labels: Record<ContestPhase, string> = {
  registration: 'Inscrições Abertas',
  validation: 'Validação de Pagamentos',
  voting: 'Votação Aberta',
  ended: 'Concurso Encerrado',
}

export const phase_descriptions: Record<ContestPhase, string> = {
  registration: 'Inscreva a sua casa decorada! A votação ainda não está disponível.',
  validation: 'Inscrições encerradas. A organização está a validar os pagamentos das taxas.',
  voting: 'Deslize para votar nas casas aprovadas! A votação é 100% gratuita.',
  ended: 'O concurso terminou. Consulte o ranking final.',
}

export function can_register(phase: ContestPhase): boolean {
  return phase === 'registration'
}

export function can_vote(phase: ContestPhase): boolean {
  return phase === 'voting'
}
