import { createClient } from '@supabase/supabase-js'

// These variables are pulled from the Replit Secrets you created.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// This creates the Supabase client that we will use to talk to our database.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)