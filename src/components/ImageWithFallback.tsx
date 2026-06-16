import { useState, useEffect } from 'react'

interface ImageWithFallbackProps {
  src: string
  alt: string
  className?: string
}

export function ImageWithFallback({ src, alt, className }: ImageWithFallbackProps) {
  const [errored, set_errored] = useState(false)

  useEffect(() => {
    set_errored(false)
  }, [src])

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
      src={src}
      alt={alt}
      className={className}
      onError={() => set_errored(true)}
    />
  )
}
