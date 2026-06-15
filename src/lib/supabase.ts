import { createClient } from '@supabase/supabase-js'

const supabase_url = import.meta.env.VITE_SUPABASE_URL as string
const supabase_anon_key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabase_url, supabase_anon_key)
