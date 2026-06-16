import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CONTEST_LOGO_ALT, CONTEST_LOGO_URL } from '../lib/assets'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { is_authenticated, login, loading } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect_to = params.get('redirect') ?? '/'

  useEffect(() => {
    if (!loading && is_authenticated) {
      navigate(redirect_to, { replace: true })
    }
  }, [is_authenticated, loading, navigate, redirect_to])

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <img
        src={CONTEST_LOGO_URL}
        alt={CONTEST_LOGO_ALT}
        className="mx-auto w-36 sm:w-44 max-w-full object-contain mb-6 drop-shadow-[0_6px_20px_rgba(0,0,0,0.4)]"
      />
      <h2 className="text-2xl font-bold text-tibia-gold mb-3">Entrar no Concurso</h2>
      <p className="text-amber-200/70 mb-8">
        Faça login com Discord para inscrever a sua casa, votar ou aceder ao painel admin.
      </p>
      <button
        onClick={() => login()}
        className="px-6 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium"
      >
        Entrar com Discord
      </button>
      <p className="mt-6 text-sm text-amber-200/40">
        <Link to="/" className="hover:text-amber-200/70">
          ← Voltar ao início
        </Link>
      </p>
    </div>
  )
}
