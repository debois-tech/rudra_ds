'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, Plus, UserCircle, Car, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { drivingLogApi } from '@/lib/ds-api'
import type { DsDrivingLogView } from '@/lib/types'
import { AssignCarSheet } from './_components/assign-car-sheet'

export default function DailyLogsPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [logs, setLogs] = useState<DsDrivingLogView[]>([])
    const [loading, setLoading] = useState(true)
    const [isReleasing, setIsReleasing] = useState<string | null>(null) // track which log is being released
    const [sheetOpen, setSheetOpen] = useState(false)

    const fetchLogs = (d: string) => {
        setLoading(true)
        drivingLogApi.getByDate(d).then(data => { setLogs(data); setLoading(false) }).catch(console.error)
    }

    useEffect(() => { fetchLogs(date) }, [date])

    const handleRelease = async (id: string) => {
        if (isReleasing) return // prevent double-click
        setIsReleasing(id)
        try {
            await drivingLogApi.release(id)
            fetchLogs(date)
        } catch {
            // fetchLogs will show current state; toast could be added here
        } finally {
            setIsReleasing(null)
        }
    }

    const formatTime = (iso: string) => {
        const d = new Date(iso)
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Driving Logs</h1>
                    <p className="text-[14px] text-slate-400 mt-1">Track which instructor is using which car</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 bg-white"
                    />
                    <Button
                        onClick={() => setSheetOpen(true)}
                        className="rounded-xl h-9 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black shadow-sm cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Assign Car
                    </Button>
                </div>
            </div>

            <Card className="bg-white border-slate-100">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left px-6 py-3.5 text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Instructor</th>
                                    <th className="text-left px-6 py-3.5 text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Vehicle</th>
                                    <th className="text-left px-6 py-3.5 text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Opted At</th>
                                    <th className="text-left px-6 py-3.5 text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Released At</th>
                                    <th className="text-left px-6 py-3.5 text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-6 py-3.5 text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">Loading...</td></tr>
                                ) : logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <UserCircle className="h-6 w-6 text-slate-400" />
                                                <span className="text-[13px] font-medium text-slate-900">{log.instructor_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Car className="h-4 w-4 text-slate-400" />
                                                <span className="text-[13px] text-slate-600">{log.vehicle_number} {log.vehicle_name ? `(${log.vehicle_name})` : ''}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-[13px] text-slate-600">{formatTime(log.opted_at)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.released_at ? (
                                                <span className="text-[13px] text-slate-600">{formatTime(log.released_at)}</span>
                                            ) : (
                                                <span className="text-[13px] text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.released_at ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
                                                    <CheckCircle2 className="h-3 w-3" /> Completed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-600">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> In Use
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!log.released_at && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={isReleasing === log.id}
                                                    className="text-[12px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer disabled:opacity-50"
                                                    onClick={() => handleRelease(log.id)}
                                                >
                                                    {isReleasing === log.id ? 'Releasing...' : 'Release'}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <AssignCarSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                defaultDate={date}
                onSuccess={() => fetchLogs(date)}
            />
        </div>
    )
}
