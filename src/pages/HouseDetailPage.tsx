import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ImageWithFallback } from '../components/ImageWithFallback'
import { ImageLightbox } from '../components/ImageLightbox'
import { ShareHouseModal } from '../components/ShareHouseModal'
import { HouseMinimap } from '../components/HouseMinimap'
import { CharacterProfileLink, TibiaWikiHouseLink } from '../lib/links'
import { get_house_permalink } from '../lib/permalink'
import { fetch_house_coords } from '../lib/tibia-houses'
import type { House, LeaderboardEntry } from '../types'

export function HouseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [house, set_house] = useState<House | null>(null)
  const [leaderboard_entry, set_leaderboard_entry] = useState<LeaderboardEntry | null>(null)
  const [loading, set_loading] = useState(true)
  const [image_index, set_image_index] = useState(0)
  const [lightbox_src, set_lightbox_src] = useState<string | null>(null)
  const [share_open, set_share_open] = useState(false)
  const [map_coords, set_map_coords] = useState<{ x: number; y: number; z: number } | null>(null)

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

  useEffect(() => {
    if (!house) return

    if (house.map_x != null && house.map_y != null && house.map_z != null) {
      set_map_coords({ x: house.map_x, y: house.map_y, z: house.map_z })
      return
    }

    if (!house.house_wiki_slug) return

    let cancelled = false
    fetch_house_coords(house.house_wiki_slug).then((coords) => {
      if (!cancelled && coords) set_map_coords(coords)
    })

    return () => {
      cancelled = true
    }
  }, [house])

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
  const display_location =
    house.house_tibia_name && house.house_city
      ? `${house.house_tibia_name}, ${house.house_city}`
      : house.location

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-amber-200/50 hover:text-amber-200 mb-4 inline-block">
        ← Voltar
      </Link>

      <div className="bg-tibia-panel rounded-2xl border border-amber-800/30 overflow-hidden">
        {images.length > 0 ? (
          <div className="relative bg-black/40 min-h-[240px] max-h-[70vh] flex items-center justify-center">
            <ImageWithFallback
              src={images[image_index]}
              alt={house.custom_name}
              className="w-full max-h-[70vh] object-contain"
              on_click={(display_src) => set_lightbox_src(display_src)}
            />
            <p className="absolute bottom-2 right-3 text-[10px] text-amber-200/40 pointer-events-none">
              Clique para ampliar
            </p>
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
              {house.house_wiki_slug && (
                <p className="text-sm mt-2 text-amber-200/60">
                  Casa:{' '}
                  <TibiaWikiHouseLink
                    wiki_slug={house.house_wiki_slug}
                    house_name={house.house_tibia_name ?? undefined}
                    className="text-tibia-gold"
                  />
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => set_share_open(true)}
                className="px-3 py-1.5 rounded-lg border border-amber-700/40 text-amber-100 text-sm hover:bg-tibia-dark/60 transition-colors"
                aria-label="Compartilhar casa"
              >
                ↗ Compartilhar
              </button>
              {house.honorable_mention && (
                <span className="px-3 py-1 rounded-full bg-tibia-gold/20 text-tibia-gold text-sm whitespace-nowrap">
                  🎖️ Menção Honrosa
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 text-sm">
            <div className="p-3 rounded-xl bg-tibia-dark/60">
              <p className="text-amber-200/50 text-xs">Localização</p>
              <p className="text-amber-100">
                {house.house_wiki_slug ? (
                  <TibiaWikiHouseLink
                    wiki_slug={house.house_wiki_slug}
                    house_name={display_location}
                    className="text-amber-100"
                  />
                ) : (
                  display_location
                )}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-tibia-dark/60">
              <p className="text-amber-200/50 text-xs">Andar</p>
              <p className="text-amber-100">{house.floor}</p>
            </div>
            <div className="p-3 rounded-xl bg-tibia-dark/60">
              <p className="text-amber-200/50 text-xs">Personagem</p>
              <p className="text-amber-100">
                <CharacterProfileLink character_name={house.character_name} className="text-amber-100" />
              </p>
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

          {map_coords && (
            <div className="mt-6 p-4 rounded-2xl bg-tibia-accent/10 border-2 border-tibia-gold/40">
              <h3 className="text-sm font-semibold text-tibia-gold mb-3 flex items-center gap-2">
                <span aria-hidden>🗺️</span> Localização no mapa
              </h3>
              <HouseMinimap
                x={map_coords.x}
                y={map_coords.y}
                z={map_coords.z}
                house_name={house.house_tibia_name ?? house.custom_name}
                wiki_url={house.house_wiki_url}
              />
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <CharacterProfileLink
              character_name={house.character_name}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-tibia-dark/80 border border-amber-700/40 text-tibia-gold text-sm font-medium hover:border-tibia-gold/60 transition-colors"
            />
            {house.house_wiki_slug && (
              <TibiaWikiHouseLink
                wiki_slug={house.house_wiki_slug}
                house_name={house.house_tibia_name ?? 'Ver na Tibia Wiki'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-tibia-dark/80 border border-amber-700/40 text-amber-100 text-sm font-medium hover:border-tibia-gold/60 transition-colors"
              />
            )}
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

      {lightbox_src && (
        <ImageLightbox
          src={lightbox_src}
          alt={house.custom_name}
          on_close={() => set_lightbox_src(null)}
        />
      )}

      {share_open && (
        <ShareHouseModal
          permalink={get_house_permalink(house.id)}
          house_name={house.custom_name}
          on_close={() => set_share_open(false)}
        />
      )}
    </div>
  )
}
