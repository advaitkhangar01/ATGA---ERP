export interface Product {
  id: string;
  sku: string;
  brand: string;
  carBrand: string;
  carModel: string;
  glassType: string;
  description: string;
  compatibleModels: string[];
  status: 'active' | 'deactivated' | 'archived';
  lowStockThreshold: number;
  barcode: string;
  createdDate: string;
}

export interface InventoryRecord {
  productId: string;
  sku: string;
  brand: string;
  carModel: string;
  glassType: string;
  goodQty: number;
  defectiveQty: number;
  availableQty: number;
  status: 'Normal' | 'Low Stock' | 'Critical' | 'Out Of Stock';
  location: string;
  lastUpdated: string;
}

export interface LedgerEntry {
  id: string;
  productId: string;
  sku: string;
  brand: string;
  type: 'in' | 'out' | 'defective_mark' | 'defective_scrap' | 'defective_restore' | 'audit_adjust' | 'migration';
  qty: number;
  user: string;
  shop: string;
  timestamp: string;
  vendor?: string;
  customer?: string;
  reason?: string;
  remarks?: string;
}

export interface DefectiveRecord {
  id: string;
  productId: string;
  sku: string;
  brand: string;
  qty: number;
  reason: string;
  timestamp: string;
  status: 'reported' | 'scrapped' | 'restored';
  user: string;
  shop: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  module: string;
  timestamp: string;
  ip: string;
  status: 'success' | 'failed';
}

// Data options
const BRANDS = ['Saint Gobain', 'Clarion', 'XYG'];
const CAR_BRANDS_MODELS: Record<string, string[]> = {
  Maruti: ['Swift', 'Dzire', 'Baleno', 'Brezza', 'Eeco'],
  Honda: ['City', 'Amaze', 'Civic', 'WR-V'],
  Hyundai: ['Creta', 'i20', 'Verna', 'Venue', 'Alcazar'],
  Toyota: ['Innova Crysta', 'Fortuner', 'Glanza', 'Urban Cruiser'],
  Tata: ['Nexon', 'Altroz', 'Harrier', 'Safari', 'Tiago'],
  Mahindra: ['XUV700', 'Thar', 'Scorpio-N', 'Bolero', 'XUV300'],
};
const GLASS_TYPES = ['Windshield', 'Rear Glass', 'Door Glass', 'Quarter Glass'];
const POSITIONS = ['Front', 'Rear', 'Front Left', 'Front Right', 'Rear Left', 'Rear Right', 'Quarter Left', 'Quarter Right'];
const GLASS_FEATURES = ['Standard Green', 'Rain Sensor', 'ADAS Bracket', 'Acoustic PVB', 'Privacy Tint', 'Demister Heated'];
const LOCATIONS = ['Warehouse A1-B3', 'Warehouse A2-C1', 'Warehouse B2-E4', 'Shop-Shelf 1A', 'Shop-Shelf 2B', 'Service-Bay 3'];
const SHOPS = ['Main Warehouse', 'City Showroom', 'Service Center'];
const VENDORS = ['Glass Corp India', 'Auto Glass Distributors', 'Bharat Safety Glass', 'Apex Automotive Suppliers'];
const CUSTOMERS = ['Express Auto Care', 'Windshield Experts Shop', 'Mahindra Service Center', 'Honda Plaza Workshop', 'Walk-in Retail Customer'];
const DEFECT_REASONS = ['Transit Scratch', 'Chipped Corner', 'Delamination Bubble', 'Lamination Crack', 'Incorrect Curvature', 'ADAS Bracket Misaligned'];
const USERS = ['admin@atulglass.com', 'staff@atulglass.com'];
const MODULES = ['Auth', 'Inventory', 'Products', 'Barcodes', 'Stock Operations', 'Defective Inventory', 'Inventory Audit', 'Migration Tools', 'Reports', 'Users', 'Settings'];
const IP_ADDRESSES = ['192.168.1.45', '192.168.1.102', '10.0.0.12', '182.74.88.19', '122.160.22.41'];

// Helper to get random item
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate deterministic data using seed or simple linear congruential generator
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  nextRange(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min));
  }
  nextItem<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

