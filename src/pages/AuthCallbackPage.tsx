import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { complete_discord_auth } from '../lib/auth'
import { useAuth } from '../hooks/useAuth'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { apply_discord_session } = useAuth()
  const [error, set_error] = useState<string | null>(null)
  const handled_ref = useRef(false)

  useEffect(() => {
    if (handled_ref.current) return
    handled_ref.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const oauth_error = params.get('error')

    if (oauth_error) {
      set_error(`Discord recusou o login: ${oauth_error}`)
      return
    }

    if (!code) {
      set_error('Código de autenticação não encontrado.')
      return
    }

    void complete_discord_auth(code).then((session) => {
      if (session) {
        apply_discord_session(session)
        navigate('/', { replace: true })
      } else {
        set_error('Não foi possível concluir o login com Discord.')
      }
    })
  }, [navigate, apply_discord_session])

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-red-300 mb-4">{error}</p>
        <Link to="/" className="text-tibia-gold hover:underline text-sm">
          Voltar ao início
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-amber-200/50">A autenticar com Discord...</p>
    </div>
  )
}
