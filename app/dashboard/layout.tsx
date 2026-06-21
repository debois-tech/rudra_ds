import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { DashboardShell } from './dashboard-shell'

/**
 * Dashboard Layout — Server Component
 * Verifies authentication on the server before rendering any content.
 * This prevents "flash of unauthorized content" that occurs with client-only auth.
 */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll() { /* no-op in server component */ },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile data on server to pass down
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, org_id, role, full_name, email, avatar_url, is_active')
        .eq('id', user.id)
        .single()

    if (!profile || !profile.is_active) {
        redirect('/login')
    }

    // Fetch org name if user has an org
    let orgName = ''
    if (profile.org_id) {
        const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', profile.org_id)
            .single()
        if (org) orgName = org.name
    }

    return (
        <DashboardShell
            profile={{
                id: profile.id,
                org_id: profile.org_id,
                role: profile.role,
                full_name: profile.full_name,
                email: profile.email,
                avatar_url: profile.avatar_url,
                is_active: profile.is_active,
            }}
            orgName={orgName}
        >
            {children}
        </DashboardShell>
    )
}