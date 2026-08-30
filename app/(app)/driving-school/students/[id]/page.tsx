'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, GraduationCap, Phone, Mail, MapPin, Calendar, IndianRupee, Plus, UserCircle, Car, Clock, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { studentApi, feePaymentApi, attendanceApi } from '@/lib/ds-api'
import type { DsStudentDashboardView, DsFeePayment, DsAttendanceView } from '@/lib/types'
import Link from 'next/link'
import { RecordPaymentSheet } from './_components/record-payment-sheet'
import { EditStudentSheet } from './_components/edit-student-sheet'

export default function StudentProfilePage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const id = params.id as string

    const [student, setStudent] = useState<DsStudentDashboardView | null>(null)
    const [payments, setPayments] = useState<DsFeePayment[]>([])
    const [attendance, setAttendance] = useState<DsAttendanceView[]>([])
    const [tab, setTab] = useState<'overview' | 'fees' | 'attendance'>('overview')
    const [loading, setLoading] = useState(true)
    const [paymentSheetOpen, setPaymentSheetOpen] = useState(false)
    const [editSheetOpen, setEditSheetOpen] = useState(false)

    const fetchAllData = () => {
        Promise.all([
            studentApi.getByIdWithStats(id),
            feePaymentApi.getByStudent(id),
            attendanceApi.getByStudent(id),
        ]).then(([s, p, a]) => {
            if (s) setStudent(s)
            setPayments(p)
            setAttendance(a)
            setLoading(false)
        }).catch(console.error)
    }

    useEffect(() => {
        fetchAllData()
    }, [id])

    // Auto-open payment sheet if redirected from enrollment with ?openPayment=true
    useEffect(() => {
        if (!loading && searchParams.get('openPayment') === 'true') {
            setPaymentSheetOpen(true)
            // Clean the URL without navigating
            router.replace(`/driving-school/students/${id}`, { scroll: false })
        }
    }, [loading, searchParams, id])

    if (loading) return <div className="text-center py-12 text-slate-400 text-sm">Loading...</div>
    if (!student) return <div className="text-center py-12 text-slate-400 text-sm">Student not found</div>

    const pending = student.total_fee - student.total_paid
    const pct = student.total_fee > 0 ? Math.min((student.total_paid / student.total_fee) * 100, 100) : 0

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            {/* Back + Header */}
            <div className="flex items-center gap-4">
                <Link href="/driving-school/students">
                    <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-slate-600 cursor-pointer">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                        {student.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{student.name}</h1>
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-600 capitalize">{student.status}</span>
                        </div>
                        <p className="text-[13px] text-slate-400">{student.course_type} &middot; Enrolled {new Date(student.enrollment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditSheetOpen(true)}
                        className="rounded-xl h-9 px-4 text-[13px] font-medium border-slate-200 cursor-pointer ml-auto"
                    >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                    </Button>
                </div>
            </div>

            {/* Fee Summary Card — with Record Payment shortcut */}
            <Card className="bg-white border-slate-100">
                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">Fee Summary</h3>
                        <Button
                            size="sm"
                            onClick={() => setPaymentSheetOpen(true)}
                            className="rounded-xl h-8 px-3 text-[12px] font-medium bg-amber-500 hover:bg-amber-600 text-black cursor-pointer"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Record Payment
                        </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">Total Fee</p>
                            <p className="text-xl font-bold text-slate-900">₹{student.total_fee.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">Paid</p>
                            <p className="text-xl font-bold text-emerald-600">₹{student.total_paid.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">Pending</p>
                            <p className={`text-xl font-bold ${pending > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                ₹{Math.max(0, pending).toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="h-2 rounded-full bg-slate-100">
                            <div
                                className="h-2 rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5 text-right">{Math.round(pct)}% paid</p>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-100">
                {(['overview', 'fees', 'attendance'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors capitalize cursor-pointer ${
                            tab === t ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {t === 'fees' ? `Payments (${payments.length})` : t === 'attendance' ? `Attendance (${attendance.length})` : t}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {tab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-4">
                    <Card className="bg-white border-slate-100">
                        <CardContent className="p-5 space-y-3.5">
                            <h3 className="text-[14px] font-semibold text-slate-900">Contact Information</h3>
                            <div className="flex items-center gap-3 text-[13px] text-slate-600">
                                <Phone className="h-4 w-4 text-slate-400 shrink-0" /> {student.phone}
                            </div>
                            {student.email && (
                                <div className="flex items-center gap-3 text-[13px] text-slate-600">
                                    <Mail className="h-4 w-4 text-slate-400 shrink-0" /> {student.email}
                                </div>
                            )}
                            {student.address && (
                                <div className="flex items-center gap-3 text-[13px] text-slate-600">
                                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" /> {student.address}
                                </div>
                            )}
                            {student.dob && (
                                <div className="flex items-center gap-3 text-[13px] text-slate-600">
                                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" /> {new Date(student.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-100">
                        <CardContent className="p-5 space-y-3.5">
                            <h3 className="text-[14px] font-semibold text-slate-900">Enrollment Details</h3>
                            <div className="flex items-center gap-3 text-[13px] text-slate-600">
                                <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" /> {student.course_type}
                            </div>
                            <div className="flex items-center gap-3 text-[13px] text-slate-600">
                                <Calendar className="h-4 w-4 text-slate-400 shrink-0" /> Enrolled {new Date(student.enrollment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-3 text-[13px] text-slate-600">
                                <UserCircle className="h-4 w-4 text-slate-400 shrink-0" /> {student.attendance_count} sessions attended
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Fees Tab */}
            {tab === 'fees' && (
                <Card className="bg-white border-slate-100">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="text-[14px] font-semibold text-slate-900">Payment History</h3>
                            <Button
                                size="sm"
                                onClick={() => setPaymentSheetOpen(true)}
                                className="rounded-xl h-8 px-3 text-[12px] font-medium bg-amber-500 hover:bg-amber-600 text-black cursor-pointer"
                            >
                                <Plus className="h-3 w-3 mr-1" /> Record Payment
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Date</th>
                                        <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Amount</th>
                                        <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Mode</th>
                                        <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Note</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center">
                                                <IndianRupee className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                                                <p className="text-sm text-slate-400">No payments recorded yet</p>
                                                <Button
                                                    size="sm"
                                                    onClick={() => setPaymentSheetOpen(true)}
                                                    className="mt-3 rounded-xl h-8 px-4 text-[12px] font-medium bg-amber-500 hover:bg-amber-600 text-black cursor-pointer"
                                                >
                                                    <Plus className="h-3 w-3 mr-1" /> Record First Payment
                                                </Button>
                                            </td>
                                        </tr>
                                    ) : payments.map(p => (
                                        <tr key={p.id}>
                                            <td className="px-6 py-3 text-[13px] text-slate-600">
                                                {new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-3 text-[13px] font-semibold text-slate-900">₹{p.amount.toLocaleString('en-IN')}</td>
                                            <td className="px-6 py-3">
                                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 capitalize">{p.payment_mode}</span>
                                            </td>
                                            <td className="px-6 py-3 text-[13px] text-slate-400">{p.note || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Attendance Tab */}
            {tab === 'attendance' && (
                <Card className="bg-white border-slate-100">
                    <CardContent className="p-0">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h3 className="text-[14px] font-semibold text-slate-900">Attendance History</h3>
                            <p className="text-[12px] text-slate-400 mt-0.5">{attendance.length} sessions attended</p>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {attendance.length === 0 ? (
                                <div className="px-6 py-8 text-center">
                                    <Calendar className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                                    <p className="text-sm text-slate-400">No attendance records yet</p>
                                </div>
                            ) : attendance.map(a => (
                                <div key={a.id} className="flex items-center gap-4 px-6 py-3.5">
                                    <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                                        <UserCircle className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[13px] font-medium text-slate-900">
                                            {new Date(a.attendance_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className="text-[12px] text-slate-400">
                                            {a.instructor_name}{a.vehicle_number ? ` · ${a.vehicle_number}` : ''}
                                        </p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-600">Present</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <RecordPaymentSheet
                open={paymentSheetOpen}
                onOpenChange={setPaymentSheetOpen}
                studentId={id}
                studentName={student.name}
                pendingBalance={Math.max(0, pending)}
                onSuccess={fetchAllData}
            />

            <EditStudentSheet
                open={editSheetOpen}
                onOpenChange={setEditSheetOpen}
                student={student}
                onSuccess={fetchAllData}
            />
        </div>
    )
}
