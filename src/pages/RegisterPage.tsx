import { useEffect, useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { invoke_with_session } from '../lib/contest-api'
import { usePhase } from '../hooks/usePhase'
import { can_register } from '../lib/phases'
import { validate_character } from '../lib/character'
import { resolve_image_url } from '../lib/images'
import { TaleonSanLink, TheCrustyLink } from '../lib/links'
import {
  find_house,
  format_location,
  get_cities,
  get_houses_by_city,
} from '../lib/tibia-houses-catalog'
import { fetch_house_coords } from '../lib/tibia-houses'
import type { House, HouseRegistrationForm } from '../types'

const empty_form: HouseRegistrationForm = {
  character_name: '',
  house_city: '',
  house_tibia_name: '',
  house_type: 'house',
  floor: '',
  custom_name: '',
  theme: '',
  dummies_count: 0,
  hirelings_count: 0,
  screenshot_urls: [''],
}

const status_labels: Record<House['status'], string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
}

function parse_legacy_location(location: string): { house_city: string; house_tibia_name: string } | null {
  const comma_index = location.lastIndexOf(', ')
  if (comma_index <= 0) return null
  return {
    house_tibia_name: location.slice(0, comma_index).trim(),
    house_city: location.slice(comma_index + 2).trim(),
  }
}

function house_to_form(house: House): HouseRegistrationForm {
  const legacy = !house.house_city || !house.house_tibia_name
    ? parse_legacy_location(house.location)
    : null

  return {
    character_name: house.character_name,
    house_city: house.house_city ?? legacy?.house_city ?? '',
    house_tibia_name: house.house_tibia_name ?? legacy?.house_tibia_name ?? '',
    house_type: house.house_type ?? 'house',
    floor: house.floor,
    custom_name: house.custom_name,
    theme: house.theme,
    dummies_count: house.dummies_count,
    hirelings_count: house.hirelings_count,
    screenshot_urls: house.screenshot_urls.length > 0 ? house.screenshot_urls : [''],
  }
}

