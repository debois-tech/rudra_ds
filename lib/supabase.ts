import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// ============================================
// BROWSER CLIENT (for client components)
// Uses anon key + picks up user session from cookies
// RLS policies apply automatically based on logged-in user
// ============================================
let browserClient: ReturnType<typeof createBrowserClient> | undefined

export function createSupabaseBrowser() {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}

// ============================================
// SERVICE ROLE CLIENT (for admin operations)
// Bypasses RLS — use ONLY in server-side code
// Used by: super admin APIs, server-side operations
// ============================================
export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// ============================================
// DEFAULT EXPORT for backward compatibility
// Existing code imports { supabase } from '@/lib/supabase'
// We keep this working but it now uses the browser client
// ============================================
export const supabase = createSupabaseBrowser()