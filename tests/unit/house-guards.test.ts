import { describe, it, expect } from 'vitest'
import {
  approved_house_vitals_changed,
  should_reset_approved_to_pending,
} from '../../supabase/functions/_shared/house-guards'

const BASE_SNAPSHOT = {
  character_name: 'Test Char',
  house_tibia_name: 'Alai Flats, Flat 01',
  house_city: 'Thais',
  house_wiki_slug: 'Alai_Flats,_Flat_01',
  screenshot_urls: ['https://i.imgur.com/a.png'],
}

describe('Fase 3 — anti bait-and-switch em casas aprovadas', () => {
  it('não reabre pending se apenas tema ou contadores mudam', () => {
    expect(
      should_reset_approved_to_pending('approved', BASE_SNAPSHOT, {
        ...BASE_SNAPSHOT,
      }),
    ).toBe(false)
  })

  it('reabre pending ao trocar personagem', () => {
    expect(
      approved_house_vitals_changed(BASE_SNAPSHOT, {
        ...BASE_SNAPSHOT,
        character_name: 'Outro Char',
      }),
    ).toBe(true)
  })

  it('reabre pending ao trocar casa (tibia_name / cidade / slug)', () => {
    expect(
      approved_house_vitals_changed(BASE_SNAPSHOT, {
        ...BASE_SNAPSHOT,
        house_tibia_name: 'Outra Casa',
      }),
    ).toBe(true)
    expect(
      approved_house_vitals_changed(BASE_SNAPSHOT, {
        ...BASE_SNAPSHOT,
        house_city: 'Venore',
      }),
    ).toBe(true)
    expect(
      approved_house_vitals_changed(BASE_SNAPSHOT, {
        ...BASE_SNAPSHOT,
        house_wiki_slug: 'Outra_Casa',
      }),
    ).toBe(true)
  })

  it('reabre pending ao alterar screenshots', () => {
    expect(
      approved_house_vitals_changed(BASE_SNAPSHOT, {
        ...BASE_SNAPSHOT,
        screenshot_urls: ['https://i.imgur.com/b.png'],
      }),
    ).toBe(true)
  })

  it('ignora regra para casas pending ou rejected', () => {
    expect(should_reset_approved_to_pending('pending', BASE_SNAPSHOT, BASE_SNAPSHOT)).toBe(false)
    expect(should_reset_approved_to_pending('rejected', BASE_SNAPSHOT, BASE_SNAPSHOT)).toBe(false)
  })
})
