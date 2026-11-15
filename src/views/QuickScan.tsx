import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useStore, Product } from '../store/useStore';
import { Card, CardContent } from '../components/ui/card';
import { Dialog } from '../components/ui/dialog';
import { GlassPictogram } from '../components/pictograms';
import { useScannerWedge } from '../hooks/useScannerWedge';
import { 
  Scan, 
  Plus, 
  Minus, 
  AlertTriangle, 
  Volume2,
  RotateCcw,
  MapPin,
  CheckCircle2
} from 'lucide-react';

function getVernacularPosition(glassType?: string, position?: string): { hi: string; en: string } {
  const t = (glassType || '').toLowerCase();
  const p = (position || '').toLowerCase();
  if (t.includes('windshield') || (p.includes('front') && !t.includes('door'))) {
    return { hi: 'आगे का मुख्य शीशा', en: 'Front Windshield' };
  }
  if (t.includes('rear') || t.includes('back')) {
    return { hi: 'पीछे का शीशा (डिक्की)', en: 'Rear Back Light' };
  }
  if (t.includes('door')) {
    return { hi: 'दरवाजे की खिड़की का कांच', en: 'Side Door Glass' };
  }
  if (t.includes('quarter') || t.includes('qg')) {
    return { hi: 'पीछे का छोटा त्रिकोण कांच', en: 'Quarter Glass' };
  }
  if (t.includes('vent') || t.includes('vg')) {
    return { hi: 'छोटा वेंट कांच', en: 'Vent Glass' };
  }
  return { hi: 'ऑटोमोटिव ग्लास', en: 'Automotive Safety Glass' };
}

function playScannerBeep(success = true) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = success ? 1800 : 400;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (success ? 0.08 : 0.2));
  } catch {
    // Ignore audio context errors
  }
}

