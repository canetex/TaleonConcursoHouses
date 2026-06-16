import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { HouseCarousel } from '../components/HouseCarousel'
import { usePhase } from '../hooks/usePhase'
import { phase_descriptions, phase_labels } from '../lib/phases'
import { CONTEST_LOGO_ALT, CONTEST_LOGO_URL } from '../lib/assets'
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <section className="mb-10">
        <div className="rounded-2xl border border-brand-olive/25 bg-tibia-panel/70 px-5 py-8 sm:px-8 shadow-lg shadow-black/20">
          <div className="max-w-2xl mx-auto text-center">
            <img
              src={CONTEST_LOGO_URL}
              alt={CONTEST_LOGO_ALT}
              className="contest-logo mx-auto w-44 sm:w-56 max-w-full mb-5 drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            />
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-cream mb-4 text-balance leading-tight">
              Concurso de Decoração de Houses
            </h2>
            <p className="text-amber-200/70 text-sm sm:text-base leading-relaxed text-balance">
              Mostre a sua criatividade no servidor{' '}
              <TaleonSanLink className="text-amber-100 font-semibold whitespace-nowrap" />
              . Inscreva a sua casa, conquiste votos da comunidade e dispute prémios incríveis.
            </p>
            <Link
              to="/regras"
              className="inline-flex items-center gap-1 mt-5 text-sm text-tibia-gold hover:underline"
            >
              Consultar regras completas do concurso
              <span aria-hidden>→</span>
            </Link>
          </div>

          {!phase_loading && (
            <div className="mt-6 pt-6 border-t border-amber-800/25 max-w-xl mx-auto text-center">
              <span className="inline-block px-4 py-2 rounded-full bg-tibia-accent/40 border border-amber-700/50 text-amber-100 text-sm font-medium">
                {phase_labels[phase]}
              </span>
              <p className="mt-3 text-sm text-amber-200/60 leading-relaxed text-balance px-2">
                {phase_descriptions[phase]}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-amber-100">Casas Inscritas</h3>
          <div className="flex gap-2">
            <Link
              to="/inscrever"
              className="text-xs px-3 py-1.5 rounded-lg bg-brand-brandy text-brand-smoke font-semibold hover:brightness-110 transition-colors"
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
