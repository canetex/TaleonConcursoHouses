import { supabase } from './supabase'
import type { ContestUser } from '../types'

export function get_discord_id_from_user(user: {
  user_metadata?: Record<string, unknown>
  identities?: Array<{ provider: string; id: string }>
}): string | null {
  const metadata = user.user_metadata ?? {}
  if (typeof metadata.provider_id === 'string') return metadata.provider_id
  if (typeof metadata.sub === 'string') return metadata.sub

  const discord_identity = user.identities?.find((i) => i.provider === 'discord')
  if (discord_identity?.id) return discord_identity.id

  return null
}

export async function sign_in_with_discord(): Promise<void> {
  const redirect_to = `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: redirect_to,
      scopes: 'identify',
    },
  })
  if (error) throw error
}

export async function sign_out(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function upsert_contest_user(
  discord_id: string,
  discord_username: string | null,
  discord_avatar: string | null,
): Promise<ContestUser | null> {
  const { data, error } = await supabase
    .from('contest_users')
    .upsert(
      {
        discord_id,
        discord_username,
        discord_avatar,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'discord_id' },
    )
    .select()
    .single()

  if (error) {
    console.error('Failed to upsert contest user:', error)
    return null
  }
  return data
}

export function is_admin(discord_id: string | null, admin_ids: string[]): boolean {
  if (!discord_id) return false
  return admin_ids.includes(discord_id)
}

export function format_discord_avatar(
  discord_id: string,
  avatar_hash: string | null,
): string {
  if (!avatar_hash) {
    const default_index = Number(BigInt(discord_id) % 6n)
    return `https://cdn.discordapp.com/embed/avatars/${default_index}.png`
  }
  return `https://cdn.discordapp.com/avatars/${discord_id}/${avatar_hash}.png`
}
