# 00. Technical Audit & Codebase Reality Verification

**Repository Inspected:** `D:\Office\Softwares-Office-Clients\Atulglassagency-ERP`  
**Reference Folder Inspected:** `D:\Office\Softwares-Office-Clients\ATGA-ERP`  
**Date of Audit:** November 15, 2026  
**Auditor:** Senior Full-Stack Engineer  

---

## 1. Executive Codebase Verification

Every claim in the project brief was verified directly against the running code, database schema, and git history in `Atulglassagency-ERP`.

| Claim / Subject in Brief | Reality in Codebase | Verification Source | Status / Gap |
| :--- | :--- | :--- | :--- |
| **Monolithic View Switcher** | `src/app/page.tsx` (949 lines) conditionally renders all 15 views via `switch(activeView)` inside client state. | `src/app/page.tsx:192-207` | **Confirmed.** No URL routes exist. Browser back/forward and refresh fail. |
| **SQLite Concurrency Panic** | Prisma driver hits Rust `quaint.rs:178:18` panic (`internal error: entered unreachable code`) during simultaneous `stockOut` calls on 1-unit inventory. | `test-concurrency.ts`, `prisma/schema.prisma:8` | **Confirmed.** SQLite file locks fail under concurrent scanner bursts. |
| **Server Actions & DB Persistence** | Five server action files exist (`auth.ts`, `inventory.ts`, `products.ts`, `defective.ts`, `audit.ts`) wrapping Prisma transactions. | `src/actions/*.ts` | **Confirmed.** Functional, but stock decrement uses read-then-update instead of conditional atomic decrement. |
| **Auth System & Cookies** | Node `crypto.scryptSync` password hashing and HMAC-SHA256 token signing exist. | `src/lib/auth.ts:7-38`, `src/actions/auth.ts:60-76` | **Partially sound, security flaws found** (missing token expiry, unverified role cookie, no rate limiting). |
| **Full-Featured Views** | 15 views exist in `src/views/` (20KB–31KB each for `Inventory`, `Products`, `StockOperations`). | `src/views/*.tsx` | **Confirmed.** High domain fidelity, but cluttered with `framer-motion` animations and dark-mode classes. |
| **Real Nagpur XYG Catalog** | `XYG BL LIST 06.11.2023.xlsx` (12.7KB) present in root; contains dealer price list for Back Light (B/L) and Windshield glass for Atul Glass Agency, Nagpur. | Root directory, `openpyxl` inspection | **Confirmed.** Real business data ready for PostgreSQL seed/import. |
| **Reference Repo `ATGA-ERP`** | Contains clean `AppShell.tsx` and 16 page routes (`/dashboard`, `/inventory`, etc.), but views are stripped down, auth is plain-text, and backend actions are gutted. | `D:\Office\Softwares-Office-Clients\ATGA-ERP` | **Confirmed.** Use solely as reference for the sidebar layout and route paths. |

---

## 2. Inventory of Current Modules & Real File Sizes

All 15 views located in `src/views/` of `Atulglassagency-ERP`:

| Module / View File | Size | Role Access | Current Functionality |
| :--- | :---: | :---: | :--- |
| `Dashboard.tsx` | 20.6 KB | Admin, Staff | Top KPI cards, 30-day stock movements, brand share breakdown, quick action buttons. |
| `Inventory.tsx` | 31.4 KB | Admin, Staff | Master stock grid, brand/model filter, good vs defective count, bin location, stock history modal. |
| `Products.tsx` | 29.1 KB | Admin only | Product catalog CRUD, car brand/model tagging, compatible models list, barcode display. |
| `StockOperations.tsx` | 20.5 KB | Admin, Staff | Manual Stock-In (vendor receipt) and Stock-Out (counter dispatch) with ledger remarks. |
| `QuickScan.tsx` | 15.9 KB | Admin, Staff | Continuous scanner input mode, auto-detects SKU/barcode, instant decrement with audio/toast feedback. |
| `Barcodes.tsx` | 17.0 KB | Admin, Staff | Label preview queue, barcode display, mock print triggers, label dimension controls. |
| `Defective.tsx` | 10.3 KB | Admin, Staff | Defective quarantine list, mark defective action, scrap write-off, return-to-vendor restoration. |
| `LowStock.tsx` | 11.6 KB | Admin, Staff | Filtered alert list of products at or below `threshold`, quick re-order PO generation mock. |
| `Audit.tsx` | 16.1 KB | Admin only | Physical cycle counting session, scan counter, variance computation (expected vs physical), reconciliation. |
| `Migration.tsx` | 11.4 KB | Admin only | Legacy CSV bulk upload simulation, unmapped barcode assignment, initial catalog sync. |
| `Reports.tsx` | 13.8 KB | Admin only | Summary tables: Stock Valuation, Monthly Movement, Breakage Scrap Loss, Turnover rate. |
| `Users.tsx` | 12.5 KB | Admin only | User listing, role assignment (`admin` vs `staff`), password reset dialogue. |
| `Settings.tsx` | 17.3 KB | Admin only | Warehouse address config, label dimensions, mock printer status, threshold defaults. |
| `ActivityLogs.tsx` | 13.0 KB | Admin only | Complete ledger audit trail with timestamp, user, action type (IN/OUT/DEFECTIVE), remarks. |
| `SkuEngine.tsx` | 13.2 KB | Admin, Staff | Interactive builder demonstrating SKU formula based on brand, vehicle, glass type, position, features. |

