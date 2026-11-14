import { addProduct, archiveProduct } from './src/actions/products';
import { scrapDefective, restoreDefective } from './src/actions/defective';
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
  if (archived?.status !== 'archived') throw new Error(`Archived status not persisted: ${archived?.status}`);

  console.log('✅ CRUD persistence test passed.');
}

testCrudPersistence()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
