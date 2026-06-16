import {
  create_probe_client,
  skip_probe,
  secure_probe,
  vulnerable_probe,
} from './probe-env.mjs'

const supabase = create_probe_client()
if (!supabase) skip_probe('credenciais Supabase ausentes')

const fake_house_id = '00000000-0000-4000-8000-000000000099'
const test_discord_id = `__S07_INVALID_${Date.now()}__`

const { data, error } = await supabase
  .from('house_votes')
  .insert({
    discord_user_id: test_discord_id,
    voter_character: 'InvalidHouseProbe',
    house_id: fake_house_id,
    vote_type: 'match',
  })
  .select('id')

if (error) {
  secure_probe('FK rejeita voto em casa inexistente', { code: error.code, message: error.message })
}

if (!error && data?.length) {
  vulnerable_probe('Voto inserido em casa inexistente sem erro de FK', { house_id: fake_house_id })
}

secure_probe('Inserção sem erro explícito mas sem linhas retornadas')
