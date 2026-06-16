import { supabase } from './supabase'
import { get_discord_session } from './session'
import { FunctionsHttpError } from '@supabase/supabase-js'

async function extract_function_error_message(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json()
      if (payload && typeof payload === 'object' && 'error' in payload && payload.error) {
        return String(payload.error)
      }
    } catch {
      // ignore parse errors
    }
  }

  if (error instanceof Error && error.message) return error.message
  return 'Erro ao contactar o servidor'
}

export async function invoke_with_session<T = unknown>(
  function_name: string,
  body: Record<string, unknown> = {},
): Promise<{ data: T | null; error: Error | null }> {
  const session = get_discord_session()
  if (!session?.session_token) {
    return { data: null, error: new Error('Sessão inválida ou expirada. Faça login novamente.') }
  }

  const { data, error } = await supabase.functions.invoke(function_name, {
    body: { ...body, session_token: session.session_token },
    headers: { 'x-contest-session': session.session_token },
  })

  if (error) {
    const message = await extract_function_error_message(error)
    return { data: null, error: new Error(message) }
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { data: null, error: new Error(String(data.error)) }
  }

  return { data: data as T, error: null }
}
