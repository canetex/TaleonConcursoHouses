import { useEffect, useId, useMemo, useState } from 'react'
import type { TibiaHouseEntry } from '../lib/tibia-houses-catalog'

interface HouseSearchSelectProps {
  houses: TibiaHouseEntry[]
  value: string
  on_change: (house_name: string) => void
  disabled?: boolean
  placeholder?: string
}

export function HouseSearchSelect({
  houses,
  value,
  on_change,
  disabled = false,
  placeholder = 'Pesquisar casa...',
}: HouseSearchSelectProps) {
  const list_id = useId()
  const [query, set_query] = useState(value)

  useEffect(() => {
    set_query(value)
  }, [value])

  const filtered_houses = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return houses
    return houses.filter((house) => house.name.toLowerCase().includes(normalized))
  }, [houses, query])

  const resolve_match = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return undefined
    return (
      houses.find((house) => house.name === trimmed) ??
      houses.find((house) => house.name.toLowerCase() === trimmed.toLowerCase())
    )
  }

  const handle_blur = () => {
    const match = resolve_match(query)
    if (match) {
      on_change(match.name)
      set_query(match.name)
      return
    }
    if (value) set_query(value)
  }

  return (
    <div>
      <input
        type="text"
        list={list_id}
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value
          set_query(next)
          const match = resolve_match(next)
          if (match) on_change(match.name)
        }}
        onBlur={handle_blur}
        className="w-full px-3 py-2 rounded-lg bg-tibia-dark border border-amber-800/40 text-amber-50 focus:outline-none focus:border-tibia-gold disabled:opacity-50"
        autoComplete="off"
      />
      <datalist id={list_id}>
        {filtered_houses.map((house) => (
          <option key={house.wiki_slug} value={house.name} />
        ))}
      </datalist>
      <p className="text-[10px] text-amber-200/40 mt-1">
        {houses.length} {houses[0]?.type === 'guildhall' ? 'guildhalls' : 'casas'} em{' '}
        {houses[0]?.city ?? 'esta cidade'} — digite para filtrar
      </p>
    </div>
  )
}
