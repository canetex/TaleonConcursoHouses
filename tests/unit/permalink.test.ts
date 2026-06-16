import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get_house_permalink } from '../../src/lib/permalink'

describe('permalink', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { location: { origin: 'https://canetex.github.io' } })
  })

  it('U08: gera permalink contendo origem e id da casa', () => {
    const url = get_house_permalink('abc-123')
    expect(url).toMatch(/^https:\/\/canetex\.github\.io/)
    expect(url).toContain('/house/abc-123')
  })
})
