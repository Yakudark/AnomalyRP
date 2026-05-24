
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const isBrowser = typeof window !== "undefined";

// Singleton pour le navigateur
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isBrowser ? window.sessionStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
