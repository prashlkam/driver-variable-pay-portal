import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Baseline Fuel Price Configuration Matrix (Active Jan 1, 2026)
export const METRO_REGIONS = [
  'New Delhi',
  'Mumbai',
  'Bangalore',
  'Chennai',
  'Hyderabad',
  'Kolkata',
] as const;

export type MetroRegion = (typeof METRO_REGIONS)[number];

export const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG'] as const;

export type FuelType = (typeof FUEL_TYPES)[number];

export const FUEL_BASE_PRICES: Record<MetroRegion, Record<FuelType, number>> = {
  'New Delhi': { Petrol: 94.77, Diesel: 87.67, CNG: 77.09 },
  'Mumbai': { Petrol: 103.54, Diesel: 90.03, CNG: 77.00 },
  'Bangalore': { Petrol: 103.06, Diesel: 90.99, CNG: 89.95 },
  'Chennai': { Petrol: 100.75, Diesel: 92.34, CNG: 91.50 },
  'Hyderabad': { Petrol: 107.46, Diesel: 95.70, CNG: 96.00 },
  'Kolkata': { Petrol: 105.41, Diesel: 92.02, CNG: 88.50 },
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};
