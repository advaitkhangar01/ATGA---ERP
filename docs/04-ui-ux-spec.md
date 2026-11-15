# 04. UI/UX Specification: Utilitarian Business Software

**Design Philosophy:** Traditional Business ERP  
**Target User:** Warehouse operators, counter sales clerks, and stock managers at Atul Glass Agency, Nagpur.  
**Styling Constraints:** High contrast, large click targets (minimum 40px height), plain English labels, no animations, no dark-mode switching, no icon-only buttons. Every interactive element has an icon (`lucide-react`) AND a descriptive text label.

---

## 1. Global Layout: Shell, Navigation & Pictograms

### Top Bar & Sidebar Architecture
```
+----------------------------------------------------------------------------------------------------+
| [Layers] ATUL GLASS AGENCY ERP  | [MapPin] Nagpur Central Warehouse  | User: Atul (Admin) [LogOut] |
+---------------------+------------------------------------------------------------------------------+
| [LayoutDashboard]   | Breadcrumbs: Home > Inventory Registry                                       |
| Dashboard           |                                                                              |
| [Boxes]             | +--------------------------------------------------------------------------+ |
| Inventory Registry  | | Search: [___________]  Brand: [All v]  Position: [All v]  [Plus] Stock In  | |
| [Database]          | +--------------------------------------------------------------------------+ |
| Products Catalog *  | | POS | SKU                 | VEHICLE       | GOOD | DEF | RACK   | STATUS   | |
| [ArrowLeftRight]    | |-----+---------------------+---------------+------+-----+--------+----------| |
| Stock Operations    | | [W] | SG-MAR-SWIF-WS-FR   | Maruti Swift  |   14 |   1 | A-04   | [Good]   | |
| [Scan]              | | [B] | XYG-HYU-ACCE-BL-DEF | Hyundai Accent|    2 |   0 | B-02   | [Low]    | |
| Quick Scanner       | +--------------------------------------------------------------------------+ |
| [AlertOctagon]      |                                                                              |
| Defective Glass     | Page 1 of 12  [ChevronLeft Previous]  [ChevronRight Next]                    |
+---------------------+------------------------------------------------------------------------------+
(* indicates Admin-only menu link)
```

### Sidebar Menu Structure (Icons + Text Labels)
Every menu item pairs a `lucide-react` icon with an explicit label:
1. `LayoutDashboard` **Dashboard** (`/dashboard`)
2. `Boxes` **Inventory Registry** (`/inventory`)
3. `Database` **Products Catalog** (`/products`) *[Admin]*
4. `ArrowLeftRight` **Stock Operations** (`/stock-operations`)
5. `Scan` **Quick Scanner** (`/quick-scan`)
6. `AlertOctagon` **Defective Glass** (`/defective`)
7. `TrendingDown` **Low Stock Alerts** (`/low-stock`)
8. `Barcode` **Barcode Printing** (`/barcodes`)
9. `ClipboardCheck` **Physical Audit** (`/audit`) *[Admin]*
10. `Wrench` **SKU Engine** (`/sku-engine`)
11. `FileSpreadsheet` **CSV Migration** (`/migration`) *[Admin]*
12. `BarChart3` **Reports & Valuation** (`/reports`) *[Admin]*
13. `Users2` **User Access** (`/users`) *[Admin]*
14. `FileClock` **Activity Logs** (`/activity-logs`) *[Admin]*
15. `Settings` **System Settings** (`/settings`) *[Admin]*

### Automotive Glass Position Pictograms (Simple SVG Set)
To enable instantaneous visual identification on warehouse floors without reading dense text:
1. **Windshield (`WS` / Front F/L):** Trapezoidal front windshield outline with wiper sweep arc.
   - SVG: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none"><path d="M3 17 L6 6 L18 6 L21 17 Z" strokeWidth="2"/><path d="M7 14 Q12 11 17 14" strokeWidth="1.5"/></svg>`
2. **Back Light (`BL` / Rear R/L):** Curved rear glass outline with horizontal defogger lines.
   - SVG: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none"><path d="M4 17 L7 7 L17 7 L20 17 Z" strokeWidth="2"/><line x1="7" y1="11" x2="17" y2="11" strokeWidth="1"/><line x1="6" y1="14" x2="18" y2="14" strokeWidth="1"/></svg>`
3. **Front Door Glass (`FDG`):** Angular side drop window outline with front slope.
   - SVG: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none"><path d="M4 19 L4 9 L14 5 L20 9 L20 19 Z" strokeWidth="2"/><line x1="4" y1="19" x2="20" y2="19" strokeWidth="2"/></svg>`
