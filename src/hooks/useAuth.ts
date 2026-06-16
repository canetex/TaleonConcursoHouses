import { useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  get_discord_id_from_user,
  upsert_contest_user,
  sign_in_with_discord,
  sign_out,
} from '../lib/auth'
import { get_discord_session, type DiscordSession } from '../lib/session'
import type { ContestUser } from '../types'

interface AuthState {
  session: Session | null
  user: User | null
  discord_session: DiscordSession | null
  contest_user: ContestUser | null
  discord_id: string | null
  loading: boolean
}

export function useAuth() {
  const [state, set_state] = useState<AuthState>({
    session: null,
    user: null,
    discord_session: null,
    contest_user: null,
    discord_id: null,
    loading: true,
  })

  const sync_contest_user = useCallback(async (discord_id: string, username: string | null, avatar: string | null) => {
    await upsert_contest_user(discord_id, username, avatar)

    const { data } = await supabase
      .from('contest_users')
      .select('*')
      .eq('discord_id', discord_id)
      .single()

    set_state((prev) => ({
      ...prev,
      contest_user: data,
      discord_id,
    }))
  }, [])

  useEffect(() => {
    const stored = get_discord_session()

    if (stored) {
      set_state((prev) => ({
        ...prev,
        discord_session: stored,
        discord_id: stored.discord_id,
        loading: false,
      }))
      sync_contest_user(stored.discord_id, stored.discord_username, stored.discord_avatar)
    } else {
      set_state((prev) => ({ ...prev, loading: false }))
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null
      const discord_id = user ? get_discord_id_from_user(user) : null

      if (discord_id && !stored) {
        set_state((prev) => ({
          ...prev,
          session,
          user,
          discord_id,
        }))
        const metadata = user?.user_metadata ?? {}
        const username =
          (typeof metadata.full_name === 'string' ? metadata.full_name : null) ??
          (typeof metadata.name === 'string' ? metadata.name : null) ??
          user?.email ??
          null
        const avatar = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null
        sync_contest_user(discord_id, username, avatar)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      const discord_id = user ? get_discord_id_from_user(user) : null

      set_state((prev) => ({
        ...prev,
        session,
        user,
        discord_id: prev.discord_id ?? discord_id,
      }))
    })

    return () => subscription.unsubscribe()
  }, [sync_contest_user])

  const logout = async () => {
    await sign_out()
    set_state({
      session: null,
      user: null,
      discord_session: null,
      contest_user: null,
      discord_id: null,
      loading: false,
    })
  }

  return {
    ...state,
    is_authenticated: !!state.discord_id,
    login: sign_in_with_discord,
    logout,
  }
}
