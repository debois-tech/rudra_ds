import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { instructorApi, fleetVehicleApi, drivingLogApi } from '@/lib/ds-api'
import type { DsInstructor, DsFleetVehicle, DsDrivingLogView } from '@/lib/types'
import { toast } from 'sonner'
import { Loader2, Car } from 'lucide-react'

interface AssignCarSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultDate: string
    onSuccess: () => void
    /** Pass current active logs so we can warn on duplicate assignment */
    activeLogs?: DsDrivingLogView[]
}

export function AssignCarSheet({ open, onOpenChange, defaultDate, onSuccess, activeLogs = [] }: AssignCarSheetProps) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [instructors, setInstructors] = useState<DsInstructor[]>([])
    const [vehicles, setVehicles] = useState<DsFleetVehicle[]>([])

    const [instructorId, setInstructorId] = useState('')
    const [vehicleId, setVehicleId] = useState('')
    const [logDate, setLogDate] = useState(defaultDate)
    const [optedAtTime, setOptedAtTime] = useState('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        if (open) {
            setLogDate(defaultDate)
            const now = new Date()
            // Format as HH:MM using local time (not UTC)
            const hh = String(now.getHours()).padStart(2, '0')
            const mm = String(now.getMinutes()).padStart(2, '0')
            setOptedAtTime(`${hh}:${mm}`)
            setInstructorId('')
            setVehicleId('')
            setNotes('')

            setLoading(true)
            Promise.all([
                instructorApi.getAll(),
                fleetVehicleApi.getAll()
            ]).then(([insts, vehs]) => {
                setInstructors(insts.filter(i => i.is_active))
                setVehicles(vehs.filter(v => v.is_active))
                setLoading(false)
            }).catch(() => {
                toast.error('Failed to load instructors and vehicles')
                setLoading(false)
            })
        }
    }, [open, defaultDate])

    // Warn if selected vehicle or instructor is already in an active log
    const vehicleInUse = vehicleId ? activeLogs.find(l => l.vehicle_id === vehicleId) : null
    const instructorInUse = instructorId ? activeLogs.find(l => l.instructor_id === instructorId) : null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!instructorId || !vehicleId || !logDate || !optedAtTime) {
            toast.error('Please fill all required fields')
            return
        }
        if (vehicleInUse) {
            toast.error(`${vehicleInUse.vehicle_number} is already assigned to ${vehicleInUse.instructor_name}. Opt out first.`)
            return
        }
        if (instructorInUse) {
            toast.error(`${instructorInUse.instructor_name} already has ${instructorInUse.vehicle_number} assigned. Opt out first.`)
            return
        }

        setSaving(true)
        try {
            // Build timezone-aware ISO string using local date + time
            // Parse HH:MM and combine with the date to create a proper local datetime
            const [hh, mm] = optedAtTime.split(':').map(Number)
            const optedDate = new Date(logDate)
            optedDate.setHours(hh, mm, 0, 0)

            await drivingLogApi.create({
                log_date: logDate,
                instructor_id: instructorId,
                vehicle_id: vehicleId,
                opted_at: optedDate.toISOString(),
                notes,
            })
            toast.success('Car assigned successfully')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to assign car:', error)
            toast.error('Failed to assign car. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="bg-white sm:max-w-md w-full border-l border-slate-100 flex flex-col p-0">
                <SheetHeader className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Car className="h-4.5 w-4.5 text-amber-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold text-slate-900">Assign Car</SheetTitle>
                            <SheetDescription className="text-xs text-slate-500 mt-0.5">
                                Assign a vehicle to an instructor for a driving session.
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Date <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="date"
                                        required
                                        value={logDate}
                                        onChange={e => setLogDate(e.target.value)}
                                        className="h-10 bg-slate-50 border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Opted At <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="time"
                                        required
                                        value={optedAtTime}
                                        onChange={e => setOptedAtTime(e.target.value)}
                                        className="h-10 bg-slate-50 border-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Instructor <span className="text-red-500">*</span></Label>
                                <Select value={instructorId} onValueChange={setInstructorId}>
                                    <SelectTrigger className={`h-10 bg-slate-50 border-slate-200 ${instructorInUse ? 'border-orange-300 bg-orange-50' : ''}`}>
                                        <SelectValue placeholder="Select instructor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {instructors.map(inst => {
                                            const busy = activeLogs.some(l => l.instructor_id === inst.id)
                                            return (
                                                <SelectItem key={inst.id} value={inst.id}>
                                                    {inst.name} {busy ? '⚠️ (busy)' : ''}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                                {instructorInUse && (
                                    <p className="text-xs text-orange-600">⚠️ Already has {instructorInUse.vehicle_number} assigned</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Vehicle <span className="text-red-500">*</span></Label>
                                <Select value={vehicleId} onValueChange={setVehicleId}>
                                    <SelectTrigger className={`h-10 bg-slate-50 border-slate-200 ${vehicleInUse ? 'border-orange-300 bg-orange-50' : ''}`}>
                                        <SelectValue placeholder="Select vehicle..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicles.map(v => {
                                            const busy = activeLogs.some(l => l.vehicle_id === v.id)
                                            return (
                                                <SelectItem key={v.id} value={v.id}>
                                                    {v.v_number}{v.v_name ? ` (${v.v_name})` : ''} {busy ? '⚠️ (in use)' : ''}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                                {vehicleInUse && (
                                    <p className="text-xs text-orange-600">⚠️ Already assigned to {vehicleInUse.instructor_name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Notes (Optional)</Label>
                                <Input
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Any specific instructions..."
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
                                Assign Car
                            </Button>
                        </div>
                    </form>
                )}
            </SheetContent>
        </Sheet>
    )
}
