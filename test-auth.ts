import { loginAction, resetRateLimiter } from './src/actions/auth';
import { createSignedToken, verifySignedToken, verifyPassword, hashPassword } from './src/lib/auth';
import { prisma } from './src/lib/prisma';

async function testAuth() {
  console.log('=== RUNNING AUTHENTICATION & SECURITY TEST SUITE ===');

  await resetRateLimiter();

  // 1. Password Hashing & Constant-Time Verification
  const testPass = 'SecretAtulPass#2026';
  const hashed = hashPassword(testPass);
  if (!verifyPassword(testPass, hashed)) {
    throw new Error('Password verification failed on valid password.');
  }
  if (verifyPassword('WrongPass', hashed)) {
    throw new Error('Password verification succeeded on invalid password.');
  }
  console.log('✅ Password hash & scrypt timing-safe verification verified.');

  // 2. Token Expiration Verification
  const expiredTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour in the past
  const expiredToken = createSignedToken({
    id: 'usr-1',
    email: 'admin@atulglass.com',
    role: 'admin',
    exp: expiredTimestamp
  });
  const verifiedExpired = verifySignedToken(expiredToken);
  if (verifiedExpired !== null) {
    throw new Error('Expired token was unexpectedly accepted!');
  }
  console.log('✅ Expired session token correctly rejected.');

  // 3. Token Tampering Verification
  const validToken = createSignedToken({
    id: 'usr-2',
    email: 'staff@atulglass.com',
    role: 'staff'
  });
  const [dataPart] = validToken.split('.');
  const forgedToken = `${dataPart}.tampered_signature_bytes_12345`;
  const verifiedForged = verifySignedToken(forgedToken);
  if (verifiedForged !== null) {
    throw new Error('Forged signature token was unexpectedly accepted!');
  }
  console.log('✅ Tampered token signature correctly rejected.');

  // 4. Rate Limiting Test (Brute-force protection: max 5 failed attempts)
  console.log('Testing login rate throttling (5 failed attempts)...');
  const targetEmail = 'brute-target@atulglass.com';
  for (let i = 1; i <= 5; i++) {
    const res = await loginAction(targetEmail, `wrong_guess_${i}`);
    if (res.success) throw new Error('Failed attempt should not succeed.');
  }

  // 6th attempt should be blocked by rate limiter
  const blockedAttempt = await loginAction(targetEmail, 'wrong_guess_6');
  if (blockedAttempt.success || !blockedAttempt.error?.includes('Too many failed login attempts')) {
    throw new Error(`Expected rate limit lockout on 6th attempt, but got: ${JSON.stringify(blockedAttempt)}`);
  }
  console.log('✅ Rate limiter successfully locked out brute-force attempts on 6th failure.');

  // 5. Valid Credentials Login
  await resetRateLimiter();
  const adminOk = await loginAction('admin@atulglass.com', 'Admin@123');
  if (!adminOk.success || adminOk.user?.role !== 'admin') {
    throw new Error(`Admin login failed: ${JSON.stringify(adminOk)}`);
  }
  console.log(`✅ Admin authenticated successfully: ${adminOk.user.email} (${adminOk.user.role})`);

  const staffOk = await loginAction('staff@atulglass.com', 'Staff@123');
  if (!staffOk.success || staffOk.user?.role !== 'staff') {
    throw new Error(`Staff login failed: ${JSON.stringify(staffOk)}`);
  }
  console.log(`✅ Staff authenticated successfully: ${staffOk.user.email} (${staffOk.user.role})`);

  console.log('✅ ALL AUTHENTICATION & SECURITY TESTS PASSED.');
}

testAuth()
  .catch((e) => {
    console.error('❌ Auth test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
