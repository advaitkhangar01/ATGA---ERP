'use server'

import { prisma, withTransactionRetry } from '../lib/prisma'
import { requireRole } from '../lib/auth'

export async function stockIn(sku: string, qty: number, vendor: string, remarks: string) {
  await requireRole(['admin', 'staff']);
  return withTransactionRetry(async () => {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { sku } })
      if (!product) throw new Error(`Product with SKU ${sku} not found.`)

      const inventory = await tx.inventory.upsert({
        where: { productId: product.id },
        create: { 
          productId: product.id, 
          goodQty: qty, 
          defectiveQty: 0,
          rackLocation: 'Main Warehouse' 
        },
        update: { 
          goodQty: { increment: qty }
        }
      })

      const ledger = await tx.ledger.create({
        data: {
          type: 'IN',
          quantity: qty,
          brand: product.brand,
          shop: 'Nagpur Central Warehouse',
          user: vendor || 'Vendor Delivery',
          remarks: remarks || `Vendor: ${vendor}`,
          productId: product.id,
        }
      })
      
      return { success: true, inventory, ledger }
    }, { maxWait: 5000, timeout: 10000 })
  })
}

export async function stockOut(sku: string, qty: number, customer: string, reason: string, remarks: string) {
  await requireRole(['admin', 'staff']);
  return withTransactionRetry(async () => {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { sku } })
      if (!product) throw new Error(`Product with SKU ${sku} not found.`)
      
      const inventory = await tx.inventory.findUnique({ where: { productId: product.id } })
      if (!inventory || inventory.goodQty < qty) {
        throw new Error(`Insufficient stock for SKU ${sku}.`)
      }

      const newInventory = await tx.inventory.update({
        where: { productId: product.id },
        data: { 
          goodQty: { decrement: qty }
        }
      })

      const ledger = await tx.ledger.create({
        data: {
          type: 'OUT',
          quantity: qty,
          brand: product.brand,
          shop: 'Nagpur Central Warehouse',
          user: customer || 'Customer Dispatch',
          remarks: `${reason}: ${customer}. ${remarks}`,
          productId: product.id,
        }
      })
      
      return { success: true, inventory: newInventory, ledger }
    }, { maxWait: 5000, timeout: 10000 })
  })
}

export async function markDefective(sku: string, qty: number, reason: string) {
  await requireRole(['admin', 'staff']);
  return withTransactionRetry(async () => {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { sku } })
      if (!product) throw new Error(`Product with SKU ${sku} not found.`)
      
      const inventory = await tx.inventory.findUnique({ where: { productId: product.id } })
      if (!inventory || inventory.goodQty < qty) {
        throw new Error(`Insufficient stock for SKU ${sku} to mark defective.`)
      }

      const newInventory = await tx.inventory.update({
        where: { productId: product.id },
        data: { 
          goodQty: { decrement: qty },
          defectiveQty: { increment: qty }
        }
      })
      
      const defective = await tx.defective.create({
        data: {
          sku,
          quantity: qty,
          reason,
          status: 'pending'
        }
      })
      
      const ledger = await tx.ledger.create({
        data: {
          type: 'DEFECTIVE_MARK',
          quantity: qty,
          brand: product.brand,
          shop: 'Nagpur Central Warehouse',
          user: 'staff@atulglass.com',
          remarks: reason,
          productId: product.id,
        }
      })

      return { success: true, inventory: newInventory, defective, ledger }
    }, { maxWait: 5000, timeout: 10000 })
  })
}
