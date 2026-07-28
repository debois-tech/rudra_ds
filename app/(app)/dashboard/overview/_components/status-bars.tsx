import type { StatusBreakdown } from '@/lib/types';

export function StatusBars({ data }: { data: StatusBreakdown[] }) {
    const total = data.reduce((s, d) => s + d.count, 0);
    if (total === 0) return <p className="text-sm text-slate-400 text-center py-6">No services yet</p>;

    const colors: Record<string, { bg: string; bar: string; text: string }> = {
        active: { bg: 'bg-emerald-50', bar: 'bg-emerald-500', text: 'text-emerald-700' },
        completed: { bg: 'bg-slate-50', bar: 'bg-slate-400', text: 'text-slate-600' },
        cancelled: { bg: 'bg-red-50', bar: 'bg-red-400', text: 'text-red-600' },
    };

    return (
        <div className="space-y-3">
            {data.map((d, i) => {
                const pct = (d.count / total) * 100;
                const style = colors[d.status] || colors.active;
                return (
                    <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                            <span className={`text-[12px] font-semibold capitalize ${style.text}`}>{d.status}</span>
                            <span className="text-[11px] font-bold text-slate-500">{d.count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className={`h-2 rounded-full ${style.bg}`}>
                            <div className={`h-2 rounded-full ${style.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
