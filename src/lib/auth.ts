import crypto from 'crypto'
import { cookies } from 'next/headers'

const SECRET_KEY = process.env.SESSION_SECRET || 'atul-glass-erp-secret-key-2026'

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, key] = stored.split(':')
    if (!salt || !key) return false
    const keyBuffer = Buffer.from(key, 'hex')
    const derivedKey = crypto.scryptSync(password, salt, 64)
    return crypto.timingSafeEqual(keyBuffer, derivedKey)
  } catch {
    return false
  }
}

export function createSignedToken(payload: { id: string; email: string; role: string }): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('base64url')
  return `${data}.${signature}`
}

export function verifySignedToken(token: string): { id: string; email: string; role: string } | null {
  try {
    const [data, signature] = token.split('.')
    if (!data || !signature) return null
    const expected = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('base64url')
    if (signature !== expected) return null
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

export async function verifySession(): Promise<{ id: string; email: string; role: string } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session-token')?.value
    if (!token) return null
    return verifySignedToken(token)
  } catch {
    // When called outside Next request context (e.g., in node CLI scripts)
    return null
  }
}

export async function requireRole(allowedRoles: string[]): Promise<{ id: string; email: string; role: string }> {
  const session = await verifySession()
  // In development CLI / test runner without request cookies, allow bypass if explicitly flagged or fallback
  if (!session) {
    if (process.env.NODE_ENV === 'test' || !process.env.NEXT_RUNTIME) {
      return { id: 'test-admin', email: 'admin@atulglass.com', role: 'admin' }
    }
    throw new Error('Authentication required: please log in.')
  }

  if (!allowedRoles.includes(session.role)) {
    throw new Error(`Unauthorized: role '${session.role}' is not allowed to perform this operation.`)
  }

  return session
}
