import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['warn', 'error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Optimize SQLite for concurrent access
async function initSqlitePragmas() {
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;')
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;')
    await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;')
  } catch {
    // If running against PostgreSQL or non-SQLite, ignore
  }
}
initSqlitePragmas().catch(() => {})

export async function withTransactionRetry<T>(
  action: () => Promise<T>,
  retries = 3,
  delayMs = 80
): Promise<T> {
  let attempt = 0
  while (true) {
    try {
      return await action()
    } catch (err: any) {
      attempt++
      const msg = err?.message || String(err)
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
