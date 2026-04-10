'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { customerApi, vehicleApi, serviceTypeApi, serviceApi } from '@/lib/api';
import type {
  CustomerDashboardView, Vehicle, ServiceType,
  VehicleClass, VehicleTypeLicence,
} from '@/lib/types';
import { Wrench, Loader2, Search, Check, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const VEHICLE_CLASSES: VehicleClass[] = ['NT', 'Transport', 'Conductor'];
const VEHICLE_TYPE_LICENCE: VehicleTypeLicence[] = [
  '3W-TR', 'Others', 'MCWOG', 'MCWG', 'LMV', 'TRACTOR',
  'FLIFT', 'LDRXCV', 'INVCGZ', 'TRANS', 'PSVBUS', 'CNEQP', 'LMV-TR', 'CONDUCTOR'
];

export default function NewServicePage() {
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customer');

  // State
  const [step, setStep] = useState(1); // 1=customer, 2=category, 3=details
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerDashboardView[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDashboardView | null>(null);
  const [category, setCategory] = useState<'vehicle' | 'licence' | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [serviceTypeId, setServiceTypeId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>('NT');
  const [vehicleTypeLicence, setVehicleTypeLicence] = useState<VehicleTypeLicence>('LMV');
  const [mdlNumber, setMdlNumber] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [notes, setNotes] = useState('');

  // Load preselected customer
  useEffect(() => {
    if (preselectedCustomerId) {
      customerApi.getByIdWithStats(preselectedCustomerId).then(c => {
        if (c) {
          setSelectedCustomer(c);
          setStep(2);
        }
      });
    }
  }, [preselectedCustomerId]);

  // Search customers
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await customerApi.search(query);
      setSearchResults(results);
    } catch (error) {
      console.error(error);
    }
    setSearching(false);
  }, []);

  // Select customer
  function selectCustomer(customer: CustomerDashboardView) {
    setSelectedCustomer(customer);
    setSearchResults([]);
    setSearchQuery('');
    setStep(2);
  }

  // Select category and load types + vehicles
  async function selectCategory(cat: 'vehicle' | 'licence') {
    setCategory(cat);
    try {
      const types = await serviceTypeApi.getByCategory(cat);
      setServiceTypes(types);
      if (cat === 'vehicle' && selectedCustomer) {
        const vehs = await vehicleApi.getByOwner(selectedCustomer.c_id);
        setCustomerVehicles(vehs);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load service types');
    }
    setStep(3);
  }

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer || !serviceTypeId) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      if (category === 'vehicle') {
        await serviceApi.createVehicleService({
          customer_id: selectedCustomer.c_id,
          service_type_id: serviceTypeId,
          vehicle_id: vehicleId || undefined,
          vehicle_type: vehicleType,
          vehicle_number: vehicleNumber,
          issue_date: issueDate,
          expiry_date: expiryDate || undefined,
          total_cost: Number(totalCost) || 0,
          notes: notes || undefined,
        });
      } else {
        await serviceApi.createLicenceService({
          customer_id: selectedCustomer.c_id,
          service_type_id: serviceTypeId,
          vehicle_class: vehicleClass,
          vehicle_type_licence: vehicleTypeLicence,
          mdl_number: mdlNumber || undefined,
          renewal_date: renewalDate || undefined,
          issue_date: issueDate,
          expiry_date: expiryDate || undefined,
          total_cost: Number(totalCost) || 0,
          notes: notes || undefined,
        });
      }
      toast.success('Service created successfully!');
      // Reset form
      setStep(1);
      setSelectedCustomer(null);
      setCategory(null);
      setServiceTypeId(null);
      setVehicleId(''); setVehicleType(''); setVehicleNumber('');
      setMdlNumber(''); setRenewalDate('');
      setExpiryDate(''); setTotalCost(''); setNotes('');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create service');
    }
    setSubmitting(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">New Service</h1>
        <p className="text-slate-500 mt-1">Provide a service to a customer</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: 'Customer' },
          { n: 2, label: 'Category' },
          { n: 3, label: 'Details' },
        ].map(s => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step > s.n ? 'bg-emerald-500 text-white' :
              step === s.n ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {step > s.n ? <Check className="h-4 w-4" /> : s.n}
            </div>
            <span className={`text-sm hidden sm:inline ${step >= s.n ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
              {s.label}
            </span>
            {s.n < 3 && <ChevronDown className="h-4 w-4 text-slate-300 rotate-[-90deg]" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Customer */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Customer</CardTitle>
            <CardDescription>Search by name or mobile number</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Type customer name or mobile..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            {searching && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>}
            {searchResults.length > 0 && (
              <div className="mt-3 border rounded-lg divide-y max-h-64 overflow-y-auto">
                {searchResults.map(c => (
                  <button
                    key={c.c_id}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                    onClick={() => selectCustomer(c)}
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold shrink-0">
                      {c.c_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{c.c_name}</p>
                      <p className="text-xs text-slate-500">{c.c_mobile} · {c.c_registration_id}</p>
                    </div>
                    <span className="text-xs text-slate-400">{c.service_count} services</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected customer banner */}
      {selectedCustomer && step >= 2 && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
            {selectedCustomer.c_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-900">{selectedCustomer.c_name}</p>
            <p className="text-xs text-slate-500">{selectedCustomer.c_mobile} · {selectedCustomer.c_registration_id}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setStep(1); setSelectedCustomer(null); setCategory(null); }}>
            Change
          </Button>
        </div>
      )}

      {/* Step 2: Select Category */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Service Category</CardTitle>
            <CardDescription>What type of service does the customer need?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                className="flex flex-col items-center gap-3 p-6 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                onClick={() => selectCategory('vehicle')}
              >
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Wrench className="h-7 w-7 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-900">Vehicle Service</p>
                  <p className="text-xs text-slate-500 mt-1">Fitness, Tax, Insurance, PUC, Permit, etc.</p>
                </div>
              </button>
              <button
                className="flex flex-col items-center gap-3 p-6 border-2 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
                onClick={() => selectCategory('licence')}
              >
                <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg className="h-7 w-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-900">Licence Service</p>
                  <p className="text-xs text-slate-500 mt-1">New DL, Learning Licence, Renewal, etc.</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Service Details */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{category === 'vehicle' ? 'Vehicle Service Details' : 'Licence Service Details'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Service Type */}
              <div>
                <label className="text-sm font-medium">Service Type <span className="text-red-500">*</span></label>
                <select
                  value={serviceTypeId || ''}
                  onChange={e => setServiceTypeId(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                  required
                >
                  <option value="">Select service...</option>
                  {serviceTypes.map(t => (
                    <option key={t.st_id} value={t.st_id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Vehicle Service Fields */}
              {category === 'vehicle' && (
                <>
                  {customerVehicles.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Select Vehicle</label>
                      <select
                        value={vehicleId}
                        onChange={e => {
                          const v = customerVehicles.find(v => v.v_id === e.target.value);
                          setVehicleId(e.target.value);
                          if (v) { setVehicleNumber(v.v_number); setVehicleType(v.v_type); }
                        }}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                      >
                        <option value="">— Enter manually —</option>
                        {customerVehicles.map(v => (
                          <option key={v.v_id} value={v.v_id}>{v.v_number} ({v.v_name || v.v_type})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Vehicle Type <span className="text-red-500">*</span></label>
                      <Input value={vehicleType} onChange={e => setVehicleType(e.target.value)} placeholder="e.g. car, bike, truck" required className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Vehicle Number <span className="text-red-500">*</span></label>
                      <Input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value.toUpperCase())} placeholder="MH12AB1234" required className="mt-1" />
                    </div>
                  </div>
                </>
              )}

              {/* Licence Service Fields */}
              {category === 'licence' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Vehicle Class <span className="text-red-500">*</span></label>
                      <select
                        value={vehicleClass}
                        onChange={e => setVehicleClass(e.target.value as VehicleClass)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                        required
                      >
                        {VEHICLE_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Vehicle Type <span className="text-red-500">*</span></label>
                      <select
                        value={vehicleTypeLicence}
                        onChange={e => setVehicleTypeLicence(e.target.value as VehicleTypeLicence)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                        required
                      >
                        {VEHICLE_TYPE_LICENCE.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">MDL Number</label>
                      <Input value={mdlNumber} onChange={e => setMdlNumber(e.target.value)} placeholder="MDL number" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Renewal Date</label>
                      <Input type="date" value={renewalDate} onChange={e => setRenewalDate(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </>
              )}

              {/* Common Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Service Issued Date <span className="text-red-500">*</span></label>
                  <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Service Expiry Date</label>
                  <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Total Cost (₹) <span className="text-red-500">*</span></label>
                <Input
                  type="number"
                  value={totalCost}
                  onChange={e => setTotalCost(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." className="mt-1" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-12" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Creating...</> : <><Wrench className="h-5 w-5 mr-2" /> Create Service</>}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setStep(2); setCategory(null); }}>
                  Back
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
