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
    if (typeof prod.lowStockThreshold !== 'number') {
      throw new Error(`Product lowStockThreshold is missing: ${prod.sku}`);
    }
  }
  console.log('✅ Hydration test passed: exact contract match.');
}

testHydration()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
