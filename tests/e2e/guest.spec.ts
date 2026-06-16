import { test, expect } from '@playwright/test'
import { setup_supabase_mocks } from '../fixtures/supabase-routes'

test.describe('Utilizador deslogado — rotas públicas', () => {
  test.beforeEach(async ({ page }) => {
    await setup_supabase_mocks(page)
  })

  test('G01: home carrega título do concurso', async ({ page }) => {
    await page.goto('')
    await expect(page.getByRole('heading', { name: /Concurso de Decoração de Houses/i })).toBeVisible()
  })

  test('G02: ranking é acessível', async ({ page }) => {
    await page.goto('ranking')
    await expect(page.getByRole('heading', { name: /Ranking & Premiação/i })).toBeVisible()
  })

  test('G03: regras são acessíveis', async ({ page }) => {
    await page.goto('regras')
    await expect(page.getByRole('heading', { name: /Regras do Concurso/i })).toBeVisible()
  })
})

test.describe('Utilizador deslogado — rotas protegidas', () => {
  test.beforeEach(async ({ page }) => {
    await setup_supabase_mocks(page)
  })

  test('G04: inscrever redireciona para login', async ({ page }) => {
    await page.goto('inscrever')
    await expect(page).toHaveURL(/login/)
    await expect(page.getByRole('heading', { name: /Entrar no Concurso/i })).toBeVisible()
  })

  test('G05: votar redireciona para login', async ({ page }) => {
    await page.goto('votar')
    await expect(page).toHaveURL(/login/)
    await expect(page.getByRole('main').getByRole('button', { name: /Entrar com Discord/i })).toBeVisible()
  })

  test('G06: admin redireciona para login', async ({ page }) => {
    await page.goto('admin')
    await expect(page).toHaveURL(/login/)
    await expect(page.getByRole('main').getByRole('button', { name: /Entrar com Discord/i })).toBeVisible()
  })

  test('G07: detalhe de casa público é acessível', async ({ page }) => {
    await setup_supabase_mocks(page, { existing_house: true })
    await page.goto('house/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
    await expect(page.getByRole('heading', { name: /Casa Teste E2E/i })).toBeVisible({ timeout: 15_000 })
  })

  test('G08: votar deslogado não mostra interface de swipe', async ({ page }) => {
    await page.goto('votar')
    await expect(page).toHaveURL(/login/)
    await expect(page.getByText(/Deslize ou use os botões/i)).not.toBeVisible()
  })
})
