import { useState, useEffect } from 'react'
import { normalize_image_url } from '../lib/images'

interface ImageWithFallbackProps {
  src: string
  alt: string
  className?: string
}

export function ImageWithFallback({ src, alt, className }: ImageWithFallbackProps) {
  const [errored, set_errored] = useState(false)
  const normalized_src = normalize_image_url(src)

  useEffect(() => {
    set_errored(false)
    console.log('[ImageWithFallback] src changed', { src, normalized_src })
  }, [src, normalized_src])

  if (errored) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-tibia-dark text-amber-200/40">
        <span className="text-5xl">🏠</span>
        <span className="text-xs px-3 text-center">Imagem indisponível</span>
      </div>
    )
  }

  return (
    <img
      src={normalized_src}
      alt={alt}
      className={className}
      onLoad={() => {
        console.log('[ImageWithFallback] onLoad ok', { src, normalized_src })
      }}
      onError={() => {
        console.log('[ImageWithFallback] onError', { src, normalized_src })
        set_errored(true)
      }}
    />
  )
}
