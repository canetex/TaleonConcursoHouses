import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { describe, it, expect } from 'vitest'

// @vitest-environment node

const FUNCTIONS_DIR = resolve(process.cwd(), 'supabase/functions')

describe('S05 — edge functions do projeto', () => {
  const secured_functions = [
    'upsert-house',
    'cast-vote',
    'update-profile',
    'get-my-votes',
    'admin-update-house',
  ]

  const public_functions = [
    'discord-auth',
    'resolve-image-url',
    'house-wiki-coords',
    'validate-character',
    'get-contest-phase',
  ]

  for (const fn_name of [...secured_functions, ...public_functions]) {
    it(`função ${fn_name} existe`, () => {
      expect(existsSync(join(FUNCTIONS_DIR, fn_name, 'index.ts'))).toBe(true)
    })
  }

  it('funções sensíveis validam sessão Discord via _shared/session', () => {
    for (const fn_name of secured_functions) {
      const source = readFileSync(join(FUNCTIONS_DIR, fn_name, 'index.ts'), 'utf8')
      expect(source).toMatch(/discord_id_from_request/)
    }
  })

  it('session ignora JWT do Supabase no Authorization e prioriza x-contest-session', () => {
    const source = readFileSync(join(FUNCTIONS_DIR, '_shared/session.ts'), 'utf8')
    expect(source).toMatch(/x-contest-session/)
    expect(source).toMatch(/is_supabase_jwt/)
    expect(source).not.toMatch(/auth\?\.startsWith\("Bearer "\) \? auth\.slice\(7\) : header_token/)
  })

  it('cast-vote usa validated_character do banco, não do payload', () => {
    const source = readFileSync(join(FUNCTIONS_DIR, 'cast-vote/index.ts'), 'utf8')
    expect(source).toMatch(/contest_users/)
    expect(source).toMatch(/validated_character/)
    expect(source).not.toMatch(/body\.voter_character/)
  })

  it('upsert-house reabre pending em bait-and-switch de casa aprovada', () => {
    const source = readFileSync(join(FUNCTIONS_DIR, 'upsert-house/index.ts'), 'utf8')
    expect(source).toMatch(/should_reset_approved_to_pending/)
    expect(source).toMatch(/house-guards/)
  })

  it('lista todas as edge functions do projeto', () => {
    const names = readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== '_shared')
      .map((d) => d.name)
    expect(names.length).toBeGreaterThanOrEqual(9)
  })
})
