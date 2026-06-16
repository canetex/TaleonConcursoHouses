import { describe, it, expect } from 'vitest'

// Espelha a fórmula da view house_leaderboard no Supabase
function calc_popular_points(matches: number) {
  return Math.floor(matches / 5)
}

function calc_organizer_points(organizer_votes: number) {
  return organizer_votes * 2
}

function calc_utility_bonus(utility_rank: number | null) {
  if (utility_rank === 1) return 2
  if (utility_rank === 2) return 1
  return 0
}

function calc_total_points(
  matches: number,
  organizer_votes: number,
  utility_rank: number | null,
) {
  return calc_popular_points(matches) + calc_organizer_points(organizer_votes) + calc_utility_bonus(utility_rank)
}

describe('scoring', () => {
  it('U10: pontos populares = floor(matches / 5)', () => {
    expect(calc_popular_points(0)).toBe(0)
    expect(calc_popular_points(4)).toBe(0)
    expect(calc_popular_points(5)).toBe(1)
    expect(calc_popular_points(12)).toBe(2)
  })

  it('U10: pontos do organizador = votos × 2', () => {
    expect(calc_organizer_points(3)).toBe(6)
  })

  it('U10: bónus de utilidade para top 2', () => {
    expect(calc_utility_bonus(1)).toBe(2)
    expect(calc_utility_bonus(2)).toBe(1)
    expect(calc_utility_bonus(3)).toBe(0)
  })

  it('U10: total combina todas as componentes', () => {
    expect(calc_total_points(10, 2, 1)).toBe(2 + 4 + 2)
  })
})
