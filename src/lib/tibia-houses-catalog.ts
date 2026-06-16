import houses_catalog from '../data/tibia-houses.json'

export interface TibiaHouseEntry {
  name: string
  city: string
  type: 'house' | 'guildhall'
  wiki_slug: string
  wiki_url: string
  size?: number
}

const catalog = houses_catalog as TibiaHouseEntry[]

export function get_cities(): string[] {
  const cities = new Set(catalog.map((entry) => entry.city))
  return [...cities].sort((a, b) => a.localeCompare(b))
}

export function get_houses_by_city(city: string, type?: 'house' | 'guildhall'): TibiaHouseEntry[] {
  return catalog.filter((entry) => {
    if (entry.city !== city) return false
    if (type && entry.type !== type) return false
    return true
  })
}

export function find_house(city: string, name: string): TibiaHouseEntry | undefined {
  return catalog.find((entry) => entry.city === city && entry.name === name)
}

export function format_location(city: string, house_name: string): string {
  return `${house_name}, ${city}`
}

export function get_tibiawiki_url(wiki_slug: string): string {
  return `https://www.tibiawiki.com.br/wiki/${encodeURIComponent(wiki_slug)}`
}
