import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ContestDates, ContestPhase } from '../types'

interface ContestPhaseResponse {
  phase: ContestPhase
  dates: ContestDates
  admin_ids: string[]
}

function merge_admin_ids(db_admin_ids: string[]): string[] {
  const env_admins =
    (import.meta.env.VITE_ADMIN_DISCORD_IDS as string | undefined)
      ?.split(',')
      .map((id) => id.trim())
      .filter(Boolean) ?? []
  return [...new Set([...env_admins, ...db_admin_ids])]
}

export function usePhase() {
  const [dates, set_dates] = useState<ContestDates | null>(null)
  const [phase, set_phase] = useState<ContestPhase>('registration')
  const [admin_ids, set_admin_ids] = useState<string[]>([])
  const [loading, set_loading] = useState(true)

  const load_phase = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke<ContestPhaseResponse>('get-contest-phase')

    if (error || !data?.dates || !data.phase) {
      console.error('Failed to load contest phase:', error ?? data)
      set_loading(false)
      return
    }

    set_dates(data.dates)
    set_phase(data.phase)
    set_admin_ids(merge_admin_ids(data.admin_ids ?? []))
    set_loading(false)
  }, [])

  useEffect(() => {
    void load_phase()
    const interval = setInterval(() => {
      void load_phase()
    }, 60_000)
    return () => clearInterval(interval)
  }, [load_phase])

  return { dates, phase, admin_ids, loading }
}
