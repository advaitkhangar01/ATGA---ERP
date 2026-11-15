'use server'

import { prisma } from '../lib/prisma'
import { generateMockData, LedgerEntry } from '../utils/mockData'

export async function hydrateStore() {
  let dbProducts = await prisma.product.findMany({
    include: { inventory: true },
    orderBy: { createdDate: 'desc' }
  })

  // Auto-seed initial catalog if database is fresh/empty
  if (dbProducts.length === 0) {
    const mock = generateMockData();
    const initialBatch = mock.products.slice(0, 30);
    for (const p of initialBatch) {
      const inv = mock.inventory.find(i => i.productId === p.id) || {
        goodQty: 10,
        defectiveQty: 0,
        availableQty: 10,
        location: 'Warehouse A1-B3'
      };
      await prisma.product.create({
        data: {
          sku: p.sku,
          brand: p.brand,
          carBrand: p.carBrand,
          carModel: p.carModel,
          glassType: p.glassType,
          description: p.description,
          compatibleModels: JSON.stringify(p.compatibleModels),
          status: p.status,
          threshold: p.lowStockThreshold,
          barcode: p.barcode,
          inventory: {
            create: {
              goodQty: inv.goodQty,
              defectiveQty: inv.defectiveQty,
              rackLocation: inv.location || 'Main Warehouse'
            }
          }
        }
      });
    }
    dbProducts = await prisma.product.findMany({
      include: { inventory: true },
      orderBy: { createdDate: 'desc' }
    });
  }

  const ledger = await prisma.ledger.findMany({
    orderBy: { timestamp: 'desc' }
  })

  const defective = await prisma.defective.findMany({
    orderBy: { timestamp: 'desc' }
  })

  const frontendProducts = dbProducts.map(p => {
    let compatibleModels: string[] = [];
    try {
      compatibleModels = JSON.parse(p.compatibleModels || '[]');
    } catch {
      compatibleModels = [p.carModel];
    }

    return {
      id: p.id,
      sku: p.sku,
      brand: p.brand,
      carBrand: p.carBrand,
      carModel: p.carModel,
      glassType: p.glassType,
      description: p.description || `${p.brand} ${p.glassType} for ${p.carBrand} ${p.carModel}`,
      compatibleModels,
      status: (p.status || 'active') as 'active' | 'deactivated' | 'archived',
      lowStockThreshold: p.threshold,
      barcode: p.barcode || p.sku,
      createdDate: p.createdDate.toISOString().split('T')[0]
    };
  });

  const frontendInventory = dbProducts.map(p => {
    const goodQty = p.inventory?.goodQty ?? 0;
    const defectiveQty = p.inventory?.defectiveQty ?? 0;
    const availableQty = goodQty; // Derived: goodQty - reservedQty

    let status: 'Normal' | 'Low Stock' | 'Critical' | 'Out Of Stock' = 'Normal';
    if (goodQty === 0) status = 'Out Of Stock';
    else if (goodQty <= 2) status = 'Critical';
    else if (goodQty <= p.threshold) status = 'Low Stock';

    return {
      id: p.inventory?.id || `inv-${p.id}`,
      productId: p.id,
      sku: p.sku,
      brand: p.brand,
      carModel: `${p.carBrand} ${p.carModel}`,
      glassType: p.glassType,
      goodQty,
      defectiveQty,
      availableQty,
      status,
      location: p.inventory?.rackLocation || 'Main Warehouse',
      lastUpdated: (p.inventory?.lastUpdated || new Date()).toISOString()
    };
  });

  const frontendLedger = ledger.map(l => ({
    id: l.id,
    productId: l.productId,
    sku: dbProducts.find(p => p.id === l.productId)?.sku || '',
    brand: l.brand,
    type: (l.type || 'in') as LedgerEntry['type'],
    qty: l.quantity,
    user: l.user,
    shop: l.shop,
    timestamp: l.timestamp.toISOString(),
    remarks: l.remarks || ''
  }));

  const frontendDefective = defective.map(d => ({
    id: d.id,
    productId: dbProducts.find(p => p.sku === d.sku)?.id || '',
    sku: d.sku,
    brand: dbProducts.find(p => p.sku === d.sku)?.brand || 'Saint Gobain',
    qty: d.quantity,
    reason: d.reason,
    timestamp: d.timestamp.toISOString(),
    status: (d.status || 'reported') as 'reported' | 'scrapped' | 'restored',
    user: 'admin@atulglass.com',
    shop: 'Main Warehouse'
  }));

  return {
    products: frontendProducts,
    inventory: frontendInventory,
    ledger: frontendLedger,
    defective: frontendDefective
  };
}
