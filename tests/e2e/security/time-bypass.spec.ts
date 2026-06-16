import { test, expect } from '@playwright/test'
import { inject_discord_session } from '../../fixtures/discord-session'
import { inject_fake_clock, setup_supabase_mocks } from '../../fixtures/supabase-routes'

test.describe('Fase 2 — bypass de tempo no frontend', () => {
  test('E-S10: relógio manipulado exibe formulário com concurso encerrado (bypass UI)', async ({
    page,
  }) => {
    await inject_fake_clock(page, '2020-01-15T12:00:00Z')
    await setup_supabase_mocks(page, { phase: 'ended', existing_house: false })
    await inject_discord_session(page)

    await page.goto('inscrever')
    await expect(page.getByRole('heading', { name: /Inscrever Casa/i })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('button', { name: /Submeter Inscrição/i })).toBeVisible()
    await expect(page.getByText(/O período de inscrições está encerrado/i)).not.toBeVisible()
  })

  test('E-S11: relógio manipulado reabre interface de votação na UI', async ({ page }) => {
    await inject_fake_clock(page, '2020-03-15T12:00:00Z')
    await setup_supabase_mocks(page, { phase: 'ended' })
    await inject_discord_session(page)

    await page.goto('votar')

    await expect(page.getByRole('heading', { name: /Votar nas Casas/i })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/A votação ainda não está aberta/i)).not.toBeVisible()
  })
})
