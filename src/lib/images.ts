import { supabase } from './supabase'

const DIRECT_IMAGE_PATTERN = /\.(png|jpe?g|gif|webp|bmp)(\?.*)?$/i

export function is_direct_image_url(url: string): boolean {
  try {
    const parsed = new URL(url.trim())
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'i.imgur.com' && DIRECT_IMAGE_PATTERN.test(parsed.pathname)) {
      return true
    }

    return DIRECT_IMAGE_PATTERN.test(url)
  } catch {
    return false
  }
}

export function normalize_image_url(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'i.imgur.com' && DIRECT_IMAGE_PATTERN.test(parsed.pathname)) {
      const normalized = `${parsed.origin}${parsed.pathname}`
      console.log('[normalize_image_url] direct image', { original: trimmed, normalized })
      return normalized
    }

    const imgur_page = host === 'imgur.com' && /^\/[a-zA-Z0-9]+$/.test(parsed.pathname)
    if (imgur_page) {
      const id = parsed.pathname.slice(1)
      const normalized = `https://i.imgur.com/${id}.png`
      console.log('[normalize_image_url] imgur page -> direct', { original: trimmed, normalized })
      return normalized
    }

    const imgur_direct = host === 'i.imgur.com' && /^\/[a-zA-Z0-9]+$/.test(parsed.pathname)
    if (imgur_direct) {
      const normalized = `https://i.imgur.com${parsed.pathname}.png`
      console.log('[normalize_image_url] imgur direct without ext', { original: trimmed, normalized })
      return normalized
    }
  } catch {
    console.log('[normalize_image_url] invalid url', { url: trimmed })
    return trimmed
  }

  return trimmed
}

export function needs_image_resolution(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (is_direct_image_url(trimmed)) return false

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'imgur.com') return true
    if (host === 'i.imgur.com') return true
  } catch {
    return false
  }

  return !is_direct_image_url(trimmed)
}

export async function resolve_image_url(url: string): Promise<string | null> {
  const trimmed = url.trim()
  if (!trimmed) return null

  const quick = normalize_image_url(trimmed)
  if (is_direct_image_url(quick)) {
    console.log('[resolve_image_url] quick resolve', { original: trimmed, resolved: quick })
    return quick
  }

  console.log('[resolve_image_url] calling edge function', { url: trimmed })

  const { data, error } = await supabase.functions.invoke('resolve-image-url', {
    body: { url: trimmed },
  })

  if (error) {
    console.error('[resolve_image_url] edge function error', error)
    return null
  }

  const resolved = typeof data?.resolved_url === 'string' ? data.resolved_url : null
  console.log('[resolve_image_url] resolved', { original: trimmed, resolved, source: data?.source })

  return resolved
}
