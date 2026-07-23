'use client'

import { useContext } from 'react'
import Link from 'next/link'
import { DashboardOrgContext } from '../app-shell'
import { ClipboardList, GraduationCap, ArrowRight } from 'lucide-react'

export default function ModuleSelector() {
    const orgName = useContext(DashboardOrgContext)

    return (
        <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Welcome back{orgName ? ` to ${orgName}` : ''} 👋
                </h1>
                <p className="text-[15px] text-slate-400 mt-2">
                    Select a module to get started
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
                <Link
                    href="/dashboard/overview"
                    className="group relative bg-white rounded-2xl border border-slate-200 p-8 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-200"
                >
                    <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-5 group-hover:bg-amber-100 transition-colors">
                        <ClipboardList className="h-7 w-7 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Doc Services</h2>
                    <p className="text-[14px] text-slate-400 leading-relaxed mb-5">
                        Manage customers, vehicle registrations, licence renewals, fitness, tax, and other document-related services.
                    </p>
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-amber-600 group-hover:gap-2.5 transition-all">
                        Enter <ArrowRight className="h-4 w-4" />
                    </div>
                </Link>

                <Link
                    href="/driving-school"
                    className="group relative bg-white rounded-2xl border border-slate-200 p-8 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-200"
                >
                    <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
                        <GraduationCap className="h-7 w-7 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Driving School</h2>
                    <p className="text-[14px] text-slate-400 leading-relaxed mb-5">
                        Manage instructors, fleet vehicles, daily driving logs, student enrollment, fee tracking, and attendance.
                    </p>
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600 group-hover:gap-2.5 transition-all">
                        Enter <ArrowRight className="h-4 w-4" />
                    </div>
                </Link>
            </div>
        </div>
    )
}
