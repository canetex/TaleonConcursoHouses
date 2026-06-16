import { test, expect } from '@playwright/test'
import { setup_supabase_mocks, MOCK_HOUSE } from '../../fixtures/supabase-routes'

const XSS_SVG_URL =
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><text>x</text></svg>'

test.describe('Fase 2 — XSS via imagem', () => {
  test('E-S12: SVG malicioso em screenshot_urls não executa script', async ({ page }) => {
    let dialog_fired = false
    page.on('dialog', async (dialog) => {
      dialog_fired = true
      await dialog.dismiss()
    })

    await setup_supabase_mocks(page, {
      existing_house: true,
      house_override: {
        screenshot_urls: [XSS_SVG_URL],
        status: 'approved',
      },
    })

    await page.goto(`house/${MOCK_HOUSE.id}`)
    await expect(page.getByRole('heading', { name: MOCK_HOUSE.custom_name })).toBeVisible({
      timeout: 15_000,
    })
    await page.waitForTimeout(2000)

    expect(dialog_fired).toBe(false)
  })
})
