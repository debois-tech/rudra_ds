'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, GraduationCap, Phone, IndianRupee, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { studentApi } from '@/lib/ds-api'
import type { DsStudentDashboardView } from '@/lib/types'
import { toast } from 'sonner'

const statusStyles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-600',
    completed: 'bg-blue-50 text-blue-600',
    dropped: 'bg-red-50 text-red-500',
}

export default function StudentsPage() {
    const [students, setStudents] = useState<DsStudentDashboardView[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    const fetchList = () => {
        studentApi.getAll()
            .then(data => { setStudents(data); setLoading(false) })
            .catch(() => toast.error('Failed to load students'))
    }

    useEffect(() => { fetchList() }, [])

    const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm(`Delete student "${name}"? This will also remove their fee records and attendance.`)) return
        try {
            await studentApi.delete(id)
            toast.success('Student deleted')
            fetchList()
        } catch { toast.error('Failed to delete student') }
    }

    const filtered = search
        ? students.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.phone.includes(search) ||
            s.course_type.toLowerCase().includes(search.toLowerCase()))
        : students

    if (loading) return <div className="text-center py-12 text-slate-400 text-sm">Loading...</div>

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
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
                    const pct = student.total_fee > 0 ? (student.total_paid / student.total_fee) * 100 : 0
                    return (
                        <div key={student.id} className="group relative">
                            <Link href={`/driving-school/students/${student.id}`}>
                                <Card className="bg-white border-slate-100 hover:border-amber-200 transition-colors cursor-pointer">
                                    <CardContent className="py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
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
                                                        <span className="text-[12px] text-slate-400">{student.course_type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-[13px] font-semibold text-slate-900">₹{student.total_paid.toLocaleString('en-IN')}</p>
                                                    <p className="text-[11px] text-slate-400">of ₹{student.total_fee.toLocaleString('en-IN')}</p>
                                                </div>
                                                <div className="w-20">
                                                    <div className="h-1.5 rounded-full bg-slate-100">
                                                        <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    {student.pending_balance > 0 && (
                                                        <p className="text-[10px] text-red-500 mt-0.5 text-right">₹{student.pending_balance.toLocaleString('en-IN')} pending</p>
                                                    )}
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-slate-300" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <button
                                onClick={(e) => handleDelete(e, student.id, student.name)}
                                className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-white/80 hover:bg-red-50 text-slate-300 hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer border border-slate-100"
                                title="Delete student"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
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
