# 03. PostgreSQL Data Model & Migration Specifications

**Database Engine:** PostgreSQL 16  
**ORM:** Prisma 5.14.0  
**Baseline Strategy:** Clean PostgreSQL baseline migration (`prisma migrate dev --name init_postgres`) and seed script. No SQLite migration history ported.

---

## 1. Final Production Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  role      String   // 'admin' | 'staff'
  password  String   // salt:hash via Node scryptSync
  name      String   @default("")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ledgers   Ledger[]

  @@index([email])
}

model Product {
  id               String     @id @default(cuid())
  sku              String     @unique
  brand            String     // 'AIS' | 'Saint Gobain' | 'XYG' | 'Fuyao'
  carBrand         String     // 'Maruti' | 'Hyundai' | 'Tata' | 'Mahindra' | etc.
  carModel         String     // 'Swift' | 'Creta' | 'Nexon' | etc.
  glassType        String     // 'Windshield' | 'Rear Glass' | 'Door Glass' | 'Quarter Glass' | 'Vent Glass' | 'Sunroof'
  position         String     @default("Front") // 'Front' | 'Rear' | 'Front Left' | 'Front Right' | 'Rear Left' | 'Rear Right'
  description      String     @default("")
  compatibleModels String     @default("[]") // JSON stringified array of models
  status           String     @default("active") // 'active' | 'deactivated' | 'archived'
  threshold        Int        @default(5)
  barcode          String?    @unique
  createdDate      DateTime   @default(now())
  inventory        Inventory?
  ledgers          Ledger[]

  @@index([sku])
  @@index([carBrand, carModel])
  @@index([brand])
}

model Inventory {
  id           String   @id @default(cuid())
  productId    String   @unique
  product      Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  goodQty      Int      @default(0) // Must remain >= 0 enforced by atomic decrement
  defectiveQty Int      @default(0)
  rackLocation String   @default("RACK-A-01") // Slotted vertical A-frame storage location
  lastUpdated  DateTime @default(now()) @updatedAt

  @@index([productId])
  @@index([rackLocation])
}

model Ledger {
  id         String   @id @default(cuid())
  type       String   // 'IN' | 'OUT' | 'DEFECTIVE_MARK' | 'DEFECTIVE_SCRAP' | 'DEFECTIVE_RESTORE' | 'AUDIT_ADJUST'
  quantity   Int      // Quantity delta
  brand      String   @default("")
  shop       String   @default("Nagpur Central Warehouse")
  user       String   @default("system") // Email or username of operator
  remarks    String?  // Reference note, customer/vendor name, reason
  timestamp  DateTime @default(now())
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId     String?
  userRel    User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([productId])
  @@index([timestamp])
  @@index([type])
}

model Defective {
  id          String   @id @default(cuid())
  sku         String
  quantity    Int
  reason      String   // 'Transit Damage' | 'Delamination' | 'Handling Breakage' | 'Installation Crack'
  timestamp   DateTime @default(now())
  status      String   @default("pending") // 'pending' | 'scrapped' | 'restored'
  resolvedAt  DateTime?
  resolvedBy  String?

  @@index([sku])
  @@index([status])
}

model AuditSession {
  id          String      @id @default(cuid())
  name        String
  startDate   DateTime    @default(now())
  completedAt DateTime?
  status      String      @default("in-progress") // 'in-progress' | 'completed' | 'cancelled'
  scans       AuditScan[]
}

