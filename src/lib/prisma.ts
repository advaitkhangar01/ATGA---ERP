import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['warn', 'error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function withTransactionRetry<T>(
  action: () => Promise<T>,
  retries = 3,
  delayMs = 80
): Promise<T> {
  let attempt = 0
  while (true) {
    try {
      return await action()
    } catch (err: unknown) {
      attempt++
      const msg = err instanceof Error ? err.message : String(err)
      const isLockContention =
        msg.includes('Transaction already closed') ||
        msg.includes('database is locked') ||
        msg.includes('timed out') ||
        msg.includes('SQLITE_BUSY')

      if (isLockContention && attempt <= retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * Math.pow(2, attempt - 1) + Math.random() * 20)
        )
        continue
      }
      throw err
    }
  }
}
