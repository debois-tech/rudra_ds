'use client';

import { useEffect, useState, useContext } from 'react';
import { DashboardOrgContext } from '../../app-shell';
import { dashboardApi } from '@/lib/api';
import type {
    DashboardStats, CustomerDashboardView, ServiceOverview,
    ExpiringDocument,
} from '@/lib/types';
import {
    Users, Car, Wrench, Plus, ArrowUpRight, Shield,
    AlertTriangle, FileText, ArrowUpDown, RefreshCw, Search, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FILTER_TRIGGER_CLASS, FILTER_ITEM_CLASS } from '@/lib/ui-constants';
import { buildRenewUrl } from '@/lib/api';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { createPortal } from 'react-dom';

import { StatCard, StatCardSkeleton } from './_components/stat-card';
import { StatusBadge, UrgencyBadge } from './_components/badges';
import { EmptyState } from './_components/empty-state';

type ExpiryMode = number | 'expired';

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
    const [expiryMode, setExpiryMode] = useState<ExpiryMode>(30);
    const [showCustomDays, setShowCustomDays] = useState(false);
    const [customDaysInput, setCustomDaysInput] = useState('');
    const [expiryOpen, setExpiryOpen] = useState(false);
    const [expirySearch, setExpirySearch] = useState('');
    const [expiryCategory, setExpiryCategory] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!expiryOpen) return;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpiryOpen(false); };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', closeOnEscape);
        return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', closeOnEscape); };
    }, [expiryOpen]);

    useEffect(() => {
        async function loadData() {
            try {
                const [allStats, customersData, servicesData] = await Promise.all([
                    dashboardApi.getAllStats(),
                    dashboardApi.getRecentCustomers(8),
                    dashboardApi.getRecentServices(8),
                ]);
                setStats(allStats.stats);

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
        dashboardApi.getExpiringDocuments(expiryMode).then(docs => {
            if (cancelled) return;
            setExpiringDocs(docs);
        }).catch(error => console.error('Dashboard secondary data error:', error));
        return () => { cancelled = true; };
    }, [expiryMode]);

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
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
                    <Link href="/dashboard/services/new">
                        <Button className="rounded-xl h-9 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-black shadow-sm shadow-amber-400/20 cursor-pointer">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Service
                        </Button>
                    </Link>
                </div>
            </div>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
                {loading ? (
                    <>
                        <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
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
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            value={expiryMode === 'expired' ? 'expired' : (expiryMode === 7 || expiryMode === 30 ? String(expiryMode) : 'custom')}
                            onValueChange={(v) => {
                                if (v === 'custom') { setShowCustomDays(true); return; }
                                setShowCustomDays(false);
                                setExpiryMode(v === 'expired' ? 'expired' : Number(v));
                            }}
                        >
                            <SelectTrigger size="sm" aria-label="Expiry window" className={FILTER_TRIGGER_CLASS}>
                                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                                <SelectValue>{expiryMode === 'expired' ? 'Expired' : `${expiryMode} days`}</SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                                <SelectItem value="7" className={FILTER_ITEM_CLASS}>7 days</SelectItem>
                                <SelectItem value="30" className={FILTER_ITEM_CLASS}>30 days</SelectItem>
                                <SelectItem value="custom" className={FILTER_ITEM_CLASS}>Custom…</SelectItem>
                                <SelectItem value="expired" className={FILTER_ITEM_CLASS}>Expired</SelectItem>
                            </SelectContent>
                        </Select>
                        {showCustomDays && (
                            <form
                                className="flex items-center gap-1.5"
                                onSubmit={e => {
                                    e.preventDefault();
                                    const n = parseInt(customDaysInput, 10);
                                    if (n > 0) { setExpiryMode(n); setShowCustomDays(false); setCustomDaysInput(''); }
                                }}
                            >
                                <input
                                    type="number"
                                    min={1}
                                    autoFocus
                                    value={customDaysInput}
                                    onChange={e => setCustomDaysInput(e.target.value)}
                                    placeholder="Days"
                                    className="h-9 w-20 rounded-lg border border-amber-300 bg-white px-2 text-xs font-medium outline-none focus:ring-2 focus:ring-amber-100"
                                />
                                <Button type="submit" size="sm" className="h-9 rounded-lg bg-amber-400 px-3 text-xs font-semibold text-black hover:bg-amber-500">
                                    Set
                                </Button>
                            </form>
                        )}
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
                        <p className="text-sm text-slate-400">
                            {expiryMode === 'expired' ? 'No overdue documents' : `No documents expiring in the next ${expiryMode} days`}
                        </p>
                    </div>
                ) : (
                    <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-50">
                        {expiringDocs.map((doc) => (
                            <div
                                key={doc.s_id}
                                className="flex items-center gap-3.5 px-6 py-3 hover:bg-amber-50/30 transition-colors group"
                            >
                                <Link href={`/dashboard/customers/${doc.customer_id}`} className="flex flex-1 min-w-0 items-center gap-3.5">
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
                                </Link>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[11px] text-slate-400 font-medium hidden sm:block">
                                        {format(new Date(doc.expiry_date), 'dd MMM yyyy')}
                                    </span>
                                    <UrgencyBadge days={doc.days_remaining} />
                                    <Link
                                        href={buildRenewUrl(doc)}
                                        title="Renew this service"
                                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    </Link>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {expiringDocs.length > 5 && <button type="button" onClick={() => setExpiryOpen(true)} className="w-full border-t border-slate-100 px-6 py-3 text-left text-[12px] font-semibold text-amber-700 hover:bg-amber-50/40">View all expiring documents</button>}
            </div>

            {expiryOpen && createPortal(<div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/30 p-4" role="presentation" onClick={() => setExpiryOpen(false)}>
                <div role="dialog" aria-modal="true" aria-labelledby="expiry-dialog-title" className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><div><h2 id="expiry-dialog-title" className="text-[15px] font-semibold text-slate-900">Expiring documents</h2><p className="text-xs text-slate-400">{expiringDocs.length} records in this window</p></div><button type="button" aria-label="Close expiring documents" onClick={() => setExpiryOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
                    <div className="flex gap-2 border-b border-slate-100 p-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={expirySearch} onChange={e => setExpirySearch(e.target.value)} placeholder="Search customer or service" className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-amber-400" /></div><select value={expiryCategory} onChange={e => setExpiryCategory(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-xs text-slate-600"><option value="all">All types</option><option value="vehicle">Vehicle</option><option value="licence">Document</option></select></div>
                    <div className="max-h-[424px] flex-none overflow-y-auto">{expiringDocs.filter(doc => (expiryCategory === 'all' || doc.category === expiryCategory) && `${doc.customer_name} ${doc.service_name}`.toLowerCase().includes(expirySearch.toLowerCase())).map(doc => <div key={doc.s_id} className="flex items-center gap-3 border-b border-slate-50 px-6 py-3 hover:bg-amber-50/30"><Link href={`/dashboard/customers/${doc.customer_id}`} onClick={() => setExpiryOpen(false)} className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-slate-900">{doc.customer_name}</p><p className="truncate text-xs text-slate-400">{doc.service_name}</p></Link><UrgencyBadge days={doc.days_remaining} /><Link href={buildRenewUrl(doc)} title="Renew this service" onClick={() => setExpiryOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 shrink-0"><RefreshCw className="h-3.5 w-3.5" /></Link></div>)}{expiringDocs.filter(doc => (expiryCategory === 'all' || doc.category === expiryCategory) && `${doc.customer_name} ${doc.service_name}`.toLowerCase().includes(expirySearch.toLowerCase())).length === 0 && <p className="px-6 py-10 text-center text-sm text-slate-400">No matching documents.</p>}</div>
                </div>
            </div>, document.body)}

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