4. **Rear Door Glass (`RDG`):** Rectangular side window outline with straight pillars.
   - SVG: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none"><path d="M4 19 L4 7 L18 7 L20 19 Z" strokeWidth="2"/><line x1="4" y1="19" x2="20" y2="19" strokeWidth="2"/></svg>`
5. **Quarter & Vent Glass (`QG` / `VG`):** Compact triangle / quadrant outline.
   - SVG: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none"><path d="M4 18 L19 18 L19 6 Z" strokeWidth="2"/></svg>`

---

## 2. Per-Screen Functional Specifications

### Screen 1: Dashboard (`/dashboard`)
- **Purpose:** Daily warehouse status and operational alerts at a glance.
- **KPI Summary Cards (Top Row):**
  - Total Stock Units (`Boxes`, Blue)
  - Total Glass SKUs (`Database`, Slate)
  - Low Stock Items (`TrendingDown`, Amber)
  - Defective Quarantine (`AlertOctagon`, Red)
- **Tables / Sections:**
  - Fast-action buttons: `[ArrowUpRight] Receive Stock In`, `[ArrowDownRight] Dispatch Stock Out`, `[Scan] Quick Scanner`.
  - Today's Activity Table: Time, SKU, Quantity, Action Type, Operator.
  - Low Stock Warning Banner with `[ArrowRight] View Low Stock Items`.

### Screen 2: Inventory Registry (`/inventory`)
- **Purpose:** Central warehouse inventory table.
- **Controls Bar:** Search input (`Search` placeholder: "Search SKU, Car Model..."), Glass Position dropdown filter, Brand filter (`AIS`, `Saint-Gobain`, `XYG`, `Fuyao`), `[RefreshCw] Refresh` button.
- **Table Columns:**
  1. Icon (SVG Position Pictogram)
  2. SKU (`font-mono font-medium`)
  3. Vehicle (`CarBrand CarModel`)
  4. Brand (Manufacturer)
  5. Good Stock (`font-bold text-slate-900`)
  6. Defective (`text-red-700`)
  7. Available (`text-emerald-700`)
  8. Rack Bin (`font-mono text-slate-600`)
  9. Status Badge:
     - `Good` (Green: `bg-emerald-50 text-emerald-700 border-emerald-200`)
     - `Low Stock` (Yellow: `bg-amber-50 text-amber-700 border-amber-200`)
     - `Out of Stock` (Red: `bg-rose-50 text-rose-700 border-rose-200`)
  10. Actions: `[Eye] History`, `[Barcode] Label`
- **Empty State:** `[Boxes]` icon, "No glass inventory matching filter criteria", `[RotateCcw] Clear Filters` button.

### Screen 3: Products Catalog (`/products`) - Admin Only
- **Purpose:** Safety glass blueprint definitions.
- **Header:** Title + `[Plus] Add New Product` button.
- **Add / Edit Modal Dialog:**
  - SKU field with `[Wrench] Generate from Specs` button.
  - Glass Brand selector (`Saint-Gobain`, `AIS`, `XYG`, `Fuyao`).
  - Vehicle Brand (`Maruti`, `Hyundai`, `Tata`, `Mahindra`, etc.).
  - Vehicle Model text input (e.g., `Swift Dzire`).
  - Glass Position radio group with pictograms (Windshield, Back Light, Front Door, etc.).
  - Low Stock Threshold input (Number, default 5).
  - Compatible Models tags input.
  - Buttons: `[Check] Save Product`, `[X] Cancel`.
- **Destructive Action:** `[Trash2] Archive Product` prompts confirmation dialog: "Are you sure you want to archive SKU [XYZ]? Existing inventory and ledger history will be preserved."

### Screen 4: Stock Operations (`/stock-operations`)
- **Purpose:** Inward reception and counter dispatch.
- **Layout:** Two high-contrast tabs:
  - Tab 1: `[ArrowUpRight] Stock In (Vendor Receipt)`
  - Tab 2: `[ArrowDownRight] Stock Out (Customer Dispatch)`
- **Stock In Form Fields:**
  - SKU Lookup: Searchable select with live inventory counter.
  - Quantity: Number input with large increment buttons `[-5] [-1] [Qty] [+1] [+5]`.
  - Vendor / Supplier: Text input (default: `Asahi India Glass Ltd`).
  - Invoice / Challan Number: Text input.
  - Storage Rack: Dropdown (default: `RACK-A-01`).
  - Remarks: Text area.
  - Submit: `[CheckCircle] Confirm Stock Receipt` (Solid Green).
