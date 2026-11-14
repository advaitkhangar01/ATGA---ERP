'use server'

import { prisma } from '../lib/prisma'

export async function getProducts() {
  return await prisma.product.findMany({
    include: { inventory: true }
  })
}

export async function addProduct(data: { sku: string; brand: string; carModel: string; glassType: string; threshold: number }) {
  return await prisma.product.create({
    data: {
      ...data,
      inventory: {
        create: { goodQty: 0, defectiveQty: 0, availableQty: 0 }
      }
    },
    include: { inventory: true }
  })
}

export async function updateProduct(id: string, data: Partial<{ sku: string; brand: string; carModel: string; glassType: string; threshold: number }>) {
  return await prisma.product.update({
    where: { id },
    data,
    include: { inventory: true }
  })
}
