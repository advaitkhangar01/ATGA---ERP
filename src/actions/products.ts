'use server'

import { prisma } from '../lib/prisma'
import { requireRole } from '../lib/auth'

export interface CreateProductInput {
  sku: string;
  brand: string;
  carBrand: string;
  carModel: string;
  glassType: string;
  description?: string;
  compatibleModels?: string[];
  status?: 'active' | 'deactivated' | 'archived';
  lowStockThreshold?: number;
  barcode?: string;
}

export interface UpdateProductInput {
  sku?: string;
  brand?: string;
  carBrand?: string;
  carModel?: string;
  glassType?: string;
  description?: string;
  compatibleModels?: string[];
  status?: 'active' | 'deactivated' | 'archived';
  lowStockThreshold?: number;
  barcode?: string;
}

export async function getProducts() {
  return await prisma.product.findMany({
    include: { inventory: true },
    orderBy: { createdDate: 'desc' }
  })
}

export async function addProduct(data: CreateProductInput) {
  await requireRole(['admin']);
  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        sku: data.sku,
        brand: data.brand,
        carBrand: data.carBrand || 'Maruti',
        carModel: data.carModel,
        glassType: data.glassType,
        description: data.description || `${data.brand} ${data.glassType} for ${data.carBrand} ${data.carModel}`,
        compatibleModels: JSON.stringify(data.compatibleModels || [data.carModel]),
        status: data.status || 'active',
        threshold: data.lowStockThreshold ?? 5,
        barcode: data.barcode || data.sku,
        inventory: {
          create: {
            goodQty: 0,
            defectiveQty: 0,
            availableQty: 0,
            location: 'Main Warehouse'
          }
        }
      },
      include: { inventory: true }
    });

    return product;
  });
}

export async function editProduct(id: string, data: UpdateProductInput) {
  await requireRole(['admin']);
  const updateData: Record<string, any> = {};
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.brand !== undefined) updateData.brand = data.brand;
  if (data.carBrand !== undefined) updateData.carBrand = data.carBrand;
  if (data.carModel !== undefined) updateData.carModel = data.carModel;
  if (data.glassType !== undefined) updateData.glassType = data.glassType;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.compatibleModels !== undefined) updateData.compatibleModels = JSON.stringify(data.compatibleModels);
  if (data.status !== undefined) updateData.status = data.status;
  if (data.lowStockThreshold !== undefined) updateData.threshold = data.lowStockThreshold;
  if (data.barcode !== undefined) updateData.barcode = data.barcode;

  return await prisma.product.update({
    where: { id },
    data: updateData,
    include: { inventory: true }
  });
}

export async function archiveProduct(id: string) {
  await requireRole(['admin']);
  return await prisma.product.update({
    where: { id },
    data: { status: 'archived' }
  });
}

export async function deactivateProduct(id: string) {
  await requireRole(['admin']);
  return await prisma.product.update({
    where: { id },
    data: { status: 'deactivated' }
  });
}
