import { describe, it, expect, beforeEach } from 'vitest'
import {
  get_discord_session,
  set_discord_session,
  clear_discord_session,
} from '../../src/lib/session'

describe('session', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('U09: round-trip da sessão Discord no localStorage', () => {
    const session = {
      discord_id: '999999999999999001',
      discord_username: 'TestUser',
      discord_avatar: null,
    }

    expect(get_discord_session()).toBeNull()
    set_discord_session(session)
    expect(get_discord_session()).toEqual(session)
    clear_discord_session()
    expect(get_discord_session()).toBeNull()
  })

  it('retorna null para JSON inválido', () => {
    localStorage.setItem('taleon_discord_session', 'not-json')
    expect(get_discord_session()).toBeNull()
  })
})
