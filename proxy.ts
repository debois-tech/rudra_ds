import { NextResponse, type NextRequest } from 'next/server'

/**
 * Cheap request gate. Protected page requests verify the session in the app
 * layout. Duplicating Supabase getUser() here added a network round-trip to
 * every navigation. API handlers keep their own auth guards.
 */
export function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    const isPublicRoute =
        pathname === '/' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth') ||
        pathname === '/robots.txt' ||
        pathname === '/sitemap.xml' ||
        pathname === '/og-image.png' ||
        pathname === '/apple-touch-icon.png'

    const hasAuthToken = request.cookies.getAll().some(c =>
        c.name.startsWith('sb-') &&
        c.name.includes('auth-token') &&
        c.value &&
        c.value !== 'deleted' &&
        c.value !== '""' &&
        c.value.trim().length > 20
    )

    if (!hasAuthToken && !isPublicRoute) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
    }

    const response = NextResponse.next({ request })
    if (!isPublicRoute) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
    }
    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|og-image.png|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
