import { useState, useEffect } from 'react'
import { is_direct_image_url, normalize_image_url, resolve_image_url } from '../lib/images'

interface ImageWithFallbackProps {
  src: string
  alt: string
  className?: string
  on_click?: (display_src: string) => void
}

export function ImageWithFallback({ src, alt, className, on_click }: ImageWithFallbackProps) {
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

      console.log('[ImageWithFallback] resolving', { src: trimmed })

      const quick = normalize_image_url(trimmed)
      if (is_direct_image_url(quick)) {
        if (!cancelled) {
          console.log('[ImageWithFallback] using direct url', { display_src: quick })
          set_display_src(quick)
          set_loading(false)
        }
        return
      }

      const resolved = await resolve_image_url(trimmed)
      if (cancelled) return

      if (resolved) {
        console.log('[ImageWithFallback] using resolved url', { display_src: resolved })
        set_display_src(resolved)
      } else {
        console.warn('[ImageWithFallback] could not resolve url', { src: trimmed })
        set_errored(true)
      }

      set_loading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [src])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-tibia-dark text-amber-200/40 text-xs">
        A carregar imagem...
      </div>
    )
  }

  if (errored || !display_src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-tibia-dark text-amber-200/40">
        <span className="text-5xl">🏠</span>
        <span className="text-xs px-3 text-center">Imagem indisponível</span>
        <span className="text-[10px] px-3 text-center text-amber-200/30 break-all">{src}</span>
      </div>
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
      onLoad={() => {
        console.log('[ImageWithFallback] onLoad ok', { src, display_src })
      }}
      onError={() => {
        console.log('[ImageWithFallback] onError', { src, display_src })
        set_errored(true)
      }}
    />
  )
}
