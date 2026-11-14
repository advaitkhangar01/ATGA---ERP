'use server'

import { cookies } from 'next/headers'
import { prisma } from '../lib/prisma'
import { hashPassword, verifyPassword, createSignedToken, verifySession as libVerifySession } from '../lib/auth'

export async function ensureSeedUsers() {
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@atulglass.com' } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: 'admin@atulglass.com',
        role: 'admin',
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
        password: hashPassword('Staff@123')
      }
    });
  }
}

export async function loginAction(email: string, password: string): Promise<{
  success: boolean;
  user?: { email: string; role: string };
  error?: string;
}> {
  await ensureSeedUsers();

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() }
  });

  if (!user) {
    return { success: false, error: 'Invalid email or password.' };
  }

  const isValid = verifyPassword(password, user.password);
  if (!isValid) {
    return { success: false, error: 'Invalid email or password.' };
  }

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
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    cookieStore.set('user-role', user.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
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
    cookieStore.delete('user-role');
  } catch {}
  return { success: true };
}

export async function verifySession() {
  return await libVerifySession();
}
