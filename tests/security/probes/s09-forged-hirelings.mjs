import {
  create_probe_client,
  skip_probe,
  secure_probe,
  vulnerable_probe,
} from './probe-env.mjs'

const supabase = create_probe_client()
if (!supabase) skip_probe('credenciais Supabase ausentes')

const forged_hirelings = 50
const forged_dummies = 50

const { data: houses, error: fetch_error } = await supabase
  .from('houses')
  .select('id, hirelings_count, dummies_count')
  .limit(1)

if (fetch_error || !houses?.length) skip_probe('nenhuma casa para probe de hirelings')

const target = houses[0]
const original = {
  hirelings_count: target.hirelings_count,
  dummies_count: target.dummies_count,
}

const { data: updated, error: update_error } = await supabase
  .from('houses')
  .update({
    hirelings_count: forged_hirelings,
    dummies_count: forged_dummies,
    updated_at: new Date().toISOString(),
  })
  .eq('id', target.id)
  .select('id, hirelings_count, dummies_count')

if (!update_error && updated?.length) {
  await supabase
    .from('houses')
    .update({
      hirelings_count: original.hirelings_count,
      dummies_count: original.dummies_count,
      updated_at: new Date().toISOString(),
    })
    .eq('id', target.id)

  vulnerable_probe(
    'Backend aceita hirelings/dummies forjados sem validação — afeta bónus de utilidade no ranking',
    {
      house_id: target.id,
      forged_hirelings,
      forged_dummies,
    },
  )
}

if (update_error) {
  secure_probe('Backend rejeitou contagem forjada de hirelings/dummies', {
    message: update_error.message,
  })
}

secure_probe('Update de hirelings/dummies não retornou linhas')
