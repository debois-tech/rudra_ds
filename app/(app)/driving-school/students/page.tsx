'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, GraduationCap, Phone, IndianRupee, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

const mockStudents = [
    { id: '1', name: 'Rohan Deshmukh', phone: '9876543210', course: 'LMV', total_fee: 8000, paid: 5000, status: 'active' as const },
    { id: '2', name: 'Priya Sharma', phone: '9876543211', course: 'MCWG', total_fee: 10000, paid: 10000, status: 'active' as const },
    { id: '3', name: 'Amit Verma', phone: '9876543212', course: 'LMV', total_fee: 7000, paid: 2000, status: 'active' as const },
    { id: '4', name: 'Sneha Patel', phone: '9876543213', course: 'HMV', total_fee: 12000, paid: 12000, status: 'completed' as const },
    { id: '5', name: 'Vikas Yadav', phone: '9876543214', course: 'LMV', total_fee: 8000, paid: 0, status: 'dropped' as const },
]

const statusStyles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-600',
    completed: 'bg-blue-50 text-blue-600',
    dropped: 'bg-red-50 text-red-500',
}

export default function StudentsPage() {
    const [search, setSearch] = useState('')
    const filtered = mockStudents.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search) ||
        s.course.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Students</h1>
                    <p className="text-[14px] text-slate-400 mt-1">Manage enrollments, fees, and attendance</p>
                </div>
                <Link href="/driving-school/students/new">
                    <Button className="rounded-xl h-9 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black shadow-sm cursor-pointer">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Enroll Student
                    </Button>
                </Link>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search students..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 rounded-xl border-slate-200 h-9 text-sm"
                />
            </div>

            <div className="grid gap-3">
                {filtered.map((student) => {
                    const pending = student.total_fee - student.paid
                    const pct = student.total_fee > 0 ? (student.paid / student.total_fee) * 100 : 0
                    return (
                        <Link key={student.id} href={`/driving-school/students/${student.id}`}>
                            <Card className="bg-white border-slate-100 hover:border-amber-200 transition-colors cursor-pointer">
                                <CardContent className="py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[14px] font-semibold text-slate-900">{student.name}</p>
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${statusStyles[student.status]}`}>
                                                        {student.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-0.5">
                                                    <span className="text-[12px] text-slate-400 flex items-center gap-1">
                                                        <Phone className="h-3 w-3" /> {student.phone}
                                                    </span>
                                                    <span className="text-[12px] text-slate-400">{student.course}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[13px] font-semibold text-slate-900">₹{student.paid.toLocaleString('en-IN')}</p>
                                                <p className="text-[11px] text-slate-400">of ₹{student.total_fee.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="w-20">
                                                <div className="h-1.5 rounded-full bg-slate-100">
                                                    <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                                {pending > 0 && (
                                                    <p className="text-[10px] text-red-500 mt-0.5 text-right">₹{pending.toLocaleString('en-IN')} pending</p>
                                                )}
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-300" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <GraduationCap className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium">No students found</p>
                </div>
            )}
        </div>
    )
}
