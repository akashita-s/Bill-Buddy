import { createClient } from '@supabase/supabase-js'

// Reads the same variable names defined in .env.local.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  // Surfaces misconfiguration early instead of failing with a cryptic error.
  console.warn(
    'Supabase env vars are missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
