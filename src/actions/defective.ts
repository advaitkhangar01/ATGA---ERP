'use server'

import { prisma } from '../lib/prisma'

export async function scrapDefective(id: string, user = 'admin@atulglass.com', shop = 'Main Warehouse') {
  return await prisma.$transaction(async (tx) => {
    const def = await tx.defective.findUnique({ where: { id } });
    if (!def) throw new Error(`Defective record with ID ${id} not found.`);

    await tx.defective.update({
      where: { id },
      data: { status: 'scrapped' }
    });

    const product = await tx.product.findUnique({ where: { sku: def.sku } });
    if (product) {
      await tx.inventory.update({
        where: { productId: product.id },
        data: {
          defectiveQty: { decrement: def.quantity }
        }
      });

      await tx.ledger.create({
        data: {
          type: 'DEFECTIVE_SCRAP',
          quantity: def.quantity,
          brand: product.brand,
          shop,
          user,
          remarks: `Scrapped defective unit: ${def.reason}`,
          productId: product.id
        }
      });
    }

    return { success: true };
  });
}

export async function restoreDefective(id: string, qty: number, user = 'staff@atulglass.com', shop = 'Main Warehouse') {
  return await prisma.$transaction(async (tx) => {
    const def = await tx.defective.findUnique({ where: { id } });
    if (!def) throw new Error(`Defective record with ID ${id} not found.`);
    if (def.quantity < qty) throw new Error(`Cannot restore ${qty} units; only ${def.quantity} available.`);

    const remaining = def.quantity - qty;
    await tx.defective.update({
      where: { id },
      data: {
        quantity: remaining,
        status: remaining === 0 ? 'restored' : def.status
      }
    });

    const product = await tx.product.findUnique({ where: { sku: def.sku } });
    if (product) {
      await tx.inventory.update({
        where: { productId: product.id },
        data: {
          defectiveQty: { decrement: qty },
          goodQty: { increment: qty }
        }
      });

      await tx.ledger.create({
        data: {
          type: 'DEFECTIVE_RESTORE',
          quantity: qty,
          brand: product.brand,
          shop,
          user,
          remarks: `Restored ${qty} defective units back to inventory`,
          productId: product.id
        }
      });
    }

    return { success: true };
  });
}
