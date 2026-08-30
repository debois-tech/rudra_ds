'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, Car, CalendarClock, IndianRupee, Users, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { dsDashboardApi } from '@/lib/ds-api'

export default function DrivingSchoolOverview() {
    const [stats, setStats] = useState({ activeLogsToday: 0, activeStudents: 0, feeCollectionThisMonth: 0, pendingFeesTotal: 0 })

    useEffect(() => {
        dsDashboardApi.getStats().then(setStats).catch(console.error)
    }, [])

    const statCards = [
        { label: 'Today\'s Active Logs', value: stats.activeLogsToday.toString(), icon: CalendarClock, color: 'bg-amber-50 text-amber-600' },
        { label: 'Active Students', value: stats.activeStudents.toString(), icon: GraduationCap, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Fee Collection (Month)', value: `₹${stats.feeCollectionThisMonth.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-blue-50 text-blue-600' },
        { label: 'Pending Fees Total', value: `₹${stats.pendingFeesTotal.toLocaleString('en-IN')}`, icon: Users, color: 'bg-red-50 text-red-600' },
    ]

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Driving School</h1>
                    <p className="text-[14px] text-slate-400 mt-1">Overview of your driving school operations</p>
                </div>
                <div className="flex gap-2.5">
                    <Link href="/driving-school/logs">
                        <button className="rounded-xl h-9 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black shadow-sm shadow-amber-400/20 cursor-pointer flex items-center gap-1.5">
                            <CalendarClock className="h-3.5 w-3.5" />
                            Assign Car
                        </button>
                    </Link>
                    <Link href="/driving-school/students/new">
                        <button className="rounded-xl h-9 px-4 text-[13px] font-medium bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm cursor-pointer flex items-center gap-1.5">
                            <Plus className="h-3.5 w-3.5" />
                            Enroll Student
                        </button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-5 card-hover group">
                        <div className="flex items-center justify-between mb-3.5">
                            <span className="text-[13px] font-medium text-slate-400 uppercase tracking-wide">{stat.label}</span>
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.color} transition-transform group-hover:scale-110`}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Link href="/driving-school/logs" className="bg-white rounded-2xl border border-slate-100 p-6 hover:border-amber-200 transition-colors group">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                        <CalendarClock className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Daily Logs</h3>
                    <p className="text-[13px] text-slate-400">Track instructor-car assignments and release times</p>
                    <div className="flex items-center gap-1 text-[13px] font-medium text-amber-600 mt-4 group-hover:gap-2 transition-all">
                        Manage <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                </Link>

                <Link href="/driving-school/instructors" className="bg-white rounded-2xl border border-slate-100 p-6 hover:border-amber-200 transition-colors group">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                        <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Instructors</h3>
                    <p className="text-[13px] text-slate-400">Manage teaching staff, licences, and availability</p>
                    <div className="flex items-center gap-1 text-[13px] font-medium text-blue-600 mt-4 group-hover:gap-2 transition-all">
                        Manage <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                </Link>

                <Link href="/driving-school/students" className="bg-white rounded-2xl border border-slate-100 p-6 hover:border-amber-200 transition-colors group">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                        <GraduationCap className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Students</h3>
                    <p className="text-[13px] text-slate-400">Enrollments, fee tracking, and attendance history</p>
                    <div className="flex items-center gap-1 text-[13px] font-medium text-emerald-600 mt-4 group-hover:gap-2 transition-all">
                        Manage <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                </Link>
            </div>
        </div>
    )
}
