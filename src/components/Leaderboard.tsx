import { Link } from 'react-router-dom'
import type { LeaderboardEntry } from '../types'

const FEE_PER_REGISTRATION_TC = 10
const BASE_PRIZES_GP = [30_000_000, 20_000_000, 10_000_000]
const FEE_SPLITS = [0.5, 0.35, 0.15]

interface PrizeCalculatorProps {
  approved_count: number
}

export function PrizeCalculator({ approved_count }: PrizeCalculatorProps) {
  const total_fees_tc = approved_count * FEE_PER_REGISTRATION_TC

  const prizes = BASE_PRIZES_GP.map((base_gp, i) => ({
    place: i + 1,
    base_gp,
    fee_share_tc: Math.floor(total_fees_tc * FEE_SPLITS[i]),
  }))

  const format_gp = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)} KK`
    return `${value.toLocaleString('pt-BR')} GP`
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="bg-tibia-panel rounded-2xl border border-amber-800/30 p-5">
      <h3 className="text-lg font-bold text-tibia-gold mb-1">💰 Premiação</h3>
      <p className="text-xs text-amber-200/50 mb-4">
        Base 60KK + {approved_count} inscrição(ões) aprovada(s) × 10 TC = {total_fees_tc} TC em taxas
      </p>
      <div className="space-y-3">
        {prizes.map((prize) => (
          <div
            key={prize.place}
            className="flex items-center justify-between p-3 rounded-xl bg-tibia-dark/60 border border-amber-900/20"
          >
            <span className="text-lg">{medals[prize.place - 1]}</span>
            <div className="flex-1 ml-3">
              <p className="text-sm font-semibold text-amber-100">{prize.place}º Lugar</p>
              <p className="text-xs text-amber-200/50">
                {format_gp(prize.base_gp)} + {prize.fee_share_tc} TC taxas
              </p>
            </div>
            <span className="text-sm font-bold text-tibia-gold text-right">
              {format_gp(prize.base_gp)}
              <span className="block text-xs text-amber-200/60">+ {prize.fee_share_tc} TC</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  approved_count: number
}

export function Leaderboard({ entries, approved_count }: LeaderboardProps) {
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-6">
      <PrizeCalculator approved_count={approved_count} />

      <div className="bg-tibia-panel rounded-2xl border border-amber-800/30 overflow-hidden">
        <div className="p-5 border-b border-amber-900/30">
          <h3 className="text-lg font-bold text-tibia-gold">🏆 Ranking em Tempo Real</h3>
          <p className="text-xs text-amber-200/50 mt-1">
            Pontos = (Matches ÷ 5) + (Votos Org. × 2) + Bónus Utilidade
          </p>
        </div>

        {entries.length === 0 ? (
          <p className="p-8 text-center text-amber-200/50">Nenhuma casa aprovada ainda.</p>
        ) : (
          <div className="divide-y divide-amber-900/20">
            {entries.map((entry, index) => (
              <Link
                key={entry.id}
                to={`/house/${entry.id}`}
                className="flex items-center gap-4 p-4 hover:bg-tibia-dark/40 transition-colors"
              >
                <span className="text-2xl w-10 text-center">
                  {index < 3 ? medals[index] : `#${index + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-amber-100 truncate">{entry.custom_name}</p>
                    {entry.honorable_mention && <span title="Menção Honrosa">🎖️</span>}
                  </div>
                  <p className="text-xs text-amber-200/50 truncate">{entry.theme}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-amber-200/40">
                    <span>❤️ {entry.total_matches} matches</span>
                    <span>⭐ {entry.organizer_votes} votos org.</span>
                    {entry.utility_bonus > 0 && <span>🔧 +{entry.utility_bonus} util.</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-tibia-gold">{entry.total_points}</p>
                  <p className="text-xs text-amber-200/40">pontos</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
