'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Car, Check, Plus, Wrench } from 'lucide-react';
import { customerApi } from '@/lib/api';
import type { CustomerDashboardView } from '@/lib/types';
import { Button } from '@/components/ui/button';

// Opened by ?added=<customerId>, which the new-service form sets after a save.
// Open state lives in the URL, so closing just clears the param.
export function ServiceAddedDialog() {
  const router = useRouter();
  const addedId = useSearchParams().get('added');

  // Remember the last id so content survives the exit animation after the param clears.
  const [shownId, setShownId] = useState<string | null>(null);
  if (addedId && addedId !== shownId) setShownId(addedId);

  const [customer, setCustomer] = useState<CustomerDashboardView | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  useEffect(() => {
    if (!addedId) return;
    let cancelled = false;
    customerApi.getByIdWithStats(addedId)
      .then(c => { if (!cancelled && c) setCustomer(c); })
      .catch(() => { if (!cancelled) setFailedId(addedId); });
    return () => { cancelled = true; };
  }, [addedId]);

  const identity = customer?.c_id === shownId ? customer : null;
  const identityFailed = failedId === shownId;

  return (
    <Dialog.Root
      open={!!addedId}
      onOpenChange={open => { if (!open) router.replace('/dashboard/services/overview'); }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 grid place-items-end bg-slate-900/50 duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 sm:place-items-center sm:p-4">
          <Dialog.Content className="w-full rounded-t-3xl border border-slate-200 bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.4)] outline-none duration-300 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-8 sm:max-w-md sm:rounded-3xl">
            <div className="success-check mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50">
              <Check className="h-7 w-7 text-emerald-600" strokeWidth={2.5} aria-hidden />
            </div>

            <Dialog.Title className="mt-5 text-center text-xl font-bold tracking-tight text-slate-900">
              Service added
            </Dialog.Title>

            {!identityFailed && (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                {identity ? (
                  <>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-100 font-bold text-amber-700">
                      {identity.c_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{identity.c_name}</p>
                      <p className="truncate text-xs font-medium tabular-nums text-slate-500">
                        {identity.c_mobile} · {identity.c_registration_id}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-semibold tabular-nums text-amber-700" title="Vehicles">
                        <Car className="h-3 w-3" aria-hidden /> {identity.vehicle_count}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-semibold tabular-nums text-amber-700" title="Services">
                        <Wrench className="h-3 w-3" aria-hidden /> {identity.service_count}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="skeleton h-11 w-11 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3.5 w-32" />
                      <div className="skeleton h-3 w-44" />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <Button
                asChild
                className="h-11 w-full rounded-xl border border-amber-600/20 bg-gradient-to-r from-amber-400 to-amber-600 text-base font-bold text-black shadow-md hover:from-amber-500 hover:to-amber-700 focus-visible:ring-amber-300"
              >
                <Link href={`/dashboard/services/new?customer=${shownId}`}>
                  <Plus className="h-5 w-5" aria-hidden /> Add another service
                </Link>
              </Button>
              <Dialog.Close asChild>
                <Button variant="ghost" className="h-10 w-full rounded-xl font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                  Back to services
                </Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
