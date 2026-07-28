import { Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function EmptyState() {
    return (
        <div className="text-center py-16 px-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">No activity yet</h3>
            <p className="text-sm text-slate-400 max-w-[240px] mx-auto">
                Start by adding your first customer or creating a service record.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
                <Link href="/dashboard/customers/new">
                    <Button
                        variant="outline"
                        className="rounded-xl h-9 px-4 text-[13px] font-medium border-slate-200"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add Customer
                    </Button>
                </Link>
            </div>
        </div>
    )
}
