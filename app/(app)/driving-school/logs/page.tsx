'use client'

import { useEffect, useState, useCallback } from 'react'
import { CalendarClock, Plus, UserCircle, Car, Clock, CheckCircle2, LogOut, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { drivingLogApi } from '@/lib/ds-api'
import type { DsDrivingLogView } from '@/lib/types'
import { AssignCarSheet } from './_components/assign-car-sheet'
import { toast } from 'sonner'

export default function DailyLogsPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [logs, setLogs] = useState<DsDrivingLogView[]>([])
    const [loading, setLoading] = useState(true)
    const [isReleasing, setIsReleasing] = useState<string | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)

    const fetchLogs = useCallback((d: string) => {
        setLoading(true)
        drivingLogApi.getByDate(d)
            .then(data => { setLogs(data); setLoading(false) })
            .catch(() => { toast.error('Failed to load logs'); setLoading(false) })
    }, [])

    useEffect(() => { fetchLogs(date) }, [date, fetchLogs])

    const handleOptOut = async (log: DsDrivingLogView) => {
        if (isReleasing) return
        setIsReleasing(log.id)
        try {
            await drivingLogApi.release(log.id)
            toast.success(`${log.vehicle_number} opted out successfully`)
            fetchLogs(date)
        } catch {
            toast.error('Failed to opt out. Please try again.')
        } finally {
            setIsReleasing(null)
        }
    }

    const formatTime = (iso: string) => {
        const d = new Date(iso)
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    }

    const activeLogs = logs.filter(l => !l.end_datetime)
    const completedLogs = logs.filter(l => l.end_datetime)

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
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
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
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

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    {/* ── Active Cars ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            <h2 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide">
                                Active Cars
                            </h2>
                            {activeLogs.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                                    {activeLogs.length}
                                </span>
                            )}
                        </div>

                        {activeLogs.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center">
                                <Car className="h-9 w-9 mx-auto text-slate-300 mb-2" />
                                <p className="text-sm font-medium text-slate-400">No cars currently assigned</p>
                                <p className="text-xs text-slate-300 mt-1">Click "Assign Car" to get started</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeLogs.map(log => (
                                    <Card key={log.id} className="bg-white border-slate-100 overflow-hidden group hover:border-amber-200 transition-colors">
                                        <CardContent className="p-0">
                                            {/* Top color bar */}
                                            <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500" />
                                            <div className="p-4 space-y-3">
                                                {/* Vehicle */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
                                                            <Car className="h-4.5 w-4.5 text-amber-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[14px] font-bold text-slate-900">{log.vehicle_number}</p>
                                                            {log.vehicle_name && (
                                                                <p className="text-[11px] text-slate-400">{log.vehicle_name}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                        In Use
                                                    </span>
                                                </div>

                                                {/* Instructor */}
                                                <div className="flex items-center gap-2 text-[13px] text-slate-600">
                                                    <UserCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    <span className="font-medium">{log.instructor_name}</span>
                                                </div>

                                                {/* Time */}
                                                <div className="flex items-center gap-2 text-[12px] text-slate-400">
                                                    <Clock className="h-3.5 w-3.5 shrink-0" />
                                                    <span>Since {formatTime(log.start_datetime)}</span>
                                                </div>

                                                {/* Opt Out button */}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={isReleasing === log.id}
                                                    onClick={() => handleOptOut(log)}
                                                    className="w-full h-8 rounded-xl text-[12px] font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 cursor-pointer disabled:opacity-50 mt-1"
                                                >
                                                    {isReleasing === log.id ? (
                                                        <>Processing...</>
                                                    ) : (
                                                        <>
                                                            <LogOut className="h-3.5 w-3.5 mr-1.5" />
                                                            Opt Out
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Completed Logs ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                            <h2 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide">
                                Completed Logs
                            </h2>
                            {completedLogs.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                                    {completedLogs.length}
                                </span>
                            )}
                        </div>

                        {completedLogs.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-100 bg-white py-8 text-center">
                                <p className="text-sm text-slate-300">No completed sessions for this date</p>
                            </div>
                        ) : (
                            <Card className="bg-white border-slate-100">
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Instructor</th>
                                                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Vehicle</th>
                                                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Opted At</th>
                                                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Released At</th>
                                                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Duration</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {completedLogs.map(log => {
                                                    const mins = log.end_datetime
                                                        ? Math.round((new Date(log.end_datetime).getTime() - new Date(log.start_datetime).getTime()) / 60000)
                                                        : 0
                                                    const durText = mins >= 60
                                                        ? `${Math.floor(mins / 60)}h ${mins % 60}m`
                                                        : `${mins}m`
                                                    return (
                                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex items-center gap-2">
                                                                    <UserCircle className="h-4 w-4 text-slate-300" />
                                                                    <span className="text-[13px] font-medium text-slate-700">{log.instructor_name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex items-center gap-2">
                                                                    <Car className="h-3.5 w-3.5 text-slate-300" />
                                                                    <span className="text-[13px] text-slate-600">{log.vehicle_number}</span>
                                                                    {log.vehicle_name && <span className="text-[12px] text-slate-400">({log.vehicle_name})</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3.5">
                                                                <span className="text-[13px] text-slate-600">{formatTime(log.start_datetime)}</span>
                                                            </td>
                                                            <td className="px-5 py-3.5">
                                                                <span className="text-[13px] text-slate-600">
                                                                    {log.end_datetime ? formatTime(log.end_datetime) : '—'}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3.5">
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
                                                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                                    {durText}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </>
            )}

            <AssignCarSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                defaultDate={date}
                onSuccess={() => fetchLogs(date)}
                activeLogs={activeLogs}
            />
        </div>
    )
}