model AuditScan {
  id             String       @id @default(cuid())
  auditSessionId String
  auditSession   AuditSession @relation(fields: [auditSessionId], references: [id], onDelete: Cascade)
  sku            String
  expectedQty    Int
  actualQty      Int
  status         String       @default("pending") // 'pending' | 'reconciled'
  scannedAt      DateTime     @default(now())

  @@index([auditSessionId])
  @@index([sku])
}
```

---

## 2. Invariants & Data Integrity Enforcements

1. **Non-Negative Inventory Invariant (`goodQty >= 0`):**
   - No stock dispatch can ever push inventory below 0.
   - Enforced at database execution time via conditional atomic decrement:
     `UPDATE "Inventory" SET "goodQty" = "goodQty" - n WHERE "productId" = $1 AND "goodQty" >= n`.
   - If 0 rows are updated, the transaction rolls back immediately and raises `InsufficientStockError`.
2. **Unique SKU Guarantee:**
   - Standard format: `[Brand]-[CarBrand]-[Model]-[Type]-[Pos]-[Feature]`.
   - The `@unique` constraint on `Product.sku` guarantees no two catalog entries share an SKU.
3. **Mandatory Storage Rack / Bin Location:**
   - Every `Inventory` row requires a valid `rackLocation` string (e.g., `RACK-A-01` to `RACK-F-12`), ensuring physical glass sheets can be located in warehouse A-frames without handling search fatigue.
4. **Derived `availableQty` Formula:**
   - Removed the `availableQty` column from the schema.
   - Any query computing available units derives it dynamically:
     $$\text{availableQty} = \text{goodQty} - \text{reservedQty}$$

---

## 3. Ledger & Audit Trail Design

Every inventory change is an immutable entry in the `Ledger` table. 

| Transaction Type | Quantity Sign | Triggering Event | Ledger Type |
| :--- | :---: | :--- | :--- |
| **Vendor Inward** | `+n` | New shipment received from manufacturer | `IN` |
| **Counter / Dispatch** | `-n` | Glass issued to workshop or retail client | `OUT` |
| **Defective Quarantine** | `-n` (good) / `+n` (defective) | Breakage or scratch detected | `DEFECTIVE_MARK` |
| **Defective Scrap** | `-n` (defective) | Admin confirms physical disposal | `DEFECTIVE_SCRAP` |
| **Defective Restore** | `+n` (good) / `-n` (defective) | Supplier warranty replacement or claim | `DEFECTIVE_RESTORE` |
| **Cycle Audit Adjustment**| `+/- delta` | Physical count differs from system count | `AUDIT_ADJUST` |

---

## 4. Indexing Strategy for Query Performance

1. `Product(sku)`: Instant B-tree lookup on barcode scan and search input.
2. `Product(carBrand, carModel)`: Rapid filtering when counter staff selects a customer's vehicle.
3. `Inventory(productId)`: Fast one-to-one foreign key join with Product.
4. `Inventory(rackLocation)`: Quick grouping for rack-by-rack physical audits.
5. `Ledger(productId, timestamp)`: Optimized for generating chronological product movement histories without full table scans.

---

## 5. Seed & Real Data Import Plan (`XYG BL LIST 06.11.2023.xlsx`)

### Step 1: Default Admin & Staff Accounts
- Default Admin: `admin@atulglass.com` / `Admin@123` (role: `admin`, name: `Atul Gupta`)
- Default Staff: `staff@atulglass.com` / `Staff@123` (role: `staff`, name: `Ramesh Kumar`)

### Step 2: Automated Excel Import (`prisma/seed.ts`)
- The file [`XYG BL LIST 06.11.2023.xlsx`](file:///D:/Office/Softwares-Office-Clients/Atulglassagency-ERP/XYG%20BL%20LIST%2006.11.2023.xlsx) contains 140+ dealer catalog records for Atul Glass Agency, Nagpur.
- Parse `Sheet1`:
  - Columns: `SR.NO.`, `ITEM` (e.g. `ACCENT B/L DEF`, `ACCORD B/L (III) (TAO)`, `ALTIS B/L`), `CUST RATE`.
  - Item name decomposition:
    - Vehicle Model: `Accent`, `Accord`, `Altis`, `City`, `Innova`, `Swift`, etc.
    - Glass Type: `B/L` (Back Light / Rear Glass) or `W/S` (Windshield).
    - Feature: `DEF` (Demister/Defogger), `(P)` (Plain), `TAO` (Antenna).
- Map each parsed row into the standard SKU format:
  `XYG-[CarBrand]-[Model]-BL-REAR-[Feature]`
- Create corresponding `Product` row and initialize `Inventory` row with `goodQty: 0`, `rackLocation: "RACK-A-01"`.
- This ensures production startup with real Nagpur distributor product catalog lines ready for physical stock inward scanning.
