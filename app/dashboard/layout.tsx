'use client'

import { useEffect, useState } from 'react'
import Link from "next/link"
import { useRouter, usePathname } from 'next/navigation'
import { Users, Car, FileText, Bell, BarChart3, Menu, Zap, LogOut, Building2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/sonner"
import { getAuthUser, signOut, type Profile } from '@/lib/auth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orgName, setOrgName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const authUser = await getAuthUser()
        if (!authUser) {
          router.replace('/login')
          return
        }
        setProfile(authUser.profile)

        // Fetch org name
        if (authUser.profile.org_id) {
          const { createSupabaseBrowser } = await import('@/lib/supabase')
          const supabase = createSupabaseBrowser()
          const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', authUser.profile.org_id)
            .single()
          if (org) setOrgName(org.name)
        }
      } catch (error) {
        console.error('Auth error:', error)
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-slate-950 text-white min-h-screen fixed h-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-emerald-400 tracking-wider">RUDRA DS</h1>
          {orgName && (
            <div className="flex items-center gap-1.5 mt-2">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-xs text-slate-400 truncate">{orgName}</p>
            </div>
          )}
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavLinks pathname={pathname} />
          {profile?.role === 'super_admin' && (
            <>
              <div className="border-t border-slate-800 my-3" />
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-amber-400 hover:text-amber-300"
              >
                <ShieldCheck className="h-5 w-5" />
                <span>Super Admin</span>
              </Link>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-3">
          {profile && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 text-sm font-semibold">
                {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{profile.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{profile.email}</p>
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
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-950 text-white sticky top-0 z-50">
        <div>
          <span className="font-bold text-emerald-400">RUDRA DS</span>
          {orgName && (
            <span className="text-xs text-slate-400 ml-2">• {orgName}</span>
          )}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-slate-950 text-white border-none w-64">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-emerald-400">RUDRA DS</h2>
              {orgName && (
                <p className="text-xs text-slate-400 mt-1">{orgName}</p>
              )}
            </div>
            <nav className="flex flex-col space-y-2">
              <NavLinks pathname={pathname} />
              {profile?.role === 'super_admin' && (
                <>
                  <div className="border-t border-slate-800 my-3" />
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-amber-400"
                  >
                    <ShieldCheck className="h-5 w-5" />
                    <span>Super Admin</span>
                  </Link>
                </>
              )}
            </nav>
            <div className="absolute bottom-6 left-4 right-4 space-y-3">
              {profile && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 text-sm font-semibold">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{profile.full_name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                  </div>
                </div>
              )}
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

      {/* Toast Notification Provider */}
      <Toaster />
    </div>
  )
}

function NavLinks({ pathname }: { pathname: string }) {
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/dashboard/customers", label: "Customers", icon: Users },
    { href: "/dashboard/vehicles", label: "Vehicles", icon: Car },
    { href: "/dashboard/documents", label: "All Documents", icon: FileText },
    { href: "/dashboard/documents/expiring", label: "Expiring Docs", icon: Bell },
    { href: "/dashboard/settings", label: "Settings", icon: Zap },
  ]

  return (
    <>
      {links.map((link) => {
        const isActive = pathname === link.href ||
          (link.href !== '/dashboard' && pathname.startsWith(link.href))

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? 'bg-emerald-600/10 text-emerald-400 font-medium'
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