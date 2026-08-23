import { createSupabaseAdmin } from '@/lib/supabase'
import { requireSuperAdmin } from '@/lib/admin-auth-guard'
import { NextResponse, type NextRequest } from 'next/server'

// GET /api/admin/organizations — List all organizations
export async function GET(request: NextRequest) {
    const authError = await requireSuperAdmin(request)
    if (authError) return authError

    const supabase = createSupabaseAdmin()

    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('created_at', { ascending: false })
        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
    }
}

// POST /api/admin/organizations — Create new organization
export async function POST(request: NextRequest) {
    const authError = await requireSuperAdmin(request)
    if (authError) return authError

    const supabase = createSupabaseAdmin()

    try {
        const body = await request.json()
        const { data, error } = await supabase
            .from('organizations')
            .insert([{
                name: body.name,
                slug: body.slug?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '',
                phone: body.phone || null,
                email: body.email || null,
                address: body.address || null,
            }])
            .select()
            .single()
        if (error) throw error
        return NextResponse.json(data)
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to create organization'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

// PATCH /api/admin/organizations — Update organization (pass id in body)
export async function PATCH(request: NextRequest) {
    const authError = await requireSuperAdmin(request)
    if (authError) return authError

    const supabase = createSupabaseAdmin()

    try {
        const body = await request.json()
        const { id, name, slug, phone, email, address, is_active } = body
        const updates = { name, slug, phone, email, address, is_active }
        const { data, error } = await supabase
            .from('organizations')
            .update(updates)
            .eq('id', id)
            .select()
            .single()
        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
    }
}
