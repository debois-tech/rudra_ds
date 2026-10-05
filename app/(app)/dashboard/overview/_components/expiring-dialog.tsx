'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { RefreshCw, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { dashboardApi, buildRenewUrl, type ExpiryFilter, type ExpirySort } from '@/lib/api';
import type { ExpiringDocument, ServiceCategory } from '@/lib/types';
import { UrgencyBadge } from './badges';

const PAGE_SIZE = 25;

// Same four sorts in both modes; only the wording of the date ones changes.
export function expirySortOptions(expired: boolean): { value: ExpirySort; label: string }[] {
    return [
        { value: 'expiry-asc', label: expired ? 'Most overdue first' : 'Soonest first' },
        { value: 'expiry-desc', label: expired ? 'Least overdue first' : 'Latest first' },
        { value: 'name', label: 'Customer A–Z' },
        { value: 'cost', label: 'Highest cost' },
    ];
}

// 1 … 4 5 6 … 20 — always first, last and the current page ±1.
function pageList(page: number, pages: number): (number | '…')[] {
    const keep = new Set([1, pages, page - 1, page, page + 1]);
    const out: (number | '…')[] = [];
    let prev = 0;
    for (let n = 1; n <= pages; n++) {
        if (!keep.has(n)) continue;
        if (n - prev > 1) out.push('…');
        out.push(n);
        prev = n;
    }
    return out;
}

// Full list for the current expiry window: server-side search, type filter and
// numbered pages, so any size org can reach every record. Mounted only while open.
export function ExpiringDialog({ filter, sort, onSortChange, onClose }: { filter: ExpiryFilter; sort: ExpirySort; onSortChange: (s: ExpirySort) => void; onClose: () => void }) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [category, setCategory] = useState<ServiceCategory | 'all'>('all');
    const [rows, setRows] = useState<ExpiringDocument[]>([]);
    const [total, setTotal] = useState(0);
    const [loadedKey, setLoadedKey] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    const key = `${filter.kind}:${filter.days}|${sort}|${page}|${debouncedSearch}|${category}`;
    const loading = loadedKey !== key;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', closeOnEscape);
        return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', closeOnEscape); };
    }, [onClose]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (search.trim() === debouncedSearch) return;
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [search, debouncedSearch]);

    // `cancelled` drops out-of-order responses; the key trick gives "loading"
    // for free without setting state inside the effect.
    useEffect(() => {
        let cancelled = false;
        dashboardApi.getExpiringDocuments(filter, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, search: debouncedSearch, category, sort })
            .then(({ rows, total }) => { if (!cancelled) { setRows(rows); setTotal(total); setFailed(false); setLoadedKey(key); } })
            .catch(error => { if (!cancelled) { console.error('Expiring list error:', error); setFailed(true); setLoadedKey(key); } });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` already encodes filter/sort/page/search/category
    }, [key]);

    const windowLabel = filter.kind === 'expired' ? `expired in the last ${filter.days} days` : `expiring in the next ${filter.days} days`;

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/30 p-4" role="presentation" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-labelledby="expiry-dialog-title" className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <h2 id="expiry-dialog-title" className="text-[15px] font-semibold text-slate-900">{filter.kind === 'expired' ? 'Expired documents' : 'Expiring documents'}</h2>
                        <p className="text-xs text-slate-400">{loadedKey === null ? 'Loading…' : `${total.toLocaleString('en-IN')} records ${windowLabel}`}</p>
                    </div>
                    <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                </div>

                <div className="flex gap-2 border-b border-slate-100 p-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, service or vehicle" className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-slate-400" />
                    </div>
                    <select value={sort} onChange={e => { onSortChange(e.target.value as ExpirySort); setPage(1); }} aria-label="Sort" className="h-9 rounded-lg border border-slate-200 px-2 text-xs text-slate-600">
                        {expirySortOptions(filter.kind === 'expired').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select value={category} onChange={e => { setCategory(e.target.value as ServiceCategory | 'all'); setPage(1); }} aria-label="Document type" className="h-9 rounded-lg border border-slate-200 px-2 text-xs text-slate-600">
                        <option value="all">All types</option>
                        <option value="vehicle">Vehicle</option>
                        <option value="licence">Document</option>
                    </select>
                </div>

                <div className={`max-h-[424px] min-h-[120px] flex-none overflow-y-auto transition-opacity duration-150 ${loading && loadedKey !== null ? 'opacity-50' : ''}`}>
                    {failed ? (
                        <p className="px-6 py-10 text-center text-sm text-red-500">Could not load documents. Try again.</p>
                    ) : loadedKey !== null && rows.length === 0 ? (
                        <p className="px-6 py-10 text-center text-sm text-slate-400">No matching documents.</p>
                    ) : rows.map(doc => (
                        <div key={doc.s_id} className="flex items-center gap-3 border-b border-slate-50 px-6 py-3 hover:bg-slate-50">
                            <Link href={`/dashboard/customers/${doc.customer_id}`} onClick={onClose} className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold text-slate-900">{doc.customer_name}</p>
                                <p className="truncate text-xs text-slate-400">{doc.service_name}{doc.vehicle_number ? ` · ${doc.vehicle_number}` : ''}</p>
                            </Link>
                            <UrgencyBadge days={doc.days_remaining} />
                            <Link href={buildRenewUrl(doc)} title="Renew this service" onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900">
                                <RefreshCw className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    ))}
                </div>

                {pages > 1 && (
                    <nav aria-label="Pages" className="flex items-center justify-center gap-1 border-t border-slate-100 px-4 py-3">
                        <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"><ChevronLeft className="h-4 w-4" /></button>
                        {pageList(page, pages).map((n, i) => n === '…'
                            ? <span key={`gap${i}`} className="px-1 text-sm text-slate-400">…</span>
                            : <button key={n} type="button" aria-current={n === page ? 'page' : undefined} onClick={() => setPage(n)} className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold tabular-nums transition-colors ${n === page ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{n}</button>
                        )}
                        <button type="button" aria-label="Next page" disabled={page === pages} onClick={() => setPage(p => p + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"><ChevronRight className="h-4 w-4" /></button>
                    </nav>
                )}
            </div>
        </div>,
        document.body,
    );
}
