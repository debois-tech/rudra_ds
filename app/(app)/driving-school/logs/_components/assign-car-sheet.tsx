import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { instructorApi, fleetVehicleApi, drivingLogApi } from '@/lib/ds-api'
import type { DsInstructor, DsFleetVehicle } from '@/lib/types'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface AssignCarSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultDate: string
    onSuccess: () => void
}

export function AssignCarSheet({ open, onOpenChange, defaultDate, onSuccess }: AssignCarSheetProps) {
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
            setOptedAtTime(now.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }))
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!instructorId || !vehicleId || !logDate || !optedAtTime) {
            toast.error('Please fill all required fields')
            return
        }

        setSaving(true)
        try {
            const optedDate = new Date(`${logDate}T${optedAtTime}:00`)
            await drivingLogApi.create({
                log_date: logDate,
                instructor_id: instructorId,
                vehicle_id: vehicleId,
                opted_at: optedDate.toISOString(),
                notes
            })
            toast.success('Car assigned successfully')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to assign car:', error)
            toast.error('Failed to assign car')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="bg-white sm:max-w-md w-full border-l border-slate-100 flex flex-col p-0">
                <SheetHeader className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
                    <SheetTitle className="text-xl font-bold text-slate-900">Assign Car</SheetTitle>
                    <SheetDescription className="text-sm text-slate-500">
                        Assign a vehicle to an instructor for a daily session.
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
                                    value={logDate}
                                    onChange={e => setLogDate(e.target.value)}
                                    className="h-10 bg-slate-50 border-slate-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Time (Opted At) <span className="text-red-500">*</span></Label>
                                <Input
                                    type="time"
                                    required
                                    value={optedAtTime}
                                    onChange={e => setOptedAtTime(e.target.value)}
                                    className="h-10 bg-slate-50 border-slate-200"
                                />
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
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Vehicle <span className="text-red-500">*</span></Label>
                                <Select value={vehicleId} onValueChange={setVehicleId}>
                                    <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Select vehicle..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicles.map(v => (
                                            <SelectItem key={v.id} value={v.id}>{v.v_number} {v.v_name ? `(${v.v_name})` : ''}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
