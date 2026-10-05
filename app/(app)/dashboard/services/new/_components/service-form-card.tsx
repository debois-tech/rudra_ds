'use client';

import { useEffect, useRef, useState } from 'react';
import { vehicleApi, serviceApi } from '@/lib/api';
import type { CustomerDashboardView, Vehicle, ServiceType, VehicleClass, VehicleTypeLicence } from '@/lib/types';
import { Loader2, Car, FileText, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { toast } from 'sonner';
import { getErrorMessage, logClientError } from '@/lib/error-message';

export type Category = 'vehicle' | 'licence';

// What the page keeps after a save — enough to render the ✓ summary row.
export interface AddedService {
  id: string;
  category: Category;
  name: string;
  detail: string;
  issueDate: string;
  expiryDate: string | null;
  cost: number;
}

// Renewal prefill (from buildRenewUrl's query params).
export interface FormInitial {
  serviceTypeId?: number;
  vehicleId?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  vehicleClass?: VehicleClass;
  vehicleTypeLicence?: VehicleTypeLicence;
  mdlNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  totalCost?: string;
}

const VEHICLE_CLASSES: VehicleClass[] = ['NT', 'Transport', 'Conductor'];
const VEHICLE_TYPE_LICENCE: VehicleTypeLicence[] = [
  '3W-TR', 'Others', 'MCWOG', 'MCWG', 'LMV', 'TRACTOR',
  'FLIFT', 'LDRXCV', 'INVCGZ', 'TRANS', 'PSVBUS', 'CNEQP', 'LMV-TR', 'CONDUCTOR'
];

const today = () => new Date().toISOString().split('T')[0];

// Validate cost string is a clean integer or decimal
function parseCost(raw: string): number {
  const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

interface Props {
  customer: CustomerDashboardView;
  category: Category;
  serviceTypes: ServiceType[];
  vehicles: Vehicle[];
  initial?: FormInitial;
  // Set only for the first form of a renewal: the old service to mark completed.
  renewal?: { id: string; oldStatus: string | null };
  onSaved: (added: AddedService, newVehicle?: Vehicle) => void;
  onChangeCategory: () => void;
  onBack: () => void;
  onDirty: () => void;
}

// One service form. The page remounts it (new key) after every save, so each
// service starts from a clean slate without a pile of reset code.
export function ServiceFormCard({ customer, category, serviceTypes, vehicles, initial, renewal, onSaved, onChangeCategory, onBack, onDirty }: Props) {
  // A single car on file is pre-selected; "enter manually" stays in the dropdown.
  const onlyVehicle = category === 'vehicle' && !initial?.vehicleNumber && vehicles.length === 1 ? vehicles[0] : null;

  const [serviceTypeId, setServiceTypeId] = useState<number | null>(initial?.serviceTypeId ?? null);
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId || onlyVehicle?.v_id || '');
  const [vehicleType, setVehicleType] = useState(initial?.vehicleType || onlyVehicle?.v_type || '');
  const [vehicleNumber, setVehicleNumber] = useState(initial?.vehicleNumber || onlyVehicle?.v_number || '');
  const [vehicleName, setVehicleName] = useState(onlyVehicle?.v_name || '');
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>(initial?.vehicleClass || 'NT');
  const [vehicleTypeLicence, setVehicleTypeLicence] = useState<VehicleTypeLicence>(initial?.vehicleTypeLicence || 'LMV');
  const [mdlNumber, setMdlNumber] = useState(initial?.mdlNumber || '');
  const [issueDate, setIssueDate] = useState(initial?.issueDate || today());
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate || '');
  const [totalCost, setTotalCost] = useState(initial?.totalCost || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const firstField = useRef<HTMLSelectElement>(null);

  // Land the cursor on the first field without letting focus() yank the scroll
  // (the page is already easing this card into view).
  useEffect(() => { firstField.current?.focus({ preventScroll: true }); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitLock.current) return;
    if (!serviceTypeId) {
      toast.error('Please fill all required fields');
      return;
    }
    const cost = parseCost(totalCost);
    if (cost <= 0) {
      toast.error('Please enter a valid service cost');
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    try {
      let newVehicle: Vehicle | undefined;
      if (category === 'vehicle') {
        // Manual entry: save the vehicle under this customer BEFORE the service,
        // so it shows up in the dropdown for the next service on this page.
        let resolvedVehicleId = vehicleId || undefined;
        if (!vehicleId && vehicleNumber.trim()) {
          try {
            newVehicle = await vehicleApi.create({
              owner_id: customer.c_id,
              v_number: vehicleNumber.trim().toUpperCase(),
              v_name: vehicleName.trim() || undefined,
              v_type: vehicleType.trim() || 'car',
            });
            resolvedVehicleId = newVehicle.v_id;
          } catch (vErr) {
            // Duplicate plate is fine — proceed without a vehicle_id.
            console.warn('Vehicle auto-add skipped:', vErr);
          }
        }
        await serviceApi.createVehicleService({
          customer_id: customer.c_id,
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
        await serviceApi.createLicenceService({
          customer_id: customer.c_id,
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

      // A renewal supersedes the old record — mark it completed if it was
      // 'active' or 'expired'. 'cancelled' stays: that's an explicit void.
      if (renewal && (renewal.oldStatus === 'active' || renewal.oldStatus === 'expired')) {
        try { await serviceApi.updateStatus(renewal.id, 'completed'); }
        catch (error) { console.warn('Could not update renewed service status:', error); }
      }

      const name = serviceTypes.find(t => t.st_id === serviceTypeId)?.name || 'Service';
      toast.success(renewal ? 'Service renewed successfully!' : `${name} added`);
      onSaved({
        id: crypto.randomUUID(),
        category,
        name,
        detail: category === 'vehicle'
          ? vehicleNumber
          : [vehicleClass, vehicleTypeLicence, mdlNumber].filter(Boolean).join(' · '),
        issueDate,
        expiryDate: expiryDate || null,
        cost,
      }, newVehicle);
    } catch (error: unknown) {
      logClientError(category === 'vehicle' ? 'create-vehicle-service' : 'create-document-service', error, { customerId: customer.c_id, serviceTypeId, form: category });
      toast.error(getErrorMessage(error, 'Could not create service.'));
      setSubmitting(false);
      submitLock.current = false;
    }
  }

  return (
    <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
      <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5 px-6">
        <CardTitle className="text-lg flex items-center gap-2">
          {category === 'vehicle' ? <Car className="h-5 w-5 text-amber-600" /> : <FileText className="h-5 w-5 text-violet-600" />}
          {category === 'vehicle' ? 'Vehicle Service Details' : 'Licence Service Details'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 bg-slate-50/30">
        {/* React's onChange bubbles from every input/select, so one handler marks the form dirty. */}
        <form onSubmit={handleSubmit} onChange={onDirty} className="space-y-6">
          {/* Service Type */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Service Type <span className="text-red-500">*</span></label>
            <select
              ref={firstField}
              value={serviceTypeId || ''}
              onChange={e => setServiceTypeId(Number(e.target.value))}
              className="flex h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 font-medium"
              required
            >
              <option value="">Select a specific service...</option>
              {serviceTypes.map(t => (
                <option key={t.st_id} value={t.st_id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
            {category === 'vehicle' && (
              <>
                {vehicles.length > 0 && (
                  <div>
                    <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Select Customer&apos;s Existing Vehicle</label>
                    <select
                      value={vehicleId}
                      onChange={e => {
                        const v = vehicles.find(v => v.v_id === e.target.value);
                        setVehicleId(e.target.value);
                        if (v) { setVehicleNumber(v.v_number); setVehicleType(v.v_type); setVehicleName(v.v_name || ''); }
                        else { setVehicleNumber(''); setVehicleType(''); setVehicleName(''); }
                      }}
                      className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 font-medium"
                    >
                      <option value="">— Enter details manually (will be saved to customer) —</option>
                      {vehicles.map(v => (
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
                      className={`mt-2 h-11 rounded-lg uppercase focus-visible:ring-amber-200 ${vehicleId ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'}`}
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
                      className={`mt-2 h-11 rounded-lg focus-visible:ring-amber-200 ${vehicleId ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'}`}
                    />
                  </div>
                </div>
                {!vehicleId && (
                  <div>
                    <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Vehicle Name <span className="text-slate-400 normal-case font-normal">(optional — will be saved to customer profile)</span></label>
                    <Input
                      value={vehicleName}
                      onChange={e => setVehicleName(e.target.value)}
                      placeholder="e.g. Swift, Pulsar, Activa"
                      className="mt-2 h-11 bg-slate-50 rounded-lg focus-visible:ring-amber-200"
                    />
                  </div>
                )}
              </>
            )}

            {category === 'licence' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Vehicle Class <span className="text-red-500">*</span></label>
                    <select
                      value={vehicleClass}
                      onChange={e => setVehicleClass(e.target.value as VehicleClass)}
                      className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
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
                      className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                      required
                    >
                      {VEHICLE_TYPE_LICENCE.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">MDL / Application Number</label>
                  <Input value={mdlNumber} onChange={e => setMdlNumber(e.target.value)} placeholder="Enter MDL or application number" className="mt-2 h-11 bg-slate-50 rounded-lg focus-visible:ring-amber-200" />
                </div>
              </>
            )}
          </div>

          {/* Common Fields */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Issue Date <span className="text-red-500">*</span></label>
                <DateTimePicker value={issueDate} onChange={setIssueDate} required className="mt-2" />
              </div>
              <div>
                <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">
                  {category === 'licence' ? 'Renewal / Expiry Date' : 'Expiry Date'}
                </label>
                <DateTimePicker value={expiryDate} onChange={setExpiryDate} className="mt-2" />
              </div>
            </div>

            {/* Text input with inputmode=numeric prevents browser spinners causing float drift */}
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
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes for this service..." className="mt-2 h-11 bg-slate-50 rounded-lg focus-visible:ring-amber-200" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" className="flex-1 min-w-[180px] bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-xl h-11 text-base font-bold shadow-md tracking-wide transition-[transform,background-color] duration-150 active:scale-[0.98]" disabled={submitting}>
              {submitting ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Creating Record...</> : <><Check className="h-5 w-5 mr-2" /> Confirm & Create</>}
            </Button>
            <Button type="button" variant="outline" disabled={submitting} className="h-11 px-5 rounded-xl font-semibold bg-white transition-transform duration-150 active:scale-[0.98]" onClick={onChangeCategory}>
              Change category
            </Button>
            <Button type="button" variant="ghost" disabled={submitting} className="h-11 px-5 rounded-xl font-semibold text-slate-600 transition-transform duration-150 active:scale-[0.98]" onClick={onBack}>
              Back
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
