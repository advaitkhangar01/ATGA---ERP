import React, { useState, useMemo } from 'react';
import { useStore, Product } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarcodeGenerator } from '../components/ui/barcode-generator';
import { browserPrintAdapter } from '../lib/printer/browser-adapter';
import { LabelSize } from '../lib/printer/types';
import { 
  Printer, 
  Settings, 
  ListOrdered, 
  Plus, 
  Trash2, 
  Eye
} from 'lucide-react';

export default function Barcodes() {
  const { products, addNotification, logActivity } = useStore();
  
  // States
  const [printSearch, setPrintSearch] = useState('');
  const [printQueue, setPrintQueue] = useState<Array<{ product: Product; qty: number }>>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[0] || null);
  const [previewQty, setPreviewQty] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const [labelSize, setLabelSize] = useState<LabelSize>('50x25mm');
  const [brandHighlighting, setBrandHighlighting] = useState(true);

  const isCompact = labelSize === '50x25mm';
  const labelWidth = isCompact ? 50 : 75;
  const labelHeight = isCompact ? 25 : 50;

  // Search filter for dropdown
  const filteredProducts = useMemo(() => {
    if (!printSearch) return products.slice(0, 5);
    const q = printSearch.toLowerCase();
    return products.filter(p => p.sku.toLowerCase().includes(q) || p.barcode.includes(q)).slice(0, 5);
  }, [products, printSearch]);

  const handleAddToQueue = (prod: Product, qty: number) => {
    setPrintQueue(prev => {
      const existing = prev.find(item => item.product.id === prod.id);
      if (existing) {
        return prev.map(item => item.product.id === prod.id ? { ...item, qty: item.qty + qty } : item);
      }
      return [...prev, { product: prod, qty }];
    });
    addNotification('info', 'Added to Print Queue', `${qty} labels for SKU ${prod.sku} added to queue.`);
  };

  const handleRemoveFromQueue = (productId: string) => {
    setPrintQueue(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearQueue = () => setPrintQueue([]);

  const handleDirectPrint = async (prod: Product) => {
    setIsPrinting(true);
    try {
      await browserPrintAdapter.printLabel({
        sku: prod.sku,
        barcode: prod.barcode,
        brand: prod.brand,
        carBrand: prod.carBrand,
        carModel: prod.carModel,
        glassType: prod.glassType,
        size: labelSize,
      }, labelSize);
      addNotification('success', 'Browser Print Opened', `Sent SKU ${prod.sku} to browser print dialog.`);
      logActivity(`Printed label ${prod.sku} (${labelSize}) via Browser Print`, 'Barcodes', 'success');
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (printQueue.length === 0 && !selectedProduct) return;

    setIsPrinting(true);
    try {
      if (printQueue.length > 0) {
        for (const item of printQueue) {
          await browserPrintAdapter.printLabel({
            sku: item.product.sku,
            barcode: item.product.barcode,
            brand: item.product.brand,
            carBrand: item.product.carBrand,
            carModel: item.product.carModel,
            glassType: item.product.glassType,
            size: labelSize,
          }, labelSize);
        }
        addNotification('success', 'Labels Printed', `Sent ${printQueue.length} queued items to browser print.`);
        logActivity(`Printed ${printQueue.length} queued labels via Browser Print`, 'Barcodes', 'success');
        setPrintQueue([]);
      } else if (selectedProduct) {
        await handleDirectPrint(selectedProduct);
      }
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black tracking-tight text-zinc-800 dark:text-zinc-100">Barcode Printing Center</h2>
        <p className="text-zinc-500 text-xs dark:text-zinc-400 font-semibold">Generate and print Code-128 physical barcode labels for warehouse racks and glass inventory.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Label Settings and Printer configuration */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-150 dark:border-zinc-850">
              <CardTitle className="text-sm font-black flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-indigo-500" />
                Label & Adapter Config
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Print Driver Adapter</label>
                <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-xs">
                  Browser Print Adapter (CSS @page)
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Standard Label Layout Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLabelSize('50x25mm')}
                    className={`py-2 px-3 rounded-lg border text-center transition-all ${
                      labelSize === '50x25mm' 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-400 font-black' 
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    50 x 25 mm
                    <span className="block text-[9px] font-normal text-zinc-400 mt-0.5">Compact Shelf</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelSize('75x50mm')}
                    className={`py-2 px-3 rounded-lg border text-center transition-all ${
                      labelSize === '75x50mm' 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-400 font-black' 
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    75 x 50 mm
                    <span className="block text-[9px] font-normal text-zinc-400 mt-0.5">Large Pallet</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-150 dark:border-zinc-800 pt-3">
                <div>
                  <span className="block">Brand Highlighting</span>
                  <span className="text-[9px] text-zinc-400 font-semibold">Render manufacturer tag on label</span>
                </div>
                <input 
                  type="checkbox"
                  checked={brandHighlighting}
                  onChange={(e) => setBrandHighlighting(e.target.checked)}
                  className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Preview Sticker */}
          {selectedProduct && (
            <Card className="border-indigo-500/25 bg-indigo-50/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase font-bold tracking-wider text-indigo-500 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    Sticker Preview ({labelSize})
                  </span>
                  <button
                    onClick={() => handleDirectPrint(selectedProduct)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Now
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                {/* Visual Representation of 50mm x 25mm or 75mm x 50mm label */}
                <div 
                  className="bg-white border-2 border-zinc-950 p-2.5 text-black select-none flex flex-col justify-between items-center shadow-md relative"
                  style={{ 
                    width: isCompact ? '240px' : '300px', 
                    height: isCompact ? '120px' : '200px'
                  }}
                >
                  <div className="w-full flex justify-between items-start text-[9px] font-black border-b border-black/40 pb-0.5 leading-none">
                    <span className="truncate max-w-[70%]" title={selectedProduct.description}>
                      {selectedProduct.carBrand} {selectedProduct.carModel} • {selectedProduct.glassType}
                    </span>
                    {brandHighlighting && (
                      <span className="bg-zinc-900 text-white font-extrabold px-1 rounded text-[8px] tracking-wide shrink-0">
                        {selectedProduct.brand.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="w-full text-center my-0.5">
                    <span className="text-[11px] font-black tracking-tight block truncate">
                      {selectedProduct.sku}
                    </span>
                  </div>

                  <div className="w-full flex flex-col items-center justify-center py-0.5">
                    <BarcodeGenerator 
                      value={selectedProduct.barcode} 
                      width={isCompact ? 160 : 220} 
                      height={isCompact ? 32 : 55} 
                      showText={false} 
                    />
                    <span className="font-mono font-bold text-[9px] tracking-widest mt-0.5">
                      {selectedProduct.barcode}
                    </span>
                  </div>
                  
                  <div className="w-full flex justify-between items-end text-[7px] font-mono leading-none border-t border-zinc-300 pt-0.5">
                    <span>ATUL GLASS NAGPUR</span>
                    <span>SIZE: {labelSize}</span>
                  </div>
                </div>
                
                <span className="text-[10px] text-zinc-400 mt-3 font-semibold">Exact physical print: {labelWidth}mm x {labelHeight}mm</span>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Generate / Print Queue */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-150 dark:border-zinc-850">
              <CardTitle className="text-sm font-black flex items-center gap-1.5">
                <ListOrdered className="h-4 w-4 text-indigo-500" />
                Select SKU and Add to Printer Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs font-semibold">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <label className="block text-[10px] text-zinc-400 font-bold mb-1.5">Search Catalog Product</label>
                  <input 
                    type="text"
                    placeholder="Search SKU or barcode..."
                    value={printSearch}
                    onChange={(e) => setPrintSearch(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                  />
                  
                  {/* Floating Results */}
                  {printSearch && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-25 divide-y divide-zinc-100 dark:divide-zinc-800">
                      {filteredProducts.map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => { setSelectedProduct(p); setPrintSearch(''); }}
                          className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-zinc-800 dark:text-zinc-200">{p.sku}</p>
                            <p className="text-[9px] text-zinc-400 mt-0.5">{p.description}</p>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 font-bold">{p.barcode}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full sm:w-1/3">
                  <label className="block text-[10px] text-zinc-400 font-bold mb-1.5">Quantity to Print</label>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      min={1}
                      value={previewQty}
                      onChange={(e) => setPreviewQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 p-2.5 rounded-lg text-center font-bold focus:outline-none"
                    />
                    <button 
                      onClick={() => selectedProduct && handleAddToQueue(selectedProduct, previewQty)}
                      className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-3 py-2.5 rounded-lg flex items-center gap-1.5"
                    >
                      <Plus className="h-4.5 w-4.5" />
                      Queue
                    </button>
                  </div>
                </div>
              </div>

              {selectedProduct && (
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-zinc-400 block text-[9px]">Selected Product Specs</span>
                    <span className="font-bold text-zinc-850 dark:text-zinc-200">{selectedProduct.sku}</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">{selectedProduct.description}</span>
                  </div>
                  <button 
                    onClick={() => handleAddToQueue(selectedProduct, previewQty)}
                    className="border border-indigo-500/25 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-400 font-bold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Quick Add to Queue
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Print Queue Manager list */}
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-150 dark:border-zinc-850 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black flex items-center gap-1.5">
                <Printer className="h-4.5 w-4.5 text-indigo-500" />
                Active Printing Queue ({printQueue.length} jobs)
              </CardTitle>
              {printQueue.length > 0 && (
                <button 
                  onClick={handleClearQueue}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1 font-bold"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All
                </button>
              )}
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {printQueue.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs font-semibold">
                  Queue is empty. Select an SKU above and add quantity to start printing.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[220px] overflow-y-auto border border-zinc-150 dark:border-zinc-800 rounded-lg">
                    {printQueue.map((item) => (
                      <div key={item.product.id} className="p-3 flex items-center justify-between text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <div>
                          <p className="text-zinc-800 dark:text-zinc-200">{item.product.sku}</p>
                          <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">{item.product.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">Qty: {item.qty} labels</span>
                          <button 
                            onClick={() => handleRemoveFromQueue(item.product.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handlePrintSubmit}
                    disabled={isPrinting}
                    className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-indigo-600/10"
                  >
                    {isPrinting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Opening Browser Print Dialog...
                      </>
                    ) : (
                      <>
                        <Printer className="h-4.5 w-4.5" />
                        Print Labels via Browser Print ({printQueue.reduce((acc, q) => acc + q.qty, 0)} Labels)
                      </>
                    )}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
