import type { MonthlyRevenue } from '@/lib/types';

export function RevenueChart({ data }: { data: MonthlyRevenue[] }) {
    const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
    const chartHeight = 100;
    const barWidth = 32;
    const gap = 12;
    const totalWidth = data.length * (barWidth + gap) - gap;

    return (
        <div className="flex flex-col items-center">
            <svg width={totalWidth} height={chartHeight + 30} className="overflow-visible">
                {data.map((d, i) => {
                    const barHeight = (d.revenue / maxRevenue) * chartHeight;
                    const x = i * (barWidth + gap);
                    const y = chartHeight - barHeight;
                    return (
                        <g key={i}>
                            {/* Bar background */}
                            <rect
                                x={x} y={0}
                                width={barWidth} height={chartHeight}
                                rx={6} fill="#f1f5f9"
                            />
                            {/* Value bar */}
                            <rect
                                x={x} y={y}
                                width={barWidth} height={barHeight}
                                rx={6}
                                fill="url(#amberGradient)"
                                className="transition-all duration-500"
                            />
                            {/* Month label */}
                            <text
                                x={x + barWidth / 2}
                                y={chartHeight + 16}
                                textAnchor="middle"
                                className="text-[10px] font-medium fill-slate-400"
                            >
                                {d.month}
                            </text>
                            {/* Value on hover - always show for non-zero */}
                            {d.revenue > 0 && (
                                <text
                                    x={x + barWidth / 2}
                                    y={y - 6}
                                    textAnchor="middle"
                                    className="text-[9px] font-bold fill-amber-600"
                                >
                                    ₹{(d.revenue / 1000).toFixed(d.revenue >= 1000 ? 1 : 0)}k
                                </text>
                            )}
                        </g>
                    );
                })}
                <defs>
                    <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}
