import { createSupabaseAdmin } from '@/lib/supabase'
import { requireSuperAdmin } from '@/lib/admin-auth-guard'
import { NextResponse, type NextRequest } from 'next/server'

// GET /api/admin/organizations/[id] — Get single org with stats
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireSuperAdmin()
    if (authError) return authError

    const supabase = createSupabaseAdmin()
    const { id } = await params

    try {
        const [org, users, customerCount, vehicleCount, docCount] = await Promise.all([
            supabase.from('organizations').select('*').eq('id', id).single(),
            supabase.from('profiles').select('*').eq('org_id', id).order('created_at', { ascending: false }),
            supabase.from('customers').select('*', { count: 'exact', head: true }).eq('org_id', id),
            supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('org_id', id),
            supabase.from('documents').select('*', { count: 'exact', head: true }).eq('org_id', id),
        ])

        if (org.error) throw org.error

        return NextResponse.json({
            organization: org.data,
            users: users.data || [],
            stats: {
                customerCount: customerCount.count || 0,
                vehicleCount: vehicleCount.count || 0,
                documentCount: docCount.count || 0,
            },
        })
    } catch (error) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
}
