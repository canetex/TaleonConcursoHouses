import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { House, LeaderboardEntry } from '../types'

export function HouseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [house, set_house] = useState<House | null>(null)
  const [leaderboard_entry, set_leaderboard_entry] = useState<LeaderboardEntry | null>(null)
  const [loading, set_loading] = useState(true)
  const [image_index, set_image_index] = useState(0)

  useEffect(() => {
    if (!id) return

    async function load() {
      const [house_res, lb_res] = await Promise.all([
        supabase.from('houses').select('*').eq('id', id).single(),
        supabase.from('house_leaderboard').select('*').eq('id', id).maybeSingle(),
      ])

      if (house_res.data) set_house(house_res.data)
      if (lb_res.data) set_leaderboard_entry(lb_res.data)
      set_loading(false)
    }

    load()
  }, [id])

  if (loading) {
    return <div className="text-center py-16 text-amber-200/50">A carregar...</div>
  }

  if (!house) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-amber-200/70">Casa não encontrada.</p>
        <Link to="/" className="text-tibia-gold hover:underline text-sm mt-4 inline-block">
          ← Voltar ao início
        </Link>
      </div>
    )
  }

  const images = house.screenshot_urls

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-amber-200/50 hover:text-amber-200 mb-4 inline-block">
        ← Voltar
      </Link>

      <div className="bg-tibia-panel rounded-2xl border border-amber-800/30 overflow-hidden">
        {images.length > 0 ? (
          <div className="aspect-video relative bg-black/40">
            <img
              src={images[image_index]}
              alt={house.custom_name}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => set_image_index((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white"
                >
                  ‹
                </button>
                <button
                  onClick={() => set_image_index((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white"
                >
                  ›
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="aspect-video flex items-center justify-center text-8xl bg-tibia-dark">🏠</div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-tibia-gold">{house.custom_name}</h2>
              <p className="text-amber-200/70 mt-1 italic">"{house.theme}"</p>
            </div>
            {house.honorable_mention && (
              <span className="px-3 py-1 rounded-full bg-tibia-gold/20 text-tibia-gold text-sm whitespace-nowrap">
                🎖️ Menção Honrosa
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 text-sm">
            <div className="p-3 rounded-xl bg-tibia-dark/60">
              <p className="text-amber-200/50 text-xs">Localização</p>
              <p className="text-amber-100">{house.location}</p>
            </div>
            <div className="p-3 rounded-xl bg-tibia-dark/60">
              <p className="text-amber-200/50 text-xs">Andar</p>
              <p className="text-amber-100">{house.floor}</p>
            </div>
            <div className="p-3 rounded-xl bg-tibia-dark/60">
              <p className="text-amber-200/50 text-xs">Personagem</p>
              <p className="text-amber-100">{house.character_name}</p>
            </div>
            <div className="p-3 rounded-xl bg-tibia-dark/60">
              <p className="text-amber-200/50 text-xs">Dummies</p>
              <p className="text-amber-100">{house.dummies_count}</p>
            </div>
            <div className="p-3 rounded-xl bg-tibia-dark/60">
              <p className="text-amber-200/50 text-xs">Hirelings</p>
              <p className="text-amber-100">{house.hirelings_count}</p>
            </div>
            <div className="p-3 rounded-xl bg-tibia-dark/60">
              <p className="text-amber-200/50 text-xs">Estado</p>
              <p className="text-amber-100 capitalize">{house.status}</p>
            </div>
          </div>

          {leaderboard_entry && (
            <div className="mt-5 p-4 rounded-xl bg-tibia-accent/10 border border-amber-700/30">
              <p className="text-sm text-amber-200/70">Pontuação atual</p>
              <p className="text-3xl font-bold text-tibia-gold">{leaderboard_entry.total_points} pts</p>
              <div className="flex gap-4 mt-2 text-xs text-amber-200/50">
                <span>❤️ {leaderboard_entry.total_matches} matches</span>
                <span>⭐ {leaderboard_entry.organizer_points} pts org.</span>
                <span>🔧 +{leaderboard_entry.utility_bonus} util.</span>
              </div>
            </div>
          )}

          <Link
            to="/votar"
            className="mt-6 block text-center py-3 rounded-xl bg-tibia-green/80 hover:bg-tibia-green text-amber-50 font-medium transition-colors"
          >
            Votar nesta Casa
          </Link>
        </div>
      </div>
    </div>
  )
}
