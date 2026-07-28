import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { feePaymentApi } from '@/lib/ds-api'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface RecordPaymentSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    studentId: string
    onSuccess: () => void
}

export function RecordPaymentSheet({ open, onOpenChange, studentId, onSuccess }: RecordPaymentSheetProps) {
    const [saving, setSaving] = useState(false)

    const [amount, setAmount] = useState('')
    const [paymentDate, setPaymentDate] = useState('')
    const [paymentMode, setPaymentMode] = useState('cash')
    const [note, setNote] = useState('')

    useEffect(() => {
        if (open) {
            setAmount('')
            setPaymentDate(new Date().toISOString().split('T')[0])
            setPaymentMode('cash')
            setNote('')
        }
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || !paymentDate || !paymentMode) {
            toast.error('Please fill all required fields')
            return
        }

        const numericAmount = parseFloat(amount)
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast.error('Please enter a valid amount')
            return
        }

        setSaving(true)
        try {
            await feePaymentApi.create({
                student_id: studentId,
                amount: numericAmount,
                payment_date: paymentDate,
                payment_mode: paymentMode,
                note
            })
            toast.success('Payment recorded successfully')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to record payment:', error)
            toast.error('Failed to record payment')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="bg-white sm:max-w-md w-full border-l border-slate-100 flex flex-col p-0">
                <SheetHeader className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
                    <SheetTitle className="text-xl font-bold text-slate-900">Record Payment</SheetTitle>
                    <SheetDescription className="text-sm text-slate-500">
                        Add a new fee payment record for this student.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Amount (₹) <span className="text-red-500">*</span></Label>
                            <Input
                                type="number"
                                required
                                min="1"
                                step="any"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="Enter amount..."
                                className="h-10 bg-slate-50 border-slate-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Payment Date <span className="text-red-500">*</span></Label>
                            <Input
                                type="date"
                                required
                                value={paymentDate}
                                onChange={e => setPaymentDate(e.target.value)}
                                className="h-10 bg-slate-50 border-slate-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Payment Mode <span className="text-red-500">*</span></Label>
                            <Select value={paymentMode} onValueChange={setPaymentMode}>
                                <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Select mode..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Note (Optional)</Label>
                            <Input
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Transaction ID, remarks..."
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
                            Record Payment
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    )
}
