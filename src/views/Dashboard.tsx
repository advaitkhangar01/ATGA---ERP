import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { DonutChart, BarChart, AreaChart } from '../components/ui/chart-mock';
import { useStore, ViewType } from '../store/useStore';
import { motion } from 'framer-motion';
import { 
  Package, 
  Layers, 
  CheckCircle, 
  AlertOctagon, 
  TrendingDown, 
  TrendingUp, 
  Activity, 
  ArrowRight,
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Printer, 
  ClipboardCheck
} from 'lucide-react';

export default function Dashboard() {
  const { products, inventory, ledger, activityLogs, setView } = useStore();

  // Metrics
  const totalProducts = products.length;
  const totalStock = inventory.reduce((sum, item) => sum + item.goodQty, 0);
  const goodStock = totalStock;
  const defectiveStock = inventory.reduce((sum, item) => sum + item.defectiveQty, 0);
  
  const lowStockItems = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Critical');
  const outOfStockItems = inventory.filter(i => i.goodQty === 0);
  
  // Calculate fast moving products from Ledger
  const outTransactions = ledger.filter(l => l.type === 'out');
  const productSales: Record<string, number> = {};
  outTransactions.forEach(t => {
    productSales[t.sku] = (productSales[t.sku] || 0) + t.qty;
  });
  const fastMoving = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Today's Activity count
  const todayStr = new Date().toDateString();
  const todayActivityCount = ledger.filter(l => new Date(l.timestamp).toDateString() === todayStr).length;

  // Chart data calculations
  // 1. Inventory by Brand (Donut)
  const brandStock: Record<string, number> = {};
  inventory.forEach(i => {
    brandStock[i.brand] = (brandStock[i.brand] || 0) + i.goodQty;
  });
  const brandChartData = Object.entries(brandStock).map(([name, value]) => ({
    name,
    value,
    color: name === 'Saint Gobain' ? '#6366f1' : name === 'Clarion' ? '#14b8a6' : '#f59e0b'
  }));

  // 2. Inventory by Car Brand (Bar)
  const carBrandStock: Record<string, number> = {};
  const carBrandDefects: Record<string, number> = {};
  products.forEach(p => {
    const inv = inventory.find(i => i.productId === p.id);
    if (inv) {
      carBrandStock[p.carBrand] = (carBrandStock[p.carBrand] || 0) + inv.goodQty;
      carBrandDefects[p.carBrand] = (carBrandDefects[p.carBrand] || 0) + inv.defectiveQty;
    }
  });
  const carBrandChartData = Object.entries(carBrandStock).slice(0, 6).map(([label, value]) => ({
    label,
    value,
    secondaryVal: carBrandDefects[label] || 0
  }));

  // 3. Stock trend data (last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  });
  const stockTrendData = last7Days.map((day, idx) => ({
    label: day,
    value: totalStock - (150 - idx * 25) + Math.floor(Math.sin(idx) * 40)
  }));
  const defectiveTrendData = last7Days.map((day, idx) => ({
    label: day,
    value: defectiveStock - (10 - idx * 2) + Math.floor(Math.cos(idx) * 4)
  }));

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-600/15 relative overflow-hidden">
        {/* Animated Background Highlights */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none transform translate-x-20 -translate-y-20 animate-pulse" />
        
        <div className="relative z-10">
          <span className="bg-white/15 backdrop-blur-md text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider text-indigo-100 border border-white/10 shadow-sm">
            Live ERP Operations
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-3">Atul Glass Agency</h1>
          <p className="text-indigo-100 text-xs md:text-sm mt-1 font-semibold">Real-time automotive safety glass inventory control and barcode tracking.</p>
        </div>
        <div className="flex flex-wrap gap-2 relative z-10">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('quick-scan')}
            className="flex items-center gap-2 bg-white text-indigo-700 font-extrabold text-xs px-4 py-3 rounded-xl hover:bg-indigo-50 active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            <Activity className="h-4 w-4 text-indigo-600 animate-pulse" />
            Quick Shopfloor Scan
          </motion.button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total SKUs */}
        <Card className="relative overflow-hidden group">
          <div className="absolute right-3 -bottom-3 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-300">
            <Package className="h-28 w-28 text-zinc-950 dark:text-white" />
          </div>
          <CardHeader className="p-5 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-zinc-500 dark:text-zinc-400 text-[10px] font-extrabold uppercase tracking-wider">Total SKUs</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Package className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">{totalProducts}</div>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">Unique catalog entries</p>
          </CardContent>
        </Card>

        {/* Good Stock */}
        <Card className="relative overflow-hidden group">
          <div className="absolute right-3 -bottom-3 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-300">
            <Layers className="h-28 w-28 text-zinc-950 dark:text-white" />
          </div>
          <CardHeader className="p-5 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-zinc-500 dark:text-zinc-400 text-[10px] font-extrabold uppercase tracking-wider">Good Stock</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">{goodStock.toLocaleString()}</div>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Ready for installation</p>
          </CardContent>
        </Card>

        {/* Defective Stock */}
        <Card className="relative overflow-hidden group">
          <div className="absolute right-3 -bottom-3 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-300">
            <AlertOctagon className="h-28 w-28 text-zinc-950 dark:text-white" />
          </div>
          <CardHeader className="p-5 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-zinc-500 dark:text-zinc-400 text-[10px] font-extrabold uppercase tracking-wider">Defective Stock</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertOctagon className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400 mt-1">{defectiveStock}</div>
            <p className="text-[10px] text-rose-600 font-bold mt-1">Transit damaged / Scrap</p>
          </CardContent>
        </Card>

        {/* Low/Out of Stock */}
        <Card className="relative overflow-hidden group">
          <div className="absolute right-3 -bottom-3 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-300">
            <TrendingDown className="h-28 w-28 text-zinc-950 dark:text-white" />
          </div>
          <CardHeader className="p-5 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-zinc-500 dark:text-zinc-400 text-[10px] font-extrabold uppercase tracking-wider">Low/Out of Stock</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400 mt-1">
              {lowStockItems.length} <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">({outOfStockItems.length} out)</span>
            </div>
            <p className="text-[10px] text-amber-600 font-bold mt-1">Immediate orders required</p>
          </CardContent>
        </Card>

      </div>

      {/* Quick Actions Operations Panel */}
      <div className="bg-white/60 dark:bg-[#0d0d12]/50 border border-zinc-200/60 dark:border-white/5 backdrop-blur-md rounded-2xl p-5 shadow-sm">
        <h3 className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3.5">Quick Shopfloor Operations</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[
            { id: 'products', name: 'Add SKU Catalog', icon: PlusCircle },
            { id: 'stock-operations', name: 'Stock Receipt (In)', icon: ArrowUpRight },
            { id: 'stock-operations', name: 'Stock Dispatch (Out)', icon: ArrowDownRight },
            { id: 'audit', name: 'Inventory Audit', icon: ClipboardCheck },
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.button 
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView(action.id as ViewType)}
                className="flex flex-col items-center gap-2.5 p-4 bg-white/40 dark:bg-[#121218]/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl border border-zinc-200/50 dark:border-white/5 transition-all duration-200 cursor-pointer shadow-xs"
              >
                <div className="h-10 w-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/40 dark:border-white/5 flex items-center justify-center text-zinc-600 dark:text-zinc-350 hover:text-indigo-600 hover:border-indigo-500/25">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">{action.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100/50 dark:border-white/5 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Inventory Valuation by Manufacturer</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <DonutChart data={brandChartData} />
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100/50 dark:border-white/5 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Inventory Levels by Vehicle Make</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <BarChart data={carBrandChartData} height={180} color="#10b981" />
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100/50 dark:border-white/5 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Good Stock Movement Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <AreaChart data={stockTrendData} color="#6366f1" />
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100/50 dark:border-white/5 mb-4">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Defective Stock Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <AreaChart data={defectiveTrendData} color="#ef4444" />
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Activity Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <Card className="lg:col-span-1 border-amber-500/25 dark:border-amber-500/10">
          <CardHeader className="pb-3 border-b border-zinc-100/50 dark:border-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-350 flex items-center gap-2 font-black">
              <TrendingDown className="h-4 w-4 text-amber-550" />
              Low Stock Alerts
            </CardTitle>
            <button onClick={() => setView('low-stock')} className="text-[10px] text-indigo-500 hover:text-indigo-700 transition-colors flex items-center font-extrabold uppercase tracking-wider">
              View All <ArrowRight className="h-3 w-3 ml-0.5" />
            </button>
          </CardHeader>
          <CardContent className="p-0 max-h-[300px] overflow-y-auto">
            {lowStockItems.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs font-bold italic">
                All stock levels are optimal.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100/60 dark:divide-white/5">
                {lowStockItems.slice(0, 6).map((item) => (
                  <div key={item.sku} className="p-3.5 flex items-center justify-between text-xs hover:bg-zinc-50/60 dark:hover:bg-zinc-900/20 transition-all">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{item.sku}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{item.carModel} • {item.glassType}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        item.status === 'Critical' 
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}>
                        Qty: {item.goodQty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fast Moving SKUs */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 border-b border-zinc-100/50 dark:border-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-350 flex items-center gap-2 font-black">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Fast Moving Glass
            </CardTitle>
            <button onClick={() => setView('reports')} className="text-[10px] text-indigo-500 hover:text-indigo-700 transition-colors flex items-center font-extrabold uppercase tracking-wider">
              Reports <ArrowRight className="h-3 w-3 ml-0.5" />
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {fastMoving.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs font-bold italic">
                No movements recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100/60 dark:divide-white/5">
                {fastMoving.map(([sku, qty], idx) => {
                  const prod = products.find(p => p.sku === sku);
                  return (
                    <div key={sku} className="p-3.5 flex items-center gap-3.5 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/20 transition-all">
                      <span className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] flex items-center justify-center font-extrabold border border-emerald-500/10">
                        #{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-zinc-800 dark:text-zinc-200 truncate">{sku}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{prod?.carBrand} {prod?.carModel} • {prod?.glassType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">+{qty} units</p>
                        <p className="text-[9px] text-zinc-450 font-semibold uppercase tracking-wider">dispatched</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
 
        {/* Recent Activities */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 border-b border-zinc-100/50 dark:border-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-350 flex items-center gap-2 font-black">
              <Activity className="h-4 w-4 text-indigo-500" />
              System Logs
            </CardTitle>
            <button onClick={() => setView('activity-logs')} className="text-[10px] text-indigo-500 hover:text-indigo-700 transition-colors flex items-center font-extrabold uppercase tracking-wider">
              View All <ArrowRight className="h-3 w-3 ml-0.5" />
            </button>
          </CardHeader>
          <CardContent className="p-0 max-h-[300px] overflow-y-auto">
            <div className="divide-y divide-zinc-100/60 dark:divide-white/5">
              {activityLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="p-3.5 text-xs hover:bg-zinc-50/60 dark:hover:bg-zinc-900/20 transition-all flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 truncate w-3/4">{log.action}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-extrabold border ${
                      log.status === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                    <span>{log.user} • {log.module}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
