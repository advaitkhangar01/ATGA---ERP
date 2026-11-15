'use server';

import { requireRole } from '../lib/auth';
import { scrapDefective as stockScrapDefective, restoreDefective as stockRestoreDefective } from '../lib/stock';

export async function scrapDefective(id: string, user = 'admin@atulglass.com') {
  await requireRole(['admin']);
  await stockScrapDefective({
    defectiveId: id,
    operator: user
  });
  return { success: true };
}

export async function restoreDefective(
  id: string,
  qty: number,
  user = 'staff@atulglass.com'
) {
  await requireRole(['admin', 'staff']);
  await stockRestoreDefective({
    defectiveId: id,
    quantity: qty,
    operator: user
  });
  return { success: true };
}
