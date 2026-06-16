export function normalize_image_url(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  try {
    const parsed = new URL(trimmed)

    const imgur_page = parsed.hostname.replace(/^www\./, '') === 'imgur.com'
      && /^\/[a-zA-Z0-9]+$/.test(parsed.pathname)
    if (imgur_page) {
      const id = parsed.pathname.slice(1)
      const normalized = `https://i.imgur.com/${id}.png`
      console.log('[normalize_image_url] imgur page -> direct', { original: trimmed, normalized })
      return normalized
    }

    const imgur_direct = parsed.hostname.replace(/^www\./, '') === 'i.imgur.com'
      && /^\/[a-zA-Z0-9]+$/.test(parsed.pathname)
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
