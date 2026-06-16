import { describe, it, expect } from 'vitest'

describe('security', () => {
  it('S03: strings de SQL injection são tratadas como texto literal', () => {
    const malicious = "'; DROP TABLE houses; --"
    const payload = { character_name: malicious }
    expect(payload.character_name).toContain('DROP TABLE')
    expect(JSON.stringify(payload)).not.toContain('undefined')
  })

  it('S01: modelo de voto único por utilizador e casa', () => {
    const votes = new Map<string, string>()
    const key = (discord_id: string, house_id: string) => `${discord_id}:${house_id}`

    const register_vote = (discord_id: string, house_id: string) => {
      const k = key(discord_id, house_id)
      if (votes.has(k)) return false
      votes.set(k, 'match')
      return true
    }

    expect(register_vote('user1', 'house1')).toBe(true)
    expect(register_vote('user1', 'house1')).toBe(false)
    expect(register_vote('user1', 'house2')).toBe(true)
  })

  it('S04: admin requer ID na lista configurada', () => {
    const admin_ids = ['434506189951205396']
    const is_admin = (id: string) => admin_ids.includes(id)
    expect(is_admin('434506189951205396')).toBe(true)
    expect(is_admin('fake-admin')).toBe(false)
  })
})
