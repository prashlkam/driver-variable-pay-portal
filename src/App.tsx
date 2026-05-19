/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DriverProfile } from './lib/db';
import { RegistrationView } from './views/RegistrationView';
import { LoginView } from './views/LoginView';
import { DashboardLayout } from './views/DashboardLayout';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from './components/ThemeProvider';

export default function App() {
  const [activeDriverId, setActiveDriverId] = useState<number | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const drivers = useLiveQuery(() => db.drivers.toArray());

  // Quick auto-login if only one driver exists for simplicity,
  // but let's actually require login step for testing if multiple exist, 
  // or just let them stay on login screen.
  // Actually, we'll auto-login only if they explicitly login or register.
  
  // Wait for db to load
  if (drivers === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E4E3E0] text-gray-500">
         <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const activeDriver = drivers?.find(d => d.id === activeDriverId);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      {activeDriver ? (
        <DashboardLayout driver={activeDriver} onLogout={() => setActiveDriverId(null)} />
      ) : authMode === 'login' ? (
        <LoginView onLogin={(id) => setActiveDriverId(id)} onGoToRegister={() => setAuthMode('register')} />
      ) : (
        <RegistrationView onRegister={(driver) => setActiveDriverId(driver.id!)} onGoToLogin={() => setAuthMode('login')} />
      )}
    </ThemeProvider>
  );
}
