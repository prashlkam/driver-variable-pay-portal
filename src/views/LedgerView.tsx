import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DriverProfile, MonthlyReport } from '@/lib/db';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input, Label, Badge } from '@/components/ui/Input';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FileDown, HandCoins, AlertCircle, X, Download } from 'lucide-react';

interface Props {
  driver: DriverProfile;
}

export function LedgerView({ driver }: Props) {
  const reports = useLiveQuery(
    () => db.reports.where('driverId').equals(driver.id!).reverse().sortBy('monthString'),
    [driver.id]
  );
  
  const [selectedReportForDispute, setSelectedReportForDispute] = useState<MonthlyReport | null>(null);
  const [disputeForm, setDisputeForm] = useState({
    disputeTitle: '',
    disputeSummary: '',
    disputeDescription: '',
    disputeAmount: '',
    disputeStatus: 'open' as 'open' | 'settled' | 'closed' | 'pending'
  });

  const [selectedReportForPayment, setSelectedReportForPayment] = useState<MonthlyReport | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    comments: ''
  });

  const generatePDF = (report: MonthlyReport) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text('Variable Pay Invoice', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Driver Details
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text('Driver Information', 14, 45);
    autoTable(doc, {
      startY: 50,
      head: [['Attribute', 'Value']],
      body: [
        ['Full Name', driver.fullName],
        ['License Number', driver.licenseNumber],
        ['Vehicle Plate', driver.vehiclePlate],
        ['Operating Region', driver.operatingRegion],
        ['Fuel Type / Efficiency', `${driver.fuelType} (${driver.fuelEfficiency} units)`],
        ['Locked Base Price', formatCurrency(driver.basePrice)],
      ],
      theme: 'plain',
      styles: { cellPadding: 2, fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
    });

    // Report Details
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.text(`Billing Period: ${report.monthString}`, 14, finalY);
    
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Metric', 'Reported Value', 'Calculated Value']],
      body: [
        ['Total Trips', report.totalTrips.toString(), '-'],
        ['Total Distance (km)', report.totalKm.toString(), '-'],
        ['Out of Pocket Fuel', formatCurrency(report.totalFuelCost), '-'],
        ['Estimated Consumption', '-', `${(report.totalKm / driver.fuelEfficiency).toFixed(2)} L/kg`],
        ['Baseline Cost Projection', '-', formatCurrency((report.totalKm / driver.fuelEfficiency) * report.basePriceUsed)],
        ['Net Variable Pay Surcharge', '-', formatCurrency(report.calculatedVariablePay)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [20, 20, 20] },
      styles: { cellPadding: 4 }
    });

    // Footer Status
    const statusY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.text(`Status: ${report.status}`, 14, statusY);
    doc.text(`Amount Paid: ${formatCurrency(report.amountPaid)}`, 14, statusY + 8);
    doc.text(`Balance Forwarded: ${formatCurrency(report.balanceForwarded)}`, 14, statusY + 16);

    doc.save(`Invoice_${driver.vehiclePlate}_${report.monthString}.pdf`);
  };

  const openPaymentModal = (report: MonthlyReport) => {
    setSelectedReportForPayment(report);
    setPaymentForm({
      amount: report.balanceForwarded.toString(),
      paymentDate: new Date().toISOString().split('T')[0],
      comments: ''
    });
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForPayment) return;

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0 || amount > selectedReportForPayment.balanceForwarded) {
      alert("Invalid payment amount. Cannot exceed pending balance.");
      return;
    }

    const newAmountPaid = selectedReportForPayment.amountPaid + amount;
    const newBalance = selectedReportForPayment.calculatedVariablePay - newAmountPaid;
    let newStatus = selectedReportForPayment.status;
    
    if (newBalance <= 0) newStatus = 'PAID';
    else if (newAmountPaid > 0 && newStatus !== 'DISPUTED') newStatus = 'PARTIAL';

    await db.reports.update(selectedReportForPayment.id!, {
      amountPaid: newAmountPaid,
      balanceForwarded: Math.max(0, newBalance),
      status: newStatus,
      lastPaymentDate: paymentForm.paymentDate,
      lastPaymentComments: paymentForm.comments
    });
    
    setSelectedReportForPayment(null);
  };

  const openDisputeModal = (report: MonthlyReport) => {
    setSelectedReportForDispute(report);
    setDisputeForm({
      disputeTitle: report.disputeTitle || '',
      disputeSummary: report.disputeSummary || '',
      disputeDescription: report.disputeDescription || '',
      disputeAmount: report.disputeAmount?.toString() || report.balanceForwarded.toString(),
      disputeStatus: report.disputeStatus || 'open'
    });
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForDispute) return;

    await db.reports.update(selectedReportForDispute.id!, {
      status: 'DISPUTED',
      disputeTitle: disputeForm.disputeTitle,
      disputeSummary: disputeForm.disputeSummary,
      disputeDescription: disputeForm.disputeDescription,
      disputeAmount: parseFloat(disputeForm.disputeAmount) || 0,
      disputeStatus: disputeForm.disputeStatus,
      disputeReason: disputeForm.disputeSummary // fallback for legacy view
    });
    
    setSelectedReportForDispute(null);
  };

  const exportToExcel = () => {
    if (!reports || reports.length === 0) return;

    const data = reports.map(r => ({
      'Billing Period': r.monthString,
      'Total Trips': r.totalTrips,
      'Total Distance (km)': r.totalKm,
      'Out of Pocket Fuel': r.totalFuelCost,
      'Net Variable Pay': r.calculatedVariablePay,
      'Amount Paid': r.amountPaid,
      'Balance Forwarded': r.balanceForwarded,
      'Status': r.status,
      'Dispute Reason': r.disputeReason || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger');
    XLSX.writeFile(workbook, `Ledger_${driver.vehiclePlate}.xlsx`);
  };

  if (!reports) return <div className="p-8 text-gray-500">Loading ledger...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight mb-2 dark:text-white">Immutable Ledger</h1>
          <p className="text-gray-500 dark:text-gray-400">Double-entry view of billing periods, partial payments, and PDF generation.</p>
        </div>
        <Button variant="outline" onClick={exportToExcel} className="shrink-0 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700">
          <Download className="mr-2 h-4 w-4" /> Export to Excel
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[24px] border border-gray-200 dark:border-gray-800 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Technical Dashboard / Data Grid Style */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-6 p-4 border-b border-gray-900 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 uppercase text-[11px] font-serif italic text-gray-500 dark:text-gray-400 tracking-wider">
              <div>Billing Period</div>
              <div>Metrics</div>
              <div>Net Surcharge</div>
              <div>Status & Balance</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {reports.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500 font-mono">No entries recorded yet.</div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="grid grid-cols-6 p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-800/80 transition-colors group items-center">
                   <div className="font-mono font-medium">{report.monthString}</div>
                   <div>
                     <div className="text-sm">{report.totalKm} km</div>
                     <div className="text-[10px] opacity-70 mt-1 uppercase tracking-wider">{report.totalTrips} trips</div>
                   </div>
                   <div className="font-mono font-medium text-emerald-600 group-hover:text-emerald-400">
                     {formatCurrency(report.calculatedVariablePay)}
                   </div>
                   <div>
                     <Badge 
                       variant={report.status === 'PAID' ? 'success' : report.status === 'DISPUTED' ? 'error' : report.status === 'PARTIAL' ? 'warning' : 'default'}
                       className="mb-1"
                     >
                       {report.status}
                     </Badge>
                     {report.balanceForwarded > 0 && (
                       <div className="text-[10px] font-mono opacity-80 mt-1">Pending: {formatCurrency(report.balanceForwarded)}</div>
                     )}
                     {report.status === 'DISPUTED' && report.disputeReason && (
                       <div className="text-[10px] text-red-400 mt-1 truncate max-w-[160px] font-medium" title={report.disputeReason}>
                         Reason: {report.disputeReason}
                       </div>
                     )}
                   </div>
                   <div className="col-span-2 flex justify-end space-x-2">
                     <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 bg-white group-hover:bg-gray-800 group-hover:text-white group-hover:border-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:group-hover:bg-gray-700 dark:hover:text-white" onClick={() => openDisputeModal(report)}>
                       <AlertCircle size={14} className="mr-1.5" /> {report.status === 'DISPUTED' ? 'Edit Dispute' : 'Dispute'}
                     </Button>
                     {report.status !== 'PAID' && (
                       <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 bg-white group-hover:bg-gray-800 group-hover:text-white group-hover:border-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:group-hover:bg-gray-700 dark:hover:text-white" onClick={() => openPaymentModal(report)}>
                         <HandCoins size={14} className="mr-1.5" /> Recv. Payout
                       </Button>
                     )}
                     <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 bg-white group-hover:bg-gray-800 group-hover:text-white group-hover:border-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:group-hover:bg-gray-700 dark:hover:text-white" onClick={() => generatePDF(report)}>
                       <FileDown size={14} className="mr-1.5" /> Invoice PDF
                     </Button>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedReportForDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-display font-medium dark:text-white">Record Dispute</h2>
              <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => setSelectedReportForDispute(null)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleDisputeSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="disputeTitle" className="dark:text-gray-300">Dispute Title</Label>
                <Input id="disputeTitle" required value={disputeForm.disputeTitle} onChange={e => setDisputeForm({...disputeForm, disputeTitle: e.target.value})} placeholder="E.g., Missing Fuel Rebate" className="dark:bg-gray-950 dark:border-gray-800 dark:text-white" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="disputeSummary" className="dark:text-gray-300">Short Summary</Label>
                <Input id="disputeSummary" required value={disputeForm.disputeSummary} onChange={e => setDisputeForm({...disputeForm, disputeSummary: e.target.value})} placeholder="Brief 1-line explanation" className="dark:bg-gray-950 dark:border-gray-800 dark:text-white"  />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disputeDescription" className="dark:text-gray-300">Detailed Description</Label>
                <textarea 
                  id="disputeDescription" 
                  rows={3}
                  className="flex w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 transition-all resize-none dark:bg-gray-950 dark:border-gray-800 dark:text-white"
                  value={disputeForm.disputeDescription} 
                  onChange={e => setDisputeForm({...disputeForm, disputeDescription: e.target.value})} 
                  placeholder="Provide detailed evidence..." 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disputeAmount" className="dark:text-gray-300">Disputed Amount (₹)</Label>
                <Input id="disputeAmount" type="number" step="0.01" min="0" required value={disputeForm.disputeAmount} onChange={e => setDisputeForm({...disputeForm, disputeAmount: e.target.value})} className="dark:bg-gray-950 dark:border-gray-800 dark:text-white" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disputeStatus" className="dark:text-gray-300">Dispute Status</Label>
                <select 
                  id="disputeStatus" 
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 transition-all cursor-pointer dark:bg-gray-950 dark:border-gray-800 dark:text-white"
                  value={disputeForm.disputeStatus}
                  onChange={e => setDisputeForm({...disputeForm, disputeStatus: e.target.value as any})}
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="settled">Settled</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="pt-4 flex space-x-3">
                <Button type="button" variant="outline" className="flex-1 dark:border-gray-700 dark:text-gray-300" onClick={() => setSelectedReportForDispute(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 dark:bg-white dark:text-gray-900">
                  Save Dispute
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedReportForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-display font-medium dark:text-white">Record Payout</h2>
              <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => setSelectedReportForPayment(null)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentAmount" className="dark:text-gray-300">Amount Received (₹)</Label>
                <Input id="paymentAmount" type="number" step="0.01" min="0" required value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="dark:bg-gray-950 dark:border-gray-800 dark:text-white" />
                <div className="text-xs text-gray-500">Max allowable: {selectedReportForPayment.balanceForwarded}</div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentDate" className="dark:text-gray-300">Date of Payment</Label>
                <Input id="paymentDate" type="date" required value={paymentForm.paymentDate} onChange={e => setPaymentForm({...paymentForm, paymentDate: e.target.value})} className="dark:bg-gray-950 dark:border-gray-800 dark:text-white" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentComments" className="dark:text-gray-300">Comments</Label>
                <textarea 
                  id="paymentComments" 
                  rows={3}
                  className="flex w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 transition-all resize-none dark:bg-gray-950 dark:border-gray-800 dark:text-white"
                  value={paymentForm.comments} 
                  onChange={e => setPaymentForm({...paymentForm, comments: e.target.value})} 
                  placeholder="Reference number or notes..." 
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <Button type="button" variant="outline" className="flex-1 dark:border-gray-700 dark:text-gray-300" onClick={() => setSelectedReportForPayment(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 dark:bg-white dark:text-gray-900">
                  Confirm Payout
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
