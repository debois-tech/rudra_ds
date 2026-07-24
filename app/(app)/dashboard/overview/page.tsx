'use client';

import { useEffect, useState, useContext } from 'react';
import { DashboardOrgContext } from '../../app-shell';
import { dashboardApi } from '@/lib/api';
import type {
    DashboardStats, CustomerDashboardView, ServiceOverview,
    ExpiringDocument, ServiceBreakdown, MonthlyRevenue, StatusBreakdown,
} from '@/lib/types';
import {
    Users, Car, Wrench, IndianRupee, Plus, Clock, ArrowUpRight,
    AlertTriangle, TrendingUp, FileText, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

type ActivityItem = {
    id: string;
    type: 'customer' | 'service';
    title: string;
    subtitle: string;
    date: Date;
    status?: string;
    url: string;
}

// ═══════════════════════════════════════════
// Skeleton Components
// ═══════════════════════════════════════════

function StatCardSkeleton() {
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

function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="skeleton h-5 w-32 rounded mb-4" />
            <div className="skeleton h-24 w-full rounded" />
        </div>
    )
}

// ═══════════════════════════════════════════
// Stat Card
// ═══════════════════════════════════════════

function StatCard({ label, value, icon: Icon, accentColor, trend }: {
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

// ═══════════════════════════════════════════
// Status Badge
// ═══════════════════════════════════════════

function StatusBadge({ status }: { status: string }) {
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

// ═══════════════════════════════════════════
// Urgency Badge for expiring documents
// ═══════════════════════════════════════════

function UrgencyBadge({ days }: { days: number }) {
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

// ═══════════════════════════════════════════
// Mini Revenue Bar Chart (SVG)
// ═══════════════════════════════════════════

function RevenueChart({ data }: { data: MonthlyRevenue[] }) {
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

// ═══════════════════════════════════════════
// Donut Chart for Service Breakdown (SVG)
// ═══════════════════════════════════════════

function ServiceDonut({ data }: { data: ServiceBreakdown[] }) {
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

// ═══════════════════════════════════════════
// Status Bars
// ═══════════════════════════════════════════

function StatusBars({ data }: { data: StatusBreakdown[] }) {
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

// ═══════════════════════════════════════════
// Empty State
// ═══════════════════════════════════════════

function EmptyState() {
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

// ═══════════════════════════════════════════
// Time-based Greeting
// ═══════════════════════════════════════════

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

// ═══════════════════════════════════════════
// Main Dashboard Page
// ═══════════════════════════════════════════

export default function DashboardPage() {
    const orgName = useContext(DashboardOrgContext)
    const [stats, setStats] = useState<DashboardStats>({
        totalCustomers: 0, totalVehicles: 0, totalServices: 0, totalRevenue: 0,
    });
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [expiringDocs, setExpiringDocs] = useState<ExpiringDocument[]>([]);
    const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
    const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
    const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
    const [expiryFilter, setExpiryFilter] = useState(15);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [statsData, customersData, servicesData] = await Promise.all([
                    dashboardApi.getStats(),
                    dashboardApi.getRecentCustomers(8),
                    dashboardApi.getRecentServices(8),
                ]);
                setStats(statsData);

                const allActivity: ActivityItem[] = [
                    ...customersData.map((c: CustomerDashboardView) => ({
                        id: `c_${c.c_id}`,
                        type: 'customer' as const,
                        title: c.c_name,
                        subtitle: c.c_email || c.c_mobile,
                        date: new Date(c.created_at),
                        url: `/dashboard/customers/${c.c_id}`,
                    })),
                    ...servicesData.map((s: ServiceOverview) => ({
                        id: `s_${s.s_id}`,
                        type: 'service' as const,
                        title: s.service_name,
                        subtitle: `${s.customer_name}${s.vehicle_number ? ` · ${s.vehicle_number}` : ''}`,
                        date: new Date(s.created_at),
                        status: s.status,
                        url: `/dashboard/services/overview`,
                    }))
                ].sort((a, b) => b.date.getTime() - a.date.getTime());

                setActivities(allActivity);

            } catch (error) {
                console.error('Dashboard error:', error);
            }
            setLoading(false);
        }
        loadData();
    }, []);

    // Charts and expiry alerts must not block the first screen paint.
    useEffect(() => {
        let cancelled = false;
        Promise.all([
            dashboardApi.getServiceBreakdown(),
            dashboardApi.getStatusBreakdown(),
            dashboardApi.getRevenueByMonth(),
            dashboardApi.getExpiringDocuments(expiryFilter),
        ]).then(([breakdown, statusData, revenue, docs]) => {
            if (cancelled) return;
            setServiceBreakdown(breakdown);
            setStatusBreakdown(statusData);
            setRevenueData(revenue);
            setExpiringDocs(docs);
        }).catch(error => console.error('Dashboard secondary data error:', error));
        return () => { cancelled = true; };
    }, [expiryFilter]);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    {orgName && (
                        <p className="text-[13px] font-semibold text-amber-600 mb-1">{orgName}</p>
                    )}
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {getGreeting()} 👋
                    </h1>
                    <p className="text-[14px] text-slate-400 mt-1">
                        Here&apos;s your business at a glance
                    </p>
                </div>
                <div className="flex gap-2.5">
                    <Link href="/dashboard/customers/new">
                        <Button
                            variant="outline"
                            className="rounded-xl h-9 px-4 text-[13px] font-medium border-slate-200 hover:bg-slate-50 shadow-sm cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Customer
                        </Button>
                    </Link>
                    <Link href="/dashboard/services">
                        <Button className="rounded-xl h-9 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black shadow-sm shadow-amber-400/20 cursor-pointer">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Service
                        </Button>
                    </Link>
                </div>
            </div>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                {loading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard
                            label="Customers"
                            value={stats.totalCustomers.toLocaleString('en-IN')}
                            icon={Users}
                            accentColor="bg-amber-50 text-amber-600"
                        />
                        <StatCard
                            label="Vehicles"
                            value={stats.totalVehicles.toLocaleString('en-IN')}
                            icon={Car}
                            accentColor="bg-blue-50 text-blue-600"
                        />
                        <StatCard
                            label="Services"
                            value={stats.totalServices.toLocaleString('en-IN')}
                            icon={Wrench}
                            accentColor="bg-violet-50 text-violet-600"
                        />
                        <StatCard
                            label="Revenue"
                            value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
                            icon={IndianRupee}
                            accentColor="bg-emerald-50 text-emerald-600"
                        />
                    </>
                )}
            </div>

            {/* ── Expiring Documents Alert Panel ── */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-slate-100 gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-semibold text-slate-900">Documents Expiring Soon</h2>
                            <p className="text-[12px] text-slate-400 mt-0.5">Services with upcoming expiry dates</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5">
                        {[7, 15, 30].map(d => (
                            <button
                                key={d}
                                onClick={() => setExpiryFilter(d)}
                                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all cursor-pointer ${
                                    expiryFilter === d
                                        ? 'bg-amber-400 text-black shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {d} days
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="p-6">
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-3 p-3">
                                    <div className="skeleton h-9 w-9 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="skeleton h-4 w-32 rounded" />
                                        <div className="skeleton h-3 w-48 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : expiringDocs.length === 0 ? (
                    <div className="text-center py-10 px-6">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-emerald-500" />
                        </div>
                        <h3 className="text-[14px] font-semibold text-slate-900 mb-1">All clear!</h3>
                        <p className="text-sm text-slate-400">No documents expiring in the next {expiryFilter} days</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {expiringDocs.map((doc) => (
                            <Link
                                key={doc.s_id}
                                href={`/dashboard/customers/${doc.customer_id}`}
                                className="flex items-center gap-3.5 px-6 py-3 hover:bg-amber-50/30 transition-colors group"
                            >
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                                    doc.category === 'vehicle' ? 'bg-amber-50 text-amber-600' : 'bg-violet-50 text-violet-600'
                                }`}>
                                    {doc.category === 'vehicle' ? <Car className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-slate-900 truncate">{doc.customer_name}</p>
                                    <p className="text-[12px] text-slate-400 truncate">
                                        {doc.service_name}{doc.vehicle_number ? ` · ${doc.vehicle_number}` : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[11px] text-slate-400 font-medium hidden sm:block">
                                        {format(new Date(doc.expiry_date), 'dd MMM yyyy')}
                                    </span>
                                    <UrgencyBadge days={doc.days_remaining} />
                                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Analytics Grid ── */}
            <div className="grid md:grid-cols-3 gap-4">
                {/* Revenue Trend */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 md:col-span-1">
                    <div className="flex items-center gap-2 mb-5">
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                        <h3 className="text-[14px] font-semibold text-slate-900">Revenue Trend</h3>
                    </div>
                    {loading ? <CardSkeleton /> : (
                        revenueData.length > 0
                            ? <RevenueChart data={revenueData} />
                            : <p className="text-sm text-slate-400 text-center py-6">No revenue data yet</p>
                    )}
                </div>

                {/* Service Distribution */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Wrench className="h-4 w-4 text-amber-500" />
                        <h3 className="text-[14px] font-semibold text-slate-900">Service Mix</h3>
                    </div>
                    {loading ? <CardSkeleton /> : <ServiceDonut data={serviceBreakdown} />}
                </div>

                {/* Status Overview */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Shield className="h-4 w-4 text-amber-500" />
                        <h3 className="text-[14px] font-semibold text-slate-900">Status Overview</h3>
                    </div>
                    {loading ? <CardSkeleton /> : <StatusBars data={statusBreakdown} />}
                </div>
            </div>

            {/* ── Activity Feed ── */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-[15px] font-semibold text-slate-900">Recent Activity</h2>
                        <p className="text-[12px] text-slate-400 mt-0.5">Latest customers and services</p>
                    </div>
                    <Link href="/dashboard/customers">
                        <Button variant="ghost" className="text-[12px] text-slate-400 hover:text-slate-600 h-8 px-3 rounded-lg cursor-pointer">
                            View all
                            <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Button>
                    </Link>
                </div>

                <div className="divide-y divide-slate-50">
                    {loading ? (
                        <div className="p-3">
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="flex items-center gap-3 p-3">
                                        <div className="skeleton h-9 w-9 rounded-full shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="skeleton h-4 w-32 rounded" />
                                            <div className="skeleton h-3 w-48 rounded" />
                                        </div>
                                        <div className="skeleton h-3 w-14 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : activities.length === 0 ? (
                        <EmptyState />
                    ) : (
                        activities.slice(0, 10).map((item) => (
                            <Link
                                key={item.id}
                                href={item.url}
                                className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-slate-50/60 transition-colors group"
                            >
                                {/* Avatar */}
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                    item.type === 'customer'
                                        ? 'bg-slate-100 text-slate-600'
                                        : 'bg-amber-50 text-amber-600'
                                }`}>
                                    {item.type === 'customer' ? (
                                        item.title?.charAt(0)?.toUpperCase() || 'C'
                                    ) : (
                                        <Wrench className="h-3.5 w-3.5" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-slate-900 truncate">
                                        {item.title || 'Unknown'}
                                    </p>
                                    <p className="text-[12px] text-slate-400 truncate mt-0.5">
                                        {item.subtitle}
                                    </p>
                                </div>

                                {/* Right side */}
                                <div className="flex items-center gap-3 shrink-0">
                                    {item.status && <StatusBadge status={item.status} />}
                                    <span className="text-[11px] text-slate-300 font-medium min-w-[60px] text-right hidden sm:block">
                                        {formatDistanceToNow(item.date, { addSuffix: false })}
                                    </span>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
