import { useEffect, useState } from 'react'
import type { House, LeaderboardEntry } from '../types'
import { supabase } from '../lib/supabase'
import { HouseShowcaseCard } from './HouseShowcaseCard'

interface HouseCarouselProps {
  houses: House[]
}

export function HouseCarousel({ houses }: HouseCarouselProps) {
  const [current_index, set_current_index] = useState(0)
  const [leaderboard_map, set_leaderboard_map] = useState<Record<string, LeaderboardEntry>>({})

  useEffect(() => {
    if (houses.length === 0) return

    async function load_leaderboard() {
      const ids = houses.map((house) => house.id)
      const { data } = await supabase.from('house_leaderboard').select('*').in('id', ids)
      if (!data) return

      const map: Record<string, LeaderboardEntry> = {}
      for (const entry of data) {
        map[entry.id] = entry
      }
      set_leaderboard_map(map)
    }

    void load_leaderboard()
  }, [houses])

  if (houses.length === 0) {
    return (
      <div className="text-center py-12 text-amber-200/50">
        <p className="text-4xl mb-3">🏚️</p>
        <p>Ainda não há casas inscritas. Seja o primeiro!</p>
      </div>
    )
  }

  const house = houses[current_index]
  const go_prev = () => set_current_index((i) => (i - 1 + houses.length) % houses.length)
  const go_next = () => set_current_index((i) => (i + 1) % houses.length)

  return (
    <div className="relative">
      <HouseShowcaseCard
        house={house}
        leaderboard_entry={leaderboard_map[house.id] ?? null}
        show_detail_link
        show_vote_link
      />

      {houses.length > 1 && (
        <>
          <button
            type="button"
            onClick={go_prev}
            className="absolute left-2 top-[35%] -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-amber-50 hover:bg-black/80 transition-colors z-10"
            aria-label="Casa anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={go_next}
            className="absolute right-2 top-[35%] -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-amber-50 hover:bg-black/80 transition-colors z-10"
            aria-label="Próxima casa"
          >
            ›
          </button>
          <div className="flex justify-center gap-1.5 mt-4">
            {houses.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => set_current_index(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === current_index ? 'bg-tibia-gold' : 'bg-amber-800/50'
                }`}
                aria-label={`Casa ${i + 1}: ${item.custom_name}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
