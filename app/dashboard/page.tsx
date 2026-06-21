'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import type { DashboardStats, CustomerDashboardView, ServiceOverview } from '@/lib/types';
import { Users, Car, Wrench, IndianRupee, Plus, Clock, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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

function ActivitySkeleton() {
    return (
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
    )
}

// ═══════════════════════════════════════════
// Stat Card
// ═══════════════════════════════════════════

function StatCard({ label, value, icon: Icon, accentColor }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    accentColor: string;
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
// Main Dashboard Page
// ═══════════════════════════════════════════

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalCustomers: 0, totalVehicles: 0, totalServices: 0, totalRevenue: 0,
    });
    const [activities, setActivities] = useState<ActivityItem[]>([]);
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

    return (
        <div className="space-y-8 animate-fade-in">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-[14px] text-slate-400 mt-1">
                        Overview of your business performance
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
                        <Button className="rounded-xl h-9 px-4 text-[13px] font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-sm cursor-pointer">
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
                            accentColor="bg-violet-50 text-violet-600"
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
                            accentColor="bg-amber-50 text-amber-600"
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
                            <ActivitySkeleton />
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
                                        : 'bg-violet-50 text-violet-600'
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