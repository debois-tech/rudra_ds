import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import LandingPage from '@/components/landing-page'

/**
 * Root page:
 * - Logged-in users  → redirect to /dashboard or /admin
 * - Guest visitors   → render the SEO-optimised public landing page
 */
export default async function Home() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() { /* no-op during server render */ },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Invalid/expired session — treat as unauthenticated
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    // Only redirect active users; inactive users see the landing page
    if (profile?.is_active !== false) {
      if (profile?.role === 'super_admin') {
        redirect('/admin')
      } else {
        redirect('/dashboard')
      }
    }
  }

  return <LandingPage />
}