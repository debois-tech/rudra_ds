import Link from "next/link"
import { Users, Car, FileText, Bell, BarChart3, Menu, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/sonner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-slate-950 text-white min-h-screen fixed h-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-emerald-400 tracking-wider">RUDRA DS</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">v1.0.0 • Admin Access</p>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-950 text-white sticky top-0 z-50">
        <span className="font-bold text-emerald-400">RUDRA DS</span>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-slate-950 text-white border-none w-64">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-emerald-400">RUDRA DS</h2>
            </div>
            <nav className="flex flex-col space-y-4">
              <NavLinks />
            </nav>
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

function NavLinks() {
  const links = [
    // Update these paths to include /dashboard
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/dashboard/persons", label: "Students / Persons", icon: Users },
    { href: "/dashboard/vehicles", label: "Vehicles", icon: Car },
    { href: "/dashboard/documents", label: "Documents", icon: FileText },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/quick-add", label: "Quick Onboard", icon: Zap },
  ]

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
        >
          <link.icon className="h-5 w-5" />
          <span>{link.label}</span>
        </Link>
      ))}
    </>
  )
}