'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Car, Clock, Plus, UserCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { drivingLogApi, fleetVehicleApi, instructorApi, studentApi } from '@/lib/ds-api'
import type { DsDrivingLogView, DsFleetVehicle, DsInstructor, DsStudentDashboardView } from '@/lib/types'

type LogForm = {
    instructor_id: string
    vehicle_id: string
    student_1_id: string
    student_2_id: string
    student_3_id: string
    student_4_id: string
    student_5_id: string
    logging_date: string
    start_datetime: string
    end_datetime: string
    notes: string
}

const localDateTime = () => {
    const now = new Date()
    const offset = now.getTimezoneOffset() * 60000
    return new Date(now.getTime() - offset).toISOString().slice(0, 16)
}

const emptyForm = (): LogForm => ({
    instructor_id: '', vehicle_id: '', student_1_id: '', student_2_id: '', student_3_id: '', student_4_id: '', student_5_id: '',
    logging_date: new Date().toISOString().split('T')[0], start_datetime: localDateTime(), end_datetime: '', notes: '',
})

export default function DailyLogsPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [logs, setLogs] = useState<DsDrivingLogView[]>([])
    const [instructors, setInstructors] = useState<DsInstructor[]>([])
    const [vehicles, setVehicles] = useState<DsFleetVehicle[]>([])
    const [students, setStudents] = useState<DsStudentDashboardView[]>([])
    const [loading, setLoading] = useState(true)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [step, setStep] = useState(1)
    const [form, setForm] = useState<LogForm>(emptyForm())
    const [selectedLog, setSelectedLog] = useState<DsDrivingLogView | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const fetchLogs = (d: string) => {
        setLoading(true)
        drivingLogApi.getByDate(d).then(data => { setLogs(data); setLoading(false) }).catch(() => setLoading(false))
    }

    useEffect(() => {
        fetchLogs(date)
        Promise.all([instructorApi.getAll(), fleetVehicleApi.getAll(), studentApi.getAll()])
            .then(([instructorData, vehicleData, studentData]) => {
                setInstructors(instructorData.filter(item => item.is_active))
                setVehicles(vehicleData.filter(item => item.is_active))
                setStudents(studentData.filter(item => item.status === 'active'))
            })
            .catch(() => setError('Unable to load instructors, vehicles, or students'))
    }, [date])

    const update = (key: keyof LogForm, value: string) => setForm(current => ({ ...current, [key]: value }))
    const studentKeys = ['student_1_id', 'student_2_id', 'student_3_id', 'student_4_id', 'student_5_id'] as const
    const selectedStudentIds = studentKeys.map(key => form[key]).filter(Boolean)
    const selectedInstructor = instructors.find(item => item.id === form.instructor_id)
    const selectedVehicle = vehicles.find(item => item.id === form.vehicle_id)
    const selectedStudents = selectedStudentIds.map(id => students.find(item => item.id === id)).filter(Boolean)

    const openAddLog = () => {
        setForm(emptyForm()); setStep(1); setError(''); setSheetOpen(true)
    }

    const goNext = () => {
        setError('')
        if (step === 1 && (!form.instructor_id || !form.vehicle_id || selectedStudentIds.length < 2)) {
            setError('Select an instructor, a vehicle, and at least two students.')
            return
        }
        if (step === 2 && !form.start_datetime) {
            setError('Start time is required.')
            return
        }
        setStep(current => current + 1)
    }

    const saveLog = async () => {
        setSaving(true); setError('')
        try {
            await drivingLogApi.create({
                logging_date: form.logging_date,
                instructor_id: form.instructor_id,
                vehicle_id: form.vehicle_id,
                student_1_id: form.student_1_id || undefined,
                student_2_id: form.student_2_id || undefined,
                student_3_id: form.student_3_id || undefined,
                student_4_id: form.student_4_id || undefined,
                student_5_id: form.student_5_id || undefined,
                start_datetime: new Date(form.start_datetime).toISOString(),
                end_datetime: form.end_datetime ? new Date(form.end_datetime).toISOString() : undefined,
                notes: form.notes || undefined,
            })
            setSheetOpen(false); fetchLogs(date)
        } catch { setError('Unable to save this log.') }
        finally { setSaving(false) }
    }

    const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Driving Logs</h1>
                    <p className="text-[14px] text-slate-400 mt-1">View instructor, vehicle, student, and session details</p>
                </div>
                <div className="flex items-center gap-3">
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 bg-white" />
                    <Button onClick={openAddLog} className="rounded-xl h-9 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black shadow-sm cursor-pointer">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Log
                    </Button>
                </div>
            </div>

            <Card className="bg-white border-slate-100">
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full">
                        <thead><tr className="border-b border-slate-100">
                            {['Instructor', 'Vehicle', 'Students', 'Start Time', 'End Time'].map(title => <th key={title} className="text-left px-6 py-3.5 text-[12px] font-semibold text-slate-400 uppercase tracking-wider">{title}</th>)}
                        </tr></thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">Loading...</td></tr> : logs.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">No logs for this date.</td></tr> : logs.map(log => (
                                <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-slate-50/70 transition-colors cursor-pointer">
                                    <td className="px-6 py-4"><div className="flex items-center gap-3"><UserCircle className="h-6 w-6 text-slate-400" /><span className="text-[13px] font-medium text-slate-900">{log.instructor_name}</span></div></td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2"><Car className="h-4 w-4 text-slate-400" /><span className="text-[13px] text-slate-600">{log.vehicle_number}{log.vehicle_name ? ` (${log.vehicle_name})` : ''}</span></div></td>
                                    <td className="px-6 py-4 text-[13px] text-slate-600">{log.student_names.length ? log.student_names.join(', ') : '—'}</td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" /><span className="text-[13px] text-slate-600">{formatTime(log.start_datetime)}</span></div></td>
                                    <td className="px-6 py-4 text-[13px] text-slate-600">{log.end_datetime ? formatTime(log.end_datetime) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {selectedLog && <Card className="bg-white border-slate-100"><CardContent className="p-6 space-y-5">
                <div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-wider text-slate-400">Log details</p><h2 className="text-lg font-semibold text-slate-900">{selectedLog.logging_date}</h2></div><Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}><X className="h-4 w-4" /></Button></div>
                <div className="grid gap-4 md:grid-cols-3">
                    <div><p className="text-xs text-slate-400">Instructor</p><p className="font-medium text-slate-900">{selectedLog.instructor_name}</p><p className="text-sm text-slate-500">{selectedLog.instructor_phone}</p></div>
                    <div><p className="text-xs text-slate-400">Vehicle</p><p className="font-medium text-slate-900">{selectedLog.vehicle_number}</p><p className="text-sm text-slate-500">{selectedLog.vehicle_name || 'Training vehicle'}</p></div>
                    <div><p className="text-xs text-slate-400">Session</p><p className="font-medium text-slate-900">{formatTime(selectedLog.start_datetime)} – {selectedLog.end_datetime ? formatTime(selectedLog.end_datetime) : 'In progress'}</p></div>
                </div>
                <div><p className="text-xs text-slate-400 mb-2">Students</p><div className="flex flex-wrap gap-2">{selectedLog.student_names.map(name => <span key={name} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{name}</span>)}</div></div>
            </CardContent></Card>}

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}><SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader><SheetTitle>Add Driving Log</SheetTitle><SheetDescription>Step {step} of 3</SheetDescription></SheetHeader>
                <div className="px-4 pb-6 space-y-5">
                    <div className="flex items-center gap-2">{[1, 2, 3].map(item => <div key={item} className={`h-2 flex-1 rounded-full ${step >= item ? 'bg-amber-500' : 'bg-slate-100'}`} />)}</div>
                    {step === 1 && <div className="space-y-4"><Field label="Instructor"><select value={form.instructor_id} onChange={e => update('instructor_id', e.target.value)}><option value="">Select instructor</option>{instructors.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Vehicle"><select value={form.vehicle_id} onChange={e => update('vehicle_id', e.target.value)}><option value="">Select vehicle</option>{vehicles.map(item => <option key={item.id} value={item.id}>{item.v_number}{item.v_name ? ` — ${item.v_name}` : ''}</option>)}</select></Field><div><p className="text-sm font-medium text-slate-700 mb-2">Students <span className="text-xs text-slate-400">(minimum 2, maximum 5)</span></p>{studentKeys.map((key, index) => <select key={key} value={form[key]} onChange={e => update(key, e.target.value)} className="mb-2"><option value="">Student {index + 1}</option>{students.map(item => <option key={item.id} value={item.id} disabled={selectedStudentIds.includes(item.id) && form[key] !== item.id}>{item.name}</option>)}</select>)}</div></div>}
                    {step === 2 && <div className="space-y-4"><Field label="Logging date"><input type="date" value={form.logging_date} onChange={e => update('logging_date', e.target.value)} /></Field><Field label="Start time"><input type="datetime-local" value={form.start_datetime} onChange={e => update('start_datetime', e.target.value)} /></Field><Field label="End time (optional)"><input type="datetime-local" value={form.end_datetime} onChange={e => update('end_datetime', e.target.value)} /></Field><Field label="Notes"><textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={3} placeholder="Optional notes" /></Field></div>}
                    {step === 3 && <div className="space-y-4"><p className="text-sm text-slate-500">Review the log before saving.</p><Summary label="Instructor" value={selectedInstructor?.name || '—'} /><Summary label="Vehicle" value={selectedVehicle?.v_number || '—'} /><Summary label="Students" value={selectedStudents.map(item => item?.name).join(', ')} /><Summary label="Date" value={form.logging_date} /><Summary label="Start" value={new Date(form.start_datetime).toLocaleString('en-IN')} /><Summary label="End" value={form.end_datetime ? new Date(form.end_datetime).toLocaleString('en-IN') : 'In progress'} /></div>}
                    {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
                </div>
                <SheetFooter><div className="flex w-full justify-between gap-2"><Button variant="outline" onClick={() => step === 1 ? setSheetOpen(false) : setStep(current => current - 1)}>{step === 1 ? 'Cancel' : 'Back'}</Button>{step < 3 ? <Button onClick={goNext} className="bg-amber-500 text-black hover:bg-amber-600">Next</Button> : <Button onClick={saveLog} disabled={saving} className="bg-amber-500 text-black hover:bg-amber-600">{saving ? 'Saving...' : 'Add Log'}</Button>}</div></SheetFooter>
            </SheetContent></Sheet>
        </div>
    )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return <label className="block text-sm font-medium text-slate-700">{label}<div className="mt-1.5">{children}</div></label>
}

function Summary({ label, value }: { label: string; value: string }) {
    return <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 text-sm"><span className="text-slate-400">{label}</span><span className="text-right font-medium text-slate-800">{value}</span></div>
}
