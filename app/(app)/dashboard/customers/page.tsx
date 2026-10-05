'use client';

import { useEffect, useState } from 'react';
import { customerApi, type CustomerSort as SortKey, type CustomerVehicleFilter as VehicleFilter } from '@/lib/api';
import type { CustomerDashboardView } from '@/lib/types';
import { Users, Plus, Search, Eye, Wrench, Trash2, Loader2, Car, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FILTER_TRIGGER_CLASS, FILTER_ITEM_CLASS } from '@/lib/ui-constants';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'vehicles', label: 'Most vehicles' },
  { value: 'services', label: 'Most services' },
  { value: 'revenue', label: 'Highest revenue' },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerDashboardView[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // re-query after a search/sort/filter change
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>('all');

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchQuery.trim();
      if (next === debouncedSearch) return;
      setRefreshing(true);
      setDebouncedSearch(next);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    customerApi.count().then(setTotal).catch(console.error);
  }, []);

  // Any change to search/sort/filter restarts from page 1. `cancelled` drops
  // out-of-order responses so a slow earlier query can't overwrite a newer one.
  useEffect(() => {
    let cancelled = false;
    customerApi.list({ search: debouncedSearch, sort: sortBy, vehicleFilter })
      .then(({ rows, hasMore }) => { if (!cancelled) { setCustomers(rows); setHasMore(hasMore); setLoadError(false); } })
      .catch(err => { if (!cancelled) { console.error(err); setLoadError(true); toast.error('Failed to load customers'); } })
      .finally(() => { if (!cancelled) { setLoading(false); setRefreshing(false); } });
    return () => { cancelled = true; };
  }, [debouncedSearch, sortBy, vehicleFilter, reloadKey]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const { rows, hasMore } = await customerApi.list({ search: debouncedSearch, sort: sortBy, vehicleFilter, offset: customers.length });
      setCustomers(prev => [...prev, ...rows.filter(r => !prev.some(p => p.c_id === r.c_id))]);
      setHasMore(hasMore);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load more customers');
    }
    setLoadingMore(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete customer "${name}"? This will also delete their vehicles and service records.`)) return;
    setDeleting(id);
    try {
      await customerApi.delete(id);
      setTotal(t => t - 1);
      setCustomers(prev => prev.filter(c => c.c_id !== id));
      toast.success(`Customer "${name}" deleted`);
    } catch (error) {
      toast.error('Failed to delete customer');
      console.error(error);
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1 font-medium">
            {`${total.toLocaleString('en-IN')} total customers`}
          </p>
        </div>
        <Link href="/dashboard/services/new">
          <Button className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-xl h-10 px-5 font-medium shadow-sm border border-amber-600/20">
            <Plus className="h-4 w-4 mr-2" /> New Customer
          </Button>
        </Link>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5 px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-0 sm:max-w-sm focus-within:ring-2 focus-within:ring-amber-100 focus-within:border-amber-300 transition-all">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                placeholder="Search by name, mobile, or registration ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={v => { setRefreshing(true); setSortBy(v as SortKey); }}>
                <SelectTrigger size="sm" aria-label="Sort customers" className={FILTER_TRIGGER_CLASS}>
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  {SORT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className={FILTER_ITEM_CLASS}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={vehicleFilter} onValueChange={v => { setRefreshing(true); setVehicleFilter(v as VehicleFilter); }}>
                <SelectTrigger size="sm" aria-label="Filter by vehicle ownership" className={FILTER_TRIGGER_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  <SelectItem value="all" className={FILTER_ITEM_CLASS}>All customers</SelectItem>
                  <SelectItem value="with" className={FILTER_ITEM_CLASS}>With vehicles</SelectItem>
                  <SelectItem value="without" className={FILTER_ITEM_CLASS}>Without vehicles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : loadError ? (
            <div className="text-center py-20">
              <p className="text-slate-700 font-semibold mb-1">Couldn&apos;t load customers</p>
              <p className="text-slate-500 text-sm mb-4">The request failed or timed out.</p>
              <Button variant="outline" className="rounded-xl font-medium" onClick={() => { setLoading(true); setLoadError(false); setReloadKey(k => k + 1); }}>Retry</Button>
            </div>
          ) : customers.length === 0 && vehicleFilter === 'all' ? (
            <div className="text-center py-20">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Users className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium mb-4">{debouncedSearch ? 'No customers found matching that query' : 'No customers yet'}</p>
              {!debouncedSearch && (
                <Link href="/dashboard/services/new">
                  <Button variant="outline" className="rounded-xl font-medium">Add First Customer</Button>
                </Link>
              )}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-20">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Car className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium mb-4">No customers match this filter</p>
              <Button variant="outline" className="rounded-xl font-medium" onClick={() => { setRefreshing(true); setVehicleFilter('all'); }}>Clear filter</Button>
            </div>
          ) : (
            <div className={`overflow-x-auto transition-opacity ${refreshing ? 'opacity-50 pointer-events-none' : ''}`}>
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Customer</th>
                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">Contact Info</th>
                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">Reg ID</th>
                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Stats</th>
                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.c_id} className="hover:bg-amber-50/30 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold border border-amber-200">
                             {c.c_name.charAt(0).toUpperCase()}
                           </div>
                           <div>
                             <p className="font-semibold text-slate-900">{c.c_name}</p>
                             <p className="text-xs text-slate-500 md:hidden">{c.c_mobile}</p>
                           </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 hidden md:table-cell">
                         <p className="font-medium text-slate-700">{c.c_mobile}</p>
                         {c.c_email && <p className="text-xs text-slate-500">{c.c_email}</p>}
                      </td>
                      <td className="py-4 px-6 hidden lg:table-cell">
                         <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                           {c.c_registration_id}
                         </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                         <div className="flex items-center justify-center gap-2">
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100" title="Vehicles">
                             <Car className="h-3 w-3" /> {c.vehicle_count}
                           </span>
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100" title="Services">
                             <Wrench className="h-3 w-3" /> {c.service_count}
                           </span>
                         </div>
                      </td>
                      <td className="py-4 px-6">
                         <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/customers/${c.c_id}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600 hover:text-amber-700 hover:border-amber-200 hover:bg-amber-50" title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/services/new?customer=${c.c_id}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600 hover:text-amber-700 hover:border-amber-200 hover:bg-amber-50" title="New Service">
                              <Wrench className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                            onClick={() => handleDelete(c.c_id, c.c_name)}
                            disabled={deleting === c.c_id}
                            title="Delete Customer"
                          >
                            {deleting === c.c_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMore && (
                <div className="flex justify-center border-t border-slate-100 p-4">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="rounded-xl font-medium">
                    {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Load more
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}