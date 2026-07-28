import { createSupabaseBrowser } from './supabase'
import type { User } from '@supabase/supabase-js'

// ============================================
// TYPES
// ============================================
export interface Profile {
    id: string
    org_id: string | null
    role: 'super_admin' | 'user'
    full_name: string | null
    email: string | null
    avatar_url: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface AuthUser {
    user: User
    profile: Profile
}

// ============================================
// AUTH HELPERS
// ============================================

/**
 * Get currently authenticated user from the local session.
 * Uses getSession() (cookie-only, ZERO network calls) instead of getUser() (HTTP round-trip).
 * Note: getSession() trusts the local token without server verification — appropriate
 * for client-side guards. Server routes use their own getUser() via admin-auth-guard.
 */
export async function getCurrentUser(): Promise<User | null> {
    const supabase = createSupabaseBrowser()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user ?? null
}

// In-memory profile cache keyed by user ID — avoids re-fetching on every API call
let _cachedProfile: Profile | null = null
let _cachedUserId: string | null = null

// Module-level org_id fast path — set once from React context on app boot.
// This eliminates the DB round-trip inside getOrgId() for every mutation.
let _cachedOrgId: string | null = null

/** Set the org_id from React context. Called once per app mount. */
export function setOrgId(id: string) {
    _cachedOrgId = id
}

/** Get the org_id — from the fast in-memory cache, profile cache, or Supabase. */
export async function getOrgId(): Promise<string> {
    if (_cachedOrgId) return _cachedOrgId
    const profile = await getCurrentProfile()
    if (!profile?.org_id) throw new Error('No organization found.')
    _cachedOrgId = profile.org_id
    return _cachedOrgId
}

/** Get current user's profile (with org_id and role). Cached in memory. */
export async function getCurrentProfile(): Promise<Profile | null> {
    const supabase = createSupabaseBrowser()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    // Return cached profile if user hasn't changed
    if (_cachedProfile && _cachedUserId === session.user.id) {
        return _cachedProfile
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('id, org_id, role, full_name, email, avatar_url, is_active, created_at, updated_at')
        .eq('id', session.user.id)
        .single()

    if (error || !data) {
        console.error('Error fetching profile:', error)
        return null
    }

    _cachedProfile = data as Profile
    _cachedUserId = session.user.id
    return _cachedProfile
}

/** Get full auth context (user + profile) */
export async function getAuthUser(): Promise<AuthUser | null> {
    const supabase = createSupabaseBrowser()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    const profile = await getCurrentProfile()
    if (!profile) return null
    return { user: session.user, profile }
}

/** Sign in with email and password */
export async function signIn(email: string, password: string) {
    _cachedProfile = null
    _cachedUserId = null
    const supabase = createSupabaseBrowser()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
}

/** Sign out from the current device only */
export async function signOut() {
    _cachedProfile = null
    _cachedUserId = null
    const supabase = createSupabaseBrowser()
    // 'local' scope only clears this device's session — not all sessions globally
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw error
}

/** Get the current user's organization details */
export async function getCurrentOrganization() {
    const supabase = createSupabaseBrowser()
    const profile = await getCurrentProfile()
    if (!profile?.org_id) return null

    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.org_id)
        .single()

    if (error) return null
    return data
}

/** Invalidate the in-memory profile cache (call after profile updates) */
export function invalidateProfileCache() {
    _cachedProfile = null
    _cachedUserId = null
}
