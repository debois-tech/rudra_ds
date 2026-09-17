import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Indian vehicle plate: 2 state letters, 2 RTO digits, 1-2 series letters, 3-4 number digits.
// e.g. MH14EP4332, MH01A1234.
export const VEHICLE_NUMBER_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{3,4}$/;