function getRandomProduct<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export default function QuickScan() {
  const { products, inventory, stockIn, stockOut, markDefective, undoLastAction, lastAction } = useStore();

  // Simulated scan state
  const [scanInput, setScanInput] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(products[0] || null);
  const [beepTrigger, setBeepTrigger] = useState(false);
  
  // Double-scan debounce tracker
  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Defective Modal state
  const [isDefectOpen, setIsDefectOpen] = useState(false);
  const [defectQty, setDefectQty] = useState(1);
  const [defectReason, setDefectReason] = useState('Chipped Corner');

  // Look up inventory details for active product
  const activeInventory = useMemo(() => {
    if (!activeProduct) return null;
    return inventory.find(i => i.productId === activeProduct.id) || null;
  }, [activeProduct, inventory]);

  const triggerBeepAnimation = useCallback(() => {
    setBeepTrigger(true);
    playScannerBeep(true);
    setTimeout(() => setBeepTrigger(false), 300);
  }, []);

  // Handle scan input with double-scan debounce protection
  const handleScanInput = useCallback((val: string) => {
    const query = (val || '').trim();
    if (!query) return;

    const now = Date.now();
    // Prevent accidental double-laser trigger within 1.5 seconds on same code
    if (lastScanRef.current.code.toUpperCase() === query.toUpperCase() && (now - lastScanRef.current.time) < 1500) {
      playScannerBeep(false);
      useStore.getState().addNotification('alert', 'Double-Scan Ignored / दोहरा स्कैन रोका गया', `SKU ${query} was already read a second ago.`);
      setScanInput('');
      return;
    }
    lastScanRef.current = { code: query, time: now };

    const found = products.find(p => p.sku.toUpperCase() === query.toUpperCase() || p.barcode === query);
    if (found) {
      setActiveProduct(found);
      triggerBeepAnimation();
      useStore.getState().addNotification('success', 'Glass Found / माल मिला', `${found.carBrand} ${found.carModel} (${found.sku})`);
    } else {
      playScannerBeep(false);
      useStore.getState().addNotification('error', 'Barcode Not Found / कोड नहीं मिला', `No catalog SKU matching "${query}"`);
    }
    setScanInput('');
  }, [products, triggerBeepAnimation]);

  // Keyboard wedge hardware scanner listener
  useScannerWedge({
    onScan: handleScanInput,
    enabled: true,
  });

  // Simulate a hardware scanner scan button click (picks a random product)
  const handleSimulateHardwareScan = () => {
    const randomProd = getRandomProduct(products);
    if (randomProd) {
      setActiveProduct(randomProd);
      triggerBeepAnimation();
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">Shop-Floor Barcode Terminal</h2>
          <p className="text-zinc-500 text-xs dark:text-zinc-400 font-semibold">दुकान व गोदाम स्कैनर टर्मिनल • Hands-free barcode gun listener & fast stock adjustments.</p>
        </div>
        <div className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 self-start">
          <CheckCircle2 className="h-4 w-4" />
          <span>Scanner Ready (Active)</span>
        </div>
      </div>

      {/* Prominent 1-Click Undo Banner */}
      {lastAction && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-700 p-3.5 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-amber-950 dark:text-amber-100">
                Last Action: {lastAction.entry.type === 'in' ? 'Added' : 'Dispatched'} {lastAction.entry.qty}x {lastAction.entry.sku}
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-300">
                गलती से स्कैन हुआ? 1-क्लिक में तुरंत वापस ठीक करें (Mistake scan? Revert in 1-click)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              undoLastAction();
              triggerBeepAnimation();
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            UNDO / वापस लें
          </button>
        </div>
      )}

      {/* Laser Beep Simulator Banner */}
      <div
        className={`p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden transition-colors ${
          beepTrigger ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
        }`}
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 border ${
            beepTrigger 
              ? 'bg-white/20 border-white/20 text-white' 
              : 'bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/10 text-indigo-600 dark:text-indigo-400'
          }`}>
            <Scan className="h-6 w-6" />
          </div>
          <div>
            <h3 className={`font-extrabold text-sm ${beepTrigger ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>Barcode Scanner Ready</h3>
            <p className={`text-[10px] ${beepTrigger ? 'text-indigo-100' : 'text-zinc-500 dark:text-zinc-400'} mt-0.5 font-semibold`}>Point hardware scanner gun and pull trigger, or type code and press Enter.</p>
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
                : 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100'
            }`}
          />
          <button
            onClick={handleSimulateHardwareScan}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4.5 py-3 rounded-xl flex items-center gap-2 shadow-md cursor-pointer shrink-0 border border-red-500/10"
          >
            <Volume2 className="h-4.5 w-4.5" />
            Laser Scan [Beep]
          </button>
        </div>
      </div>

      {/* Big Product Panel */}
      {activeProduct && activeInventory && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
          
          {/* Left: Product specs & stock level */}
          <Card className="md:col-span-2 shadow-xs flex flex-col justify-between h-full">
            <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-black px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                    {activeProduct.brand}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400 font-bold">{activeProduct.barcode}</span>
                </div>
                <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white mt-2 leading-tight tracking-tight">{activeProduct.sku}</h3>
                <p className="text-xs text-zinc-500 mt-1 font-semibold leading-normal">{activeProduct.description}</p>
              </div>

              {/* Visual Car & Position Anatomy */}
              {(() => {
                const pos = getVernacularPosition(activeProduct.glassType, activeProduct.description);
                return (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 text-slate-700 dark:text-slate-200">
                      <GlassPictogram glassType={activeProduct.glassType} size={30} />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">{pos.hi}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{pos.en} ({activeProduct.glassType})</span>
                    </div>
                  </div>
                );
              })()}

              {/* Large Stock Counters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center">
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase tracking-wider">Good Stock (दुकान में)</span>
                  <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{activeInventory.goodQty}</span>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-center">
                  <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold block uppercase tracking-wider">Defects (टूटा हुआ)</span>
                  <span className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{activeInventory.defectiveQty}</span>
                </div>
              </div>

              {/* Info Fitment & Rack Location */}
              <div className="space-y-2 mt-auto">
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700 p-3 rounded-xl flex items-center justify-between text-blue-950 dark:text-blue-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-blue-700 dark:text-blue-300 block">Warehouse Bin Rack</span>
                      <span className="font-mono font-black text-xs">{activeInventory.location || 'MAIN WAREHOUSE'}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-blue-200 dark:bg-blue-900 px-2 py-0.5 rounded text-blue-800 dark:text-blue-200">
                    रैक स्थान
                  </span>
                </div>

                <div className="text-[10px] bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-xl border border-zinc-200/50 dark:border-white/5 space-y-1.5 font-bold">
                  <p className="flex justify-between gap-2 border-b border-zinc-200/30 dark:border-white/5 pb-1">
                    <span className="text-zinc-400 dark:text-zinc-500 shrink-0">Car Model Fit:</span>
                    <span className="truncate max-w-[140px] text-zinc-800 dark:text-zinc-200">{activeProduct.carBrand} {activeProduct.carModel}</span>
                  </p>
                  <p className="flex justify-between gap-2">
                    <span className="text-zinc-400 dark:text-zinc-500 shrink-0">Facelifts:</span>
                    <span className="truncate max-w-[140px] text-zinc-500 dark:text-zinc-400 font-semibold">{activeProduct.compatibleModels.join(', ')}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Touch buttons for quick adjustments */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Add stock buttons */}
            <button
              onClick={() => handleAddStock(1)}
              className="h-32 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/35 rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer shadow-xs transition-colors hover:bg-emerald-500/15"
            >
              <Plus className="h-7 w-7 text-emerald-650 dark:text-emerald-400 mb-1" />
              <span className="font-extrabold text-base text-emerald-800 dark:text-emerald-400 leading-tight">+1 Good Stock</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold mt-1">माल अंदर (Vendor Intake)</span>
            </button>

            <button
              onClick={() => handleAddStock(5)}
              className="h-32 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500/10 rounded-2xl flex flex-col items-center justify-center text-white shadow-md shadow-emerald-600/10 p-4 text-center cursor-pointer transition-colors"
            >
              <Plus className="h-7 w-7 mb-1" />
              <span className="font-extrabold text-base leading-tight">+5 Bulk Intake</span>
              <span className="text-[10px] text-emerald-100 font-bold mt-1">थोक माल अंदर (5 Panels)</span>
            </button>

            {/* Deduct stock buttons */}
            <button
              onClick={() => handleRemoveStock(1)}
              className="h-32 bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/35 rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer shadow-xs transition-colors hover:bg-indigo-500/15"
            >
              <Minus className="h-7 w-7 text-indigo-600 dark:text-indigo-400 mb-1" />
              <span className="font-extrabold text-base text-indigo-800 dark:text-indigo-400 leading-tight">-1 Dispatch Glass</span>
              <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold mt-1">दुकान से माल निकला (Counter)</span>
            </button>

            <button
              onClick={() => handleRemoveStock(5)}
              className="h-32 bg-indigo-600 hover:bg-indigo-700 border border-indigo-500/10 rounded-2xl flex flex-col items-center justify-center text-white shadow-md shadow-indigo-600/10 p-4 text-center cursor-pointer transition-colors"
            >
              <Minus className="h-7 w-7 mb-1" />
              <span className="font-extrabold text-base leading-tight">-5 Bulk Dispatch</span>
              <span className="text-[10px] text-indigo-100 font-bold mt-1">थोक माल निकला (Mechanic Fitting)</span>
            </button>

            {/* Defect action */}
            <button
              onClick={() => setIsDefectOpen(true)}
              className="col-span-1 sm:col-span-2 h-24 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/35 rounded-2xl flex items-center justify-center gap-4 px-6 text-center cursor-pointer shadow-xs transition-colors hover:bg-amber-500/15"
            >
              <AlertTriangle className="h-7 w-7 text-amber-550 shrink-0" />
              <div className="text-left">
                <span className="font-extrabold text-sm text-amber-700 dark:text-amber-400 block leading-tight">Mark Glass as Defective</span>
                <span className="text-[10px] text-amber-800 dark:text-amber-300 mt-0.5 block font-bold leading-normal">टूटा या स्क्रैच कांच अलग करें (Damage / Quarantine)</span>
              </div>
            </button>
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
