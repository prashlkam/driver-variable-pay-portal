import Dexie, { type Table } from 'dexie';
import { FuelType, MetroRegion } from './utils';

export interface DriverProfile {
  id?: number;
  fullName: string;
  licenseNumber: string;
  mobileNumber?: string;
  password?: string;
  vehiclePlate: string;
  operatingRegion: MetroRegion;
  fuelType: FuelType;
  fuelEfficiency: number; // km per liter or km per kg
  basePrice: number; // Bound at registration time
  registeredAt: string; // ISO date
}

export interface MonthlyReport {
  id?: number;
  driverId: number;
  monthString: string; // YYYY-MM
  totalTrips: number;
  totalKm: number;
  totalFuelCost: number; // Actual out-of-pocket
  
  // Computed values cached for the ledger
  calculatedVariablePay: number;
  basePriceUsed: number;
  efficiencyUsed: number;
  
  // Ledger/Payment state
  status: 'PENDING' | 'DISPUTED' | 'PAID' | 'PARTIAL';
  amountPaid: number;
  balanceForwarded: number; // Any amount not paid that carries over
  disputeReason?: string;
  disputeTitle?: string;
  disputeSummary?: string;
  disputeDescription?: string;
  disputeAmount?: number;
  disputeStatus?: 'open' | 'settled' | 'closed' | 'pending';
  lastPaymentDate?: string;
  lastPaymentComments?: string;
  createdAt: string;
}

export class VariablePayDB extends Dexie {
  drivers!: Table<DriverProfile, number>;
  reports!: Table<MonthlyReport, number>;

  constructor() {
    super('VariablePayLedgerDB');
    this.version(1).stores({
      drivers: '++id, licenseNumber, vehiclePlate',
      reports: '++id, driverId, monthString, status'
    });
  }
}

export const db = new VariablePayDB();
