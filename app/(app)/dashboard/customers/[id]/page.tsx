'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { customerApi, vehicleApi, serviceApi, buildRenewUrl } from '@/lib/api';
import type { Customer, Vehicle, ServiceOverview } from '@/lib/types';
import { ArrowLeft, Edit2, Car, Wrench, Trash2, Loader2, Save, X, Plus, User, Phone, Mail, MapPin, Calendar, Clock, RefreshCw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from '../../overview/_components/badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FILTER_TRIGGER_CLASS, FILTER_ITEM_CLASS } from '@/lib/ui-constants';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DateTimePicker } from '@/components/ui/date-time-picker';

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
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<'all' | 'licence' | 'vehicle'>('all');

  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
  const [serviceQuery, setServiceQuery] = useState('');
  const [vehicleSearchOpen, setVehicleSearchOpen] = useState(false);
  const [vehicleQuery, setVehicleQuery] = useState('');

  const vq = vehicleQuery.trim().toLowerCase();
  const listedVehicles = vq
    ? vehicles.filter(v => `${v.v_number} ${v.v_name || ''} ${v.v_type}`.toLowerCase().includes(vq))
    : vehicles;

  const selectedVehicle = vehicles.find(v => v.v_id === selectedVehicleId) || null;

  // A selected vehicle only narrows vehicle services — licence services aren't
  // tied to any vehicle, so "Licence" + a car still lists the licence services.
  // vehicle_number fallback covers imported rows that never got a vehicle_id.
  const sq = serviceQuery.trim().toLowerCase();
  const visibleServices = useMemo(() => services.filter(s => {
    if (serviceType !== 'all' && s.category !== serviceType) return false;
    if (sq && !`${s.service_name} ${s.category} ${s.status} ${s.vehicle_number || ''} ${s.mdl_number || ''}`.toLowerCase().includes(sq)) return false;
    if (!selectedVehicle || serviceType === 'licence') return true;
    return s.category === 'vehicle' && (s.vehicle_id === selectedVehicle.v_id || s.vehicle_number === selectedVehicle.v_number);
  }), [services, serviceType, selectedVehicle, sq]);

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
                      <Input className="mt-1 bg-slate-50 focus-visible:ring-amber-200 border-slate-200 rounded-lg" value={editForm.c_mobile} onChange={e => setEditForm({ ...editForm, c_mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} maxLength={10} />
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
                      <DateTimePicker value={editForm.c_dob} onChange={value => setEditForm({ ...editForm, c_dob: value })} />
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
              {vehicles.length > 0 && (vehicleSearchOpen ? (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex-1 min-w-0 max-w-xs focus-within:ring-2 focus-within:ring-amber-100 focus-within:border-amber-300 transition-all">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    autoFocus
                    aria-label="Search vehicles"
                    placeholder="Search number, name, type..."
                    value={vehicleQuery}
                    onChange={e => setVehicleQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Escape') { setVehicleQuery(''); setVehicleSearchOpen(false); } }}
                    className="bg-transparent border-none outline-none w-full text-sm text-slate-900 placeholder:text-slate-400"
                  />
                  <button type="button" aria-label="Close vehicle search" onClick={() => { setVehicleQuery(''); setVehicleSearchOpen(false); }} className="text-slate-400 hover:text-slate-700 shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="icon" aria-label="Search vehicles" title="Search vehicles" onClick={() => setVehicleSearchOpen(true)} className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200">
                  <Search className="h-4 w-4" />
                </Button>
              ))}
            </CardHeader>
            <CardContent className="p-0 bg-slate-50/30">
              {vehicles.length === 0 ? (
                <div className="p-8 text-center bg-white">
                  <Car className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">No vehicles registered</p>
                </div>
              ) : (
                // ~5 rows tall (each row is 73px); the rest scrolls inside the card
                <div className="max-h-[365px] overflow-y-auto divide-y divide-slate-100">
                  {listedVehicles.length === 0 && <p className="p-6 text-center text-sm text-slate-500 bg-white">No vehicles match &ldquo;{vehicleQuery.trim()}&rdquo;</p>}
                  {listedVehicles.map(v => (
                    <button
                      type="button"
                      key={v.v_id}
                      aria-pressed={v.v_id === selectedVehicleId}
                      title={v.v_id === selectedVehicleId ? 'Click to show all services' : 'Click to show only this vehicle\'s services'}
                      onClick={() => setSelectedVehicleId(v.v_id === selectedVehicleId ? null : v.v_id)}
                      className={`flex w-full items-center justify-between p-4 text-left transition-colors ${v.v_id === selectedVehicleId ? 'bg-slate-100 ring-1 ring-inset ring-slate-300' : `bg-white hover:bg-slate-50 ${selectedVehicleId ? 'opacity-50 hover:opacity-100' : ''}`}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center bg-amber-50 rounded-lg border border-amber-100 text-amber-700 font-bold tracking-tight">
                          {v.v_type.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 tracking-wide font-mono text-sm">{v.v_number}</p>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{v.v_name || 'Unnamed'} · {v.v_type}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services List */}
          <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-3 pt-5 px-6 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg"><Wrench className="h-5 w-5 text-amber-500" /> Service History <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{visibleServices.length}{visibleServices.length !== services.length && ` / ${services.length}`}</span></CardTitle>
              <div className="flex items-center gap-2">
                <Select value={serviceType} onValueChange={v => setServiceType(v as typeof serviceType)}>
                  <SelectTrigger size="sm" aria-label="Filter service type" className={FILTER_TRIGGER_CLASS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                    <SelectItem value="all" className={FILTER_ITEM_CLASS}>Both</SelectItem>
                    <SelectItem value="licence" className={FILTER_ITEM_CLASS}>Licence services</SelectItem>
                    <SelectItem value="vehicle" className={FILTER_ITEM_CLASS}>Vehicle services</SelectItem>
                  </SelectContent>
                </Select>
                <Link href={`/dashboard/services/new?customer=${customer.c_id}`}>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg border-slate-200 text-slate-600 text-xs font-semibold hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"><Plus className="h-3 w-3 mr-1" /> Add Record</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {services.length > 0 && (
                <div className="flex items-center justify-end border-b border-slate-100 bg-white px-4 py-2">
                  {serviceSearchOpen ? (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full focus-within:ring-2 focus-within:ring-amber-100 focus-within:border-amber-300 transition-all">
                      <Search className="h-4 w-4 text-slate-400 shrink-0" />
                      <input
                        autoFocus
                        aria-label="Search services"
                        placeholder="Search service, vehicle no., status..."
                        value={serviceQuery}
                        onChange={e => setServiceQuery(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Escape') { setServiceQuery(''); setServiceSearchOpen(false); } }}
                        className="bg-transparent border-none outline-none w-full text-sm text-slate-900 placeholder:text-slate-400"
                      />
                      <button type="button" aria-label="Close service search" onClick={() => { setServiceQuery(''); setServiceSearchOpen(false); }} className="text-slate-400 hover:text-slate-700 shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" size="icon" aria-label="Search services" title="Search services" onClick={() => setServiceSearchOpen(true)} className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200">
                      <Search className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
              {selectedVehicle && (
                <div className="flex items-center justify-between gap-2 border-b border-amber-100 bg-amber-50/60 px-4 py-2 text-xs text-amber-800">
                  <span>
                    {serviceType === 'licence'
                      ? 'Licence services are not tied to a vehicle — showing all of them.'
                      : <>Showing services for <span className="font-mono font-bold">{selectedVehicle.v_number}</span></>}
                  </span>
                  <button type="button" onClick={() => setSelectedVehicleId(null)} className="shrink-0 font-semibold underline hover:text-amber-950">Clear vehicle</button>
                </div>
              )}
              {visibleServices.length === 0 ? (
                <div className="p-8 text-center bg-white">
                 <Wrench className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                 <p className="text-sm text-slate-500 font-medium">{services.length === 0 ? 'No services recorded' : 'No services match this filter'}</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="py-3 px-4 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">Service</th>
                        <th className="py-3 px-4 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">Vehicle No.</th>
                        <th className="py-3 px-4 font-semibold text-slate-500 text-[11px] uppercase tracking-wider hidden sm:table-cell">Dates (Iss - Exp)</th>
                        <th className="py-3 px-4 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 font-semibold text-slate-500 text-[11px] uppercase tracking-wider text-right">Cost</th>
                        <th className="py-3 px-4 font-semibold text-slate-500 text-[11px] uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {visibleServices.map(s => (
                        <tr key={s.s_id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900">{s.service_name}</p>
                            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              s.category === 'vehicle' ? 'bg-amber-50 text-amber-700' : 'bg-violet-50 text-violet-700'
                            }`}>
                              {s.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-700">{s.vehicle_number || '—'}</td>
                          <td className="py-3 px-4 hidden sm:table-cell">
                            <p className="text-xs font-semibold text-slate-700">{format(new Date(s.issue_date), 'dd MMM yyyy')}</p>
                            <p className="text-xs text-slate-500">{s.expiry_date ? format(new Date(s.expiry_date), 'dd MMM yyyy') : 'No Expiry'}</p>
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={s.status} />
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">₹{Number(s.total_cost).toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={buildRenewUrl(s)}
                              title="Renew this service"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Link>
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
      </div>
    </div>
  );
}
