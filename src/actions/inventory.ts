'use server';

import { prisma } from '../lib/prisma';
import { requireRole } from '../lib/auth';
import { receiveStock, issueStock, quarantineDefective } from '../lib/stock';

export async function stockIn(sku: string, qty: number, vendor: string, remarks: string) {
  const session = await requireRole(['admin', 'staff']);

  const product = await prisma.product.findUnique({
    where: { sku }
  });
  if (!product) {
    throw new Error(`Product with SKU "${sku}" not found.`);
  }

  const result = await receiveStock({
    productId: product.id,
    quantity: qty,
    vendor,
    remarks,
    operator: session.email
  });

  return {
    success: true,
    inventory: result.inventory,
    ledger: result.ledger
  };
}

export async function stockOut(
  sku: string,
  qty: number,
  customer: string,
  reason: string,
  remarks: string
) {
  const session = await requireRole(['admin', 'staff']);

  const product = await prisma.product.findUnique({
    where: { sku }
  });
  if (!product) {
    throw new Error(`Product with SKU "${sku}" not found.`);
  }

  const result = await issueStock({
    productId: product.id,
    quantity: qty,
    customer,
    reason,
    remarks,
    operator: session.email
  });

  return {
    success: true,
    inventory: result.inventory,
    ledger: result.ledger
  };
}

export async function markDefective(sku: string, qty: number, reason: string) {
  const session = await requireRole(['admin', 'staff']);

  const product = await prisma.product.findUnique({
    where: { sku }
  });
  if (!product) {
    throw new Error(`Product with SKU "${sku}" not found.`);
  }

  const result = await quarantineDefective({
    productId: product.id,
    quantity: qty,
    reason,
    operator: session.email
  });

  return {
    success: true,
    inventory: result.inventory,
    defective: result.defective,
    ledger: result.ledger
  };
}
