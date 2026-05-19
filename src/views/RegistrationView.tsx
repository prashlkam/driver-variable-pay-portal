import React, { useState } from 'react';
import { db, DriverProfile } from '@/lib/db';
import { METRO_REGIONS, FUEL_TYPES, FUEL_BASE_PRICES, MetroRegion, FuelType } from '@/lib/utils';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Truck } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Props {
  onRegister: (driver: DriverProfile) => void;
  onGoToLogin: () => void;
}

export function RegistrationView({ onRegister, onGoToLogin }: Props) {
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    licenseNumber: '',
    password: '',
    vehiclePlate: '',
    operatingRegion: 'New Delhi' as MetroRegion,
    fuelType: 'Diesel' as FuelType,
    fuelEfficiency: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const basePrice = FUEL_BASE_PRICES[formData.operatingRegion][formData.fuelType];
      
      const newDriver: DriverProfile = {
        fullName: formData.fullName,
        mobileNumber: formData.mobileNumber,
        licenseNumber: formData.licenseNumber,
        password: formData.password,
        vehiclePlate: formData.vehiclePlate,
        operatingRegion: formData.operatingRegion,
        fuelType: formData.fuelType,
        fuelEfficiency: parseFloat(formData.fuelEfficiency),
        basePrice,
        registeredAt: new Date().toISOString()
      };

      const id = await db.drivers.add(newDriver);
      onRegister({ ...newDriver, id });
    } catch (error) {
      console.error(error);
      alert('Registration failed. License or Vehicle Plate might already be in use.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] dark:bg-gray-950 flex items-center justify-center p-4 transition-colors">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <Card className="w-full max-w-xl shadow-2xl border-none dark:bg-gray-900">
        <CardHeader className="text-center pb-8 border-b border-gray-100 dark:border-gray-800">
          <div className="mx-auto w-16 h-16 bg-gray-900 dark:bg-gray-800 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Truck size={32} />
          </div>
          <CardTitle className="text-3xl font-display font-medium tracking-tight dark:text-white">Fleet Driver Portal</CardTitle>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Variable Pay Entitlement Registration</p>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="dark:text-gray-300">Full Name</Label>
                <Input id="fullName" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Rajesh Kumar" className="dark:bg-gray-950 dark:border-gray-800 dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNumber" className="dark:text-gray-300">Mobile Number</Label>
                <Input id="mobileNumber" type="tel" required value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} placeholder="+91 98765 43210" className="dark:bg-gray-950 dark:border-gray-800 dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber" className="dark:text-gray-300">License Number</Label>
                <Input id="licenseNumber" required value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} placeholder="DL-14-2021-..." className="dark:bg-gray-950 dark:border-gray-800 dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
                <Input id="password" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className="dark:bg-gray-950 dark:border-gray-800 dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehiclePlate" className="dark:text-gray-300">Registration Plate</Label>
                <Input id="vehiclePlate" required value={formData.vehiclePlate} onChange={e => setFormData({...formData, vehiclePlate: e.target.value})} placeholder="MH 01 AB 1234" className="dark:bg-gray-950 dark:border-gray-800 dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuelEfficiency" className="dark:text-gray-300">Fuel Efficiency (km/l or km/kg)</Label>
                <Input id="fuelEfficiency" type="number" step="0.1" min="1" required value={formData.fuelEfficiency} onChange={e => setFormData({...formData, fuelEfficiency: e.target.value})} placeholder="18.5" className="dark:bg-gray-950 dark:border-gray-800 dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operatingRegion" className="dark:text-gray-300">Primary Region</Label>
                <select 
                  id="operatingRegion" 
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 transition-all cursor-pointer dark:bg-gray-950 dark:border-gray-800 dark:text-white"
                  value={formData.operatingRegion}
                  onChange={e => setFormData({...formData, operatingRegion: e.target.value as MetroRegion})}
                >
                  {METRO_REGIONS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuelType" className="dark:text-gray-300">Fuel Type</Label>
                <select 
                  id="fuelType" 
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 transition-all cursor-pointer dark:bg-gray-950 dark:border-gray-800 dark:text-white"
                  value={formData.fuelType}
                  onChange={e => setFormData({...formData, fuelType: e.target.value as FuelType})}
                >
                  {FUEL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <Label className="text-[10px] dark:text-gray-400">LOCKED BASELINE PRICE (JAN 1, 2026)</Label>
                <div className="font-mono text-lg font-medium text-gray-900 dark:text-white">
                  ₹{FUEL_BASE_PRICES[formData.operatingRegion][formData.fuelType].toFixed(2)}
                  <span className="text-sm font-sans text-gray-500 dark:text-gray-500 ml-1">
                    / {formData.fuelType === 'CNG' ? 'kg' : 'liter'}
                  </span>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base dark:bg-white dark:text-gray-900" isLoading={isSubmitting}>
              Complete Registration
            </Button>
            
            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <button type="button" onClick={onGoToLogin} className="text-gray-900 dark:text-gray-100 font-medium hover:underline">
                Sign in
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
