import { supabase } from './supabase'

const CHARACTER_PROFILE_URL = 'https://san.taleon.online/characterprofile.php'

export async function validate_character(character_name: string): Promise<boolean> {
  const trimmed = character_name.trim()
  if (!trimmed) return false

  const { data, error } = await supabase.functions.invoke('validate-character', {
    body: { character_name: trimmed },
  })

  if (error) {
    console.error('Character validation error:', error)
    return false
  }

  return data?.valid === true
}

export function get_character_profile_url(character_name: string): string {
  return `${CHARACTER_PROFILE_URL}?name=${encodeURIComponent(character_name)}`
}
