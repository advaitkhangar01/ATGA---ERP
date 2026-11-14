import React, { useState, useMemo } from 'react';
import { useStore, DefectiveRecord } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, AreaChart } from '../components/ui/chart-mock';
import { 
  AlertTriangle, 
  Trash2, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  FileSpreadsheet
} from 'lucide-react';

export default function Defective() {
  const { defective, products, scrapDefective, restoreDefective } = useStore();

  const [filterStatus, setFilterStatus] = useState<'All' | 'reported' | 'scrapped' | 'restored'>('All');

  // Metrics
  const totalReported = defective.reduce((sum, d) => sum + d.qty, 0);
  const activeDefects = defective.filter(d => d.status === 'reported').reduce((sum, d) => sum + d.qty, 0);
  const totalScrapped = defective.filter(d => d.status === 'scrapped').reduce((sum, d) => sum + d.qty, 0);
  const totalRestored = defective.filter(d => d.status === 'restored').reduce((sum, d) => sum + d.qty, 0);

  const scrapRate = totalReported > 0 ? ((totalScrapped / totalReported) * 100).toFixed(0) : 0;

  // Filter list
  const filteredList = useMemo(() => {
    if (filterStatus === 'All') return defective;
    return defective.filter(d => d.status === filterStatus);
  }, [defective, filterStatus]);

  // Chart data
  // 1. Brand wise defective comparison
  const brandDefectCounts: Record<string, number> = {};
  defective.forEach(d => {
    brandDefectCounts[d.brand] = (brandDefectCounts[d.brand] || 0) + d.qty;
  });
  const brandChartData = Object.entries(brandDefectCounts).map(([label, value]) => ({
    label,
    value,
  }));

  // 2. Defect trend
  const defectTrendData = [
    { label: 'Jan', value: 20 },
    { label: 'Feb', value: 25 },
    { label: 'Mar', value: 18 },
    { label: 'Apr', value: 30 },
    { label: 'May', value: 22 },
    { label: 'Jun', value: activeDefects },
  ];

  const getStatusColor = (status: DefectiveRecord['status']) => {
    switch (status) {
      case 'reported':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400';
      case 'scrapped':
        return 'bg-red-105 text-red-800 dark:bg-red-950/20 dark:text-red-400';
      case 'restored':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-zinc-805 dark:text-zinc-100">Defective Glass panel log</h2>
          <p className="text-zinc-500 text-xs dark:text-zinc-400 font-semibold">Track parts broken in transit or install failures. Authorize write-offs and scrap returns.</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Reported Damages</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-black">{totalReported} units</div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Historical accumulated log</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Active Defects</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-black text-amber-500">{activeDefects} units</div>
            <p className="text-[9px] text-amber-500 font-bold mt-0.5">Pending inspection write-off</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Scrapped/Written-off</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-black text-rose-500">{totalScrapped} units</div>
            <p className="text-[9px] text-rose-500 font-bold mt-0.5">{scrapRate}% write-off conversion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Restored to Good</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-black text-emerald-500">{totalRestored} units</div>
            <p className="text-[9px] text-emerald-500 font-bold mt-0.5">Cleaned & verified fit for sale</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-black">Monthly Defects Trend (Active Log)</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart data={defectTrendData} color="#f59e0b" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-black">Damaged Quantity by Glass Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={brandChartData} height={180} color="#f59e0b" />
          </CardContent>
        </Card>
      </div>

      {/* Main Table logs */}
      <Card>
        <CardHeader className="pb-3 border-b border-zinc-150 dark:border-zinc-850 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black flex items-center gap-1.5">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
            Defective Inventory ledger
          </CardTitle>

          {/* Status filters */}
          <div className="flex gap-1.5 text-[10px]">
            {['All', 'reported', 'scrapped', 'restored'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st as any)}
                className={`px-2.5 py-1 rounded-md capitalize font-black ${
                  filterStatus === st ? 'bg-zinc-900 text-white dark:bg-zinc-800' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </CardHeader>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-zinc-500 font-semibold select-none whitespace-nowrap">
                <th className="p-3">SKU Part Number</th>
                <th className="p-3">Brand</th>
                <th className="p-3 text-center">Damage Qty</th>
                <th className="p-3">Reason / Defect Category</th>
                <th className="p-3">Date Logged</th>
                <th className="p-3 text-center">Resolution State</th>
                <th className="p-3 text-center">Inspected Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium text-zinc-700 dark:text-zinc-300">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No defects recorded for selection.
                  </td>
                </tr>
              ) : (
                filteredList.slice(0, 15).map((def) => (
                  <tr key={def.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                    <td className="p-3 font-bold text-zinc-900 dark:text-white whitespace-nowrap">{def.sku}</td>
                    <td className="p-3 whitespace-nowrap">{def.brand}</td>
                    <td className="p-3 text-center font-bold text-rose-500 whitespace-nowrap">{def.qty}</td>
                    <td className="p-3 whitespace-nowrap">{def.reason}</td>
                    <td className="p-3 whitespace-nowrap">{new Date(def.timestamp).toLocaleDateString()}</td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${getStatusColor(def.status)}`}>
                        {def.status}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {def.status === 'reported' ? (
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => restoreDefective(def.id, def.qty)}
                            className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-455 p-1.5 rounded-md hover:scale-105 active:scale-95 transition-all"
                            title="Restore Stock to Good"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => scrapDefective(def.id)}
                            className="bg-red-55 hover:bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-405 p-1.5 rounded-md hover:scale-105 active:scale-95 transition-all"
                            title="Scrap written-off panels"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-[10px] text-zinc-400 font-semibold italic">Resolved</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
