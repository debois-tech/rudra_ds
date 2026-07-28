import type { ServiceBreakdown } from '@/lib/types';

export function ServiceDonut({ data }: { data: ServiceBreakdown[] }) {
    const total = data.reduce((s, d) => s + d.count, 0);
    if (total === 0) return <p className="text-sm text-slate-400 text-center py-6">No services yet</p>;

    const colors: Record<string, string> = {
        vehicle: '#f59e0b',
        licence: '#6366f1',
    };
    const labels: Record<string, string> = {
        vehicle: 'Vehicle',
        licence: 'Licence',
    };

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    
    const slices = data.reduce<{ category: string, count: number, pct: number, offset: number, dashArray: string }[]>((acc, d) => {
        const pct = d.count / total;
        const prev = acc[acc.length - 1];
        const cumulative = prev ? (prev.offset / circumference) + prev.pct : 0;
        const offset = circumference * cumulative;
        const dashArray = `${circumference * pct} ${circumference * (1 - pct)}`;
        acc.push({ ...d, pct, offset, dashArray });
        return acc;
    }, []);

    return (
        <div className="flex items-center justify-center gap-6">
            <svg width={100} height={100} viewBox="0 0 100 100">
                {slices.map((slice, i) => (
                        <circle
                            key={i}
                            cx={50} cy={50} r={radius}
                            fill="none"
                            stroke={colors[slice.category] || '#94a3b8'}
                            strokeWidth={14}
                            strokeDasharray={slice.dashArray}
                            strokeDashoffset={-slice.offset}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            className="transition-all duration-700"
                        />
                ))}
                <text x={50} y={50} textAnchor="middle" dominantBaseline="central"
                    className="text-[18px] font-bold fill-slate-900">{total}</text>
            </svg>
            <div className="space-y-2">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[d.category] || '#94a3b8' }} />
                        <span className="text-[12px] font-medium text-slate-600">
                            {labels[d.category] || d.category}: <span className="text-slate-900 font-bold">{d.count}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
