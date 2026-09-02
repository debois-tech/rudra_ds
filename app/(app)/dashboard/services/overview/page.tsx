'use client';

import { useEffect, useState, useContext } from 'react';
import { DashboardOrgContext } from '../../../app-shell';
import { serviceApi } from '@/lib/api';
import type { ServiceOverview } from '@/lib/types';
import { FileText, Loader2, Download, Search, Wrench, Car } from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { generateInvoice } from '@/lib/invoice';

export default function ServiceOverviewPage() {
  const orgName = useContext(DashboardOrgContext);
  const [services, setServices] = useState<ServiceOverview[]>([]);
  const [filtered, setFiltered] = useState<ServiceOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await serviceApi.getAll();
        if (!cancelled) {
          setServices(data);
          setFiltered(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          toast.error('Failed to load services');
        }
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
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
      generateInvoice(service, orgName || 'Driving School');
      toast.success('Invoice downloaded!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate invoice');
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Services</h1>
          <p className="text-slate-500 mt-1 font-medium">{services.length} total services</p>
        </div>
        <Link href="/dashboard/services/new">
          <Button className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-xl h-10 px-5 font-medium shadow-sm border border-amber-600/20">
            <Wrench className="h-4 w-4 mr-2" /> New Service
          </Button>
        </Link>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5 px-6">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 max-w-sm focus-within:ring-2 focus-within:ring-amber-100 focus-within:border-amber-300 transition-all">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              placeholder="Search by customer, service, vehicle..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium mb-4">{searchQuery ? 'No services found matching that query' : 'No services yet'}</p>
              {!searchQuery && (
                <Link href="/dashboard/services/new">
                  <Button variant="outline" className="rounded-xl font-medium">Create First Service</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Issue 4 Fix: Removed "Status" column — not necessary for end users */}
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Customer</th>
                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Service Details</th>
                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">Vehicle / Licence ID</th>
                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">Dates</th>
                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Amount</th>
                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(s => (
                    <tr key={s.s_id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <Link href={`/dashboard/customers/${s.customer_id}`} className="block hover:opacity-80 transition-opacity">
                          <p className="font-semibold text-slate-900">{s.customer_name}</p>
                          <p className="text-xs text-slate-500">{s.customer_mobile}</p>
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-800">{s.service_name}</p>
                        <span className={`inline-flex items-center gap-1 mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          s.category === 'vehicle' ? 'bg-amber-50 text-amber-700' : 'bg-violet-50 text-violet-700'
                        }`}>
                          {s.category === 'vehicle' ? <Car className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          {s.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 hidden md:table-cell">
                        <p className="font-medium text-slate-700">{s.category === 'vehicle' ? (s.vehicle_type || '—') : (s.vehicle_type_licence || '—')}</p>
                        <p className="text-xs font-mono text-slate-500">{s.vehicle_number || s.mdl_number || '—'}</p>
                      </td>
                      <td className="py-4 px-6 hidden lg:table-cell">
                        <p className="text-sm font-medium text-slate-700">{format(new Date(s.issue_date), 'dd MMM yy')}</p>
                        <p className="text-xs text-slate-500">Exp: {s.expiry_date ? format(new Date(s.expiry_date), 'dd MMM yy') : '—'}</p>
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-slate-900 text-base">
                        ₹{Number(s.total_cost).toLocaleString()}
                      </td>
                      {/* Issue 7 Fix: Always visible download button — removed hover-reveal opacity */}
                      <td className="py-4 px-6 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:text-amber-700 hover:border-amber-200 hover:bg-amber-50 rounded-lg"
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
