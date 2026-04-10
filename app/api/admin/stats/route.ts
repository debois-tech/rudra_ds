import { createSupabaseAdmin } from '@/lib/supabase'
import { requireSuperAdmin } from '@/lib/admin-auth-guard'
import { NextResponse, type NextRequest } from 'next/server'

// GET /api/admin/stats — Platform-wide stats
export async function GET(request: NextRequest) {
    const authError = await requireSuperAdmin(request)
    if (authError) return authError

    const supabase = createSupabaseAdmin()

    try {
        const [orgs, activeOrgs, users, customers, services] = await Promise.all([
            supabase.from('organizations').select('*', { count: 'exact', head: true }),
            supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('customers').select('*', { count: 'exact', head: true }),
            supabase.from('services').select('*', { count: 'exact', head: true }),
        ])

        return NextResponse.json({
            totalOrgs: orgs.count || 0,
            activeOrgs: activeOrgs.count || 0,
            totalUsers: users.count || 0,
            totalCustomers: customers.count || 0,
            totalServices: services.count || 0,
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
