import React, { useState } from 'react';
import { db, DriverProfile, MonthlyReport } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calculator } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface Props {
  driver: DriverProfile;
  onSuccess: () => void;
}

export function SubmitReportView({ driver, onSuccess }: Props) {
  const lastMonthDate = subDays(new Date(), new Date().getDate());
  const defaultMonth = format(lastMonthDate, 'yyyy-MM');

  const [formData, setFormData] = useState({
    monthString: defaultMonth,
    totalTrips: '',
    totalKm: '',
    totalFuelCost: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Real-time calculation preview
  const trips = parseInt(formData.totalTrips) || 0;
  const km = parseFloat(formData.totalKm) || 0;
  const cost = parseFloat(formData.totalFuelCost) || 0;
  
  // The Math
  const litersConsumed = km / driver.fuelEfficiency;
  const baselineCost = driver.basePrice * litersConsumed;
  const calculatedVariablePay = Math.max(0, cost - baselineCost);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!driver.id) throw new Error("Driver ID is missing");
      // Check if report for this month already exists
      const existing = await db.reports.where({ driverId: driver.id, monthString: formData.monthString }).first();
      if (existing) {
        alert('A report for this month has already been submitted.');
        setIsSubmitting(false);
        return;
      }

      const report: MonthlyReport = {
        driverId: driver.id,
        monthString: formData.monthString,
        totalTrips: trips,
        totalKm: km,
        totalFuelCost: cost,
        calculatedVariablePay: calculatedVariablePay,
        basePriceUsed: driver.basePrice,
        efficiencyUsed: driver.fuelEfficiency,
        status: 'PENDING',
        amountPaid: 0,
        balanceForwarded: calculatedVariablePay,
        createdAt: new Date().toISOString()
      };

      await db.reports.add(report);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-none border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 p-8 rounded-t-2xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-900 dark:text-gray-100 shadow-sm">
              <Calculator size={24} />
            </div>
            <div>
              <CardTitle className="text-2xl font-display dark:text-white">Submit Monthly Report</CardTitle>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-1">Automatic variable pay computation engine</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="monthString" className="dark:text-gray-300">Billing Period (Month)</Label>
                <Input id="monthString" type="month" required value={formData.monthString} onChange={e => setFormData({...formData, monthString: e.target.value})} className="dark:bg-gray-950 dark:border-gray-800 dark:text-white" />
              </div>
              <div className="space-y-3">
                <Label htmlFor="totalTrips" className="dark:text-gray-300">Total Trips Completed</Label>
                <Input id="totalTrips" type="number" min="0" required value={formData.totalTrips} onChange={e => setFormData({...formData, totalTrips: e.target.value})} placeholder="142" className="dark:bg-gray-950 dark:border-gray-800 dark:text-white" />
              </div>
              <div className="space-y-3">
                <Label htmlFor="totalKm" className="dark:text-gray-300">Total Distance (km)</Label>
                <Input id="totalKm" type="number" step="0.1" min="0" required value={formData.totalKm} onChange={e => setFormData({...formData, totalKm: e.target.value})} placeholder="3400.5" className="dark:bg-gray-950 dark:border-gray-800 dark:text-white"  />
              </div>
              <div className="space-y-3">
                <Label htmlFor="totalFuelCost" className="dark:text-gray-300">Total Out-of-Pocket Fuel Cost (₹)</Label>
                <Input id="totalFuelCost" type="number" step="1" min="0" required value={formData.totalFuelCost} onChange={e => setFormData({...formData, totalFuelCost: e.target.value})} placeholder="25000" className="dark:bg-gray-950 dark:border-gray-800 dark:text-white" />
              </div>
            </div>

            {/* Preview Box - Hardware / Specialist Tool feeling for math visualization */}
            <div className="bg-[#151619] rounded-xl p-6 text-white grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl relative overflow-hidden">
               {/* Decorative subtle lines */}
              <div className="absolute top-0 right-0 w-32 h-32 border border-dashed border-[#8E9299]/30 rounded-full -mr-16 -mt-16"></div>
              
              <div>
                <div className="font-mono text-[10px] tracking-wider text-[#8E9299] uppercase mb-1">Volometric Consumption</div>
                <div className="font-mono text-xl">{litersConsumed > 0 ? (litersConsumed).toFixed(1) : '0.0'} <span className="text-sm text-[#8E9299]">L</span></div>
              </div>
              
              <div>
                <div className="font-mono text-[10px] tracking-wider text-[#8E9299] uppercase mb-1">Baseline Surcharge</div>
                <div className="font-mono text-xl">{baselineCost > 0 ? formatCurrency(baselineCost) : '₹0.00'}</div>
              </div>

              <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-[#8E9299]/30 pt-4 md:pt-0 md:pl-6">
                <div className="font-mono text-[10px] tracking-wider text-[#00FF00] uppercase mb-1">Net Variable Pay</div>
                <div className="font-mono text-3xl font-medium text-[#00FF00]">{formatCurrency(calculatedVariablePay)}</div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base shadow-sm border border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white" isLoading={isSubmitting}>
              Submit & Finalize Ledger Entry
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
