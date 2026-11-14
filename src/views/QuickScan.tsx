import React, { useState, useMemo } from 'react';
import { useStore, Product } from '../store/useStore';
import { Card, CardContent } from '../components/ui/card';
import { Dialog } from '../components/ui/dialog';
import { BarcodeGenerator } from '../components/ui/barcode-generator';
import { 
  Scan, 
  Plus, 
  Minus, 
  AlertTriangle, 
  Info, 
  Sparkles,
  Volume2
} from 'lucide-react';
import { motion } from 'framer-motion';

function getRandomProduct<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export default function QuickScan() {
  const { products, inventory, stockIn, stockOut, markDefective } = useStore();

  // Simulated scan state
  const [scanInput, setScanInput] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(products[0] || null);
  const [beepTrigger, setBeepTrigger] = useState(false);
  
  // Defective Modal state
  const [isDefectOpen, setIsDefectOpen] = useState(false);
  const [defectQty, setDefectQty] = useState(1);
  const [defectReason, setDefectReason] = useState('Chipped Corner');

  // Look up inventory details for active product
  const activeInventory = useMemo(() => {
    if (!activeProduct) return null;
    return inventory.find(i => i.productId === activeProduct.id) || null;
  }, [activeProduct, inventory]);

  // Handle Simulated scan input
  const handleScanInput = (val: string) => {
    const found = products.find(p => p.sku === val || p.barcode === val);
    if (found) {
      setActiveProduct(found);
      triggerBeepAnimation();
    }
    setScanInput('');
  };

  // Simulate a hardware scanner scan button click (picks a random product)
  const handleSimulateHardwareScan = () => {
    const randomProd = getRandomProduct(products);
    if (randomProd) {
      setActiveProduct(randomProd);
      triggerBeepAnimation();
    }
  };

  const triggerBeepAnimation = () => {
    setBeepTrigger(true);
    setTimeout(() => setBeepTrigger(false), 300);
  };

  // Large Button handlers
  const handleAddStock = (amt: number) => {
    if (!activeProduct) return;
    stockIn(activeProduct.sku, amt, 'Shopfloor Quick Scan', 'Quick Scan Add');
    triggerBeepAnimation();
  };

  const handleRemoveStock = (amt: number) => {
    if (!activeProduct || !activeInventory) return;
    if (activeInventory.goodQty < amt) {
      useStore.getState().addNotification('error', 'Deduction Denied', `Cannot deduct ${amt} units. Insufficient stock.`);
      return;
    }
    stockOut(activeProduct.sku, amt, 'Shopfloor Technician Dispatch', 'Quick Scan Deduct', 'Quick Scan Deduction');
    triggerBeepAnimation();
  };

  const handleMarkDefectiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !activeInventory) return;
    if (activeInventory.goodQty < defectQty) return;

    markDefective(activeProduct.sku, defectQty, defectReason);
    setIsDefectOpen(false);
    setDefectQty(1);
    triggerBeepAnimation();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">Shop-Floor Barcode Terminal</h2>
        <p className="text-zinc-500 text-xs dark:text-zinc-400 font-semibold">Touch-optimized interfaces. Connect USB scanners or simulate laser barcode reading below.</p>
      </div>

      {/* Laser Beep Simulator Banner */}
      <motion.div
        animate={beepTrigger ? { 
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
          color: '#ffffff',
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)'
        } : {}}
        transition={{ duration: 0.15 }}
        className="glass-panel-glow p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden"
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 border ${
            beepTrigger 
              ? 'bg-white/20 border-white/20 text-white' 
              : 'bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/10 text-indigo-600 dark:text-indigo-400'
          }`}>
            <Scan className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className={`font-extrabold text-sm ${beepTrigger ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>Simulate Barcode Scanner</h3>
            <p className={`text-[10px] ${beepTrigger ? 'text-indigo-100' : 'text-zinc-500 dark:text-zinc-400'} mt-0.5 font-semibold`}>Type in Barcode/SKU and hit Enter, or click the simulation laser button.</p>
          </div>
        </div>

        <div className="flex w-full md:w-auto items-center gap-3 relative z-10">
          <input
            type="text"
            placeholder="Type SKU & press Enter..."
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScanInput(scanInput)}
            className={`flex-1 md:w-60 px-4 py-3 rounded-xl text-xs font-mono font-bold focus:outline-none transition-all ${
              beepTrigger 
                ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                : 'glass-input text-zinc-800 dark:text-zinc-100'
            }`}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSimulateHardwareScan}
            className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs px-4.5 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-650/15 cursor-pointer shrink-0 border border-red-500/10"
          >
            <Volume2 className="h-4.5 w-4.5" />
            Laser Scan [Beep]
          </motion.button>
        </div>
      </motion.div>

      {/* Big Product Panel */}
      {activeProduct && activeInventory && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
          
          {/* Left: Product specs & stock level */}
          <Card className="md:col-span-2 shadow-xs flex flex-col justify-between h-full">
            <CardContent className="p-6 space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-black px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                  {activeProduct.brand}
                </span>
                <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white mt-3 leading-tight tracking-tight">{activeProduct.sku}</h3>
                <p className="text-xs text-zinc-500 mt-1 font-semibold leading-normal">{activeProduct.description}</p>
              </div>

              {/* Large Stock Counters */}
              <div className="grid grid-cols-2 gap-4 my-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center">
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase tracking-wider">Good Stock</span>
                  <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{activeInventory.goodQty}</span>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-center">
                  <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold block uppercase tracking-wider">Defects</span>
                  <span className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{activeInventory.defectiveQty}</span>
                </div>
              </div>

              {/* Info Fitment */}
              <div className="text-[10px] bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-200/50 dark:border-white/5 space-y-2 font-extrabold mt-auto">
                <p className="flex justify-between border-b border-zinc-200/30 dark:border-white/5 pb-1.5">
                  <span className="text-zinc-400 dark:text-zinc-500">Bin Location:</span>
                  <span className="font-mono">{activeInventory.location}</span>
                </p>
                <p className="flex justify-between gap-2 border-b border-zinc-200/30 dark:border-white/5 pb-1.5">
                  <span className="text-zinc-400 dark:text-zinc-500 shrink-0">Car Make:</span>
                  <span className="truncate max-w-[140px]">{activeProduct.carBrand} {activeProduct.carModel}</span>
                </p>
                <p className="flex justify-between gap-2">
                  <span className="text-zinc-400 dark:text-zinc-500 shrink-0">Comp. Years:</span>
                  <span className="truncate max-w-[140px] text-zinc-500 dark:text-zinc-400 font-semibold">{activeProduct.compatibleModels.join(', ')}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Right: Touch buttons for quick adjustments */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Add stock buttons */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleAddStock(1)}
              className="h-32 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/35 rounded-2xl flex flex-col items-center justify-center transition-all p-4 text-center cursor-pointer shadow-xs"
            >
              <Plus className="h-7 w-7 text-emerald-650 dark:text-emerald-400 mb-2" />
              <span className="font-extrabold text-base text-emerald-800 dark:text-emerald-400 leading-tight">+1 Good Stock</span>
              <span className="text-[9px] text-zinc-550 dark:text-zinc-400 mt-1 font-semibold">Vendor Intake Receipt</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleAddStock(5)}
              className="h-32 bg-gradient-to-br from-emerald-600 to-teal-650 hover:from-emerald-750 hover:to-teal-750 border border-emerald-500/10 rounded-2xl flex flex-col items-center justify-center text-white transition-all shadow-md shadow-emerald-600/10 p-4 text-center cursor-pointer"
            >
              <Plus className="h-7 w-7 mb-2" />
              <span className="font-extrabold text-base leading-tight">+5 Good Stock</span>
              <span className="text-[9px] text-emerald-100/80 mt-1 font-semibold">Bulk Receipt Intake</span>
            </motion.button>

            {/* Deduct stock buttons */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleRemoveStock(1)}
              className="h-32 bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/35 rounded-2xl flex flex-col items-center justify-center transition-all p-4 text-center cursor-pointer shadow-xs"
            >
              <Minus className="h-7 w-7 text-indigo-600 dark:text-indigo-400 mb-2" />
              <span className="font-extrabold text-base text-indigo-800 dark:text-indigo-400 leading-tight">-1 Good Stock</span>
              <span className="text-[9px] text-zinc-550 dark:text-zinc-400 mt-1 font-semibold">Installation Dispatch</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleRemoveStock(5)}
              className="h-32 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border border-indigo-500/10 rounded-2xl flex flex-col items-center justify-center text-white transition-all shadow-md shadow-indigo-600/10 p-4 text-center cursor-pointer"
            >
              <Minus className="h-7 w-7 mb-2" />
              <span className="font-extrabold text-base leading-tight">-5 Good Stock</span>
              <span className="text-[9px] text-indigo-100/80 mt-1 font-semibold">Bulk dispatch logs</span>
            </motion.button>

            {/* Defect action */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setIsDefectOpen(true)}
              className="col-span-1 sm:col-span-2 h-24 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/35 rounded-2xl flex items-center justify-center gap-4 transition-all px-6 text-center cursor-pointer shadow-xs"
            >
              <AlertTriangle className="h-7 w-7 text-amber-550 shrink-0" />
              <div className="text-left">
                <span className="font-extrabold text-sm text-amber-700 dark:text-amber-400 block leading-tight">Mark Glass as Defective</span>
                <span className="text-[9px] text-zinc-550 dark:text-zinc-400 mt-0.5 block font-semibold leading-normal">Transfer from good inventory to defective logs</span>
              </div>
            </motion.button>
          </div>

        </div>
      )}

      {/* MARK DEFECTIVE DIALOG MODAL */}
      <Dialog isOpen={isDefectOpen} onClose={() => setIsDefectOpen(false)} title="Log Defective Panel">
        <form onSubmit={handleMarkDefectiveSubmit} className="space-y-5 text-xs font-semibold">
          <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20 flex items-start gap-2.5 text-amber-800 dark:text-amber-450">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-555" />
            <div>
              <p className="font-extrabold text-xs">Log defect from scanned stock</p>
              <p className="text-[9px] mt-1 text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">This transfer decreases Good Qty and logs Defective Qty pending scrap approvals.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-zinc-650 dark:text-zinc-400 font-bold uppercase mb-2">Quantity</label>
              <input 
                type="number"
                min={1}
                max={activeInventory?.goodQty || 1}
                value={defectQty}
                onChange={(e) => setDefectQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full glass-input p-3 text-center font-extrabold text-zinc-800 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-650 dark:text-zinc-400 font-bold uppercase mb-2">Defect Reason</label>
              <select
                value={defectReason}
                onChange={(e) => setDefectReason(e.target.value)}
                className="w-full glass-input p-3 font-extrabold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="Transit Scratch">Transit Scratch</option>
                <option value="Chipped Corner">Chipped Corner</option>
                <option value="Lamination Crack">Lamination Crack</option>
                <option value="ADAS Bracket Misaligned">ADAS Bracket Misaligned</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-amber-550 to-orange-550 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold py-3 rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer text-xs"
          >
            Confirm Defect Entry
          </button>
        </form>
      </Dialog>
    </div>
  );
}
