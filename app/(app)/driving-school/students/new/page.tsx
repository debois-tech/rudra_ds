'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, ArrowLeft, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { studentApi } from '@/lib/ds-api'
import Link from 'next/link'

const courseTypes = ['LMV', 'MCWG', 'HMV', 'Transport', 'Conductor', 'Others']

export default function EnrollStudentPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [address, setAddress] = useState('')
    const [dob, setDob] = useState('')
    const [course, setCourse] = useState('LMV')
    const [fee, setFee] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await studentApi.create({
                name,
                phone,
                email: email || undefined,
                address: address || undefined,
                dob: dob || undefined,
                course_type: course,
                total_fee: Number(fee) || 0,
            })
            router.push('/driving-school/students')
        } catch (err) {
            console.error(err)
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Link href="/driving-school/students">
                    <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-slate-600">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enroll Student</h1>
                    <p className="text-[14px] text-slate-400 mt-1">Add a new driving school student</p>
                </div>
            </div>

            <Card className="bg-white border-slate-100">
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Personal Information</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Full Name *</label>
                                    <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Enter full name" className="rounded-xl border-slate-200 h-9 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Phone *</label>
                                    <Input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="10-digit mobile" className="rounded-xl border-slate-200 h-9 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Email</label>
                                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="rounded-xl border-slate-200 h-9 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Date of Birth</label>
                                    <Input type="date" value={dob} onChange={e => setDob(e.target.value)} className="rounded-xl border-slate-200 h-9 text-sm" />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Address</label>
                                    <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" className="rounded-xl border-slate-200 h-9 text-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Enrollment Details</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Course Type *</label>
                                    <select
                                        value={course}
                                        onChange={e => setCourse(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 h-9 px-3 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                    >
                                        {courseTypes.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-700">Total Fee (₹)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input value={fee} onChange={e => setFee(e.target.value)} placeholder="0" className="pl-9 rounded-xl border-slate-200 h-9 text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Link href="/driving-school/students">
                                <Button type="button" variant="outline" className="rounded-xl h-9 px-4 text-[13px] border-slate-200 cursor-pointer">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={submitting} className="rounded-xl h-9 px-6 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black cursor-pointer disabled:opacity-50">
                                {submitting ? 'Enrolling...' : 'Enroll Student'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
