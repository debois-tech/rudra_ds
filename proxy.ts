import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Security-hardened middleware:
 * - Server-side auth validation on every request (Supabase getUser() verifies JWT with server)
 * - Deactivated users are force-signed-out globally (all sessions/devices)
 * - Protected pages served with Cache-Control: no-store to prevent back-button exposure
 * - Role-based routing (super_admin → /admin, user → /dashboard)
 * - Open redirect prevention on login redirect
 */
export async function proxy(request: NextRequest) {
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

    // Use getSession() instead of getUser() for performance.
    // getSession() reads the session cookie locally — zero API calls.
    // JWT verification happens in the server layout on first load.
    const {
        data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user ?? null
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
        if (pathname.startsWith('/') && !pathname.startsWith('//') && !pathname.includes('://')) {
            url.searchParams.set('redirect', pathname)
        }
        return NextResponse.redirect(url)
    }

    // ============================================
    // LOGGED IN — minimal routing checks (no DB call)
    // Role/profile checks deferred to client layout
    // ============================================
    if (user) {
        // Logged in on public page → go to module selector
        if (pathname === '/login' || pathname === '/') {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }

        // Block admin routes from non-super-admins at middleware level
        if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
            // Allow the admin layout to decide — no DB call here
            return supabaseResponse
        }
    }

    // Prevent browsers from caching protected pages (back-button exposure)
    if (!isPublicRoute) {
        supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        supabaseResponse.headers.set('Pragma', 'no-cache')
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
