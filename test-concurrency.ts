import { stockIn, stockOut } from './src/actions/inventory';
import { addProduct } from './src/actions/products';
import { prisma } from './src/lib/prisma';

async function runTest() {
  console.log('--- Starting Concurrency Test ---');
  // 1. Create a dummy product
  const product = await addProduct({
    sku: 'TEST-RACE-001',
    brand: 'Maruti',
    carModel: 'Swift',
    glassType: 'Front',
    threshold: 5
  });
  console.log('Created product: TEST-RACE-001');

  // 2. Add exactly 1 unit of stock
  await stockIn('TEST-RACE-001', 1, 'Vendor A', 'Initial Stock');
  console.log('Added 1 unit of stock to TEST-RACE-001');
  
  // 3. Try to stockOut 1 unit TWICE simultaneously
  console.log('Attempting to scan out the last unit twice concurrently (Simulating two fast scanner clicks)...');
  const results = await Promise.allSettled([
    stockOut('TEST-RACE-001', 1, 'Cust A', 'Test', 'Simultaneous Scan 1'),
    stockOut('TEST-RACE-001', 1, 'Cust B', 'Test', 'Simultaneous Scan 2')
  ]);

  console.log('Scan 1 Status:', results[0].status);
  if (results[0].status === 'rejected') console.log('Scan 1 Error:', results[0].reason.message);
  
  console.log('Scan 2 Status:', results[1].status);
  if (results[1].status === 'rejected') console.log('Scan 2 Error:', results[1].reason.message);
  
  // 4. Verify DB state
  const inv = await prisma.inventory.findUnique({ where: { productId: product.id }});
  console.log('Final Inventory Qty (Should be exactly 0):', inv?.goodQty);
  
  if (inv?.goodQty === 0) {
    console.log('✅ TEST PASSED: No negative inventory! Race conditions are prevented by Prisma transactions.');
  } else {
    console.log('❌ TEST FAILED: Negative inventory occurred!');
  }
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
