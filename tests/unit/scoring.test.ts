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

function calc_utility_bonus_dense_rank(rank: number | null) {
  if (rank === 1) return 2
  if (rank === 2) return 1
  return 0
}

function dense_rank_utility_bonus(
  houses: Array<{ id: string; dummies: number; hirelings: number }>,
  house_id: string,
) {
  const totals = houses.map((h) => ({
    id: h.id,
    total: h.dummies + h.hirelings,
  }))
  const unique_totals = [...new Set(totals.map((h) => h.total))].sort((a, b) => b - a)
  const rank_by_total = new Map(unique_totals.map((total, index) => [total, index + 1]))
  const house = totals.find((h) => h.id === house_id)
  if (!house) return 0
  return calc_utility_bonus_dense_rank(rank_by_total.get(house.total) ?? null)
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

  it('Fase 3: empate em 1º lugar de utilidade dá +2 a todas as casas empatadas', () => {
    const houses = [
      { id: 'a', dummies: 20, hirelings: 20 },
      { id: 'b', dummies: 20, hirelings: 20 },
      { id: 'c', dummies: 10, hirelings: 10 },
    ]
    expect(dense_rank_utility_bonus(houses, 'a')).toBe(2)
    expect(dense_rank_utility_bonus(houses, 'b')).toBe(2)
    expect(dense_rank_utility_bonus(houses, 'c')).toBe(1)
  })

  it('Fase 3: empate em 2º lugar de utilidade dá +1 a todas empatadas no rank 2', () => {
    const houses = [
      { id: 'a', dummies: 20, hirelings: 20 },
      { id: 'b', dummies: 15, hirelings: 15 },
      { id: 'c', dummies: 15, hirelings: 15 },
      { id: 'd', dummies: 5, hirelings: 5 },
    ]
    expect(dense_rank_utility_bonus(houses, 'a')).toBe(2)
    expect(dense_rank_utility_bonus(houses, 'b')).toBe(1)
    expect(dense_rank_utility_bonus(houses, 'c')).toBe(1)
    expect(dense_rank_utility_bonus(houses, 'd')).toBe(0)
  })
})
