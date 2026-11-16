# 07. VPS Production, Security & Technical Architecture Reference

**System:** Atul Glass Agency ERP  
**Target Environment:** Ubuntu 24.04 LTS VPS (Cloud / Docker Compose)  
**Document Purpose:** Master technical reference for true system paths, secrets, API actions, middleware, route maps, database invariants, and security hardening.  
**Last Updated:** 2026-11-15  

---

## 1. True System Paths & Directory Map

### 1.1 VPS Host Infrastructure Paths (Ubuntu 24.04)

| Component | Host System Path | Purpose / Permissions |
| :--- | :--- | :--- |
| **Application Root** | `/opt/atulglass-erp/` | Repository working directory (`root:root` / `0755`) |
| **Production Secrets** | `/opt/atulglass-erp/.env.production` | Environment & database passwords (`chmod 600`, root only) |
| **Docker Compose** | `/opt/atulglass-erp/docker-compose.yml` | Multi-container orchestration (App + Postgres 16) |
| **PostgreSQL Data Volume** | `/var/lib/docker/volumes/atulglass_erp_postgres_data/` | Persistent PostgreSQL database cluster files |
| **Nginx Site Config** | `/etc/nginx/sites-available/atulglass-erp` | Reverse proxy virtual host with TLS termination |
| **Nginx Enabled Link** | `/etc/nginx/sites-enabled/atulglass-erp` | Symlink to active configuration |
| **SSL Certificates** | `/etc/letsencrypt/live/erp.atulglassagency.com/` | Let's Encrypt `fullchain.pem` & `privkey.pem` |
| **Database Backups** | `/var/backups/atulglass-db/` | Nightly compressed dumps (`atulglass_backup_*.sql.gz`, `0600`) |
| **Backup Automation** | `/opt/atulglass-erp/scripts/backup.sh` | Automated nightly `pg_dump` cron executable (`0750`) |
| **Disaster Recovery** | `/opt/atulglass-erp/scripts/restore.sh` | Disaster recovery database restore script (`0750`) |
| **Cron Job Log** | `/var/log/atulglass_backup.log` | Output log of automated scheduled backup runs |
| **Nginx Access Log** | `/var/log/nginx/atulglass_access.log` | HTTP request traffic log |
| **Nginx Error Log** | `/var/log/nginx/atulglass_error.log` | Reverse proxy and upstream error log |

### 1.2 Local Development Repository Paths

| Component | Local Workspace Path |
| :--- | :--- |
| **Workspace Root** | `D:\Office\Softwares-Office-Clients\Atulglassagency-ERP` |
| **Local Secrets** | `D:\Office\Softwares-Office-Clients\Atulglassagency-ERP\.env` (Untracked) |
| **Example Secrets** | `D:\Office\Softwares-Office-Clients\Atulglassagency-ERP\.env.example` (Tracked template) |
| **Documentation** | `D:\Office\Softwares-Office-Clients\Atulglassagency-ERP\docs\` |
| **XYG Catalog Seed** | `D:\Office\Softwares-Office-Clients\Atulglassagency-ERP\prisma\xyg_catalog.json` |

### 1.3 Application Codebase Directory Map

```
/opt/atulglass-erp/ (or workspace root)
├── Dockerfile                   # Multi-stage production build (node:20-alpine)
├── docker-compose.yml           # App + PostgreSQL 16 Alpine configuration
├── scripts/
│   ├── backup.sh                # Nightly compressed pg_dump script
│   └── restore.sh               # Tested disaster recovery restore script
├── prisma/
│   ├── schema.prisma            # PostgreSQL schema definitions & relations
│   ├── migrations/              # Version-controlled SQL baseline migrations
│   ├── seed.ts                  # Seeds admin, staff, and XYG product catalog
│   └── xyg_catalog.json         # 90 verified Nagpur automotive glass SKUs
├── src/
│   ├── middleware.ts            # Edge-compatible HTTP route guard
│   ├── app/
│   │   ├── layout.tsx           # Root HTML, fonts, and global providers
│   │   ├── page.tsx             # Root redirector (/ -> /dashboard or /login)
│   │   ├── login/page.tsx       # Dedicated authentication portal
│   │   └── (app)/
│   │       ├── layout.tsx       # Persistent shell: Sidebar, Header, Breadcrumbs
│   │       ├── dashboard/       # Executive metrics & fast-moving SKUs
│   │       ├── inventory/       # Stock balances, bin locations, pictograms
│   │       ├── products/        # Product catalog specs, SKU creation
│   │       ├── stock-operations/# Inbound receipts & dispatch entries
│   │       ├── quick-scan/      # Shopfloor touch terminal & scanner listener
│   │       ├── defective/       # Quarantined glass & scrap reconciliation
│   │       ├── low-stock/       # Threshold alerts & reorder notifications
│   │       ├── barcodes/        # Code-128 label generator & print adapter
│   │       ├── audit/           # Physical count sessions & variance resolution
│   │       ├── sku-engine/      # Hierarchy parts numbering console
│   │       ├── reports/         # Historical turnover & ledger analytics
│   │       ├── users/           # RBAC user management (Admin only)
│   │       ├── settings/        # Hardware status & system configurations
│   │       ├── activity-logs/   # Immutable audit trail inspection
│   │       └── migration/       # Legacy intake & unknown SKU reconciliation
│   ├── actions/                 # Next.js Server Actions (RPC over HTTP POST)
│   │   ├── auth.ts              # Login, logout, rate throttling
│   │   ├── inventory.ts         # Stock movements & balance queries
│   │   ├── products.ts          # Catalog CRUD & archival
│   │   ├── defective.ts         # Quarantine, scrap, restore mutations
│   │   ├── audit.ts             # Audit session lifecycle & adjustments
│   │   └── export.ts            # Excel/CSV dataset exports
│   ├── components/
│   │   ├── AppShell.tsx         # Fixed left sidebar, top header, user menu
│   │   ├── pictograms/          # Pure SVG glass location pictograms
│   │   └── ui/                  # Utilitarian UI widgets (Cards, Dialog, Badges)
│   ├── hooks/
│   │   └── useScannerWedge.ts   # Hardware keyboard-wedge scanner listener
│   └── lib/
│       ├── prisma.ts            # Singleton PrismaClient PostgreSQL pool
│       ├── auth.ts              # HMAC-SHA256 tokens, scrypt, timingSafeEqual
│       ├── stock.ts             # Central stock engine (Atomic transactions)
│       ├── sku.ts               # Standard SKU formula generator
│       └── printer/
│           ├── types.ts         # PrintAdapter interface definition
│           └── browser-adapter.ts # CSS @page exact-millimeter print adapter
└── tests/
    ├── sku.test.ts              # SKU generator formatting & collision test
    └── stock-concurrency.test.ts # 5-way simultaneous dispatch oversell test
