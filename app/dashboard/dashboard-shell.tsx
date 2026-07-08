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
            {/* ── Desktop Header — warm ivory light theme ── */}
            <header className="hidden md:block sticky top-0 z-50 bg-[#fdfbf7] border-b border-slate-200 shadow-sm">
                <div className="flex h-16 items-center justify-between px-6 max-w-[1440px] mx-auto">
                    {/* Left: Logo + Nav */}
                    <div className="flex items-center gap-10">
                        <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
                            <div className="relative h-12 w-[180px]">
                                <Image src="/icon.png" alt="MotoAdmin" fill className="object-contain object-left" priority />
                            </div>
                            {orgName && (
                                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-md shadow-sm">
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
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                                            isActive
                                                ? 'bg-amber-100 text-amber-900 shadow-sm'
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
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black text-xs font-bold shadow-sm">
                                {initials}
                            </div>
                            <div className="hidden lg:block text-left">
                                <p className="text-[12px] font-medium text-white leading-tight">
                                    {profile.full_name || 'User'}
                                </p>
                                <p className="text-[11px] text-gray-500 leading-tight">
                                    {profile.email}
                                </p>
                            </div>
                            <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown */}
                        {userMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 animate-fade-in z-50">
                                <div className="px-4 py-3 border-b border-slate-100">
                                    <p className="text-[13px] font-bold text-slate-900">{profile.full_name || 'User'}</p>
                                    <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">{profile.email}</p>
                                </div>
                                <div className="p-1.5">
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Mobile Header — warm ivory theme ── */}
            <header className="md:hidden flex h-16 items-center justify-between px-5 bg-[#fdfbf7] border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="relative h-10 w-[150px]">
                        <Image src="/icon.png" alt="MotoAdmin" fill className="object-contain object-left" priority />
                    </div>
                </Link>

                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                    <Menu className="h-4.5 w-4.5 text-gray-400" />
                </button>
            </header>

            {/* ── Mobile Menu Overlay ── */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[100]">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Panel — dark to match header */}
                    <div className="absolute right-0 top-0 bottom-0 w-72 bg-[#0f0f0f] shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black text-xs font-bold">
                                    {initials}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{profile.full_name || 'User'}</p>
                                    {orgName && <p className="text-[11px] text-amber-400/70">{orgName}</p>}
                                </div>
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer"
                            >
                                <X className="h-4 w-4 text-gray-500" />
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
                                                ? 'bg-amber-400 text-black'
                                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <link.icon className="h-4 w-4" />
                                        {link.label}
                                    </Link>
                                )
                            })}
                        </nav>

                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                            <Button
                                variant="ghost"
                                onClick={handleSignOut}
                                className="w-full justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl h-10 text-sm font-medium"
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
