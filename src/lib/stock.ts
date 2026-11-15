import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export class InsufficientStockError extends Error {
  constructor(message = 'Insufficient stock for this operation.') {
    super(message);
    this.name = 'InsufficientStockError';
  }
}

/**
 * Executes a callback within an existing Prisma transaction or initiates a new one.
 */
async function runInTransaction<T>(
  action: (tx: Prisma.TransactionClient) => Promise<T>,
  existingTx?: Prisma.TransactionClient
): Promise<T> {
  if (existingTx) {
    return action(existingTx);
  }
  return prisma.$transaction(async (tx) => {
    return action(tx);
  });
}

/**
 * Inward Stock Receipt: Increments goodQty and writes an IN ledger entry.
 */
export async function receiveStock({
  productId,
  quantity,
  vendor,
  remarks,
  operator = 'system',
  rackLocation = 'Main Warehouse',
  tx
}: {
  productId: string;
  quantity: number;
  vendor: string;
  remarks?: string;
  operator?: string;
  rackLocation?: string;
  tx?: Prisma.TransactionClient;
}) {
  if (quantity <= 0) {
    throw new Error('Received quantity must be greater than zero.');
  }

  return runInTransaction(async (client) => {
    const product = await client.product.findUnique({
      where: { id: productId }
    });
    if (!product) {
      throw new Error(`Product with ID "${productId}" not found.`);
    }

    const updatedInventory = await client.inventory.upsert({
      where: { productId },
      create: {
        productId,
        goodQty: quantity,
        defectiveQty: 0,
        rackLocation
      },
      update: {
        goodQty: { increment: quantity }
      }
    });

    const ledgerEntry = await client.ledger.create({
      data: {
        type: 'IN',
        quantity,
        brand: product.brand,
        shop: 'Nagpur Central Warehouse',
        user: operator,
        remarks: remarks || `Inward receipt from ${vendor}`,
        productId
      }
    });

    return {
      inventory: updatedInventory,
      ledger: ledgerEntry
    };
  }, tx);
}

/**
 * Outward Stock Dispatch: Conditional atomic decrement of goodQty and writes an OUT ledger entry.
 * Uses atomic update: UPDATE Inventory SET goodQty = goodQty - qty WHERE productId = $1 AND goodQty >= qty
 */
export async function issueStock({
  productId,
  quantity,
  customer,
  reason = 'Counter Sale',
  remarks,
  operator = 'system',
  tx
}: {
  productId: string;
  quantity: number;
  customer: string;
  reason?: string;
  remarks?: string;
  operator?: string;
  tx?: Prisma.TransactionClient;
}) {
  if (quantity <= 0) {
    throw new Error('Issued quantity must be greater than zero.');
  }

  return runInTransaction(async (client) => {
    const product = await client.product.findUnique({
      where: { id: productId }
    });
    if (!product) {
      throw new Error(`Product with ID "${productId}" not found.`);
    }

    // Atomic conditional decrement: count === 1 guarantees stock was available
    const updateResult = await client.inventory.updateMany({
      where: {
        productId,
        goodQty: { gte: quantity }
      },
      data: {
        goodQty: { decrement: quantity }
      }
    });

    if (updateResult.count !== 1) {
      throw new InsufficientStockError(
        `Insufficient good stock for SKU "${product.sku}". Requested: ${quantity} unit(s).`
      );
    }

    const updatedInventory = await client.inventory.findUniqueOrThrow({
      where: { productId }
    });

    const ledgerEntry = await client.ledger.create({
      data: {
        type: 'OUT',
        quantity,
        brand: product.brand,
        shop: 'Nagpur Central Warehouse',
        user: operator,
        remarks: `${reason}: ${customer}${remarks ? `. ${remarks}` : ''}`,
        productId
      }
    });

    return {
      inventory: updatedInventory,
      ledger: ledgerEntry
    };
  }, tx);
}

/**
 * Mark Glass as Defective: Atomically decrements goodQty, increments defectiveQty,
 * creates a pending Defective record, and logs DEFECTIVE_MARK.
 */
export async function quarantineDefective({
  productId,
  quantity,
  reason,
  operator = 'system',
  tx
}: {
  productId: string;
  quantity: number;
  reason: string;
  operator?: string;
  tx?: Prisma.TransactionClient;
}) {
  if (quantity <= 0) {
    throw new Error('Defective quantity must be greater than zero.');
  }

  return runInTransaction(async (client) => {
    const product = await client.product.findUnique({
      where: { id: productId }
    });
    if (!product) {
      throw new Error(`Product with ID "${productId}" not found.`);
    }

    // Atomic decrement from good stock
    const updateResult = await client.inventory.updateMany({
      where: {
        productId,
        goodQty: { gte: quantity }
      },
      data: {
        goodQty: { decrement: quantity },
        defectiveQty: { increment: quantity }
      }
    });

    if (updateResult.count !== 1) {
      throw new InsufficientStockError(
        `Cannot quarantine: insufficient good stock for SKU "${product.sku}".`
      );
    }

    const updatedInventory = await client.inventory.findUniqueOrThrow({
      where: { productId }
    });

    const defectiveRecord = await client.defective.create({
      data: {
        sku: product.sku,
        quantity,
        reason,
        status: 'pending'
      }
    });

    const ledgerEntry = await client.ledger.create({
      data: {
        type: 'DEFECTIVE_MARK',
        quantity,
        brand: product.brand,
        shop: 'Nagpur Central Warehouse',
        user: operator,
        remarks: `Quarantined as defective: ${reason}`,
        productId
      }
    });

    return {
      inventory: updatedInventory,
      defective: defectiveRecord,
      ledger: ledgerEntry
    };
  }, tx);
}

