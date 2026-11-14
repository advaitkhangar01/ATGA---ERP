# ERP Robustness & Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Atul Glass Agency ERP from a prototype with mock state into a robust, transactional, secure, and production-ready system with end-to-end database persistence.

**Architecture:** Align Prisma schema with frontend domain contracts to eliminate property mismatches and total-stock `NaN` errors; wire all store CRUD operations to Prisma Server Actions; introduce transaction retry resilience for concurrency; replace dummy authentication with real credential verification and Server Action RBAC session guards; and eliminate all 20 React 19 ESLint render purity violations.

**Tech Stack:** Next.js 16.2.9 (App Router), React 19.2.4, Prisma ORM 5.14.0 (SQLite / PostgreSQL ready), Zustand 5.0, Tailwind CSS v4, TypeScript 5.

**Spec:** Robustness audit report findings from conversation `b12eb77b-6ec6-4e54-ba81-9138d99d01cc` detailing data mismatches, unpersisted store actions, SQLite transaction concurrency panics, authentication bypasses, and lint errors.

## Global Constraints
- Must not break existing UI component styles, icons, animations, or view workflows.
- Must run cleanly under `npm run lint` (0 errors), `npx tsc --noEmit` (0 errors), and `npm run build` (exit 0).
- Server Actions must be strictly typed and validate arguments before executing database mutations.
- Database operations must be transactional (`prisma.$transaction`) with retry backoff for contention resilience.

## Review Focus
1. `Dashboard.tsx` rendering `NaN` for Total Stock, Good Stock, and Defective Stock due to missing `goodQty`/`defectiveQty` properties on DB-hydrated items.
2. Concurrent scanner `stockOut` calls panicking the database transaction runner instead of gracefully serializing or rejecting with a clean user-facing error message.
3. Adding, editing, archiving, or duplicating a product in `Products.tsx` only persisting in client memory and disappearing upon page reload.
4. Server Actions being callable anonymously without verifying authenticated session or user role.
5. React 19 purity errors in `Reports.tsx` (`Date.now()`) and `QuickScan.tsx` (`Math.random()`) causing hydration mismatches and unpredictable render loops.

---

### Task 1: Prisma Schema & Hydration Layer Alignment

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/actions/db.ts`
- Modify: `src/store/useStore.ts:63-75`
- Test: `test-hydration.ts`

**Interfaces:**
- Consumes: Prisma schema models (`Product`, `Inventory`, `Ledger`, `Defective`).
- Produces: `hydrateStore()` returning exact frontend shape matching `Product`, `InventoryRecord`, `LedgerEntry`, and `DefectiveRecord` interfaces with no undefined quantities or missing brand fields.

- [ ] **Step 1: Write test verifying complete schema mapping in `test-hydration.ts`**
```typescript
import { hydrateStore } from './src/actions/db';
import { prisma } from './src/lib/prisma';

async function testHydration() {
  const data = await hydrateStore();
  if (data.inventory.length > 0) {
    const item = data.inventory[0];
    if (typeof item.goodQty !== 'number' || isNaN(item.goodQty)) {
      throw new Error(`Inventory item goodQty is invalid: ${item.goodQty}`);
    }
    if (typeof item.defectiveQty !== 'number' || isNaN(item.defectiveQty)) {
      throw new Error(`Inventory item defectiveQty is invalid: ${item.defectiveQty}`);
    }
  }
  if (data.products.length > 0) {
    const prod = data.products[0];
    if (!prod.carBrand) throw new Error(`Product carBrand is missing: ${prod.sku}`);
  }
  console.log('✅ Hydration test passed: exact contract match.');
}
testHydration().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run test to verify failure**
Run: `npx tsx test-hydration.ts`
Expected: FAIL with `Inventory item goodQty is invalid: undefined` or `Product carBrand is missing`.

- [ ] **Step 3: Update `prisma/schema.prisma`**
Add missing fields to `Product`:
  - `carBrand String @default("Maruti")`
  - `description String @default("")`
  - `compatibleModels String @default("[]")` // JSON stringified array
  - `status String @default("active")` // 'active' | 'deactivated' | 'archived'
  - `barcode String?`
