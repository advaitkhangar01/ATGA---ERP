import { create } from 'zustand';
import { generateMockData, Product, InventoryRecord, LedgerEntry, DefectiveRecord, ActivityLog } from '../utils/mockData';
import { stockIn as serverStockIn, stockOut as serverStockOut, markDefective as serverMarkDefective } from '../actions/inventory';
import { hydrateStore } from '../actions/db';
export type { Product, InventoryRecord, LedgerEntry, DefectiveRecord, ActivityLog };

export type ViewType = 
  | 'dashboard'
  | 'inventory'
  | 'products'
  | 'sku-engine'
  | 'barcodes'
  | 'stock-operations'
  | 'quick-scan'
  | 'defective'
  | 'low-stock'
  | 'audit'
  | 'migration'
  | 'reports'
  | 'users'
  | 'activity-logs'
  | 'settings';

export interface User {
  email: string;
  role: 'admin' | 'staff';
}

export interface AuditSession {
  id: string;
  name: string;
  date: string;
  scanned: Record<string, { expected: number; actual: number; status: 'pending' | 'accepted' | 'rejected' }>;
  status: 'in-progress' | 'completed';
}

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'alert' | 'low-stock' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface SystemSettings {
  general: { agencyName: string; currency: string; defaultLanguage: string };
  shop: { shops: string[]; currentShop: string };
  barcode: { autoGenerate: boolean; defaultFormat: string };
  label: { width: number; height: number; thermalPrinter: boolean; brandHighlighting: boolean };
  notification: { lowStockAlerts: boolean; defectiveAlerts: boolean; emailDigest: boolean };
  printer: { activePrinter: string; dpi: number; labelSpeed: number };
  audit: { autoReconcileLimit: number; strictScans: boolean };
}

interface AppState {
  // Auth & Routing
  user: User | null;
  activeView: ViewType;
  theme: 'light' | 'dark';
  
  // Data State
  products: Product[];
  inventory: InventoryRecord[];
  ledger: LedgerEntry[];
  defective: DefectiveRecord[];
  activityLogs: ActivityLog[];
  notifications: AppNotification[];
  settings: SystemSettings;
  
  // Modules State
  activeAudit: AuditSession | null;
  completedAudits: any[];
  migrationProgress: { percentage: number; step: string; fileLoaded: boolean } | null;
  unknownInventory: Array<{ id: string; sku: string; brand: string; carModel: string; glassType: string; qty: number }>;
  labelPending: string[];
  
  // History for Stock Operations Undo
  lastAction: { type: 'stock_out'; entry: LedgerEntry; originalGoodQty: number } | null;

  // Actions
  login: (email: string, role: 'admin' | 'staff') => boolean;
  logout: () => void;
  setView: (view: ViewType) => void;
  toggleTheme: () => void;
  
  // Product CRUD
  addProduct: (product: Omit<Product, 'id' | 'createdDate'>) => void;
  editProduct: (id: string, updated: Partial<Product>) => void;
  archiveProduct: (id: string) => void;
  deactivateProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
  
  // Stock Actions
  stockIn: (sku: string, qty: number, vendor: string, remarks: string) => void;
  stockOut: (sku: string, qty: number, customer: string, reason: string, remarks: string) => void;
  undoLastAction: () => void;
  
  // Defective Actions
  markDefective: (sku: string, qty: number, reason: string) => void;
  scrapDefective: (id: string) => void;
  restoreDefective: (id: string, qty: number) => void;
  
  // Audit Actions
  startAudit: (name: string) => void;
  scanAuditItem: (sku: string, qty: number) => void;
  decideAuditItem: (sku: string, decision: 'accepted' | 'rejected') => void;
  reconcileAudit: () => void;
  cancelAudit: () => void;
  
  // Migration Actions
  startMigration: (fileRows: any[]) => void;
  assignMigrationBarcode: (tempId: string, barcode: string) => void;
  reconcileMigration: () => void;

  // Settings Actions
  updateSettings: (section: keyof SystemSettings, values: any) => void;

