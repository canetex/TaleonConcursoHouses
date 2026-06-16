export interface DiscordSession {
  discord_id: string
  discord_username: string | null
  discord_avatar: string | null
}

const SESSION_KEY = 'taleon_discord_session'

export function get_discord_session(): DiscordSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DiscordSession
  } catch {
    return null
  }
}

export function set_discord_session(session: DiscordSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clear_discord_session(): void {
  localStorage.removeItem(SESSION_KEY)
}
