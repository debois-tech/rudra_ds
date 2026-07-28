'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import AdminShell from './admin-shell'

export default async function AdminLayout({
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

    // Hard verification for the admin area: use getUser() to validate JWT with Supabase server.
    // This is the one place where we MUST verify the token (super admin access).
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, org_id, role, full_name, email, avatar_url, is_active, created_at, updated_at')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'super_admin') {
        redirect('/dashboard')
    }

    return (
        <AdminShell profile={profile}>
            {children}
        </AdminShell>
    )
}
