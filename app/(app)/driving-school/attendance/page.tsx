'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Search, CheckCircle2, UserCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { attendanceApi, studentApi } from '@/lib/ds-api'
import type { DsAttendanceView, DsStudentDashboardView } from '@/lib/types'
import { toast } from 'sonner'

export default function AttendancePage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    
    // Data
    const [records, setRecords] = useState<DsAttendanceView[]>([])
    const [students, setStudents] = useState<DsStudentDashboardView[]>([])
    
    // UI State
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
    
    // Keyboard navigation
    const [selectedIndex, setSelectedIndex] = useState(0)
    const listRef = useRef<HTMLDivElement>(null)

    const loadAll = useCallback(async (d: string) => {
        setLoading(true)
        try {
            const [recs, studs] = await Promise.all([
                attendanceApi.getByDate(d),
                studentApi.getAll(),
            ])
            setRecords(recs)
            setStudents(studs.filter(s => s.status === 'active'))
        } catch {
            toast.error('Failed to load attendance data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadAll(date) }, [date, loadAll])

    const toggleStudent = async (student: DsStudentDashboardView) => {
        const existingRecord = records.find(r => r.student_id === student.id)
        
        setTogglingIds(prev => new Set(prev).add(student.id))

        try {
            if (existingRecord) {
                await attendanceApi.delete(existingRecord.id)
                setRecords(prev => prev.filter(r => r.id !== existingRecord.id))
                toast.success(`${student.name} marked absent`)
            } else {
                const newRecord = await attendanceApi.mark({
                    attendance_date: date,
                    student_id: student.id,
                })
                
                const fakeView: DsAttendanceView = {
                    id: newRecord.id,
                    attendance_date: date,
                    student_id: student.id,
                    student_name: student.name,
                    student_phone: student.phone,
                    instructor_id: null,
                    instructor_name: null,
                    vehicle_id: null,
                    vehicle_number: null,
                    driving_log_date: null,
                    notes: null,
                    org_id: newRecord.org_id,
                    created_at: newRecord.created_at
                }
                setRecords(prev => [fakeView, ...prev])
                toast.success(`${student.name} marked present`)
            }
        } catch (err) {
            console.error(err)
            toast.error('Failed to update attendance')
        } finally {
            setTogglingIds(prev => {
                const next = new Set(prev)
                next.delete(student.id)
                return next
            })
        }
    }

    const filteredStudents = useMemo(() => {
        if (!search) return students
        const q = search.toLowerCase()
        return students.filter(s => s.name.toLowerCase().includes(q) || s.phone.includes(q))
    }, [students, search])

    // Reset selection when search changes
    useEffect(() => {
        setSelectedIndex(0)
    }, [search])

    // Keep selected item in view
    useEffect(() => {
        if (listRef.current) {
            const selectedEl = listRef.current.children[selectedIndex] as HTMLElement
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
            }
        }
    }, [selectedIndex])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (filteredStudents.length === 0) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => Math.min(prev + 1, filteredStudents.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const selectedStudent = filteredStudents[selectedIndex]
            if (selectedStudent && !togglingIds.has(selectedStudent.id)) {
                toggleStudent(selectedStudent)
            }
        }
    }

    return (
        <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)] max-w-7xl mx-auto w-full">
            {/* Header Area (Sticky) */}
            <div className="shrink-0 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance</h1>
                        <p className="text-[14px] text-slate-400 mt-1">
                            Type to search. Use <kbd className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">↑↓</kbd> arrows to navigate and <kbd className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">Enter</kbd> to mark present.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                        />
                    </div>
                </div>

                <Card className="bg-white border-slate-100 shadow-sm overflow-hidden">
                    <div className="relative border-b border-slate-100 bg-slate-50/50">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            autoFocus
                            placeholder="Start typing a name or phone number..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-12 h-14 bg-transparent border-0 rounded-none shadow-none focus-visible:ring-0 text-base"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">Enter ↵</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content (Scrollable List) */}
            <div className="flex-1 min-h-0 overflow-y-auto pb-6 pr-2">
                {loading ? (
                    <div className="flex flex-col gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide">
                                Active Students ({filteredStudents.length})
                            </h2>
                            <div className="text-[13px] font-medium text-slate-500">
                                <span className="text-emerald-600 font-bold">{records.length}</span> Present Today
                            </div>
                        </div>

                        {filteredStudents.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
                                <UserCircle className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                <p className="text-sm font-medium text-slate-400">No students found</p>
                            </div>
                        ) : (
                            <div ref={listRef} className="flex flex-col gap-1.5">
                                {filteredStudents.map((student, idx) => {
                                    const isPresent = records.some(r => r.student_id === student.id)
                                    const isToggling = togglingIds.has(student.id)
                                    const isSelected = idx === selectedIndex

                                    return (
                                        <button
                                            key={student.id}
                                            onClick={() => {
                                                setSelectedIndex(idx)
                                                toggleStudent(student)
                                            }}
                                            disabled={isToggling}
                                            className={`relative w-full flex items-center justify-between gap-4 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-70 disabled:pointer-events-none ${
                                                isSelected
                                                    ? 'ring-2 ring-amber-400 shadow-md scale-[1.01] z-10'
                                                    : 'hover:border-slate-300'
                                            } ${
                                                isPresent 
                                                    ? 'border-emerald-200 bg-emerald-50/70' 
                                                    : 'border-slate-200 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                                {/* Status indicator / Checkbox */}
                                                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                    isPresent
                                                        ? 'border-emerald-500 bg-emerald-500'
                                                        : 'border-slate-300 bg-slate-50'
                                                }`}>
                                                    {isToggling ? (
                                                        <Loader2 className={`h-3 w-3 animate-spin ${isPresent ? 'text-white' : 'text-slate-400'}`} />
                                                    ) : isPresent ? (
                                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                                    ) : null}
                                                </div>

                                                <div className="flex flex-col min-w-0">
                                                    <p className={`text-[14px] font-bold truncate ${isPresent ? 'text-emerald-900' : 'text-slate-800'}`}>
                                                        {student.name}
                                                    </p>
                                                    <p className={`text-[12px] truncate ${isPresent ? 'text-emerald-700/80' : 'text-slate-500'}`}>
                                                        {student.phone} · {student.course_type}
                                                    </p>
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <div className="shrink-0 text-[11px] font-semibold tracking-wider text-amber-600 bg-amber-100 px-2 py-1 rounded-md hidden sm:block">
                                                    PRESS ENTER
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
