import { Kernel } from './index';
import { Toast } from './Toast';
import { SoundManager } from './SoundManager';
import { HelixAiCopilot } from './HelixAiCopilot';
import { AppId } from './types';

export interface HelixUser {
  username: string;
  uid: number;
  home: string;
  role: 'root' | 'developer' | 'guest';
}

export class HelixSDK {
  private static currentUser: HelixUser = {
    username: 'root',
    uid: 0,
    home: '/root',
    role: 'root'
  };

  private static ipcListeners: Map<string, Array<(data: any) => void>> = new Map();

  /**
   * Virtual File System API (inspired by puter.fs & OS.js VFS)
   */
  public static fs = {
    read: async (path: string): Promise<string | null> => {
      return Kernel.vfs.read(path);
    },
    write: async (path: string, content: string): Promise<void> => {
      return Kernel.vfs.write(path, content);
    },
    mkdir: async (path: string): Promise<void> => {
      return Kernel.vfs.mkdir(path);
    },
    readdir: async (dirPath: string = '/'): Promise<string[]> => {
      const allFiles = await Kernel.vfs.list();
      const normDir = dirPath.endsWith('/') ? dirPath : dirPath + '/';
      const items = allFiles
        .filter(f => f.path.startsWith(normDir) || (normDir === '/' && f.path.startsWith('/')))
        .map(f => f.path);
      return items;
    },
    unlink: async (path: string): Promise<void> => {
      return Kernel.vfs.delete(path);
    },
    exists: async (path: string): Promise<boolean> => {
      const res = await Kernel.vfs.read(path);
      return res !== null;
    },
    stat: async (path: string) => {
      const content = await Kernel.vfs.read(path);
      if (content === null) return null;
      return {
        path: path,
        size: content.length,
        mtime: Date.now(),
        isFile: true
      };
    }
  };

  /**
   * Key-Value Data Store API (inspired by puter.kv)
   */
  public static kv = {
    get: async (key: string): Promise<string | null> => {
      try {
        return localStorage.getItem(`helix_kv_${key}`);
      } catch {
        return null;
      }
    },
    set: async (key: string, value: string): Promise<void> => {
      try {
        localStorage.setItem(`helix_kv_${key}`, value);
      } catch (e) {
        console.warn('Helix KV storage write failed', e);
      }
    },
    delete: async (key: string): Promise<void> => {
      try {
        localStorage.removeItem(`helix_kv_${key}`);
      } catch {}
    },
    list: async (): Promise<string[]> => {
      const keys: string[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('helix_kv_')) {
            keys.push(k.replace('helix_kv_', ''));
          }
        }
      } catch {}
      return keys;
    }
  };

  /**
   * AI & Copilot API (inspired by puter.ai)
   */
  public static ai = {
    chat: async (prompt: string): Promise<string> => {
      return HelixAiCopilot.generateResponse(prompt);
    },
    completeCode: async (codePrefix: string, lang: string = 'typescript'): Promise<string> => {
      return HelixAiCopilot.generateResponse(`Generate ${lang} code starting with: ${codePrefix}`);
    }
  };

  /**
   * UI & Window Management API (inspired by OS.js Application API & puter.ui)
   */
  public static ui = {
    toast: (message: string, icon?: string): void => {
      Toast.show(message, icon || '🚀');
    },
    playSound: (soundName: Parameters<typeof SoundManager.play>[0]): void => {
      SoundManager.play(soundName);
    },
    launchApp: (appId: AppId, args?: Record<string, unknown>): void => {
      Kernel.wm.launch(appId, args);
    },
    closeApp: (windowId: string): void => {
      Kernel.wm.close(windowId);
    },
    minimizeApp: (windowId: string): void => {
      Kernel.wm.minimize(windowId);
    },
    toggleMaximize: (windowId: string): void => {
      Kernel.wm.toggleMaximize(windowId);
    }
  };

  /**
   * Authentication & User Identity API (inspired by puter.auth)
   */
  public static auth = {
    getUser: (): HelixUser => {
      return { ...HelixSDK.currentUser };
    },
    isSignedIn: (): boolean => {
      return true;
    }
  };

  /**
   * Inter-Process Communication (IPC) & System Telemetry API (inspired by OS.js Core Events)
   */
  public static ipc = {
    send: (channel: string, payload: any): void => {
      const listeners = HelixSDK.ipcListeners.get(channel) || [];
      listeners.forEach(fn => {
        try {
          fn(payload);
        } catch (err) {
          console.error(`Error in IPC listener on channel ${channel}:`, err);
        }
      });
    },
    on: (channel: string, callback: (data: any) => void): (() => void) => {
      if (!HelixSDK.ipcListeners.has(channel)) {
        HelixSDK.ipcListeners.set(channel, []);
      }
      HelixSDK.ipcListeners.get(channel)!.push(callback);
      return () => {
        const arr = HelixSDK.ipcListeners.get(channel) || [];
        HelixSDK.ipcListeners.set(channel, arr.filter(fn => fn !== callback));
      };
    }
  };

  /**
   * Initialize and attach to global window object
   */
  public static init(): void {
    if (typeof window !== 'undefined') {
      (window as any).helix = {
        fs: HelixSDK.fs,
        kv: HelixSDK.kv,
        ai: HelixSDK.ai,
        ui: HelixSDK.ui,
        auth: HelixSDK.auth,
        ipc: HelixSDK.ipc,
        version: '11.5.0-Puter-OSjs'
      };
    }
  }
}
