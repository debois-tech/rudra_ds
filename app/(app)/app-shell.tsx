'use client'

import { useState, useRef, useEffect, createContext } from 'react'
import Link from "next/link"
import { useRouter, usePathname } from 'next/navigation'
import { Users, ClipboardList, BarChart3, Menu, LogOut, X, ChevronDown, GraduationCap, Car, CalendarClock, UserCircle, BookOpenCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { signOut, setOrgId } from '@/lib/auth'
import Image from 'next/image'

export const DashboardOrgContext = createContext('')
export const OrgIdContext = createContext<string | null>(null)

interface AppProfile {
    id: string
    org_id: string | null
    role: 'super_admin' | 'user'
    full_name: string | null
    email: string | null
    avatar_url: string | null
    is_active: boolean
}

interface AppShellProps {
    profile: AppProfile
    orgName: string
    children: React.ReactNode
}

const servicesNav = [
    { href: "/dashboard/overview", label: "Overview", icon: BarChart3 },
    { href: "/dashboard/customers", label: "Customers", icon: Users },
    { href: "/dashboard/services/overview", label: "Services", icon: ClipboardList },
]

const drivingNav = [
    { href: "/driving-school", label: "Overview", icon: BarChart3 },
    { href: "/driving-school/instructors", label: "Instructors", icon: UserCircle },
    { href: "/driving-school/fleet", label: "Fleet", icon: Car },
    { href: "/driving-school/logs", label: "Daily Logs", icon: CalendarClock },
    { href: "/driving-school/students", label: "Students", icon: GraduationCap },
    { href: "/driving-school/attendance", label: "Attendance", icon: BookOpenCheck },
]

export function AppShell({ profile, orgName, children }: AppShellProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const userMenuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (profile.org_id) {
            setOrgId(profile.org_id)
        }
    }, [profile.org_id])

    const handleSignOut = async () => {
        await signOut()
        router.replace('/login')
    }

    const initials = profile.full_name?.charAt(0)?.toUpperCase() || profile.email?.charAt(0)?.toUpperCase() || 'U'

    const isServicesRoute = pathname.startsWith('/dashboard')
    const isDrivingRoute = pathname.startsWith('/driving-school')
    const isModuleSelector = pathname === '/dashboard'

    const activeSubNav = isServicesRoute ? servicesNav : isDrivingRoute ? drivingNav : []

    return (
        <div className="min-h-screen flex flex-col bg-[#f8f9fb]">
            {/* ── Desktop Top Nav — warm ivory theme ── */}
            <header className="hidden md:block sticky top-0 z-50 bg-[#fdfbf7] border-b border-slate-200 shadow-sm">
                <div className="flex h-14 items-center justify-between px-6 max-w-[1440px] mx-auto">
                    <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
                        <div className="relative h-9 w-[150px]">
                            <Image src="/logo_icon.png" alt="MotoAdmin" fill className="object-contain object-left scale-[1.5] origin-left" priority />
                        </div>
                    </Link>

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
                                <div className="p-1.5 border-b border-slate-100">
                                    <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Switch Module</p>
                                    <Link
                                        href="/dashboard/overview"
                                        onClick={() => setUserMenuOpen(false)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                                            isServicesRoute ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <ClipboardList className="h-4 w-4" />
                                        Manage Services
                                    </Link>
                                    <Link
                                        href="/driving-school"
                                        onClick={() => setUserMenuOpen(false)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                                            isDrivingRoute ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <GraduationCap className="h-4 w-4" />
                                        Manage Driving School
                                    </Link>
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

            {/* ── Floating Sub-Nav Bar (desktop) ── */}
            {!isModuleSelector && activeSubNav.length > 0 && (
                <div className="hidden md:block sticky top-14 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
                    <div className="max-w-[1440px] mx-auto px-6">
                        <nav className="flex items-center justify-center gap-1 py-2.5">
                            {activeSubNav.map((link) => {
                                const isActive = link.href === pathname ||
                                    (link.href !== '/dashboard/overview' && link.href !== '/driving-school' && pathname.startsWith(link.href + '/'))
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
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
                </div>
            )}

            {/* ── Mobile Header ── */}
            <header className="md:hidden flex h-14 items-center justify-between px-4 bg-[#fdfbf7] border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="relative h-9 w-[110px]">
                        <Image src="/logo_icon.png" alt="MotoAdmin" fill className="object-contain object-left scale-[1.3] origin-left" priority />
                    </div>
                </Link>

                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                    <Menu className="h-5 w-5 text-gray-500" />
                </button>
            </header>

            {/* ── Mobile Menu Overlay ── */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[100]">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
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

                        {isServicesRoute && (
                            <>
                                <p className="px-4 pt-4 pb-1 text-[11px] font-semibold text-amber-400/60 uppercase tracking-wider">Doc Services</p>
                                <nav className="p-3 space-y-0.5">
                                    {servicesNav.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                pathname === link.href || (link.href !== '/dashboard/overview' && pathname.startsWith(link.href + '/'))
                                                    ? 'bg-amber-400 text-black'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            <link.icon className="h-4 w-4" />
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>
                            </>
                        )}

                        {isDrivingRoute && (
                            <>
                                <p className="px-4 pt-4 pb-1 text-[11px] font-semibold text-amber-400/60 uppercase tracking-wider">Driving School</p>
                                <nav className="p-3 space-y-0.5">
                                    {drivingNav.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                pathname === link.href
                                                    ? 'bg-amber-400 text-black'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            <link.icon className="h-4 w-4" />
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>
                            </>
                        )}

                        <div className="border-t border-white/10 mx-3 my-2" />
                        <div className="px-4 py-2">
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Switch Module</p>
                            <Link
                                href="/dashboard/overview"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isServicesRoute ? 'bg-amber-400 text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <ClipboardList className="h-4 w-4" />
                                Manage Services
                            </Link>
                            <Link
                                href="/driving-school"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isDrivingRoute ? 'bg-amber-400 text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <GraduationCap className="h-4 w-4" />
                                Manage Driving School
                            </Link>
                        </div>

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
            <DashboardOrgContext.Provider value={orgName}>
            <OrgIdContext.Provider value={profile.org_id}>
                <main className="flex-1 w-full">
                    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-8">
                        {children}
                    </div>
                </main>
            </OrgIdContext.Provider>
            </DashboardOrgContext.Provider>

            <Toaster />
        </div>
    )
}
