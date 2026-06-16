import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

// @vitest-environment node

const MIGRATION_PATH = resolve(
  process.cwd(),
  'supabase/migrations/20260617120000_security_hardening.sql',
)

const LEGACY_MIGRATION_PATH = resolve(
  process.cwd(),
  'supabase/migrations/20260615152643_create_house_contest_schema.sql',
)

describe('RLS — análise estática das políticas', () => {
  const hardening_sql = readFileSync(MIGRATION_PATH, 'utf8')
  const legacy_sql = readFileSync(LEGACY_MIGRATION_PATH, 'utf8')

  it('migration de hardening remove políticas permissivas de escrita', () => {
    expect(hardening_sql).toMatch(/DROP POLICY IF EXISTS "houses_insert"/)
    expect(hardening_sql).toMatch(/DROP POLICY IF EXISTS "houses_update"/)
    expect(hardening_sql).toMatch(/DROP POLICY IF EXISTS "house_votes_select"/)
    expect(hardening_sql).toMatch(/DROP POLICY IF EXISTS "contest_users_select"/)
    expect(hardening_sql).toMatch(/REVOKE INSERT, UPDATE, DELETE ON public.houses FROM anon/)
    expect(hardening_sql).toMatch(/REVOKE ALL ON public.house_votes FROM anon/)
  })

  it('schema legado documentava políticas USING (true) substituídas', () => {
    expect(legacy_sql).toMatch(
      /CREATE POLICY "houses_update" ON houses FOR UPDATE USING \(true\)/,
    )
    expect(legacy_sql).toMatch(/UNIQUE \(discord_user_id, house_id\)/)
  })

  it('S09: CHECK limits hirelings e dummies até 20', () => {
    expect(hardening_sql).toMatch(/hirelings_count <= 20/)
    expect(hardening_sql).toMatch(/dummies_count <= 20/)
  })
})
