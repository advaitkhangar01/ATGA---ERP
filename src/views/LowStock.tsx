import React, { useState, useMemo } from 'react';
import { useStore, InventoryRecord } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  TrendingDown, 
  AlertTriangle, 
  Settings, 
  BellRing, 
  ShieldAlert,
  Save
} from 'lucide-react';

export default function LowStock() {
  const { inventory, products, settings, updateSettings, addNotification } = useStore();
  
  // Rule Config Local States
  const [globalThreshold, setGlobalThreshold] = useState(settings.audit.autoReconcileLimit || 8);
  const [isSaved, setIsSaved] = useState(false);

  // Group items by state
  const outOfStock = useMemo(() => inventory.filter(i => i.goodQty === 0), [inventory]);
  const criticalStock = useMemo(() => inventory.filter(i => i.status === 'Critical'), [inventory]);
  const lowStock = useMemo(() => inventory.filter(i => i.status === 'Low Stock'), [inventory]);
  const normalStock = useMemo(() => inventory.filter(i => i.status === 'Normal'), [inventory]);

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings('audit', { autoReconcileLimit: globalThreshold });
    
    setIsSaved(true);
    addNotification('info', 'Alert Rules Updated', `Global default low stock warning threshold adjusted to ${globalThreshold} units.`);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-zinc-800 dark:text-zinc-100">Low Stock Alert Center</h2>
          <p className="text-zinc-500 text-xs dark:text-zinc-400 font-semibold">Review inventory deficits. Define global alert triggers and custom replenishment alerts.</p>
        </div>
      </div>

      {/* Grid of Alert States */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-black items-stretch">
        <Card className="border-red-500/25 bg-red-50/10 h-full flex flex-col">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-red-650 dark:text-red-400 font-bold uppercase tracking-wider text-[10px]">Out Of Stock</CardTitle>
            <ShieldAlert className="h-4.5 w-4.5 text-red-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
            <div className="text-2xl font-black text-red-600 dark:text-red-400">{outOfStock.length} SKUs</div>
            <p className="text-[9px] text-red-405 mt-1 font-semibold">Zero balance in bin location</p>
          </CardContent>
        </Card>

        <Card className="border-rose-500/25 bg-rose-50/10 h-full flex flex-col">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-rose-655 dark:text-rose-450 font-bold uppercase tracking-wider text-[10px]">Critical State</CardTitle>
            <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{criticalStock.length} SKUs</div>
            <p className="text-[9px] text-rose-500 mt-1 font-semibold">Under 50% of threshold limit</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/25 bg-amber-50/10 h-full flex flex-col">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-[10px]">Low Stock Warning</CardTitle>
            <TrendingDown className="h-4.5 w-4.5 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{lowStock.length} SKUs</div>
            <p className="text-[9px] text-amber-500 mt-1 font-semibold">Approaching safety margin limit</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/25 bg-emerald-50/10 h-full flex flex-col">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-emerald-650 dark:text-emerald-455 font-bold uppercase tracking-wider text-[10px]">Healthy Levels</CardTitle>
            <BellRing className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{normalStock.length} SKUs</div>
            <p className="text-[9px] text-emerald-505 mt-1 font-semibold">Optimal warehouse balances</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Alerts List */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 flex flex-col h-full">
            <CardHeader className="pb-3 border-b border-zinc-150 dark:border-zinc-850">
              <CardTitle className="text-sm font-black flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                Active Deficit SKUs list
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto text-xs flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-zinc-500 font-semibold select-none">
                    <th className="p-3">SKU Code</th>
                    <th className="p-3">Model</th>
                    <th className="p-3 text-center">Good Qty</th>
                    <th className="p-3 text-center">Threshold</th>
                    <th className="p-3 text-center">Deficit %</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium text-zinc-700 dark:text-zinc-300">
                  {[...outOfStock, ...criticalStock, ...lowStock].slice(0, 12).map((item) => {
                    const prod = products.find(p => p.id === item.productId);
                    const threshold = prod ? prod.lowStockThreshold : 10;
                    const deficitPct = threshold > 0 ? (((threshold - item.goodQty) / threshold) * 100).toFixed(0) : 100;
                    
                    return (
                      <tr key={item.sku} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                        <td className="p-3 font-bold text-zinc-900 dark:text-white">{item.sku}</td>
                        <td className="p-3">{item.carModel}</td>
                        <td className="p-3 text-center font-black">{item.goodQty}</td>
                        <td className="p-3 text-center text-zinc-400">{threshold}</td>
                        <td className="p-3 text-center text-red-500 font-bold">{deficitPct}%</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            item.goodQty === 0 
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' 
                              : item.status === 'Critical' 
                                ? 'bg-rose-105 text-rose-800 dark:bg-rose-955/20 dark:text-rose-455' 
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400'
                          }`}>
                            {item.goodQty === 0 ? 'Out' : item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Rules Config Panel */}
        <div className="lg:col-span-1 flex flex-col">
          <Card className="flex-1 flex flex-col h-full">
            <CardHeader className="pb-3 border-b border-zinc-155 dark:border-zinc-850">
              <CardTitle className="text-sm font-black flex items-center gap-1.5 text-zinc-700 dark:text-zinc-350">
                <Settings className="h-4.5 w-4.5 text-indigo-500" />
                Alert Trigger Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs font-bold flex-1 flex flex-col justify-between">
              <form onSubmit={handleSaveRules} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Global Min Safety Buffer</label>
                  <input
                    type="number"
                    min={1}
                    value={globalThreshold}
                    onChange={(e) => setGlobalThreshold(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-center"
                  />
                  <span className="text-[9px] text-zinc-500 font-semibold block mt-1.5">Triggers warning flags when item drops below this quantity if no product threshold is defined.</span>
                </div>

                <div className="space-y-2.5 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Channel Settings</span>
                  
                  <div className="flex items-center justify-between">
                    <span>Low Stock Dashboard Banners</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 accent-indigo-650 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Critical Alert Popups</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 accent-indigo-655 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Consolidated Email Digest</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-indigo-655 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
                >
                  <Save className="h-4 w-4" />
                  {isSaved ? 'Settings Saved!' : 'Save Trigger Rules'}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
