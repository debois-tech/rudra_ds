'use client';

import { forwardRef } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { RefreshCw, X, Car, FileText } from 'lucide-react';
import type { ServiceOverview } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { UrgencyBadge } from '../../../overview/_components/badges';

// "This customer already has this service, and it ran out — renew it?"
// Renew prefills the form from the row; skipping carries on as a brand-new service.
export const ExpiredMatchCard = forwardRef<HTMLDivElement, {
  matches: ServiceOverview[];
  onRenew: (match: ServiceOverview) => void;
  onSkip: () => void;
}>(function ExpiredMatchCard({ matches, onRenew, onSkip }, ref) {
  return (
    <div ref={ref} className="stack-in scroll-mt-28 rounded-xl border border-red-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50/50 px-5 py-3">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {matches.length === 1 ? 'This service has expired' : `${matches.length} expired services found`}
          </p>
          <p className="text-xs text-slate-500">Renew it, or skip to add a new one.</p>
        </div>
        <button
          type="button"
          onClick={onSkip}
          title="Skip and add as a new service"
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-[background-color,transform] duration-150 hover:bg-slate-100 active:scale-[0.97]"
        >
          <X className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Add as new</span>
          <span className="sr-only sm:hidden">Add as new</span>
        </button>
      </div>
      <ul className="divide-y divide-slate-100">
        {matches.map(m => (
          <li key={m.s_id} className="flex items-center gap-3 px-5 py-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${m.category === 'vehicle' ? 'bg-amber-50 text-amber-600' : 'bg-violet-50 text-violet-600'}`}>
              {m.category === 'vehicle' ? <Car className="h-4 w-4" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {m.service_name}
                <span className="font-medium text-slate-500">
                  {' · '}{m.category === 'vehicle' ? m.vehicle_number : [m.vehicle_class, m.vehicle_type_licence, m.mdl_number].filter(Boolean).join(' · ')}
                </span>
              </p>
              <p className="truncate text-xs text-slate-500">
                Expired {format(new Date(m.expiry_date!), 'dd MMM yyyy')} · ₹{Number(m.total_cost).toLocaleString('en-IN')}
              </p>
            </div>
            <UrgencyBadge days={differenceInCalendarDays(new Date(m.expiry_date!), new Date())} />
            <Button
              type="button"
              size="sm"
              onClick={() => onRenew(m)}
              className="h-9 shrink-0 rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white transition-transform duration-150 hover:bg-slate-700 active:scale-[0.97]"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Renew
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
});
