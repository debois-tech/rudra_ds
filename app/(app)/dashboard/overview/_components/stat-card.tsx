import { TrendingUp } from 'lucide-react';

export function StatCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-8 w-8 rounded-lg" />
            </div>
            <div className="skeleton h-8 w-24 rounded mb-1" />
            <div className="skeleton h-3 w-20 rounded" />
        </div>
    )
}

export function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="skeleton h-5 w-32 rounded mb-4" />
            <div className="skeleton h-24 w-full rounded" />
        </div>
    )
}

export function StatCard({ label, value, icon: Icon, accentColor, trend }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    accentColor: string;
    trend?: string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 card-hover group">
            <div className="flex items-center justify-between mb-3.5">
                <span className="text-[13px] font-medium text-slate-400 uppercase tracking-wide">
                    {label}
                </span>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${accentColor} transition-transform group-hover:scale-110`}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">
                {value}
            </p>
            {trend && (
                <p className="text-[11px] font-medium text-emerald-500 mt-1.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {trend}
                </p>
            )}
        </div>
    )
}