Update `Inventory`:
  - `goodQty Int @default(0)`
  - `defectiveQty Int @default(0)`
  - `availableQty Int @default(0)`
Update `Ledger`:
  - `type String @default("in")` // 'in' | 'out' | 'defective_mark' | 'audit_adjust'
  - `brand String @default("")`
  - `shop String @default("Main Warehouse")`
  - `user String @default("system")`

- [ ] **Step 4: Push Prisma schema to database**
Run: `npx prisma db push`
Expected: Database updated successfully.

- [ ] **Step 5: Refactor `src/actions/db.ts`**
Map DB records to match `Product`, `InventoryRecord`, and `LedgerEntry` interfaces exactly:
  - Populate `goodQty: inv.goodQty`, `defectiveQty: inv.defectiveQty`, `availableQty: inv.availableQty`.
  - Populate `carBrand: p.carBrand`, `description: p.description`, `compatibleModels: JSON.parse(p.compatibleModels || '[]')`, `status: p.status`, `lowStockThreshold: p.threshold`.
  - Ensure `ledger` maps `type: l.type`, `user: l.user`, `shop: l.shop`.

- [ ] **Step 6: Run test to verify it passes**
Run: `npx tsx test-hydration.ts`
Expected: PASS with `✅ Hydration test passed: exact contract match.`

- [ ] **Step 7: Commit changes**
```bash
git add prisma/schema.prisma src/actions/db.ts test-hydration.ts
git commit -m "fix(db): align Prisma schema and hydration mapper with frontend contracts"
```

---

### Task 2: Server Actions & Full CRUD Persistence

**Files:**
- Modify: `src/actions/products.ts`
- Create: `src/actions/defective.ts`
- Modify: `src/actions/audit.ts`
- Modify: `src/store/useStore.ts:88-115,260-338,420-665`
- Test: `test-crud-persistence.ts`

**Interfaces:**
- Consumes: Prisma Client, `hydrateStore()`.
- Produces:
  - `addProduct(data: CreateProductInput): Promise<Product>`
  - `editProduct(id: string, data: UpdateProductInput): Promise<Product>`
  - `archiveProduct(id: string): Promise<void>`
  - `deactivateProduct(id: string): Promise<void>`
  - `scrapDefective(id: string, user: string, shop: string): Promise<void>`
  - `restoreDefective(id: string, qty: number, user: string, shop: string): Promise<void>`
  - `reconcileAudit(sessionId: string, adjustments: AuditAdjustment[]): Promise<void>`

