'use client'

import { useEffect, useState } from 'react'
import Link from "next/link"
import { useRouter, usePathname } from 'next/navigation'
import { Building2, Users, BarChart3, Menu, LogOut, ArrowLeft, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/sonner"
import { getAuthUser, signOut, type Profile } from '@/lib/auth'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadAuth = async () => {
            try {
                const authUser = await getAuthUser()
                if (!authUser || authUser.profile.role !== 'super_admin') {
                    router.replace('/dashboard')
                    return
                }
                setProfile(authUser.profile)
            } catch {
                router.replace('/login')
            }
            setLoading(false)
        }
        loadAuth()
    }, [router])

    const handleSignOut = async () => {
        await signOut()
        router.replace('/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-900">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-slate-950 text-white min-h-screen fixed h-full border-r border-slate-800">
                <div className="p-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-amber-400" />
                        <h1 className="text-xl font-bold text-amber-400 tracking-wider">SUPER ADMIN</h1>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Platform Management</p>
                </div>
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <AdminNavLinks pathname={pathname} />
                    <div className="border-t border-slate-800 my-3" />
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-emerald-400 hover:text-emerald-300"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span>Back to Dashboard</span>
                    </Link>
                </nav>
                <div className="p-4 border-t border-slate-800 space-y-3">
                    {profile && (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-amber-600/20 flex items-center justify-center text-amber-400 text-sm font-semibold">
                                {profile.full_name?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{profile.full_name || 'Admin'}</p>
                                <p className="text-xs text-amber-500">Super Admin</p>
                            </div>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSignOut}
                        className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-950/30"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-slate-950 text-white sticky top-0 z-50 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-amber-400" />
                    <span className="font-bold text-amber-400">SUPER ADMIN</span>
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="bg-slate-950 text-white border-none w-64">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-amber-400">SUPER ADMIN</h2>
                            <p className="text-xs text-slate-500 mt-1">Platform Management</p>
                        </div>
                        <nav className="flex flex-col space-y-2">
                            <AdminNavLinks pathname={pathname} />
                            <div className="border-t border-slate-800 my-3" />
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-emerald-400"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Back to Dashboard</span>
                            </Link>
                        </nav>
                        <div className="absolute bottom-6 left-4 right-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSignOut}
                                className="w-full justify-start text-slate-400 hover:text-red-400"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 md:ml-64">
                {children}
            </main>

            <Toaster />
        </div>
    )
}

function AdminNavLinks({ pathname }: { pathname: string }) {
    const links = [
        { href: "/admin", label: "Overview", icon: BarChart3 },
        { href: "/admin/organizations", label: "Organizations", icon: Building2 },
        { href: "/admin/users", label: "Users", icon: Users },
    ]

    return (
        <>
            {links.map((link) => {
                const isActive = pathname === link.href ||
                    (link.href !== '/admin' && pathname.startsWith(link.href))

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-amber-600/10 text-amber-400 font-medium'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <link.icon className="h-5 w-5" />
                        <span>{link.label}</span>
                    </Link>
                )
            })}
        </>
    )
}
