'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCurrentProfile, signIn } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const rawRedirect = searchParams.get('redirect')

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await signIn(email, password)
            const profile = await getCurrentProfile()
            if (!profile || !profile.is_active) {
                throw new Error('Your account is inactive. Contact your administrator.')
            }

            // Security: only allow relative paths. Without an explicit target,
            // route by the role stored in the database.
            const requestedRedirect = rawRedirect &&
                rawRedirect.startsWith('/') &&
                !rawRedirect.startsWith('//')
                ? rawRedirect
                : null
            const defaultRedirect = profile.role === 'super_admin' ? '/admin' : '/dashboard'
            router.replace(requestedRedirect || defaultRedirect)
            router.refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Login failed'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="mx-auto w-[160px] md:w-[200px] h-20 relative mb-12">
                    <Image src="/logo_icon.png" alt="MotoAdmin Logo" fill className="object-contain scale-[1.4] md:scale-[1.8] origin-bottom" priority />
                </div>
                <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
                    Welcome back
                </h1>
                <p className="text-sm text-slate-500 mt-1.5">
                    Sign in to your account
                </p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-7">
                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-slate-700 text-[13px] font-medium">
                            Email address
                        </Label>
                        <Input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="h-11 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-300 focus:ring-2 focus:ring-amber-100 rounded-xl transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-slate-700 text-[13px] font-medium">
                            Password
                        </Label>
                        <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            className="h-11 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-300 focus:ring-2 focus:ring-amber-100 rounded-xl transition-all"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-semibold rounded-xl shadow-sm shadow-amber-400/20 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Signing in…
                            </>
                        ) : (
                            'Sign in'
                        )}
                    </Button>
                </form>
            </div>

            {/* Footer note */}
            <p className="text-center text-[12px] text-slate-400 mt-5">
                Account access is managed by your administrator
            </p>
        </div>
    )
}
