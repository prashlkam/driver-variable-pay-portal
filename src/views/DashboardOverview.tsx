import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DriverProfile, MonthlyReport } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowRight, IndianRupee, TrendingUp, MapPin } from 'lucide-react';

interface Props {
  driver: DriverProfile;
  onNavToSubmit: () => void;
}

export function DashboardOverview({ driver, onNavToSubmit }: Props) {
  const reports = useLiveQuery(
    () => db.reports.where('driverId').equals(driver.id!).sortBy('monthString'),
    [driver.id]
  );

  if (!reports) return <div className="p-8 text-gray-500">Loading metrics...</div>;

  const totalEarnings = reports.reduce((sum, r) => sum + r.calculatedVariablePay, 0);
  const pendingBalance = reports.filter(r => r.status !== 'PAID').reduce((sum, r) => sum + r.balanceForwarded, 0);
  const totalKm = reports.reduce((sum, r) => sum + r.totalKm, 0);

  const chartData = reports.map(r => ({
    month: r.monthString,
    VariablePay: r.calculatedVariablePay,
    FuelCost: r.totalFuelCost
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-medium tracking-tight mb-2 dark:text-white">Welcome back, {driver.fullName.split(' ')[0]}</h1>
        <p className="text-gray-500 dark:text-gray-400">Your variable pay lifecycle and performance metrics.</p>
      </div>

      {/* Primary KPI Grid - Clean Utility */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[24px] dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4 text-gray-500 dark:text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Variable Pay</span>
              <IndianRupee size={16} />
            </div>
            <div className="text-4xl font-light dark:text-white">{formatCurrency(totalEarnings)}</div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">All-time computed net value</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-[24px] dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4 text-gray-500 dark:text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Balance</span>
              <TrendingUp size={16} />
            </div>
            <div className="text-4xl font-light text-amber-600 dark:text-amber-500">{formatCurrency(pendingBalance)}</div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Awaiting fleet operator payout</div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] bg-gray-900 dark:bg-gray-800 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
               <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-300 mb-2">Quick Action</div>
               <div className="text-sm text-gray-300 dark:text-gray-200">Submit your end-of-month fuel & trip logs.</div>
            </div>
            <Button variant="outline" className="w-full mt-4 bg-transparent border-white/20 text-white hover:bg-white/10 dark:hover:bg-white/20" onClick={onNavToSubmit}>
              Submit Report <ArrowRight size={16} className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {reports.length > 0 && (
        <Card className="rounded-[24px] overflow-hidden dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <CardTitle className="dark:text-white">Variable Pay History</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis 
                  tickFormatter={(val) => `₹${val/1000}k`} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#6B7280', fontSize: 12}} 
                  dx={-10}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="VariablePay" 
                  stroke="#111827" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                  name="Surcharge Payout"
                />
                <Line 
                  type="monotone" 
                  dataKey="FuelCost" 
                  stroke="#9CA3AF" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={false}
                  name="Fuel Outlay"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
