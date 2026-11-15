/**
 * SKU Generation & Formatting Test Suite
 */
import { generateSku } from '../src/lib/sku';

function runTests() {
  console.log('=== RUNNING SKU GENERATION TEST SUITE ===');

  // Test 1: Standard Saint Gobain Swift Windshield
  const sku1 = generateSku('Saint Gobain', 'Maruti', 'Swift', 'Windshield', 'Front', 'ADAS Bracket');
  console.log('Test 1 Generated SKU:', sku1);
  if (sku1 !== 'SG-MAR-SWIF-WS-FRN-ADAS') {
    throw new Error(`Expected SG-MAR-SWIF-WS-FRN-ADAS, got ${sku1}`);
  }
  console.log('✅ Test 1 passed: canonical Saint Gobain Swift windshield');

  // Test 2: Clarion Honda City Rear Glass
  const sku2 = generateSku({
    brand: 'Clarion',
    carBrand: 'Honda',
    model: 'City',
    type: 'Rear Glass',
    position: 'Rear',
    feature: 'Demister Heated'
  });
  console.log('Test 2 Generated SKU:', sku2);
  if (sku2 !== 'CLA-HON-CITY-RG-REAR-HEAT') {
    throw new Error(`Expected CLA-HON-CITY-RG-REAR-HEAT, got ${sku2}`);
  }
  console.log('✅ Test 2 passed: Clarion Honda City rear glass');

  // Test 3: Uniqueness across parameter variations
  const set = new Set<string>();
  const models = ['Swift', 'Baleno', 'Brezza', 'Dzire'];
  const types = ['Windshield', 'Rear Glass', 'Door Glass'];
  const positions = ['Front', 'Rear', 'Front Left', 'Front Right'];

  for (const m of models) {
    for (const t of types) {
      for (const pos of positions) {
        const sku = generateSku('Saint Gobain', 'Maruti', m, t, pos, 'Standard');
        if (set.has(sku)) {
          throw new Error(`Duplicate SKU collision generated: ${sku}`);
        }
        set.add(sku);
      }
    }
  }
  console.log(`✅ Test 3 passed: ${set.size} distinct SKUs generated with 0 collisions.`);

  // Test 4: Custom brand / unknown strings fallback safely
  const customSku = generateSku('CustomMaker', 'Tesla', 'Model3', 'RoofGlass', 'Top', 'Tinted');
  console.log('Test 4 Fallback SKU:', customSku);
  if (!customSku.startsWith('CUS-TES-MODE-RO-TOP-TINT')) {
    throw new Error(`Unexpected custom SKU format: ${customSku}`);
  }
  console.log('✅ Test 4 passed: safe fallback slugification');

  console.log('=== ALL SKU TESTS PASSED ===');
}

runTests();
