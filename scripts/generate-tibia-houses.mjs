/**
 * Gera src/data/tibia-houses.json a partir da TibiaData API + Fandom Wiki (fallback).
 * Executar: node scripts/generate-tibia-houses.mjs
 */

const WORLD = 'Antica'
const TOWNS = [
  { api: 'Ab Dendriel', city: "Ab'Dendriel" },
  { api: 'Ankrahmun', city: 'Ankrahmun' },
  { api: 'Carlin', city: 'Carlin' },
  { api: 'Darashia', city: 'Darashia' },
  { api: 'Edron', city: 'Edron' },
  { api: 'Farmine', city: 'Farmine' },
  { api: 'Gray Beach', city: 'Gray Beach' },
  { api: 'Kazordoon', city: 'Kazordoon' },
  { api: 'Liberty Bay', city: 'Liberty Bay' },
  { api: 'Port Hope', city: 'Port Hope' },
  { api: 'Rathleton', city: 'Rathleton' },
  { api: 'Svargrond', city: 'Svargrond' },
  { api: 'Thais', city: 'Thais' },
  { api: 'Venore', city: 'Venore' },
  { api: 'Yalahar', city: 'Yalahar' },
  { api: 'Issavi', city: 'Issavi' },
  { api: 'Roshamuul', city: 'Roshamuul' },
  { api: 'Candia', city: 'Candia' },
  { api: 'Moonfall', city: 'Moonfall' },
  { api: 'Silvertides', city: 'Silvertides' },
  { api: 'Soulpit', city: 'Soulpit' },
]

function to_wiki_slug(name) {
  return name.replace(/ /g, '_')
}

function to_wiki_url(name) {
  return `https://www.tibiawiki.com.br/wiki/${encodeURIComponent(to_wiki_slug(name))}`
}

async function fetch_houses(town) {
  const url = `https://api.tibiadata.com/v4/houses/${WORLD}/${encodeURIComponent(town)}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  if (data.information?.status?.http_code !== 200) return []
  return data.houses?.house_list ?? []
}

async function fetch_fandom_category_members(category_title) {
  const url = `https://tibia.fandom.com/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(category_title)}&cmlimit=500&format=json`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return (data.query?.categorymembers ?? []).filter((entry) => entry.ns === 0).map((entry) => entry.title)
}

async function fetch_houses_from_fandom(city) {
  const category = `Category:${city.replace(/ /g, '_')}_Houses`
  return fetch_fandom_category_members(category)
}

async function fetch_guildhalls_from_fandom(city) {
  const category = `Category:${city.replace(/ /g, '_')}_Guildhalls`
  return fetch_fandom_category_members(category)
}

const catalog = []
const seen = new Set()

function add_entry(entry) {
  const key = `${entry.city}|${entry.name}|${entry.type}`
  if (seen.has(key)) return
  seen.add(key)
  catalog.push(entry)
}

for (const town of TOWNS) {
  const { api, city } = town
  console.log(`Fetching ${city}...`)

  const [houses, fandom_houses, guildhall_names] = await Promise.all([
    fetch_houses(api),
    fetch_houses_from_fandom(city),
    fetch_guildhalls_from_fandom(city),
  ])

  for (const house of houses) {
    add_entry({
      name: house.name,
      city,
      type: 'house',
      wiki_slug: to_wiki_slug(house.name),
      wiki_url: to_wiki_url(house.name),
      size: house.size,
    })
  }

  for (const house_name of fandom_houses) {
    add_entry({
      name: house_name,
      city,
      type: 'house',
      wiki_slug: to_wiki_slug(house_name),
      wiki_url: to_wiki_url(house_name),
    })
  }

  for (const hall_name of guildhall_names) {
    add_entry({
      name: hall_name,
      city,
      type: 'guildhall',
      wiki_slug: to_wiki_slug(hall_name),
      wiki_url: to_wiki_url(hall_name),
    })
  }

  await new Promise((r) => setTimeout(r, 200))
}

catalog.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name))

const fs = await import('node:fs')
const path = await import('node:path')
const out_path = path.join(process.cwd(), 'src', 'data', 'tibia-houses.json')
fs.mkdirSync(path.dirname(out_path), { recursive: true })
fs.writeFileSync(out_path, JSON.stringify(catalog, null, 2))
console.log(`Wrote ${catalog.length} entries to ${out_path}`)

const by_type = catalog.reduce((acc, e) => {
  acc[e.type] = (acc[e.type] || 0) + 1
  return acc
}, {})
console.log('By type:', by_type)
