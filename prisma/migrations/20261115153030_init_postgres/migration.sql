-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "carBrand" TEXT NOT NULL,
    "carModel" TEXT NOT NULL,
    "glassType" TEXT NOT NULL,
    "position" TEXT NOT NULL DEFAULT 'Front',
    "description" TEXT NOT NULL DEFAULT '',
    "compatibleModels" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "threshold" INTEGER NOT NULL DEFAULT 5,
    "barcode" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "goodQty" INTEGER NOT NULL DEFAULT 0,
    "defectiveQty" INTEGER NOT NULL DEFAULT 0,
    "rackLocation" TEXT NOT NULL DEFAULT 'Main Warehouse',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "brand" TEXT NOT NULL DEFAULT '',
    "shop" TEXT NOT NULL DEFAULT 'Nagpur Central Warehouse',
    "user" TEXT NOT NULL DEFAULT 'system',
    "remarks" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Defective" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "Defective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditSession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'in-progress',

    CONSTRAINT "AuditSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditScan" (
    "id" TEXT NOT NULL,
    "auditSessionId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "expectedQty" INTEGER NOT NULL,
    "actualQty" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_carBrand_carModel_idx" ON "Product"("carBrand", "carModel");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_key" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_productId_idx" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_rackLocation_idx" ON "Inventory"("rackLocation");

-- CreateIndex
CREATE INDEX "Ledger_productId_idx" ON "Ledger"("productId");

-- CreateIndex
CREATE INDEX "Ledger_timestamp_idx" ON "Ledger"("timestamp");

-- CreateIndex
CREATE INDEX "Ledger_type_idx" ON "Ledger"("type");

-- CreateIndex
CREATE INDEX "Defective_sku_idx" ON "Defective"("sku");

-- CreateIndex
CREATE INDEX "Defective_status_idx" ON "Defective"("status");

-- CreateIndex
CREATE INDEX "AuditScan_auditSessionId_idx" ON "AuditScan"("auditSessionId");

-- CreateIndex
CREATE INDEX "AuditScan_sku_idx" ON "AuditScan"("sku");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditScan" ADD CONSTRAINT "AuditScan_auditSessionId_fkey" FOREIGN KEY ("auditSessionId") REFERENCES "AuditSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
