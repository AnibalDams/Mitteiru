/**
 * Caché TTL en memoria, acotada y con limpieza perezosa.
 *
 * Suficiente para una instancia única del backend y para reducir golpes a las
 * fuentes externas. No pretende ser distribuida: si algún día se escala a
 * varias instancias, se reemplaza por Redis detrás de esta misma interfaz.
 */

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

export class TtlCache {
  private readonly store = new Map<string, CacheEntry>();
  private readonly maxEntries: number;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (ttlMs <= 0) return;
    if (this.store.size >= this.maxEntries) {
      this.evict();
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private evict(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
    // Si sigue lleno, eliminamos las entradas más antiguas (orden de inserción).
    while (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next();
      if (oldest.done) break;
      this.store.delete(oldest.value);
    }
  }
}

export const sourceCache = new TtlCache(400);
