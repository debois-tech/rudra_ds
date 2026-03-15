'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, LogIn, Shield } from 'lucide-react'

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const raw = searchParams.get('redirect') || '/dashboard'
    // Security: Only allow relative paths to prevent open redirect attacks.
    // e.g. ?redirect=https://evil.com would be rejected and fall back to /dashboard
    const redirectTo = raw.startsWith('/') ? raw : '/dashboard'

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
            router.push(redirectTo)
            router.refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Login failed'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center space-y-4 pb-2">
                {/* Logo / Brand */}
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-wider">RUDRA DS</h1>
                    <p className="text-sm text-slate-400 mt-1">Driving School Management Platform</p>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300 text-sm">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-11"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all duration-200"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <LogIn className="h-4 w-4 mr-2" />
                        )}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <p className="text-center text-xs text-slate-500 mt-6">
                    Account access is managed by your administrator
                </p>
            </CardContent>
        </Card>
    )
}
