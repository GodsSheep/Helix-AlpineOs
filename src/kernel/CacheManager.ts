import { SystemLogger } from './Logger';

export class CacheManager {
  constructor(private logger: SystemLogger) {}
  
  async set(key: string, data: string): Promise<void> {
    try {
      const cache = await caches.open('helix-offline-cache');
      await cache.put(`/cache/${key}`, new Response(data));
      this.logger.log('VFS', 'debug', `Cached data: ${key}`);
    } catch (e) {
      this.logger.log('VFS', 'warn', `Cache put failed: ${key}`);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const cache = await caches.open('helix-offline-cache');
      const res = await cache.match(`/cache/${key}`);
      if (res) return res.text();
    } catch {}
    return null;
  }

  async clear(): Promise<void> {
    try {
      await caches.delete('helix-offline-cache');
      this.logger.log('VFS', 'info', `Offline cache cleared`);
    } catch (e) {}
  }
}
