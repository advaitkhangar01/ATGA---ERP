import { loginAction, verifySession } from './src/actions/auth';
import { prisma } from './src/lib/prisma';

async function testAuth() {
  console.log('--- Testing Authentication & Authorization ---');
  
  // 1. Wrong password
  const failResult = await loginAction('admin@atulglass.com', 'wrongpassword');
  if (failResult.success) {
    throw new Error('Login should have failed with wrong password');
  }
  console.log('Correctly rejected invalid password');

  // 2. Correct admin password
  const okResult = await loginAction('admin@atulglass.com', 'Admin@123');
  if (!okResult.success || okResult.user?.role !== 'admin') {
    throw new Error(`Valid admin credentials failed to authenticate: ${JSON.stringify(okResult)}`);
  }
  console.log('Successfully authenticated admin:', okResult.user);

  // 3. Correct staff password
  const staffResult = await loginAction('staff@atulglass.com', 'Staff@123');
  if (!staffResult.success || staffResult.user?.role !== 'staff') {
    throw new Error(`Valid staff credentials failed to authenticate: ${JSON.stringify(staffResult)}`);
  }
  console.log('Successfully authenticated staff:', staffResult.user);

  console.log('✅ Auth test passed.');
}

testAuth()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
