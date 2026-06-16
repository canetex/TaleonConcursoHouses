import { supabase } from './supabase'
import { clear_discord_session, set_discord_session, type DiscordSession } from './session'
import type { ContestUser } from '../types'

const DISCORD_AUTHORIZE_URL = 'https://discord.com/api/oauth2/authorize'
const DEFAULT_DISCORD_CLIENT_ID = '1516151956291190884'
const PKCE_VERIFIER_KEY = 'taleon_discord_pkce_verifier'

function base64_url_encode(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function generate_code_verifier(): string {
  const random_bytes = new Uint8Array(32)
  crypto.getRandomValues(random_bytes)
  return base64_url_encode(random_bytes)
}

async function generate_code_challenge(code_verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code_verifier))
  return base64_url_encode(new Uint8Array(digest))
}

export function get_discord_client_id(): string {
  return import.meta.env.VITE_DISCORD_CLIENT_ID ?? DEFAULT_DISCORD_CLIENT_ID
}

export function get_auth_callback_url(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${window.location.origin}${base}/auth/callback`
}

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
  const client_id = get_discord_client_id()
  const redirect_uri = get_auth_callback_url()
  const code_verifier = generate_code_verifier()
  const code_challenge = await generate_code_challenge(code_verifier)

  sessionStorage.setItem(PKCE_VERIFIER_KEY, code_verifier)

  const params = new URLSearchParams({
    client_id,
    redirect_uri,
    response_type: 'code',
    scope: 'identify',
    code_challenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${DISCORD_AUTHORIZE_URL}?${params.toString()}`
}

export async function complete_discord_auth(code: string): Promise<DiscordSession | null> {
  const redirect_uri = get_auth_callback_url()
  const code_verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY)
  sessionStorage.removeItem(PKCE_VERIFIER_KEY)

  const { data, error } = await supabase.functions.invoke('discord-auth', {
    body: { code, redirect_uri, code_verifier },
  })

  if (error || !data?.discord_id) {
    console.error('Discord auth failed:', error ?? data)
    return null
  }

  const session = {
    discord_id: data.discord_id as string,
    discord_username: (data.discord_username as string | null) ?? null,
    discord_avatar: (data.discord_avatar as string | null) ?? null,
  }

  set_discord_session(session)
  return session
}

export async function sign_out(): Promise<void> {
  clear_discord_session()
  await supabase.auth.signOut()
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
  if (avatar_hash.startsWith('http')) return avatar_hash
  return `https://cdn.discordapp.com/avatars/${discord_id}/${avatar_hash}.png`
}

export type { DiscordSession } from './session'
