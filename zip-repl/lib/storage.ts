// RJ-APP/lib/storage.ts
// Cross-platform key/value storage for Supabase session persistence.
//
// Native: expo-secure-store with chunking.
//         SecureStore caps each item at ~2 KB, so large Supabase tokens are
//         split into 1800-byte chunks.
//
//         Metadata format (stored under "<key>__meta"):
//           JSON: { ver: string, count: number }
//         Chunk keys: "<key>__<ver>__chunk_<i>"
//
//         Write strategy: write all new chunks under a NEW version prefix
//         BEFORE flipping the metadata. A concurrent reader always sees either
//         old-version chunks (old meta) or new-version chunks (new meta) —
//         never a partial mix. Old chunks are deleted after the flip.
//
// Web:    localStorage (fine for Expo Web / dev).

import { Platform } from 'react-native';

type Storage = {
  getItem:    (key: string) => Promise<string | null>;
  setItem:    (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const CHUNK_SIZE = 1800; // bytes, safely under the 2048-byte SecureStore limit

// ─── Versioned metadata ───────────────────────────────────────────────────────
type Meta = { ver: string; count: number };

function parseMeta(raw: string): Meta | null {
  try {
    const m = JSON.parse(raw);
    if (typeof m.ver === 'string' && typeof m.count === 'number' && !isNaN(m.count)) return m;
  } catch {}
  // Legacy: plain integer string (e.g. "3")
  const n = parseInt(raw, 10);
  if (!isNaN(n)) return { ver: 'legacy', count: n };
  return null;
}

function chunkKey(key: string, ver: string, i: number): string {
  return ver === 'legacy' ? `${key}__chunk_${i}` : `${key}__${ver}__chunk_${i}`;
}

// ─── Secure-store helpers ─────────────────────────────────────────────────────
async function secureGet(key: string): Promise<string | null> {
  const SecureStore = await import('expo-secure-store');

  const metaRaw = await SecureStore.getItemAsync(`${key}__meta`);
  if (metaRaw !== null) {
    const meta = parseMeta(metaRaw);
    if (!meta) return null;
    const parts: string[] = [];
    for (let i = 0; i < meta.count; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, meta.ver, i));
      if (part === null) return null; // incomplete — treat as missing
      parts.push(part);
    }
    return parts.join('');
  }

  // Legacy: metadata stored under "<key>__chunks"
  const legacyMeta = await SecureStore.getItemAsync(`${key}__chunks`);
  if (legacyMeta !== null) {
    const meta = parseMeta(legacyMeta);
    if (!meta) return null;
    const parts: string[] = [];
    for (let i = 0; i < meta.count; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, 'legacy', i));
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  }

  // Single-chunk (small) value — no meta key needed
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  const SecureStore = await import('expo-secure-store');

  if (value.length <= CHUNK_SIZE) {
    // Read old meta BEFORE overwriting so we can clean up after.
    const oldMetaRaw = await SecureStore.getItemAsync(`${key}__meta`)
      ?? await SecureStore.getItemAsync(`${key}__chunks`);

    // Write new single value — always readable from this point on.
    await SecureStore.setItemAsync(key, value);

    // Clean up any old chunked data now that the plain key is authoritative.
    if (oldMetaRaw !== null) {
      const oldMeta = parseMeta(oldMetaRaw);
      if (oldMeta) {
        for (let i = 0; i < oldMeta.count; i++) {
          await SecureStore.deleteItemAsync(chunkKey(key, oldMeta.ver, i));
        }
      }
      await SecureStore.deleteItemAsync(`${key}__meta`);
      await SecureStore.deleteItemAsync(`${key}__chunks`); // legacy
    }
    return;
  }

  // Chunked path — use a new version token for this write.
  const newVer = Date.now().toString(36);
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }

  // 1. Read old meta so we can delete those chunks AFTER the flip.
  const oldMetaRaw = await SecureStore.getItemAsync(`${key}__meta`)
    ?? await SecureStore.getItemAsync(`${key}__chunks`);
  const oldMeta = oldMetaRaw !== null ? parseMeta(oldMetaRaw) : null;

  // 2. Write all new chunks under the NEW version prefix.
  //    Old chunks (different prefix) are still fully readable via old meta.
  for (let i = 0; i < chunks.length; i++) {
    await SecureStore.setItemAsync(chunkKey(key, newVer, i), chunks[i]);
  }

  // 3. Flip metadata to the new version — readers now use new chunks.
  const newMeta: Meta = { ver: newVer, count: chunks.length };
  await SecureStore.setItemAsync(`${key}__meta`, JSON.stringify(newMeta));

  // 4. Delete old chunks and stale keys — safe because readers use new meta now.
  if (oldMeta) {
    for (let i = 0; i < oldMeta.count; i++) {
      await SecureStore.deleteItemAsync(chunkKey(key, oldMeta.ver, i));
    }
  }
  await SecureStore.deleteItemAsync(`${key}__chunks`); // legacy meta key
  await SecureStore.deleteItemAsync(key);              // legacy plain key
}

async function secureRemove(key: string): Promise<void> {
  const SecureStore = await import('expo-secure-store');

  // Remove versioned chunks
  const metaRaw = await SecureStore.getItemAsync(`${key}__meta`)
    ?? await SecureStore.getItemAsync(`${key}__chunks`);
  if (metaRaw !== null) {
    const meta = parseMeta(metaRaw);
    if (meta) {
      for (let i = 0; i < meta.count; i++) {
        await SecureStore.deleteItemAsync(chunkKey(key, meta.ver, i));
      }
    }
    await SecureStore.deleteItemAsync(`${key}__meta`);
    await SecureStore.deleteItemAsync(`${key}__chunks`);
  }

  // Remove plain key (single-chunk or legacy)
  await SecureStore.deleteItemAsync(key);
}

// ─── Web fallback ─────────────────────────────────────────────────────────────
const webStorage: Storage = {
  getItem:    async (k) => { try { return globalThis.localStorage?.getItem(k) ?? null; } catch { return null; } },
  setItem:    async (k, v) => { try { globalThis.localStorage?.setItem(k, v); } catch { /* quota */ } },
  removeItem: async (k) => { try { globalThis.localStorage?.removeItem(k); } catch {} },
};

// ─── Native secure storage ────────────────────────────────────────────────────
const nativeStorage: Storage = {
  getItem:    (k) => secureGet(k),
  setItem:    (k, v) => secureSet(k, v),
  removeItem: (k) => secureRemove(k),
};

export const storage: Storage = Platform.OS === 'web' ? webStorage : nativeStorage;
