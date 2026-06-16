import {
  create_probe_client,
  skip_probe,
  secure_probe,
  vulnerable_probe,
} from './probe-env.mjs'

const supabase = create_probe_client()
if (!supabase) skip_probe('credenciais Supabase ausentes')

const { data: votes, error } = await supabase
  .from('house_votes')
  .select('id, discord_user_id, voter_character, house_id, vote_type')
  .limit(10)

if (error) skip_probe(`SELECT em house_votes falhou: ${error.message}`)

if (votes?.length) {
  vulnerable_probe(
    'Qualquer cliente anon pode ler votos individuais (discord_id + personagem + casa) — voto não é secreto',
    { sample_count: votes.length, sample: votes[0] },
  )
}

secure_probe('Nenhum voto legível via SELECT anon (inesperado)')
