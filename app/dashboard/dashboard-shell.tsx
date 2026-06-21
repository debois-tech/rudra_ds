'use client'

import { useState, useRef, useEffect } from 'react'
import Link from "next/link"
import { useRouter, usePathname } from 'next/navigation'
import { Users, ClipboardList, BarChart3, Menu, LogOut, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { signOut } from '@/lib/auth'
import Image from 'next/image'

interface DashboardProfile {
    id: string
    org_id: string | null
    role: 'super_admin' | 'user'
    full_name: string | null
    email: string | null
    avatar_url: string | null
    is_active: boolean
}

interface DashboardShellProps {
    profile: DashboardProfile
    orgName: string
    children: React.ReactNode
}

export function DashboardShell({ profile, orgName, children }: DashboardShellProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const userMenuRef = useRef<HTMLDivElement>(null)

    // Close user menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSignOut = async () => {
        await signOut()
        router.replace('/login')
    }

    const navLinks = [
        { href: "/dashboard", label: "Overview", icon: BarChart3 },
        { href: "/dashboard/customers", label: "Customers", icon: Users },
        { href: "/dashboard/services/overview", label: "Services", icon: ClipboardList },
    ]

    const initials = profile.full_name?.charAt(0)?.toUpperCase() || profile.email?.charAt(0)?.toUpperCase() || 'U'

    return (
        <div className="min-h-screen flex flex-col bg-[#f8f9fb]">
            {/* ── Desktop Header ── */}
            <header className="hidden md:block sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
                <div className="flex h-14 items-center justify-between px-6 max-w-[1440px] mx-auto">
                    {/* Left: Logo + Nav */}
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
                            <div className="relative w-7 h-7">
                                <Image src="/logo.png" alt="MotoAdmin" fill className="object-contain" priority />
                            </div>
                            <span className="text-[15px] font-bold text-slate-900 tracking-tight">
                                MotoAdmin
                            </span>
                            {orgName && (
                                <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {orgName}
                                </span>
                            )}
                        </Link>

                        <nav className="flex items-center gap-1">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href ||
                                    (link.href !== '/dashboard' && pathname.startsWith(link.href))

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                                            isActive
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                    >
                                        <link.icon className="h-3.5 w-3.5" />
                                        {link.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Right: User Menu */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                {initials}
                            </div>
                            <div className="hidden lg:block text-left">
                                <p className="text-[12px] font-medium text-slate-700 leading-tight">
                                    {profile.full_name || 'User'}
                                </p>
                                <p className="text-[11px] text-slate-400 leading-tight">
                                    {profile.email}
                                </p>
                            </div>
                            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown */}
                        {userMenuOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 py-1.5 animate-fade-in z-50">
                                <div className="px-3.5 py-2.5 border-b border-slate-100">
                                    <p className="text-[13px] font-semibold text-slate-900">{profile.full_name || 'User'}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{profile.email}</p>
                                </div>
                                <div className="p-1.5">
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Mobile Header ── */}
            <header className="md:hidden flex h-13 items-center justify-between px-4 bg-white border-b border-slate-200/60 sticky top-0 z-50">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="relative w-6 h-6">
                        <Image src="/logo.png" alt="MotoAdmin" fill className="object-contain" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm tracking-tight">MotoAdmin</span>
                </Link>

                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                    <Menu className="h-4.5 w-4.5 text-slate-600" />
                </button>
            </header>

            {/* ── Mobile Menu Overlay ── */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[100]">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                    {initials}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{profile.full_name || 'User'}</p>
                                    {orgName && <p className="text-[11px] text-slate-400">{orgName}</p>}
                                </div>
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="h-4 w-4 text-slate-500" />
                            </button>
                        </div>

                        <nav className="p-3 space-y-0.5">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href ||
                                    (link.href !== '/dashboard' && pathname.startsWith(link.href))

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                            isActive
                                                ? 'bg-slate-900 text-white'
                                                : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <link.icon className="h-4 w-4" />
                                        {link.label}
                                    </Link>
                                )
                            })}
                        </nav>

                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
                            <Button
                                variant="ghost"
                                onClick={handleSignOut}
                                className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl h-10 text-sm font-medium"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign out
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main Content ── */}
            <main className="flex-1 w-full">
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-8">
                    {children}
                </div>
            </main>

            <Toaster />
        </div>
    )
}
