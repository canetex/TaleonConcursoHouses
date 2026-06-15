import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePhase } from '../hooks/usePhase'
import { can_vote } from '../lib/phases'
import { validate_character } from '../lib/character'
import { supabase } from '../lib/supabase'
import { SwipeCard } from '../components/SwipeCard'
import type { House, VoteType } from '../types'

export function VotePage() {
  const { is_authenticated, discord_id, login } = useAuth()
  const { phase } = usePhase()

  const [voter_character, set_voter_character] = useState('')
  const [character_valid, set_character_valid] = useState<boolean | null>(null)
  const [validating, set_validating] = useState(false)
  const [character_confirmed, set_character_confirmed] = useState(false)

  const [houses, set_houses] = useState<House[]>([])
  const [current_index, set_current_index] = useState(0)
  const [user_votes, set_user_votes] = useState<Record<string, VoteType>>({})
  const [loading, set_loading] = useState(true)

  const load_houses = useCallback(async () => {
    const { data } = await supabase
      .from('houses')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: true })

    set_houses(data ?? [])
    set_loading(false)
  }, [])

  const load_user_votes = useCallback(async () => {
    if (!discord_id) return
    const { data } = await supabase
      .from('house_votes')
      .select('house_id, vote_type')
      .eq('discord_user_id', discord_id)

    const votes_map: Record<string, VoteType> = {}
    for (const vote of data ?? []) {
      votes_map[vote.house_id] = vote.vote_type
    }
    set_user_votes(votes_map)
  }, [discord_id])

  useEffect(() => {
    load_houses()
    load_user_votes()

    const channel = supabase
      .channel('vote-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'house_votes' }, () => {
        load_user_votes()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [load_houses, load_user_votes])

  const handle_validate_character = async () => {
    set_validating(true)
    const valid = await validate_character(voter_character)
    set_character_valid(valid)
    set_validating(false)
    if (valid) set_character_confirmed(true)
  }

  const handle_vote = async (house_id: string, vote_type: VoteType) => {
    if (!discord_id || !character_confirmed) return

    const { error } = await supabase.from('house_votes').upsert(
      {
        discord_user_id: discord_id,
        voter_character: voter_character.trim(),
        house_id,
        vote_type,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'discord_user_id,house_id' },
    )

    if (!error) {
      set_user_votes((prev) => ({ ...prev, [house_id]: vote_type }))
      set_current_index((i) => Math.min(i + 1, houses.length - 1))
    }
  }

  if (!is_authenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-amber-200/70 mb-6">Faça login com Discord para votar.</p>
        <button
          onClick={() => login()}
          className="px-6 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium"
        >
          Entrar com Discord
        </button>
      </div>
    )
  }

  if (!can_vote(phase)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-amber-200/70">A votação ainda não está aberta ou já encerrou.</p>
      </div>
    )
  }

  if (!character_confirmed) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-tibia-gold mb-2">Votar nas Casas</h2>
        <div className="p-4 rounded-xl bg-tibia-green/10 border border-green-800/30 mb-6">
          <p className="text-sm text-green-300 font-medium">
            A votação é 100% gratuita! Não é necessário pagar nenhuma taxa para votar.
          </p>
        </div>

        <label className="block text-sm text-amber-200/70 mb-1">
          Nome do seu Personagem (Taleon — San) *
        </label>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={voter_character}
            onChange={(e) => {
              set_voter_character(e.target.value)
              set_character_valid(null)
            }}
            className="flex-1 px-3 py-2 rounded-lg bg-tibia-dark border border-amber-800/40 text-amber-50 focus:outline-none focus:border-tibia-gold"
          />
          <button
            onClick={handle_validate_character}
            disabled={validating || !voter_character.trim()}
            className="px-4 py-2 rounded-lg bg-tibia-accent text-amber-50 text-sm hover:bg-amber-700 disabled:opacity-50"
          >
            {validating ? '...' : 'Validar'}
          </button>
        </div>
        {character_valid === true && (
          <p className="text-xs text-green-400">✓ Personagem válido! A iniciar votação...</p>
        )}
        {character_valid === false && (
          <p className="text-xs text-red-400">✗ Personagem não encontrado no Taleon — San</p>
        )}
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-16 text-amber-200/50">A carregar casas...</div>
  }

  if (houses.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-amber-200/70">Nenhuma casa aprovada para votação.</p>
      </div>
    )
  }

  const current_house = houses[current_index]

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-tibia-gold">Votar</h2>
        <p className="text-xs text-green-300 mt-1">Votação 100% gratuita</p>
        <p className="text-xs text-amber-200/40 mt-2">
          Casa {current_index + 1} de {houses.length} · Deslize ou use os botões
        </p>
      </div>

      <SwipeCard
        key={current_house.id}
        house={current_house}
        current_vote={user_votes[current_house.id] ?? null}
        on_vote={handle_vote}
      />

      {houses.length > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => set_current_index((i) => Math.max(0, i - 1))}
            disabled={current_index === 0}
            className="text-sm px-4 py-2 rounded-lg bg-tibia-panel border border-amber-800/30 disabled:opacity-30"
          >
            ← Anterior
          </button>
          <button
            onClick={() => set_current_index((i) => Math.min(houses.length - 1, i + 1))}
            disabled={current_index === houses.length - 1}
            className="text-sm px-4 py-2 rounded-lg bg-tibia-panel border border-amber-800/30 disabled:opacity-30"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
