'use client';

import { useEffect, useMemo, useState } from 'react';
import { customerApi } from '@/lib/api';
import type { CustomerDashboardView } from '@/lib/types';
import { Users, Plus, Search, Eye, Wrench, Trash2, Loader2, Car, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

type SortKey = 'name' | 'newest' | 'oldest' | 'vehicles' | 'services' | 'revenue';
type VehicleFilter = 'all' | 'with' | 'without';

const FILTER_TRIGGER_CLASS = 'h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs hover:border-amber-200 hover:bg-amber-50/50 hover:text-amber-900 focus-visible:border-amber-300 focus-visible:ring-amber-100 data-[state=open]:border-amber-300 data-[state=open]:ring-2 data-[state=open]:ring-amber-100 transition-colors';

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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>('all');

  const visibleCustomers = useMemo(() => {
    let list = customers;
    if (vehicleFilter === 'with') list = list.filter(c => c.vehicle_count > 0);
    else if (vehicleFilter === 'without') list = list.filter(c => c.vehicle_count === 0);

    const sorted = [...list];
    switch (sortBy) {
      case 'name': sorted.sort((a, b) => a.c_name.localeCompare(b.c_name)); break;
      case 'oldest': sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case 'vehicles': sorted.sort((a, b) => b.vehicle_count - a.vehicle_count); break;
      case 'services': sorted.sort((a, b) => b.service_count - a.service_count); break;
      case 'revenue': sorted.sort((a, b) => b.total_revenue - a.total_revenue); break;
      case 'newest':
      default: sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return sorted;
  }, [customers, sortBy, vehicleFilter]);

  useEffect(() => {
    let cancelled = false;
    customerApi.getAll()
      .then(data => { if (!cancelled) setCustomers(data); })
      .catch(err => { if (!cancelled) { console.error(err); toast.error('Failed to load customers'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function loadCustomers() {
    try {
      const data = await customerApi.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    }
    setLoading(false);
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      loadCustomers();
      return;
    }
    try {
      const data = await customerApi.search(query);
      setCustomers(data);
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete customer "${name}"? This will also delete their vehicles and service records.`)) return;
    setDeleting(id);
    try {
      await customerApi.delete(id);
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
            {visibleCustomers.length === customers.length
              ? `${customers.length} total customers`
              : `${visibleCustomers.length} of ${customers.length} customers`}
          </p>
        </div>
        <Link href="/dashboard/customers/new">
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
                onChange={e => handleSearch(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={v => setSortBy(v as SortKey)}>
                <SelectTrigger size="sm" aria-label="Sort customers" className={FILTER_TRIGGER_CLASS}>
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  {SORT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="rounded-lg text-xs focus:bg-amber-50 focus:text-amber-900">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={vehicleFilter} onValueChange={v => setVehicleFilter(v as VehicleFilter)}>
                <SelectTrigger size="sm" aria-label="Filter by vehicle ownership" className={FILTER_TRIGGER_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  <SelectItem value="all" className="rounded-lg text-xs focus:bg-amber-50 focus:text-amber-900">All customers</SelectItem>
                  <SelectItem value="with" className="rounded-lg text-xs focus:bg-amber-50 focus:text-amber-900">With vehicles</SelectItem>
                  <SelectItem value="without" className="rounded-lg text-xs focus:bg-amber-50 focus:text-amber-900">Without vehicles</SelectItem>
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
          ) : customers.length === 0 ? (
            <div className="text-center py-20">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Users className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium mb-4">{searchQuery ? 'No customers found matching that query' : 'No customers yet'}</p>
              {!searchQuery && (
                <Link href="/dashboard/customers/new">
                  <Button variant="outline" className="rounded-xl font-medium">Add First Customer</Button>
                </Link>
              )}
            </div>
          ) : visibleCustomers.length === 0 ? (
            <div className="text-center py-20">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Car className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium mb-4">No customers match this filter</p>
              <Button variant="outline" className="rounded-xl font-medium" onClick={() => setVehicleFilter('all')}>Clear filter</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                  {visibleCustomers.map((c) => (
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}