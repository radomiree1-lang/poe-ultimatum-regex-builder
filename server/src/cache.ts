import { CacheEntry } from './types.js';

export class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlMinutes: number = 20) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  get(key: string): { data: T; fetchedAt: number; ageSeconds: number } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const ageMs = now - entry.fetchedAt;

    if (ageMs > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return {
      data: entry.data,
      fetchedAt: entry.fetchedAt,
      ageSeconds: Math.floor(ageMs / 1000),
    };
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      fetchedAt: Date.now(),
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