- [ ] **Step 1: Write test verifying CRUD persistence across re-hydration in `test-crud-persistence.ts`**
```typescript
import { addProduct, archiveProduct } from './src/actions/products';
import { hydrateStore } from './src/actions/db';
import { prisma } from './src/lib/prisma';

async function testCrudPersistence() {
  const testSku = `TEST-PERSIST-${Date.now()}`;
  await addProduct({
    sku: testSku,
    brand: 'Saint Gobain',
    carBrand: 'Honda',
    carModel: 'City',
    glassType: 'Windshield',
    description: 'Test Windshield',
    compatibleModels: ['City ZX', 'City VX'],
    status: 'active',
    lowStockThreshold: 8,
    barcode: '123456789012'
  });

  const hydrated = await hydrateStore();
  const found = hydrated.products.find(p => p.sku === testSku);
  if (!found) throw new Error('Added product was not persisted in database');

  await archiveProduct(found.id);
  const hydratedAfterArchive = await hydrateStore();
  const archived = hydratedAfterArchive.products.find(p => p.sku === testSku);
  if (archived?.status !== 'archived') throw new Error('Archived status not persisted');

  console.log('✅ CRUD persistence test passed.');
}
testCrudPersistence().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run test to verify failure**
Run: `npx tsx test-crud-persistence.ts`
Expected: FAIL because `addProduct` doesn't support the full signature and `archiveProduct` is missing from `src/actions/products.ts`.

- [ ] **Step 3: Implement comprehensive Product Actions in `src/actions/products.ts`**
Implement:
  - `addProduct(data)`: creates `Product` and initialized `Inventory` (`goodQty: 0`, `defectiveQty: 0`, `availableQty: 0`) in a single transaction.
  - `editProduct(id, data)`: updates product details and cascades SKU/model updates to `Inventory`.
  - `archiveProduct(id)`: updates product status to `'archived'`.
  - `deactivateProduct(id)`: updates product status to `'deactivated'`.

- [ ] **Step 4: Create `src/actions/defective.ts`**
Implement:
  - `scrapDefective(id: string, user: string, shop: string)`: updates `Defective` status to `'scrapped'`, decrements `Inventory.defectiveQty`, and records a `Ledger` entry with `type: 'defective_scrap'`.
  - `restoreDefective(id: string, qty: number, user: string, shop: string)`: decrements `Defective.quantity`, increments `Inventory.goodQty`, and logs `Ledger` entry with `type: 'defective_restore'`.

- [ ] **Step 5: Implement `reconcileAudit` in `src/actions/audit.ts`**
Implement:
  - Updates inventory quantities for discrepancy SKUs in a transaction.
  - Creates corresponding `audit_adjust` ledger entries.
  - Updates `AuditSession` status to `'completed'`.

- [ ] **Step 6: Wire `useStore.ts` to call Server Actions**
Update `addProduct`, `editProduct`, `archiveProduct`, `deactivateProduct`, `scrapDefective`, `restoreDefective`, and `reconcileAudit` in `src/store/useStore.ts` to:
  1. Call the server action.
  2. Call `await hydrateStore()`.
  3. Update store state using `setHydratedData(data)`.
  4. Show notification and log activity on success or catch error.

- [ ] **Step 7: Run test to verify it passes**
Run: `npx tsx test-crud-persistence.ts`
Expected: PASS with `✅ CRUD persistence test passed.`

- [ ] **Step 8: Commit changes**
```bash
git add src/actions/products.ts src/actions/defective.ts src/actions/audit.ts src/store/useStore.ts test-crud-persistence.ts
git commit -m "feat(actions): implement full database persistence for products, defectives, and audits"
```

---

### Task 3: Transaction Resilience & Concurrency Handling

**Files:**
- Modify: `src/actions/inventory.ts`
- Modify: `src/lib/prisma.ts`
- Modify: `test-concurrency.ts`

**Interfaces:**
- Consumes: Prisma transactional client.
- Produces: `withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T>` helper and resilient `stockIn`, `stockOut`, `markDefective` that handle lock contention gracefully without crashing.

- [ ] **Step 1: Update `test-concurrency.ts` with expected graceful concurrency behavior**
Verify that when 2 simultaneous `stockOut` requests arrive for the final 1 unit of stock:
  - Exactly one request succeeds with `status: 'fulfilled'`.
  - Exactly one request fails with a clean, user-friendly error message (`Insufficient stock for SKU ...`).
  - Neither request crashes the runtime engine (`quaint.rs panic`).
  - Final stock is exactly 0.

- [ ] **Step 2: Run test to verify current engine panic failure**
Run: `npx tsx test-concurrency.ts`
Expected: Shows engine panic / Rust quaint panic.

- [ ] **Step 3: Add SQLite PRAGMA busy_timeout & retry helper in `src/lib/prisma.ts`**
```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// For SQLite environments, enable WAL mode and set a busy timeout so concurrent transactions wait rather than panic
if (process.env.DATABASE_URL?.includes('file:') || !process.env.DATABASE_URL) {
  prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL;').catch(() => {});
  prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000;').catch(() => {});
}

