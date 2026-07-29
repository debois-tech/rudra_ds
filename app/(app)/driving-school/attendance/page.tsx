'use client'

import { useEffect, useState, useCallback } from 'react'
import { BookOpenCheck, Users, Check, UserCircle, Phone, Search, Car, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { attendanceApi, instructorApi, studentApi, drivingLogApi } from '@/lib/ds-api'
import type { DsAttendanceView, DsInstructor, DsStudentDashboardView, DsDrivingLogView } from '@/lib/types'
import { toast } from 'sonner'

export default function AttendancePage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    // Data
    const [records, setRecords] = useState<DsAttendanceView[]>([])
    const [instructors, setInstructors] = useState<DsInstructor[]>([])
    const [students, setStudents] = useState<DsStudentDashboardView[]>([])
    const [activeLogs, setActiveLogs] = useState<DsDrivingLogView[]>([])

    // UI State
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [selectedInstructor, setSelectedInstructor] = useState('')
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
    const [search, setSearch] = useState('')

    const loadAll = useCallback(async (d: string) => {
        setLoading(true)
        try {
            const [recs, insts, studs, logs] = await Promise.all([
                attendanceApi.getByDate(d),
                instructorApi.getAll(),
                studentApi.getAll(),
                drivingLogApi.getByDate(d),
            ])
            setRecords(recs)
            setInstructors(insts.filter(i => i.is_active))
            setStudents(studs.filter(s => s.status === 'active'))
            setActiveLogs(logs.filter(l => !l.end_datetime))
            setCheckedIds(new Set())
        } catch {
            toast.error('Failed to load attendance data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadAll(date) }, [date, loadAll])

    // IDs of students already marked for this date
    const alreadyMarkedIds = new Set(records.map(r => r.student_id))

    const toggleStudent = (id: string) => {
        if (alreadyMarkedIds.has(id)) return // can't unmark already-saved records this way
        setCheckedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const selectAll = () => {
        const unmarked = filteredStudents.filter(s => !alreadyMarkedIds.has(s.id))
        setCheckedIds(new Set(unmarked.map(s => s.id)))
    }

    const clearAll = () => setCheckedIds(new Set())

    const handleSave = async () => {
        if (!selectedInstructor) {
            toast.error('Please select an instructor first')
            return
        }
        if (checkedIds.size === 0) {
            toast.error('Please select at least one student')
            return
        }

        setSaving(true)
        try {
            const result = await attendanceApi.markBatch({
                attendance_date: date,
                instructor_id: selectedInstructor,
                student_ids: Array.from(checkedIds),
            })
            const msg = result.skipped > 0
                ? `Marked ${result.success} students (${result.skipped} already marked)`
                : `Attendance marked for ${result.success} students`
            toast.success(msg)
            setCheckedIds(new Set())
            await loadAll(date)
        } catch (err) {
            console.error(err)
            toast.error('Failed to mark attendance. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const filteredStudents = search
        ? students.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.phone.includes(search))
        : students

    // Get vehicle for selected instructor (from active logs)
    const instructorActiveLog = activeLogs.find(l => l.instructor_id === selectedInstructor)

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance</h1>
                    <p className="text-[14px] text-slate-400 mt-1">Mark attendance for driving sessions</p>
                </div>
                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                />
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid lg:grid-cols-5 gap-6">
                    {/* ── Left: Batch Mark Panel ── */}
                    <div className="lg:col-span-3 space-y-4">
                        <Card className="bg-white border-slate-100">
                            <CardContent className="p-5 space-y-4">
                                <h2 className="text-[14px] font-semibold text-slate-900">Mark Attendance</h2>

                                {/* Instructor selector */}
                                <div className="space-y-2">
                                    <Label className="text-[13px] font-medium text-slate-700">Instructor <span className="text-red-500">*</span></Label>
                                    <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                                        <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
                                            <SelectValue placeholder="Select instructor for this session..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {instructors.map(inst => (
                                                <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {instructorActiveLog && (
                                        <div className="flex items-center gap-2 text-[12px] text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                                            <Car className="h-3.5 w-3.5 shrink-0" />
                                            <span>Vehicle <strong>{instructorActiveLog.vehicle_number}</strong> is currently assigned to this instructor</span>
                                        </div>
                                    )}
                                    {selectedInstructor && !instructorActiveLog && (
                                        <div className="flex items-center gap-2 text-[12px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                            <span>No car assigned to this instructor today. Attendance will be recorded without vehicle.</span>
                                        </div>
                                    )}
                                </div>

                                {/* Search + select controls */}
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                        <Input
                                            placeholder="Search students..."
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            className="pl-8 h-9 text-sm bg-slate-50 border-slate-200"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={selectAll}
                                        className="text-[12px] text-amber-600 font-medium hover:underline cursor-pointer whitespace-nowrap"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearAll}
                                        className="text-[12px] text-slate-400 font-medium hover:underline cursor-pointer"
                                    >
                                        Clear
                                    </button>
                                </div>

                                {/* Student checklist */}
                                <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
                                    {filteredStudents.length === 0 ? (
                                        <div className="py-8 text-center text-slate-400 text-sm">
                                            <Users className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                                            No active students found
                                        </div>
                                    ) : filteredStudents.map(student => {
                                        const isMarked = alreadyMarkedIds.has(student.id)
                                        const isChecked = checkedIds.has(student.id)

                                        return (
                                            <button
                                                key={student.id}
                                                type="button"
                                                onClick={() => toggleStudent(student.id)}
                                                disabled={isMarked}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer disabled:cursor-default ${
                                                    isMarked
                                                        ? 'border-emerald-100 bg-emerald-50/50 opacity-60'
                                                        : isChecked
                                                        ? 'border-amber-300 bg-amber-50'
                                                        : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {/* Checkbox visual */}
                                                <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                    isMarked
                                                        ? 'border-emerald-400 bg-emerald-400'
                                                        : isChecked
                                                        ? 'border-amber-500 bg-amber-500'
                                                        : 'border-slate-300 bg-white'
                                                }`}>
                                                    {(isMarked || isChecked) && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                                                </div>

                                                {/* Avatar */}
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                    {student.name.charAt(0)}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold text-slate-900 truncate">{student.name}</p>
                                                    <p className="text-[11px] text-slate-400">{student.phone} · {student.course_type}</p>
                                                </div>

                                                {/* Status badge */}
                                                {isMarked ? (
                                                    <span className="text-[11px] font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                                                        Marked ✓
                                                    </span>
                                                ) : isChecked ? (
                                                    <span className="text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                                                        Selected
                                                    </span>
                                                ) : null}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Save button */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <p className="text-[13px] text-slate-500">
                                        {checkedIds.size > 0 ? (
                                            <span className="font-semibold text-amber-700">{checkedIds.size} selected</span>
                                        ) : (
                                            'No students selected'
                                        )}
                                    </p>
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving || checkedIds.size === 0 || !selectedInstructor}
                                        className="rounded-xl h-9 px-5 text-[13px] font-semibold bg-amber-500 hover:bg-amber-600 text-black cursor-pointer disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : `Mark Present (${checkedIds.size})`}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Right: Today's Records ── */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2">
                            <BookOpenCheck className="h-4 w-4 text-slate-400" />
                            <h2 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Today's Records</h2>
                            {records.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                                    {records.length}
                                </span>
                            )}
                        </div>

                        {records.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center">
                                <BookOpenCheck className="h-9 w-9 mx-auto text-slate-300 mb-2" />
                                <p className="text-sm font-medium text-slate-400">No attendance yet</p>
                                <p className="text-xs text-slate-300 mt-1">Mark students present on the left</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {records.map(entry => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {entry.student_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold text-slate-900 truncate">{entry.student_name}</p>
                                            <p className="text-[11px] text-slate-400 truncate">
                                                {entry.instructor_name}{entry.vehicle_number ? ` · ${entry.vehicle_number}` : ''}
                                            </p>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                                            ✓ Present
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
