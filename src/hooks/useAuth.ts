import { useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  get_discord_id_from_user,
  upsert_contest_user,
  sign_in_with_discord,
  sign_out,
} from '../lib/auth'
import type { ContestUser } from '../types'

interface AuthState {
  session: Session | null
  user: User | null
  contest_user: ContestUser | null
  discord_id: string | null
  loading: boolean
}

export function useAuth() {
  const [state, set_state] = useState<AuthState>({
    session: null,
    user: null,
    contest_user: null,
    discord_id: null,
    loading: true,
  })

  const sync_contest_user = useCallback(async (user: User) => {
    const discord_id = get_discord_id_from_user(user)
    if (!discord_id) return

    const metadata = user.user_metadata ?? {}
    const username =
      (typeof metadata.full_name === 'string' ? metadata.full_name : null) ??
      (typeof metadata.name === 'string' ? metadata.name : null) ??
      user.email
    const avatar =
      typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null

    const contest_user = await upsert_contest_user(
      discord_id,
      username ?? null,
      avatar,
    )

    const { data } = await supabase
      .from('contest_users')
      .select('*')
      .eq('discord_id', discord_id)
      .single()

    set_state((prev) => ({
      ...prev,
      contest_user: data ?? contest_user,
      discord_id,
    }))
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null
      set_state((prev) => ({
        ...prev,
        session,
        user,
        discord_id: user ? get_discord_id_from_user(user) : null,
        loading: false,
      }))
      if (user) sync_contest_user(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null
        set_state((prev) => ({
          ...prev,
          session,
          user,
          discord_id: user ? get_discord_id_from_user(user) : null,
          loading: false,
        }))
        if (user) await sync_contest_user(user)
        else {
          set_state((prev) => ({ ...prev, contest_user: null, discord_id: null }))
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [sync_contest_user])

  return {
    ...state,
    is_authenticated: !!state.session,
    login: sign_in_with_discord,
    logout: sign_out,
  }
}
