import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { feePaymentApi } from '@/lib/ds-api'
import { toast } from 'sonner'
import { Loader2, IndianRupee, Banknote, Smartphone, Building2, CreditCard } from 'lucide-react'

interface RecordPaymentSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    studentId: string
    studentName?: string
    pendingBalance?: number
    onSuccess: () => void
}

const PAYMENT_MODES = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'upi', label: 'UPI', icon: Smartphone },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
    { value: 'card', label: 'Card', icon: CreditCard },
]

export function RecordPaymentSheet({ open, onOpenChange, studentId, studentName, pendingBalance, onSuccess }: RecordPaymentSheetProps) {
    const [saving, setSaving] = useState(false)
    const [amount, setAmount] = useState('')
    const [paymentDate, setPaymentDate] = useState('')
    const [paymentMode, setPaymentMode] = useState('cash')
    const [note, setNote] = useState('')

    useEffect(() => {
        if (open) {
            // Pre-fill amount with full pending balance if available
            setAmount(pendingBalance && pendingBalance > 0 ? String(pendingBalance) : '')
            setPaymentDate(new Date().toISOString().split('T')[0])
            setPaymentMode('cash')
            setNote('')
        }
    }, [open, pendingBalance])

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
                note,
            })
            toast.success(`₹${numericAmount.toLocaleString('en-IN')} payment recorded`)
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
                <SheetHeader className="px-6 py-6 border-b border-slate-100 bg-gradient-to-br from-emerald-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <IndianRupee className="h-4.5 w-4.5 text-emerald-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold text-slate-900">Record Payment</SheetTitle>
                            <SheetDescription className="text-xs text-slate-500 mt-0.5">
                                {studentName ? `For ${studentName}` : 'Add a fee payment record'}
                                {pendingBalance && pendingBalance > 0 ? ` · ₹${pendingBalance.toLocaleString('en-IN')} pending` : ''}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Amount (₹) <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="number"
                                    required
                                    min="1"
                                    step="any"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="pl-9 h-11 text-base font-semibold bg-slate-50 border-slate-200"
                                />
                            </div>
                            {pendingBalance && pendingBalance > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setAmount(String(pendingBalance))}
                                    className="text-[12px] text-emerald-600 font-medium hover:underline cursor-pointer"
                                >
                                    Fill full balance: ₹{pendingBalance.toLocaleString('en-IN')}
                                </button>
                            )}
                        </div>

                        {/* Payment Mode — visual pill selector */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Payment Mode <span className="text-red-500">*</span></Label>
                            <div className="grid grid-cols-2 gap-2">
                                {PAYMENT_MODES.map(({ value, label, icon: Icon }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setPaymentMode(value)}
                                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-[13px] font-medium transition-all cursor-pointer ${
                                            paymentMode === value
                                                ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date */}
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

                        {/* Note */}
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
                            <Button type="button" variant="outline" className="h-10 px-5 rounded-xl border-slate-200 cursor-pointer">
                                Cancel
                            </Button>
                        </SheetClose>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-500/20 cursor-pointer"
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
