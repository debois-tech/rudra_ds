import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { drivingLogApi } from '@/lib/ds-api'
import type { DsDrivingLogView } from '@/lib/types'
import { toast } from 'sonner'
import { Loader2, LogOut } from 'lucide-react'
import { DateTimePicker } from '@/components/ui/date-time-picker'

interface ReleaseCarSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    log: DsDrivingLogView | null
    onSuccess: () => void
}

export function ReleaseCarSheet({ open, onOpenChange, log, onSuccess }: ReleaseCarSheetProps) {
    const [saving, setSaving] = useState(false)
    const [releaseTime, setReleaseTime] = useState('')

    useEffect(() => {
        if (open && log) {
            const now = new Date()
            const hh = String(now.getHours()).padStart(2, '0')
            const mm = String(now.getMinutes()).padStart(2, '0')
            setReleaseTime(`${hh}:${mm}`)
        }
    }, [open, log])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!log) return
        if (!releaseTime) {
            toast.error('Please select an opt out time')
            return
        }

        setSaving(true)
        try {
            // log.logging_date is YYYY-MM-DD
            // releaseTime is HH:MM
            // Build proper ISO string
            const [hh, mm] = releaseTime.split(':').map(Number)
            // It's safer to use the logging date, but if the current day crossed midnight, they might opt out the next day.
            // Using the current date but with the specified time is the safest if they are doing it same day.
            // If they are on the daily logs page, they are viewing a specific `date`.
            // Let's use the log's date and the given time.
            const releaseDate = new Date(log.logging_date)
            releaseDate.setHours(hh, mm, 0, 0)

            await drivingLogApi.release(log.id, releaseDate.toISOString())
            toast.success(`${log.vehicle_number} opted out successfully`)
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to opt out car:', error)
            toast.error('Failed to opt out. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (!log) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="bg-white sm:max-w-md w-full border-l border-slate-100 flex flex-col p-0">
                <SheetHeader className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center">
                            <LogOut className="h-4.5 w-4.5 text-red-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold text-slate-900">Opt Out Car</SheetTitle>
                            <SheetDescription className="text-xs text-slate-500 mt-0.5">
                                Release {log.vehicle_number} from {log.instructor_name}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Opt Out Time <span className="text-red-500">*</span></Label>
                            <DateTimePicker value={releaseTime} onChange={setReleaseTime} mode="time" required />
                            <p className="text-xs text-slate-500 mt-1">
                                By default, the current time is selected. Adjust it if the car was opted out earlier.
                            </p>
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
                            className="h-10 px-5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-sm shadow-red-500/20"
                        >
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Confirm Opt Out
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    )
}
