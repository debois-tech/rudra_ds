'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { vehicleApi, serviceApi, renewalDates } from '@/lib/api';
import type { CustomerDashboardView, Vehicle, ServiceType, ServiceOverview, VehicleClass, VehicleTypeLicence } from '@/lib/types';
import { Loader2, Car, FileText, Check, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { toast } from 'sonner';
import { getErrorMessage, logClientError } from '@/lib/error-message';
import { smoothReveal } from '@/lib/utils';
import { ExpiredMatchCard } from './expired-match-card';

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

// Same rule as the dashboard Expired list: date passed, and not already
// renewed (completed) or voided (cancelled).
const isLapsed = (s: ServiceOverview) =>
  !!s.expiry_date && s.expiry_date < today() && (s.status === 'active' || s.status === 'expired');

// Validate cost string is a clean integer or decimal
function parseCost(raw: string): number {
  const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

const SELECT_CLASS = 'flex w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-not-allowed';
const LABEL_CLASS = 'text-[11px] uppercase font-bold tracking-wider text-slate-500';

interface Props {
  customer: CustomerDashboardView;
  category: Category;
  serviceTypes: ServiceType[];
  vehicles: Vehicle[];
  // The customer's existing services — source of the "this one expired, renew it?" match.
  services: ServiceOverview[];
  initial?: FormInitial;
  // Set only for the first form of a URL renewal (Renew button elsewhere): the old service to mark completed.
  renewal?: { id: string; oldStatus: string | null };
  onSaved: (added: AddedService, newVehicle?: Vehicle, renewedId?: string) => void;
  onChangeCategory: () => void;
  onBack: () => void;
  onDirty: () => void;
}

// One service form. The page remounts it (new key) after every save, so each
// service starts from a clean slate without a pile of reset code.
//
// Vehicle: vehicle -> service type -> (expired match?) -> dates & cost.
// Licence: (expired matches?) -> licence details -> dates & cost.
// Cards appear as the previous one is filled in.
export function ServiceFormCard({ customer, category, serviceTypes, vehicles, services, initial, renewal, onSaved, onChangeCategory, onBack, onDirty }: Props) {
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
  const formRef = useRef<HTMLFormElement>(null);
  const matchRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);

  // ── Expired-match step ────────────────────────────────────────────────
  // `decision` remembers what the owner chose for ONE vehicle+type (or the
  // licence list): renew a specific old service, or skip it. Change the car or
  // type and the key changes, so the question is asked again.
  const plate = vehicleNumber.trim().toUpperCase();
  const vehicleChosen = category === 'licence' || !!vehicleId || (!!plate && !!vehicleType.trim());
  const key = category === 'licence' ? 'licence' : `${vehicleId || plate}|${serviceTypeId}`;
  const [decision, setDecision] = useState<{ key: string; renew: ServiceOverview | null } | null>(null);
  const decided = decision?.key === key;
  const renewing = decided ? decision.renew : null;

  const matches = (() => {
    if (renewal || !vehicleChosen) return []; // URL renewal already knows what it renews
    if (category === 'vehicle' && !serviceTypeId) return [];
    return services
      .filter(s => s.category === category && isLapsed(s) && (category === 'licence' || (
        s.service_type_id === serviceTypeId && ((!!vehicleId && s.vehicle_id === vehicleId) || (!!plate && s.vehicle_number?.toUpperCase() === plate))
      )))
      .sort((a, b) => b.expiry_date!.localeCompare(a.expiry_date!)); // newest expiry first
  })();
  const needsDecision = matches.length > 0 && !decided;
  const showTypeCard = category === 'licence' ? !needsDecision : vehicleChosen;
  const showDates = showTypeCard && !!serviceTypeId && !needsDecision;
  const activeRenewal = renewing ? { id: renewing.s_id, oldStatus: renewing.status } : renewal;

  function renew(m: ServiceOverview) {
    const d = renewalDates(m);
    setDecision({ key, renew: m });
    setServiceTypeId(m.service_type_id);
    if (category === 'licence') {
      setVehicleClass(m.vehicle_class || 'NT');
      setVehicleTypeLicence(m.vehicle_type_licence || 'LMV');
      setMdlNumber(m.mdl_number || '');
    }
    setIssueDate(d.issueDate);
    setExpiryDate(d.expiryDate);
    setTotalCost(String(m.total_cost));
    onDirty();
  }

  // "Switch to new service": drop the prefill and unlock.
  function undoRenewal() {
    setDecision({ key, renew: null });
    setVehicleClass('NT');
    setVehicleTypeLicence('LMV');
    setMdlNumber('');
    setIssueDate(today());
    setExpiryDate('');
    setTotalCost('');
  }

  // Cursor on the first field without letting focus() yank the scroll
  // (the page is already easing this card into view).
  useEffect(() => { formRef.current?.querySelector<HTMLElement>('select, input')?.focus({ preventScroll: true }); }, []);

  // Ease newly revealed cards into view (not on first mount).
  const shown = useRef({ match: needsDecision, dates: showDates });
  useEffect(() => {
    if (needsDecision && !shown.current.match) smoothReveal(matchRef.current, 'nearest');
    if (showDates && !shown.current.dates) smoothReveal(datesRef.current, 'nearest');
    shown.current = { match: needsDecision, dates: showDates };
  }, [needsDecision, showDates]);

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
      let created: { s_id: string };
      if (category === 'vehicle') {
        // No vehicle picked but a plate typed (or an unlinked old service being
        // renewed): link to the customer's existing vehicle with that plate
        // instead of inserting a duplicate. A renewal never creates a vehicle —
        // the plate stays on the service row; a manual add saves the new vehicle
        // BEFORE the service so it shows up in the dropdown for the next one.
        let resolvedVehicleId = vehicleId || undefined;
        const existing = !vehicleId && plate ? vehicles.find(v => v.v_number.toUpperCase() === plate) : undefined;
        if (existing) {
          resolvedVehicleId = existing.v_id;
        } else if (!vehicleId && plate && !activeRenewal) {
          try {
            newVehicle = await vehicleApi.create({
              owner_id: customer.c_id,
              v_number: plate,
              v_name: vehicleName.trim() || undefined,
              v_type: vehicleType.trim() || 'car',
            });
            resolvedVehicleId = newVehicle.v_id;
          } catch (vErr) {
            // Duplicate plate is fine — proceed without a vehicle_id.
            console.warn('Vehicle auto-add skipped:', vErr);
          }
        }
        created = await serviceApi.createVehicleService({
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
        created = await serviceApi.createLicenceService({
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
      let renewedId: string | undefined;
      if (activeRenewal && (activeRenewal.oldStatus === 'active' || activeRenewal.oldStatus === 'expired')) {
        try { await serviceApi.updateStatus(activeRenewal.id, 'completed'); renewedId = activeRenewal.id; }
        catch (error) { console.warn('Could not update renewed service status:', error); }
      }

      const name = serviceTypes.find(t => t.st_id === serviceTypeId)?.name || 'Service';
      toast.success(activeRenewal ? 'Service renewed successfully!' : `${name} added`);
      onSaved({
        id: created.s_id,
        category,
        name,
        detail: category === 'vehicle'
          ? vehicleNumber
          : [vehicleClass, vehicleTypeLicence, mdlNumber].filter(Boolean).join(' · '),
        issueDate,
        expiryDate: expiryDate || null,
        cost,
      }, newVehicle, renewedId);
    } catch (error: unknown) {
      logClientError(category === 'vehicle' ? 'create-vehicle-service' : 'create-document-service', error, { customerId: customer.c_id, serviceTypeId, form: category });
      toast.error(getErrorMessage(error, 'Could not create service.'));
      setSubmitting(false);
      submitLock.current = false;
    }
  }

  const typeCard = (
    <div className="stack-in bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <label className={LABEL_CLASS}>Service Type <span className="text-red-500">*</span></label>
      <select
        value={serviceTypeId || ''}
        onChange={e => setServiceTypeId(Number(e.target.value))}
        disabled={!!renewing}
        className={`${SELECT_CLASS} h-12 font-medium`}
        required
      >
        <option value="">Select a specific service...</option>
        {serviceTypes.map(t => (
          <option key={t.st_id} value={t.st_id}>{t.name}</option>
        ))}
      </select>
    </div>
  );

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
        <form ref={formRef} onSubmit={handleSubmit} onChange={onDirty} className="space-y-6">
          {/* Licence: expired services come first. */}
          {category === 'licence' && needsDecision && (
            <ExpiredMatchCard ref={matchRef} matches={matches} onRenew={renew} onSkip={() => setDecision({ key, renew: null })} />
          )}

          {/* Vehicle first, then service type. Both lock once a renewal is picked. */}
          <fieldset disabled={!!renewing} className="m-0 min-w-0 space-y-6 border-0 p-0">
            {category === 'vehicle' && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
                {vehicles.length > 0 && (
                  <div>
                    <label className={LABEL_CLASS}>Select Customer&apos;s Existing Vehicle</label>
                    <select
                      value={vehicleId}
                      onChange={e => {
                        const v = vehicles.find(v => v.v_id === e.target.value);
                        setVehicleId(e.target.value);
                        if (v) { setVehicleNumber(v.v_number); setVehicleType(v.v_type); setVehicleName(v.v_name || ''); }
                        else { setVehicleNumber(''); setVehicleType(''); setVehicleName(''); }
                      }}
                      className={`${SELECT_CLASS} h-11 font-medium`}
                    >
                      <option value="">— Enter details manually (will be saved to customer) —</option>
                      {vehicles.map(v => (
                        <option key={v.v_id} value={v.v_id}>{v.v_number} ({v.v_name || v.v_type})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={LABEL_CLASS}>Vehicle Number <span className="text-red-500">*</span></label>
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
                    <label className={LABEL_CLASS}>Vehicle Type <span className="text-red-500">*</span></label>
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
                    <label className={LABEL_CLASS}>Vehicle Name <span className="text-slate-400 normal-case font-normal">(optional — will be saved to customer profile)</span></label>
                    <Input
                      value={vehicleName}
                      onChange={e => setVehicleName(e.target.value)}
                      placeholder="e.g. Swift, Pulsar, Activa"
                      className="mt-2 h-11 bg-slate-50 rounded-lg focus-visible:ring-amber-200"
                    />
                  </div>
                )}
              </div>
            )}

            {showTypeCard && typeCard}

          </fieldset>

          {/* Licence details stay editable on a renewal (class/type can legitimately change). */}
          {category === 'licence' && showTypeCard && (
            <div className="stack-in bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={LABEL_CLASS}>Vehicle Class <span className="text-red-500">*</span></label>
                  <select value={vehicleClass} onChange={e => setVehicleClass(e.target.value as VehicleClass)} className={`${SELECT_CLASS} h-11`} required>
                    {VEHICLE_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Licence Type <span className="text-red-500">*</span></label>
                  <select value={vehicleTypeLicence} onChange={e => setVehicleTypeLicence(e.target.value as VehicleTypeLicence)} className={`${SELECT_CLASS} h-11`} required>
                    {VEHICLE_TYPE_LICENCE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>MDL / Application Number</label>
                <Input value={mdlNumber} onChange={e => setMdlNumber(e.target.value)} placeholder="Enter MDL or application number" className="mt-2 h-11 bg-slate-50 rounded-lg focus-visible:ring-amber-200" />
              </div>
            </div>
          )}

          {/* Vehicle: expired matches for this car + type. */}
          {category === 'vehicle' && needsDecision && (
            <ExpiredMatchCard ref={matchRef} matches={matches} onRenew={renew} onSkip={() => setDecision({ key, renew: null })} />
          )}

          {renewing && (
            <div className="stack-in flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
              <p className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                <RefreshCw className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                <span className="truncate">Renewing <b className="font-semibold text-slate-900">{renewing.service_name}</b> · expired {format(new Date(renewing.expiry_date!), 'dd MMM yyyy')}</span>
              </p>
              <button type="button" onClick={undoRenewal} className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-[background-color,transform] duration-150 hover:bg-white active:scale-[0.97]">
                Switch to new service
              </button>
            </div>
          )}

          {/* Dates, cost, notes — after the owner has dealt with any expired match. */}
          {showDates && (
            <div ref={datesRef} className="stack-in bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={LABEL_CLASS}>Issue Date <span className="text-red-500">*</span></label>
                  <DateTimePicker value={issueDate} onChange={setIssueDate} required className="mt-2" />
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    {category === 'licence' ? 'Renewal / Expiry Date' : 'Expiry Date'}
                  </label>
                  <DateTimePicker value={expiryDate} onChange={setExpiryDate} className="mt-2" />
                </div>
              </div>

              {/* Text input with inputmode=numeric prevents browser spinners causing float drift */}
              <div className="pt-2 border-t border-slate-100">
                <label className={LABEL_CLASS}>Total Cost (₹) <span className="text-red-500">*</span></label>
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
                <label className={LABEL_CLASS}>Notes & Comments</label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes for this service..." className="mt-2 h-11 bg-slate-50 rounded-lg focus-visible:ring-amber-200" />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {showDates && (
              <Button type="submit" className="flex-1 min-w-[180px] bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-xl h-11 text-base font-bold shadow-md tracking-wide transition-[transform,background-color] duration-150 active:scale-[0.98]" disabled={submitting}>
                {submitting ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Creating Record...</> : <><Check className="h-5 w-5 mr-2" /> Confirm & Create</>}
              </Button>
            )}
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
