'use server';

import { prisma } from '../lib/prisma';
import { requireRole } from '../lib/auth';
import { reconcileAuditAdjustment } from '../lib/stock';

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
  });
}

export async function getActiveAuditSession() {
  return await prisma.auditSession.findFirst({
    where: { status: 'in-progress' }
  });
}

export async function completeAuditSession(id: string) {
  return await prisma.auditSession.update({
    where: { id },
    data: { status: 'completed' }
  });
}

export async function reconcileAudit(
  sessionId: string,
  adjustments: AuditAdjustment[],
  user = 'admin@atulglass.com'
) {
  await requireRole(['admin']);

  return await prisma.$transaction(async (tx) => {
    const session = sessionId
      ? await tx.auditSession.findUnique({ where: { id: sessionId } })
      : null;
    const sessionName = session?.name || 'Cycle Count Audit';

    for (const adj of adjustments) {
      if (adj.actual === adj.expected) continue;
      const product = await tx.product.findUnique({ where: { sku: adj.sku } });
      if (!product) continue;

      await reconcileAuditAdjustment({
        productId: product.id,
        actualQty: adj.actual,
        expectedQty: adj.expected,
        sessionName,
        operator: user,
        tx
      });
    }

    if (sessionId) {
      await tx.auditSession.update({
        where: { id: sessionId },
        data: { status: 'completed', completedAt: new Date() }
      }).catch(() => {});
    }

    return { success: true };
  });
}
