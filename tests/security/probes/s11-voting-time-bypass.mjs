import {
  create_probe_client,
  skip_probe,
  secure_probe,
  vulnerable_probe,
  load_contest_dates,
  get_contest_phase,
} from './probe-env.mjs'

const supabase = create_probe_client()
if (!supabase) skip_probe('credenciais Supabase ausentes')

const dates = await load_contest_dates(supabase)
if (!dates) skip_probe('contest_config indisponível')

const phase = get_contest_phase(dates)

if (phase === 'voting') {
  skip_probe('fase atual é voting — voto legítimo; repetir fora desta janela para confirmar bypass')
}

const test_discord_id = `__S11_VOTE_BYPASS_${Date.now()}__`

const { data: houses } = await supabase
  .from('houses')
  .select('id')
  .eq('status', 'approved')
  .limit(1)

let house_id = houses?.[0]?.id
if (!house_id) {
  const { data: any_house } = await supabase.from('houses').select('id').limit(1)
  house_id = any_house?.[0]?.id
}
if (!house_id) skip_probe('nenhuma casa para probe de votação')

const { data: inserted, error: insert_error } = await supabase
  .from('house_votes')
  .insert({
    discord_user_id: test_discord_id,
    voter_character: 'VoteBypassProbe',
    house_id,
    vote_type: 'match',
  })
  .select('id')

if (!insert_error && inserted?.length) {
  await supabase.from('house_votes').delete().eq('id', inserted[0].id)

  vulnerable_probe(
    'Voto aceite fora da fase voting — backend não valida datas de contest_config',
    { current_phase: phase, house_id },
  )
}

if (insert_error) {
  secure_probe('Backend rejeitou voto fora da fase voting', {
    phase,
    message: insert_error.message,
  })
}

const { data: orphan } = await supabase
  .from('house_votes')
  .select('id')
  .eq('discord_user_id', test_discord_id)
  .maybeSingle()

if (orphan) {
  await supabase.from('house_votes').delete().eq('id', orphan.id)
  vulnerable_probe('Voto fora da fase persistiu', { current_phase: phase })
}

secure_probe('Voto fora da fase voting não persistiu')
