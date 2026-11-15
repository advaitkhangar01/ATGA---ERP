'use server';

import { cookies } from 'next/headers';
import { prisma } from '../lib/prisma';
import {
  hashPassword,
  verifyPassword,
  createSignedToken,
  verifySession as libVerifySession
} from '../lib/auth';

// In-memory sliding window rate limiter for login attempts (5 failures per 15 minutes)
interface AttemptRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minute lockout

function checkRateLimit(key: string): { allowed: boolean; remainingSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) {
    return { allowed: true };
  }

  // Check if currently locked out
  if (record.blockedUntil && record.blockedUntil > now) {
    const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingSeconds };
  }

  // Reset window if expired
  if (now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + LOCKOUT_MS;
    return { allowed: false, remainingSeconds: Math.ceil(LOCKOUT_MS / 1000) };
  }

  return { allowed: true };
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
    if (record.count >= MAX_ATTEMPTS) {
      record.blockedUntil = now + LOCKOUT_MS;
    }
  }
}

function clearRateLimit(key: string) {
  loginAttempts.delete(key);
}

export async function resetRateLimiter() {
  loginAttempts.clear();
}

export async function ensureSeedUsers() {
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@atulglass.com' } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: 'admin@atulglass.com',
        role: 'admin',
        name: 'Atul Gupta',
        password: hashPassword('Admin@123')
      }
    });
  }

  const staffExists = await prisma.user.findUnique({ where: { email: 'staff@atulglass.com' } });
  if (!staffExists) {
    await prisma.user.create({
      data: {
        email: 'staff@atulglass.com',
        role: 'staff',
        name: 'Ramesh Kumar',
        password: hashPassword('Staff@123')
      }
    });
  }
}

export async function loginAction(
  email: string,
  password: string
): Promise<{
  success: boolean;
  user?: { email: string; role: string };
  error?: string;
}> {
  await ensureSeedUsers();

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check rate limit
  const rateLimit = checkRateLimit(normalizedEmail);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many failed login attempts. Please wait ${rateLimit.remainingSeconds} seconds before trying again.`
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    recordFailedAttempt(normalizedEmail);
    return { success: false, error: 'Invalid email or password.' };
  }

  const isValid = verifyPassword(password, user.password);
  if (!isValid) {
    recordFailedAttempt(normalizedEmail);
    return { success: false, error: 'Invalid email or password.' };
  }

  // Clear rate limiter on successful authentication
  clearRateLimit(normalizedEmail);

  const token = createSignedToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  try {
    const cookieStore = await cookies();
    cookieStore.set('session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days in seconds
    });
  } catch {
    // Handled when called outside of Next request context (e.g. CLI runner)
  }

  return {
    success: true,
    user: {
      email: user.email,
      role: user.role
    }
  };
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session-token');
  } catch {}
  return { success: true };
}

export async function verifySession() {
  return await libVerifySession();
}
