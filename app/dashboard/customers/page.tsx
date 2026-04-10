'use client';

import { useEffect, useState } from 'react';
import { customerApi } from '@/lib/api';
import type { CustomerDashboardView } from '@/lib/types';
import { Users, Plus, Search, Eye, Wrench, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    loadCustomers();
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">{customers.length} total customers</p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> New Customer
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, mobile, or registration ID..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">{searchQuery ? 'No customers found' : 'No customers yet'}</p>
              {!searchQuery && (
                <Link href="/dashboard/customers/new">
                  <Button>Add First Customer</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 hidden md:table-cell">Mobile</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 hidden lg:table-cell">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 hidden lg:table-cell">DOB</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 hidden md:table-cell">Joined</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-600">Vehicles</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-600">Services</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.c_id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-slate-500">{c.c_registration_id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{c.c_name}</p>
                        <p className="text-xs text-slate-500 md:hidden">{c.c_mobile}</p>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-slate-600">{c.c_mobile}</td>
                      <td className="py-3 px-4 hidden lg:table-cell text-slate-600">{c.c_email || '—'}</td>
                      <td className="py-3 px-4 hidden lg:table-cell text-slate-600">
                        {c.c_dob ? format(new Date(c.c_dob), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-slate-600">
                        {format(new Date(c.created_at), 'dd MMM yyyy')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {c.vehicle_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          {c.service_count}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/customers/${c.c_id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View / Edit">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/services?customer=${c.c_id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-600" title="Give Service">
                              <Wrench className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                            onClick={() => handleDelete(c.c_id, c.c_name)}
                            disabled={deleting === c.c_id}
                            title="Delete"
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