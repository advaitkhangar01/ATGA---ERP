# 01. Functional & Operational Requirements

**Target Enterprise:** Atul Glass Agency, Nagpur  
**System Type:** Barcode-Driven Automotive Safety Glass Inventory Management System  
**Document Status:** Ready for Approval  

---

## 1. In-Scope Module Specifications

### Module 1: Products Catalog (`/products`)
- **Purpose:** Central registry of automotive safety glass blueprint items.
- **Access:** Admin only (Staff can view via `/inventory`).
- **Features:**
  - Standard table listing SKU, Glass Brand (AIS, Saint-Gobain, XYG, Fuyao), Car Brand (Maruti, Hyundai, Tata, etc.), Car Model, Glass Position, Threshold, Status (`active` / `deactivated` / `archived`).
  - Search by SKU, model, or brand.
  - Creation & Edit Form with:
    - Auto-generated or manual SKU enforcement.
    - Glass position selection with SVG pictograms (Windshield, Back Light, Front Door, Rear Door, Quarter, Vent).
    - Compatible vehicle models list.
    - Low-stock minimum threshold setting (default: 5).
  - Destructive action confirmation dialogs (Archive / Deactivate).

### Module 2: Inventory Registry (`/inventory`)
- **Purpose:** Real-time visibility of physical glass sheets on warehouse racks.
- **Access:** Admin, Staff.
- **Features:**
  - Table showing Glass Position Pictogram, SKU, Car Brand & Model, Good Qty, Defective Qty, Derived Available Qty (`goodQty - reservedQty`), Rack/Bin Location (e.g., `RACK-A-04`), Status Badge (`In Stock`, `Low Stock`, `Out of Stock`).
  - Search by SKU or vehicle model; filter by Glass Position and Brand.
  - Pagination (50 rows per page standard business table).
  - Row click opens Stock History drawer showing ledger entries for that item.

### Module 3: Stock Operations (`/stock-operations`)
- **Purpose:** Manual recording of inbound shipments and counter dispatches.
- **Access:** Admin, Staff.
- **Features:**
  - **Stock In (Receive):** Select product SKU via search, specify quantity, vendor/supplier name (e.g. Asahi India Glass Ltd), purchase invoice / delivery challan number, and remarks. Atomic increment of `goodQty` and ledger row creation.
  - **Stock Out (Issue / Dispatch):** Select product SKU, verify available quantity, specify quantity, recipient workshop / retail customer name, purpose (Counter Sale, Workshop Fitting, Insurance Claim), and remarks. Atomic conditional decrement of `goodQty` (fail on insufficient stock) and ledger row creation.

### Module 4: Quick Scan (`/quick-scan`)
- **Purpose:** Hands-free, high-speed warehouse counter dispatch and reception via USB/Bluetooth hardware barcode scanner.
- **Access:** Admin, Staff.
- **Features:**
  - Persistent input buffer capturing barcode scanner wedge keystrokes (burst characters ending in `Enter`).
  - Auto-lookup of scanned SKU or barcode.
  - Quick action toggle: `DISPATCH (OUT)` or `RECEIVE (IN)`.
  - Immediate audio feedback: high-pitch confirmation beep on success, low-pitch double error tone on failure or out-of-stock.
  - Recent scan queue table showing the last 15 scans in the current session.

### Module 5: Physical Stock Audit (`/audit`)
- **Purpose:** Discrepancy management and periodic cycle counting across warehouse A-frame racks.
- **Access:** Admin only.
- **Features:**
  - Start new audit session with unique name (e.g. "Rack B Glass Count Nov 2026").
  - Physical counting mode: Staff scans items on the rack; counter increments per scan.
  - Discrepancy calculation: System compares physical count against database `goodQty` to compute variance (Surplus / Deficit).
  - Reconcile action: Applies atomic ledger adjustments (`type: audit_adjust`) to synchronize database inventory with verified physical counts.

### Module 6: Defective Glass Management (`/defective`)
- **Purpose:** Quarantine, scrap loss recording, and warranty recovery for fragile automotive glass.
- **Access:** Admin, Staff (Staff can mark defective; Admin approves scrap write-off).
- **Features:**
  - Table of quarantined items: SKU, Quantity, Defect Reason (Transit Crack, Manufacturing Delamination, Handling Breakage, Installation Failure), Reported Date, Status (`pending`, `scrapped`, `restored`).
  - Action "Mark Defective": Moves stock from `goodQty` to `defectiveQty` with atomic ledger tracking.
  - Action "Scrap Glass" (Admin only): Permanently removes defective units from inventory and records financial scrap loss.
  - Action "Restore / Return": Restores units to good stock or marks as returned to glass manufacturer for credit note.

### Module 7: Barcode & Label Generation (`/barcodes`)
- **Purpose:** On-screen preview and browser-based label printing for physical shelf/crate tagging.
- **Access:** Admin, Staff.
- **Features:**
  - Form to select Product SKU and enter print quantity.
  - Code-128 barcode rendering (vector SVG / Canvas) with readable human text (SKU, Car Brand & Model, Position, Date).
  - Supported label layout formats:
    - **50mm × 25mm** (Compact label for door, quarter, and vent glass).
    - **75mm × 50mm** (Large label with vehicle model details for windshields and rear glass).
  - Exact 1:1 on-screen preview.
  - Browser print action utilizing CSS `@page` media rules formatted to exact label millimeter dimensions.
  - Settings page indicator: `"Printer: not configured"`.

