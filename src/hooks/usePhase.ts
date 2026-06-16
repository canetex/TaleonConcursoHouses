import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { get_current_phase } from '../lib/phases'
import type { ContestDates, ContestPhase } from '../types'

export function usePhase() {
  const [dates, set_dates] = useState<ContestDates | null>(null)
  const [phase, set_phase] = useState<ContestPhase>('registration')
  const [admin_ids, set_admin_ids] = useState<string[]>([])
  const [loading, set_loading] = useState(true)

  useEffect(() => {
    async function load_config() {
      const { data, error } = await supabase.from('contest_config').select('key, value')

      if (error) {
        console.error('Failed to load contest config:', error)
        set_loading(false)
        return
      }

      const config_map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
      const contest_dates: ContestDates = {
        registration_start: config_map.registration_start ?? new Date().toISOString(),
        registration_end: config_map.registration_end ?? new Date().toISOString(),
        validation_end: config_map.validation_end ?? new Date().toISOString(),
        voting_end: config_map.voting_end ?? new Date().toISOString(),
      }

      const env_admins = (import.meta.env.VITE_ADMIN_DISCORD_IDS as string | undefined)
        ?.split(',')
        .map((id) => id.trim())
        .filter(Boolean) ?? []

      const db_admins = (config_map.admin_discord_ids ?? '')
        .split(',')
        .map((id: string) => id.trim())
        .filter(Boolean)

      console.log('[usePhase] contest_config loaded', {
        registration_start: contest_dates.registration_start,
        registration_end: contest_dates.registration_end,
        validation_end: contest_dates.validation_end,
        voting_end: contest_dates.voting_end,
        env_admins,
        db_admins,
      })

      const merged_admins = [...new Set([...env_admins, ...db_admins])]
      console.log('[usePhase] merged admin_ids', merged_admins)

      set_dates(contest_dates)
      set_phase(get_current_phase(contest_dates))
      set_admin_ids(merged_admins)
      set_loading(false)
    }

    load_config()
  }, [])

  useEffect(() => {
    if (!dates) return

    const interval = setInterval(() => {
      set_phase(get_current_phase(dates))
    }, 60_000)

    return () => clearInterval(interval)
  }, [dates])

  return { dates, phase, admin_ids, loading }
}
