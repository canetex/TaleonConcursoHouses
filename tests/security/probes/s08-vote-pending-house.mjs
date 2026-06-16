import {
  create_probe_client,
  skip_probe,
  secure_probe,
  vulnerable_probe,
} from './probe-env.mjs'

const supabase = create_probe_client()
if (!supabase) skip_probe('credenciais Supabase ausentes')

const test_discord_id = `__S08_PENDING_${Date.now()}__`

const { data: pending_houses, error: fetch_error } = await supabase
  .from('houses')
  .select('id, status')
  .eq('status', 'pending')
  .limit(1)

let pending_id = pending_houses?.[0]?.id

if (!pending_id) {
  const probe_discord = `__S08_OWNER_${Date.now()}__`
  await supabase.from('contest_users').upsert({
    discord_id: probe_discord,
    discord_username: 'PendingProbeOwner',
  })

  const { data: inserted, error: insert_error } = await supabase
    .from('houses')
    .insert({
      discord_user_id: probe_discord,
      character_name: `__PENDING_PROBE_${Date.now()}__`,
      location: 'Probe City',
      floor: '1',
      custom_name: 'Pending Probe House',
      theme: 'Test',
      status: 'pending',
    })
    .select('id')
    .single()

  if (insert_error || !inserted) {
    skip_probe(`não foi possível criar casa pending: ${insert_error?.message}`)
  }
  pending_id = inserted.id
}

const { data, error } = await supabase.from('house_votes').insert({
  discord_user_id: test_discord_id,
  voter_character: 'PendingVoteProbe',
  house_id: pending_id,
  vote_type: 'match',
})

if (!error && data !== null) {
  await supabase
    .from('house_votes')
    .delete()
    .eq('discord_user_id', test_discord_id)
    .eq('house_id', pending_id)

  vulnerable_probe('API aceita voto em casa pending/rejeitada — validação só no frontend', {
    house_id: pending_id,
    house_status: 'pending',
  })
}

if (error) {
  secure_probe('Backend rejeitou voto em casa não aprovada', {
    code: error.code,
    message: error.message,
  })
}

const { data: check } = await supabase
  .from('house_votes')
  .select('id')
  .eq('discord_user_id', test_discord_id)
  .eq('house_id', pending_id)
  .maybeSingle()

if (check) {
  await supabase
    .from('house_votes')
    .delete()
    .eq('discord_user_id', test_discord_id)
    .eq('house_id', pending_id)
  vulnerable_probe('Voto em casa pending persistiu sem erro visível', { house_id: pending_id })
}

secure_probe('Voto em casa pending não persistiu')
