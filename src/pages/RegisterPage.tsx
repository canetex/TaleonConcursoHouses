import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePhase } from '../hooks/usePhase'
import { can_register } from '../lib/phases'
import { validate_character } from '../lib/character'
import { normalize_image_url } from '../lib/images'
import type { HouseRegistrationForm } from '../types'

const empty_form: HouseRegistrationForm = {
  character_name: '',
  location: '',
  floor: '',
  custom_name: '',
  theme: '',
  dummies_count: 0,
  hirelings_count: 0,
  screenshot_urls: [''],
}

export function RegisterPage() {
  const { is_authenticated, discord_id, login } = useAuth()
  const { phase } = usePhase()
  const navigate = useNavigate()

  const [form, set_form] = useState<HouseRegistrationForm>(empty_form)
  const [validating, set_validating] = useState(false)
  const [character_valid, set_character_valid] = useState<boolean | null>(null)
  const [submitting, set_submitting] = useState(false)
  const [error, set_error] = useState<string | null>(null)
  const [existing_house, set_existing_house] = useState(false)

  useEffect(() => {
    if (!discord_id) return
    console.log('[RegisterPage] checking existing house for discord_id', { discord_id })
    supabase
      .from('houses')
      .select('id')
      .eq('discord_user_id', discord_id)
      .maybeSingle()
      .then(({ data }) => set_existing_house(!!data))
  }, [discord_id])

  const update_field = <K extends keyof HouseRegistrationForm>(
    key: K,
    value: HouseRegistrationForm[K],
  ) => set_form((prev) => ({ ...prev, [key]: value }))

  const handle_validate_character = async () => {
    set_validating(true)
    set_character_valid(null)
    console.log('[RegisterPage] handle_validate_character', { character_name: form.character_name })
    const valid = await validate_character(form.character_name)
    set_character_valid(valid)
    set_validating(false)
    if (!valid) set_error('Personagem inválido ou não encontrado no Taleon — San.')
  }

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault()
    set_error(null)

    if (!is_authenticated || !discord_id) {
      set_error('É necessário fazer login via Discord.')
      return
    }

    if (!can_register(phase)) {
      set_error('O período de inscrições está encerrado.')
      return
    }

    if (existing_house) {
      set_error('Já possui uma casa inscrita com esta conta Discord.')
      return
    }

    if (character_valid !== true) {
      set_validating(true)
      const valid = await validate_character(form.character_name)
      set_character_valid(valid)
      set_validating(false)
      if (!valid) {
        set_error('Personagem inválido ou não encontrado no Taleon — San.')
        return
      }
    }

    const screenshot_urls = form.screenshot_urls
      .map((url) => normalize_image_url(url.trim()))
      .filter(Boolean)

    console.log('[RegisterPage] submit screenshot_urls', screenshot_urls)

    if (screenshot_urls.length === 0) {
      set_error('Adicione pelo menos uma URL de screenshot.')
      return
    }

    set_submitting(true)

    const { error: insert_error } = await supabase.from('houses').insert({
      discord_user_id: discord_id,
      character_name: form.character_name.trim(),
      location: form.location.trim(),
      floor: form.floor.trim(),
      custom_name: form.custom_name.trim(),
      theme: form.theme.trim(),
      dummies_count: form.dummies_count,
      hirelings_count: form.hirelings_count,
      screenshot_urls,
      status: 'pending',
    })

    set_submitting(false)

    if (insert_error) {
      if (insert_error.code === '23505') {
        set_error('Este personagem ou conta Discord já possui uma inscrição.')
      } else {
        set_error(insert_error.message)
      }
      return
    }

    navigate('/')
  }

  if (!is_authenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-amber-200/70 mb-6">Faça login com Discord para inscrever a sua casa.</p>
        <button
          onClick={() => login()}
          className="px-6 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium transition-colors"
        >
          Entrar com Discord
        </button>
      </div>
    )
  }

  if (!can_register(phase)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-amber-200/70">O período de inscrições não está ativo.</p>
      </div>
    )
  }

  if (existing_house) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">✅</p>
        <p className="text-amber-200/70">Já possui uma casa inscrita neste concurso.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-tibia-gold mb-2">Inscrever Casa</h2>
      <p className="text-sm text-amber-200/50 mb-6">
        Taxa de inscrição: <strong className="text-amber-200">10 TC (Tibia Coins)</strong> transferidas para The Crusty.
        A inscrição ficará pendente até confirmação do pagamento.
      </p>

      <form onSubmit={handle_submit} className="space-y-5">
        <div>
          <label className="block text-sm text-amber-200/70 mb-1">Nome do Personagem *</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.character_name}
              onChange={(e) => {
                update_field('character_name', e.target.value)
                set_character_valid(null)
              }}
              className="flex-1 px-3 py-2 rounded-lg bg-tibia-dark border border-amber-800/40 text-amber-50 focus:outline-none focus:border-tibia-gold"
              required
            />
            <button
              type="button"
              onClick={handle_validate_character}
              disabled={validating || !form.character_name.trim()}
              className="px-4 py-2 rounded-lg bg-tibia-accent text-amber-50 text-sm hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {validating ? '...' : 'Validar'}
            </button>
          </div>
          {character_valid === true && (
            <p className="text-xs text-green-400 mt-1">✓ Personagem válido no Taleon — San</p>
          )}
          {character_valid === false && (
            <p className="text-xs text-red-400 mt-1">✗ Personagem não encontrado</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-amber-200/70 mb-1">Localização da Casa *</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => update_field('location', e.target.value)}
              placeholder="Ex: Wood Avenue 1, Venore"
              className="w-full px-3 py-2 rounded-lg bg-tibia-dark border border-amber-800/40 text-amber-50 focus:outline-none focus:border-tibia-gold"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-amber-200/70 mb-1">Andar a Avaliar *</label>
            <input
              type="text"
              value={form.floor}
              onChange={(e) => update_field('floor', e.target.value)}
              placeholder="Ex: 1º andar, Cave"
              className="w-full px-3 py-2 rounded-lg bg-tibia-dark border border-amber-800/40 text-amber-50 focus:outline-none focus:border-tibia-gold"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-amber-200/70 mb-1">Nome da Casa *</label>
          <input
            type="text"
            value={form.custom_name}
            onChange={(e) => update_field('custom_name', e.target.value)}
            placeholder="Batize sua obra! Use a criatividade!"
            className="w-full px-3 py-2 rounded-lg bg-tibia-dark border border-amber-800/40 text-amber-50 focus:outline-none focus:border-tibia-gold"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-amber-200/70 mb-1">Tema da Decoração *</label>
          <input
            type="text"
            value={form.theme}
            onChange={(e) => update_field('theme', e.target.value)}
            placeholder="Qual a temática da sua decoração? Seja criativo!"
            className="w-full px-3 py-2 rounded-lg bg-tibia-dark border border-amber-800/40 text-amber-50 focus:outline-none focus:border-tibia-gold"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-amber-200/70 mb-1">Exercise Dummies</label>
            <input
              type="number"
              min={0}
              value={form.dummies_count}
              onChange={(e) => update_field('dummies_count', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-tibia-dark border border-amber-800/40 text-amber-50 focus:outline-none focus:border-tibia-gold"
            />
          </div>
          <div>
            <label className="block text-sm text-amber-200/70 mb-1">Hirelings (NPCs)</label>
            <input
              type="number"
              min={0}
              value={form.hirelings_count}
              onChange={(e) => update_field('hirelings_count', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-tibia-dark border border-amber-800/40 text-amber-50 focus:outline-none focus:border-tibia-gold"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-amber-200/70 mb-1">URLs de Screenshots *</label>
          <p className="text-xs text-amber-200/40 mb-2">
            Use o <strong>link direto da imagem</strong> (termina em .png, .jpg, .gif). No Imgur,
            clique com o botão direito na foto → &quot;Copiar endereço da imagem&quot;.
          </p>
          {form.screenshot_urls.map((url, i) => (
            <div key={i} className="mb-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const urls = [...form.screenshot_urls]
                    urls[i] = e.target.value
                    update_field('screenshot_urls', urls)
                  }}
                  placeholder="https://i.imgur.com/exemplo.png"
                  className="flex-1 px-3 py-2 rounded-lg bg-tibia-dark border border-amber-800/40 text-amber-50 focus:outline-none focus:border-tibia-gold"
                />
                {form.screenshot_urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      update_field(
                        'screenshot_urls',
                        form.screenshot_urls.filter((_, idx) => idx !== i),
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-tibia-red/60 text-amber-50 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
              <ScreenshotPreview url={url} />
            </div>
          ))}
          <button
            type="button"
            onClick={() => update_field('screenshot_urls', [...form.screenshot_urls, ''])}
            className="text-xs text-tibia-gold hover:underline"
          >
            + Adicionar screenshot
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-tibia-red/20 border border-red-800/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-tibia-gold text-tibia-dark font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'A enviar...' : 'Submeter Inscrição'}
        </button>
      </form>
    </div>
  )
}

function ScreenshotPreview({ url }: { url: string }) {
  const trimmed = normalize_image_url(url.trim())
  const [status, set_status] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  useEffect(() => {
    if (!trimmed) {
      set_status('idle')
      return
    }
    console.log('[ScreenshotPreview] start loading', { url: trimmed })
    set_status('loading')
  }, [trimmed])

  if (!trimmed) return null

  return (
    <div className="mt-2">
      {status === 'error' ? (
        <p className="text-xs text-red-400">
          ✗ Não foi possível carregar esta imagem. Verifique se é o link direto (.png/.jpg) e está acessível publicamente.
        </p>
      ) : (
        <div className="relative inline-block">
          <img
            src={trimmed}
            alt="Pré-visualização"
            onLoad={() => {
              console.log('[ScreenshotPreview] onLoad ok', { url: trimmed })
              set_status('ok')
            }}
            onError={() => {
              console.log('[ScreenshotPreview] onError', { url: trimmed })
              set_status('error')
            }}
            className={`max-h-40 rounded-lg border border-amber-800/40 object-contain bg-black/40 ${
              status === 'ok' ? 'opacity-100' : 'opacity-0 h-0'
            }`}
          />
          {status === 'loading' && (
            <p className="text-xs text-amber-200/50">A carregar pré-visualização...</p>
          )}
          {status === 'ok' && (
            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-green-700/80 text-green-50 text-[10px]">
              ✓ carregada
            </span>
          )}
        </div>
      )}
    </div>
  )
}
