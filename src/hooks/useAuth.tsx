import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  get_discord_id_from_user,
  upsert_contest_user,
  sign_in_with_discord,
  sign_out,
} from '../lib/auth'
import { get_discord_session, set_discord_session, type DiscordSession } from '../lib/session'
import type { ContestUser } from '../types'

interface AuthState {
  session: Session | null
  user: User | null
  discord_session: DiscordSession | null
  contest_user: ContestUser | null
  discord_id: string | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  is_authenticated: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  apply_discord_session: (session: DiscordSession) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function read_stored_session(): DiscordSession | null {
  if (typeof window === 'undefined') return null
  return get_discord_session()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored_session = read_stored_session()

  const [state, set_state] = useState<AuthState>({
    session: null,
    user: null,
    discord_session: stored_session,
    contest_user: null,
    discord_id: stored_session?.discord_id ?? null,
    loading: !stored_session,
  })

  const sync_contest_user = useCallback(
    async (discord_id: string, username: string | null, avatar: string | null) => {
      const profile = await upsert_contest_user(discord_id, username, avatar)

      set_state((prev) => ({
        ...prev,
        contest_user: profile,
        discord_id,
      }))
    },
    [],
  )

  const apply_discord_session = useCallback(
    (session: DiscordSession) => {
      set_discord_session(session)
      set_state((prev) => ({
        ...prev,
        discord_session: session,
        discord_id: session.discord_id,
        loading: false,
      }))
      void sync_contest_user(session.discord_id, session.discord_username, session.discord_avatar)
    },
    [sync_contest_user],
  )

  useEffect(() => {
    const stored = read_stored_session()

    if (stored) {
      set_state((prev) => ({
        ...prev,
        discord_session: stored,
        discord_id: stored.discord_id,
        loading: false,
      }))
      void sync_contest_user(stored.discord_id, stored.discord_username, stored.discord_avatar)
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
        void sync_contest_user(discord_id, username, avatar)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const logout = useCallback(async () => {
    await sign_out()
    set_state({
      session: null,
      user: null,
      discord_session: null,
      contest_user: null,
      discord_id: null,
      loading: false,
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      is_authenticated: !!state.discord_id,
      login: sign_in_with_discord,
      logout,
      apply_discord_session,
    }),
    [state, logout, apply_discord_session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
