import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function load_env_var(name) {
  if (process.env[name]) return process.env[name]
  const env_path = resolve(process.cwd(), '.env')
  if (!existsSync(env_path)) return undefined
  const line = readFileSync(env_path, 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${name}=`))
  return line?.slice(name.length + 1).trim()
}

const url = load_env_var('VITE_SUPABASE_URL')
const anon_key = load_env_var('VITE_SUPABASE_ANON_KEY')

if (!url || !anon_key) {
  console.warn('[S02] SKIP: credenciais Supabase ausentes')
  process.exit(2)
}

const supabase = createClient(url, anon_key)
const attacker_discord_id = '000000000000000000'

const { data: houses, error: fetch_error } = await supabase
  .from('houses')
  .select('id, custom_name, discord_user_id')
  .limit(1)

if (fetch_error || !houses?.length) {
  console.warn('[S02] SKIP: probe indisponível', fetch_error?.message ?? 'sem casas')
  process.exit(2)
}

const target = houses[0]
const original_name = target.custom_name
const probe_name = `__S02_PROBE_${Date.now()}__`

if (target.discord_user_id === attacker_discord_id) {
  console.warn('[S02] SKIP: única casa pertence ao ID de atacante simulado')
  process.exit(2)
}

const { data: updated, error: update_error } = await supabase
  .from('houses')
  .update({ custom_name: probe_name, updated_at: new Date().toISOString() })
  .eq('id', target.id)
  .select('id, custom_name')

if (!update_error && updated?.length) {
  await supabase
    .from('houses')
    .update({ custom_name: original_name, updated_at: new Date().toISOString() })
    .eq('id', target.id)

  console.error(
    JSON.stringify({
      status: 'VULNERABLE',
      house_id: target.id,
      owner_discord_id: target.discord_user_id,
      message:
        'RLS houses_update permite update não autorizado via anon key. Backlog: restringir UPDATE ao proprietário.',
    }),
  )
  process.exit(1)
}

if (update_error) {
  console.log(JSON.stringify({ status: 'SECURE', message: update_error.message }))
  process.exit(0)
}

console.log(JSON.stringify({ status: 'SECURE', message: 'update não retornou linhas' }))
process.exit(0)
