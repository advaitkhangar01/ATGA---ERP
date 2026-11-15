# 06. Phased Implementation & Verification Plan

**Workflow Rule:** Execute one phase at a time on a feature branch. After each phase: verify `tsc --noEmit` (0 errors), `npm run lint` (0 errors), `npm run build` (exit 0), run tests, commit with the specified message, and provide a 5-line summary.

---

## Phase 1: App Router Route Migration & AppShell Navigation

**Objective:** Break the single-page view switcher in `src/app/page.tsx` into real Next.js App Router routes with a persistent `AppShell` sidebar, eliminating `activeView` client state.

### Tasks:
1. Create `src/components/AppShell.tsx` based on the sidebar model in `ATGA-ERP`:
   - Persistent left sidebar with icons (`lucide-react`) and text labels.
   - Active route highlighting via `usePathname()`.
   - Role-filtered navigation links (Admin vs Staff).
   - Top bar displaying current user name, role, warehouse name ("Nagpur Central Warehouse"), and Logout button.
   - Breadcrumbs navigation.
2. Create route group `src/app/(app)/layout.tsx` wrapping all protected pages in `<AppShell>`.
3. Create 15 route pages:
   - `src/app/(app)/dashboard/page.tsx`
   - `src/app/(app)/inventory/page.tsx`
   - `src/app/(app)/products/page.tsx`
   - `src/app/(app)/stock-operations/page.tsx`
   - `src/app/(app)/quick-scan/page.tsx`
   - `src/app/(app)/defective/page.tsx`
   - `src/app/(app)/low-stock/page.tsx`
   - `src/app/(app)/barcodes/page.tsx`
   - `src/app/(app)/audit/page.tsx`
   - `src/app/(app)/sku-engine/page.tsx`
   - `src/app/(app)/reports/page.tsx`
   - `src/app/(app)/users/page.tsx`
   - `src/app/(app)/settings/page.tsx`
   - `src/app/(app)/activity-logs/page.tsx`
   - `src/app/(app)/migration/page.tsx`
   Each route file is a minimal 3-5 line client component rendering the corresponding view from `src/views/`.
4. Refactor `src/app/page.tsx` to redirect to `/dashboard` if authenticated, or render `/login`.
5. Create `src/app/login/page.tsx` for dedicated credential entry.
6. Remove `activeView` state and `setView` from `src/store/useStore.ts`.

