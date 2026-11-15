import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';
import catalogData from './xyg_catalog.json';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Atul Glass Agency ERP Database Seed (PostgreSQL) ---');

  // 1. Seed Default Admin User
  const adminPassword = hashPassword('Admin@123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@atulglass.com' },
    update: {
      password: adminPassword,
      role: 'admin',
      name: 'Atul Gupta'
    },
    create: {
      email: 'admin@atulglass.com',
      password: adminPassword,
      role: 'admin',
      name: 'Atul Gupta'
    }
  });
  console.log(`✅ Seeded Admin User: ${admin.email} (Role: ${admin.role})`);

  // 2. Seed Default Staff User
  const staffPassword = hashPassword('Staff@123');
  const staff = await prisma.user.upsert({
    where: { email: 'staff@atulglass.com' },
    update: {
      password: staffPassword,
      role: 'staff',
      name: 'Ramesh Kumar'
    },
    create: {
      email: 'staff@atulglass.com',
      password: staffPassword,
      role: 'staff',
      name: 'Ramesh Kumar'
    }
  });
  console.log(`✅ Seeded Staff User: ${staff.email} (Role: ${staff.role})`);

  // 3. Seed XYG Dealer Catalog (90 real automotive glass items from Nagpur price list)
  console.log(`Importing ${catalogData.length} XYG automotive glass blueprint products...`);
  let createdCount = 0;

  for (const item of catalogData) {
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        brand: item.brand,
        carBrand: item.carBrand,
        carModel: item.carModel,
        glassType: item.glassType,
        position: item.position,
        description: item.description,
        threshold: item.threshold,
        barcode: item.barcode,
        status: 'active'
      },
      create: {
        sku: item.sku,
        brand: item.brand,
        carBrand: item.carBrand,
        carModel: item.carModel,
        glassType: item.glassType,
        position: item.position,
        description: item.description,
        threshold: item.threshold,
        barcode: item.barcode,
        status: 'active'
      }
    });

    // Initialize Inventory row for each product
    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        goodQty: 0,
        defectiveQty: 0,
        rackLocation: 'Main Warehouse'
      }
    });

    createdCount++;
  }
  console.log(`✅ Successfully seeded ${createdCount} products and inventory records.`);

  // 4. Seed initial live demonstration stock for top 5 fast-moving SKUs
  const fastMovingSkus = [
    { skuLike: 'SWIF', qty: 15 },
    { skuLike: 'CRET', qty: 10 },
    { skuLike: 'NEXO', qty: 12 },
    { skuLike: 'CITY', qty: 8 },
    { skuLike: 'ACCE', qty: 6 }
  ];

  for (const demo of fastMovingSkus) {
    const prod = await prisma.product.findFirst({
      where: { sku: { contains: demo.skuLike } },
      include: { inventory: true }
    });

    if (prod && prod.inventory) {
      await prisma.inventory.update({
        where: { id: prod.inventory.id },
        data: { goodQty: demo.qty }
      });

      // Write initial inward ledger
      const existingLedger = await prisma.ledger.findFirst({
        where: { productId: prod.id }
      });
      if (!existingLedger) {
        await prisma.ledger.create({
          data: {
            type: 'IN',
            quantity: demo.qty,
            brand: prod.brand,
            shop: 'Nagpur Central Warehouse',
            user: 'admin@atulglass.com',
            remarks: 'Initial catalog stock opening balance',
            productId: prod.id
          }
        });
      }
    }
  }

  console.log('✅ Initial demonstration stock & ledger seeded for fast-moving models.');
  console.log('--- PostgreSQL Database Seed Finished Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
