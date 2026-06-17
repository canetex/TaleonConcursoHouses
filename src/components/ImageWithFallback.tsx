import { useState, useEffect } from 'react'
import { is_direct_image_url, normalize_image_url, resolve_image_url } from '../lib/images'
import { HouseImagePlaceholder } from './HouseImagePlaceholder'

interface ImageWithFallbackProps {
  src: string
  alt: string
  className?: string
  on_click?: (display_src: string) => void
  placeholder_subtitle?: string
}

export function ImageWithFallback({
  src,
  alt,
  className,
  on_click,
  placeholder_subtitle,
}: ImageWithFallbackProps) {
  const [display_src, set_display_src] = useState<string | null>(null)
  const [errored, set_errored] = useState(false)
  const [loading, set_loading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      set_loading(true)
      set_errored(false)
      set_display_src(null)

      const trimmed = src.trim()
      if (!trimmed) {
        set_loading(false)
        set_errored(true)
        return
      }

      const quick = normalize_image_url(trimmed)
      if (is_direct_image_url(quick)) {
        if (!cancelled) {
          set_display_src(quick)
          set_loading(false)
        }
        return
      }

      const resolved = await resolve_image_url(trimmed)
      if (cancelled) return

      if (resolved) {
        set_display_src(resolved)
      } else {
        set_errored(true)
      }

      set_loading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [src])

  if (loading) {
    return (
      <HouseImagePlaceholder
        label="A carregar imagem..."
        className={className ?? 'w-full h-full min-h-[240px]'}
      />
    )
  }

  if (errored || !display_src) {
    return (
      <HouseImagePlaceholder
        label={alt}
        subtitle={placeholder_subtitle ?? 'Imagem indisponível'}
        className={className ?? 'w-full h-full min-h-[240px]'}
      />
    )
  }

  return (
    <img
      src={display_src}
      alt={alt}
      className={`${className ?? ''} ${on_click ? 'cursor-zoom-in' : ''}`.trim()}
      onClick={() => {
        if (display_src && on_click) on_click(display_src)
      }}
      onError={() => {
        set_display_src(null)
        set_errored(true)
      }}
    />
  )
}