/**
 * Scrap Defective Glass: Confirms physical disposal, decrements defectiveQty,
 * marks Defective record scrapped, and logs DEFECTIVE_SCRAP.
 */
export async function scrapDefective({
  defectiveId,
  operator = 'admin@atulglass.com',
  tx
}: {
  defectiveId: string;
  operator?: string;
  tx?: Prisma.TransactionClient;
}) {
  return runInTransaction(async (client) => {
    const defective = await client.defective.findUnique({
      where: { id: defectiveId }
    });
    if (!defective) {
      throw new Error(`Defective record with ID "${defectiveId}" not found.`);
    }
    if (defective.status !== 'pending') {
      throw new Error(`Defective record is already ${defective.status}.`);
    }

    const product = await client.product.findUnique({
      where: { sku: defective.sku }
    });
    if (!product) {
      throw new Error(`Product with SKU "${defective.sku}" not found.`);
    }

    // Decrement defectiveQty
    const updatedInventory = await client.inventory.update({
      where: { productId: product.id },
      data: {
        defectiveQty: { decrement: defective.quantity }
      }
    });

    const updatedDefective = await client.defective.update({
      where: { id: defectiveId },
      data: {
        status: 'scrapped',
        resolvedAt: new Date(),
        resolvedBy: operator
      }
    });

    const ledgerEntry = await client.ledger.create({
      data: {
        type: 'DEFECTIVE_SCRAP',
        quantity: defective.quantity,
        brand: product.brand,
        shop: 'Nagpur Central Warehouse',
        user: operator,
        remarks: `Scrapped defective glass: ${defective.reason}`,
        productId: product.id
      }
    });

    return {
      inventory: updatedInventory,
      defective: updatedDefective,
      ledger: ledgerEntry
    };
  }, tx);
}

/**
 * Restore Quarantined Glass: Decrements defectiveQty, increments goodQty,
 * updates Defective record, and logs DEFECTIVE_RESTORE.
 */
export async function restoreDefective({
  defectiveId,
  quantity,
  operator = 'admin@atulglass.com',
  tx
}: {
  defectiveId: string;
  quantity: number;
  operator?: string;
  tx?: Prisma.TransactionClient;
}) {
  if (quantity <= 0) {
    throw new Error('Restored quantity must be greater than zero.');
  }

  return runInTransaction(async (client) => {
    const defective = await client.defective.findUnique({
      where: { id: defectiveId }
    });
    if (!defective) {
      throw new Error(`Defective record with ID "${defectiveId}" not found.`);
    }
    if (defective.status !== 'pending') {
      throw new Error(`Cannot restore defective item with status "${defective.status}".`);
    }
    if (quantity > defective.quantity) {
      throw new Error(`Cannot restore ${quantity} units; only ${defective.quantity} recorded.`);
    }

    const product = await client.product.findUnique({
      where: { sku: defective.sku }
    });
    if (!product) {
      throw new Error(`Product with SKU "${defective.sku}" not found.`);
    }

    const updatedInventory = await client.inventory.update({
      where: { productId: product.id },
      data: {
        defectiveQty: { decrement: quantity },
        goodQty: { increment: quantity }
      }
    });

    const isFullyRestored = quantity === defective.quantity;
    const updatedDefective = await client.defective.update({
      where: { id: defectiveId },
      data: {
        quantity: isFullyRestored ? defective.quantity : defective.quantity - quantity,
        status: isFullyRestored ? 'restored' : 'pending',
        resolvedAt: isFullyRestored ? new Date() : undefined,
        resolvedBy: isFullyRestored ? operator : undefined
      }
    });

    const ledgerEntry = await client.ledger.create({
      data: {
        type: 'DEFECTIVE_RESTORE',
        quantity,
        brand: product.brand,
        shop: 'Nagpur Central Warehouse',
        user: operator,
        remarks: `Restored ${quantity} units back to good inventory`,
        productId: product.id
      }
    });

    return {
      inventory: updatedInventory,
      defective: updatedDefective,
      ledger: ledgerEntry
    };
  }, tx);
}

/**
 * Reconcile Cycle Audit: Directly synchronizes goodQty with physical count and logs AUDIT_ADJUST.
 */
export async function reconcileAuditAdjustment({
  productId,
  actualQty,
  expectedQty,
  sessionName,
  operator = 'admin@atulglass.com',
  tx
}: {
  productId: string;
  actualQty: number;
  expectedQty: number;
  sessionName: string;
  operator?: string;
  tx?: Prisma.TransactionClient;
}) {
  const diff = actualQty - expectedQty;

  return runInTransaction(async (client) => {
    const product = await client.product.findUnique({
      where: { id: productId }
    });
    if (!product) {
      throw new Error(`Product with ID "${productId}" not found.`);
    }

    const updatedInventory = await client.inventory.upsert({
      where: { productId },
      create: {
        productId,
        goodQty: actualQty,
        defectiveQty: 0,
        rackLocation: 'Main Warehouse'
      },
      update: {
        goodQty: actualQty
      }
    });

    let ledgerEntry = null;
    if (diff !== 0) {
      ledgerEntry = await client.ledger.create({
        data: {
          type: 'AUDIT_ADJUST',
          quantity: Math.abs(diff),
          brand: product.brand,
          shop: 'Nagpur Central Warehouse',
          user: operator,
          remarks: `[${sessionName}] Audit adjustment: ${diff > 0 ? '+' : ''}${diff} units (counted ${actualQty}, expected ${expectedQty})`,
          productId
        }
      });
    }

    return {
      inventory: updatedInventory,
      ledger: ledgerEntry
    };
  }, tx);
}
