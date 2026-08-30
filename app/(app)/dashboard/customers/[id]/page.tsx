'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { customerApi, vehicleApi, serviceApi } from '@/lib/api';
import type { Customer, Vehicle, ServiceOverview } from '@/lib/types';
import { ArrowLeft, Edit2, Car, Wrench, Trash2, Loader2, Save, X, Plus, User, Phone, Mail, MapPin, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<ServiceOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    c_name: '', c_mobile: '', c_whatsapp: '', c_email: '', c_address: '', c_dob: ''
  });

  useEffect(() => {
    async function load() {
      try {
        const [cust, vehs, svcs] = await Promise.all([
          customerApi.getById(id),
          vehicleApi.getByOwner(id),
          serviceApi.getByCustomer(id),
        ]);
        setCustomer(cust);
        setVehicles(vehs);
        setServices(svcs);
        if (cust) {
          setEditForm({
            c_name: cust.c_name, c_mobile: cust.c_mobile,
            c_whatsapp: cust.c_whatsapp || '', c_email: cust.c_email || '',
            c_address: cust.c_address || '', c_dob: cust.c_dob || '',
          });
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load customer');
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await customerApi.update(id, editForm);
      setCustomer(updated);
      setEditing(false);
      toast.success('Customer updated!');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-40 bg-white rounded-2xl shadow-sm border border-slate-200">
         <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
         <h2 className="text-xl font-bold text-slate-700">Customer not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{customer.c_name}</h1>
            <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">ID: <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{customer.c_registration_id}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <Button variant="outline" onClick={() => setEditing(true)} className="rounded-xl h-10 px-5 font-medium border-slate-200 hover:bg-slate-50">
              <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
            </Button>
          )}
          <Link href={`/dashboard/services/new?customer=${customer.c_id}`}>
            <Button className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-xl h-10 px-5 font-medium shadow-sm border border-amber-600/20">
              <Wrench className="h-4 w-4 mr-2" /> Give Service
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Personal Details - LHS */}
        <div className="md:col-span-1 space-y-6">
          <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-3 pt-5 px-6">
              <CardTitle className="text-lg">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {editing ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Full Name</label>
                      <Input className="mt-1 bg-slate-50 focus-visible:ring-amber-200 border-slate-200 rounded-lg" value={editForm.c_name} onChange={e => setEditForm({ ...editForm, c_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Mobile</label>
                      <Input className="mt-1 bg-slate-50 focus-visible:ring-amber-200 border-slate-200 rounded-lg" value={editForm.c_mobile} onChange={e => setEditForm({ ...editForm, c_mobile: e.target.value })} maxLength={10} />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">WhatsApp</label>
                      <Input className="mt-1 bg-slate-50 focus-visible:ring-amber-200 border-slate-200 rounded-lg" value={editForm.c_whatsapp} onChange={e => setEditForm({ ...editForm, c_whatsapp: e.target.value })} maxLength={10} />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Email</label>
                      <Input className="mt-1 bg-slate-50 focus-visible:ring-amber-200 border-slate-200 rounded-lg" value={editForm.c_email} onChange={e => setEditForm({ ...editForm, c_email: e.target.value })} type="email" />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Date of Birth</label>
                      <Input className="mt-1 bg-slate-50 focus-visible:ring-amber-200 border-slate-200 rounded-lg" value={editForm.c_dob} onChange={e => setEditForm({ ...editForm, c_dob: e.target.value })} type="date" />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Address</label>
                      <Textarea className="mt-1 bg-slate-50 focus-visible:ring-amber-200 border-slate-200 rounded-lg" value={editForm.c_address} onChange={e => setEditForm({ ...editForm, c_address: e.target.value })} rows={2} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-lg flex-1 shadow-sm">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)} className="rounded-lg"><X className="h-4 w-4 mr-1" /> Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { icon: Phone, label: 'Mobile', value: customer.c_mobile, isLink: true, prefix: 'tel:' },
                    { icon: Phone, label: 'WhatsApp', value: customer.c_whatsapp || '—', isLink: !!customer.c_whatsapp, prefix: 'https://wa.me/91' },
                    { icon: Mail, label: 'Email', value: customer.c_email || '—', isLink: !!customer.c_email, prefix: 'mailto:' },
                    { icon: MapPin, label: 'Address', value: customer.c_address || '—' },
                    { icon: Calendar, label: 'Birthday', value: customer.c_dob ? format(new Date(customer.c_dob), 'dd MMM yyyy') : '—' },
                    { icon: Clock, label: 'Joined', value: format(new Date(customer.created_at), 'dd MMM yyyy') },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="p-1.5 bg-white rounded-md border border-slate-200">
                        <item.icon className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{item.label}</p>
                        {item.isLink ? (
                          <a href={`${item.prefix}${item.value}`} className="text-sm font-semibold text-amber-700 hover:underline truncate block">
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-sm font-semibold text-slate-900 break-words">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Vehicles and Services - RHS */}
        <div className="md:col-span-2 space-y-6">
          {/* Vehicles List */}
          <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-3 pt-5 px-6 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg"><Car className="h-5 w-5 text-amber-500" /> Vehicles <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{vehicles.length}</span></CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-slate-50/30">
              {vehicles.length === 0 ? (
                <div className="p-8 text-center bg-white">
                  <Car className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">No vehicles registered</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {vehicles.map(v => (
                    <div key={v.v_id} className="flex items-center justify-between p-4 bg-white hover:bg-amber-50/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center bg-amber-50 rounded-lg border border-amber-100 text-amber-700 font-bold tracking-tight">
                          {v.v_type.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 tracking-wide font-mono text-sm">{v.v_number}</p>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{v.v_name || 'Unnamed'} · {v.v_type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services List */}
          <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-3 pt-5 px-6 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg"><Wrench className="h-5 w-5 text-amber-500" /> Service History <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{services.length}</span></CardTitle>
              <Link href={`/dashboard/services/new?customer=${customer.c_id}`}>
                <Button variant="outline" size="sm" className="h-8 rounded-lg border-slate-200 text-slate-600 text-xs font-semibold hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"><Plus className="h-3 w-3 mr-1" /> Add Record</Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {services.length === 0 ? (
                <div className="p-8 text-center bg-white">
                 <Wrench className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                 <p className="text-sm text-slate-500 font-medium">No services recorded</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="py-3 px-4 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">Service</th>
                        <th className="py-3 px-4 font-semibold text-slate-500 text-[11px] uppercase tracking-wider hidden sm:table-cell">Dates (Iss - Exp)</th>
                        <th className="py-3 px-4 font-semibold text-slate-500 text-[11px] uppercase tracking-wider text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {services.map(s => (
                        <tr key={s.s_id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900">{s.service_name}</p>
                            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              s.category === 'vehicle' ? 'bg-amber-50 text-amber-700' : 'bg-violet-50 text-violet-700'
                            }`}>
                              {s.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell">
                            <p className="text-xs font-semibold text-slate-700">{format(new Date(s.issue_date), 'dd MMM yyyy')}</p>
                            <p className="text-xs text-slate-500">{s.expiry_date ? format(new Date(s.expiry_date), 'dd MMM yyyy') : 'No Expiry'}</p>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">₹{Number(s.total_cost).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}