import {
  create_probe_client,
  skip_probe,
  secure_probe,
  vulnerable_probe,
} from './probe-env.mjs'

const supabase = create_probe_client()
if (!supabase) skip_probe('credenciais Supabase ausentes')

const { data: victim_vote, error: fetch_error } = await supabase
  .from('house_votes')
  .select('id, discord_user_id')
  .limit(1)
  .maybeSingle()

if (fetch_error || !victim_vote) skip_probe('nenhum voto existente para probe de delete')

const { data: deleted, error: delete_error } = await supabase
  .from('house_votes')
  .delete()
  .eq('id', victim_vote.id)
  .select('id')

if (!delete_error && deleted?.length) {
  vulnerable_probe('RLS permite DELETE de voto de rival', {
    vote_id: victim_vote.id,
    victim_discord_id: victim_vote.discord_user_id,
  })
}

if (delete_error) {
  secure_probe('DELETE de voto alheio rejeitado (sem política DELETE ou RLS bloqueou)', {
    message: delete_error.message,
  })
}

const { data: still_there } = await supabase
  .from('house_votes')
  .select('id')
  .eq('id', victim_vote.id)
  .maybeSingle()

if (!still_there) {
  vulnerable_probe('Voto de rival foi removido sem política DELETE explícita', {
    vote_id: victim_vote.id,
  })
}

secure_probe('DELETE de voto alheio não surtiu efeito')
