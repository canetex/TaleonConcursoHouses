import { useEffect, useState } from 'react'

interface ShareHouseModalProps {
  permalink: string
  house_name: string
  on_close: () => void
}

export function ShareHouseModal({ permalink, house_name, on_close }: ShareHouseModalProps) {
  const [copied, set_copied] = useState(false)

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

  const handle_copy = async () => {
    try {
      await navigator.clipboard.writeText(permalink)
      set_copied(true)
      setTimeout(() => set_copied(false), 2000)
    } catch {
      const input = document.getElementById('house-permalink-input') as HTMLInputElement | null
      input?.select()
      document.execCommand('copy')
      set_copied(true)
      setTimeout(() => set_copied(false), 2000)
    }
  }

  const handle_native_share = async () => {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: house_name,
        text: `Confira esta casa no concurso: ${house_name}`,
        url: permalink,
      })
    } catch {
      // usuário cancelou ou share indisponível
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={on_close}
      role="dialog"
      aria-modal="true"
      aria-label="Compartilhar casa"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-tibia-panel border border-amber-800/40 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-tibia-gold">Compartilhar</h3>
            <p className="text-sm text-amber-200/60 mt-1">{house_name}</p>
          </div>
          <button
            type="button"
            onClick={on_close}
            className="w-8 h-8 rounded-full bg-tibia-dark/80 text-amber-200/70 hover:text-amber-100"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <label htmlFor="house-permalink-input" className="block text-xs text-amber-200/50 mb-1">
          Link permanente
        </label>
        <div className="flex gap-2">
          <input
            id="house-permalink-input"
            type="text"
            readOnly
            value={permalink}
            className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-tibia-dark border border-amber-800/40 text-amber-100 text-sm"
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            onClick={handle_copy}
            className="px-4 py-2 rounded-lg bg-tibia-gold text-tibia-dark text-sm font-medium hover:bg-amber-400 whitespace-nowrap"
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <button
            type="button"
            onClick={handle_native_share}
            className="mt-4 w-full py-2.5 rounded-lg border border-amber-700/40 text-amber-100 text-sm hover:bg-tibia-dark/60"
          >
            Partilhar via…
          </button>
        )}
      </div>
    </div>
  )
}