```

---

## 2. Secrets, Environment Variables & Key Generation

### 2.1 Production Environment Variables (`.env.production`)

```ini
# Node Environment
NODE_ENV=production
PORT=3000

# PostgreSQL Connection String (Inside Docker Network)
# Format: postgresql://[USER]:[PASSWORD]@[CONTAINER_NAME]:5432/[DB_NAME]?schema=public
DATABASE_URL=postgresql://atuladmin:STRONG_DB_PASSWORD@postgres:5432/atulglass_db?schema=public

# Session Secret: 64-character cryptographically secure hex key
# Generated using: openssl rand -hex 32
SESSION_SECRET=REPLACE_WITH_GENERATED_64_CHAR_HEX_KEY

# PostgreSQL Container Variables
POSTGRES_USER=atuladmin
POSTGRES_PASSWORD=STRONG_DB_PASSWORD
POSTGRES_DB=atulglass_db
```

### 2.2 Security Guidelines for Secrets
1. **Never commit `.env` or `.env.production` to git:** Verified in `.gitignore`.
2. **File Permissions:** On the VPS, `.env.production` must be locked:
   ```bash
   chmod 600 /opt/atulglass-erp/.env.production
   chown root:root /opt/atulglass-erp/.env.production
   ```
3. **Key Generation Command:**
   ```bash
   # Generate production SESSION_SECRET:
   openssl rand -hex 32
   
   # Generate strong DB password:
   openssl rand -base64 24
   ```

---

## 3. Endpoints & Server Actions

All backend data operations use Next.js **Server Actions** executing securely on the Node.js server. No client JavaScript can forge or bypass validation.

### 3.1 Authentication & Security Actions (`src/actions/auth.ts`)

| Action Name | Invocation | Role Required | Security Controls |
| :--- | :--- | :--- | :--- |
| `loginAction(email, password)` | POST | Public | In-memory sliding window rate limiter (max 5 failed attempts / 15 mins). `scrypt` hash verification. Sets signed `HttpOnly`, `SameSite=Lax`, `Secure` cookie. |
| `logoutAction()` | POST | Authenticated | Clears `session_token` cookie with `Max-Age=0`. Logs activity. |
| `getSessionAction()` | POST | Authenticated | Verifies HMAC signature and 7-day expiration timestamp using `timingSafeEqual`. |

### 3.2 Inventory & Stock Engine Actions (`src/actions/inventory.ts`, `src/lib/stock.ts`)

All stock mutations pass exclusively through `src/lib/stock.ts` within single `prisma.$transaction` blocks.

| Action Name | Parameters | Invariant Enforced |
| :--- | :--- | :--- |
| `receiveStockAction` | `{ sku, qty, shop, supplier, batchNo, remarks }` | Increments `goodQty`, creates `IN` Ledger row. |
| `issueStockAction` | `{ sku, qty, shop, recipient, reason, remarks }` | Conditional atomic decrement: `updateMany({ where: { id, goodQty: { gte: n } }, data: { goodQty: { decrement: n } } })`. Fails with `InsufficientStockError` if `count === 0`. Never allows negative stock. Creates `OUT` Ledger row. |
| `getInventoryOverviewAction` | Search, filter, page parameters | Computes derived `availableQty = goodQty - 0`. Sorts and returns paginated records. |

### 3.3 Defective Glass Actions (`src/actions/defective.ts`)

| Action Name | Parameters | Invariant Enforced |
| :--- | :--- | :--- |
| `markDefectiveAction` | `{ sku, qty, reason, photoUrl, remarks }` | Atomically decrements `goodQty` (must be `>= qty`), increments `defectiveQty`, creates `DEFECTIVE` Ledger entry and `DefectiveLog` row. |
| `scrapDefectiveAction` | `{ defectiveLogId, scrapReason }` | Atomically decrements `defectiveQty`, marks log as `SCRAPPED`, records `SCRAP` Ledger row. |
| `restoreDefectiveAction` | `{ defectiveLogId, restoreRemarks }` | Restores repaired glass from quarantine: decrements `defectiveQty`, increments `goodQty`, records `RESTORE` Ledger row. |

### 3.4 Physical Audit Actions (`src/actions/audit.ts`)

| Action Name | Parameters | Invariant Enforced |
| :--- | :--- | :--- |
| `startAuditAction` | `{ name, remarks }` | Creates active `AuditSession` (`IN_PROGRESS`). |
| `scanAuditItemAction` | `{ sessionId, barcode, scannedQty }` | Records scanned counts against live snapshot quantity. |
| `reconcileAuditAction` | `{ sessionId, adjustments }` | Executes atomic adjustments in `stock.ts`: reconciles surplus (`AUDIT_GAIN`) or shortage (`AUDIT_LOSS`), creates corresponding Ledger entries, and marks session `COMPLETED`. |

### 3.5 System & Health Endpoints

- **Docker Healthcheck:** `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}` (interval 5s, timeout 5s, retries 5).
- **Application Startup Probe:** `GET http://127.0.0.1:3000/login` returning HTTP 200.