export function RegisterPage() {
  const { is_authenticated, discord_id } = useAuth()
  const { phase, dates } = usePhase()
  const navigate = useNavigate()

  const [form, set_form] = useState<HouseRegistrationForm>(empty_form)
  const [validating, set_validating] = useState(false)
  const [character_valid, set_character_valid] = useState<boolean | null>(null)
  const [submitting, set_submitting] = useState(false)
  const [error, set_error] = useState<string | null>(null)
  const [existing_house, set_existing_house] = useState<House | null>(null)
  const [loading_house, set_loading_house] = useState(true)

  const is_editing = !!existing_house

  const available_cities = get_cities(form.house_type)
  const available_houses = form.house_city
    ? get_houses_by_city(form.house_city, form.house_type)
    : []

  useEffect(() => {
    if (!discord_id) {
      set_loading_house(false)
      return
    }

    set_loading_house(true)
    supabase
      .from('houses')
      .select('*')
      .eq('discord_user_id', discord_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          set_existing_house(data)
          set_form(house_to_form(data))
          set_character_valid(true)
        }
        set_loading_house(false)
      })
  }, [discord_id])

  const update_field = <K extends keyof HouseRegistrationForm>(
    key: K,
    value: HouseRegistrationForm[K],
  ) => set_form((prev) => ({ ...prev, [key]: value }))

  const handle_validate_character = async () => {
    set_validating(true)
    set_character_valid(null)
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

    if (!can_register(phase, dates)) {
      set_error(
        phase === 'scheduled'
          ? 'As inscrições ainda não abriram. Consulte o cronograma nas regras.'
          : 'O período de inscrições está encerrado.',
      )
      return
    }

    const character_unchanged =
      is_editing && form.character_name.trim() === existing_house?.character_name

    if (!character_unchanged && character_valid !== true) {
      set_validating(true)
      const valid = await validate_character(form.character_name)
      set_character_valid(valid)
      set_validating(false)
      if (!valid) {
        set_error('Personagem inválido ou não encontrado no Taleon — San.')
        return
      }
    }

    const raw_urls = form.screenshot_urls.map((url) => url.trim()).filter(Boolean)
    const screenshot_urls = (
      await Promise.all(raw_urls.map((url) => resolve_image_url(url)))
    ).filter((url): url is string => !!url)

    if (screenshot_urls.length === 0) {
      set_error('Não foi possível resolver nenhuma URL de screenshot. Use link direto da imagem ou álbum Imgur válido.')
      return
    }

    const selected_house = find_house(form.house_city, form.house_tibia_name)
    if (!selected_house) {
      set_error('Casa selecionada inválida.')
      return
    }

    set_submitting(true)

    const location = format_location(form.house_city, form.house_tibia_name)
    const house_changed =
      !is_editing ||
      form.house_city !== existing_house?.house_city ||
      form.house_tibia_name !== existing_house?.house_tibia_name

    let map_x = existing_house?.map_x ?? null
    let map_y = existing_house?.map_y ?? null
    let map_z = existing_house?.map_z ?? null

    if (!is_editing || house_changed) {
      const coords = await fetch_house_coords(selected_house.wiki_slug)
      map_x = coords?.x ?? null
      map_y = coords?.y ?? null
      map_z = coords?.z ?? null
    }

    const payload = {
      character_name: form.character_name.trim(),
      location,
      floor: form.floor.trim(),
      custom_name: form.custom_name.trim(),
      theme: form.theme.trim(),
      dummies_count: form.dummies_count,
      hirelings_count: form.hirelings_count,
      screenshot_urls,
      house_city: form.house_city,
      house_tibia_name: form.house_tibia_name,
      house_wiki_slug: selected_house.wiki_slug,
      house_wiki_url: selected_house.wiki_url,
      house_type: selected_house.type,
      map_x,
      map_y,
      map_z,
      updated_at: new Date().toISOString(),
    }

    if (is_editing && existing_house) {
      const { data, error: update_error } = await invoke_with_session<{ house: House; action: string }>(
        'upsert-house',
        payload,
      )

      set_submitting(false)

      if (update_error) {
        set_error(update_error.message)
        return
      }

      navigate(`/house/${data?.house?.id ?? existing_house.id}`)
      return
    }

    const { data, error: insert_error } = await invoke_with_session<{ house: House; action: string }>(
      'upsert-house',
      payload,
    )

    set_submitting(false)

    if (insert_error) {
      set_error(insert_error.message)
      return
    }

    if (data?.house?.id) {
      navigate(`/house/${data.house.id}`)
    } else {
      navigate('/')
    }
  }

  if (!is_authenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent('/inscrever')}`} replace />
  }

  if (loading_house) {
    return <div className="text-center py-16 text-amber-200/50">A carregar inscrição...</div>
  }

  if (!can_register(phase, dates)) {
    if (existing_house && phase !== 'scheduled') {
      return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-amber-200/70 mb-2">O período de edição de inscrições está encerrado.</p>
          <p className="text-sm text-amber-200/50 mb-6">
            Estado da sua inscrição:{' '}
            <strong className="text-amber-200">{status_labels[existing_house.status]}</strong>
          </p>
          <Link
            to={`/house/${existing_house.id}`}
            className="inline-block px-6 py-3 rounded-xl bg-tibia-gold text-tibia-dark font-medium hover:bg-amber-400"
          >
            Ver minha casa
          </Link>
        </div>
      )
    }

    if (phase === 'scheduled') {
      return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-4xl mb-4">⏳</p>
          <p className="text-amber-200/70 mb-2">As inscrições abrem em breve.</p>
          {dates && (
            <p className="text-sm text-amber-200/50 mb-6">
              Abertura:{' '}
              {new Date(dates.registration_start).toLocaleString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Sao_Paulo',
              })}{' '}
              (horário de Brasília)
            </p>
          )}
          <Link to="/regras" className="text-tibia-gold hover:underline text-sm">
            Ver cronograma completo →
          </Link>
        </div>
      )
    }

    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-amber-200/70">O período de inscrições não está ativo.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-tibia-gold mb-2">
        {is_editing ? 'Editar Inscrição' : 'Inscrever Casa'}
      </h2>

      {is_editing && existing_house && (
        <div className="mb-4 p-3 rounded-lg bg-tibia-dark/60 border border-amber-800/30 text-sm flex flex-wrap items-center justify-between gap-2">
          <span className="text-amber-200/70">
            Estado: <strong className="text-amber-100">{status_labels[existing_house.status]}</strong>
          </span>
          <Link
            to={`/house/${existing_house.id}`}
            className="text-tibia-gold hover:underline text-xs"
          >
            Ver página da casa →
          </Link>
        </div>
      )}

      <p className="text-sm text-amber-200/50 mb-6">
        {is_editing ? (
          <>Pode atualizar os dados da sua inscrição enquanto o período de inscrições estiver aberto.</>
        ) : (
          <>
            Taxa de inscrição: <strong className="text-amber-200">10 TC (Tibia Coins)</strong> transferidas para{' '}
            <TheCrustyLink className="text-amber-200 font-semibold" />.
            A inscrição ficará pendente até confirmação do pagamento.
          </>
        )}
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
                const unchanged =
                  is_editing && e.target.value.trim() === existing_house?.character_name
                set_character_valid(unchanged ? true : null)
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
            <p className="text-xs text-green-400 mt-1">
              ✓ Personagem válido no <TaleonSanLink className="text-green-400" />
            </p>
          )}
          {character_valid === false && (
            <p className="text-xs text-red-400 mt-1">✗ Personagem não encontrado</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-amber-200/70 mb-1">Tipo *</label>
            <select
              value={form.house_type}
              onChange={(e) => {
                const new_type = e.target.value as 'house' | 'guildhall'
                update_field('house_type', new_type)
                update_field('house_tibia_name', '')
                const valid_cities = get_cities(new_type)
                if (form.house_city && !valid_cities.includes(form.house_city)) {
                  update_field('house_city', '')
                }
              }}
              className="w-full px-3 py-2 rounded-lg bg-tibia-dark border border-amber-800/40 text-amber-50 focus:outline-none focus:border-tibia-gold"
            >
              <option value="house">Casa</option>
              <option value="guildhall">Guildhall</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-amber-200/70 mb-1">Cidade *</label>
            <select
              value={form.house_city}
              onChange={(e) => {
                update_field('house_city', e.target.value)
                update_field('house_tibia_name', '')
              }}
              className="w-full px-3 py-2 rounded-lg bg-tibia-dark border border-amber-800/40 text-amber-50 focus:outline-none focus:border-tibia-gold"
              required
            >
              <option value="">Selecione a cidade</option>
              {available_cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-amber-200/70 mb-1">Casa / Guildhall *</label>
            <select
              value={form.house_tibia_name}
              onChange={(e) => update_field('house_tibia_name', e.target.value)}
              disabled={!form.house_city}
              className="w-full px-3 py-2 rounded-lg bg-tibia-dark border border-amber-800/40 text-amber-50 focus:outline-none focus:border-tibia-gold disabled:opacity-50"
              required
            >
              <option value="">
                {form.house_city
                  ? `Selecione a ${form.house_type === 'guildhall' ? 'guildhall' : 'casa'}`
                  : 'Selecione a cidade primeiro'}
              </option>
              {available_houses.map((house) => (
                <option key={house.wiki_slug} value={house.name}>
                  {house.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-amber-200/40 mt-1">
              Lista baseada no{' '}
              <a
                href="https://www.tibiawiki.com.br/wiki/Todas_as_casas"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Tibia Wiki
              </a>
              {form.house_city && ` — ${available_houses.length} opções`}
            </p>
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
          <p className="col-span-2 text-sm text-amber-200/70 leading-relaxed">
            Quantos estão disponíveis para uso na casa? Não precisam estar no mesmo andar que está
            concorrendo na decoração.
          </p>
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
          {submitting
            ? 'A guardar...'
            : is_editing
              ? 'Guardar Alterações'
              : 'Submeter Inscrição'}
        </button>
      </form>
    </div>
  )
}

function ScreenshotPreview({ url }: { url: string }) {
  const trimmed = url.trim()
  const [display_src, set_display_src] = useState<string | null>(null)
  const [status, set_status] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  useEffect(() => {
    let cancelled = false

    if (!trimmed) {
      set_status('idle')
      set_display_src(null)
      return
    }

    async function load() {
      set_status('loading')
      set_display_src(null)

      const resolved = await resolve_image_url(trimmed)
      if (cancelled) return

      if (resolved) {
        set_display_src(resolved)
        set_status('ok')
      } else {
        set_status('error')
      }
    }

    load()

    return () => {
      cancelled = true
    }
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
          {status === 'loading' && (
            <p className="text-xs text-amber-200/50">A resolver e carregar pré-visualização...</p>
          )}
          {display_src && (
            <img
              src={display_src}
              alt="Pré-visualização"
              onError={() => set_status('error')}
              className={`max-h-40 rounded-lg border border-amber-800/40 object-contain bg-black/40 ${
                status === 'ok' ? 'opacity-100' : 'opacity-0 h-0'
              }`}
            />
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