export async function withTransactionRetry<T>(
  action: () => Promise<T>,
  retries = 3,
  delayMs = 100
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await action();
    } catch (err: any) {
      attempt++;
      const isLockError = err?.message?.includes('locked') || err?.message?.includes('busy') || err?.message?.includes('Transaction already closed');
      if (isLockError && attempt <= retries) {
        await new Promise(res => setTimeout(res, delayMs * Math.pow(2, attempt - 1)));
        continue;
      }
      throw err;
    }
  }
}
```

- [ ] **Step 4: Refactor `stockOut` in `src/actions/inventory.ts` with retry wrapper and atomic decrement check**
Ensure that `stockIn`, `stockOut`, and `markDefective` use `withTransactionRetry` and strict transaction options (`maxWait: 5000`, `timeout: 10000`).
In `stockOut`:
```typescript
export async function stockOut(sku: string, qty: number, customer: string, reason: string, remarks: string) {
  return withTransactionRetry(async () => {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { sku } });
      if (!product) throw new Error(`Product with SKU ${sku} not found.`);

      const inventory = await tx.inventory.findUnique({ where: { productId: product.id } });
      if (!inventory || inventory.goodQty < qty) {
        throw new Error(`Insufficient stock for SKU ${sku}.`);
      }

      const updated = await tx.inventory.update({
        where: { productId: product.id },
        data: {
          goodQty: { decrement: qty },
          availableQty: { decrement: qty }
        }
      });

      const ledger = await tx.ledger.create({
        data: {
          type: 'out',
          quantity: qty,
          brand: product.brand,
          shop: 'Main Warehouse',
          user: customer,
          remarks: `${reason}: ${customer}. ${remarks}`,
          productId: product.id
        }
      });

      return { success: true, inventory: updated, ledger };
    }, { maxWait: 5000, timeout: 10000 });
  });
}
```

- [ ] **Step 5: Run concurrency test to verify it passes**
Run: `npx tsx test-concurrency.ts`
Expected: PASS: 1 scan fulfilled, 1 scan rejected with "Insufficient stock", 0 unhandled engine panics, Final Inventory Qty = 0.

- [ ] **Step 6: Commit changes**
```bash
git add src/lib/prisma.ts src/actions/inventory.ts test-concurrency.ts
git commit -m "fix(concurrency): enable SQLite WAL mode, busy timeout, and transaction retries"
```

---

### Task 4: Secure Authentication & Server Action Authorization Guards

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/actions/auth.ts`
- Modify: `src/store/useStore.ts:199-217`
- Modify: `src/app/page.tsx:135-144`
- Modify: `src/middleware.ts`
- Test: `test-auth.ts`

**Interfaces:**
- Consumes: User database model with hashed password.
- Produces:
  - `loginAction(email: string, password: string): Promise<{ success: boolean; user?: { email: string; role: string }; error?: string }>`
  - `logoutAction(): Promise<void>`
  - `verifySession(): Promise<{ email: string; role: string } | null>`
  - `requireRole(roles: string[]): Promise<{ email: string; role: string }>`

