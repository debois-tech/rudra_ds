'use client'

import { useState } from 'react'
import { CalendarClock, Plus, UserCircle, Car, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const mockLogs = [
    { id: '1', instructor: 'Rajesh Kumar', vehicle: 'MH12 AB 1234 (Swift Dzire)', opted_at: '09:15 AM', released_at: null, notes: '' },
    { id: '2', instructor: 'Suresh Patel', vehicle: 'MH12 CD 5678 (Hyundai i10)', opted_at: '09:30 AM', released_at: '12:45 PM', notes: 'Morning batch complete' },
    { id: '3', instructor: 'Amit Singh', vehicle: 'MH12 EF 9012 (Baleno)', opted_at: '10:00 AM', released_at: null, notes: '' },
    { id: '4', instructor: 'Vijay Sharma', vehicle: 'MH12 GH 3456 (Activa)', opted_at: '11:00 AM', released_at: '01:30 PM', notes: 'Bike training' },
]

export default function DailyLogsPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

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
                    <Button className="rounded-xl h-9 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black shadow-sm cursor-pointer">
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
                                {mockLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <UserCircle className="h-6 w-6 text-slate-400" />
                                                <span className="text-[13px] font-medium text-slate-900">{log.instructor}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Car className="h-4 w-4 text-slate-400" />
                                                <span className="text-[13px] text-slate-600">{log.vehicle}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-[13px] text-slate-600">{log.opted_at}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.released_at ? (
                                                <span className="text-[13px] text-slate-600">{log.released_at}</span>
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
                                                <Button size="sm" variant="ghost" className="text-[12px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer">
                                                    Release
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
        </div>
    )
}
