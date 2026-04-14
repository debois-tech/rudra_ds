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
  try {
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

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'super_admin') {
        redirect('/admin')
      } else {
        redirect('/dashboard')
      }
    }
  } catch {
    // Not authenticated — fall through to landing page
  }

  return <LandingPage />
}