import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { HouseCarousel } from '../components/HouseCarousel'
import { usePhase } from '../hooks/usePhase'
import { phase_descriptions, phase_labels } from '../lib/phases'
import { TaleonSanLink } from '../lib/links'
import type { House } from '../types'

export function HomePage() {
  const { phase, dates, loading: phase_loading } = usePhase()
  const [houses, set_houses] = useState<House[]>([])
  const [loading, set_loading] = useState(true)

  useEffect(() => {
    async function load_houses() {
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) set_houses(data)
      set_loading(false)
    }

    load_houses()

    const channel = supabase
      .channel('houses-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'houses' }, () => {
        load_houses()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <section className="text-center mb-10">
        <h2 className="text-3xl font-bold text-tibia-gold mb-3">
          Concurso de Decoração de Houses
        </h2>
        <p className="text-amber-200/70 max-w-2xl mx-auto">
          Mostre a sua criatividade no servidor <TaleonSanLink className="text-amber-100 font-semibold" />!
          Inscreva a sua casa, conquiste votos da comunidade e dispute prémios incríveis.
        </p>
        <Link
          to="/regras"
          className="inline-block mt-4 text-sm text-tibia-gold hover:underline"
        >
          Consultar regras completas do concurso →
        </Link>

        {!phase_loading && (
          <div className="mt-6 inline-flex flex-col items-center gap-2">
            <span className="px-4 py-2 rounded-full bg-tibia-accent/40 border border-amber-700/50 text-amber-100 text-sm font-medium">
              {phase_labels[phase]}
            </span>
            <p className="text-sm text-amber-200/50">{phase_descriptions[phase]}</p>
          </div>
        )}
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-amber-100">Casas Inscritas</h3>
          <div className="flex gap-2">
            <Link
              to="/inscrever"
              className="text-xs px-3 py-1.5 rounded-lg bg-tibia-gold text-tibia-dark font-semibold hover:bg-amber-400 transition-colors"
            >
              Inscrever Casa
            </Link>
            <Link
              to="/votar"
              className="text-xs px-3 py-1.5 rounded-lg bg-tibia-green/80 text-amber-50 hover:bg-tibia-green transition-colors"
            >
              Votar
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-amber-200/50">A carregar...</div>
        ) : (
          <HouseCarousel houses={houses} />
        )}
      </section>

      {dates && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          {[
            { label: 'Inscrições', date: dates.registration_end },
            { label: 'Validação', date: dates.validation_end },
            { label: 'Votação', date: dates.voting_end },
            { label: 'Resultado', date: dates.voting_end },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-tibia-panel border border-amber-900/20">
              <p className="text-amber-200/50">{item.label}</p>
              <p className="text-amber-100 font-medium mt-1">
                {new Date(item.date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
