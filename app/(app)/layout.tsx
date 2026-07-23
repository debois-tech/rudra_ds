import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { AppShell } from './app-shell'

export default async function AppLayout({
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
                setAll() { },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, org_id, role, full_name, email, avatar_url, is_active')
        .eq('id', user.id)
        .single()

    if (!profile || !profile.is_active) {
        redirect('/login')
    }

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
