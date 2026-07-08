'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { customerApi, vehicleApi, serviceTypeApi, serviceApi } from '@/lib/api';
import type {
  CustomerDashboardView, Vehicle, ServiceType,
  VehicleClass, VehicleTypeLicence,
} from '@/lib/types';
import { Wrench, Loader2, Search, Check, ChevronDown, User, Car, FileText } from 'lucide-react';
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
  const [vehicleName, setVehicleName] = useState(''); // new: capture vehicle name for auto-add
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>('NT');
  const [vehicleTypeLicence, setVehicleTypeLicence] = useState<VehicleTypeLicence>('LMV');
  const [mdlNumber, setMdlNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [notes, setNotes] = useState('');

  // Load preselected customer
  useEffect(() => {
    if (!preselectedCustomerId) return;
    const controller = new AbortController();
    customerApi.getByIdWithStats(preselectedCustomerId).then(c => {
      if (!controller.signal.aborted && c) {
        setSelectedCustomer(c);
        setStep(2);
      }
    }).catch(() => {});
    return () => controller.abort();
  }, [preselectedCustomerId]);

  // Search customers with debounce and abort cleanup
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
      // Ignore aborted requests silently
      if (error instanceof Error && error.message !== 'AbortError') {
        console.error(error);
      }
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

  function resetForm() {
    setStep(1);
    setSelectedCustomer(null);
    setCategory(null);
    setServiceTypeId(null);
    setVehicleId(''); setVehicleType(''); setVehicleNumber(''); setVehicleName('');
    setMdlNumber('');
    setExpiryDate(''); setTotalCost(''); setNotes('');
    setIssueDate(new Date().toISOString().split('T')[0]);
  }

  // Validate cost string is a clean integer or decimal
  function parseCost(raw: string): number {
    // Remove any non-numeric characters except decimal point
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer || !serviceTypeId) {
      toast.error('Please fill all required fields');
      return;
    }
    const cost = parseCost(totalCost);
    if (cost <= 0) {
      toast.error('Please enter a valid service cost');
      return;
    }
    setSubmitting(true);
    try {
      if (category === 'vehicle') {
        // Issue 1 Fix: If no existing vehicle was selected (manual entry) and vehicle number is provided,
        // auto-create the vehicle record under this customer BEFORE creating the service.
        let resolvedVehicleId = vehicleId || undefined;
        if (!vehicleId && vehicleNumber.trim() && selectedCustomer) {
          try {
            const newVehicle = await vehicleApi.create({
              owner_id: selectedCustomer.c_id,
              v_number: vehicleNumber.trim().toUpperCase(),
              v_name: vehicleName.trim() || undefined,
              v_type: vehicleType.trim() || 'car',
            });
            resolvedVehicleId = newVehicle.v_id;
          } catch (vErr) {
            // If vehicle already exists (duplicate number), that's OK - proceed without vehicle_id
            console.warn('Vehicle auto-add skipped:', vErr);
          }
        }

        await serviceApi.createVehicleService({
          customer_id: selectedCustomer.c_id,
          service_type_id: serviceTypeId,
          vehicle_id: resolvedVehicleId,
          vehicle_type: vehicleType,
          vehicle_number: vehicleNumber,
          issue_date: issueDate,
          expiry_date: expiryDate || undefined,
          total_cost: cost,
          notes: notes || undefined,
        });
      } else {
        // Issue 2 Fix: renewal_date removed — expiry_date serves as the single renewal/expiry date
        await serviceApi.createLicenceService({
          customer_id: selectedCustomer.c_id,
          service_type_id: serviceTypeId,
          vehicle_class: vehicleClass,
          vehicle_type_licence: vehicleTypeLicence,
          mdl_number: mdlNumber || undefined,
          issue_date: issueDate,
          expiry_date: expiryDate || undefined,
          total_cost: cost,
          notes: notes || undefined,
        });
      }
      toast.success('Service created successfully!');
      resetForm();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create service');
    }
    setSubmitting(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">New Service</h1>
        <p className="text-slate-500 mt-1 font-medium">Issue a new service to a customer</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 max-w-full overflow-hidden">
        {[
          { n: 1, label: 'Customer' },
          { n: 2, label: 'Category' },
          { n: 3, label: 'Details' },
        ].map(s => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-colors ${
              step > s.n ? 'bg-amber-500 text-black border border-amber-600' :
              step === s.n ? 'bg-amber-400 text-black border border-amber-500' : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              {step > s.n ? <Check className="h-4 w-4" /> : s.n}
            </div>
            <span className={`text-sm hidden sm:inline ${step >= s.n ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
              {s.label}
            </span>
            {s.n < 3 && <ChevronDown className="h-4 w-4 text-slate-300 rotate-[-90deg] mx-1" />}
          </div>
        ))}
      </div>

      {/* Selected customer banner */}
      {selectedCustomer && step >= 2 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold border border-amber-200 shadow-sm">
              {selectedCustomer.c_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-900">{selectedCustomer.c_name}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{selectedCustomer.c_mobile} · {selectedCustomer.c_registration_id}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-amber-600 hover:text-amber-700 hover:bg-amber-100 rounded-lg" onClick={() => { setStep(1); setSelectedCustomer(null); setCategory(null); }}>
            Change Customer
          </Button>
        </div>
      )}

      {/* Step 1: Select Customer */}
      {step === 1 && (
        <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-purple-600" /> Select Customer</CardTitle>
            <CardDescription>Search by name or mobile number</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-slate-50/30">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Type customer name or mobile..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                className="pl-12 h-12 rounded-xl border-slate-200 focus-visible:ring-amber-200 text-base"
                autoFocus
              />
            </div>
            {searching && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-amber-600" /></div>}
            {searchResults.length > 0 && (
              <div className="mt-4 border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-72 overflow-y-auto bg-white shadow-sm overflow-hidden">
                {searchResults.map(c => (
                  <button
                    key={c.c_id}
                    className="w-full flex items-center justify-between p-4 hover:bg-purple-50/50 transition-colors text-left group"
                    onClick={() => selectCustomer(c)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 group-hover:bg-purple-100 flex items-center justify-center text-slate-600 group-hover:text-purple-700 font-bold border border-slate-200 transition-colors">
                        {c.c_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-purple-900">{c.c_name}</p>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">{c.c_mobile}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider group-hover:bg-white border border-transparent group-hover:border-purple-200">
                         {c.service_count} services
                       </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Category */}
      {step === 2 && (
        <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5 px-6">
            <CardTitle className="text-lg">Service Category</CardTitle>
            <CardDescription>What type of service does the customer need?</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-slate-50/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                className="flex flex-col items-center justify-center gap-4 p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-amber-400 hover:shadow-md transition-all group"
                onClick={() => selectCategory('vehicle')}
              >
                <div className="h-16 w-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center group-hover:bg-amber-100 group-hover:scale-110 transition-all">
                  <Car className="h-8 w-8 text-amber-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900 text-lg">Vehicle Service</p>
                  <p className="text-sm font-medium text-slate-500 mt-1">Fitness, Tax, PUC, Permit, etc.</p>
                </div>
              </button>

              <button
                className="flex flex-col items-center justify-center gap-4 p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-amber-400 hover:shadow-md transition-all group"
                onClick={() => selectCategory('licence')}
              >
                <div className="h-16 w-16 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center group-hover:bg-violet-100 group-hover:scale-110 transition-all">
                  <FileText className="h-8 w-8 text-violet-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900 text-lg">Licence Service</p>
                  <p className="text-sm font-medium text-slate-500 mt-1">New DL, Learning, Renewal, etc.</p>
                </div>
              </button>
            </div>
            
            <div className="mt-6 flex justify-start">
               <Button variant="outline" onClick={() => { setStep(1); setSelectedCustomer(null); }} className="rounded-xl font-medium">Back to Customer Search</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Service Details */}
      {step === 3 && (
        <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              {category === 'vehicle' ? <Car className="h-5 w-5 text-indigo-600" /> : <FileText className="h-5 w-5 text-purple-600" />}
              {category === 'vehicle' ? 'Vehicle Service Details' : 'Licence Service Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-slate-50/30">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Type */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Service Type <span className="text-red-500">*</span></label>
                <select
                  value={serviceTypeId || ''}
                  onChange={e => setServiceTypeId(Number(e.target.value))}
                  className="flex h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-200 font-medium"
                  required
                >
                  <option value="">Select a specific service...</option>
                  {serviceTypes.map(t => (
                    <option key={t.st_id} value={t.st_id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
                {/* Vehicle Service Fields */}
                {category === 'vehicle' && (
                  <>
                    {customerVehicles.length > 0 && (
                      <div>
                        <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Select Customer&apos;s Existing Vehicle</label>
                        <select
                          value={vehicleId}
                          onChange={e => {
                            const v = customerVehicles.find(v => v.v_id === e.target.value);
                            setVehicleId(e.target.value);
                            if (v) { setVehicleNumber(v.v_number); setVehicleType(v.v_type); setVehicleName(v.v_name || ''); }
                            else { setVehicleNumber(''); setVehicleType(''); setVehicleName(''); }
                          }}
                          className="flex h-11 w-full rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-1 text-sm mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 font-medium"
                        >
                          <option value="">— Enter details manually (will be saved to customer) —</option>
                          {customerVehicles.map(v => (
                            <option key={v.v_id} value={v.v_id}>{v.v_number} ({v.v_name || v.v_type})</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                      <div>
                        <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Vehicle Number <span className="text-red-500">*</span></label>
                        <Input 
                          value={vehicleNumber} 
                          onChange={e => setVehicleNumber(e.target.value.toUpperCase())} 
                          placeholder="MH12AB1234" 
                          required 
                          readOnly={!!vehicleId}
                          className={`mt-2 h-11 rounded-lg uppercase focus-visible:ring-indigo-200 ${vehicleId ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'}`} 
                        />
                      </div>
                      <div>
                        <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Vehicle Type <span className="text-red-500">*</span></label>
                        <Input 
                          value={vehicleType} 
                          onChange={e => setVehicleType(e.target.value)} 
                          placeholder="e.g. car, bike, truck" 
                          required 
                          readOnly={!!vehicleId}
                          className={`mt-2 h-11 rounded-lg focus-visible:ring-indigo-200 ${vehicleId ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'}`}
                        />
                      </div>
                    </div>
                    {/* Only show vehicle name when entering manually */}
                    {!vehicleId && (
                      <div>
                        <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Vehicle Name <span className="text-slate-400 normal-case font-normal">(optional — will be saved to customer profile)</span></label>
                        <Input
                          value={vehicleName}
                          onChange={e => setVehicleName(e.target.value)}
                          placeholder="e.g. Swift, Pulsar, Activa"
                          className="mt-2 h-11 bg-slate-50 rounded-lg focus-visible:ring-indigo-200"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Licence Service Fields — Issue 2 Fix: Removed renewal_date, only expiry_date */}
                {category === 'licence' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Vehicle Class <span className="text-red-500">*</span></label>
                        <select
                          value={vehicleClass}
                          onChange={e => setVehicleClass(e.target.value as VehicleClass)}
                          className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-200"
                          required
                        >
                          {VEHICLE_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Licence Type <span className="text-red-500">*</span></label>
                        <select
                          value={vehicleTypeLicence}
                          onChange={e => setVehicleTypeLicence(e.target.value as VehicleTypeLicence)}
                          className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-200"
                          required
                        >
                          {VEHICLE_TYPE_LICENCE.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">MDL / Application Number</label>
                      <Input value={mdlNumber} onChange={e => setMdlNumber(e.target.value)} placeholder="Enter MDL or application number" className="mt-2 h-11 bg-slate-50 rounded-lg focus-visible:ring-purple-200" />
                    </div>
                  </>
                )}
              </div>

              {/* Common Fields */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Issue Date <span className="text-red-500">*</span></label>
                    <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required className="mt-2 h-11 bg-slate-50 rounded-lg focus-visible:ring-purple-200" />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">
                      {category === 'licence' ? 'Renewal / Expiry Date' : 'Expiry Date'}
                    </label>
                    <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-2 h-11 bg-slate-50 rounded-lg focus-visible:ring-purple-200" />
                  </div>
                </div>
                
                {/* Issue 5 Fix: Use text input with inputmode=numeric to prevent browser spinners causing float drift */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Total Cost (₹) <span className="text-red-500">*</span></label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={totalCost}
                      onChange={e => {
                        // Only allow digits and a single decimal point
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        const parts = val.split('.');
                        if (parts.length <= 2) setTotalCost(parts.length === 2 ? parts[0] + '.' + parts[1].slice(0, 2) : val);
                      }}
                      placeholder="0"
                      required
                      className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-4 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent tracking-wider"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Notes & Comments</label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes for this service..." className="mt-2 h-11 bg-slate-50 rounded-lg focus-visible:ring-purple-200" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black rounded-2xl h-14 text-base font-bold shadow-md tracking-wide" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Creating Record...</> : <><Check className="h-6 w-6 mr-2" /> Confirm & Create Service</>}
                </Button>
                <Button type="button" variant="outline" className="h-14 px-8 rounded-2xl font-bold bg-white" onClick={() => { setStep(2); setCategory(null); }}>
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
