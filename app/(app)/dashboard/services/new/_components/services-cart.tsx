'use client';

import { ShoppingBag, Trash2, CheckCircle2, Loader2, Calendar, FileText, ArrowRight, ShieldCheck, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import type { CartItem, CustomerDashboardView } from '@/lib/types';
import { format } from 'date-fns';

interface ServicesCartProps {
  cart: CartItem[];
  customer: CustomerDashboardView;
  vehicleNumber?: string;
  onUpdateItem: (id: string, updates: Partial<CartItem>) => void;
  onRemoveItem: (id: string) => void;
  onConfirmAndCreate: () => void;
  submitting: boolean;
}

export function ServicesCart({
  cart,
  customer,
  vehicleNumber,
  onUpdateItem,
  onRemoveItem,
  onConfirmAndCreate,
  submitting,
}: ServicesCartProps) {
  const totalAmount = cart.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 max-h-[calc(100vh-140px)] overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3.5 text-white shadow-sm shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white font-bold">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Services Cart</h3>
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-[12px] text-amber-100 font-medium truncate max-w-[240px]">
                {vehicleNumber ? `Vehicle: ${vehicleNumber}` : customer.c_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Items List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-slate-100 min-h-0">
        {cart.map((item, index) => (
          <div key={item.id} className={`${index > 0 ? 'pt-3.5' : ''} space-y-2.5`}>
            {/* Item Title & Actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-sm tracking-tight truncate">
                    {item.serviceName}
                  </h4>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.isRenewal
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {item.isRenewal ? 'Renewal' : 'New'}
                  </span>
                </div>
                {item.vehicleNumber && (
                  <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 font-mono">
                    <Car className="h-3 w-3 text-slate-400" />
                    {item.vehicleNumber} {item.vehicleName ? `(${item.vehicleName})` : ''}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                title="Remove from cart"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 shrink-0 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Cart Item Details: Cost highlighted in green, Dates in one line, Note below */}
            <div className="space-y-2 rounded-xl bg-slate-50/90 p-3 border border-slate-200/70">
              {/* Cost Highlighted in Green (Not Editable) */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Service Cost</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm font-black tracking-tight">
                  ₹{Number(item.totalCost).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Dates in one line: Issue Date and Expiry Date */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="min-w-0">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Issue Date
                  </label>
                  <DateTimePicker
                    value={item.issueDate}
                    onChange={(d) => {
                      const updates: Partial<CartItem> = { issueDate: d };
                      if (item.expiryDate && item.expiryDate < d) {
                        updates.expiryDate = d;
                      }
                      onUpdateItem(item.id, updates);
                    }}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div className="min-w-0">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Expiry Date
                  </label>
                  <DateTimePicker
                    value={item.expiryDate}
                    onChange={(d) => onUpdateItem(item.id, { expiryDate: d })}
                    minDate={item.issueDate}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Note in small size below (Not Editable) */}
              {item.notes && (
                <div className="pt-0.5">
                  <p className="text-[11px] text-slate-600 italic bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 leading-snug">
                    <span className="font-semibold text-slate-700 not-italic mr-1">Note:</span>
                    {item.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Footer */}
      <div className="border-t border-slate-200 bg-slate-50/95 p-4.5 space-y-3.5 shrink-0">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total ({cart.length} {cart.length === 1 ? 'service' : 'services'})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">All taxes included</span>
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <Button
          type="button"
          disabled={submitting || cart.length === 0}
          onClick={onConfirmAndCreate}
          className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition-all"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Creating Services...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
              <span>Confirm &amp; Create Services</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
