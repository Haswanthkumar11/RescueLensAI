import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly at startup instead of a confusing "session is always
  // null" bug later.
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy frontend/.env.example to .env and fill them in.'
  )
}

const REMEMBER_KEY = 'rl_remember'

/**
 * "Remember Me" storage adapter: Supabase's client picks a storage
 * location once at construction time by default, which would make the
 * checkbox on the login form only take effect after a page reload.
 * This adapter instead checks the flag on every read/write, so setting
 * it right before signInWithPassword() takes effect immediately.
 */
const rememberableStorage = {
  getItem: (key) => localStorage.getItem(key) ?? sessionStorage.getItem(key),
  setItem: (key, value) => {
    const remember = localStorage.getItem(REMEMBER_KEY) !== 'false'
    if (remember) {
      sessionStorage.removeItem(key)
      localStorage.setItem(key, value)
    } else {
      localStorage.removeItem(key)
      sessionStorage.setItem(key, value)
    }
  },
  removeItem: (key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: rememberableStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export function setRememberMe(remember) {
  localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false')
}
