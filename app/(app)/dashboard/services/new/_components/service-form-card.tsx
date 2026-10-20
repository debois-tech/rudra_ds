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
    <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
      <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5 px-6">
        <CardTitle className="text-lg flex items-center gap-2">
          {category === 'vehicle' ? <Car className="h-5 w-5 text-amber-600" /> : <FileText className="h-5 w-5 text-violet-600" />}
          {category === 'vehicle' ? 'Vehicle & Services' : 'Licence Services'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 bg-slate-50/30 space-y-6">
        {/* Vehicle Selection & Add Section (When category === 'vehicle') */}
        {category === 'vehicle' && (
          <div className="space-y-4">
            {/* 1. Customer's Existing Vehicles */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <Car className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Customer&apos;s Vehicles</h3>
                    <p className="text-xs text-slate-400">Select an existing vehicle or add a new one below</p>
                  </div>
                </div>
                {localVehicles.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVehicleId('');
                      setVehicleNumber('');
                      setVehicleType('');
                      setVehicleName('');
                      onDirty();
                    }}
                    className={`h-8 rounded-lg text-xs font-semibold ${
                      !vehicleId
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    New Vehicle
                  </Button>
                )}
              </div>

              {localVehicles.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
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
                        className={`group inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                        }`}
                      >
                        <Car className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-amber-600'}`} />
                        <span className="font-mono font-bold tracking-tight text-sm">{v.v_number}</span>
                        <span className={isSelected ? 'text-amber-100 font-normal' : 'text-slate-500 font-normal'}>
                          ({displayName})
                        </span>
                        {isSelected && <Check className="h-4 w-4 ml-0.5 text-white stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center">
                  <p className="text-xs text-slate-500 font-medium">No saved vehicles found for this customer. Enter details below and click Add Vehicle.</p>
                </div>
              )}
            </div>

            {/* 2. Adding / Selected Vehicle Section */}
            <div className={`p-5 rounded-xl border shadow-sm space-y-4 transition-colors ${
              vehicleId ? 'bg-amber-50/30 border-amber-200' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {vehicleId ? 'Selected Vehicle Details' : 'Add New Vehicle'}
                  </span>
                  {vehicleId ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                      <Check className="h-3 w-3 stroke-[2.5]" /> Selected Vehicle
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Enter details below</span>
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
                    className="h-7 text-xs font-semibold text-amber-700 hover:text-amber-900 hover:bg-amber-100/60"
                  >
                    Change / Add New Vehicle
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className={LABEL_CLASS}>Vehicle Number <span className="text-red-500">*</span></label>
                    {vehicleId && (
                      <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-0.5">
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
                    className={`mt-2 h-11 rounded-lg uppercase font-semibold transition-colors ${
                      vehicleId
                        ? 'bg-amber-100/50 border-amber-200 text-amber-950 cursor-not-allowed select-none shadow-none ring-0 focus-visible:ring-0'
                        : 'bg-slate-50 border-slate-200 focus-visible:ring-amber-200'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className={LABEL_CLASS}>Vehicle Type <span className="text-red-500">*</span></label>
                    {vehicleId && (
                      <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-0.5">
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
                    className={`mt-2 h-11 rounded-lg font-semibold transition-colors ${
                      vehicleId
                        ? 'bg-amber-100/50 border-amber-200 text-amber-950 cursor-not-allowed select-none shadow-none ring-0 focus-visible:ring-0'
                        : 'bg-slate-50 border-slate-200 focus-visible:ring-amber-200'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className={LABEL_CLASS}>Vehicle Name <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
                    {vehicleId && (
                      <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-0.5">
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
                    className={`mt-2 h-11 rounded-lg font-semibold transition-colors ${
                      vehicleId
                        ? 'bg-amber-100/50 border-amber-200 text-amber-950 cursor-not-allowed select-none shadow-none ring-0 focus-visible:ring-0'
                        : 'bg-slate-50 border-slate-200 focus-visible:ring-amber-200'
                    }`}
                  />
                </div>
              </div>

              {!vehicleId && (
                <div className="flex items-center justify-end pt-2">
                  <Button
                    type="button"
                    disabled={addingVehicle || !vehicleNumber.trim()}
                    onClick={handleAddVehicle}
                    className="h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-2 shadow-sm transition-all"
                  >
                    {addingVehicle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 stroke-[2.5]" />}
                    <span>Add Vehicle</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Available Services List (Shown once vehicle chosen or licence category) */}
        {vehicleChosen && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Available Services</h3>
                <p className="text-xs text-slate-400">Click New or Renew to configure and add to cart</p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {serviceTypes.length} {serviceTypes.length === 1 ? 'service' : 'services'} available
              </span>
            </div>

            <div className="space-y-3">
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
                    className={`rounded-2xl border bg-white overflow-hidden shadow-sm transition-all duration-150 ${
                      inCart
                        ? 'border-amber-300 ring-2 ring-amber-400/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Main Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3.5">
                      {/* Left: Service Type Info */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                          category === 'vehicle' ? 'bg-amber-50 text-amber-600' : 'bg-violet-50 text-violet-600'
                        }`}>
                          {category === 'vehicle' ? <Car className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm tracking-tight">{st.name}</h4>
                            {inCart && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <Check className="h-2.5 w-2.5 stroke-[2.5]" /> In Cart
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {category === 'vehicle' ? 'Vehicle Service' : 'Document Service'}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Existing Service Info */}
                      <div className="flex-1 min-w-0 flex items-center text-xs">
                        {exists && existingRecord ? (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-xl text-slate-600 w-full sm:w-auto">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Issue Date</span>
                              <span className="font-semibold text-slate-800">
                                {format(new Date(existingRecord.issue_date), 'dd MMM yyyy')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Expiry Date</span>
                              <span className="font-semibold text-slate-800">
                                {existingRecord.expiry_date ? format(new Date(existingRecord.expiry_date), 'dd MMM yyyy') : 'No expiry'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cost</span>
                              <span className="font-bold text-slate-900">₹{existingRecord.total_cost.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="sm:ml-auto">
                              {existingRecord.expiry_date && existingRecord.expiry_date < today() ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                  Overdue ({formatDistanceToNow(new Date(existingRecord.expiry_date))} ago)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic font-medium">
                            No existing record
                          </span>
                        )}
                      </div>

                      {/* Right: Actions (Expand or collapse details) */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {inCart ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleExpand(st, exists, existingRecord, cartItem)}
                            className="h-9 px-4 rounded-xl border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold shadow-sm cursor-pointer"
                          >
                            In Cart
                          </Button>
                        ) : exists ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleToggleExpand(st, true, existingRecord)}
                            className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Renew</span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleExpand(st, false)}
                            className="h-9 px-4 rounded-xl border-slate-300 text-slate-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>New</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Bottom Expand / Collapse Toggle Bar across the entire service card */}
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(st, exists, existingRecord, cartItem)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? "Collapse service details" : "Expand service details"}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-50/60 hover:bg-amber-50/70 border-t border-slate-100 text-slate-400 hover:text-amber-700 text-[11px] font-semibold transition-colors cursor-pointer select-none"
                    >
                      <span>{isExpanded ? 'Hide details' : 'Details'}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-slate-400 hover:text-amber-700" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 hover:text-amber-700" />
                      )}
                    </button>

                    {/* Expanding Detail Filling Card */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/70 p-4.5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            {inCart ? 'Edit Service Details' : exists ? 'Configure Renewal' : 'Configure New Service'}
                          </span>
                          <span className="text-[11px] text-slate-400">Fill details and click Add to Cart</span>
                        </div>

                        {/* Licence specific fields */}
                        {category === 'licence' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                                Vehicle Class <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={formVehicleClass}
                                onChange={e => setFormVehicleClass(e.target.value as VehicleClass)}
                                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
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
                                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
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
                                className="h-10 text-xs bg-white"
                              />
                            </div>
                          </div>
                        )}

                        {/* Dates and Cost */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
                              className="h-10 text-xs bg-white"
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
                              className="h-10 text-xs bg-white"
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
                              className="h-10 text-xs font-bold bg-white focus-visible:ring-amber-200"
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
                            className="h-9 text-xs bg-white focus-visible:ring-amber-200"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedServiceId(null)}
                            className="h-9 text-xs text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddToCart(st, exists, existingRecord)}
                            className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-amber-500/20"
                          >
                            <ShoppingBag className="h-4 w-4" />
                            <span>{inCart ? 'Update in Cart' : 'Add to Cart'}</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category change & back buttons */}
        <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-5 rounded-xl font-semibold bg-white border-slate-200 hover:bg-slate-50 text-xs"
            onClick={onChangeCategory}
          >
            Change category
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-10 px-5 rounded-xl font-semibold text-slate-500 hover:text-slate-700 text-xs"
            onClick={onBack}
          >
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