### Files Touched:
- Create: `src/components/AppShell.tsx`
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/*/page.tsx` (15 route files)
- Create: `src/app/login/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/store/useStore.ts`

### Acceptance Checks:
- Direct URL entry for `/inventory`, `/products`, etc. loads the exact view.
- Browser back and forward buttons navigate properly between modules.
- Page refresh maintains the current route.
- Staff login hides admin-only sidebar links (`Products`, `Audit`, `Reports`, `Users`, `Settings`, `Migration`).
- `npx tsc --noEmit` clean, `npm run lint` clean, `npm run build` exits 0.

### Commit Message:
`feat(routing): migrate from single-page view switcher to App Router with persistent AppShell`

---

## Phase 2: PostgreSQL Schema, Migration & Seed Pipeline

**Objective:** Transition database provider to PostgreSQL 16, create baseline migration, and write automated seed importing real Nagpur XYG dealer catalog data.

### Tasks:
1. Update `prisma/schema.prisma` datasource provider from `"sqlite"` to `"postgresql"`.
2. Apply final schema: `User`, `Product`, `Inventory` (with `rackLocation`), `Ledger`, `Defective`, `AuditSession`, `AuditScan`.
3. Remove binary `dev.db` and `prisma/dev.db` from git tracking and ensure `.gitignore` excludes `*.db`, `*.db-journal`, and `.env`.
4. Create `.env.example` documenting `DATABASE_URL` and `SESSION_SECRET`.
5. Generate fresh baseline migration: `npx prisma migrate dev --name init_postgres`.
6. Write `prisma/seed.ts`:
   - Seed default admin (`admin@atulglass.com` / `Admin@123`) and staff (`staff@atulglass.com` / `Staff@123`) using `scryptSync` password hashing.
   - Parse `XYG BL LIST 06.11.2023.xlsx` to seed 140+ real vehicle models and SKUs into `Product` and `Inventory`.
7. Add `"seed": "tsx prisma/seed.ts"` to `package.json`.

### Files Touched:
- Modify: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `.env.example`
- Modify: `.gitignore`
- Modify: `package.json`

### Acceptance Checks:
- `npx prisma migrate status` reports database in sync.
- Running `npm run seed` populates users and XYG catalog.
- Git status confirms no binary databases or secrets tracked.

### Commit Message:
`feat(db): establish PostgreSQL baseline schema, remove SQLite files, and add XYG catalog seed`

---

## Phase 3: Stock Engine (`src/lib/stock.ts`), Concurrency Tests & Action Refactoring

**Objective:** Consolidate all inventory quantity mutations into `src/lib/stock.ts` with conditional atomic decrements and verify that simultaneous scanner dispatches never oversell.

### Tasks:
1. Create `src/lib/stock.ts`:
   - Implement `receiveStock`, `issueStock`, `quarantineDefective`, `scrapDefective`, `restoreDefective`, `reconcileAuditAdjustment`.
   - Implement conditional atomic update in `issueStock`:
     `updateMany({ where: { productId, goodQty: { gte: qty } }, data: { goodQty: { decrement: qty } } })`
     Throw error if updated count is 0.
   - Write corresponding `Ledger` record in the same transaction.
2. Refactor Server Actions to delegate all mutations to `src/lib/stock.ts`:
   - `src/actions/inventory.ts` (`stockIn`, `stockOut`, `markDefective`)
   - `src/actions/defective.ts` (`scrapDefective`, `restoreDefective`)
   - `src/actions/audit.ts` (`reconcileAudit`)
3. Write concurrency unit test `tests/stock-concurrency.test.ts`:
   - Setup a test SKU with initial `goodQty: 1`.
   - Dispatch 5 concurrent `issueStock` promises via `Promise.allSettled`.
   - Assert exactly 1 promise fulfills and 4 reject with insufficient stock.
   - Assert final `goodQty` is exactly 0 (no negative stock).
4. Remove obsolete retry loops and SQLite pragmas from `src/lib/prisma.ts`.

### Files Touched:
- Create: `src/lib/stock.ts`
- Modify: `src/actions/inventory.ts`
- Modify: `src/actions/defective.ts`
- Modify: `src/actions/audit.ts`
- Modify: `src/lib/prisma.ts`
- Create: `tests/stock-concurrency.test.ts`

### Acceptance Checks:
- Concurrency test passes: 0 oversell, 0 engine panics.
- All actions execute inside single transactions with atomic decrements.

### Commit Message:
`feat(stock): centralize inventory mutations in lib/stock with conditional atomic updates`

---

## Phase 4: Authentication & Security Hardening

**Objective:** Resolve session expiry, cookie security flags, timing-safe checks, and login throttling.

### Tasks:
1. Update `src/lib/auth.ts`:
   - Embed `exp` (timestamp in seconds, 7-day TTL) inside signed token payload.
   - In `verifySignedToken`, check `payload.exp > Math.floor(Date.now() / 1000)` and return null if expired.
   - Ensure `verifyPassword` continues using `crypto.timingSafeEqual`.
   - Require `process.env.SESSION_SECRET` in production (throw error on startup if missing).
2. Update `src/actions/auth.ts`:
   - Add in-memory sliding window login rate limiter (max 5 failed attempts per 15 minutes per IP/email).
   - Set cookie options: `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `maxAge: 7 * 86400`.
   - Remove plaintext `user-role` cookie; role is derived strictly from verified session token.
3. Update `src/middleware.ts`:
   - Check presence of `session-token` cookie. Redirect unauthenticated users to `/login`.
   - Avoid running Node crypto in Edge runtime. Real role verification stays in `requireRole` inside server actions.

### Files Touched:
- Modify: `src/lib/auth.ts`
- Modify: `src/actions/auth.ts`
- Modify: `src/middleware.ts`

### Acceptance Checks:
- Expired tokens are rejected.
- Manipulating or forging client cookies fails authorization.
- 5 consecutive invalid password attempts triggers lockout.
- Unauthenticated requests to `/(app)/*` redirect to `/login`.

### Commit Message:
`fix(security): enforce token expiry, secure cookie flags, and login throttling`

---

## Phase 5: UI/UX Pass (Business Style & Pictograms)

**Objective:** Clean up visual presentation into a utilitarian business tool per the UI/UX spec: remove animations, remove dark-mode artifacts, add SVG glass position pictograms, ensure every button has icon + text.

### Tasks:
1. Create simple SVG position pictograms in `src/components/pictograms/`:
   - `WindshieldIcon.tsx` (W/S)
   - `BackLightIcon.tsx` (B/L)
   - `FrontDoorGlassIcon.tsx` (FDG)
   - `RearDoorGlassIcon.tsx` (RDG)
   - `QuarterGlassIcon.tsx` (QG)
   - `VentGlassIcon.tsx` (VG)
2. Integrate pictograms into `Inventory.tsx` table rows and `Products.tsx` creation form.
3. Review and clean view components (`Inventory.tsx`, `Products.tsx`, `StockOperations.tsx`, etc.):
   - Remove `framer-motion` imports and wrappers (`motion.div`, `AnimatePresence`).
   - Remove unused dark-mode classes.
   - Ensure all buttons have a `lucide-react` icon AND a descriptive text label.
   - Enforce standard color badges: Green (`Good`), Amber (`Low Stock`), Red (`Defective` / `Out of Stock`).
   - Add empty-state message with icon and action button when table filters return zero rows.
   - Add standard confirmation modals for destructive operations (Archive, Delete, Scrap).

### Files Touched:
- Create: `src/components/pictograms/*.tsx`
- Modify: `src/views/Inventory.tsx`
- Modify: `src/views/Products.tsx`
- Modify: `src/views/StockOperations.tsx`
- Modify: `src/views/Defective.tsx`
- Modify: `src/views/Dashboard.tsx`
- Modify: `src/views/Audit.tsx`

### Acceptance Checks:
- UI renders with zero layout shift and no animation delays.
- Glass positions display clear visual pictograms.
- No icon-only buttons remain.
- All destructive actions require explicit modal confirmation.

### Commit Message:
`refactor(ui): apply utilitarian business style, SVG glass pictograms, and explicit button labels`

---

## Phase 6: Barcode Label Generation, Browser Print Adapter & Scanner Hook

**Objective:** Build Code-128 label generation with 50x25mm and 75x50mm layouts, browser-print adapter, and keyboard-wedge scanner hook.

### Tasks:
1. Create `src/lib/sku.ts`:
   - Implement `generateSku(brand, carBrand, model, type, position, feature)`.
   - Add unit test `tests/sku.test.ts` verifying formatting and uniqueness.
2. Implement Label Printing Architecture:
   - Create `src/lib/printer/types.ts` defining `PrintAdapter` interface (~15 lines).
   - Create `src/lib/printer/browser-adapter.ts` implementing `PrintAdapter` via CSS `@page` media print.
3. Update `src/views/Barcodes.tsx`:
   - Code-128 barcode rendering with accurate human-readable text.
   - Dual layout selector: 50x25mm (compact) and 75x50mm (large).
   - 1:1 on-screen preview box.
   - Print action invoking `browserPrintAdapter.printLabel()`.
4. Update `src/views/Settings.tsx`:
   - Display static card: `Hardware Status: Printer: not configured (Using Browser Print Adapter)`.
5. Create `src/hooks/useScannerWedge.ts`:
   - Capture rapid keystrokes (<50ms) ending with `Enter`.
   - Ignore events when input or textarea elements are focused.
6. Connect `useScannerWedge` to `src/views/QuickScan.tsx` for hands-free scanning.

### Files Touched:
- Create: `src/lib/sku.ts`
- Create: `tests/sku.test.ts`
- Create: `src/lib/printer/types.ts`
- Create: `src/lib/printer/browser-adapter.ts`
- Create: `src/hooks/useScannerWedge.ts`
- Modify: `src/views/Barcodes.tsx`
- Modify: `src/views/Settings.tsx`
- Modify: `src/views/QuickScan.tsx`

### Acceptance Checks:
- Labels preview accurately in both 50x25mm and 75x50mm aspect ratios.
- Triggering print opens browser print dialog formatted at exact millimeters.
- Settings page shows "Printer: not configured".
- Scanner hook fires `onScan` upon hardware scanner read and ignores regular typing into form fields.

### Commit Message:
`feat(labels): implement Code-128 generation, browser print adapter, and keyboard-wedge hook`

---

## Phase 7: Deployment Configuration & Production Readiness Verification

**Objective:** Containerize app with Docker Compose, prepare deployment scripts, and verify backup/restore procedures.

### Tasks:
1. Create production `Dockerfile` (multi-stage build with `node:20-alpine`).
2. Create `docker-compose.yml` defining `app` and `postgres:16-alpine` services.
3. Create `/scripts/backup.sh` for automated nightly `pg_dump` and retention.
4. Create `/scripts/restore.sh` for disaster recovery.
5. Execute end-to-end local test run of backup and restore script.
6. Final sweep: `npm run lint` (0 errors), `npx tsc --noEmit` (0 errors), `npm run build` (exit 0), unit tests pass.

### Files Touched:
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `scripts/backup.sh`
- Create: `scripts/restore.sh`

### Acceptance Checks:
- Docker Compose boots app and database cleanly.
- Database restore script successfully recovers tables and records from a test backup file.
- Clean build and test execution across entire repository.

### Commit Message:
`chore(deploy): add production Dockerfile, Docker Compose, and automated backup scripts`
