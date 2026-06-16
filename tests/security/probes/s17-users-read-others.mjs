import {
  create_probe_client,
  skip_probe,
  secure_probe,
  vulnerable_probe,
} from './probe-env.mjs'

const supabase = create_probe_client()
if (!supabase) skip_probe('credenciais Supabase ausentes')

const probe_discord = `__S17_READER_${Date.now()}__`

const { data: users, error } = await supabase
  .from('contest_users')
  .select('discord_id, discord_username, discord_avatar, validated_character')
  .neq('discord_id', probe_discord)
  .limit(5)

if (error) skip_probe(`SELECT em contest_users falhou: ${error.message}`)

if (users?.length) {
  vulnerable_probe(
    'Qualquer cliente anon pode ler dados de outros participantes Discord (username, avatar, personagem validado)',
    { sample_count: users.length, fields_exposed: Object.keys(users[0]) },
  )
}

secure_probe('Nenhum perfil de outro utilizador legível (inesperado)')
