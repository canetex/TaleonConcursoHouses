import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { HouseShowcaseCard } from '../components/HouseShowcaseCard'
import type { House, LeaderboardEntry } from '../types'

export function HouseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [house, set_house] = useState<House | null>(null)
  const [leaderboard_entry, set_leaderboard_entry] = useState<LeaderboardEntry | null>(null)
  const [loading, set_loading] = useState(true)

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-amber-200/50 hover:text-amber-200 mb-4 inline-block">
        ← Voltar
      </Link>

      <HouseShowcaseCard
        house={house}
        leaderboard_entry={leaderboard_entry}
        show_vote_link
        show_detail_link={false}
      />
    </div>
  )
}
