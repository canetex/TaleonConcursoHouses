import {
  create_probe_client,
  skip_probe,
  secure_probe,
  vulnerable_probe,
} from './probe-env.mjs'

const supabase = create_probe_client()
if (!supabase) skip_probe('credenciais Supabase ausentes')

const test_discord_id = `__S06_RACE_${Date.now()}__`
const parallel_count = 10

const { data: houses, error: house_error } = await supabase
  .from('houses')
  .select('id')
  .eq('status', 'approved')
  .limit(1)

let house_id = houses?.[0]?.id

if (!house_id) {
  const { data: any_house } = await supabase.from('houses').select('id').limit(1)
  house_id = any_house?.[0]?.id
}

if (!house_id) skip_probe('nenhuma casa disponível para teste de concorrência')

const vote_payload = {
  discord_user_id: test_discord_id,
  voter_character: 'RaceProbeChar',
  house_id,
  vote_type: 'match',
  updated_at: new Date().toISOString(),
}

const results = await Promise.all(
  Array.from({ length: parallel_count }, () =>
    supabase.from('house_votes').upsert(vote_payload, {
      onConflict: 'discord_user_id,house_id',
    }),
  ),
)

const errors = results.map((r) => r.error).filter(Boolean)
const { count, error: count_error } = await supabase
  .from('house_votes')
  .select('id', { count: 'exact', head: true })
  .eq('discord_user_id', test_discord_id)
  .eq('house_id', house_id)

await supabase
  .from('house_votes')
  .delete()
  .eq('discord_user_id', test_discord_id)
  .eq('house_id', house_id)

if (count_error) skip_probe(`contagem falhou: ${count_error.message}`)

if ((count ?? 0) > 1) {
  vulnerable_probe('Concorrência criou múltiplos votos para o mesmo par (discord_id, house_id)', {
    count,
    parallel_count,
    errors: errors.map((e) => e.message),
  })
}

secure_probe('UNIQUE + upsert limitam a 1 voto por utilizador/casa sob concorrência', {
  count,
  parallel_requests: parallel_count,
})
