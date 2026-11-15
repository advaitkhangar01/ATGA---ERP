import React, { useState, useMemo } from 'react';
import { useStore, InventoryRecord, LedgerEntry } from '../store/useStore';
import { Card, CardContent } from '../components/ui/card';
import { BarcodeGenerator } from '../components/ui/barcode-generator';
import { GlassPictogram } from '../components/pictograms';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  ArrowUpDown, 
  ChevronRight, 
  ChevronLeft, 
  X,
  History,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Minus,
  Boxes,
  RotateCcw
} from 'lucide-react';

export default function Inventory() {
  const { inventory, products, ledger, stockIn, stockOut, markDefective } = useStore();
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedGlass, setSelectedGlass] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  // Sorting State
  const [sortField, setSortField] = useState<keyof InventoryRecord>('sku');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Detail Drawer State
  const [selectedItem, setSelectedItem] = useState<InventoryRecord | null>(null);
  
  // Quick Adjust inside Drawer State
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'defective'>('in');
  const [adjustReason, setAdjustReason] = useState('Manual Audit Override');

  // Extract unique filters from inventory list
  const brands = useMemo(() => {
    const b = new Set(inventory.map(i => i.brand));
    return ['All', ...Array.from(b)];
  }, [inventory]);

  const glassTypes = useMemo(() => {
    const g = new Set(inventory.map(i => i.glassType));
    return ['All', ...Array.from(g)];
  }, [inventory]);

  const statuses = ['All', 'Normal', 'Low Stock', 'Critical', 'Out Of Stock'];

  // Handle sorting
  const handleSort = (field: keyof InventoryRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered and Sorted Inventory
  const processedInventory = useMemo(() => {
    let list = [...inventory];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(item => 
        item.sku.toLowerCase().includes(q) || 
        item.carModel.toLowerCase().includes(item.carModel.toLowerCase() && q) ||
        item.location.toLowerCase().includes(q)
      );
    }

    // Dropdown Filters
    if (selectedBrand !== 'All') {
      list = list.filter(item => item.brand === selectedBrand);
    }
    if (selectedGlass !== 'All') {
      list = list.filter(item => item.glassType === selectedGlass);
    }
    if (selectedStatus !== 'All') {
      list = list.filter(item => item.status === selectedStatus);
    }

    // Sort
    list.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return list;
  }, [inventory, search, selectedBrand, selectedGlass, selectedStatus, sortField, sortDirection]);

  // Paginated List
  const totalPages = Math.ceil(processedInventory.length / itemsPerPage) || 1;
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedInventory.slice(start, start + itemsPerPage);
  }, [processedInventory, currentPage]);

  // Reset page if filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedBrand, selectedGlass, selectedStatus]);

  // Product specification lookup for details drawer
  const selectedProductSpecs = useMemo(() => {
    if (!selectedItem) return null;
    return products.find(p => p.id === selectedItem.productId) || null;
  }, [selectedItem, products]);

  // Product specific timeline history
  const selectedItemLedger = useMemo(() => {
    if (!selectedItem) return [];
    return ledger
      .filter(l => l.productId === selectedItem.productId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [selectedItem, ledger]);

  // Quick Adjustment handler inside Drawer
  const handleQuickAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    if (adjustType === 'in') {
      stockIn(selectedItem.sku, adjustQty, 'Shop Override Receipt', adjustReason);
    } else if (adjustType === 'out') {
      stockOut(selectedItem.sku, adjustQty, 'Walk-in Workshop', 'Shop Override Dispatch', adjustReason);
    } else {
      markDefective(selectedItem.sku, adjustQty, adjustReason);
    }

    // Refresh drawer active values
    const updated = inventory.find(inv => inv.productId === selectedItem.productId);
    if (updated) setSelectedItem(updated);

    setAdjustQty(1);
    setAdjustReason('Manual Audit Override');
  };

  const getStatusColor = (status: InventoryRecord['status']) => {
    switch (status) {
      case 'Normal':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'Low Stock':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400';
      case 'Critical':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">Live Inventory Registry</h2>
          <p className="text-zinc-500 text-xs dark:text-zinc-400 font-semibold">Search warehouse stock, track locations, and view physical balance logs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="flex items-center gap-2 border border-slate-300 bg-white text-xs font-bold px-3.5 py-2.5 rounded hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export XLS Sheet</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <Card className="shadow-xs">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search SKU, Vehicle Model, Location, Bin Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-3 w-full text-xs glass-input focus:outline-none font-bold text-zinc-800 dark:text-zinc-100"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Brand Filter */}
            <div className="flex items-center gap-2 glass-input px-3 py-1 bg-white/40 dark:bg-zinc-900/40 text-xs">
              <span className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Mfg:</span>
              <select 
                value={selectedBrand} 
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-transparent py-1.5 focus:outline-none font-extrabold text-zinc-700 dark:text-zinc-300 pr-1 cursor-pointer"
              >
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Glass Type Filter */}
            <div className="flex items-center gap-2 glass-input px-3 py-1 bg-white/40 dark:bg-zinc-900/40 text-xs">
              <span className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Glass:</span>
              <select 
                value={selectedGlass} 
                onChange={(e) => setSelectedGlass(e.target.value)}
                className="bg-transparent py-1.5 focus:outline-none font-extrabold text-zinc-700 dark:text-zinc-300 pr-1 cursor-pointer"
              >
                {glassTypes.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 glass-input px-3 py-1 bg-white/40 dark:bg-zinc-900/40 text-xs">
              <span className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Status:</span>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent py-1.5 focus:outline-none font-extrabold text-zinc-700 dark:text-zinc-300 pr-1 cursor-pointer"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Inventory Table */}
      <Card className="overflow-hidden shadow-xs border border-slate-200 rounded">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none whitespace-nowrap uppercase tracking-wider text-[11px]">
                <th className="p-3 text-center w-12">Pos</th>
                <th onClick={() => handleSort('sku')} className="p-3 cursor-pointer hover:text-slate-900 transition-colors">
                  SKU Code <ArrowUpDown className="h-3.5 w-3.5 inline ml-1" />
                </th>
                <th onClick={() => handleSort('brand')} className="p-3 cursor-pointer hover:text-slate-900 transition-colors">
                  Brand <ArrowUpDown className="h-3.5 w-3.5 inline ml-1" />
                </th>
                <th onClick={() => handleSort('carModel')} className="p-3 cursor-pointer hover:text-slate-900 transition-colors">
                  Model Compatibility <ArrowUpDown className="h-3.5 w-3.5 inline ml-1" />
                </th>
                <th className="p-3">Glass Category</th>
                <th onClick={() => handleSort('goodQty')} className="p-3 text-center cursor-pointer hover:text-slate-900 transition-colors">
                  Good Qty <ArrowUpDown className="h-3.5 w-3.5 inline ml-1" />
                </th>
                <th onClick={() => handleSort('defectiveQty')} className="p-3 text-center cursor-pointer hover:text-slate-900 transition-colors">
                  Defective <ArrowUpDown className="h-3.5 w-3.5 inline ml-1" />
                </th>
                <th onClick={() => handleSort('status')} className="p-3 text-center cursor-pointer hover:text-slate-900 transition-colors">
                  Status <ArrowUpDown className="h-3.5 w-3.5 inline ml-1" />
                </th>
                <th className="p-3"><MapPin className="h-3.5 w-3.5 inline mr-1 text-slate-500" />Rack Bin</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {paginatedInventory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Boxes className="h-8 w-8 text-slate-400" />
                      <p className="font-semibold text-slate-700">No glass inventory matching filter criteria</p>
                      <button
                        onClick={() => { setSearch(''); setSelectedBrand('All'); setSelectedGlass('All'); setSelectedStatus('All'); }}
                        className="inline-flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reset Filters</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInventory.map((item) => (
                  <tr 
                    key={item.productId} 
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center justify-center p-1 bg-slate-50 rounded border border-slate-200">
                        <GlassPictogram glassType={item.glassType} size={18} />
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap text-xs">{item.sku}</td>
                    <td className="p-3 whitespace-nowrap font-semibold text-slate-800">{item.brand}</td>
                    <td className="p-3 whitespace-nowrap text-slate-800">{item.carModel}</td>
                    <td className="p-3 whitespace-nowrap text-slate-600">{item.glassType}</td>
                    <td className="p-3 text-center font-bold text-slate-900 whitespace-nowrap text-xs">{item.goodQty}</td>
                    <td className="p-3 text-center font-bold text-red-600 whitespace-nowrap text-xs">{item.defectiveQty}</td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">{item.location}</td>
                    <td className="p-3 whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedItem(item)}
                        className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-2.5 py-1.5 rounded text-xs transition-colors flex items-center space-x-1 font-semibold cursor-pointer"
                      >
                        <span>Inspect Details</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-zinc-50/50 dark:bg-zinc-900/30 px-4 py-3.5 border-t border-zinc-200/60 dark:border-white/5 flex items-center justify-between text-xs">
          <div className="text-zinc-500 text-xs font-semibold">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedInventory.length)} of {processedInventory.length} SKUs
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-zinc-200/50 dark:border-white/5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 text-zinc-650 dark:text-zinc-400" />
            </button>
            <span className="text-xs px-3 font-extrabold text-zinc-700 dark:text-zinc-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-zinc-200/50 dark:border-white/5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4 text-zinc-650 dark:text-zinc-400" />
            </button>
          </div>
        </div>
      </Card>

      {/* Details Side-Drawer Panel */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Drawer Backdrop */}
          <div
            onClick={() => setSelectedItem(null)}
            className="absolute inset-0 bg-slate-900/60"
          />

          {/* Drawer Container */}
          <div className="absolute inset-y-0 right-0 max-w-xl w-full flex">
            <div className="w-full bg-white border-l border-slate-300 flex flex-col shadow-xl">
              {/* Header */}
                <div className="p-6 border-b border-zinc-150 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
                  <div>
                    <span className="text-[9px] uppercase font-black px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/10">
                      Product Spec Sheet
                    </span>
                    <h3 className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-white mt-2.5">{selectedItem.sku}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-all duration-150"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Visual Stock Levels */}
                  <div className="grid grid-cols-3 gap-3.5">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl text-center shadow-xs">
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">Good Qty</span>
                      <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{selectedItem.goodQty}</span>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl text-center shadow-xs">
                      <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider block">Defective Qty</span>
                      <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{selectedItem.defectiveQty}</span>
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-2xl text-center shadow-xs">
                      <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block">Total Avail</span>
                      <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{selectedItem.availableQty}</span>
                    </div>
                  </div>

                  {/* General Specs */}
                  {selectedProductSpecs && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Product Specs</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200/50 dark:border-white/5">
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400 block font-semibold">Manufacturer Brand</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedProductSpecs.brand}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400 block font-semibold">Glass Segment</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedProductSpecs.glassType}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 dark:text-zinc-500 block">Car Fitment</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedProductSpecs.carBrand} {selectedProductSpecs.carModel}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 dark:text-zinc-500 block">Warehouse Loc</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-indigo-500" />
                            {selectedItem.location}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-zinc-400 dark:text-zinc-500 block">Description</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedProductSpecs.description}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 dark:text-zinc-500 block">Low Threshold Limit</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedProductSpecs.lowStockThreshold} units</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 dark:text-zinc-500 block">Compatible Models</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedProductSpecs.compatibleModels.join(', ')}</span>
                        </div>
                      </div>

                      {/* Barcode Viewer */}
                      <div className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl">
                        <span className="text-[10px] text-zinc-400 block mb-2 uppercase font-semibold">Associated Barcode (Code-128)</span>
                        <BarcodeGenerator value={selectedProductSpecs.barcode || selectedItem.sku} width={220} height={50} />
                      </div>
                    </div>
                  )}

                  {/* Stock Quick Adjustment Form */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5 text-indigo-500" />
                      Quick Stock Adjustment
                    </h4>
                    
                    <form onSubmit={handleQuickAdjust} className="space-y-3 text-xs">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAdjustType('in')}
                          className={`flex-1 py-1.5 rounded-lg border text-center font-bold ${
                            adjustType === 'in' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20' : 'border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                          }`}
                        >
                          Stock In (+)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustType('out')}
                          className={`flex-1 py-1.5 rounded-lg border text-center font-bold ${
                            adjustType === 'out' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/20' : 'border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                          }`}
                        >
                          Stock Out (-)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustType('defective')}
                          className={`flex-1 py-1.5 rounded-lg border text-center font-bold ${
                            adjustType === 'defective' ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/20' : 'border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                          }`}
                        >
                          Defect (!)
                        </button>
                      </div>

                      <div className="flex gap-3 items-center">
                        <div className="w-1/3">
                          <label className="text-[10px] text-zinc-400 block mb-1">Adjust Quantity</label>
                          <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setAdjustQty(q => Math.max(1, q - 1))}
                              className="px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-850"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={adjustQty}
                              onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full text-center bg-transparent focus:outline-none font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => setAdjustQty(q => q + 1)}
                              className="px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-850"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex-1">
                          <label className="text-[10px] text-zinc-400 block mb-1">Audit Remark / Reason</label>
                          <input
                            type="text"
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value)}
                            placeholder="e.g., Damaged during unloading..."
                            className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 bg-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors shadow-md shadow-indigo-600/10"
                      >
                        Apply Stock Correction
                      </button>
                    </form>
                  </div>

                  {/* Stock Ledger History Timeline */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-500" />
                      Stock Movement Timeline
                    </h4>
                    
                    {selectedItemLedger.length === 0 ? (
                      <div className="text-center text-zinc-500 text-xs py-4">
                        No transactions found for this SKU.
                      </div>
                    ) : (
                      <div className="relative pl-4 border-l border-zinc-200 dark:border-zinc-800 space-y-4">
                        {selectedItemLedger.slice(0, 8).map((led) => {
                          const isPlus = led.type === 'in' || led.type === 'defective_restore';
                          const isMinus = led.type === 'out' || led.type === 'defective_scrap' || led.type === 'defective_mark';
                          
                          return (
                            <div key={led.id} className="relative group">
                              {/* Bullet node */}
                              <span className={`absolute -left-[20px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center ${
                                isPlus ? 'bg-emerald-500' : isMinus ? 'bg-red-500' : 'bg-indigo-500'
                              }`} />
                              
                              <div className="text-xs">
                                <div className="flex items-center justify-between font-bold">
                                  <span className="text-zinc-800 dark:text-zinc-200 capitalize">
                                    {led.type.replace('_', ' ')} ({isPlus ? '+' : isMinus ? '-' : ''}{led.qty})
                                  </span>
                                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                                    {new Date(led.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-zinc-500 mt-0.5">{led.remarks || 'Stock transaction adjustment.'}</p>
                                <div className="flex items-center gap-2 mt-1 text-[9px] text-zinc-400 font-semibold uppercase">
                                  <span>User: {led.user.split('@')[0]}</span>
                                  <span>•</span>
                                  <span>Shop: {led.shop}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
