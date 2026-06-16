import { describe, it, expect } from 'vitest'
import {
  get_cities,
  get_houses_by_city,
  find_house,
  format_location,
} from '../../src/lib/tibia-houses-catalog'

describe('tibia-houses-catalog', () => {
  it('U11: lista cidades ordenadas', () => {
    const cities = get_cities()
    expect(cities.length).toBeGreaterThan(10)
    expect(cities).toContain('Thais')
    expect(cities).toEqual([...cities].sort((a, b) => a.localeCompare(b)))
  })

  it('U11: filtra casas por cidade e tipo', () => {
    const houses = get_houses_by_city('Thais', 'house')
    expect(houses.length).toBeGreaterThan(0)
    expect(houses.every((h) => h.city === 'Thais' && h.type === 'house')).toBe(true)
  })

  it('U11: encontra casa por cidade e nome', () => {
    const thais_houses = get_houses_by_city('Thais', 'house')
    const first = thais_houses[0]
    expect(find_house('Thais', first.name)).toEqual(first)
  })

  it('formata localização', () => {
    expect(format_location('Thais', 'Alai Flats, Flat 01')).toBe('Alai Flats, Flat 01, Thais')
  })
})