---

## 3. Specific Bugs, Structural Debt & Security Issues Identified

### A. Routing & State Architecture Debt
1. **Monolithic Page Render (`src/app/page.tsx`):**
   - Renders all 15 views inside a giant client component.
   - All navigation relies on `useStore(state => state.activeView)`.
   - Refreshing any screen redirects back to Dashboard; deep linking (e.g. sharing `/inventory`) is impossible.
2. **Obsolete Client State in `src/store/useStore.ts` (636 lines):**
   - Zustand store contains extensive duplicate mock state, client-side pagination, and fake printer settings that desync from the database.

### B. Concurrency & Stock Logic Flaws
1. **SQLite Engine Panics:**
   - Under two simultaneous `stockOut` requests, SQLite triggers `quaint.rs:178:18` Rust panics because file-based locks cannot serialize rapid transaction writes.
2. **Non-Atomic Read-Then-Update Pattern (`src/actions/inventory.ts:54-68`):**
   - Current implementation:
     ```typescript
     const inventory = await tx.inventory.findUnique({ where: { productId: product.id } })
     if (!inventory || inventory.goodQty < qty) throw new Error(...)
     await tx.inventory.update({ where: { productId: product.id }, data: { goodQty: { decrement: qty } } })
     ```
   - Two parallel requests reading `goodQty: 1` will both pass the `if` check and decrement, leading to negative inventory (`goodQty: -1`) if not serialized.
3. **Stored `availableQty` Antipattern:**
   - `availableQty` is stored in the database column (`Inventory.availableQty`), creating synchronization bugs when `goodQty` or reservations change. It must be derived dynamically (`goodQty - reservedQty`).

### C. Security & Authentication Vulnerabilities
1. **Missing Token Expiry (`src/lib/auth.ts:20-37`):**
   - `createSignedToken` encodes `{ id, email, role }` without an `exp` claim. A stolen session token remains valid forever.
2. **Unverified Role Cookie in Middleware (`src/middleware.ts:6-18`):**
   - Middleware checks `request.cookies.get('user-role')?.value` directly. An attacker can set `document.cookie = "user-role=admin"` in browser devtools to bypass middleware route guards.
3. **Hardcoded Fallback Secret Key (`src/lib/auth.ts:4`):**
   - Falls back to `'atul-glass-erp-secret-key-2026'` if `process.env.SESSION_SECRET` is missing.
4. **No Login Throttling:**
   - `loginAction` allows infinite brute-force password guesses without rate limiting or lockout.
5. **Git Hygiene Violations:**
   - SQLite binary databases (`dev.db` in root and `prisma/dev.db`) were committed directly into the git repository.

### D. Dead & Bloated Code
1. **Unused / Mock Printer Code (`src/store/useStore.ts:50-59`, `src/views/Barcodes.tsx:28-40`):**
   - Mock printer configurations (Zebra 203 DPI, dark calibration, speed) that do nothing in production.
2. **Styling Bloat:**
   - Extensive `framer-motion` imports (`motion.div`, `AnimatePresence`) across views that introduce layout shifts, slow render times, and violate the requested utilitarian business-software aesthetic.
   - Dark-mode utility classes (`dark:bg-slate-900`, `dark:text-white`) scattered across components without unified theme support.
