'use client'

import { useState } from 'react'
import { BookOpenCheck, Plus, UserCircle, Car, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const mockAttendance = [
    { id: '1', date: '22 Jul 2026', student: 'Rohan Deshmukh', instructor: 'Rajesh Kumar', vehicle: 'MH12 AB 1234 (Swift)' },
    { id: '2', date: '22 Jul 2026', student: 'Priya Sharma', instructor: 'Suresh Patel', vehicle: 'MH12 CD 5678 (i10)' },
    { id: '3', date: '22 Jul 2026', student: 'Amit Verma', instructor: 'Rajesh Kumar', vehicle: 'MH12 AB 1234 (Swift)' },
    { id: '4', date: '21 Jul 2026', student: 'Rohan Deshmukh', instructor: 'Rajesh Kumar', vehicle: 'MH12 AB 1234 (Swift)' },
    { id: '5', date: '21 Jul 2026', student: 'Sneha Patel', instructor: 'Vijay Sharma', vehicle: 'MH12 GH 3456 (Activa)' },
]

export default function AttendancePage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [search, setSearch] = useState('')

    const filtered = mockAttendance.filter(a =>
        a.student.toLowerCase().includes(search.toLowerCase()) ||
        a.instructor.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance</h1>
                    <p className="text-[14px] text-slate-400 mt-1">Track student attendance for driving sessions</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 bg-white"
                    />
                    <Button className="rounded-xl h-9 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black shadow-sm cursor-pointer">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Mark Attendance
                    </Button>
                </div>
            </div>

            <div className="grid gap-3">
                {filtered.map((entry) => (
                    <Card key={entry.id} className="bg-white border-slate-100 hover:border-slate-200 transition-colors">
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
                                        {entry.student.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[14px] font-semibold text-slate-900">{entry.student}</p>
                                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-600">Present</span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-0.5">
                                            <span className="text-[12px] text-slate-400 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" /> {entry.date}
                                            </span>
                                            <span className="text-[12px] text-slate-400 flex items-center gap-1">
                                                <UserCircle className="h-3 w-3" /> {entry.instructor}
                                            </span>
                                            <span className="text-[12px] text-slate-400 flex items-center gap-1">
                                                <Car className="h-3 w-3" /> {entry.vehicle}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <BookOpenCheck className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium">No attendance records found</p>
                </div>
            )}
        </div>
    )
}
