'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { customerApi, vehicleApi, serviceTypeApi, serviceApi } from '@/lib/api';
import type { CustomerDashboardView, Vehicle, ServiceType, ServiceOverview, VehicleClass, VehicleTypeLicence } from '@/lib/types';
import { Loader2, Search, Check, User, Car, FileText, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getErrorMessage, logClientError } from '@/lib/error-message';
import { smoothReveal as reveal } from '@/lib/utils';
import { ServiceFormCard, type AddedService, type Category, type FormInitial } from './_components/service-form-card';


export default function NewServicePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedCustomerId = searchParams.get('customer');
  const renewOf = searchParams.get('renewOf');
  const paramString = searchParams.toString(); // value-stable dep for the renewal prefill effect

  // Customer card: name / mobile / car number double as both the
  // search-as-you-type query and the auto-create payload.
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custCarNumber, setCustCarNumber] = useState('');
  const [lastEdited, setLastEdited] = useState<'name' | 'mobile' | 'car' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; mobile?: string; carNumber?: string }>({});
  const [searchResults, setSearchResults] = useState<CustomerDashboardView[]>([]);
  const [searching, setSearching] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const creatingCustomerLock = useRef(false);

  // The stack: customer → category → [saved services…] → current form.
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDashboardView | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loadingCategory, setLoadingCategory] = useState<Category | null>(null);
  const categoryLock = useRef(false);
  // Fetched once and reused: service types per category, and the customer's vehicles.
  const [typesByCategory, setTypesByCategory] = useState<Partial<Record<Category, ServiceType[]>>>({});
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  // The customer's existing services, fetched once — the form matches expired ones against it.
  const [customerServices, setCustomerServices] = useState<ServiceOverview[] | null>(null);
  const [added, setAdded] = useState<AddedService[]>([]);
  const [formKey, setFormKey] = useState(0); // new key = fresh blank form
  const [renewal, setRenewal] = useState<{ id: string; oldStatus: string | null; initial: FormInitial } | null>(null);
  const formDirty = useRef(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Preselected customer (skip for renewals — the effect below does its own fetch).
  useEffect(() => {
    if (!preselectedCustomerId || renewOf) return;
    const controller = new AbortController();
    customerApi.getByIdWithStats(preselectedCustomerId).then(c => {
      if (!controller.signal.aborted && c) setSelectedCustomer(c);
    }).catch(() => {});
    return () => controller.abort();
  }, [preselectedCustomerId, renewOf]);

  // Renewal: customer, service types and vehicles load in parallel, and the
  // form opens prefilled from buildRenewUrl()'s query params.
  useEffect(() => {
    if (!renewOf || !preselectedCustomerId) return;
    const params = new URLSearchParams(paramString);
    const cat = params.get('category') as Category | null;
    if (!cat) return;
    let cancelled = false;
    (async () => {
      try {
        const [customer, types, vehs] = await Promise.all([
          customerApi.getByIdWithStats(preselectedCustomerId),
          serviceTypeApi.getByCategory(cat),
          cat === 'vehicle' ? vehicleApi.getByOwner(preselectedCustomerId) : Promise.resolve(null),
        ]);
        if (cancelled || !customer) return;
        const stId = params.get('serviceTypeId');
        setSelectedCustomer(customer);
        setTypesByCategory({ [cat]: types });
        if (vehs) setVehicles(vehs);
        setRenewal({
          id: renewOf,
          oldStatus: params.get('oldStatus'),
          initial: {
            serviceTypeId: stId ? Number(stId) : undefined,
            vehicleId: params.get('vehicleId') || undefined,
            vehicleNumber: params.get('vehicleNumber') || undefined,
            vehicleType: params.get('vehicleType') || undefined,
            vehicleClass: (params.get('vehicleClass') as VehicleClass) || undefined,
            vehicleTypeLicence: (params.get('vehicleTypeLicence') as VehicleTypeLicence) || undefined,
            mdlNumber: params.get('mdlNumber') || undefined,
            issueDate: params.get('issueDate') || undefined,
            expiryDate: params.get('expiryDate') || undefined,
            totalCost: params.get('cost') || undefined,
          },
        });
        setCategory(cat);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          toast.error('Failed to prefill renewal — fill the form manually.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [renewOf, preselectedCustomerId, paramString]);

  // Scroll the newest card into view as the stack grows.
  useEffect(() => { if (selectedCustomer) reveal(categoryRef.current); }, [selectedCustomer]);
  useEffect(() => { if (category) reveal(formRef.current); }, [category, formKey]);

  // Search-as-you-type across whichever of the 3 fields the user is
  // actively editing — customerApi.search() already ORs name/mobile/
  // registration/plate server-side, so one query string covers all of it.
  useEffect(() => {
    if (!lastEdited) return;
    const value = lastEdited === 'name' ? custName : lastEdited === 'mobile' ? custMobile : custCarNumber;
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const results = await customerApi.search(value.trim());
        if (!cancelled) setSearchResults(results);
      } catch (error) {
        if (!cancelled) console.error(error);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [custName, custMobile, custCarNumber, lastEdited]);

  // Existing customer picked from the dropdown — autofill everything else,
  // no re-typing.
  function selectCustomer(customer: CustomerDashboardView) {
    setSelectedCustomer(customer);
    setSearchResults([]);
    setCustName(''); setCustMobile(''); setCustCarNumber('');
    setLastEdited(null);
    setFieldErrors({});
  }

  // No match selected — validate and auto-create the customer (+ vehicle if
  // a car number was given) the moment they move to the next step. No
  // separate "add customer" button/page needed.
  async function handleCreateAndNext() {
    if (creatingCustomerLock.current) return;
    const errors: typeof fieldErrors = {};
    if (custName.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
    if (!/^[0-9]{10}$/.test(custMobile.trim())) errors.mobile = 'Mobile number must be exactly 10 digits.';
    const plate = custCarNumber.trim().toUpperCase();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    creatingCustomerLock.current = true;
    setCreatingCustomer(true);
    try {
      // Hard dedupe check — the search dropdown only helps if he notices it.
      // Mobile is the identity that matters; if it already exists, snap onto
      // that record instead of letting Next create a duplicate.
      const mobile = custMobile.trim();
      const existingByMobile = await customerApi.findByMobile(mobile);
      if (existingByMobile) {
        toast.error(`Mobile ${mobile} already belongs to ${existingByMobile.c_name} (${existingByMobile.c_registration_id}) — using that customer.`);
        selectCustomer(existingByMobile);
        return;
      }
      if (plate) {
        const existingVehicle = await vehicleApi.getByNumber(plate);
        if (existingVehicle) {
          const owner = await customerApi.getByIdWithStats(existingVehicle.owner_id);
          if (owner) {
            toast.error(`Car ${plate} is already registered to ${owner.c_name} — using that customer.`);
            selectCustomer(owner);
            return;
          }
        }
      }

      const { customer, vehicleErrors } = await customerApi.create(
        { c_name: custName.trim(), c_mobile: mobile },
        plate ? [{ v_number: plate, v_type: 'car' }] : undefined
      );
      vehicleErrors.forEach(msg => toast.warning(msg));
      toast.success(`Customer "${customer.c_name}" added! ID: ${customer.c_registration_id}`);
      // Freshly created — stats are known without a round-trip fetch.
      setSelectedCustomer({ ...customer, vehicle_count: plate && vehicleErrors.length === 0 ? 1 : 0, service_count: 0, total_revenue: 0 });
      setCustName(''); setCustMobile(''); setCustCarNumber('');
    } catch (error: unknown) {
      logClientError('create-customer', error, { mobile: custMobile });
      toast.error(getErrorMessage(error, 'Could not create customer.'));
    } finally {
      setCreatingCustomer(false);
      creatingCustomerLock.current = false;
    }
  }

  // Everything below the customer card is thrown away; services already
  // saved stay in the database.
  function changeCustomer() {
    setSelectedCustomer(null);
    setCategory(null);
    setAdded([]);
    setVehicles(null);
    setCustomerServices(null);
    setRenewal(null);
    formDirty.current = false;
    setCustName(''); setCustMobile(''); setCustCarNumber('');
    setFieldErrors({});
  }

  // Pick a category: types (cached per category) and vehicles (once per
  // customer) load in parallel; the form card only appears once both are ready.
  async function selectCategory(cat: Category) {
    if (categoryLock.current || cat === category || !selectedCustomer) return;
    categoryLock.current = true;
    setLoadingCategory(cat);
    try {
      const [types, vehs, svcs] = await Promise.all([
        typesByCategory[cat] ?? serviceTypeApi.getByCategory(cat),
        cat === 'vehicle' && vehicles === null ? vehicleApi.getByOwner(selectedCustomer.c_id) : Promise.resolve(null),
        customerServices === null ? serviceApi.getByCustomer(selectedCustomer.c_id) : Promise.resolve(null),
      ]);
      setTypesByCategory(prev => ({ ...prev, [cat]: types }));
      if (vehs) setVehicles(vehs);
      if (svcs) setCustomerServices(svcs);
      setRenewal(null); // a prefilled renewal only applies to its own category
      formDirty.current = false;
      setFormKey(k => k + 1);
      setCategory(cat);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load service types — try again.');
    } finally {
      setLoadingCategory(null);
      categoryLock.current = false;
    }
  }

  // "Change category": drop the current form, keep the saved-service rows.
  function changeCategory() {
    formDirty.current = false;
    setRenewal(null);
    setCategory(null);
    reveal(categoryRef.current);
  }

  // Saved: the form collapses into a ✓ row and a fresh one mounts below it.
  function handleSaved(item: AddedService, newVehicle?: Vehicle, renewedId?: string) {
    setAdded(prev => [...prev, item]);
    if (renewedId) setCustomerServices(prev => prev && prev.filter(x => x.s_id !== renewedId)); // now completed, no longer a match
    if (newVehicle) setVehicles(prev => [newVehicle, ...(prev || [])]); // available to the next service
    setRenewal(null); // the old service was marked completed on the first save only
    formDirty.current = false;
    setFormKey(k => k + 1);
  }

  function exit() {
    if (formDirty.current && !confirm('Discard the unsaved service?')) return;
    router.push('/dashboard/services/overview');
  }

  const types = category ? typesByCategory[category] : undefined;

  const CATEGORIES: { key: Category; label: string; hint: string; Icon: typeof Car; selected: string; icon: string }[] = [
    { key: 'vehicle', label: 'Vehicle Service', hint: 'Fitness, Tax, PUC, Permit, etc.', Icon: Car, selected: 'border-amber-400 bg-amber-50/50', icon: 'bg-amber-50 border-amber-100 text-amber-600' },
    { key: 'licence', label: 'Licence Service', hint: 'New DL, Learning, Renewal, etc.', Icon: FileText, selected: 'border-violet-400 bg-violet-50/50', icon: 'bg-violet-50 border-violet-100 text-violet-600' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-24">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
        <Button type="button" variant="outline" size="icon" aria-label="Back to services" onClick={exit} className="h-10 w-10 shrink-0 rounded-full border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm transition-transform duration-150 active:scale-95">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Service</h1>
          <p className="text-slate-500 mt-0.5 font-medium">
            {added.length > 0 ? `${added.length} service${added.length > 1 ? 's' : ''} added` : 'Issue a new service to a customer'}
          </p>
        </div>
      </div>

      {/* Selected customer banner */}
      {selectedCustomer && (
        <div className="stack-in flex items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-12 w-12 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200">
              {selectedCustomer.c_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">{selectedCustomer.c_name}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{selectedCustomer.c_mobile} · {selectedCustomer.c_registration_id}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg" onClick={changeCustomer}>
            Change Customer
          </Button>
        </div>
      )}

      {/* Step 1: Customer details — search-as-you-type on all 3 fields; pick a
          match to autofill, or keep typing and Next auto-creates the profile. */}
      {!selectedCustomer && (
        <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-amber-600" /> Customer Details</CardTitle>
            <CardDescription>Matches show up as you type — pick one, or keep going to add a new customer</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-slate-50/30 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Full Name <span className="text-red-500">*</span></label>
                <div className="relative mt-2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="e.g. Rahul Sharma"
                    value={custName}
                    onChange={e => { setCustName(e.target.value); setLastEdited('name'); }}
                    className="pl-11 h-12 rounded-xl border-slate-200 focus-visible:ring-amber-200 text-base"
                    autoFocus
                  />
                </div>
                {fieldErrors.name && <p className="text-xs font-medium text-red-600 mt-1.5">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Mobile Number <span className="text-red-500">*</span></label>
                <div className="relative mt-2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="9876543210"
                    maxLength={10}
                    value={custMobile}
                    onChange={e => { setCustMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setLastEdited('mobile'); }}
                    className="pl-11 h-12 rounded-xl border-slate-200 focus-visible:ring-amber-200 text-base"
                  />
                </div>
                {fieldErrors.mobile && <p className="text-xs font-medium text-red-600 mt-1.5">{fieldErrors.mobile}</p>}
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Car Number <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
              <div className="relative mt-2">
                <Car className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="MH14EP4332"
                  value={custCarNumber}
                  onChange={e => { setCustCarNumber(e.target.value.toUpperCase()); setLastEdited('car'); }}
                  className="pl-11 h-12 rounded-xl border-slate-200 focus-visible:ring-amber-200 text-base uppercase"
                />
              </div>
              {fieldErrors.carNumber && <p className="text-xs font-medium text-red-600 mt-1.5">{fieldErrors.carNumber}</p>}
            </div>

            {searching && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-amber-600" /></div>}
            {searchResults.length > 0 && (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-72 overflow-y-auto bg-white shadow-sm overflow-hidden">
                {searchResults.map(c => (
                  <button
                    key={c.c_id}
                    type="button"
                    className="w-full flex items-center justify-between p-4 hover:bg-amber-50/50 transition-colors text-left group"
                    onClick={() => selectCustomer(c)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center text-slate-600 group-hover:text-amber-700 font-bold border border-slate-200 transition-colors">
                        {c.c_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-amber-900">{c.c_name}</p>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">{c.c_mobile}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider group-hover:bg-white border border-transparent group-hover:border-amber-200">
                         {c.service_count} services
                       </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <Button
              type="button"
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-xl h-11 font-bold shadow-md"
              disabled={creatingCustomer}
              onClick={handleCreateAndNext}
            >
              {creatingCustomer ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Saving...</> : 'Next'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Category — stays on screen with the choice highlighted */}
      {selectedCustomer && (
        <div ref={categoryRef} className="stack-in scroll-mt-4">
          <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-4 pt-5 px-6">
              <CardTitle className="text-lg">Service Category</CardTitle>
              <CardDescription>What type of service does the customer need?</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 bg-slate-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map(c => (
                  <button
                    key={c.key}
                    type="button"
                    aria-pressed={category === c.key}
                    disabled={loadingCategory !== null}
                    onClick={() => selectCategory(c.key)}
                    className={`flex items-center gap-4 p-4 text-left bg-white border-2 rounded-2xl transition-[border-color,background-color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ${category === c.key ? c.selected : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
                  >
                    <div className={`h-12 w-12 shrink-0 rounded-full border flex items-center justify-center ${c.icon}`}>
                      {loadingCategory === c.key ? <Loader2 className="h-6 w-6 animate-spin" /> : <c.Icon className="h-6 w-6" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{c.label}</p>
                      <p className="text-sm font-medium text-slate-500">{c.hint}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Services saved in this session */}
      {added.length > 0 && (
        <ol aria-label="Services added" className="space-y-2">
          {added.map(a => (
            <li key={a.id} className="stack-in flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
              <div className="success-check flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100">
                <Check className="h-4 w-4 text-emerald-700" strokeWidth={2.5} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{a.name}{a.detail ? <span className="font-medium text-slate-500"> · {a.detail}</span> : null}</p>
                <p className="truncate text-xs text-slate-500">
                  {format(new Date(a.issueDate), 'dd MMM yy')}{a.expiryDate ? ` → ${format(new Date(a.expiryDate), 'dd MMM yy')}` : ''}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold tabular-nums text-slate-900">₹{a.cost.toLocaleString('en-IN')}</p>
            </li>
          ))}
        </ol>
      )}

      {/* Current service form — remounts (blank) after every save */}
      {selectedCustomer && category && types && (
        <div ref={formRef} className="stack-in scroll-mt-28">
          <ServiceFormCard
            key={formKey}
            customer={selectedCustomer}
            category={category}
            serviceTypes={types}
            vehicles={vehicles ?? []}
            services={customerServices ?? []}
            initial={renewal?.initial}
            renewal={renewal ? { id: renewal.id, oldStatus: renewal.oldStatus } : undefined}
            onSaved={handleSaved}
            onChangeCategory={changeCategory}
            onBack={exit}
            onDirty={() => { formDirty.current = true; }}
          />
        </div>
      )}
    </div>
  );
}
