'use server'

import { prisma } from '../lib/prisma'
import { requireRole } from '../lib/auth'

export interface AuditAdjustment {
  sku: string;
  actual: number;
  expected: number;
}

export async function startAuditSession(name: string) {
  return await prisma.auditSession.create({
    data: {
      name,
      status: 'in-progress'
    }
  })
}

export async function getActiveAuditSession() {
  return await prisma.auditSession.findFirst({
    where: { status: 'in-progress' }
  })
}

export async function completeAuditSession(id: string) {
  return await prisma.auditSession.update({
    where: { id },
    data: { status: 'completed' }
  })
}

export async function reconcileAudit(
  sessionId: string,
  adjustments: AuditAdjustment[],
  user = 'admin@atulglass.com',
  shop = 'Main Warehouse'
) {
  await requireRole(['admin']);
  return await prisma.$transaction(async (tx) => {
    for (const adj of adjustments) {
      if (adj.actual === adj.expected) continue;
      const product = await tx.product.findUnique({ where: { sku: adj.sku } });
      if (!product) continue;

      const diff = adj.actual - adj.expected;
      await tx.inventory.upsert({
        where: { productId: product.id },
        create: {
          productId: product.id,
          goodQty: adj.actual,
          defectiveQty: 0,
          rackLocation: 'Main Warehouse'
        },
        update: {
          goodQty: adj.actual
        }
      });

      await tx.ledger.create({
        data: {
          type: 'AUDIT_ADJUST',
          quantity: Math.abs(diff),
          brand: product.brand,
          shop,
          user,
          remarks: `Audit Adjustment: ${diff > 0 ? '+' : ''}${diff} units (counted ${adj.actual}, expected ${adj.expected})`,
          productId: product.id
        }
      });
    }

    if (sessionId) {
      await tx.auditSession.update({
        where: { id: sessionId },
        data: { status: 'completed' }
      }).catch(() => {});
    }

    return { success: true };
  });
}