- [ ] **Step 1: Write test for authentication and authorization in `test-auth.ts`**
```typescript
import { loginAction, verifySession } from './src/actions/auth';
import { prisma } from './src/lib/prisma';

async function testAuth() {
  // Test wrong password
  const failResult = await loginAction('admin@atulglass.com', 'wrongpassword');
  if (failResult.success) throw new Error('Login should have failed with wrong password');

  // Test valid seed user login
  const okResult = await loginAction('admin@atulglass.com', 'Admin@123');
  if (!okResult.success || okResult.user?.role !== 'admin') {
    throw new Error('Valid admin credentials failed to authenticate');
  }

  console.log('✅ Auth test passed.');
}
testAuth().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run test to verify failure**
Run: `npx tsx test-auth.ts`
Expected: FAIL because `loginAction` does not exist yet.

- [ ] **Step 3: Implement `src/lib/auth.ts` and `src/actions/auth.ts`**
  - Implement password hashing verification (using Node crypto `scryptSync` / `pbkdf2Sync` to avoid extra binary dependencies).
  - Seed default admin user (`admin@atulglass.com` / `Admin@123`) and staff user (`staff@atulglass.com` / `Staff@123`) if not present.
  - Set signed HttpOnly session cookie on successful login.
  - Implement `verifySession()` reading the session cookie.
  - Implement `requireRole(['admin'])` that throws an `Unauthorized` error if session is missing or role is insufficient.

- [ ] **Step 4: Protect Server Actions with `requireRole`**
Add session check to:
  - `src/actions/products.ts`: `requireRole(['admin'])` for add/edit/archive.
  - `src/actions/inventory.ts`: `requireRole(['admin', 'staff'])` for stockIn/stockOut/defective.
  - `src/actions/audit.ts`: `requireRole(['admin'])` for reconcile.

- [ ] **Step 5: Connect `useStore.ts` and `src/app/page.tsx` to `loginAction` and `logoutAction`**
Replace hardcoded credentials check with call to `loginAction(email, password)`.

- [ ] **Step 6: Run test to verify it passes**
Run: `npx tsx test-auth.ts`
Expected: PASS with `✅ Auth test passed.`

- [ ] **Step 7: Commit changes**
```bash
git add src/lib/auth.ts src/actions/auth.ts src/actions/products.ts src/actions/inventory.ts src/actions/audit.ts src/store/useStore.ts src/app/page.tsx test-auth.ts
git commit -m "feat(security): implement session-based authentication and Server Action authorization guards"
```

---

### Task 5: React 19 Render Purity & ESLint Zero-Error Pass

**Files:**
- Modify: `src/views/Reports.tsx:60-70`
- Modify: `src/views/QuickScan.tsx:45-55`
- Modify: `src/views/Users.tsx:240-250`
- Modify: `src/views/StockOperations.tsx`
- Modify: `src/views/Settings.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: ESLint configuration and React 19 compiler rules.
- Produces: 0 ESLint errors and 0 warnings on `npm run lint`.

- [ ] **Step 1: Check current lint errors**
Run: `npm run lint`
Expected: 20 errors, 61 warnings.

- [ ] **Step 2: Fix render purity violation in `src/views/Reports.tsx`**
In `Reports.tsx`, replace `Date.now()` inside the render calculation with a memoized `currentTimestamp` or filter calculation anchored in state/props.

- [ ] **Step 3: Fix purity violation in `src/views/QuickScan.tsx`**
In `QuickScan.tsx`, move `Math.random()` selection out of component render logic into the event handler `handleSimulateHardwareScan`.

- [ ] **Step 4: Fix `any` types and unused variables in `src/views/Users.tsx`**
Replace `(role: any)` with explicit type `User['role']` and remove unused Lucide icons (`Plus`, `Trash2`).

- [ ] **Step 5: Clean up unused imports and variables in `src/views/StockOperations.tsx` and `src/app/page.tsx`**
Remove unused imports: `CardHeader`, `CardTitle`, `AnimatePresence`, `isLoadingDB`, `isProfileOpen`. Add missing `useEffect` dependency or pass stable updater.

- [ ] **Step 6: Run `npm run lint` to verify 0 errors**
Run: `npm run lint`
Expected: PASS with 0 errors.

- [ ] **Step 7: Verify complete build**
Run: `npm run build`
Expected: Optimized production build finishes with exit code 0.

- [ ] **Step 8: Commit changes**
```bash
git add src/views/Reports.tsx src/views/QuickScan.tsx src/views/Users.tsx src/views/StockOperations.tsx src/views/Settings.tsx src/app/page.tsx
git commit -m "fix(lint): resolve React 19 render purity errors and clean up unused variables"
```

---

## Execution Handoff

Please review this plan. Which execution approach would you prefer?

- **Subagent-driven** - A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, followed by a full review at the end. Most thorough.
- **Native** - I implement every task myself in this session, then verify the entire branch at the end. Fastest and most direct.

For this plan I recommend **Native**, because the tasks are tightly coupled across the Prisma schema, server actions, and Zustand store, allowing direct step-by-step verification without context switching overhead. Does the plan capture what you want, and which approach should we use?
