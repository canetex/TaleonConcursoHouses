import { useState } from 'react'
import type { House } from '../types'

interface HouseCarouselProps {
  houses: House[]
}

export function HouseCarousel({ houses }: HouseCarouselProps) {
  const [current_index, set_current_index] = useState(0)

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
      <div className="bg-tibia-panel rounded-2xl border border-amber-800/30 overflow-hidden shadow-xl">
        {house.screenshot_urls[0] ? (
          <div className="aspect-video bg-black/40 relative">
            <img
              src={house.screenshot_urls[0]}
              alt={house.custom_name}
              className="w-full h-full object-cover"
            />
            {house.honorable_mention && (
              <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-tibia-gold text-tibia-dark text-xs font-bold">
                🎖️ Menção Honrosa
              </span>
            )}
          </div>
        ) : (
          <div className="aspect-video bg-tibia-dark flex items-center justify-center text-6xl">
            🏠
          </div>
        )}

        <div className="p-5">
          <h3 className="text-xl font-bold text-tibia-gold">{house.custom_name}</h3>
          <p className="text-sm text-amber-200/70 mt-1">{house.theme}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-amber-200/50">
            <span>📍 {house.location}</span>
            <span>🏢 {house.floor}</span>
            <span>👤 {house.character_name}</span>
            <span
              className={`px-2 py-0.5 rounded-full ${
                house.status === 'approved'
                  ? 'bg-tibia-green/30 text-green-300'
                  : house.status === 'rejected'
                    ? 'bg-tibia-red/30 text-red-300'
                    : 'bg-amber-900/30 text-amber-300'
              }`}
            >
              {house.status === 'approved' ? 'Aprovada' : house.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
            </span>
          </div>
        </div>
      </div>

      {houses.length > 1 && (
        <>
          <button
            onClick={go_prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-amber-50 hover:bg-black/80 transition-colors"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            onClick={go_next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-amber-50 hover:bg-black/80 transition-colors"
            aria-label="Próxima"
          >
            ›
          </button>
          <div className="flex justify-center gap-1.5 mt-4">
            {houses.map((_, i) => (
              <button
                key={i}
                onClick={() => set_current_index(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === current_index ? 'bg-tibia-gold' : 'bg-amber-800/50'
                }`}
                aria-label={`Casa ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
