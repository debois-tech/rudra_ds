'use client'

import { useEffect, useState } from 'react'
import { BookOpenCheck, Plus, UserCircle, Car, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { attendanceApi } from '@/lib/ds-api'
import type { DsAttendanceView } from '@/lib/types'

export default function AttendancePage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [records, setRecords] = useState<DsAttendanceView[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        attendanceApi.getByDate(date).then(data => { setRecords(data); setLoading(false) }).catch(console.error)
    }, [date])

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
                {loading ? (
                    <div className="text-center py-12 text-slate-400 text-sm">Loading...</div>
                ) : records.map((entry) => (
                    <Card key={entry.id} className="bg-white border-slate-100 hover:border-slate-200 transition-colors">
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
                                        {entry.student_name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[14px] font-semibold text-slate-900">{entry.student_name}</p>
                                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-600">Present</span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-0.5">
                                            <span className="text-[12px] text-slate-400 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" /> {new Date(entry.attendance_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="text-[12px] text-slate-400 flex items-center gap-1">
                                                <UserCircle className="h-3 w-3" /> {entry.instructor_name}
                                            </span>
                                            {entry.vehicle_number && (
                                                <span className="text-[12px] text-slate-400 flex items-center gap-1">
                                                    <Car className="h-3 w-3" /> {entry.vehicle_number}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {!loading && records.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <BookOpenCheck className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium">No attendance records found for this date</p>
                </div>
            )}
        </div>
    )
}
