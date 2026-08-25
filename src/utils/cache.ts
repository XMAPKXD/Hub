/**
 * PKXD Central - Local Browser Cache Engine
 * Provides instant 0-second page hydration, offline support, and background Firestore revalidation.
 * Only caches real content from the website and user database.
 */

const CACHE_PREFIX = 'pkxd_cache_';

export function loadFromCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key) || localStorage.getItem(key);
    if (!raw || raw === 'undefined' || raw === 'null') {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any previous dummy/placeholder items with default IDs
      const cleanList = parsed.filter((item: any) => {
        if (!item || typeof item !== 'object') return false;
        const id = String(item.id || '');
        if (id.startsWith('vid_default_') || id.startsWith('art_default_')) {
          return false;
        }
        return true;
      });
      return cleanList as unknown as T;
    }
    return parsed !== null && parsed !== undefined ? (parsed as T) : fallback;
  } catch (err) {
    console.warn(`[PKXD Cache] Could not load key "${key}":`, err);
    return fallback;
  }
}

export function saveToCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(CACHE_PREFIX + key, serialized);
    localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn(`[PKXD Cache] Could not persist key "${key}":`, err);
  }
}

export function clearCacheKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
    localStorage.removeItem(key);
  } catch (err) {}
}
