'use server'

import { prisma } from '../lib/prisma'

export async function hydrateStore() {
  const dbProducts = await prisma.product.findMany({
    include: { inventory: true }
  })
  
  const ledger = await prisma.ledger.findMany({
    orderBy: { timestamp: 'desc' }
  })
  
  const defective = await prisma.defective.findMany({
    orderBy: { timestamp: 'desc' }
  })

  // Map backend structure exactly to the Mockup's frontend structure
  // This prevents the need to rewrite all 15 React Views at once!
  
  const frontendProducts = dbProducts.map(p => ({
    id: p.id,
    sku: p.sku,
    brand: p.brand,
    carModel: p.carModel,
    glassType: p.glassType,
    threshold: p.threshold,
    barcode: p.sku, // simplified
    createdDate: new Date().toISOString()
  }))

  const frontendInventory = dbProducts.map(p => {
    const qty = p.inventory?.quantity || 0;
    let status = 'Normal';
    if (qty === 0) status = 'Out Of Stock';
    else if (qty <= 2) status = 'Critical';
    else if (qty <= p.threshold) status = 'Low Stock';

    return {
      id: p.inventory?.id || `inv-${p.id}`,
      productId: p.id,
      sku: p.sku,
      brand: p.brand,
      carModel: p.carModel,
      glassType: p.glassType,
      quantity: qty,
      location: p.inventory?.location || 'Main Warehouse',
      threshold: p.threshold,
      status
    }
  })

  return {
    products: frontendProducts,
    inventory: frontendInventory,
    ledger: ledger.map(l => ({
      id: l.id,
      productId: l.productId,
      actionType: l.actionType === 'IN' ? 'stock_in' : l.actionType === 'OUT' ? 'stock_out' : 'defective',
      quantity: l.quantity,
      timestamp: l.timestamp.toISOString(),
      remarks: l.remarks || '',
      userId: l.userId || 'admin'
    })),
    defective: defective.map(d => ({
      id: d.id,
      sku: d.sku,
      quantity: d.quantity,
      reason: d.reason,
      status: d.status,
      timestamp: d.timestamp.toISOString()
    }))
  }
}
