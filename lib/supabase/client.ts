import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/integrations/supabase/types'

// Pour les routes API serveur, utilise process.env
// Supporte les variables Vite et Next.js pour compatibilité
const SUPABASE_URL = 
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL

const SUPABASE_ANON_KEY = 
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY')
  }
  
  return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  })
}











