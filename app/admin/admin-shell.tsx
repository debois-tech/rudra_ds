'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Building2, Users, BarChart3, Menu, LogOut, ArrowLeft, ShieldCheck, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Toaster } from '@/components/ui/sonner'
import { signOut } from '@/lib/auth'
import type { Profile } from '@/lib/auth'

interface AdminShellProps {
    profile: Profile
    children: React.ReactNode
}

export default function AdminShell({ profile, children }: AdminShellProps) {
    const router = useRouter()
    const pathname = usePathname()

    const handleSignOut = async () => {
        await signOut()
        router.replace('/login')
    }

    return (
        <div className="dark min-h-screen flex flex-col md:flex-row bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground min-h-screen fixed h-full border-r border-sidebar-border">
                <div className="p-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        <h1 className="text-xl font-bold text-primary tracking-wider">SUPER ADMIN</h1>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Platform Management</p>
                </div>
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <AdminNavLinks pathname={pathname} />
                    <div className="border-t border-sidebar-border my-3" />
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-sidebar-foreground"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span>Back to Dashboard</span>
                    </Link>
                </nav>
                <div className="p-4 border-t border-sidebar-border">
                    <ProfileMenu profile={profile} onSignOut={handleSignOut} />
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-sidebar text-sidebar-foreground sticky top-0 z-50 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="font-bold text-primary">SUPER ADMIN</span>
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="bg-sidebar text-sidebar-foreground border-none w-64">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-primary">SUPER ADMIN</h2>
                            <p className="text-xs text-muted-foreground mt-1">Platform Management</p>
                        </div>
                        <nav className="flex flex-col space-y-2">
                            <AdminNavLinks pathname={pathname} />
                            <div className="border-t border-sidebar-border my-3" />
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-sidebar-foreground"
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
                                className="w-full justify-start text-muted-foreground hover:text-destructive"
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

function ProfileMenu({ profile, onSignOut }: { profile: Profile; onSignOut: () => void }) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer"
            >
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm text-sidebar-foreground truncate">{profile.full_name || 'Admin'}</p>
                    <p className="text-xs text-primary">Super Admin</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-sidebar-border rounded-xl shadow-xl py-1.5 animate-fade-in">
                    <div className="px-4 py-3 border-b border-sidebar-border">
                        <p className="text-sm font-semibold text-popover-foreground">{profile.full_name || 'Admin'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile.email}</p>
                    </div>
                    <div className="p-1.5">
                        <button
                            onClick={onSignOut}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function AdminNavLinks({ pathname }: { pathname: string }) {
    const links = [
        { href: '/admin', label: 'Overview', icon: BarChart3 },
        { href: '/admin/organizations', label: 'Organizations', icon: Building2 },
        { href: '/admin/users', label: 'Users', icon: Users },
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
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
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
