'use client';

import { useEffect, useRef, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { vehicleApi, renewalDates } from '@/lib/api';
import type { CustomerDashboardView, Vehicle, ServiceType, ServiceOverview, VehicleClass, VehicleTypeLicence, CartItem } from '@/lib/types';
import { Loader2, Car, FileText, Check, RefreshCw, Plus, Lock, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { toast } from 'sonner';
import { getErrorMessage, logClientError } from '@/lib/error-message';

export type Category = 'vehicle' | 'licence';

export interface FormInitial {
  serviceTypeId?: number;
  vehicleId?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  vehicleName?: string;
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

function parseCost(raw: string): number {
  const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

const LABEL_CLASS = 'text-[11px] uppercase font-bold tracking-wider text-slate-500';

interface Props {
  customer: CustomerDashboardView;
  category: Category;
  serviceTypes: ServiceType[];
  vehicles: Vehicle[];
  services: ServiceOverview[];
  initial?: FormInitial;
  renewal?: { id: string; oldStatus: string | null };
  cart: CartItem[];
  onAddToCart: (item: CartItem) => void;
  onVehicleAdded?: (newVehicle: Vehicle) => void;
  onChangeCategory: () => void;
  onBack: () => void;
  onDirty: () => void;
}

export function ServiceFormCard({
  customer,
  category,
  serviceTypes,
  vehicles,
  services,
  initial,
  renewal,
  cart,
  onAddToCart,
  onVehicleAdded,
  onChangeCategory,
  onBack,
  onDirty,
}: Props) {
  const [localVehicles, setLocalVehicles] = useState<Vehicle[]>(vehicles);
  useEffect(() => { setLocalVehicles(vehicles); }, [vehicles]);
  const [addingVehicle, setAddingVehicle] = useState(false);

  // A single car on file is pre-selected
  const onlyVehicle = category === 'vehicle' && !initial?.vehicleNumber && vehicles.length === 1 ? vehicles[0] : null;

  const [vehicleId, setVehicleId] = useState(initial?.vehicleId || onlyVehicle?.v_id || '');
  const [vehicleType, setVehicleType] = useState(initial?.vehicleType || onlyVehicle?.v_type || '');
  const [vehicleNumber, setVehicleNumber] = useState(initial?.vehicleNumber || onlyVehicle?.v_number || '');
  const [vehicleName, setVehicleName] = useState(initial?.vehicleName || onlyVehicle?.v_name || '');

  // Active expanded service configuration
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const [formIssueDate, setFormIssueDate] = useState<string>(today());
  const [formExpiryDate, setFormExpiryDate] = useState<string>('');
  const [formCost, setFormCost] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formVehicleClass, setFormVehicleClass] = useState<VehicleClass>(initial?.vehicleClass || 'NT');
  const [formLicenceType, setFormLicenceType] = useState<VehicleTypeLicence>(initial?.vehicleTypeLicence || 'LMV');
  const [formMdlNumber, setFormMdlNumber] = useState<string>(initial?.mdlNumber || '');

  // Pre-expand if initial specified (e.g. renewal from overview)
  useEffect(() => {
    if (initial?.serviceTypeId) {
      setExpandedServiceId(initial.serviceTypeId);
      if (initial.issueDate) setFormIssueDate(initial.issueDate);
      if (initial.expiryDate) setFormExpiryDate(initial.expiryDate);
      if (initial.totalCost) setFormCost(initial.totalCost);
      if (initial.vehicleClass) setFormVehicleClass(initial.vehicleClass);
      if (initial.vehicleTypeLicence) setFormLicenceType(initial.vehicleTypeLicence);
      if (initial.mdlNumber) setFormMdlNumber(initial.mdlNumber);
    }
  }, [initial]);

  async function handleAddVehicle() {
    const plate = vehicleNumber.trim().toUpperCase();
    if (!plate) {
      toast.error('Please enter a vehicle number');
      return;
    }
    const type = vehicleType.trim() || 'car';
    const name = vehicleName.trim() || undefined;

    const existing = localVehicles.find(v => v.v_number.toUpperCase() === plate);
    if (existing) {
      setVehicleId(existing.v_id || '');
      setVehicleNumber(existing.v_number);
      setVehicleType(existing.v_type || 'car');
      setVehicleName(existing.v_name || '');
      toast.info(`Vehicle ${plate} is already registered — selected.`);
      onDirty();
      return;
    }

    setAddingVehicle(true);
    try {
      const created = await vehicleApi.create({
        owner_id: customer.c_id,
        v_number: plate,
        v_type: type,
        v_name: name,
      });
      toast.success(`Vehicle ${created.v_number} added!`);
      const updated = [created, ...localVehicles];
      setLocalVehicles(updated);
      onVehicleAdded?.(created);
      setVehicleId(created.v_id);
      setVehicleNumber(created.v_number);
      setVehicleType(created.v_type);
      setVehicleName(created.v_name || '');
      onDirty();
    } catch (err: unknown) {
      logClientError('add-vehicle-inline', err, { customerId: customer.c_id, plate });
      toast.error(getErrorMessage(err, 'Failed to add vehicle.'));
    } finally {
      setAddingVehicle(false);
    }
  }

  function handleToggleExpand(st: ServiceType, exists: boolean, existingRecord?: ServiceOverview, cartItem?: CartItem) {
    if (expandedServiceId === st.st_id) {
      setExpandedServiceId(null);
      return;
    }

    if (cartItem) {
      setFormIssueDate(cartItem.issueDate);
      setFormExpiryDate(cartItem.expiryDate);
      setFormCost(String(cartItem.totalCost));
      setFormNotes(cartItem.notes || '');
      if (category === 'licence') {
        setFormVehicleClass(cartItem.vehicleClass || 'NT');
        setFormLicenceType(cartItem.vehicleTypeLicence || 'LMV');
        setFormMdlNumber(cartItem.mdlNumber || '');
      }
    } else if (exists && existingRecord) {
      const d = renewalDates(existingRecord);
      setFormIssueDate(today());
      setFormExpiryDate(d.expiryDate || '');
      setFormCost(String(existingRecord.total_cost));
      setFormNotes('');
      if (category === 'licence') {
        setFormVehicleClass(existingRecord.vehicle_class || 'NT');
        setFormLicenceType(existingRecord.vehicle_type_licence || 'LMV');
        setFormMdlNumber(existingRecord.mdl_number || '');
      }
    } else {
      setFormIssueDate(today());
      setFormExpiryDate('');
      setFormCost('');
      setFormNotes('');
      if (category === 'licence') {
        setFormVehicleClass('NT');
        setFormLicenceType('LMV');
        setFormMdlNumber('');
      }
    }

    setExpandedServiceId(st.st_id);
  }

  function handleAddToCart(st: ServiceType, exists: boolean, existingRecord?: ServiceOverview) {
    const cost = parseCost(formCost);
    if (cost <= 0) {
      toast.error('Please enter a valid cost');
      return;
    }
    if (!formIssueDate) {
      toast.error('Please select an issue date');
      return;
    }

    const isRenewal = exists && !!existingRecord;
    const cartItemId = `st_${st.st_id}_${category === 'vehicle' ? (vehicleId || plate) : 'licence'}`;

    const item: CartItem = {
      id: cartItemId,
      serviceTypeId: st.st_id,
      serviceName: st.name,
      category,
      isRenewal,
      renewOfId: isRenewal ? existingRecord.s_id : (renewal ? renewal.id : undefined),
      renewOldStatus: isRenewal ? existingRecord.status : (renewal ? renewal.oldStatus : undefined),
      issueDate: formIssueDate,
      expiryDate: formExpiryDate,
      totalCost: cost,
      notes: formNotes.trim() || undefined,
      vehicleId: category === 'vehicle' ? (vehicleId || undefined) : undefined,
      vehicleNumber: category === 'vehicle' ? vehicleNumber : undefined,
      vehicleType: category === 'vehicle' ? vehicleType : undefined,
      vehicleName: category === 'vehicle' ? vehicleName : undefined,
      vehicleClass: category === 'licence' ? formVehicleClass : undefined,
      vehicleTypeLicence: category === 'licence' ? formLicenceType : undefined,
      mdlNumber: category === 'licence' ? formMdlNumber.trim() || undefined : undefined,
    };

    onAddToCart(item);
    setExpandedServiceId(null);
    onDirty();
  }

  const plate = vehicleNumber.trim().toUpperCase();
  const vehicleChosen = category === 'licence' || !!vehicleId;

  return (
    <div className="space-y-4">
      {/* ── CARD 1: Vehicles Card (or Licence info) ── */}
      <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 py-3.5 px-5">
          <CardTitle className="text-base flex items-center gap-2">
            {category === 'vehicle' ? <Car className="h-4.5 w-4.5 text-slate-700" /> : <FileText className="h-4.5 w-4.5 text-slate-700" />}
            <span>{category === 'vehicle' ? 'Vehicles' : 'Licence Details'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 bg-slate-50/30 space-y-4">
          {category === 'vehicle' && (
            <>
              {/* 1. Add New Vehicle / Selected Vehicle Section (Moved Above) */}
              <div className={`p-4 rounded-xl border shadow-xs space-y-3 transition-colors ${
                vehicleId ? 'bg-slate-100/60 border-slate-300' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      {vehicleId ? 'Selected Vehicle' : 'Add New Vehicle'}
                    </span>
                    {vehicleId ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200/80 text-slate-800 border border-slate-300">
                        <Check className="h-3 w-3 text-slate-700 stroke-[2.5]" /> Selected
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Enter plate, type, and name below</span>
                    )}
                  </div>
                  {vehicleId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setVehicleId('');
                        setVehicleNumber('');
                        setVehicleType('');
                        setVehicleName('');
                        onDirty();
                      }}
                      className="h-7 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    >
                      Change Vehicle
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className={LABEL_CLASS}>Vehicle Number <span className="text-red-500">*</span></label>
                      {vehicleId && (
                        <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" /> Locked
                        </span>
                      )}
                    </div>
                    <Input
                      value={vehicleNumber}
                      onChange={e => {
                        if (vehicleId) return;
                        setVehicleNumber(e.target.value.toUpperCase());
                      }}
                      placeholder="e.g. MH12AB1234"
                      required
                      readOnly={!!vehicleId}
                      className={`mt-1.5 h-10 rounded-lg uppercase font-semibold text-xs transition-colors ${
                        vehicleId
                          ? 'bg-slate-200/60 border-slate-300 text-slate-800 cursor-not-allowed select-none shadow-none ring-0 focus-visible:ring-0'
                          : 'bg-white border-slate-200 focus-visible:ring-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className={LABEL_CLASS}>Vehicle Type <span className="text-red-500">*</span></label>
                      {vehicleId && (
                        <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" /> Locked
                        </span>
                      )}
                    </div>
                    <Input
                      value={vehicleType}
                      onChange={e => {
                        if (vehicleId) return;
                        setVehicleType(e.target.value);
                      }}
                      placeholder="e.g. Car, Bike, Truck"
                      required
                      readOnly={!!vehicleId}
                      className={`mt-1.5 h-10 rounded-lg font-semibold text-xs transition-colors ${
                        vehicleId
                          ? 'bg-slate-200/60 border-slate-300 text-slate-800 cursor-not-allowed select-none shadow-none ring-0 focus-visible:ring-0'
                          : 'bg-white border-slate-200 focus-visible:ring-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className={LABEL_CLASS}>Vehicle Name <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
                      {vehicleId && (
                        <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" /> Locked
                        </span>
                      )}
                    </div>
                    <Input
                      value={vehicleName}
                      onChange={e => {
                        if (vehicleId) return;
                        setVehicleName(e.target.value);
                      }}
                      placeholder="e.g. Swift, Pulsar, Activa"
                      readOnly={!!vehicleId}
                      className={`mt-1.5 h-10 rounded-lg font-semibold text-xs transition-colors ${
                        vehicleId
                          ? 'bg-slate-200/60 border-slate-300 text-slate-800 cursor-not-allowed select-none shadow-none ring-0 focus-visible:ring-0'
                          : 'bg-white border-slate-200 focus-visible:ring-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {!vehicleId && (
                  <div className="flex items-center justify-end pt-1">
                    <Button
                      type="button"
                      disabled={addingVehicle || !vehicleNumber.trim()}
                      onClick={handleAddVehicle}
                      className="h-8 px-3.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      {addingVehicle ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 stroke-[2.5]" />}
                      <span>Add Vehicle</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* 2. Customer's Existing Vehicles (Positioned below Add/Selected vehicle) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Customer&apos;s Registered Vehicles:
                  </span>
                  {localVehicles.length > 0 && !vehicleId && (
                    <span className="text-[11px] text-slate-400 font-medium">Click a vehicle to select</span>
                  )}
                </div>

                {localVehicles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {localVehicles.map((v, idx) => {
                      const isSelected = vehicleId === v.v_id || (!vehicleId && vehicleNumber.trim() && v.v_number.toUpperCase() === vehicleNumber.trim().toUpperCase());
                      const displayName = v.v_name || v.v_type || 'Vehicle';
                      return (
                        <button
                          key={v.v_id || `${v.v_number}-${idx}`}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setVehicleId('');
                              setVehicleNumber('');
                              setVehicleType('');
                              setVehicleName('');
                            } else {
                              setVehicleId(v.v_id || '');
                              setVehicleNumber(v.v_number);
                              setVehicleType(v.v_type || 'car');
                              setVehicleName(v.v_name || '');
                            }
                            onDirty();
                          }}
                          className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-slate-200/90 text-slate-900 border-slate-400 shadow-xs ring-1 ring-slate-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                          }`}
                        >
                          <Car className={`h-3.5 w-3.5 ${isSelected ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'}`} />
                          <span className="font-mono font-bold tracking-tight">{v.v_number}</span>
                          <span className={isSelected ? 'text-slate-600 font-normal' : 'text-slate-400 font-normal'}>
                            ({displayName})
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 ml-0.5 text-slate-800 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No registered vehicles on record for this customer.</p>
                )}
              </div>
            </>
          )}

          {category === 'licence' && (
            <p className="text-xs text-slate-500 font-medium">Select a service below to configure licence service details.</p>
          )}
        </CardContent>
      </Card>

      {/* ── CARD 2: Services Card (Fitting on screen without extra scrolling, 2-column grid, tap to expand) ── */}
      {vehicleChosen && (
        <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 py-3.5 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-slate-700" />
                  <span>Services</span>
                </CardTitle>
                <p className="text-[11px] text-slate-400 mt-0.5">Tap any service to view or configure details</p>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                {serviceTypes.length} {serviceTypes.length === 1 ? 'service' : 'services'}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-4 bg-slate-50/30 space-y-3.5">
            {/* 2-Column Grid of Services */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {serviceTypes.map(st => {
                const existingRecord = services.find(s =>
                  s.service_type_id === st.st_id &&
                  (category === 'licence' || (
                    (vehicleId && s.vehicle_id === vehicleId) ||
                    (plate && s.vehicle_number?.toUpperCase() === plate)
                  ))
                );
                const cartItem = cart.find(c => c.serviceTypeId === st.st_id);
                const inCart = !!cartItem;
                const isExpanded = expandedServiceId === st.st_id;
                const exists = !!existingRecord;

                return (
                  <div
                    key={st.st_id}
                    onClick={() => handleToggleExpand(st, exists, existingRecord, cartItem)}
                    className={`rounded-xl border bg-white overflow-hidden shadow-2xs transition-all duration-150 cursor-pointer ${
                      isExpanded ? 'col-span-1 md:col-span-2 ring-1 ring-slate-300 border-slate-300' : ''
                    } ${
                      inCart
                        ? 'border-slate-300 bg-slate-50/50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
                    }`}
                  >
                    {/* Main Service Row (Tapping anywhere expands or collapses) */}
                    <div className="flex items-center justify-between p-3 gap-2.5">
                      {/* Left: Icon & Name */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          category === 'vehicle' ? 'bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {category === 'vehicle' ? <Car className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
                              {st.name}
                            </h4>
                            {inCart && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                                <Check className="h-2.5 w-2.5 stroke-[2.5]" /> In Cart
                              </span>
                            )}
                          </div>
                          {/* Previous Record Details */}
                          {exists && existingRecord ? (
                            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                              Exp: {existingRecord.expiry_date ? format(new Date(existingRecord.expiry_date), 'dd MMM yy') : 'None'} · ₹{existingRecord.total_cost}
                              {existingRecord.expiry_date && existingRecord.expiry_date < today() ? (
                                <span className="text-red-600 font-bold ml-1">· Overdue</span>
                              ) : (
                                <span className="text-emerald-700 font-semibold ml-1">· Active</span>
                              )}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic mt-0.5">No previous record</p>
                          )}
                        </div>
                      </div>

                      {/* Right: Action Button */}
                      <div className="shrink-0 flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        {inCart ? (
                          <button
                            type="button"
                            onClick={() => handleToggleExpand(st, exists, existingRecord, cartItem)}
                            className="h-8 px-3 rounded-lg border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                          >
                            In Cart
                          </button>
                        ) : exists ? (
                          <button
                            type="button"
                            onClick={() => handleToggleExpand(st, true, existingRecord)}
                            className="h-8 px-3 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Renew</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleExpand(st, false)}
                            className="h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <span>New</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanding Detail Filling Card (Minimized top gap & padding) */}
                    {isExpanded && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="border-t border-slate-200 bg-slate-50/70 p-3 space-y-2.5 cursor-default"
                      >
                        {/* Licence specific fields */}
                        {category === 'licence' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                                Vehicle Class <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={formVehicleClass}
                                onChange={e => setFormVehicleClass(e.target.value as VehicleClass)}
                                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none"
                              >
                                {VEHICLE_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                                Licence Type <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={formLicenceType}
                                onChange={e => setFormLicenceType(e.target.value as VehicleTypeLicence)}
                                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none"
                              >
                                {VEHICLE_TYPE_LICENCE.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                                MDL / App No.
                              </label>
                              <Input
                                value={formMdlNumber}
                                onChange={e => setFormMdlNumber(e.target.value)}
                                placeholder="e.g. DL-123456"
                                className="h-9 text-xs bg-white"
                              />
                            </div>
                          </div>
                        )}

                        {/* Dates and Cost */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                              Issue Date <span className="text-red-500">*</span>
                            </label>
                            <DateTimePicker
                              value={formIssueDate}
                              onChange={d => {
                                setFormIssueDate(d);
                                if (formExpiryDate && formExpiryDate < d) {
                                  setFormExpiryDate(d);
                                }
                              }}
                              className="h-9 text-xs bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                              Expiry Date
                            </label>
                            <DateTimePicker
                              value={formExpiryDate}
                              onChange={setFormExpiryDate}
                              minDate={formIssueDate}
                              className="h-9 text-xs bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                              Cost (₹) <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              min={0}
                              value={formCost}
                              onChange={e => setFormCost(e.target.value)}
                              placeholder="e.g. 500"
                              className="h-9 text-xs font-bold bg-white focus-visible:ring-slate-400"
                            />
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                            Notes <span className="text-slate-400 font-normal">(optional)</span>
                          </label>
                          <Input
                            value={formNotes}
                            onChange={e => setFormNotes(e.target.value)}
                            placeholder="Add notes or comments..."
                            className="h-8 text-xs bg-white focus-visible:ring-slate-400"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedServiceId(null)}
                            className="h-8 text-xs text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddToCart(st, exists, existingRecord)}
                            className="h-8 px-3.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 border border-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                          >
                            <ShoppingBag className="h-3.5 w-3.5 text-slate-700" />
                            <span>{inCart ? 'Update in Cart' : 'Add to Cart'}</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Category change & back buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3.5 rounded-lg font-semibold bg-white border-slate-200 hover:bg-slate-50 text-xs"
                onClick={onChangeCategory}
              >
                Change category
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-3.5 rounded-lg font-semibold text-slate-500 hover:text-slate-700 text-xs"
                onClick={onBack}
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