  // Notifications Actions
  addNotification: (type: AppNotification['type'], title: string, message: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  logActivity: (action: string, module: string, status?: 'success' | 'failed') => void;
  setHydratedData: (data: any) => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null, // Starts logged out
  activeView: 'dashboard',
  theme: 'dark',
  
  products: [],
  inventory: [],
  ledger: [],
  defective: [],
  activityLogs: [],
  notifications: [
    {
      id: 'n1',
      type: 'low-stock',
      title: 'Low Stock Alert',
      message: 'SG-MARUTI-SWIFT-WS-FRN-STD is below threshold (4 units remaining).',
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: 'n2',
      type: 'alert',
      title: 'Defective Stock Marked',
      message: 'Staff marked 2 rear glasses as transit-damaged.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
    }
  ],
  
  settings: {
    general: {
      agencyName: 'Atul Glass Agency',
      currency: 'INR',
      defaultLanguage: 'English',
    },
    shop: {
      shops: ['Main Warehouse', 'City Showroom', 'Service Center'],
      currentShop: 'Main Warehouse',
    },
    barcode: {
      autoGenerate: true,
      defaultFormat: 'CODE-128',
    },
    label: {
      width: 50,
      height: 25,
      thermalPrinter: true,
      brandHighlighting: true,
    },
    notification: {
      lowStockAlerts: true,
      defectiveAlerts: true,
      emailDigest: false,
    },
    printer: {
      activePrinter: 'Zebra GK420t Thermal',
      dpi: 203,
      labelSpeed: 3,
    },
    audit: {
      autoReconcileLimit: 2,
      strictScans: true,
    },
  },
  
  activeAudit: null,
  completedAudits: [],
  migrationProgress: null,
  unknownInventory: [],
  labelPending: [],
  lastAction: null,

  login: (email, role) => {
    if (email === 'admin@atulglass.com' && role === 'admin') {
      set({ user: { email, role } });
      get().logActivity('Logged In successfully', 'Auth', 'success');
      return true;
    }
    if (email === 'staff@atulglass.com' && role === 'staff') {
      set({ user: { email, role } });
      get().logActivity('Logged In successfully', 'Auth', 'success');
      return true;
    }
    get().logActivity(`Failed login attempt for ${email}`, 'Auth', 'failed');
    return false;
  },

  logout: () => {
    get().logActivity('Logged Out', 'Auth', 'success');
    set({ user: null, activeView: 'dashboard' });
  },

  setView: (view) => set({ activeView: view }),

  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

  logActivity: (action, module, status = 'success') => {
    const user = get().user?.email || 'System';
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user,
      action,
      module,
      timestamp: new Date().toISOString(),
      ip: '192.168.1.102',
      status,
    };
    set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));
  },

  addNotification: (type, title, message) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    set((state) => ({ notifications: [newNotif, ...state.notifications] }));
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },

  // Product CRUD
  addProduct: (productData) => {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newProduct: Product = {
      ...productData,
      id,
      createdDate: new Date().toISOString().split('T')[0],
    };
    
    // Add to Inventory listing with 0 initial quantities
    const newInventory: InventoryRecord = {
      productId: id,
      sku: newProduct.sku,
      brand: newProduct.brand,
      carModel: `${newProduct.carBrand} ${newProduct.carModel}`,
      glassType: newProduct.glassType,
      goodQty: 0,
      defectiveQty: 0,
      availableQty: 0,
      status: 'Out Of Stock',
      location: 'Unassigned Shelf',
      lastUpdated: new Date().toISOString(),
    };

    set((state) => ({
      products: [newProduct, ...state.products],
      inventory: [newInventory, ...state.inventory],
    }));

    get().logActivity(`Created product SKU: ${newProduct.sku}`, 'Products', 'success');
    get().addNotification('success', 'Product Added', `Product SKU ${newProduct.sku} created successfully.`);
  },

  editProduct: (id, updated) => {
    set((state) => {
      const updatedProducts = state.products.map((p) => (p.id === id ? { ...p, ...updated } : p));
      // update SKUs in inventory if updated
      const updatedInventory = state.inventory.map((inv) => {
        if (inv.productId === id) {
          const prod = updatedProducts.find((p) => p.id === id)!;
          return {
            ...inv,
            sku: prod.sku,
            brand: prod.brand,
            carModel: `${prod.carBrand} ${prod.carModel}`,
            glassType: prod.glassType,
          };
        }
        return inv;
      });
      return { products: updatedProducts, inventory: updatedInventory };
    });
    get().logActivity(`Modified product details for ID: ${id}`, 'Products', 'success');
  },

  archiveProduct: (id) => {
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, status: 'archived' as const } : p)),
    }));
    get().logActivity(`Archived product ID: ${id}`, 'Products', 'success');
  },

  deactivateProduct: (id) => {
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, status: 'deactivated' as const } : p)),
    }));
    get().logActivity(`Deactivated product ID: ${id}`, 'Products', 'success');
  },

  duplicateProduct: (id) => {
    const existing = get().products.find((p) => p.id === id);
    if (!existing) return;
    const { id: _, createdDate: __, sku, barcode, ...rest } = existing;
    get().addProduct({
      ...rest,
      sku: `${sku}-COPY`,
      barcode: `${barcode}1`,
    });
  },

  // Stock Actions
  stockIn: async (sku, qty, vendor, remarks) => {
    try {
      await serverStockIn(sku, qty, vendor, remarks);
      const data = await hydrateStore();
      get().setHydratedData(data);
      get().logActivity(`Stocked IN +${qty} units for SKU: ${sku}`, 'Stock Operations', 'success');
      get().addNotification('success', 'Stock Received', `Added +${qty} units of SKU ${sku}.`);
    } catch (e: any) {
      get().addNotification('error', 'Database Error', e.message || String(e));
    }
  },

  stockOut: async (sku, qty, customer, reason, remarks) => {
    try {
      await serverStockOut(sku, qty, customer, reason, remarks);
      const data = await hydrateStore();
      get().setHydratedData(data);
      get().logActivity(`Stocked OUT -${qty} units for SKU: ${sku}`, 'Stock Operations', 'success');
      get().addNotification('success', 'Stock Dispatched', `Subtracted -${qty} units of SKU ${sku}.`);
    } catch (e: any) {
      get().addNotification('error', 'Database Error', e.message || String(e));
    }
  },

  undoLastAction: () => {
    const last = get().lastAction;
    if (!last) {
      get().addNotification('info', 'Cannot Undo', 'No reversible action registered.');
      return;
    }

    if (last.type === 'stock_out') {
      const { entry, originalGoodQty } = last;
      set((state) => {
        const updatedInventory = state.inventory.map((inv) => {
          if (inv.productId === entry.productId) {
            const product = state.products.find((p) => p.id === entry.productId)!;
            let newStatus: InventoryRecord['status'] = 'Normal';
            if (originalGoodQty === 0) newStatus = 'Out Of Stock';
            else if (originalGoodQty <= product.lowStockThreshold) newStatus = 'Low Stock';
            
            return {
              ...inv,
              goodQty: originalGoodQty,
              availableQty: originalGoodQty,
              status: newStatus,
              lastUpdated: new Date().toISOString(),
            };
          }
          return inv;
        });

        // Filter out the last transaction
        const updatedLedger = state.ledger.filter((led) => led.id !== entry.id);

        return {
          inventory: updatedInventory,
          ledger: updatedLedger,
          lastAction: null,
        };
      });

      get().logActivity(`Reverted Stock Out transaction for SKU: ${entry.sku}`, 'Stock Operations', 'success');
      get().addNotification('success', 'Action Reverted', `Undone stock out of ${entry.qty} units for ${entry.sku}.`);
    }
  },

  // Defective Actions
  markDefective: async (sku, qty, reason) => {
    try {
      await serverMarkDefective(sku, qty, reason);
      const data = await hydrateStore();
      get().setHydratedData(data);
      get().logActivity(`Marked ${qty} units of SKU ${sku} as defective`, 'Defective Inventory', 'success');
      get().addNotification('alert', 'Defect Logged', `Marked ${qty} units of ${sku} as defective.`);
    } catch (e: any) {
      get().addNotification('error', 'Database Error', e.message || String(e));
    }
  },

  scrapDefective: (id) => {
    const defRecord = get().defective.find((d) => d.id === id);
    if (!defRecord) return;

    const newLedger: LedgerEntry = {
      id: `led_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      productId: defRecord.productId,
      sku: defRecord.sku,
      brand: defRecord.brand,
      type: 'defective_scrap',
      qty: defRecord.qty,
      user: get().user?.email || 'admin@atulglass.com',
      shop: defRecord.shop,
      timestamp: new Date().toISOString(),
      remarks: `Scrapped defective unit: ${defRecord.reason}`,
    };

    set((state) => {
      const updatedInventory = state.inventory.map((inv) => {
        if (inv.productId === defRecord.productId) {
          return {
            ...inv,
            defectiveQty: Math.max(0, inv.defectiveQty - defRecord.qty),
            lastUpdated: new Date().toISOString(),
          };
        }
        return inv;
      });

      const updatedDefective = state.defective.map((def) =>
        def.id === id ? { ...def, status: 'scrapped' as const } : def
      );

      return {
        inventory: updatedInventory,
        defective: updatedDefective,
        ledger: [newLedger, ...state.ledger],
      };
    });

    get().logActivity(`Scrapped ${defRecord.qty} defective units of SKU ${defRecord.sku}`, 'Defective Inventory', 'success');
  },

  restoreDefective: (id, qty) => {
    const defRecord = get().defective.find((d) => d.id === id);
    if (!defRecord || defRecord.qty < qty) return;

    const newLedger: LedgerEntry = {
      id: `led_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      productId: defRecord.productId,
      sku: defRecord.sku,
      brand: defRecord.brand,
      type: 'defective_restore',
      qty,
      user: get().user?.email || 'staff@atulglass.com',
      shop: defRecord.shop,
      timestamp: new Date().toISOString(),
      remarks: `Restored defective unit back to inventory`,
    };

    set((state) => {
      const updatedInventory = state.inventory.map((inv) => {
        if (inv.productId === defRecord.productId) {
          const newGood = inv.goodQty + qty;
          const product = state.products.find((p) => p.id === defRecord.productId)!;
          let newStatus: InventoryRecord['status'] = 'Normal';
          if (newGood <= product.lowStockThreshold) newStatus = 'Low Stock';
          
          return {
            ...inv,
            goodQty: newGood,
            defectiveQty: Math.max(0, inv.defectiveQty - qty),
            availableQty: newGood,
            status: newStatus,
            lastUpdated: new Date().toISOString(),
          };
        }
        return inv;
      });

      // Update defective qty or mark status
      const updatedDefective = state.defective.map((def) => {
        if (def.id === id) {
          const remaining = def.qty - qty;
          return {
            ...def,
            qty: remaining,
            status: remaining === 0 ? ('restored' as const) : def.status,
          };
        }
        return def;
      });

      return {
        inventory: updatedInventory,
        defective: updatedDefective,
        ledger: [newLedger, ...state.ledger],
      };
    });

    get().logActivity(`Restored ${qty} units of SKU ${defRecord.sku} from defective to good`, 'Defective Inventory', 'success');
  },

  // Audit Actions
  startAudit: (name) => {
    const newSession: AuditSession = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      date: new Date().toISOString().split('T')[0],
      scanned: {},
      status: 'in-progress',
    };
    
    // Seed scanned items with expected count
    get().inventory.forEach((inv) => {
      newSession.scanned[inv.sku] = {
        expected: inv.goodQty,
        actual: 0,
        status: 'pending',
      };
    });

    set({ activeAudit: newSession });
    get().logActivity(`Started Audit Session: "${name}"`, 'Inventory Audit', 'success');
  },

  scanAuditItem: (sku, qty) => {
    const active = get().activeAudit;
    if (!active) return;

    set((state) => {
      if (!state.activeAudit) return {};
      const record = state.activeAudit.scanned[sku];
      if (!record) return {};
      
      const newActual = record.actual + qty;
      const isOk = newActual === record.expected;

      const updatedScanned = {
        ...state.activeAudit.scanned,
        [sku]: {
          ...record,
          actual: newActual,
          status: isOk ? ('accepted' as const) : record.status,
        },
      };

      return {
        activeAudit: {
          ...state.activeAudit,
          scanned: updatedScanned,
        },
      };
    });
  },

  decideAuditItem: (sku, decision) => {
    set((state) => {
      if (!state.activeAudit) return {};
      const record = state.activeAudit.scanned[sku];
      if (!record) return {};
      
      return {
        activeAudit: {
          ...state.activeAudit,
          scanned: {
            ...state.activeAudit.scanned,
            [sku]: { ...record, status: decision },
          },
        },
      };
    });
  },

  reconcileAudit: () => {
    const active = get().activeAudit;
    if (!active) return;

    // Adjust inventory based on audit actual quantities for all accepted status updates
    set((state) => {
      const updatedInventory = [...state.inventory];
      const newLedgers: LedgerEntry[] = [];
      const shop = state.settings.shop.currentShop;
      const user = state.user?.email || 'admin@atulglass.com';

      Object.entries(active.scanned).forEach(([sku, details]) => {
        if (details.status === 'accepted' && details.actual !== details.expected) {
          const invIdx = updatedInventory.findIndex((inv) => inv.sku === sku);
          if (invIdx !== -1) {
            const diff = details.actual - details.expected;
            const originalInv = updatedInventory[invIdx];
            const product = state.products.find((p) => p.id === originalInv.productId)!;

            let newStatus: InventoryRecord['status'] = 'Normal';
            if (details.actual === 0) newStatus = 'Out Of Stock';
            else if (details.actual <= product.lowStockThreshold) newStatus = 'Low Stock';

            updatedInventory[invIdx] = {
              ...originalInv,
              goodQty: details.actual,
              availableQty: details.actual,
              status: newStatus,
              lastUpdated: new Date().toISOString(),
            };

            newLedgers.push({
              id: `led_aud_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              productId: originalInv.productId,
              sku,
              brand: originalInv.brand,
              type: 'audit_adjust',
              qty: Math.abs(diff),
              user,
              shop,
              timestamp: new Date().toISOString(),
              remarks: `Audit Reconciliation Adjustment: ${diff > 0 ? '+' : ''}${diff} units`,
            });
          }
        }
      });

      const completed = {
        id: active.id,
        name: active.name,
        date: active.date,
        reconciledCount: newLedgers.length,
        status: 'completed',
      };

      return {
        inventory: updatedInventory,
        ledger: [...newLedgers, ...state.ledger],
        completedAudits: [completed, ...state.completedAudits],
        activeAudit: null,
      };
    });

    get().logActivity(`Reconciled Audit Session: "${active.name}"`, 'Inventory Audit', 'success');
    get().addNotification('success', 'Audit Complete', `Reconciled discrepancies and closed audit.`);
  },

  cancelAudit: () => {
    set({ activeAudit: null });
    get().logActivity('Cancelled audit session', 'Inventory Audit', 'success');
  },

  // Migration Actions
  startMigration: (rows) => {
    // rows contain simulated CSV objects
    // Generate mock unknown items (e.g. 5 products with missing barcodes)
    const unknown = [
      { id: 'mig_1', sku: 'SG-TOYO-FORT-WS-FRN-STD', brand: 'Saint Gobain', carModel: 'Fortuner', glassType: 'Windshield', qty: 12 },
      { id: 'mig_2', sku: 'XYG-HYUN-CRETA-RG-REAR-DEM', brand: 'XYG', carModel: 'Creta', glassType: 'Rear Glass', qty: 8 },
      { id: 'mig_3', sku: 'CLA-HON-CITY-DG-FR-STD', brand: 'Clarion', carModel: 'City', glassType: 'Door Glass', qty: 25 },
    ];
    set({
      migrationProgress: { percentage: 20, step: 'Parsing CSV file...', fileLoaded: true },
      unknownInventory: unknown,
    });
    get().logActivity('Uploaded stock migration CSV file', 'Migration Tools', 'success');
  },

  assignMigrationBarcode: (tempId, barcode) => {
    set((state) => {
      const item = state.unknownInventory.find((x) => x.id === tempId);
      if (!item) return {};
      
      // Look up if product exists in db, otherwise assign barcode to it
      const productIndex = state.products.findIndex((p) => p.sku === item.sku);
      let updatedProducts = [...state.products];
      if (productIndex !== -1) {
        updatedProducts[productIndex] = { ...updatedProducts[productIndex], barcode };
      }

      const updatedUnknown = state.unknownInventory.filter((x) => x.id !== tempId);
      const labelPending = [...state.labelPending, item.sku];
      
      const newProgress = {
        percentage: state.unknownInventory.length <= 1 ? 90 : Math.min(80, state.migrationProgress!.percentage + 20),
        step: updatedUnknown.length === 0 ? 'Assigned all barcodes. Ready for import.' : 'Assigning missing barcodes...',
        fileLoaded: true,
      };

      return {
        products: updatedProducts,
        unknownInventory: updatedUnknown,
        labelPending,
        migrationProgress: newProgress,
      };
    });

    get().logActivity(`Assigned barcode ${barcode} to SKU during migration`, 'Migration Tools', 'success');
  },

  reconcileMigration: () => {
    // Add all remaining elements to stock ledger
    set((state) => ({
      migrationProgress: { percentage: 100, step: 'Migration Complete!', fileLoaded: true },
    }));
    get().logActivity('Finished migrating stock records', 'Migration Tools', 'success');
    get().addNotification('success', 'Migration Completed', 'Imported historical inventory balances.');
  },

  // Settings Actions
  updateSettings: (section, values) => {
    set((state) => ({
      settings: {
        ...state.settings,
        [section]: {
          ...state.settings[section],
          ...values,
        },
      },
    }));
    get().logActivity(`Updated ${section} settings`, 'Settings', 'success');
    get().addNotification('info', 'Settings Updated', `System ${section} configurations updated.`);
  },

  setHydratedData: (data: any) => {
    set(data);
  },
}));
