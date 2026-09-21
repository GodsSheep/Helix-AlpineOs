/**
 * HostKernelBridge.ts
 * Unified Linux Host Kernel & OS Synchronization Subsystem for Helix OS.
 * Manages bi-directional file synchronization, process inspection,
 * multi-OS profile data migration, hardware telemetry, and real shell execution.
 */

import { VirtualFileSystem } from './VFS';
import { Settings } from './Settings';
import { Toast } from './Toast';

export interface HostProcess {
  user: string;
  pid: number;
  cpu: number;
  mem: number;
  vsz: number;
  rss: number;
  tty: string;
  stat: string;
  start: string;
  time: string;
  command: string;
}

export interface HostDirItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  mtime: number;
}

export interface HostSystemMetrics {
  uptime: string;
  load: string;
  totalMem: number;
  freeMem: number;
  usedMem: number;
  timestamp: number;
}

export interface HostSystemInfo {
  platform: string;
  type: string;
  release: string;
  distro: string;
  distroId: string;
  arch: string;
  hostname: string;
  cpus: Array<{ model: string; speed: number }>;
  totalmem: number;
  freemem: number;
  usedmem: number;
  uptime: number;
  loadavg: number[];
  disk?: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  userInfo: {
    username: string;
    homedir: string;
    shell: string;
  };
  networkInterfaces: Record<string, any[]>;
  cwd: string;
}

