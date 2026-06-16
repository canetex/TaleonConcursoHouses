import {
  create_probe_client,
  skip_probe,
  secure_probe,
  vulnerable_probe,
} from './probe-env.mjs'

const supabase = create_probe_client()
if (!supabase) skip_probe('credenciais Supabase ausentes')

const attacker_discord = `__S15_ATTACKER_${Date.now()}__`

const { data: victim_vote, error: fetch_error } = await supabase
  .from('house_votes')
  .select('id, discord_user_id, vote_type, house_id')
  .limit(1)
  .maybeSingle()

if (fetch_error || !victim_vote) skip_probe('nenhum voto existente para probe de update')

if (victim_vote.discord_user_id === attacker_discord) {
  skip_probe('único voto pertence ao atacante simulado')
}

const original_type = victim_vote.vote_type
const flipped_type = original_type === 'match' ? 'dislike' : 'match'

const { data: updated, error: update_error } = await supabase
  .from('house_votes')
  .update({ vote_type: flipped_type, updated_at: new Date().toISOString() })
  .eq('id', victim_vote.id)
  .select('id, vote_type')

if (!update_error && updated?.length) {
  await supabase
    .from('house_votes')
    .update({ vote_type: original_type, updated_at: new Date().toISOString() })
    .eq('id', victim_vote.id)

  vulnerable_probe('RLS permite UPDATE do voto de outro utilizador', {
    vote_id: victim_vote.id,
    victim_discord_id: victim_vote.discord_user_id,
  })
}

if (update_error) {
  secure_probe('UPDATE de voto alheio rejeitado', { message: update_error.message })
}

secure_probe('UPDATE de voto alheio não retornou linhas')
