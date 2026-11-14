import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  FileText, 
  Filter, 
  Download, 
  Printer, 
  BookOpen,
  Calendar
} from 'lucide-react';

export default function Reports() {
  const { inventory, products, ledger, defective } = useStore();

  // Selected Report template
  const [selectedReport, setSelectedReport] = useState<string>('inventory_status');

  // Filters
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('30'); // last 30 days
  const [now] = useState(() => Date.now());

  // Exporting simulation state
  const [isExporting, setIsExporting] = useState<'pdf' | 'csv' | 'print' | null>(null);

  const reportTemplates = [
    { id: 'inventory_status', name: 'Inventory Status Report', desc: 'Current quantity in stock per SKU and bin locations.' },
    { id: 'stock_movement', name: 'Stock Movement ledger', desc: 'Detailed log of stock check-ins, dispatches and overrides.' },
    { id: 'low_stock', name: 'Low Stock Deficit Report', desc: 'Listing of items currently below warning thresholds.' },
    { id: 'defective_scrap', name: 'Defect Scrap Analysis', desc: 'broken glass panels logs, scrap status and reasons.' },
  ];

  // Dynamic filter sets
  const brands = useMemo(() => {
    const b = new Set(products.map(p => p.brand));
    return ['All', ...Array.from(b)];
  }, [products]);

  // Compiled query results
  const reportData = useMemo(() => {
    if (selectedReport === 'inventory_status') {
      let list = [...inventory];
      if (filterBrand !== 'All') {
        list = list.filter(i => i.brand === filterBrand);
      }
      return list.map(item => ({
        col1: item.sku,
        col2: item.brand,
        col3: item.carModel,
        col4: item.location,
        col5: `${item.goodQty} units`,
        col6: item.status,
      }));
    }

    if (selectedReport === 'stock_movement') {
      let list = [...ledger];
      if (filterBrand !== 'All') {
        list = list.filter(l => l.brand === filterBrand);
      }
      // Date filter
      const cutoff = now - parseInt(filterDateRange) * 24 * 60 * 60 * 1000;
      list = list.filter(l => new Date(l.timestamp).getTime() >= cutoff);
      
      return list.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15).map(item => ({
        col1: new Date(item.timestamp).toLocaleDateString(),
        col2: item.sku,
        col3: item.type.toUpperCase(),
        col4: item.user.split('@')[0],
        col5: `${item.type === 'in' ? '+' : '-'}${item.qty}`,
        col6: item.remarks || '-',
      }));
    }

    if (selectedReport === 'low_stock') {
      let list = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Critical' || i.goodQty === 0);
      if (filterBrand !== 'All') {
        list = list.filter(i => i.brand === filterBrand);
      }
      return list.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const threshold = prod ? prod.lowStockThreshold : 10;
        return {
          col1: item.sku,
          col2: item.brand,
          col3: item.carModel,
          col4: `${threshold} units`,
          col5: `${item.goodQty} units`,
          col6: item.status,
        };
      });
    }

    if (selectedReport === 'defective_scrap') {
      let list = [...defective];
      if (filterBrand !== 'All') {
        list = list.filter(d => d.brand === filterBrand);
      }
      return list.slice(0, 15).map(item => ({
        col1: new Date(item.timestamp).toLocaleDateString(),
        col2: item.sku,
        col3: item.qty.toString(),
        col4: item.reason,
        col5: item.status.toUpperCase(),
        col6: item.shop,
      }));
    }

    return [];
  }, [selectedReport, filterBrand, filterDateRange, inventory, ledger, defective, products]);

  // Headers mapping
  const headers = useMemo(() => {
    switch (selectedReport) {
      case 'inventory_status':
        return ['SKU Code', 'Brand', 'Vehicle Make Fitment', 'Bin Loc', 'Balance Qty', 'Stock Status'];
      case 'stock_movement':
        return ['Timestamp', 'SKU Code', 'Operation', 'Operator', 'Adjustment', 'Remarks'];
      case 'low_stock':
        return ['SKU Code', 'Brand', 'Vehicle Model', 'Alert Limit', 'Available Stock', 'Status'];
      case 'defective_scrap':
        return ['Logged Date', 'SKU Code', 'Damaged Qty', 'Defect Category', 'Resolution', 'Warehouse'];
      default:
        return [];
    }
  }, [selectedReport]);

  // Simulated export function
  const handleExport = (type: 'pdf' | 'csv' | 'print') => {
    setIsExporting(type);
    setTimeout(() => {
      setIsExporting(null);
      
      const reportName = reportTemplates.find(r => r.id === selectedReport)?.name || 'Report';
      useStore.getState().addNotification('success', 'Report Exported', `Successfully prepared and exported ${reportName} in ${type.toUpperCase()} format.`);
      useStore.getState().logActivity(`Exported report: "${reportName}" as ${type.toUpperCase()}`, 'Reports');
      
      if (type === 'print') {
        window.print();
      }
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black tracking-tight text-zinc-800 dark:text-zinc-100">Reports & Analytics Console</h2>
        <p className="text-zinc-500 text-xs dark:text-zinc-400 font-semibold">Compile inventory statistics, audit summaries, defect records, and movement ledgers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Templates list side bar */}
        <div className="lg:col-span-1 flex flex-col">
          <Card className="flex-1 flex flex-col h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                Report Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1 flex-1">
              {reportTemplates.map(rep => (
                <button
                  key={rep.id}
                  onClick={() => { setSelectedReport(rep.id); }}
                  className={`w-full text-left p-3 rounded-lg text-xs transition-colors flex flex-col gap-0.5 font-bold ${
                    selectedReport === rep.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-350'
                  }`}
                >
                  <span>{rep.name}</span>
                  <span className={`text-[10px] ${selectedReport === rep.id ? 'text-indigo-155' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {rep.desc}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel and Filters */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Query Filter configuration */}
          <Card>
            <CardContent className="p-4 flex flex-wrap gap-3 items-center text-xs font-bold">
              <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2">
                <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span className="text-zinc-400 font-medium">Mfg:</span>
                <select 
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="bg-transparent py-1.5 focus:outline-none text-zinc-700 dark:text-zinc-300"
                >
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {selectedReport === 'stock_movement' && (
                <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span className="text-zinc-400 font-medium">Date Range:</span>
                  <select 
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    className="bg-transparent py-1.5 focus:outline-none text-zinc-700 dark:text-zinc-300"
                  >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="ml-auto flex gap-2">
                <button
                  disabled={isExporting !== null}
                  onClick={() => handleExport('csv')}
                  className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-250 px-3.5 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1.5 text-[11px]"
                >
                  {isExporting === 'csv' ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-zinc-700 border-t-transparent" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Export CSV
                </button>
                
                <button
                  disabled={isExporting !== null}
                  onClick={() => handleExport('pdf')}
                  className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-250 px-3.5 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1.5 text-[11px]"
                >
                  {isExporting === 'pdf' ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-zinc-700 border-t-transparent" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  Export PDF
                </button>

                <button
                  disabled={isExporting !== null}
                  onClick={() => handleExport('print')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1.5 text-[11px] shadow-sm"
                >
                  {isExporting === 'print' ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  ) : (
                    <Printer className="h-3.5 w-3.5" />
                  )}
                  Print Report
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Generated Preview Grid */}
          <Card className="shadow-sm">
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-zinc-500 font-semibold select-none whitespace-nowrap">
                    {headers.map((h, idx) => (
                      <th key={idx} className="p-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-805 font-medium text-zinc-700 dark:text-zinc-300">
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={headers.length} className="p-8 text-center text-zinc-400 font-semibold italic">
                        No transactions registered matching this criteria.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10">
                        <td className="p-4 font-bold text-zinc-900 dark:text-white font-mono whitespace-nowrap">{row.col1}</td>
                        <td className="p-4 whitespace-nowrap">{row.col2}</td>
                        <td className="p-4 whitespace-nowrap">{row.col3}</td>
                        <td className="p-4 whitespace-nowrap">{row.col4}</td>
                        <td className="p-4 font-black whitespace-nowrap">{row.col5}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            row.col6 === 'Normal' || row.col6 === 'RESOLVED' || row.col6 === 'RESTORED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-455' 
                              : row.col6 === 'Critical' || row.col6 === 'SCRAPPED' || row.col6 === 'Out Of Stock'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-955/20 dark:text-rose-400' 
                                : 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}>
                            {row.col6}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
}
