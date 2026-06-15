import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      navigate(session ? '/' : '/', { replace: true })
    })
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-amber-200/50">A autenticar...</p>
    </div>
  )
}
