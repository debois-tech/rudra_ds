import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { AppShell } from './app-shell'

const getAuthenticatedUserData = cache(async () => {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll() { },
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
    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, org_id, role, full_name, email, avatar_url, is_active, organizations(name)')
        .eq('id', user.id)
        .single()

    if (!profile) return null

    const orgData = profile.organizations as unknown as { name: string } | null
    const orgName = orgData?.name || ''

    return {
        user,
        profile,
        orgName,
    }
})

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const authData = await getAuthenticatedUserData()

    if (!authData || !authData.profile || !authData.profile.is_active) {
        redirect('/login')
    }

    const { profile, orgName } = authData

    return (
        <AppShell
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
        </AppShell>
    )
}