- **Stock Out Form Fields:**
  - SKU Lookup: Displays available good stock.
  - Quantity: Input with validation preventing values > available stock.
  - Customer / Workshop: Text input (e.g. `Nagpur Car Care`).
  - Dispatch Purpose: Select (`Counter Sale`, `Workshop Replacement`, `Insurance Claim`).
  - Remarks: Text area.
  - Submit: `[CheckCircle] Confirm Stock Dispatch` (Solid Blue).

### Screen 5: Quick Scanner (`/quick-scan`)
- **Purpose:** Rapid scanning station.
- **Visual Status Area:**
  - Prominent status box (Green border for ready, Amber border during active scan, Red border on error).
  - Mode Switch: Toggle between `[ArrowDownRight] Quick Dispatch` and `[ArrowUpRight] Quick Inward`.
  - Current Scan Preview: Displays SKU, Car Model, and remaining stock upon scan.
  - Sound Toggle: `[Volume2] Beep Enabled`.
- **Recent Scans Table (Session):**
  - Timestamp, Barcode Scanned, SKU, Delta, Status (`Success` / `Error`).

### Screen 6: Defective Glass (`/defective`)
- **Purpose:** Segregate and process damaged inventory.
- **Header Action:** `[AlertTriangle] Report New Defective Item`.
- **Table Columns:** SKU, Quantity, Defect Reason, Reported Date, Status (`Pending` / `Scrapped` / `Restored`), Actions.
- **Actions:**
  - `[Trash2] Scrap Glass` (Admin only): Opens confirmation dialog: "Confirm scrap disposal of [N] units of SKU [XYZ]. This writes off inventory value."
  - `[Undo2] Restore to Good`: Returns mistakenly quarantined glass back to good stock.

### Screen 7: Barcode & Label Generation (`/barcodes`)
- **Purpose:** Label preview and browser-directed printing.
- **Form:**
  - Product SKU selector.
  - Label Layout: Radio buttons `[50mm × 25mm (Standard)]` or `[75mm × 50mm (Large Windshield)]`.
  - Print Quantity: Number input (default: 1).
- **Label Live Preview Box (Exact millimeter aspect ratio):**
  - Header: `ATUL GLASS AGENCY, NAGPUR`
  - Body: Code-128 Barcode with readable human text beneath.
  - Footer: `SG-MAR-SWIF-WS-FR | Swift 2024 F/L | Nov 2026`
- **Actions:**
  - `[Printer] Print Labels (Browser)`: Opens standard browser print dialog constrained by `@page` CSS.

### Screen 8: Physical Stock Audit (`/audit`) - Admin Only
- **Purpose:** Rack cycle counting.
- **Sections:**
  - Active Session Banner: Name, Started Date, Items Scanned Count.
  - Audit Scanner Input: Fast input for counting glass on racks.
  - Discrepancy Table:
    - SKU, Expected System Stock, Scanned Physical Stock, Variance (`+2` or `-1` in colored text).
  - Reconcile Action: `[FileCheck] Reconcile Inventory`. Prompts summary modal: "This will adjust 3 SKUs in the database and generate audit ledger entries."

### Screen 9: Reports & Valuation (`/reports`) - Admin Only
- **Purpose:** Financial and inventory health reports.
- **Sections:**
  - Stock Valuation by Brand (Table: Brand, Total Units, Estimated Value in INR).
  - Monthly Inward vs Outward Movement Table.
  - Defective Scrap Loss Rate (Table: Period, Units Scrapped, Loss Rate %).
  - `[Download] Export CSV` button on each table.

### Screen 10: User Management (`/users`) - Admin Only
- **Purpose:** Staff credential and permission control.
- **Table:** Name, Email, Role (`Admin` badge: purple; `Staff` badge: slate), Created Date, Actions (`[Key] Reset Password`, `[Trash2] Delete`).
- **Add User Modal:** Name, Email, Password, Role selector.

### Screen 11: System Settings (`/settings`) - Admin Only
- **Purpose:** Warehouse configuration.
- **Sections:**
  - Warehouse Profile: Name, Address (Nagpur), Phone Numbers.
  - Inventory Defaults: Minimum low-stock alert threshold.
  - Hardware Status Block: Static card displaying `[Printer] Label Printer: not configured (Using Browser Print Adapter)`.

### Screen 12: Activity Logs (`/activity-logs`) - Admin Only
- **Purpose:** Immutable audit ledger.
- **Filter Bar:** Date Range, Action Type (`IN`, `OUT`, `DEFECTIVE_MARK`, `AUDIT_ADJUST`), SKU filter.
- **Table:** Timestamp, User/Operator, Action Badge, SKU, Delta Qty, Remarks.
