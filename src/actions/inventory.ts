'use server'

import { prisma } from '../lib/prisma'

export async function stockIn(sku: string, qty: number, vendor: string, remarks: string) {
  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { sku } })
    if (!product) throw new Error(`Product with SKU ${sku} not found.`)

    const inventory = await tx.inventory.upsert({
      where: { productId: product.id },
      create: { productId: product.id, quantity: qty },
      update: { quantity: { increment: qty } }
    })

    const ledger = await tx.ledger.create({
      data: {
        actionType: 'IN',
        quantity: qty,
        remarks: remarks || `Vendor: ${vendor}`,
        productId: product.id,
      }
    })
    
    return { success: true, inventory, ledger }
  })
}

export async function stockOut(sku: string, qty: number, customer: string, reason: string, remarks: string) {
  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { sku } })
    if (!product) throw new Error(`Product with SKU ${sku} not found.`)
    
    const inventory = await tx.inventory.findUnique({ where: { productId: product.id } })
    if (!inventory || inventory.quantity < qty) {
      throw new Error(`Insufficient stock for SKU ${sku}.`)
    }

    const newInventory = await tx.inventory.update({
      where: { productId: product.id },
      data: { quantity: { decrement: qty } }
    })

    const ledger = await tx.ledger.create({
      data: {
        actionType: 'OUT',
        quantity: qty,
        remarks: `${reason}: ${customer}. ${remarks}`,
        productId: product.id,
      }
    })
    
    return { success: true, inventory: newInventory, ledger }
  })
}

export async function markDefective(sku: string, qty: number, reason: string) {
  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { sku } })
    if (!product) throw new Error(`Product with SKU ${sku} not found.`)
    
    const inventory = await tx.inventory.findUnique({ where: { productId: product.id } })
    if (!inventory || inventory.quantity < qty) {
      throw new Error(`Insufficient stock for SKU ${sku} to mark defective.`)
    }

    const newInventory = await tx.inventory.update({
      where: { productId: product.id },
      data: { quantity: { decrement: qty } }
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
        actionType: 'DEFECTIVE',
        quantity: qty,
        remarks: reason,
        productId: product.id,
      }
    })

    return { success: true, inventory: newInventory, defective, ledger }
  })
}
