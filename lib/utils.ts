import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Local calendar day as yyyy-MM-dd (toISOString would give the UTC day, a day behind in India before 05:30).
export const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Nothing flips a stored 'active' to 'expired' when its date passes, so every
// place that shows a status derives it: active + expiry before today = expired.
export function effectiveStatus(status: string, expiryDate?: string | null) {
  return status === 'active' && expiryDate && expiryDate < isoDay(new Date()) ? 'expired' : status
}

// Ease an element into view; reduced-motion users get an instant jump.
export function smoothReveal(el: HTMLElement | null, block: ScrollLogicalPosition = 'start') {
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block })
}
