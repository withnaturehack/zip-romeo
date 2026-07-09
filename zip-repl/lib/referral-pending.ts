import { storage } from './storage';

const KEY = 'rj-pending-referral';

export async function setPendingReferral(code: string | null | undefined): Promise<void> {
  const trimmed = code?.toUpperCase().trim();
  if (trimmed) await storage.setItem(KEY, trimmed);
  else await storage.removeItem(KEY);
}

export async function getPendingReferral(): Promise<string | null> {
  const value = await storage.getItem(KEY);
  return value?.toUpperCase().trim() || null;
}

export async function clearPendingReferral(): Promise<void> {
  await storage.removeItem(KEY);
}
