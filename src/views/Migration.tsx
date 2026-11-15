import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  DatabaseBackup, 
  UploadCloud, 
  AlertTriangle, 
  Barcode, 
  Printer, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { BarcodeGenerator } from '../components/ui/barcode-generator';

export default function Migration() {
  const { migrationProgress, unknownInventory, labelPending, startMigration, assignMigrationBarcode, reconcileMigration, addNotification } = useStore();
  
  // Local states
  const [csvFile, setCsvFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tempBarcode, setTempBarcode] = useState<Record<string, string>>({});

  // Trigger simulated file upload
  const handleSimulateCSVUpload = () => {
    setIsUploading(true);
    setCsvFile('atul_glass_stock_dump.csv');
    
    setTimeout(() => {
      setIsUploading(false);
      startMigration([]);
      addNotification('info', 'CSV File Processed', 'Parsed 142 stock lines. 3 items have missing barcode configurations.');
    }, 1500);
  };

  const handleBarcodeChange = (id: string, val: string) => {
    setTempBarcode(prev => ({ ...prev, [id]: val }));
  };

  const handleAssignBarcode = (id: string, sku: string) => {
    const code = tempBarcode[id];
    if (!code || code.length < 5) {
      addNotification('error', 'Invalid Barcode', 'Barcode must be at least 5 digits.');
      return;
    }
    assignMigrationBarcode(id, code);
    addNotification('success', 'Barcode Assigned', `Barcode ${code} linked to SKU ${sku}.`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black tracking-tight text-zinc-805 dark:text-zinc-100">Legacy Stock Migration</h2>
        <p className="text-zinc-500 text-xs dark:text-zinc-400 font-semibold">One-time tools to migrate Excel stock sheets. Match barcodes and manage tag dependencies.</p>
      </div>

      {!migrationProgress ? (
        // STATE 1: Upload CSV screen
        <Card className="max-w-2xl mx-auto shadow-sm">
          <CardHeader className="pb-3 border-b border-zinc-150 dark:border-zinc-850">
            <CardTitle className="text-sm font-black flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              <DatabaseBackup className="h-4.5 w-4.5 text-indigo-550" />
              CSV Database Migration Import
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-xs font-semibold text-center">
            <p className="text-zinc-500 max-w-md mx-auto">Upload the historical stock spreadsheet. Column headers must align with: Brand, Car Brand, Car Model, Glass Type, Qty, Bin Location.</p>
            
            <div 
              onClick={handleSimulateCSVUpload}
              className="h-44 border-2 border-dashed border-zinc-250 dark:border-zinc-750 hover:border-indigo-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all bg-zinc-50 dark:bg-zinc-900/50 p-6 group"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-2" />
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">Processing stock list file...</span>
                  <span className="text-[10px] text-zinc-400 mt-1">Validating catalog columns structure</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-10 w-10 text-zinc-400 group-hover:text-indigo-500 mb-2 transition-transform group-hover:-translate-y-1" />
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">Select or Drag Stock CSV dump</span>
                  <span className="text-[10px] text-zinc-400 mt-1">Accepts CSV, XLSX up to 5MB</span>
                </>
              )}
            </div>

            <button
              onClick={handleSimulateCSVUpload}
              disabled={isUploading}
              className="bg-indigo-600 hover:bg-indigo-705 text-white font-bold py-2.5 px-6 rounded-lg shadow-md disabled:opacity-50 active:scale-95 transition-all text-xs"
            >
              Upload Sample spreadsheet
            </button>
          </CardContent>
        </Card>
      ) : (
        // STATE 2: Migration Progress workflow
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Progress Banner */}
          <div className="lg:col-span-3 space-y-3">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-indigo-650 dark:text-indigo-400">{migrationProgress.step}</span>
                  <span>{migrationProgress.percentage}% Complete</span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${migrationProgress.percentage}%` }}
                    className="bg-indigo-600 h-full rounded-full"
                  />
                </div>
                
                {migrationProgress.percentage === 90 && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={reconcileMigration}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg active:scale-95 shadow-md shadow-emerald-600/10 flex items-center gap-1"
                    >
                      Complete Import Reconciliation
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Left panel: Unknown inventory matcher */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3 border-b border-zinc-150 dark:border-zinc-850">
                <CardTitle className="text-sm font-black flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                  Unknown Products (Missing Barcodes) ({unknownInventory.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {unknownInventory.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500 text-xs font-semibold">
                    All imported items are successfully linked to barcode rules.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-805">
                    {unknownInventory.map((item) => (
                      <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                        <div>
                          <p className="text-zinc-850 dark:text-zinc-100">{item.sku}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{item.brand} • {item.carModel} • {item.glassType}</p>
                          <span className="text-[9px] text-indigo-500 block mt-1.5 font-black uppercase">Import Quantity: {item.qty} units</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Barcode className="absolute left-2.5 top-2 h-4 w-4 text-zinc-400" />
                            <input
                              type="text"
                              placeholder="Type barcode ID..."
                              value={tempBarcode[item.id] || ''}
                              onChange={(e) => handleBarcodeChange(item.id, e.target.value)}
                              className="pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs w-44 font-mono font-bold"
                            />
                          </div>
                          <button
                            onClick={() => handleAssignBarcode(item.id, item.sku)}
                            className="bg-indigo-600 hover:bg-indigo-705 text-white font-bold px-3 py-1.5 rounded-lg active:scale-95 text-[10px]"
                          >
                            Link Code
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Label pending queue */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3 border-b border-zinc-150 dark:border-zinc-850">
                <CardTitle className="text-sm font-black flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <Printer className="h-4.5 w-4.5 text-indigo-550" />
                  Labels Pending Print Queue
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {labelPending.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-xs font-semibold">
                    No label print jobs pending in queue.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-150 dark:border-zinc-800 rounded-lg max-h-[200px] overflow-y-auto">
                      {labelPending.map((sku, idx) => (
                        <div key={idx} className="p-3 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 flex justify-between items-center">
                          <span className="font-mono">{sku}</span>
                          <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">Pending Sticker</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        addNotification('success', 'Migration Queue Printed', `Dispatched ${labelPending.length} thermal sticker print jobs.`);
                        useStore.setState({ labelPending: [] });
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-705 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1 shadow-md active:scale-95"
                    >
                      <Printer className="h-4 w-4" />
                      Print Pending Labels Queue
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
