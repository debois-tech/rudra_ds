'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, ArrowLeft, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { studentApi } from '@/lib/ds-api'
import Link from 'next/link'
import { toast } from 'sonner'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { getErrorMessage, logClientError } from '@/lib/error-message'

const courseTypes = ['LMV', 'MCWG', 'HMV', 'LMV+MCWG', 'Transport', 'Conductor', 'Others']

export default function EnrollStudentPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [address, setAddress] = useState('')
    const [dob, setDob] = useState('')
    const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0])
    const [course, setCourse] = useState('LMV')
    const [fee, setFee] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !/^\d{10}$/.test(phone)) {
            toast.error('Enter a valid 10-digit phone number.')
            return
        }
        setSubmitting(true)
        try {
            const student = await studentApi.create({
                name,
                phone,
                email: email || undefined,
                address: address || undefined,
                dob: dob || undefined,
                enrollment_date: enrollmentDate,
                course_type: course,
                total_fee: Number(fee) || 0,
            })
            toast.success(`${name} enrolled successfully!`)
            // Redirect to student profile and auto-open payment sheet
            router.push(`/driving-school/students/${student.id}?openPayment=true`)
        } catch (err) {
            logClientError('create-student', err, { phone, course })
            toast.error(getErrorMessage(err, 'Could not enroll student.'))
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Link href="/driving-school/students">
                    <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-slate-600 cursor-pointer">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enroll Student</h1>
                    <p className="text-[14px] text-slate-400 mt-1">After enrollment, you can record the initial payment</p>
                </div>
            </div>

            <Card className="bg-white border-slate-100">
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Personal Information</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Start Date <span className="text-red-500">*</span></label>
                                    <DateTimePicker value={enrollmentDate} onChange={setEnrollmentDate} required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Full Name <span className="text-red-500">*</span></label>
                                    <Input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        placeholder="Enter full name"
                                        className="rounded-xl border-slate-200 h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Phone <span className="text-red-500">*</span></label>
                                    <Input
                                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        required
                                        placeholder="10-digit mobile"
                                        className="rounded-xl border-slate-200 h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Email</label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="email@example.com"
                                        className="rounded-xl border-slate-200 h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Date of Birth</label>
                                    <DateTimePicker value={dob} onChange={setDob} />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Address</label>
                                    <Input
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        placeholder="Full address"
                                        className="rounded-xl border-slate-200 h-9 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Enrollment Details</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Course Type <span className="text-red-500">*</span></label>
                                    <select
                                        value={course}
                                        onChange={e => setCourse(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 h-9 px-3 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                    >
                                        {courseTypes.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Agreed Total Fee (₹)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            type="number"
                                            min="0"
                                            value={fee}
                                            onChange={e => setFee(e.target.value)}
                                            placeholder="0"
                                            className="pl-9 rounded-xl border-slate-200 h-9 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info banner */}
                        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                            <p className="text-[13px] text-emerald-700 font-medium">💡 After enrolling, you'll be taken directly to the student's profile to record the first payment.</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Link href="/driving-school/students">
                                <Button type="button" variant="outline" className="rounded-xl h-9 px-4 text-[13px] border-slate-200 cursor-pointer">
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="rounded-xl h-9 px-6 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Enrolling...' : 'Enroll Student →'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
