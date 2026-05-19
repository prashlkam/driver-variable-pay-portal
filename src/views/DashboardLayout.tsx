import React, { useState } from 'react';
import { DriverProfile } from '@/lib/db';
import { SubmitReportView } from './SubmitReportView';
import { LedgerView } from './LedgerView';
import { DashboardOverview } from './DashboardOverview';
import { LayoutDashboard, FileText, Database, UserRound, LogOut } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Props {
  driver: DriverProfile;
  onLogout: () => void;
}

type Tab = 'overview' | 'submit' | 'ledger';

export function DashboardLayout({ driver, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen bg-[#F5F5F4] dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row transition-colors">
      {/* Sidebar - SaaS Landing / Split Layout Vibe mixed with Clean Utility */}
      <aside className="w-full md:w-64 bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between">
          <div>
            <div className="w-10 h-10 bg-gray-900 dark:bg-gray-800 text-white rounded-lg flex items-center justify-center mb-3">
              <LayoutDashboard size={20} />
            </div>
            <h2 className="font-semibold text-lg tracking-tight">Fleet Portal</h2>
            <p className="text-xs text-gray-500 font-mono mt-1 uppercase tracking-wider">{driver.vehiclePlate}</p>
          </div>
          <ThemeToggle />
        </div>

        <nav className="p-4 flex-1 space-y-1">
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <NavItem 
            icon={<FileText size={18} />} 
            label="Submit Report" 
            active={activeTab === 'submit'} 
            onClick={() => setActiveTab('submit')} 
          />
          <NavItem 
            icon={<Database size={18} />} 
            label="Ledger & Invoices" 
            active={activeTab === 'ledger'} 
            onClick={() => setActiveTab('ledger')} 
          />
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-3 mb-2">
              <UserRound size={16} className="text-gray-500 dark:text-gray-400" />
              <div className="text-sm font-medium truncate">{driver.fullName}</div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Base Price Config:</div>
            <div className="font-mono text-xs text-gray-700 dark:text-gray-300">{driver.operatingRegion} • {driver.fuelType}</div>
            <div className="font-mono text-xs text-gray-700 dark:text-gray-300">{formatCurrency(driver.basePrice)}/u</div>
          </div>
          <button onClick={onLogout} className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors w-full px-2 py-1">
            <LogOut size={16} />
            <span>Switch Profile</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 max-w-full overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'overview' && <DashboardOverview driver={driver} onNavToSubmit={() => setActiveTab('submit')} />}
          {activeTab === 'submit' && <SubmitReportView driver={driver} onSuccess={() => setActiveTab('ledger')} />}
          {activeTab === 'ledger' && <LedgerView driver={driver} />}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
