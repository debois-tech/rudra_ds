export function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        completed: 'bg-slate-50 text-slate-500 border-slate-200',
        cancelled: 'bg-red-50 text-red-500 border-red-100',
    }

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${styles[status] || styles.active}`}>
            {status}
        </span>
    )
}

export function UrgencyBadge({ days }: { days: number }) {
    if (days <= 3) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
            {days}d left
        </span>
    );
    if (days <= 7) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
            {days}d left
        </span>
    );
    if (days <= 15) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
            {days}d left
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {days}d left
        </span>
    );
}
