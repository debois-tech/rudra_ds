'use client';

import { useEffect, useState } from 'react';
import { serviceApi } from '@/lib/api';
import type { ServiceOverview } from '@/lib/types';
import { FileText, Loader2, Download, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { generateInvoice } from '@/lib/invoice';

export default function ServiceOverviewPage() {
  const [services, setServices] = useState<ServiceOverview[]>([]);
  const [filtered, setFiltered] = useState<ServiceOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await serviceApi.getAll();
        setServices(data);
        setFiltered(data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load services');
      }
      setLoading(false);
    }
    load();
  }, []);

  function handleSearch(query: string) {
    setSearchQuery(query);
    if (!query.trim()) {
      setFiltered(services);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(services.filter(s =>
      s.customer_name.toLowerCase().includes(q) ||
      s.service_name.toLowerCase().includes(q) ||
      s.vehicle_number?.toLowerCase().includes(q) ||
      s.customer_mobile.includes(q)
    ));
  }

  function handleInvoice(service: ServiceOverview) {
    try {
      generateInvoice(service);
      toast.success('Invoice downloaded!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate invoice');
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700';
      case 'completed': return 'bg-slate-100 text-slate-600';
      case 'cancelled': return 'bg-red-50 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Service Overview</h1>
          <p className="text-slate-500 mt-1">{services.length} total services</p>
        </div>
        <Link href="/dashboard/services">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <FileText className="h-4 w-4 mr-2" /> New Service
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by customer, service, vehicle..."
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
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">{searchQuery ? 'No services found' : 'No services yet'}</p>
              {!searchQuery && (
                <Link href="/dashboard/services">
                  <Button>Create First Service</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-3 px-3 font-medium text-slate-600">Customer</th>
                    <th className="text-left py-3 px-3 font-medium text-slate-600">Service</th>
                    <th className="text-left py-3 px-3 font-medium text-slate-600 hidden md:table-cell">Vehicle Type</th>
                    <th className="text-left py-3 px-3 font-medium text-slate-600 hidden md:table-cell">Vehicle No.</th>
                    <th className="text-left py-3 px-3 font-medium text-slate-600 hidden lg:table-cell">Issued</th>
                    <th className="text-left py-3 px-3 font-medium text-slate-600 hidden lg:table-cell">Expiry</th>
                    <th className="text-right py-3 px-3 font-medium text-slate-600">Amount</th>
                    <th className="text-center py-3 px-3 font-medium text-slate-600">Status</th>
                    <th className="text-center py-3 px-3 font-medium text-slate-600">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.s_id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <Link href={`/dashboard/customers/${s.customer_id}`} className="hover:text-blue-600">
                          <p className="font-medium text-slate-900">{s.customer_name}</p>
                          <p className="text-xs text-slate-500">{s.customer_mobile}</p>
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium">{s.service_name}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          s.category === 'vehicle' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                          {s.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 hidden md:table-cell">
                        {s.category === 'vehicle' ? (s.vehicle_type || '—') : (s.vehicle_type_licence || '—')}
                      </td>
                      <td className="py-3 px-3 text-slate-600 hidden md:table-cell font-mono text-xs">
                        {s.vehicle_number || s.mdl_number || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 hidden lg:table-cell">
                        {format(new Date(s.issue_date), 'dd MMM yyyy')}
                      </td>
                      <td className="py-3 px-3 text-slate-600 hidden lg:table-cell">
                        {s.expiry_date ? format(new Date(s.expiry_date), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900">
                        ₹{Number(s.total_cost).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                          onClick={() => handleInvoice(s)}
                          title="Download Invoice"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
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
