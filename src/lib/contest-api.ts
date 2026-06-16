import { supabase } from './supabase'
import { get_discord_session } from './session'

export async function invoke_with_session<T = unknown>(
  function_name: string,
  body: Record<string, unknown> = {},
): Promise<{ data: T | null; error: Error | null }> {
  const session = get_discord_session()
  if (!session?.session_token) {
    return { data: null, error: new Error('Sessão inválida ou expirada') }
  }

  const { data, error } = await supabase.functions.invoke(function_name, {
    body: { ...body, session_token: session.session_token },
    headers: { 'x-contest-session': session.session_token },
  })

  if (error) return { data: null, error: new Error(error.message) }
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { data: null, error: new Error(String(data.error)) }
  }

  return { data: data as T, error: null }
}
