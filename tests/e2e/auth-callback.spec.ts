import { test, expect } from '@playwright/test'
import { setup_supabase_mocks } from '../fixtures/supabase-routes'

test.describe('Callback OAuth Discord', () => {
  test('L07: callback aplica sessão e mostra utilizador autenticado no Layout', async ({ page }) => {
    await setup_supabase_mocks(page)

    await page.addInitScript(() => {
      sessionStorage.setItem(
        'taleon_discord_pkce_verifier',
        'e2e-pkce-verifier-abcdefghijklmnopqrstuvwxyz123456',
      )
    })

    await page.route('**/functions/v1/discord-auth', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          discord_id: '999999999999999001',
          discord_username: 'E2E_TestUser',
          discord_avatar: null,
          session_token: 'e2e-session-token',
        }),
      })
    })

    await page.goto('auth/callback?code=e2e-oauth-code')

    await expect(page.getByRole('button', { name: /Sair/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /Entrar com Discord/i })).not.toBeVisible()
  })
})
