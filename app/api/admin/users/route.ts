import { createSupabaseAdmin } from '@/lib/supabase'
import { requireSuperAdmin } from '@/lib/admin-auth-guard'
import { NextResponse, type NextRequest } from 'next/server'

// GET /api/admin/users — List all users with org names
export async function GET(request: NextRequest) {
    const authError = await requireSuperAdmin(request)
    if (authError) return authError

    const supabase = createSupabaseAdmin()

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*, organizations(name)')
            .order('created_at', { ascending: false })
        if (error) throw error

        const users = (data || []).map((p: Record<string, unknown>) => ({
            ...p,
            org_name: (p.organizations as { name: string } | null)?.name || null,
        }))

        return NextResponse.json(users)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}

// POST /api/admin/users — Create new user via Admin Auth API
export async function POST(request: NextRequest) {
    const authError = await requireSuperAdmin(request)
    if (authError) return authError

    const supabase = createSupabaseAdmin()

    try {
        const body = await request.json()
        const { data, error } = await supabase.auth.admin.createUser({
            email: body.email,
            password: body.password,
            email_confirm: true,
            user_metadata: {
                full_name: body.full_name,
                org_id: body.org_id,
                role: body.role || 'user',
            },
        })
        if (error) throw error
        return NextResponse.json({ user: { id: data.user.id, email: data.user.email } })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to create user'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

// DELETE /api/admin/users — Delete user (pass userId in body)
export async function DELETE(request: NextRequest) {
    const authError = await requireSuperAdmin(request)
    if (authError) return authError

    const supabase = createSupabaseAdmin()

    try {
        const body = await request.json()
        const { error } = await supabase.auth.admin.deleteUser(body.userId)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
