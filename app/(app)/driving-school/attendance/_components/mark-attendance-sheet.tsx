import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { instructorApi, studentApi, attendanceApi } from '@/lib/ds-api'
import type { DsInstructor, DsStudentDashboardView } from '@/lib/types'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface MarkAttendanceSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultDate: string
    onSuccess: () => void
}

export function MarkAttendanceSheet({ open, onOpenChange, defaultDate, onSuccess }: MarkAttendanceSheetProps) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [instructors, setInstructors] = useState<DsInstructor[]>([])
    const [students, setStudents] = useState<DsStudentDashboardView[]>([])

    const [instructorId, setInstructorId] = useState('')
    const [studentId, setStudentId] = useState('')
    const [attendanceDate, setAttendanceDate] = useState(defaultDate)
    const [notes, setNotes] = useState('')

    useEffect(() => {
        if (open) {
            setAttendanceDate(defaultDate)
            setInstructorId('')
            setStudentId('')
            setNotes('')
            
            setLoading(true)
            Promise.all([
                instructorApi.getAll(),
                studentApi.getAll()
            ]).then(([insts, studs]) => {
                setInstructors(insts.filter(i => i.is_active))
                setStudents(studs.filter(s => s.status === 'active'))
                setLoading(false)
            }).catch(() => {
                toast.error('Failed to load instructors and students')
                setLoading(false)
            })
        }
    }, [open, defaultDate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!instructorId || !studentId || !attendanceDate) {
            toast.error('Please fill all required fields')
            return
        }

        setSaving(true)
        try {
            await attendanceApi.mark({
                attendance_date: attendanceDate,
                student_id: studentId,
                instructor_id: instructorId,
                notes
            })
            toast.success('Attendance marked successfully')
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error('Failed to mark attendance:', error)
            if (error.code === '23505') {
                toast.error('Attendance already marked for this student today')
            } else {
                toast.error('Failed to mark attendance')
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="bg-white sm:max-w-md w-full border-l border-slate-100 flex flex-col p-0">
                <SheetHeader className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
                    <SheetTitle className="text-xl font-bold text-slate-900">Mark Attendance</SheetTitle>
                    <SheetDescription className="text-sm text-slate-500">
                        Record a student&apos;s driving session attendance.
                    </SheetDescription>
                </SheetHeader>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Date <span className="text-red-500">*</span></Label>
                                <Input
                                    type="date"
                                    required
                                    value={attendanceDate}
                                    onChange={e => setAttendanceDate(e.target.value)}
                                    className="h-10 bg-slate-50 border-slate-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Student <span className="text-red-500">*</span></Label>
                                <Select value={studentId} onValueChange={setStudentId}>
                                    <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Select student..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.phone})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Instructor <span className="text-red-500">*</span></Label>
                                <Select value={instructorId} onValueChange={setInstructorId}>
                                    <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Select instructor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {instructors.map(inst => (
                                            <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-slate-400">
                                    The vehicle currently assigned to this instructor will be automatically recorded.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Notes (Optional)</Label>
                                <Input
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Progress notes..."
                                    className="h-10 bg-slate-50 border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 mt-auto">
                            <SheetClose asChild>
                                <Button type="button" variant="outline" className="h-10 px-5 rounded-xl border-slate-200">
                                    Cancel
                                </Button>
                            </SheetClose>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-sm shadow-amber-500/20"
                            >
                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Save Attendance
                            </Button>
                        </div>
                    </form>
                )}
            </SheetContent>
        </Sheet>
    )
}
