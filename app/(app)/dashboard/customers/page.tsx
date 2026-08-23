'use client';

import { useEffect, useState } from 'react';
import { customerApi } from '@/lib/api';
import type { CustomerDashboardView } from '@/lib/types';
import { Users, Plus, Search, Eye, Wrench, Trash2, Loader2, Car } from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerDashboardView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1 font-medium">{customers.length} total customers</p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl h-10 px-5 font-medium shadow-sm border border-purple-700/20">
            <Plus className="h-4 w-4 mr-2" /> New Customer
          </Button>
        </Link>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5 px-6">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 max-w-sm focus-within:ring-2 focus-within:ring-purple-100 focus-within:border-purple-300 transition-all">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              placeholder="Search by name, mobile, or registration ID..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
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
                  {customers.map((c) => (
                    <tr key={c.c_id} className="hover:bg-purple-50/30 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold border border-purple-200">
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
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100" title="Vehicles">
                             <Car className="h-3 w-3" /> {c.vehicle_count}
                           </span>
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100" title="Services">
                             <Wrench className="h-3 w-3" /> {c.service_count}
                           </span>
                         </div>
                      </td>
                      <td className="py-4 px-6">
                         <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/customers/${c.c_id}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50" title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/services/new?customer=${c.c_id}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50" title="New Service">
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