import { VirtualFileSystem } from './VFS';

export class ConfigManager {
  constructor(private vfs: VirtualFileSystem) {}
  
  async get(key: string, defaultValue: any = null) {
    try {
      const data = await this.vfs.read(`/etc/helix/config.json`);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed[key] !== undefined ? parsed[key] : defaultValue;
      }
    } catch {}
    return defaultValue;
  }
  
  async set(key: string, value: any) {
    try {
      let config: any = {};
      const data = await this.vfs.read(`/etc/helix/config.json`);
      if (data) config = JSON.parse(data);
      config[key] = value;
      
      // Ensure dir exists (simplified)
      await this.vfs.write(`/etc/helix/config.json`, JSON.stringify(config, null, 2));
    } catch (e) {
      console.error('Failed to set config', e);
    }
  }
}