export function generateMockData() {
  const rng = new SeededRandom(42); // Seeded for reproducibility
  
  // 1. Generate 520 Products
  const products: Product[] = [];
  const productSkuSet = new Set<string>();

  // Ensure variety
  const carBrands = Object.keys(CAR_BRANDS_MODELS);
  let idCounter = 1000;

  while (products.length < 520) {
    const brand = rng.nextItem(BRANDS);
    const carBrand = rng.nextItem(carBrands);
    const carModel = rng.nextItem(CAR_BRANDS_MODELS[carBrand]);
    const glassType = rng.nextItem(GLASS_TYPES);
    const position = rng.nextItem(POSITIONS);
    const feature = rng.nextItem(GLASS_FEATURES);

    // Create unique SKU: BRAND-CARBRAND-MODEL-TYPE-POSITION-FEATURE_ABBR
    const brandAbbr = brand.toUpperCase().replace(/\s+/g, '').slice(0, 3);
    const carBrandAbbr = carBrand.toUpperCase().replace(/\s+/g, '').slice(0, 3);
    const modelAbbr = carModel.toUpperCase().replace(/\s+/g, '').slice(0, 4);
    const typeAbbr = glassType.toUpperCase().slice(0, 2);
    const posAbbr = position.toUpperCase().replace(/\s+/g, '').slice(0, 3);
    const featAbbr = feature.toUpperCase().replace(/\s+/g, '').slice(0, 3);

    const sku = `${brandAbbr}-${carBrandAbbr}-${modelAbbr}-${typeAbbr}-${posAbbr}-${featAbbr}`;

    if (productSkuSet.has(sku)) continue;
    productSkuSet.add(sku);

    const barcode = rng.nextRange(100000000000, 999999999999).toString();
    const createdDate = new Date(Date.now() - rng.nextRange(30, 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    products.push({
      id: `prod_${idCounter++}`,
      sku,
      brand,
      carBrand,
      carModel,
      glassType,
      description: `${brand} ${glassType} for ${carBrand} ${carModel} (${position}, ${feature})`,
      compatibleModels: [carModel, `${carModel} facelift`, `${carModel} Classic`],
      status: rng.next() > 0.05 ? 'active' : (rng.next() > 0.5 ? 'deactivated' : 'archived'),
      lowStockThreshold: rng.nextRange(5, 20),
      barcode,
      createdDate,
    });
  }

  // 2. Generate Inventory Records (Good and Defective quantities per product)
  const inventory: InventoryRecord[] = [];
  products.forEach((prod) => {
    // Some products have high stock, some low, some out of stock
    const coinFlip = rng.next();
    let goodQty = rng.nextRange(10, 80);
    let defectiveQty = rng.nextRange(0, 5);

    if (coinFlip < 0.10) {
      goodQty = 0; // Out of stock
      defectiveQty = 0;
    } else if (coinFlip < 0.25) {
      goodQty = rng.nextRange(1, prod.lowStockThreshold); // Low stock
    }

    const availableQty = goodQty;
    let status: 'Normal' | 'Low Stock' | 'Critical' | 'Out Of Stock' = 'Normal';
    if (goodQty === 0) {
      status = 'Out Of Stock';
    } else if (goodQty <= Math.ceil(prod.lowStockThreshold / 2)) {
      status = 'Critical';
    } else if (goodQty <= prod.lowStockThreshold) {
      status = 'Low Stock';
    }

    const location = rng.nextItem(LOCATIONS);
    const lastUpdated = new Date(Date.now() - rng.nextRange(0, 15) * 24 * 60 * 60 * 1000).toISOString();

    inventory.push({
      productId: prod.id,
      sku: prod.sku,
      brand: prod.brand,
      carModel: `${prod.carBrand} ${prod.carModel}`,
      glassType: prod.glassType,
      goodQty,
      defectiveQty,
      availableQty,
      status,
      location,
      lastUpdated,
    });
  });

  // 3. Generate Stock Ledger Entries (5000+ records representing stock history)
  const ledger: LedgerEntry[] = [];
  let ledgerCounter = 1;
  const nowMs = Date.now();

  for (let i = 0; i < 5050; i++) {
    const prod = rng.nextItem(products);
    const type = rng.nextItem(['in', 'in', 'out', 'out', 'out', 'defective_mark', 'audit_adjust', 'migration']) as LedgerEntry['type'];
    const qty = rng.nextRange(1, 15);
    const user = rng.nextItem(USERS);
    const shop = rng.nextItem(SHOPS);
    // Chronologically distributed backwards
    const timestamp = new Date(nowMs - rng.nextRange(0, 90) * 24 * 60 * 60 * 1000 - rng.nextRange(0, 24) * 60 * 60 * 1000).toISOString();

    let vendor: string | undefined;
    let customer: string | undefined;
    let reason: string | undefined;
    let remarks: string | undefined;

    if (type === 'in') {
      vendor = rng.nextItem(VENDORS);
      remarks = `Received consignment from ${vendor}`;
    } else if (type === 'out') {
      customer = rng.nextItem(CUSTOMERS);
      reason = rng.nextItem(['Sale Delivery', 'Internal Workshop', 'Replacement Warranty']);
      remarks = `Delivered to ${customer} for ${reason}`;
    } else if (type === 'defective_mark') {
      reason = rng.nextItem(DEFECT_REASONS);
      remarks = `Damaged: ${reason}`;
    } else if (type === 'audit_adjust') {
      remarks = rng.next() > 0.5 ? 'Audit surplus' : 'Audit deficit reconciliation';
    } else {
      remarks = 'Initial inventory migration import';
    }

    ledger.push({
      id: `led_${ledgerCounter++}`,
      productId: prod.id,
      sku: prod.sku,
      brand: prod.brand,
      type,
      qty,
      user,
      shop,
      timestamp,
      vendor,
      customer,
      reason,
      remarks,
    });
  }

  // Sort ledger chronologically
  ledger.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // 4. Generate Defective records (200+ records)
  const defective: DefectiveRecord[] = [];
  let defectiveCounter = 1;
  for (let i = 0; i < 220; i++) {
    const prod = rng.nextItem(products);
    const qty = rng.nextRange(1, 4);
    const reason = rng.nextItem(DEFECT_REASONS);
    const status = rng.nextItem(['reported', 'reported', 'scrapped', 'restored']) as DefectiveRecord['status'];
    const user = rng.nextItem(USERS);
    const shop = rng.nextItem(SHOPS);
    const timestamp = new Date(nowMs - rng.nextRange(1, 60) * 24 * 60 * 60 * 1000).toISOString();

    defective.push({
      id: `def_${defectiveCounter++}`,
      productId: prod.id,
      sku: prod.sku,
      brand: prod.brand,
      qty,
      reason,
      timestamp,
      status,
      user,
      shop,
    });
  }

  // 5. Generate Activity Logs (1000+ records)
  const activityLogs: ActivityLog[] = [];
  let logCounter = 1;
  const actions = [
    { action: 'Logged In successfully', module: 'Auth' },
    { action: 'Updated System Settings', module: 'Settings' },
    { action: 'Created new product entry', module: 'Products' },
    { action: 'Printed 24 barcode labels', module: 'Barcodes' },
    { action: 'Completed Stock In consignment', module: 'Stock Operations' },
    { action: 'Scrapped defective glass panels', module: 'Defective Inventory' },
    { action: 'Initiated Inventory Audit Session', module: 'Inventory Audit' },
    { action: 'Reconciled audit mismatch', module: 'Inventory Audit' },
    { action: 'Imported CSV stock list', module: 'Migration Tools' },
    { action: 'Generated Monthly Stock Report', module: 'Reports' },
    { action: 'Modified User permission role', module: 'Users' },
  ];

  for (let i = 0; i < 1050; i++) {
    const { action, module } = rng.nextItem(actions);
    const user = rng.nextItem(USERS);
    const timestamp = new Date(nowMs - rng.nextRange(0, 45) * 24 * 60 * 60 * 1000 - rng.nextRange(0, 20) * 60 * 60 * 1000).toISOString();
    const ip = rng.nextItem(IP_ADDRESSES);
    const status = rng.next() > 0.02 ? 'success' : 'failed' as const;

    activityLogs.push({
      id: `log_${logCounter++}`,
      user,
      action: status === 'failed' ? `Failed attempt: ${action}` : action,
      module,
      timestamp,
      ip,
      status,
    });
  }

  // Sort logs chronologically reversed for latest feed
  activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    products,
    inventory,
    ledger,
    defective,
    activityLogs,
  };
}
