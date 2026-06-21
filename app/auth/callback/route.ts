import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Validate redirect path to prevent open redirect attacks.
 * Only allows relative paths (starting with /) and rejects:
 * - Absolute URLs (https://evil.com)
 * - Protocol-relative URLs (//evil.com)
 * - Paths with encoded characters that could bypass validation
 */
function getSafeRedirectPath(raw: string | null): string {
    const fallback = '/dashboard'
    if (!raw) return fallback
    // Must start with exactly one slash and not contain protocol-relative patterns
    if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes(':\\')) return fallback
    // Decode and re-check to prevent encoded bypasses (e.g. %2F%2Fevil.com)
    try {
        const decoded = decodeURIComponent(raw)
        if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes(':\\')) return fallback
    } catch {
        return fallback
    }
    return raw
}

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const redirectTo = getSafeRedirectPath(requestUrl.searchParams.get('next'))

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) => {
                            request.cookies.set(name, value)
                        })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
        }
    }

    // If no code or error, redirect to login
    return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