---

## 4. Middleware & Route Protection Flow

### 4.1 Architecture
Authentication routing is enforced at the network boundary in `src/middleware.ts` running in the Edge runtime:

```
Incoming Request
      │
      ▼
Is Path Public? (/login, /_next, /favicon.ico, /public)
      │
     ├── YES ──► Allow Request
     │
     └── NO  ──► Check `session_token` Cookie
                      │
                     ├── MISSING ──► Redirect to /login
                     │
                     └── PRESENT ──► Allow Request to App Router
                                            │
                                            ▼
                                     Server Action
                                     (requireRole / verifySession)
                                     - Timing-safe HMAC signature verification
                                     - Expiration timestamp check
                                     - Role check (admin vs staff)
```

### 4.2 Route Permission Matrix

| URL Route | Permitted Roles | Description |
| :--- | :--- | :--- |
| `/login` | Public | Authentication entry point |
| `/dashboard` | `admin`, `staff` | Real-time inventory overview and KPIs |
| `/inventory` | `admin`, `staff` | Stock catalog table with pictograms |
| `/products` | `admin`, `staff` (Edit: `admin`) | SKU catalog and vehicle fitments |
| `/stock-operations` | `admin`, `staff` | Inbound intake and dispatch operations |
| `/quick-scan` | `admin`, `staff` | Shopfloor hardware wedge barcode terminal |
| `/defective` | `admin`, `staff` (Scrap: `admin`) | Quarantined damaged glass repository |
| `/low-stock` | `admin`, `staff` | Safety reorder threshold alerts |
| `/barcodes` | `admin`, `staff` | Code-128 label preview & browser print |
| `/audit` | `admin` (Staff: Scan only) | Physical count reconciliation |
| `/sku-engine` | `admin`, `staff` | Numbering scheme generator console |
| `/reports` | `admin` | Historical turnover and ledger analytics |
| `/users` | `admin` strictly | Role management and staff provisioning |
| `/settings` | `admin` strictly | System configuration & hardware card |
| `/activity-logs` | `admin` strictly | Immutable compliance audit logs |
| `/migration` | `admin` strictly | Legacy database transition tools |

---

## 5. Database Schema & Core Invariants

