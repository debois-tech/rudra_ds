'use client'

import { useState } from 'react'
import { ArrowLeft, GraduationCap, Phone, Mail, MapPin, Calendar, IndianRupee, Plus, UserCircle, Car, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

const student = {
    id: '1',
    name: 'Rohan Deshmukh',
    phone: '9876543210',
    email: 'rohan.d@example.com',
    course: 'LMV',
    enrollment_date: '15 Jan 2026',
    total_fee: 8000,
    paid: 5000,
    status: 'active' as const,
}

const payments = [
    { id: '1', date: '15 Jan 2026', amount: 3000, mode: 'cash', note: 'Advance payment' },
    { id: '2', date: '20 Feb 2026', amount: 2000, mode: 'upi', note: 'Second installment' },
]

const attendance = [
    { id: '1', date: '22 Jul 2026', instructor: 'Rajesh Kumar', vehicle: 'MH12 AB 1234 (Swift)' },
    { id: '2', date: '21 Jul 2026', instructor: 'Rajesh Kumar', vehicle: 'MH12 AB 1234 (Swift)' },
    { id: '3', date: '20 Jul 2026', instructor: 'Suresh Patel', vehicle: 'MH12 CD 5678 (i10)' },
]

export default function StudentProfilePage() {
    const [tab, setTab] = useState<'overview' | 'fees' | 'attendance'>('overview')
    const pending = student.total_fee - student.paid
    const pct = (student.paid / student.total_fee) * 100

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/driving-school/students">
                    <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-slate-600 cursor-pointer">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-lg font-bold">
                        {student.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-600 capitalize">{student.status}</span>
                        </div>
                        <p className="text-[13px] text-slate-400">{student.course} &middot; Enrolled {student.enrollment_date}</p>
                    </div>
                </div>
            </div>

            {/* Fee Summary Bar */}
            <Card className="bg-white border-slate-100">
                <CardContent className="p-5">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">Total Fee</p>
                            <p className="text-xl font-bold text-slate-900">₹{student.total_fee.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">Paid</p>
                            <p className="text-xl font-bold text-emerald-600">₹{student.paid.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">Pending</p>
                            <p className="text-xl font-bold text-red-500">₹{pending.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-100">
                {(['overview', 'fees', 'attendance'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors capitalize cursor-pointer ${
                            tab === t ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {t === 'fees' ? `Payments (${payments.length})` : t === 'attendance' ? `Attendance (${attendance.length})` : t}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-4">
                    <Card className="bg-white border-slate-100">
                        <CardContent className="p-5 space-y-3.5">
                            <h3 className="text-[14px] font-semibold text-slate-900">Contact Information</h3>
                            <div className="flex items-center gap-3 text-[13px] text-slate-600">
                                <Phone className="h-4 w-4 text-slate-400 shrink-0" /> {student.phone}
                            </div>
                            <div className="flex items-center gap-3 text-[13px] text-slate-600">
                                <Mail className="h-4 w-4 text-slate-400 shrink-0" /> {student.email}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-100">
                        <CardContent className="p-5 space-y-3.5">
                            <h3 className="text-[14px] font-semibold text-slate-900">Enrollment Details</h3>
                            <div className="flex items-center gap-3 text-[13px] text-slate-600">
                                <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" /> {student.course}
                            </div>
                            <div className="flex items-center gap-3 text-[13px] text-slate-600">
                                <Calendar className="h-4 w-4 text-slate-400 shrink-0" /> Enrolled {student.enrollment_date}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {tab === 'fees' && (
                <Card className="bg-white border-slate-100">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="text-[14px] font-semibold text-slate-900">Payment History</h3>
                            <Button size="sm" className="rounded-xl h-8 px-3 text-[12px] font-medium bg-amber-500 hover:bg-amber-600 text-black cursor-pointer">
                                <Plus className="h-3 w-3 mr-1" /> Record Payment
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Date</th>
                                        <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Amount</th>
                                        <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Mode</th>
                                        <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Note</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {payments.map(p => (
                                        <tr key={p.id}>
                                            <td className="px-6 py-3 text-[13px] text-slate-600">{p.date}</td>
                                            <td className="px-6 py-3 text-[13px] font-semibold text-slate-900">₹{p.amount.toLocaleString('en-IN')}</td>
                                            <td className="px-6 py-3">
                                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 capitalize">{p.mode}</span>
                                            </td>
                                            <td className="px-6 py-3 text-[13px] text-slate-400">{p.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {tab === 'attendance' && (
                <Card className="bg-white border-slate-100">
                    <CardContent className="p-0">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h3 className="text-[14px] font-semibold text-slate-900">Attendance History</h3>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {attendance.map(a => (
                                <div key={a.id} className="flex items-center gap-4 px-6 py-3.5">
                                    <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                                        <UserCircle className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[13px] font-medium text-slate-900">{a.date}</p>
                                        <p className="text-[12px] text-slate-400">{a.instructor} &middot; {a.vehicle}</p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-600">Present</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
