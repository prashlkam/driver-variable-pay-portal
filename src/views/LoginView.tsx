import React, { useState } from 'react';
import { db } from '@/lib/db';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Truck } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Props {
  onLogin: (driverId: number) => void;
  onGoToRegister: () => void;
}

export function LoginView({ onLogin, onGoToRegister }: Props) {
  const [license, setLicense] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const driver = await db.drivers.where('licenseNumber').equals(license.trim()).first();
      if (driver && driver.id) {
        if (driver.password && driver.password !== password) {
          alert("Incorrect password.");
        } else {
          onLogin(driver.id);
        }
      } else {
        alert("Driver not found. Please check your License Number or Register.");
      }
    } catch (error) {
      console.error(error);
      alert('Login failed due to an error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] dark:bg-gray-950 flex items-center justify-center p-4 transition-colors">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <Card className="w-full max-w-md shadow-2xl border-none dark:bg-gray-900">
        <CardHeader className="text-center pb-8 border-b border-gray-100 dark:border-gray-800">
          <div className="mx-auto w-16 h-16 bg-gray-900 dark:bg-gray-800 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Truck size={32} />
          </div>
          <CardTitle className="text-3xl font-display font-medium tracking-tight dark:text-white">Sign In</CardTitle>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Access your Fleet Driver Portal</p>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="license" className="dark:text-gray-300">License Number</Label>
                <Input 
                  id="license" 
                  required 
                  value={license} 
                  onChange={e => setLicense(e.target.value)} 
                  placeholder="DL-14-2021-..." 
                  className="dark:bg-gray-950 dark:border-gray-800 dark:text-white dark:ring-offset-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="dark:bg-gray-950 dark:border-gray-800 dark:text-white dark:ring-offset-gray-900"
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-base dark:bg-white dark:text-gray-900" isLoading={isSubmitting}>
              Access Ledger
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <button type="button" onClick={onGoToRegister} className="text-gray-900 dark:text-gray-100 font-medium hover:underline">
              Register now
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
