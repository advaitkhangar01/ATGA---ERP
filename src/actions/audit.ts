'use server'

import { prisma } from '../lib/prisma'

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
