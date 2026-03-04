import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidSupabaseUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return false
  }

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

if (!supabaseUrl || !supabaseAnonKey || !isValidSupabaseUrl(supabaseUrl)) {
  console.warn('Supabase environment variables are missing or invalid. Auth features will be disabled until they are configured.')
}

const supabase = (supabaseUrl && supabaseAnonKey && isValidSupabaseUrl(supabaseUrl))
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null

export default supabase
