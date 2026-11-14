import React, { useState, useMemo } from 'react';
import { useStore, Product } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog } from '../components/ui/dialog';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  User, 
  Truck, 
  FileText, 
  Calendar,
  CheckCircle,
  Undo2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StockOperations() {
  const { products, inventory, stockIn, stockOut, undoLastAction, lastAction } = useStore();
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'in' | 'out'>('in');
  
  // Search Autocomplete State
  const [skuSearch, setSkuSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Common Form States
  const [qty, setQty] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Stock In Form States
  const [vendor, setVendor] = useState('Glass Corp India');
  const [draftMode, setDraftMode] = useState(false);

  // Stock Out Form States
  const [customer, setCustomer] = useState('');
  const [reason, setReason] = useState('Sale Delivery');

  // Confirmation Modals
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{ sku: string; qty: number; type: 'in' | 'out' } | null>(null);

  // Product Autocomplete Filter
  const filteredProducts = useMemo(() => {
    if (!skuSearch.trim()) return [];
    const q = skuSearch.toLowerCase();
    return products.filter(p => p.sku.toLowerCase().includes(q) || p.barcode.includes(q)).slice(0, 5);
  }, [products, skuSearch]);

  // Current selected product stock level lookup
  const currentStock = useMemo(() => {
    if (!selectedProduct) return 0;
    const inv = inventory.find(i => i.productId === selectedProduct.id);
    return inv ? inv.goodQty : 0;
  }, [selectedProduct, inventory]);

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (activeTab === 'in') {
      // Direct execute or draft
      if (draftMode) {
        useStore.getState().addNotification('info', 'Draft Saved', `Saved stock receipt draft for ${qty} units of SKU ${selectedProduct.sku}.`);
        resetForm();
        return;
      }
      stockIn(selectedProduct.sku, qty, vendor, remarks);
      setSuccessDetails({ sku: selectedProduct.sku, qty, type: 'in' });
      setIsSuccessOpen(true);
      resetForm();
    } else {
      // Stock Out requires confirmation step
      if (currentStock < qty) {
        useStore.getState().addNotification('error', 'Insufficient Stock', `Requested ${qty} units but only ${currentStock} are available.`);
        return;
      }
      setIsConfirmOpen(true);
    }
  };

  const handleConfirmStockOut = () => {
    if (!selectedProduct) return;
    stockOut(selectedProduct.sku, qty, customer || 'Walk-in Workshop Customer', reason, remarks);
    setSuccessDetails({ sku: selectedProduct.sku, qty, type: 'out' });
    setIsConfirmOpen(false);
    setIsSuccessOpen(true);
    resetForm();
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setSkuSearch('');
    setQty(1);
    setRemarks('');
    setCustomer('');
    setReason('Sale Delivery');
    setVendor('Glass Corp India');
    setDraftMode(false);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-zinc-800 dark:text-zinc-100">Stock Receipt & Dispatch</h2>
          <p className="text-zinc-500 text-xs dark:text-zinc-400 font-semibold">Perform stock adjustment entries. Dispatch safety glass to technicians or check in vendor shipments.</p>
        </div>

        {/* Undo Action Trigger */}
        {lastAction && (
          <motion.button 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={undoLastAction}
            className="flex items-center gap-1.5 border border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-150 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-3 py-2 rounded-lg transition-all active:scale-95 shadow-md"
          >
            <Undo2 className="h-4 w-4" />
            Undo Last Dispatch
          </motion.button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl max-w-sm w-full">
        <button
          onClick={() => { setActiveTab('in'); resetForm(); }}
          className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'in' ? 'bg-white dark:bg-zinc-850 shadow-sm text-zinc-950 dark:text-white' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <ArrowUpRight className="h-4.5 w-4.5 text-emerald-500" />
          Stock Receipt (In)
        </button>
        <button
          onClick={() => { setActiveTab('out'); resetForm(); }}
          className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'out' ? 'bg-white dark:bg-zinc-850 shadow-sm text-zinc-950 dark:text-white' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <ArrowDownRight className="h-4.5 w-4.5 text-indigo-500" />
          Stock Dispatch (Out)
        </button>
      </div>

      {/* Form Card */}
      <Card className="max-w-2xl shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            
            {/* Search autocomplete select */}
            <div className="relative">
              <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Scan Barcode / Search Catalog SKU</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Scan barcode sticker or search SKU part number..."
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  className="pl-9 pr-4 py-3 w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              {/* Autocomplete list */}
              {skuSearch && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-25 divide-y divide-zinc-105 dark:divide-zinc-850">
                  {filteredProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => { setSelectedProduct(p); setSkuSearch(''); }}
                      className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-zinc-855 dark:text-zinc-200">{p.sku}</p>
                        <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">{p.description}</p>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">{p.barcode}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Product Banner Specs */}
            {selectedProduct && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="text-[9px] uppercase font-bold text-indigo-500 block">Fitment Selection</span>
                  <span className="font-black text-zinc-900 dark:text-zinc-100">{selectedProduct.sku}</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">{selectedProduct.description}</span>
                  <span className="text-[9px] text-zinc-400 font-bold block mt-1.5">Fit: {selectedProduct.compatibleModels.join(', ')}</span>
                </div>
                <div className="text-right border-l border-zinc-200 dark:border-zinc-800 pl-4">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block">Current Qty</span>
                  <span className={`text-2xl font-black ${currentStock === 0 ? 'text-red-500' : 'text-emerald-500'}`}>{currentStock}</span>
                </div>
              </motion.div>
            )}

            {/* Qty and Date inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Transaction Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-9 pr-4 py-2 w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Quantity</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-855 p-2 rounded-lg text-center font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Contextual form options */}
            {activeTab === 'in' ? (
              // Stock In vendor selection
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Vendor Supplier</label>
                <div className="relative">
                  <Truck className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <select
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="pl-9 pr-4 py-2 w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-855 rounded-lg focus:outline-none"
                  >
                    <option value="Glass Corp India">Glass Corp India</option>
                    <option value="Auto Glass Distributors">Auto Glass Distributors</option>
                    <option value="Bharat Safety Glass">Bharat Safety Glass</option>
                    <option value="Apex Automotive Suppliers">Apex Automotive Suppliers</option>
                  </select>
                </div>
              </div>
            ) : (
              // Stock Out customer name
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Recipient Technician / Customer</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Suresh Kumar (Tech)"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-855 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Reason for Dispatch</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-855 p-2.5 rounded-lg focus:outline-none"
                  >
                    <option value="Sale Delivery">Sale Delivery</option>
                    <option value="Internal Workshop">Internal Workshop Fitting</option>
                    <option value="Replacement Warranty">Replacement Warranty Claim</option>
                  </select>
                </div>
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Transaction Remarks</label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Provide reference bill code or consignment details..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="pl-9 pr-4 py-2.5 w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg transition-colors"
              >
                Reset Fields
              </button>

              {activeTab === 'in' ? (
                <>
                  <button
                    type="submit"
                    onClick={() => setDraftMode(true)}
                    className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 font-bold rounded-lg transition-colors"
                  >
                    Save Draft
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-md shadow-emerald-600/10"
                  >
                    Add Stock (In)
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-755 text-white font-bold rounded-lg transition-colors shadow-md shadow-indigo-600/10"
                >
                  Confirm Deduction (Out)
                </button>
              )}
            </div>

          </form>
        </CardContent>
      </Card>

      {/* CONFIRMATION DIALOG MODAL (For Stock Out) */}
      <Dialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirm Stock Dispatch">
        <div className="space-y-4 text-xs font-semibold">
          <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/25 rounded-xl text-rose-800 dark:text-rose-400">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Deduct Stock Confirmation</p>
              <p className="text-[10px] mt-0.5">This action will deduct physical inventory immediately from the database register.</p>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-[11px] bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850">
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-400">SKU Code:</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-200">{selectedProduct?.sku}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-400">Quantity to Deduct:</span>
              <span className="font-black text-rose-550 text-xs">-{qty} units</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-400">Technician Recipient:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{customer}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-400">Dispatch Reason:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{reason}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 bg-zinc-100 dark:bg-zinc-805 hover:bg-zinc-200 py-2 rounded-lg font-bold text-zinc-700 dark:text-zinc-300"
            >
              Cancel Review
            </button>
            <button 
              onClick={handleConfirmStockOut}
              className="flex-1 bg-indigo-600 hover:bg-indigo-705 text-white py-2 rounded-lg font-bold shadow-md"
            >
              Confirm & Dispatch
            </button>
          </div>
        </div>
      </Dialog>

      {/* SUCCESS ANIMATED DIALOG MODAL */}
      <Dialog isOpen={isSuccessOpen} onClose={() => setIsSuccessOpen(false)} title="Transaction Completed">
        <div className="space-y-4 text-xs text-center flex flex-col items-center p-4">
          <motion.div
            initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className={`h-16 w-16 rounded-full flex items-center justify-center ${
              successDetails?.type === 'in' ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600' : 'bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600'
            }`}
          >
            <CheckCircle className="h-10 w-10" />
          </motion.div>

          <div>
            <h4 className="text-sm font-black text-zinc-800 dark:text-white">Inventory Registered successfully!</h4>
            <p className="text-zinc-500 mt-1">
              SKU: <span className="font-mono font-bold text-zinc-700 dark:text-zinc-350">{successDetails?.sku}</span>
            </p>
            <p className="text-zinc-500">
              Quantity: <span className="font-bold text-zinc-700 dark:text-zinc-350">
                {successDetails?.type === 'in' ? '+' : '-'}{successDetails?.qty} units
              </span>
            </p>
          </div>

          <div className="w-full flex gap-2 pt-2">
            {successDetails?.type === 'out' && (
              <button
                onClick={() => { setIsSuccessOpen(false); undoLastAction(); }}
                className="flex-1 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-bold py-2 rounded-lg flex items-center justify-center gap-1"
              >
                <Undo2 className="h-4 w-4" />
                Undo Action
              </button>
            )}
            <button 
              onClick={() => setIsSuccessOpen(false)}
              className="flex-1 bg-zinc-950 dark:bg-zinc-800 hover:bg-zinc-900 dark:hover:bg-zinc-700 text-white py-2 rounded-lg font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
