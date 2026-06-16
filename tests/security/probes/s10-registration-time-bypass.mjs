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

if (phase === 'registration') {
  skip_probe(
    'fase atual é registration — inserção legítima; repetir fora desta janela para confirmar bypass',
  )
}

const probe_discord = `__S10_REG_BYPASS_${Date.now()}__`
const probe_char = `__S10_CHAR_${Date.now()}__`

await supabase.from('contest_users').upsert({
  discord_id: probe_discord,
  discord_username: 'RegBypassProbe',
})

const { data: inserted, error: insert_error } = await supabase
  .from('houses')
  .insert({
    discord_user_id: probe_discord,
    character_name: probe_char,
    location: 'Bypass Probe',
    floor: '1',
    custom_name: 'Reg Time Bypass Probe',
    theme: 'Probe',
    status: 'pending',
  })
  .select('id')

if (!insert_error && inserted?.length) {
  await supabase.from('houses').delete().eq('id', inserted[0].id)
  await supabase.from('contest_users').delete().eq('discord_id', probe_discord)

  vulnerable_probe(
    'Inscrição aceite fora da fase registration — backend não valida datas de contest_config',
    { current_phase: phase },
  )
}

if (insert_error) {
  secure_probe('Backend rejeitou inscrição fora da fase registration', {
    phase,
    message: insert_error.message,
  })
}

secure_probe('Inscrição fora da fase não persistiu')
