import type { Page } from '@playwright/test'

export const SESSION_STORAGE_KEY = 'taleon_discord_session'

export const TEST_DISCORD_SESSION = {
  discord_id: '999999999999999001',
  discord_username: 'E2E_TestUser',
  discord_avatar: null,
  session_token: 'e2e-test-session-token',
} as const

export const TEST_ADMIN_SESSION = {
  discord_id: '434506189951205396',
  discord_username: 'TheCrusty',
  discord_avatar: null,
  session_token: 'e2e-admin-session-token',
} as const

export async function inject_discord_session(
  page: Page,
  session: {
    discord_id: string
    discord_username: string | null
    discord_avatar: string | null
    session_token?: string
  } = TEST_DISCORD_SESSION,
) {
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value))
    },
    { key: SESSION_STORAGE_KEY, value: session },
  )
}

export async function clear_discord_session(page: Page) {
  await page.addInitScript((key) => {
    localStorage.removeItem(key)
  }, SESSION_STORAGE_KEY)
}
