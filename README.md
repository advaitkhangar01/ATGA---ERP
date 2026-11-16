# ATGA ERP - Atul Glass Agency Inventory & Warehouse Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.14.0-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=flat&logo=docker)](https://www.docker.com/)

A modern, barcode-driven automotive safety glass inventory and warehouse operations system custom-built for **Atul Glass Agency, Nagpur**. Designed for high-concurrency warehouse counter sales, hands-free hardware barcode scanning, automated SKU generation, and real-time stock ledger tracking.

---

## 🌟 Key Features

- **Automotive Safety Glass Catalog (`/products`):**
  - Centralized master repository for glass products (Windshield, Back Light, Front Door, Rear Door, Quarter, Vent).
  - Multi-brand compatibility mapping (AIS, Saint-Gobain, XYG, Fuyao) with vehicle makes and models.
  - Visual SVG glass position pictograms.

- **Real-Time Inventory & Rack Management (`/inventory`):**
  - Instant visibility across physical warehouse racks and bin locations (e.g., `RACK-A-04`).
  - Derived available quantity calculation (`goodQty - reservedQty`), defective count, and low-stock threshold triggers.
  - Interactive stock history drawer with item-level audit trails.

- **Barcode Label Engine & Printing (`/barcodes`):**
  - High-density Code-128 barcode generation.
  - Direct browser thermal label printing adapter (50mm × 25mm and 100mm × 50mm layouts).

- **Hardware Wedge Quick Scan (`/quick-scan`):**
  - Keyboard-wedge listener for USB/Bluetooth handheld barcode scanners.
  - Rapid counter dispatch (OUT) and reception (IN) with sub-second lookups.
  - Audio feedback cues (success confirmation beep, error/out-of-stock buzzers).

- **Atomic Stock Operations (`/stock-operations`):**
  - Inbound reception from glass manufacturers and suppliers.
  - Counter sales and workshop dispatch with conditional atomic decrement (preventing negative inventory).
  - Full transactional ledger logging for every movement.

- **Defective Glass & Claims Tracking (`/defective`):**
  - Transit breakages, manufacturing imperfections, and warehouse handling damage logging.
  - Photo upload attachment support and supplier return/credit status tracking.

- **Physical Stock Audit (`/audit`):**
  - Regular cycle counts, variance calculations against system inventory, and discrepancy ledger records.

- **Role-Based Access Control (RBAC):**
  - Session-based authentication with cryptographically signed cookies and rate-limited login endpoints.
  - Role enforcement (`ADMIN` vs. `STAFF`) across UI routes and Server Actions.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router & Turbopack) |
| **Frontend** | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/) via [Prisma ORM 5](https://www.prisma.io/) |
| **Containerization** | [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) |
| **Reverse Proxy** | [Nginx](https://nginx.org/) with SSL termination |

---

## 📁 Project Architecture

```
ATGA---ERP/
├── docs/                           # Architecture, security specs & runbooks
│   ├── 01-requirements.md          # Functional & operational requirements
│   ├── 02-architecture.md          # Technical specifications & hosting strategy
│   ├── 03-data-model.md            # PostgreSQL schema & relationship models
│   ├── 04-ui-ux-spec.md            # Design system & shopfloor ergonomics
│   ├── 05-deployment-runbook.md    # Multi-site VPS deployment manual
│   └── ...                         # Production readiness and audit plans
├── prisma/
│   ├── schema.prisma               # Prisma data models & indices
│   ├── migrations/                 # Versioned SQL migrations
│   ├── seed.ts                     # Database seeder (admin users & XYG catalog)
│   └── xyg_catalog.json            # Automotive glass catalog dataset
├── public/                         # Static assets and icons
├── scripts/
│   ├── deploy-vps.sh               # Automated deployment script for production VPS
│   ├── backup.sh                   # Automated pg_dump database backup script
│   └── restore.sh                  # Database restoration utility
├── src/
│   ├── actions/                    # Next.js Server Actions (Auth, Stock, Products, Audit)
│   ├── app/                        # Next.js App Router pages and layouts
│   │   ├── (app)/                  # Authenticated app shell routes
│   │   ├── login/                  # Login authentication page
│   │   └── layout.tsx              # Root HTML and font setup
│   ├── components/                 # Reusable UI components & SVG pictograms
│   ├── hooks/                      # Custom hooks (e.g., useScannerWedge)
│   ├── lib/                        # Core utilities (Prisma client, Auth, Stock mutations, SKU generator)
│   ├── store/                      # Zustand client stores
│   └── views/                      # Feature view components
├── tests/                          # Integration and concurrency test suites
├── docker-compose.yml              # Production container orchestration
├── Dockerfile                      # Multi-stage hardened production Dockerfile
└── package.json                    # Project metadata and dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or later
- **npm**: `v10.x` or later
- **PostgreSQL**: `v16.x` (or Docker for running local database)

### 1. Clone the Repository

```bash
git clone https://github.com/advaitkhangar01/ATGA---ERP.git
cd ATGA---ERP
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Update `.env` with your PostgreSQL credentials and session secret:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/atulglass_erp?schema=public"
SESSION_SECRET="your-secure-random-secret-key-at-least-64-characters"
PORT=3000
```

### 4. Database Setup & Seeding

Run Prisma migrations and populate initial seed data:

```bash
# Apply migrations to database
npx prisma migrate dev

# Seed initial admin user and automotive glass catalog
npm run seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run tests and verification suites:

```bash
# TypeScript compilation & typecheck
npx tsc --noEmit

# Production build test
npm run build

# Concurrency & Stock Mutation Tests
npx tsx tests/stock-concurrency.test.ts
```

---

## 🐳 Production Deployment (Docker Compose)

The application is containerized with a hardened multi-stage Docker build running under a non-root user.

```bash
# Start PostgreSQL and Next.js App in detached mode
docker compose up -d --build

# Inspect running containers
docker compose ps

# View real-time container logs
docker compose logs -f app
```

For detailed production configuration, Nginx reverse proxy setup, SSL, and multi-tenant VPS hosting guidelines, refer to [`docs/05-deployment-runbook.md`](docs/05-deployment-runbook.md) and [`docs/07-vps-production-and-security-reference.md`](docs/07-vps-production-and-security-reference.md).

---

## 🔒 Security & Backups

- **Authentication:** HttpOnly, Secure, SameSite session cookies signed with HMAC-SHA256.
- **Transactions:** High-concurrency operations use PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) or serializable transactions.
- **Automated Backups:** Daily rotation scripts located in `scripts/backup.sh` with compression and 14-day retention.

---

## 📄 License

Proprietary and Confidential. Built for **Atul Glass Agency, Nagpur**.
