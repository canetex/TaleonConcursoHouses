import { useEffect } from 'react'

interface ImageLightboxProps {
  src: string
  alt: string
  on_close: () => void
}

export function ImageLightbox({ src, alt, on_close }: ImageLightboxProps) {
  useEffect(() => {
    const handle_key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') on_close()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handle_key)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handle_key)
    }
  }, [on_close])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={on_close}
      role="dialog"
      aria-modal="true"
      aria-label="Imagem ampliada"
    >
      <button
        type="button"
        onClick={on_close}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white text-xl hover:bg-black/80"
        aria-label="Fechar"
      >
        ✕
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
