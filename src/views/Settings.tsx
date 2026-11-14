import React, { useState } from 'react';
import { useStore, SystemSettings } from '../store/useStore';
import { Card, CardContent } from '../components/ui/card';
import { 
  Settings as SettingsIcon, 
  Store, 
  Barcode, 
  Printer, 
  Bell, 
  ShieldAlert, 
  Database,
  Volume2,
  Save,
  RotateCcw
} from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings, addNotification, logActivity } = useStore();

  // Active section
  const [activeSection, setActiveSection] = useState<string>('shop');

  // Form local overrides for active settings
  const [agencyName, setAgencyName] = useState(settings.general.agencyName);
  const [shopsInput, setShopsInput] = useState(settings.shop.shops.join(', '));
  const [defaultFormat, setDefaultFormat] = useState(settings.barcode.defaultFormat);
  const [strictScans, setStrictScans] = useState(settings.audit.strictScans);
  const [dpi, setDpi] = useState(settings.printer.dpi);
  const [isSaved, setIsSaved] = useState(false);

  const sections = [
    { id: 'shop', name: 'Shop & Warehouse Details', icon: Store, desc: 'Configure company identity and warehouse shops list.' },
    { id: 'barcode', name: 'Barcode & Sticker Settings', icon: Barcode, desc: 'Auto SKU formats, standard 50x25mm labels.' },
    { id: 'notifications', name: 'Notification Alerts', icon: Bell, desc: 'Low stock limits, defect markings alert levels.' },
    { id: 'printers', name: 'Thermal Printers Config', icon: Printer, desc: 'DPI speeds, label output printer parameters.' },
    { id: 'audit', name: 'Audit & Strict Reconcile', icon: ShieldAlert, desc: 'Auto reconciliation and variance safety parameters.' },
    { id: 'backup', name: 'Database Backup & Sync', icon: Database, desc: 'Export in-memory JSON db ledger logs, reset.' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);

    if (activeSection === 'shop') {
      updateSettings('general', { agencyName });
      updateSettings('shop', { shops: shopsInput.split(',').map(s => s.trim()).filter(Boolean) });
    } else if (activeSection === 'barcode') {
      updateSettings('barcode', { defaultFormat });
    } else if (activeSection === 'printers') {
      updateSettings('printer', { dpi });
    } else if (activeSection === 'audit') {
      updateSettings('audit', { strictScans });
    }

    addNotification('success', 'Configurations Updated', `System parameters for ${activeSection} updated successfully.`);
    logActivity(`Modified system config settings for: ${activeSection}`, 'Settings');

    setTimeout(() => setIsSaved(false), 2000);
  };

  // Simulated DB Backup
  const handleBackup = () => {
    const data = useStore.getState();
    const backupJson = JSON.stringify({
      products: data.products,
      inventory: data.inventory,
      ledger: data.ledger,
      defective: data.defective,
      logs: data.activityLogs
    }, null, 2);

    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `atul_glass_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    addNotification('success', 'Backup Exported', 'Downloaded complete in-memory JSON state dump.');
    logActivity('Executed system database backup dump download', 'Settings');
  };

  const handleResetDefaults = () => {
    if (confirm("Reset local database logs back to factory mock datasets? All current session adjustments will be deleted.")) {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black tracking-tight text-zinc-805 dark:text-zinc-100">Global Settings Panel</h2>
        <p className="text-zinc-500 text-xs dark:text-zinc-400 font-semibold font-medium">Fine-tune system variables, label print properties, and check ledger sync overrides.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Left: Section Switcher cards */}
        <div className="lg:col-span-1 flex flex-col space-y-3">
          <Card className="flex-1 flex flex-col h-full">
            <div className="p-2 space-y-1 flex-1">
              {sections.map((sec) => {
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    onClick={() => { setActiveSection(sec.id); }}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-colors flex items-start gap-3 font-bold ${
                      activeSection === sec.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-350'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p>{sec.name}</p>
                      <p className={`text-[9.5px] font-medium leading-tight ${activeSection === sec.id ? 'text-indigo-150' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        {sec.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: Settings Forms */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="shadow-sm flex-1 flex flex-col h-full">
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
              <form onSubmit={handleSave} className="space-y-6 text-xs font-semibold flex-1 flex flex-col justify-between">
                
                {activeSection === 'shop' && (
                  <>
                    <h3 className="text-sm font-black border-b border-zinc-100 dark:border-zinc-800 pb-3 text-zinc-850 dark:text-white">Shop & Warehouse Details</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Agency Registered Name</label>
                        <input
                          type="text"
                          value={agencyName}
                          onChange={(e) => setAgencyName(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Active Shop Outlets (Comma Separated)</label>
                        <input
                          type="text"
                          value={shopsInput}
                          onChange={(e) => setShopsInput(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg focus:outline-none font-bold"
                        />
                        <span className="text-[9px] text-zinc-500 block mt-1">Defines outlet locations available in top header selectors.</span>
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'barcode' && (
                  <>
                    <h3 className="text-sm font-black border-b border-zinc-100 dark:border-zinc-800 pb-3 text-zinc-850 dark:text-white">Barcode & Sticker Settings</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Default Encoding Standard</label>
                        <select
                          value={defaultFormat}
                          onChange={(e) => setDefaultFormat(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-205 dark:border-zinc-800 p-2.5 rounded-lg focus:outline-none"
                        >
                          <option value="CODE-128">Code 128 (Standard Industrial)</option>
                          <option value="EAN-13">EAN 13 (Retail Standard)</option>
                          <option value="QR-CODE">QR Code (2D Data Matrix)</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between border-l border-zinc-150 dark:border-zinc-800 pl-4">
                        <div>
                          <span className="block">Auto-Generate Product Barcodes</span>
                          <span className="text-[9.5px] text-zinc-450 block mt-0.5">Assign random 12-digits barcode to catalog SKU if blank</span>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4.5 w-4.5 accent-indigo-600 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'notifications' && (
                  <>
                    <h3 className="text-sm font-black border-b border-zinc-100 dark:border-zinc-800 pb-3 text-zinc-855 dark:text-white">Notification Alert Configurations</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block">Low Stock Warnings</span>
                          <span className="text-[9.5px] text-zinc-450 block mt-0.5">Push toast message when stock drops below threshold margins.</span>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked={settings.notification.lowStockAlerts}
                          onChange={(e) => updateSettings('notification', { lowStockAlerts: e.target.checked })}
                          className="h-4.5 w-4.5 accent-indigo-600 rounded cursor-pointer"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                        <div>
                          <span className="block">Defect Intake Notifications</span>
                          <span className="text-[9.5px] text-zinc-450 block mt-0.5">Notify admin when staff logs transit or fitting glass defects.</span>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked={settings.notification.defectiveAlerts}
                          onChange={(e) => updateSettings('notification', { defectiveAlerts: e.target.checked })}
                          className="h-4.5 w-4.5 accent-indigo-650 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'printers' && (
                  <>
                    <h3 className="text-sm font-black border-b border-zinc-100 dark:border-zinc-800 pb-3 text-zinc-850 dark:text-white">Thermal Printer Outputs</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Print Resolution Density (DPI)</label>
                        <input
                          type="number"
                          value={dpi}
                          onChange={(e) => setDpi(parseInt(e.target.value) || 203)}
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-center"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1.5">Print Feed Speed (inch/sec)</label>
                        <select
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-205 dark:border-zinc-800 p-2.5 rounded-lg focus:outline-none"
                        >
                          <option value="2">2 ips (Slow precision)</option>
                          <option value="3">3 ips (Normal speed)</option>
                          <option value="5">5 ips (High-output batch)</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'audit' && (
                  <>
                    <h3 className="text-sm font-black border-b border-zinc-100 dark:border-zinc-800 pb-3 text-zinc-850 dark:text-white">Audit & Strict Reconcile Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block">Strict Audit Scanning</span>
                          <span className="text-[9.5px] text-zinc-450 block mt-0.5">Require barcode input lookup rather than manual selection during audits.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={strictScans}
                          onChange={(e) => setStrictScans(e.target.checked)}
                          className="h-4.5 w-4.5 accent-indigo-600 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'backup' && (
                  <>
                    <h3 className="text-sm font-black border-b border-zinc-100 dark:border-zinc-800 pb-3 text-zinc-850 dark:text-white">Database Backup & Recovery</h3>
                    
                    <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-150 dark:border-zinc-855 space-y-4 text-xs font-semibold">
                      <div className="flex items-start gap-3 text-zinc-650 dark:text-zinc-350">
                        <Database className="h-5 w-5 text-indigo-500 shrink-0" />
                        <div>
                          <p className="font-bold">JSON Database Sync</p>
                          <p className="text-[9.5px] mt-0.5">Export the current state of products, inventory records, and activity logs. You can restore this file on reload to check historical changes.</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleBackup}
                          className="bg-indigo-600 hover:bg-indigo-705 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1 hover:shadow-md transition-all text-xs"
                        >
                          <Database className="h-4 w-4" />
                          Download State Backup (.json)
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleResetDefaults}
                          className="border border-red-500/25 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 text-red-650 dark:text-red-400 font-bold py-2 px-4 rounded-lg flex items-center gap-1 transition-all text-xs"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reload Factory Mock Defaults
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Save Footer Bar */}
                {activeSection !== 'backup' && (
                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <span className="text-[10px] text-zinc-400">All configurations apply in-memory to current browser session.</span>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/10 active:scale-95"
                    >
                      <Save className="h-4 w-4" />
                      {isSaved ? 'Configs Saved!' : 'Save System Settings'}
                    </button>
                  </div>
                )}

              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
