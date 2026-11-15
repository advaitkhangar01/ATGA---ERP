import React, { useState } from 'react';
import { useStore, AuditSession } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog } from '../components/ui/dialog';
import { 
  ClipboardCheck, 
  Play, 
  Scan, 
  AlertTriangle, 
  Check, 
  X,
  FileCheck,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function Audit() {
  const { activeAudit, completedAudits, inventory, startAudit, scanAuditItem, decideAuditItem, reconcileAudit, cancelAudit } = useStore();
  
  // Local form states
  const [sessionName, setSessionName] = useState('');
  const [scanSku, setScanSku] = useState('');
  const [scanQty, setScanQty] = useState(1);

  // Completed past audits list mock if empty
  const defaultPastAudits = [
    { id: 'aud_past_1', name: 'Q1 Glass Stock Check', date: '2026-03-15', reconciledCount: 4, status: 'completed' },
    { id: 'aud_past_2', name: 'Zebra Bin Area B3 Audit', date: '2026-01-20', reconciledCount: 0, status: 'completed' },
  ];

  const pastAudits = completedAudits.length > 0 ? completedAudits : defaultPastAudits;

  // Handle start session
  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim()) return;
    startAudit(sessionName);
    setSessionName('');
  };

  // Handle Scan Item click
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanSku.trim()) return;
    scanAuditItem(scanSku, scanQty);
    setScanSku('');
    setScanQty(1);
    
    // Trigger visual toast
    useStore.getState().addNotification('info', 'Audit Scan Registered', `Scanned ${scanQty} units of ${scanSku}.`);
  };

  // Pick random SKU helper for scanner simulation
  const handleSimulateAuditScan = () => {
    const keys = Object.keys(activeAudit?.scanned || {});
    if (keys.length > 0) {
      const randomSku = keys[Math.floor(Math.random() * keys.length)];
      scanAuditItem(randomSku, 1);
      
      // Beep simulation notification
      useStore.getState().addNotification('info', 'Audit Scan Registered', `Simulated laser read: SKU ${randomSku} (+1)`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black tracking-tight text-zinc-800 dark:text-zinc-100">Stock Audits & Discrepancies</h2>
        <p className="text-zinc-500 text-xs dark:text-zinc-400 font-semibold font-medium">Verify physical assets count against database registers. Align ledger variances.</p>
      </div>

      {!activeAudit ? (
        // STATE 1: Start Session or View History
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Start Form */}
          <Card className="lg:col-span-1 shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b border-zinc-150 dark:border-zinc-850">
              <CardTitle className="text-sm font-black flex items-center gap-1.5">
                <Play className="h-4.5 w-4.5 text-indigo-500" />
                Initialize Audit Session
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs font-semibold flex-1 flex flex-col justify-between">
              <form onSubmit={handleStart} className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Session Name / Scope</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Q2 Windshield Audit, Rack B Shelf 2 Check..."
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-650 hover:bg-indigo-755 text-white font-bold py-2.5 rounded-lg transition-colors shadow-md shadow-indigo-600/10 active:scale-95 mt-4"
                >
                  Start Scanning Session
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Audit History */}
          <Card className="lg:col-span-2 shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b border-zinc-150 dark:border-zinc-850">
              <CardTitle className="text-sm font-black flex items-center gap-1.5">
                <ClipboardCheck className="h-4.5 w-4.5 text-indigo-500" />
                Completed Audits History
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-zinc-500 font-semibold whitespace-nowrap">
                    <th className="p-3">Audit Session Name</th>
                    <th className="p-3">Completion Date</th>
                    <th className="p-3 text-center">Adjusted SKUs</th>
                    <th className="p-3 text-center">Resolution State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-805 font-medium text-zinc-700 dark:text-zinc-300">
                  {pastAudits.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                      <td className="p-3 font-bold text-zinc-900 dark:text-white whitespace-nowrap">{item.name}</td>
                      <td className="p-3 whitespace-nowrap">{item.date}</td>
                      <td className="p-3 text-center font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{item.reconciledCount}</td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 px-2.5 py-0.5 rounded text-[9px] font-black uppercase">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        // STATE 2: Active Session
        <div className="space-y-6">
          
          {/* Active Session Stats and Simulated Scanner Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* Header info */}
            <Card className="lg:col-span-1 shadow-sm border-indigo-500/25 bg-indigo-50/5 flex flex-col justify-between">
              <CardContent className="p-4 flex flex-col justify-between flex-1 min-h-[140px] text-xs">
                <div>
                  <span className="bg-indigo-600 text-white font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                    Live Audit Session
                  </span>
                  <h3 className="text-base font-black text-zinc-850 dark:text-white mt-2">{activeAudit.name}</h3>
                  <p className="text-zinc-400 text-[10px] mt-1 font-semibold">Initiated: {activeAudit.date}</p>
                </div>
                
                <div className="flex gap-2 border-t border-zinc-150 dark:border-zinc-800 pt-3 mt-4">
                  <button
                    onClick={cancelAudit}
                    className="flex-1 py-1.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 font-bold rounded-lg text-[10px] text-zinc-500 active:scale-95 transition-all"
                  >
                    Abort Session
                  </button>
                  <button
                    onClick={reconcileAudit}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-705 text-white font-bold rounded-lg text-[10px] active:scale-95 transition-all flex items-center justify-center gap-1 shadow-md shadow-indigo-600/10"
                  >
                    <FileCheck className="h-3.5 w-3.5" />
                    Reconcile Ledger
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Simulated Scanner scanner input */}
            <Card className="lg:col-span-2 shadow-sm flex flex-col">
              <CardHeader className="pb-3 border-b border-zinc-150 dark:border-zinc-850">
                <CardTitle className="text-xs font-black uppercase text-zinc-450 flex items-center gap-1.5">
                  <Scan className="h-4.5 w-4.5 text-indigo-500" />
                  Simulate Stock Scanner count
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs font-semibold">
                <form onSubmit={handleScanSubmit} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] text-zinc-400 mb-1">Enter Barcode / SKU</label>
                    <input
                      type="text"
                      required
                      placeholder="Scan sticker or type SKU..."
                      value={scanSku}
                      onChange={(e) => setScanSku(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-850 p-2 rounded-lg font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] text-zinc-400 mb-1">Count (+)</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={scanQty}
                      onChange={(e) => setScanQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-850 p-2 rounded-lg text-center font-bold focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-705 text-white font-bold p-2.5 rounded-lg shrink-0 active:scale-95"
                  >
                    Add Count
                  </button>
                </form>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-lg">
                  <span className="text-[10px] text-zinc-500 font-semibold">Auto-laser simulated scanning. Click to add a random SKU count beep:</span>
                  <button
                    onClick={handleSimulateAuditScan}
                    className="bg-red-650 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-lg active:scale-95 flex items-center gap-1.5 shadow-sm text-[10px]"
                  >
                    Simulate Laser Beep
                  </button>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Scanned Items list Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-zinc-700 dark:text-zinc-300">Scanned Stock ledger Verification</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-zinc-500 font-semibold select-none whitespace-nowrap">
                    <th className="p-3">SKU Part Number</th>
                    <th className="p-3 text-center">Expected Count</th>
                    <th className="p-3 text-center">Actual Scanned</th>
                    <th className="p-3 text-center">Variance discrepancy</th>
                    <th className="p-3 text-center">Verification Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium text-zinc-700 dark:text-zinc-300">
                  {Object.entries(activeAudit.scanned).map(([sku, details]) => {
                    const variance = details.actual - details.expected;
                    const hasDiscrepancy = variance !== 0;

                    return (
                      <tr 
                        key={sku} 
                        className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/20 ${
                          hasDiscrepancy && details.status === 'pending' ? 'bg-amber-50/25 dark:bg-amber-955/5' : ''
                        }`}
                      >
                        <td className="p-3 font-bold text-zinc-900 dark:text-white font-mono whitespace-nowrap">{sku}</td>
                        <td className="p-3 text-center text-zinc-400 font-bold whitespace-nowrap">{details.expected}</td>
                        <td className="p-3 text-center font-bold whitespace-nowrap">{details.actual}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {variance === 0 ? (
                            <span className="text-zinc-400 font-bold">-</span>
                          ) : (
                            <span className={`font-black ${variance > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {variance > 0 ? '+' : ''}{variance}
                            </span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {details.status === 'accepted' ? (
                              <span className="text-emerald-500 font-black text-[10px] flex items-center gap-0.5">
                                <Check className="h-3.5 w-3.5" /> Accepted
                              </span>
                            ) : details.status === 'rejected' ? (
                              <span className="text-red-500 font-black text-[10px] flex items-center gap-0.5">
                                <X className="h-3.5 w-3.5" /> Rejected
                              </span>
                            ) : (
                              <>
                                <button 
                                  onClick={() => decideAuditItem(sku, 'accepted')}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 p-1 rounded hover:scale-105 active:scale-95 transition-all"
                                  title="Approve variance"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => decideAuditItem(sku, 'rejected')}
                                  className="bg-red-50 hover:bg-red-100 text-red-550 p-1 rounded hover:scale-105 active:scale-95 transition-all"
                                  title="Reject count mismatch"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
