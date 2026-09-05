import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { studentApi } from '@/lib/ds-api'
import type { DsStudentDashboardView } from '@/lib/types'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface EditStudentSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    student: DsStudentDashboardView
    onSuccess: () => void
}

export function EditStudentSheet({ open, onOpenChange, student, onSuccess }: EditStudentSheetProps) {
    const [saving, setSaving] = useState(false)

    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [address, setAddress] = useState('')
    const [courseType, setCourseType] = useState('LMV')
    const [totalFee, setTotalFee] = useState('')

    useEffect(() => {
        if (open) {
            setName(student.name)
            setPhone(student.phone)
            setEmail(student.email || '')
            setAddress(student.address || '')
            setCourseType(student.course_type)
            setTotalFee(student.total_fee.toString())
        }
    }, [open, student])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !phone || !courseType || !totalFee) {
            toast.error('Please fill all required fields')
            return
        }

        const feeNum = parseFloat(totalFee)
        if (isNaN(feeNum) || feeNum < 0 || feeNum < student.total_paid) {
            toast.error(feeNum < student.total_paid ? `Fee cannot be below paid amount (₹${student.total_paid.toLocaleString('en-IN')}).` : 'Enter a valid total fee.')
            return
        }

        setSaving(true)
        try {
            await studentApi.update(student.id, {
                name,
                phone,
                email,
                address,
                course_type: courseType,
                total_fee: feeNum
            })
            toast.success('Student updated successfully')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to update student:', error)
            toast.error('Failed to update student')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="bg-white sm:max-w-md w-full border-l border-slate-100 flex flex-col p-0">
                <SheetHeader className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
                    <SheetTitle className="text-xl font-bold text-slate-900">Edit Student</SheetTitle>
                    <SheetDescription className="text-sm text-slate-500">
                        Update details for {student.name}.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Full Name <span className="text-red-500">*</span></Label>
                            <Input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="h-10 bg-slate-50 border-slate-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Phone Number <span className="text-red-500">*</span></Label>
                            <Input
                                required
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                maxLength={10}
                                className="h-10 bg-slate-50 border-slate-200"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Email</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="h-10 bg-slate-50 border-slate-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Address</Label>
                            <Input
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                className="h-10 bg-slate-50 border-slate-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Course Type <span className="text-red-500">*</span></Label>
                            <Select value={courseType} onValueChange={setCourseType}>
                                <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Select course..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LMV">LMV (Car)</SelectItem>
                                    <SelectItem value="MCWG">MCWG (Two-Wheeler)</SelectItem>
                                    <SelectItem value="LMV+MCWG">Both (LMV+MCWG)</SelectItem>
                                    <SelectItem value="HMV">HMV (Heavy)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Total Agreed Fee (₹) <span className="text-red-500">*</span></Label>
                            <Input
                                type="number"
                                required
                                min="0"
                                value={totalFee}
                                onChange={e => setTotalFee(e.target.value)}
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
                            Save Changes
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    )
}