export class HostKernelBridge {
  private static isAvailable: boolean | null = null;
  private static cachedInfo: HostSystemInfo | null = null;
  private static syncInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Check if host backend is responsive
   */
  public static async checkAvailability(): Promise<boolean> {
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        this.isAvailable = data.status === 'ok';
        return this.isAvailable;
      }
    } catch {
      this.isAvailable = false;
    }
    return false;
  }

  /**
   * Fetch complete real host system info
   */
  public static async getSystemInfo(): Promise<HostSystemInfo | null> {
    try {
      const res = await fetch('/api/system/info', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const info = (await res.json()) as HostSystemInfo;
        this.cachedInfo = info;
        this.isAvailable = true;
        return info;
      }
    } catch {
      this.isAvailable = false;
    }
    return this.cachedInfo;
  }

  /**
   * Fetch live system metrics
   */
  public static async getMetrics(): Promise<HostSystemMetrics | null> {
    try {
      const res = await fetch('/api/system-metrics', { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        return (await res.json()) as HostSystemMetrics;
      }
    } catch {}
    return null;
  }

  /**
   * Fetch active process list from host kernel
   */
  public static async getProcesses(): Promise<HostProcess[]> {
    try {
      const res = await fetch('/api/host/processes', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        return data.processes || [];
      }
    } catch {}
    return [];
  }

  /**
   * Send kill signal to host process
   */
  public static async killProcess(pid: number, signal: string = 'SIGTERM'): Promise<boolean> {
    try {
      const res = await fetch('/api/host/process/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid, signal }),
      });
      if (res.ok) {
        const data = await res.json();
        return Boolean(data.ok);
      }
    } catch {}
    return false;
  }

  /**
   * Auto synchronize and copy user data across OS profiles and host kernel storage
   */
  public static async syncUserData(
    osProfile: string,
    vfs: VirtualFileSystem,
    history: string[] = []
  ): Promise<boolean> {
    try {
      const allFiles = await vfs.list();
      const filesPayload: Array<{ path: string; content: string }> = [];

      for (const f of allFiles) {
        if (f.path) {
          try {
            const content = await vfs.read(f.path);
            filesPayload.push({
              path: f.path,
              content: content || '',
            });
          } catch {}
        }
      }

      const res = await fetch('/api/host/sync-user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          osProfile,
          files: filesPayload,
          settings: Settings.get(),
          history,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return Boolean(data.success);
      }
    } catch (err) {
      console.warn('[HostKernelBridge] User data sync warning:', err);
    }
    return false;
  }

  /**
   * Restore user data and files from host shared / profile storage into active VFS
   */
  public static async restoreUserData(
    osProfile: string,
    vfs: VirtualFileSystem
  ): Promise<{ restored: number; settingsRestored: boolean }> {
    try {
      const res = await fetch(`/api/host/user-data/${encodeURIComponent(osProfile)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.found && Array.isArray(data.files)) {
          let count = 0;
          for (const f of data.files) {
            if (f.path && typeof f.content === 'string') {
              await vfs.write(f.path, f.content);
              count++;
            }
          }
          if (data.settings) {
            Settings.update(data.settings);
          }
          return { restored: count, settingsRestored: Boolean(data.settings) };
        }
      }
    } catch (err) {
      console.warn('[HostKernelBridge] User data restore warning:', err);
    }
    return { restored: 0, settingsRestored: false };
  }

  /**
   * Push all current VFS files to host workspace
   */
  public static async pushVfsToHost(vfs: VirtualFileSystem): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
    try {
      const allFiles = await vfs.list();
      const files: Array<{ path: string; content: string }> = [];

      for (const file of allFiles) {
        if (file.path) {
          const content = await vfs.read(file.path);
          files.push({
            path: file.path.replace(/^\/+/, ''),
            content: content || '',
          });
        }
      }

      const res = await fetch('/api/vfs/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        return Boolean(data?.success);
      }
    } catch {}
    return false;
  }

  /**
   * Pull files from host workspace into VFS
   */
  public static async pullHostToVfs(vfs: VirtualFileSystem, paths: string[]): Promise<number> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;
    try {
      const res = await fetch('/api/vfs/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && Array.isArray(data.files)) {
          let count = 0;
          for (const f of data.files) {
            if (f && f.path && typeof f.content === 'string') {
              await vfs.write(f.path.startsWith('/') ? f.path : `/${f.path}`, f.content);
              count++;
            }
          }
          return count;
        }
      }
    } catch {}
    return 0;
  }

  /**
   * List files in host directory
   */
  public static async listHostDir(dirPath?: string): Promise<{ cwd: string; items: HostDirItem[] } | null> {
    try {
      const res = await fetch('/api/host/fs/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirPath }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return null;
  }

  /**
   * Read file directly from host filesystem
   */
  public static async readHostFile(filePath: string): Promise<string | null> {
    try {
      const res = await fetch('/api/host/fs/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.content || '';
      }
    } catch {}
    return null;
  }

  /**
   * Write file directly to host filesystem
   */
  public static async writeHostFile(filePath: string, content: string): Promise<boolean> {
    try {
      const res = await fetch('/api/host/fs/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, content }),
      });
      if (res.ok) {
        const data = await res.json();
        return Boolean(data.ok);
      }
    } catch {}
    return false;
  }

  /**
   * Delete file/dir directly on host filesystem
   */
  public static async deleteHostFile(filePath: string): Promise<boolean> {
    try {
      const res = await fetch('/api/host/fs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      if (res.ok) {
        const data = await res.json();
        return Boolean(data.ok);
      }
    } catch {}
    return false;
  }

  /**
   * Query packages installed on the host
   */
  public static async getHostPackages(): Promise<{ packageManager: string; packages: string[]; installedCount: number }> {
    try {
      const res = await fetch('/api/host/packages/list');
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return { packageManager: 'simulated', packages: [], installedCount: 0 };
  }

  /**
   * Ping a network host through host kernel
   */
  public static async ping(host: string = '8.8.8.8'): Promise<{ ok: boolean; avgMs: number; stdout: string }> {
    try {
      const res = await fetch('/api/host/network/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return { ok: false, avgMs: 0, stdout: 'Network unreachable' };
  }

  /**
   * Start auto-sync background timer that keeps VFS & Host in sync every 15s
   */
  public static startAutoSync(vfs: VirtualFileSystem, currentProfile: string = 'alpine'): () => void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncUserData(currentProfile, vfs).catch(() => {});
    }, 15000);

    return () => {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    };
  }
}
