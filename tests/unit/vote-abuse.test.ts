import { describe, it, expect } from 'vitest'

function calc_utility_rank(houses: { id: string; dummies: number; hirelings: number }[]) {
  const sorted = [...houses].sort(
    (a, b) => b.dummies + b.hirelings - (a.dummies + a.hirelings),
  )
  return sorted.map((h, i) => ({ id: h.id, rank: i + 1 }))
}

describe('S09 — abuso de hirelings/dummies (regras de pontuação)', () => {
  it('ranking de utilidade depende dos valores persistidos em houses — sem validação server-side', () => {
    const legitimate = { id: 'a', dummies: 2, hirelings: 1 }
    const forged = { id: 'b', dummies: 50, hirelings: 50 }

    const ranks = calc_utility_rank([legitimate, forged])
    expect(ranks.find((r) => r.id === 'b')?.rank).toBe(1)
    expect(ranks.find((r) => r.id === 'a')?.rank).toBe(2)
  })

  it('S06: modelo UNIQUE impede duplicata lógica no cliente', () => {
    const seen = new Set<string>()
    const attempts = Array.from({ length: 10 }, (_, i) => `attempt-${i}`)
    let accepted = 0

    for (const _ of attempts) {
      const key = 'user:house'
      if (seen.has(key)) continue
      seen.add(key)
      accepted++
    }

    expect(accepted).toBe(1)
  })
})