### 5.1 Final Database Engine: PostgreSQL 16
The database is strictly PostgreSQL with native ACID transactions. All SQLite-specific file databases and retry workarounds have been removed.

### 5.2 Core Entities

```mermaid
erDiagram
    User ||--o{ Ledger : performs
    User ||--o{ ActivityLog : generates
    Product ||--o{ Inventory : has
    Product ||--o{ Ledger : logs
    Product ||--o{ DefectiveLog : tracks
    AuditSession ||--o{ AuditItem : contains
    Product ||--o{ AuditItem : audits

    Product {
        string id PK
        string sku UK
        string barcode UK
        string brand
        string carBrand
        string carModel
        string glassType
        string position
        int lowStockThreshold
        string status
    }

    Inventory {
        string id PK
        string productId FK
        int goodQty
        int defectiveQty
        string location
        datetime updatedAt
    }

    Ledger {
        string id PK
        string productId FK
        string type
        int qty
        string shop
        string user
        datetime timestamp
    }
```

### 5.3 Enforced Invariants
1. **No Overselling (`goodQty >= 0`):** Enforced via conditional atomic decrements in `src/lib/stock.ts`. Never depends on client-side state.
2. **Derived Available Quantity:** `availableQty` is derived in real-time (`goodQty - reservedQty`), never stored as a separate column to prevent drift.
3. **Unique Part Identifiers:** Unique constraints on `Product.sku` and `Product.barcode`.
4. **Immutable Ledger:** Every quantity change writes a ledger row inside the same database transaction. Stock quantities never change without an audit trail.

---

## 6. VPS Production Robustness Hardening Checklist

When deploying to the Ubuntu VPS, follow this checklist to ensure production stability:

- [ ] **Docker Daemon & Non-Root Context:** Configured to start on boot (`systemctl enable docker`). Application container runs with non-root user context (`USER node`).
- [ ] **Service Resilience:** Containers set to `restart: always` in `docker-compose.yml`.
- [ ] **Database Healthcheck:** Application waits for `postgres` container healthcheck (`condition: service_healthy`) before launching.
- [ ] **Memory & Swap:** Ensure VPS has at least 1 GB RAM + 2 GB swap file configured:
  ```bash
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ```
- [ ] **Firewall (UFW):** Ports 80, 443, and SSH allowed. Port 5432 bound only to internal Docker network (never exposed to public internet).
- [ ] **Nginx Reverse Proxy & Security Headers:** HTTP/2 enabled, upstream keepalive, `client_max_body_size 20M;`, SSL via Let's Encrypt with auto-renewal (`certbot renew --dry-run`). Enforce HSTS (`Strict-Transport-Security "max-age=31536000; includeSubDomains"`), `X-Frame-Options SAMEORIGIN`, and `X-Content-Type-Options nosniff`.
- [ ] **Automated Backups:** Cron job registered to execute `/opt/atulglass-erp/scripts/backup.sh` every morning at 02:00 AM with 14-day local retention.
- [ ] **Disaster Recovery Tested:** Verified restore script using `/opt/atulglass-erp/scripts/restore.sh` against test backup dump.

---

## 7. Future Scope (Documented as NOT Implemented)

The following features were evaluated and deliberately excluded from the current production phase to prevent architectural bloat. They are reserved for future phases:

| Feature / Architecture | Current Status | Future Implementation Plan |
| :--- | :--- | :--- |
| **Offline PC Desktop Application** | **NOT IMPLEMENTED** | Local Electron or Tauri packaging with SQLite edge cache and client-side store-and-forward queue (IndexedDB) syncing to VPS via WebSocket/REST. |
| **Hardware Direct Thermal Printer Drivers** | **NOT IMPLEMENTED** | Native TSPL/ZPL socket connections to LAN thermal printers via a lightweight Raspberry Pi print agent on the warehouse network. |
| **GST Invoicing & Challans** | **NOT IMPLEMENTED** | Generation of tax invoices, e-Way bills, and transport challans with GSTIN validation. |
| **B2B Tiered Customer Pricing** | **NOT IMPLEMENTED** | Differentiated price catalogs for retail vs wholesale workshop clients. |
| **Multi-Branch Warehouse Sync** | **NOT IMPLEMENTED** | Multi-tenant schema supporting independent Nagpur, Pune, and Mumbai regional stock depots. |
| **Multi-Language (i18n)** | **NOT IMPLEMENTED** | Hindi and Marathi localizations for shopfloor scanning interfaces. |
| **Prisma Accelerate / PgBouncer** | **NOT IMPLEMENTED** | Dedicated connection poolers (unnecessary for current concurrency scale). |

---

*This document serves as the authoritative source of truth for VPS operations, true file paths, and security specifications for Atul Glass Agency ERP.*
