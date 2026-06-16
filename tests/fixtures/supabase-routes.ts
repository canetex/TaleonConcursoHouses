import type { Page } from '@playwright/test'

export function registration_phase_config() {
  const now = Date.now()
  const day = 86_400_000
  return [
    { key: 'registration_start', value: new Date(now - day).toISOString() },
    { key: 'registration_end', value: new Date(now + 30 * day).toISOString() },
    { key: 'validation_end', value: new Date(now + 35 * day).toISOString() },
    { key: 'voting_end', value: new Date(now + 60 * day).toISOString() },
    { key: 'admin_discord_ids', value: '434506189951205396' },
  ]
}

export function voting_phase_config() {
  const now = Date.now()
  const day = 86_400_000
  return [
    { key: 'registration_start', value: new Date(now - 60 * day).toISOString() },
    { key: 'registration_end', value: new Date(now - 30 * day).toISOString() },
    { key: 'validation_end', value: new Date(now - day).toISOString() },
    { key: 'voting_end', value: new Date(now + 30 * day).toISOString() },
    { key: 'admin_discord_ids', value: '434506189951205396' },
  ]
}

/** Datas no passado — concurso encerrado se o relógio do cliente for real */
export function ended_phase_config() {
  return [
    { key: 'registration_start', value: '2020-01-01T00:00:00Z' },
    { key: 'registration_end', value: '2020-02-01T00:00:00Z' },
    { key: 'validation_end', value: '2020-03-01T00:00:00Z' },
    { key: 'voting_end', value: '2020-04-01T00:00:00Z' },
    { key: 'admin_discord_ids', value: '434506189951205396' },
  ]
}

/** Relógio do cliente manipulado para dentro da inscrição (bypass UI) */
export async function inject_fake_clock(page: Page, iso_date: string) {
  const fixed = new Date(iso_date).getTime()
  await page.addInitScript((ts) => {
    const RealDate = Date
    function FakeDate(this: Date, ...args: unknown[]) {
      if (args.length === 0) {
        return new RealDate(ts)
      }
      return new RealDate(...(args as []))
    }
    FakeDate.now = () => ts
    FakeDate.parse = RealDate.parse
    FakeDate.UTC = RealDate.UTC
    Object.assign(FakeDate, RealDate)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).Date = FakeDate as unknown as DateConstructor
  }, fixed)
}

const MOCK_HOUSE = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  discord_user_id: '999999999999999001',
  character_name: 'Test Char',
  location: 'Alai Flats, Flat 01, Thais',
  floor: '1º andar',
  custom_name: 'Casa Teste E2E',
  theme: 'Medieval',
  dummies_count: 2,
  hirelings_count: 1,
  screenshot_urls: ['https://i.imgur.com/test.png'],
  status: 'pending',
  organizer_votes: 0,
  honorable_mention: false,
  house_city: 'Thais',
  house_tibia_name: 'Alai Flats, Flat 01',
  house_wiki_slug: 'Alai_Flats,_Flat_01',
  house_wiki_url: 'https://www.tibiawiki.com.br/wiki/Alai_Flats,_Flat_01',
  house_type: 'house',
  map_x: 32300,
  map_y: 32200,
  map_z: 7,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

interface MockOptions {
  phase?: 'registration' | 'voting' | 'ended'
  existing_house?: boolean
  houses_list?: unknown[]
  house_override?: Partial<typeof MOCK_HOUSE>
}

export async function setup_supabase_mocks(page: Page, options: MockOptions = {}) {
  const config =
    options.phase === 'voting'
      ? voting_phase_config()
      : options.phase === 'ended'
        ? ended_phase_config()
        : registration_phase_config()

  await page.route('**/*', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    if (!url.includes('supabase.co') && !url.includes('test.supabase.co')) {
      return route.continue()
    }

    if (url.includes('/rest/v1/contest_config') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': `0-${config.length - 1}/${config.length}` },
        body: JSON.stringify(config),
      })
    }

    if (url.includes('/rest/v1/contest_users') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }

    if (url.includes('/rest/v1/contest_users') && (method === 'POST' || method === 'PATCH')) {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          discord_id: '999999999999999001',
          discord_username: 'E2E_TestUser',
        }),
      })
    }

    if (url.includes('/rest/v1/houses') && method === 'GET') {
      const houses = options.existing_house
        ? [MOCK_HOUSE]
        : (options.houses_list ?? [])
      const is_single = url.includes('id=eq.')

      if (is_single && (options.existing_house || options.house_override)) {
        const house = { ...MOCK_HOUSE, ...options.house_override }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(house),
        })
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': `0-${Math.max(houses.length - 1, 0)}/${houses.length}` },
        body: JSON.stringify(houses),
      })
    }

    if (url.includes('/rest/v1/houses') && method === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_HOUSE, id: 'new-house-id' }),
      })
    }

    if (url.includes('/rest/v1/houses') && method === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_HOUSE),
      })
    }

    if (url.includes('/rest/v1/house_votes')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }

    if (url.includes('/rest/v1/house_leaderboard')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }

    if (url.includes('/functions/v1/upsert-house')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ house: { ...MOCK_HOUSE, id: 'new-house-id' }, action: 'created' }),
      })
    }

    if (url.includes('/functions/v1/cast-vote')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ vote: { house_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', vote_type: 'match' } }),
      })
    }

    if (url.includes('/functions/v1/get-my-votes')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ votes: [] }),
      })
    }

    if (url.includes('/functions/v1/update-profile')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: {
            discord_id: '999999999999999001',
            discord_username: 'E2E_TestUser',
            discord_avatar: null,
          },
        }),
      })
    }

    if (url.includes('/functions/v1/admin-update-house')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ house: MOCK_HOUSE }),
      })
    }

    if (url.includes('/functions/v1/validate-character')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true }),
      })
    }

    if (url.includes('/functions/v1/resolve-image-url')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ resolved_url: 'https://i.imgur.com/e2e-test.png' }),
      })
    }

    if (url.includes('/functions/v1/house-wiki-coords')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ x: 32300, y: 32200, z: 7 }),
      })
    }

    if (url.includes('/functions/v1/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    }

    if (url.includes('/realtime/v1/')) {
      return route.abort()
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })
}

export { MOCK_HOUSE }
