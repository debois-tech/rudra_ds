'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { customerApi, vehicleApi, serviceApi } from '@/lib/api';
import type { Customer, Vehicle, ServiceOverview } from '@/lib/types';
import { ArrowLeft, Edit2, Car, Wrench, Trash2, Loader2, Save, X, Plus } from 'lucide-react';
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
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!customer) {
    return <div className="text-center py-20 text-slate-500">Customer not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{customer.c_name}</h1>
            <p className="text-sm text-slate-500">ID: {customer.c_registration_id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/services?customer=${customer.c_id}`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Wrench className="h-4 w-4 mr-2" /> Give Service
            </Button>
          </Link>
          {!editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" /> Edit
            </Button>
          )}
        </div>
      </div>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input value={editForm.c_name} onChange={e => setEditForm({ ...editForm, c_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Mobile</label>
                  <Input value={editForm.c_mobile} onChange={e => setEditForm({ ...editForm, c_mobile: e.target.value })} maxLength={10} />
                </div>
                <div>
                  <label className="text-sm font-medium">WhatsApp</label>
                  <Input value={editForm.c_whatsapp} onChange={e => setEditForm({ ...editForm, c_whatsapp: e.target.value })} maxLength={10} />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={editForm.c_email} onChange={e => setEditForm({ ...editForm, c_email: e.target.value })} type="email" />
                </div>
                <div>
                  <label className="text-sm font-medium">Date of Birth</label>
                  <Input value={editForm.c_dob} onChange={e => setEditForm({ ...editForm, c_dob: e.target.value })} type="date" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Textarea value={editForm.c_address} onChange={e => setEditForm({ ...editForm, c_address: e.target.value })} rows={2} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-2" /> Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Mobile', value: customer.c_mobile },
                { label: 'WhatsApp', value: customer.c_whatsapp || '—' },
                { label: 'Email', value: customer.c_email || '—' },
                { label: 'Address', value: customer.c_address || '—' },
                { label: 'Date of Birth', value: customer.c_dob ? format(new Date(customer.c_dob), 'dd MMM yyyy') : '—' },
                { label: 'Joined', value: format(new Date(customer.created_at), 'dd MMM yyyy') },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{item.label}</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" /> Vehicles ({vehicles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No vehicles registered</p>
          ) : (
            <div className="grid gap-3">
              {vehicles.map(v => (
                <div key={v.v_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <div>
                    <p className="font-medium text-slate-900">{v.v_number}</p>
                    <p className="text-xs text-slate-500">{v.v_name || 'Unnamed'} · {v.v_type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> Services ({services.length})</CardTitle>
          <Link href={`/dashboard/services?customer=${customer.c_id}`}>
            <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> New Service</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No services yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Service</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Type</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Issued</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Expiry</th>
                    <th className="text-right py-2 px-3 font-medium text-slate-600">Cost</th>
                    <th className="text-center py-2 px-3 font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.s_id} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium">{s.service_name}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.category === 'vehicle' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {s.category === 'vehicle' ? 'Vehicle' : 'Licence'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">{format(new Date(s.issue_date), 'dd MMM yyyy')}</td>
                      <td className="py-2 px-3 text-slate-600">{s.expiry_date ? format(new Date(s.expiry_date), 'dd MMM yyyy') : '—'}</td>
                      <td className="py-2 px-3 text-right font-medium">₹{Number(s.total_cost).toLocaleString()}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                          s.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {s.status}
                        </span>
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