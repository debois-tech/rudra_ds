import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Shared guard for all /api/admin/* route handlers.
 * Verifies the caller is authenticated AND has the 'super_admin' role
 * directly on the server — independent of middleware.
 *
 * Returns null if the caller is authorized.
 * Returns a NextResponse (401 or 403) if they are not — caller should return it immediately.
 */
export async function requireSuperAdmin(): Promise<NextResponse | null> {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options)
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 })
    }

    return null // Authorized
}
