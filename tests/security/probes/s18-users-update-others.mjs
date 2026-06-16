import {
  create_probe_client,
  skip_probe,
  secure_probe,
  vulnerable_probe,
} from './probe-env.mjs'

const supabase = create_probe_client()
if (!supabase) skip_probe('credenciais Supabase ausentes')

const attacker_discord = `__S18_ATTACKER_${Date.now()}__`

const { data: victim, error: fetch_error } = await supabase
  .from('contest_users')
  .select('discord_id, validated_character')
  .neq('discord_id', attacker_discord)
  .limit(1)
  .maybeSingle()

if (fetch_error || !victim) skip_probe('nenhum contest_user para probe de update')

const original_character = victim.validated_character
const probe_character = `__S18_PROBE_${Date.now()}__`

const { data: updated, error: update_error } = await supabase
  .from('contest_users')
  .update({
    validated_character: probe_character,
    updated_at: new Date().toISOString(),
  })
  .eq('discord_id', victim.discord_id)
  .select('discord_id, validated_character')

if (!update_error && updated?.length) {
  await supabase
    .from('contest_users')
    .update({
      validated_character: original_character,
      updated_at: new Date().toISOString(),
    })
    .eq('discord_id', victim.discord_id)

  vulnerable_probe('RLS permite UPDATE de perfil de outro utilizador', {
    victim_discord_id: victim.discord_id,
  })
}

if (update_error) {
  secure_probe('UPDATE de perfil alheio rejeitado', { message: update_error.message })
}

secure_probe('UPDATE de perfil alheio não retornou linhas')
