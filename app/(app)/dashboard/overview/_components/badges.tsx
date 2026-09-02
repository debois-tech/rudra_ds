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
    return (
        <span className={`inline-flex items-center gap-1 rounded-md border bg-white px-2 py-0.5 text-[11px] font-bold ${days < 7 ? 'border-red-500 text-red-600' : 'border-slate-300 text-black'}`}>
            {days}d left
        </span>
    );
}
