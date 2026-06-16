import { describe, it, expect } from 'vitest'
import { is_admin } from '../../src/lib/auth'

describe('auth', () => {
  it('U07: is_admin identifica administradores', () => {
    const admin_ids = ['434506189951205396', '111111111111111111']
    expect(is_admin('434506189951205396', admin_ids)).toBe(true)
    expect(is_admin('999999999999999001', admin_ids)).toBe(false)
    expect(is_admin(null, admin_ids)).toBe(false)
  })
})
