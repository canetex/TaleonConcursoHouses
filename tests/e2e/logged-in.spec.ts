import { test, expect } from '@playwright/test'
import { inject_discord_session, TEST_DISCORD_SESSION } from '../fixtures/discord-session'
import { setup_supabase_mocks } from '../fixtures/supabase-routes'

test.describe('Utilizador logado — bypass Discord', () => {
  test('L01: formulário de nova inscrição', async ({ page }) => {
    await setup_supabase_mocks(page, { existing_house: false })
    await inject_discord_session(page)

    await page.goto('inscrever')
    await expect(page.getByRole('heading', { name: /Inscrever Casa/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /Submeter Inscrição/i })).toBeVisible()
  })

  test('L02: formulário de edição com casa existente', async ({ page }) => {
    await setup_supabase_mocks(page, { existing_house: true })
    await inject_discord_session(page)

    await page.goto('inscrever')
    await expect(page.getByRole('heading', { name: /Editar Inscrição/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /Guardar Alterações/i })).toBeVisible()
    await expect(page.locator('input[value="Casa Teste E2E"]')).toBeVisible()
  })

  test('L05: votar bloqueado fora da fase de votação', async ({ page }) => {
    await setup_supabase_mocks(page, { phase: 'registration' })
    await inject_discord_session(page)

    await page.goto('votar')
    await expect(page.getByText(/A votação ainda não está aberta ou já encerrou/i)).toBeVisible({ timeout: 15_000 })
  })

  test('L06: admin negado para utilizador comum', async ({ page }) => {
    await setup_supabase_mocks(page)
    await inject_discord_session(page, TEST_DISCORD_SESSION)

    await page.goto('admin')
    await expect(page.getByText(/Acesso negado ao painel admin/i)).toBeVisible({ timeout: 15_000 })
  })

  test('L03: submeter inscrição chama upsert-house', async ({ page }) => {
    await setup_supabase_mocks(page, { existing_house: false })
    await inject_discord_session(page)

    const upsert_promise = page.waitForRequest(
      (req) => req.url().includes('/functions/v1/upsert-house'),
      { timeout: 45_000 },
    )

    await page.goto('inscrever')
    await page.locator('input[type="text"]').nth(0).fill('E2EChar')
    await page.getByRole('button', { name: 'Validar' }).click()
    await expect(page.getByText(/Personagem válido/i)).toBeVisible({ timeout: 10_000 })

    const city_select = page.locator('select').nth(1)
    await city_select.selectOption('Thais')
    const house_select = page.locator('select').nth(2)
    await expect(house_select.locator('option')).not.toHaveCount(1, { timeout: 10_000 })
    const first_house = await house_select.locator('option').nth(1).getAttribute('value')
    await house_select.selectOption(first_house ?? { index: 1 })

    await page.locator('input[type="text"]').nth(1).fill('1')
    await page.locator('input[type="text"]').nth(2).fill('Nova Casa E2E')
    await page.locator('input[type="text"]').nth(3).fill('Tema E2E')
    await page.locator('input[type="url"]').fill('https://i.imgur.com/test.png')
    await page.getByRole('button', { name: /Submeter Inscrição/i }).click()
    await upsert_promise
  })

  test('L04: editar inscrição chama upsert-house', async ({ page }) => {
    const upsert_promise = page.waitForRequest((req) => req.url().includes('/functions/v1/upsert-house'))
    await setup_supabase_mocks(page, { existing_house: true })
    await inject_discord_session(page)

    await page.goto('inscrever')
    await page.locator('input[type="text"]').nth(2).fill('Casa Editada E2E')
    await page.getByRole('button', { name: /Guardar Alterações/i }).click()
    await upsert_promise
  })
})