### Module 8: Reports & Analytics (`/reports`)
- **Purpose:** Inventory valuation, movement velocity, and scrap loss audit.
- **Access:** Admin only.
- **Features:**
  - Total Stock Valuation summary (based on cost / dealer rate from XYG list).
  - Stock Movement Ledger summary: Units Received vs Units Dispatched per month.
  - Breakage & Scrap Loss Rate (percentage of inward stock written off as defective).
  - Export report table to CSV.

### Module 9: User Management (`/users`)
- **Purpose:** Role-based staff access control.
- **Access:** Admin only.
- **Features:**
  - Table listing users: Name, Email, Role (`admin` or `staff`), Created Date.
  - Add User modal: Name, Email, Password (hashed with `scrypt`), Role.
  - Reset Password and Delete User actions (with protection against deleting own active admin account).

### Module 10: System Settings (`/settings`)
- **Purpose:** Warehouse identity and operational parameters.
- **Access:** Admin only.
- **Features:**
  - Warehouse Profile: Name (Atul Glass Agency), Address (549, Wardhaman Nagar, Nagpur), Contact Phone numbers.
  - Default Low Stock Threshold setting.
  - Label Settings: Default label dimension (50x25mm vs 75x50mm).
  - Hardware Status: Displays static notice `"Printer: not configured"`.

### Module 11: Activity Logs (`/activity-logs`)
- **Purpose:** Immutable audit trail of every stock mutation.
- **Access:** Admin only.
- **Features:**
  - Complete chronological ledger log: Timestamp, Operator/User, Action Type (`IN`, `OUT`, `DEFECTIVE_MARK`, `DEFECTIVE_SCRAP`, `AUDIT_ADJUST`), SKU, Quantity Delta, Notes/Remarks.
  - Filter by action type, date range, or SKU.

---

## 2. Roles & Permissions Matrix

| Module / Operation | Route | Staff | Admin |
| :--- | :--- | :---: | :---: |
| **Dashboard View** | `/dashboard` | View Only | Full |
| **Inventory Registry** | `/inventory` | View Only | View & Edit Location |
| **Products CRUD** | `/products` | No Access | Full (Add/Edit/Archive) |
| **Stock In / Receive** | `/stock-operations` | Yes | Yes |
| **Stock Out / Dispatch**| `/stock-operations` | Yes | Yes |
| **Quick Scanner** | `/quick-scan` | Yes | Yes |
| **Mark Defective** | `/defective` | Yes | Yes |
| **Scrap / Write-off Defective** | `/defective` | No Access | Yes |
| **Label Preview & Browser Print** | `/barcodes` | Yes | Yes |
| **Physical Stock Audit** | `/audit` | No Access | Full (Start/Scan/Reconcile) |
| **Reports & Valuation** | `/reports` | No Access | Full |
| **User Administration** | `/users` | No Access | Full |
| **Activity Ledger Logs** | `/activity-logs` | No Access | Full |
| **System Settings** | `/settings` | No Access | Full |

---

## 3. Explicit Out-of-Scope List (Anti-Bloat Guardrail)

To keep the application lean, robust, and focused solely on operational inventory management, the following are **strictly out of scope**:
1. Multi-tier pricing engines, customer credit ledgers, and accounts receivable.
2. GST tax calculation, e-way bills, and automated tax invoicing.
3. Delivery challan generation or sales receipt printing.
4. QR code generation (Code-128 barcode standard satisfies all shelf and scanner requirements).
5. Prisma Accelerate, PgBouncer, or external connection proxy setups.
6. Custom CORS configuration (Next.js App Router internal server actions require no external cross-origin APIs).
7. Multi-tenant database partitioning (this is a dedicated single-tenant system for Atul Glass Agency).
8. Internationalization (i18n) / multi-language translation (English is standard for automotive parts).
9. Dark mode theme toggling and motion/transition animations.
10. Low-level printer driver integrations (ZPL, TSPL, ESC/POS).

---

## 4. Definition of Done (DoD)

A release candidate is deemed complete and production-ready when:
1. Every module is mounted on its own App Router URL (`/dashboard`, `/inventory`, etc.) with functional browser back/forward and refresh.
2. Concurrent stock decrement test passes: 5 simultaneous dispatch requests on a single remaining glass sheet result in exactly 1 success, 4 clean rejections, zero overselling, and final inventory of 0.
3. SKU generation satisfies standard format and uniqueness check across all vehicle models.
4. Barcode labels render clearly on-screen and trigger browser print dialog formatted at exact millimeters (50x25mm and 75x50mm).
5. Application runs inside Docker Compose on Ubuntu VPS with PostgreSQL 16 behind Nginx HTTPS (Let's Encrypt), nightly automated backups via cron, and a tested restore script.
6. Zero TypeScript errors (`tsc --noEmit`), zero ESLint errors (`npm run lint`), and clean production build (`npm run build`).
