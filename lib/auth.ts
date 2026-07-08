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

/** Get currently authenticated Supabase user, or null */
export async function getCurrentUser(): Promise<User | null> {
    const supabase = createSupabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

/** Get current user's profile (with org_id and role) */
export async function getCurrentProfile(): Promise<Profile | null> {
    const supabase = createSupabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
        return null
    }
    return data as Profile
}

/** Get full auth context (user + profile) */
export async function getAuthUser(): Promise<AuthUser | null> {
    const supabase = createSupabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) return null
    return { user, profile: profile as Profile }
}

/** Sign in with email and password */
export async function signIn(email: string, password: string) {
    const supabase = createSupabaseBrowser()
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })
    if (error) throw error
    return data
}

/** Sign out — global scope invalidates all sessions across devices */
export async function signOut() {
    const supabase = createSupabaseBrowser()
    const { error } = await supabase.auth.signOut({ scope: 'global' })
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
