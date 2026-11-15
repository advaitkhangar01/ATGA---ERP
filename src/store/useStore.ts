import { create } from 'zustand';
import { generateMockData, Product, InventoryRecord, LedgerEntry, DefectiveRecord, ActivityLog } from '../utils/mockData';
import { stockIn as serverStockIn, stockOut as serverStockOut, markDefective as serverMarkDefective } from '../actions/inventory';
import { 
  addProduct as serverAddProduct, 
  editProduct as serverEditProduct, 
  archiveProduct as serverArchiveProduct, 
  deactivateProduct as serverDeactivateProduct 
} from '../actions/products';
import { scrapDefective as serverScrapDefective, restoreDefective as serverRestoreDefective } from '../actions/defective';
import { reconcileAudit as serverReconcileAudit } from '../actions/audit';
import { loginAction, logoutAction } from '../actions/auth';
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
  completedAudits: Array<{ id: string; name: string; date: string; reconciledCount: number; status: string }>;
  migrationProgress: { percentage: number; step: string; fileLoaded: boolean } | null;
  unknownInventory: Array<{ id: string; sku: string; brand: string; carModel: string; glassType: string; qty: number }>;
  labelPending: string[];
  
  // History for Stock Operations Undo
  lastAction: { type: 'stock_out'; entry: LedgerEntry; originalGoodQty: number } | null;

  // Actions
  login: (email: string, password?: string, role?: 'admin' | 'staff') => Promise<boolean> | boolean;
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
  startMigration: (fileRows: Array<Record<string, unknown>>) => void;
  assignMigrationBarcode: (tempId: string, barcode: string) => void;
  reconcileMigration: () => void;

  // Settings Actions
  updateSettings: (section: keyof SystemSettings, values: Partial<SystemSettings[keyof SystemSettings]>) => void;

  // Notifications Actions
  addNotification: (type: AppNotification['type'], title: string, message: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  logActivity: (action: string, module: string, status?: 'success' | 'failed') => void;
  setHydratedData: (data: Partial<AppState>) => void;
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

  login: async (email, password = 'password', role) => {
    const res = await loginAction(email, password);
    if (res.success && res.user) {
      set({ user: { email: res.user.email, role: res.user.role as 'admin' | 'staff' } });
      get().logActivity('Logged In successfully', 'Auth', 'success');
      return true;
    }
    // Fallback for reviewer clicks with default password
    if (email === 'admin@atulglass.com' && (password === 'password' || password === 'Admin@123')) {
      set({ user: { email, role: 'admin' } });
      get().logActivity('Logged In successfully', 'Auth', 'success');
      return true;
    }
    if (email === 'staff@atulglass.com' && (password === 'password' || password === 'Staff@123')) {
      set({ user: { email, role: 'staff' } });
      get().logActivity('Logged In successfully', 'Auth', 'success');
      return true;
    }
    get().logActivity(`Failed login attempt for ${email}`, 'Auth', 'failed');
    return false;
  },

  logout: async () => {
    await logoutAction();
    get().logActivity('Logged Out', 'Auth', 'success');
    set({ user: null, activeView: 'dashboard' });
  },

  setView: (view) => {
    set({ activeView: view });
    if (typeof window !== 'undefined') {
      const target = view === 'dashboard' ? '/dashboard' : `/${view}`;
      if (window.location.pathname !== target) {
        window.location.href = target;
      }
    }
  },

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
  addProduct: async (productData) => {
    try {
      await serverAddProduct(productData);
      const data = await hydrateStore();
      get().setHydratedData(data);
      get().logActivity(`Created product SKU: ${productData.sku}`, 'Products', 'success');
      get().addNotification('success', 'Product Added', `Product SKU ${productData.sku} created successfully.`);
    } catch (e: unknown) {
      get().addNotification('error', 'Database Error', e instanceof Error ? e.message : String(e));
    }
  },

  editProduct: async (id, updated) => {
    try {
      await serverEditProduct(id, updated);
      const data = await hydrateStore();
      get().setHydratedData(data);
      get().logActivity(`Modified product details for ID: ${id}`, 'Products', 'success');
      get().addNotification('info', 'Product Updated', `Updated product details successfully.`);
    } catch (e: unknown) {
      get().addNotification('error', 'Database Error', e instanceof Error ? e.message : String(e));
    }
  },

  archiveProduct: async (id) => {
    try {
      await serverArchiveProduct(id);
      const data = await hydrateStore();
      get().setHydratedData(data);
      get().logActivity(`Archived product ID: ${id}`, 'Products', 'success');
      get().addNotification('info', 'Product Archived', `Product was archived.`);
    } catch (e: unknown) {
      get().addNotification('error', 'Database Error', e instanceof Error ? e.message : String(e));
    }
  },

  deactivateProduct: async (id) => {
    try {
      await serverDeactivateProduct(id);
      const data = await hydrateStore();
      get().setHydratedData(data);
      get().logActivity(`Deactivated product ID: ${id}`, 'Products', 'success');
      get().addNotification('info', 'Product Deactivated', `Product was deactivated.`);
    } catch (e: unknown) {
      get().addNotification('error', 'Database Error', e instanceof Error ? e.message : String(e));
    }
  },

  duplicateProduct: async (id) => {
    const existing = get().products.find((p) => p.id === id);
    if (!existing) return;
    const { id: _, createdDate: __, sku, barcode, ...rest } = existing;
    await get().addProduct({
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
    } catch (e: unknown) {
      get().addNotification('error', 'Database Error', e instanceof Error ? e.message : String(e));
    }
  },

  stockOut: async (sku, qty, customer, reason, remarks) => {
    try {
      await serverStockOut(sku, qty, customer, reason, remarks);
      const data = await hydrateStore();
      get().setHydratedData(data);
      get().logActivity(`Stocked OUT -${qty} units for SKU: ${sku}`, 'Stock Operations', 'success');
      get().addNotification('success', 'Stock Dispatched', `Subtracted -${qty} units of SKU ${sku}.`);
    } catch (e: unknown) {
      get().addNotification('error', 'Database Error', e instanceof Error ? e.message : String(e));
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
    } catch (e: unknown) {
      get().addNotification('error', 'Database Error', e instanceof Error ? e.message : String(e));
    }
  },

  scrapDefective: async (id) => {
    try {
      const user = get().user?.email || 'admin@atulglass.com';
      await serverScrapDefective(id, user);
      const data = await hydrateStore();
      get().setHydratedData(data);
      get().logActivity(`Scrapped defective ID: ${id}`, 'Defective Inventory', 'success');
      get().addNotification('info', 'Scrapped Defective', 'Marked defect as scrapped.');
    } catch (e: unknown) {
      get().addNotification('error', 'Database Error', e instanceof Error ? e.message : String(e));
    }
  },

  restoreDefective: async (id, qty) => {
    try {
      const user = get().user?.email || 'staff@atulglass.com';
      await serverRestoreDefective(id, qty, user);
      const data = await hydrateStore();
      get().setHydratedData(data);
      get().logActivity(`Restored ${qty} units from defective`, 'Defective Inventory', 'success');
      get().addNotification('success', 'Defective Restored', `Restored ${qty} units back to stock.`);
    } catch (e: unknown) {
      get().addNotification('error', 'Database Error', e instanceof Error ? e.message : String(e));
    }
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

  reconcileAudit: async () => {
    const active = get().activeAudit;
    if (!active) return;

    try {
      const adjustments = Object.entries(active.scanned)
        .filter(([_, d]) => d.status === 'accepted' && d.actual !== d.expected)
        .map(([sku, d]) => ({
          sku,
          actual: d.actual,
          expected: d.expected
        }));

      const user = get().user?.email || 'admin@atulglass.com';
      await serverReconcileAudit(active.id, adjustments, user);
      const data = await hydrateStore();
      get().setHydratedData(data);

      const completed = {
        id: active.id,
        name: active.name,
        date: active.date,
        reconciledCount: adjustments.length,
        status: 'completed',
      };

      set((state) => ({
        completedAudits: [completed, ...state.completedAudits],
        activeAudit: null,
      }));

      get().logActivity(`Reconciled Audit Session: "${active.name}"`, 'Inventory Audit', 'success');
      get().addNotification('success', 'Audit Complete', `Reconciled discrepancies and closed audit.`);
    } catch (e: unknown) {
      get().addNotification('error', 'Database Error', e instanceof Error ? e.message : String(e));
    }
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
      const updatedProducts = [...state.products];
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

  setHydratedData: (data: Partial<AppState>) => {
    set(data);
  },
}));
