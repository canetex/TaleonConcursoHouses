import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePhase } from '../hooks/usePhase'
import { is_admin } from '../lib/auth'
import { TheCrustyLink } from '../lib/links'
import { Leaderboard } from '../components/Leaderboard'
import type { House, LeaderboardEntry } from '../types'

export function RankingPage() {
  const [entries, set_entries] = useState<LeaderboardEntry[]>([])
  const [approved_count, set_approved_count] = useState(0)
  const [loading, set_loading] = useState(true)

  useEffect(() => {
    async function load() {
      const [lb_res, count_res] = await Promise.all([
        supabase.from('house_leaderboard').select('*'),
        supabase.from('houses').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      ])

      set_entries(lb_res.data ?? [])
      set_approved_count(count_res.count ?? 0)
      set_loading(false)
    }

    load()

    const channel = supabase
      .channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'house_votes' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'houses' }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) {
    return <div className="text-center py-16 text-amber-200/50">A carregar ranking...</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-tibia-gold mb-6">Ranking & Premiação</h2>
      <Leaderboard entries={entries} approved_count={approved_count} />
    </div>
  )
}

export function AdminPage() {
  const { discord_id, is_authenticated, login, loading: auth_loading } = useAuth()
  const { admin_ids, loading: phase_loading } = usePhase()
  const [houses, set_houses] = useState<House[]>([])
  const [loading, set_loading] = useState(true)

  const user_is_admin = is_admin(discord_id, admin_ids)

  console.log('[AdminPage] access check', {
    discord_id,
    is_authenticated,
    auth_loading,
    phase_loading,
    admin_ids,
    user_is_admin,
  })

  useEffect(() => {
    if (!user_is_admin) return

    async function load() {
      const { data } = await supabase
        .from('houses')
        .select('*')
        .order('created_at', { ascending: false })

      set_houses(data ?? [])
      set_loading(false)
    }

    load()
  }, [user_is_admin])

  const update_house = async (
    house_id: string,
    updates: Partial<Pick<House, 'status' | 'organizer_votes' | 'honorable_mention' | 'dummies_count' | 'hirelings_count'>>,
  ) => {
    const { error } = await supabase
      .from('houses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', house_id)

    if (!error) {
      set_houses((prev) =>
        prev.map((h) => (h.id === house_id ? { ...h, ...updates } : h)),
      )
    }
  }

  if (!is_authenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-amber-200/70 mb-6">Login necessário para aceder ao painel admin.</p>
        <button onClick={() => login()} className="px-6 py-3 rounded-xl bg-[#5865F2] text-white">
          Entrar com Discord
        </button>
      </div>
    )
  }

  if (auth_loading || phase_loading) {
    return <div className="text-center py-16 text-amber-200/50">A carregar painel admin...</div>
  }

  if (!user_is_admin) {
    console.warn('[AdminPage] acesso negado', { discord_id, admin_ids })
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-amber-200/70 mb-2">Acesso negado ao painel admin.</p>
        <p className="text-xs text-amber-200/40">
          Discord ID atual: <code>{discord_id ?? 'não autenticado'}</code>
        </p>
      </div>
    )
  }

  const pending_houses = houses.filter((h) => h.status === 'pending')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-tibia-gold mb-2">Painel Admin</h2>
      <p className="text-sm text-amber-200/50 mb-6">
        <TheCrustyLink className="text-amber-200/50" /> · Validação de Pagamentos
      </p>

      <section className="mb-10">
        <h3 className="text-lg font-semibold text-amber-100 mb-4">
          Fila de Validação ({pending_houses.length} pendentes)
        </h3>

        {loading ? (
          <p className="text-amber-200/50">A carregar...</p>
        ) : pending_houses.length === 0 ? (
          <p className="text-amber-200/50">Nenhuma inscrição pendente.</p>
        ) : (
          <div className="space-y-4">
            {pending_houses.map((house) => (
              <div
                key={house.id}
                className="p-4 rounded-xl bg-tibia-panel border border-amber-800/30 flex flex-wrap gap-4 items-start justify-between"
              >
                <div>
                  <p className="font-semibold text-tibia-gold">{house.custom_name}</p>
                  <p className="text-sm text-amber-200/60">{house.theme}</p>
                  <p className="text-xs text-amber-200/40 mt-1">
                    {house.character_name} · {house.location} · {house.floor}
                  </p>
                  <p className="text-xs text-amber-200/40">
                    Dummies: {house.dummies_count} · Hirelings: {house.hirelings_count}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => update_house(house.id, { status: 'approved' })}
                    className="px-4 py-2 rounded-lg bg-tibia-green/80 hover:bg-tibia-green text-sm text-amber-50"
                  >
                    ✓ Aprovar (10 TC recebidos)
                  </button>
                  <button
                    onClick={() => update_house(house.id, { status: 'rejected' })}
                    className="px-4 py-2 rounded-lg bg-tibia-red/80 hover:bg-tibia-red text-sm text-amber-50"
                  >
                    ✕ Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-amber-100 mb-4">Todas as Casas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-amber-200/50 border-b border-amber-900/30">
                <th className="pb-2 pr-4">Casa</th>
                <th className="pb-2 pr-4">Estado</th>
                <th className="pb-2 pr-4">Votos Org.</th>
                <th className="pb-2 pr-4">Menção</th>
                <th className="pb-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {houses.map((house) => (
                <tr key={house.id} className="border-b border-amber-900/10">
                  <td className="py-3 pr-4">
                    <p className="text-amber-100">{house.custom_name}</p>
                    <p className="text-xs text-amber-200/40">{house.character_name}</p>
                  </td>
                  <td className="py-3 pr-4 capitalize">{house.status}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          update_house(house.id, {
                            organizer_votes: Math.max(0, house.organizer_votes - 1),
                          })
                        }
                        className="w-6 h-6 rounded bg-tibia-dark text-xs"
                      >
                        -
                      </button>
                      <span className="w-6 text-center">{house.organizer_votes}</span>
                      <button
                        onClick={() =>
                          update_house(house.id, {
                            organizer_votes: house.organizer_votes + 1,
                          })
                        }
                        className="w-6 h-6 rounded bg-tibia-dark text-xs"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() =>
                        update_house(house.id, {
                          honorable_mention: !house.honorable_mention,
                        })
                      }
                      className={`text-lg ${house.honorable_mention ? 'opacity-100' : 'opacity-30'}`}
                    >
                      🎖️
                    </button>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      {house.status !== 'approved' && (
                        <button
                          onClick={() => update_house(house.id, { status: 'approved' })}
                          className="text-xs px-2 py-1 rounded bg-tibia-green/60"
                        >
                          Aprovar
                        </button>
                      )}
                      {house.status !== 'rejected' && (
                        <button
                          onClick={() => update_house(house.id, { status: 'rejected' })}
                          className="text-xs px-2 py-1 rounded bg-tibia-red/60"
                        >
                          Rejeitar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
