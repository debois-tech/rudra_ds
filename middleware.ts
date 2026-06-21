import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very
    // hard to debug issues with users being randomly logged out.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // ============================================
    // PUBLIC ROUTES (no auth required)
    // ============================================
    const isPublicRoute =
        pathname === '/' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth') ||
        pathname === '/robots.txt' ||
        pathname === '/sitemap.xml' ||
        pathname === '/og-image.png' ||
        pathname === '/apple-touch-icon.png'

    // ============================================
    // NOT LOGGED IN → redirect to /login
    // ============================================
    if (!user && !isPublicRoute) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
    }

    // ============================================
    // LOGGED IN — fetch profile ONCE for all checks
    // ============================================
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, is_active')
            .eq('id', user.id)
            .single()

        // ── Deactivated user → sign out and redirect to login ──
        if (profile && !profile.is_active) {
            await supabase.auth.signOut()
            if (pathname.startsWith('/api/')) {
                return NextResponse.json(
                    { error: 'Account deactivated. Contact your administrator.' },
                    { status: 403 }
                )
            }
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        const role = profile?.role

        // ── Logged in on public page → redirect based on role ──
        if (pathname === '/login' || pathname === '/') {
            const url = request.nextUrl.clone()
            url.pathname = role === 'super_admin' ? '/admin' : '/dashboard'
            return NextResponse.redirect(url)
        }

        // ── Super admin on /dashboard → redirect to /admin ──
        if (role === 'super_admin' && pathname.startsWith('/dashboard')) {
            const url = request.nextUrl.clone()
            url.pathname = '/admin'
            return NextResponse.redirect(url)
        }

        // ── Admin routes → require super_admin role ──
        const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
        if (isAdminRoute && role !== 'super_admin') {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - robots.txt, sitemap.xml (SEO crawlers must reach these)
         * - public image files (svg, png, jpg, jpeg, gif, webp)
         * - og-image.png, apple-touch-icon.png (SEO/social assets)
         */
        '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|og-image.png|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
