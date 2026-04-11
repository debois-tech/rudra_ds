'use client';

import { useEffect, useState } from 'react'
import Link from "next/link"
import { useRouter, usePathname } from 'next/navigation'
import { Users, Wrench, ClipboardList, BarChart3, Menu, LogOut, ShieldCheck, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/sonner"
import { getAuthUser, signOut, type Profile } from '@/lib/auth'
import Image from 'next/image'

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
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FE]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FE] text-slate-900 font-sans selection:bg-purple-100">
      {/* Desktop Top Header */}
      <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-purple-100 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
            <div className="relative w-8 h-8 shrink-0">
               <Image src="/logo.png" alt="MotoAdmin Logo" fill className="object-contain" priority />
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none mt-1">MotoAdmin</h1>
              {orgName && (
                <span className="text-sm font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md mt-1">{orgName}</span>
              )}
            </div>
          </div>
          <nav className="flex items-center gap-2">
             <NavLinks pathname={pathname} />
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
           <Button variant="ghost" size="icon" className="text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-full h-9 w-9">
             <Bell className="h-4 w-4" />
           </Button>
           
           <div className="h-6 w-px bg-slate-200 mx-2" />

           {profile && (
             <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600 hidden lg:inline-block">{profile.email}</span>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-700 font-bold border border-purple-200 shadow-sm">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-slate-400 hover:text-red-500 h-8 w-8 rounded-full ml-1" title="Sign Out">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
             </div>
           )}
        </div>
      </header>

      {/* Mobile Top Header */}
      <header className="md:hidden flex h-14 items-center justify-between px-4 bg-white border-b border-purple-100 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="relative w-7 h-7 shrink-0">
             <Image src="/logo.png" alt="MotoAdmin Logo" fill className="object-contain" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">MotoAdmin</span>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-600">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-white border-l border-slate-100 w-72">
            <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 mt-4">
               <div className="relative w-8 h-8 shrink-0">
                 <Image src="/logo.png" alt="MotoAdmin Logo" fill className="object-contain" />
               </div>
               <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-none">MotoAdmin</h2>
                  {orgName && <p className="text-xs text-slate-500 mt-1">{orgName}</p>}
               </div>
            </div>
            
            <nav className="flex flex-col space-y-1">
              <NavLinks pathname={pathname} mobile />
              {profile?.role === 'super_admin' && (
                <>
                  <div className="my-3 border-t border-slate-100" />
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-50 text-amber-600 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Super Admin</span>
                  </Link>
                </>
              )}
            </nav>
            
            <div className="absolute bottom-6 left-6 right-6 pt-4 border-t border-slate-100">
              {profile && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold border border-purple-200">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{profile.full_name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full p-4 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>

      <Toaster />
    </div>
  )
}

function NavLinks({ pathname, mobile = false }: { pathname: string, mobile?: boolean }) {
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/dashboard/customers", label: "Customers", icon: Users },
    { href: "/dashboard/services/overview", label: "Services", icon: ClipboardList },
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
            className={`flex items-center gap-2 transition-colors ${
                mobile 
                  ? `px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`
                  : `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-purple-50/80 text-purple-700 shadow-sm border border-purple-100/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'}`
              }`}
          >
            <link.icon className={`${mobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
            <span>{link.label}</span>
          </Link>
        )
      })}
    </>
  )
}