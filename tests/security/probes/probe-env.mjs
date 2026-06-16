import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function load_env_var(name) {
  if (process.env[name]) return process.env[name]
  const env_path = resolve(process.cwd(), '.env')
  if (!existsSync(env_path)) return undefined
  const line = readFileSync(env_path, 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${name}=`))
  return line?.slice(name.length + 1).trim()
}

export function create_probe_client() {
  const url = load_env_var('VITE_SUPABASE_URL')
  const anon_key = load_env_var('VITE_SUPABASE_ANON_KEY')
  if (!url || !anon_key) return null
  return createClient(url, anon_key)
}

export function skip_probe(message) {
  console.warn(`[SKIP] ${message}`)
  process.exit(2)
}

export function secure_probe(message, extra = {}) {
  console.log(JSON.stringify({ status: 'SECURE', message, ...extra }))
  process.exit(0)
}

export function vulnerable_probe(message, extra = {}) {
  console.error(JSON.stringify({ status: 'VULNERABLE', message, ...extra }))
  process.exit(1)
}

export function get_contest_phase(dates, now = new Date()) {
  const registration_start = new Date(dates.registration_start)
  const registration_end = new Date(dates.registration_end)
  const validation_end = new Date(dates.validation_end)
  const voting_end = new Date(dates.voting_end)

  if (now < registration_start) return 'before'
  if (now < registration_end) return 'registration'
  if (now < validation_end) return 'validation'
  if (now < voting_end) return 'voting'
  return 'ended'
}

export async function load_contest_dates(supabase) {
  const { data, error } = await supabase.from('contest_config').select('key, value')
  if (error || !data?.length) return null
  const map = Object.fromEntries(data.map((row) => [row.key, row.value]))
  return {
    registration_start: map.registration_start,
    registration_end: map.registration_end,
    validation_end: map.validation_end,
    voting_end: map.voting_end,
  }
}
