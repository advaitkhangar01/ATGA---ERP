import { prisma } from '../src/lib/prisma';
import { issueStock, receiveStock } from '../src/lib/stock';

async function testStockConcurrency() {
  console.log('=== STARTING STOCK CONCURRENCY UNIT TEST (5 SIMULTANEOUS SCANS) ===');

  const testSku = `TEST-CONCURRENCY-${Date.now()}`;

  // 1. Create a fresh test product
  const product = await prisma.product.create({
    data: {
      sku: testSku,
      brand: 'AIS',
      carBrand: 'Maruti',
      carModel: 'Swift Dzire',
      glassType: 'Windshield',
      position: 'Front',
      description: 'Concurrency Test Windshield',
      status: 'active',
      threshold: 3
    }
  });

  // 2. Set exactly 1 unit of stock
  await receiveStock({
    productId: product.id,
    quantity: 1,
    vendor: 'Asahi India Glass',
    remarks: 'Initial single unit for race condition test',
    operator: 'test-admin'
  });

  const initialInventory = await prisma.inventory.findUniqueOrThrow({
    where: { productId: product.id }
  });
  console.log(`Initial stock verified: ${initialInventory.goodQty} unit.`);
  if (initialInventory.goodQty !== 1) {
    throw new Error(`Expected initial goodQty 1, got ${initialInventory.goodQty}`);
  }

  // 3. Fire 5 simultaneous issueStock calls for 1 unit each
  console.log('Firing 5 concurrent issueStock requests simultaneously for the same unit...');
  const promises = Array.from({ length: 5 }, (_, index) =>
    issueStock({
      productId: product.id,
      quantity: 1,
      customer: `Workshop-${index + 1}`,
      reason: 'Counter Sale',
      remarks: `Simultaneous scan attempt #${index + 1}`,
      operator: 'staff@atulglass.com'
    })
  );

  const results = await Promise.allSettled(promises);

  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');

  console.log(`Fulfilled dispatches: ${fulfilled.length} (Expected: 1)`);
  console.log(`Rejected dispatches: ${rejected.length} (Expected: 4)`);

  // Print reasons for rejection
  rejected.forEach((r, idx) => {
    if (r.status === 'rejected') {
      const err = r.reason as Error;
      console.log(`  Rejected [${idx + 1}]: ${err.name} - ${err.message}`);
    }
  });

  // 4. Assertions
  if (fulfilled.length !== 1) {
    throw new Error(`CRITICAL FAILURE: Expected exactly 1 fulfillment, got ${fulfilled.length}. Overselling occurred!`);
  }

  if (rejected.length !== 4) {
    throw new Error(`CRITICAL FAILURE: Expected exactly 4 rejections, got ${rejected.length}.`);
  }

  // 5. Verify database inventory state
  const finalInventory = await prisma.inventory.findUniqueOrThrow({
    where: { productId: product.id }
  });

  console.log(`Final Database goodQty: ${finalInventory.goodQty} (Expected: 0)`);
  if (finalInventory.goodQty !== 0) {
    throw new Error(`Expected final goodQty 0, got ${finalInventory.goodQty}`);
  }

  // 6. Verify ledger count
  const ledgers = await prisma.ledger.findMany({
    where: { productId: product.id }
  });
  const inLedgers = ledgers.filter((l) => l.type === 'IN');
  const outLedgers = ledgers.filter((l) => l.type === 'OUT');

  console.log(`Ledger counts - IN: ${inLedgers.length}, OUT: ${outLedgers.length}`);
  if (outLedgers.length !== 1) {
    throw new Error(`Expected exactly 1 OUT ledger entry, got ${outLedgers.length}`);
  }

  // Cleanup test product
  await prisma.product.delete({
    where: { id: product.id }
  });

  console.log('✅ TEST PASSED: Conditional atomic updates strictly prevent overselling under concurrent load.');
}

testStockConcurrency()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
