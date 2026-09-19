import { Kernel } from './index';
import { Settings } from './Settings';
import { Toast } from './Toast';
import { SoundManager } from './SoundManager';

export interface TrashItemMetadata {
  id: string;
  filename: string;
  originalPath: string;
  trashPath: string;
  deletedAt: string;
  deletedAtTimestamp: number;
  sizeKb: number;
  type: 'file' | 'app';
}

export class TrashManagerService {
  private static instance: TrashManagerService;
  private listeners: Set<() => void> = new Set();
  private METADATA_PATH = '/.trash/.metadata.json';

  public static getInstance(): TrashManagerService {
    if (!TrashManagerService.instance) {
      TrashManagerService.instance = new TrashManagerService();
    }
    return TrashManagerService.instance;
  }

  private async getMetadataMap(): Promise<Record<string, TrashItemMetadata>> {
    try {
      const raw = await Kernel.vfs.read(this.METADATA_PATH);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Fallback empty map if corrupt or missing
    }
    return {};
  }

  private async saveMetadataMap(map: Record<string, TrashItemMetadata>): Promise<void> {
    try {
      await Kernel.vfs.write(this.METADATA_PATH, JSON.stringify(map, null, 2));
    } catch (err) {
      console.error('TrashManager: Failed to write metadata manifest:', err);
    }
  }

  /**
   * Move a file or directory path in VFS to /.trash/ rather than immediate deletion
   */
  public async trash(pathOrAppId: string): Promise<TrashItemMetadata | null> {
    // Check if it's an app ID uninstall request
    if (pathOrAppId.startsWith('app:')) {
      const appId = pathOrAppId.replace('app:', '');
      const uninstalled = [...(Settings.get().uninstalledAppIds || [])];
      if (!uninstalled.includes(appId)) {
        uninstalled.push(appId);
        Settings.update({ uninstalledAppIds: uninstalled });
      }
      Kernel.wm.closeByAppId(appId);
      SoundManager.play('trash');
      Toast.show(`Uninstalled ${appId} (Moved to Trash)`, '🗑️');
      this.notify();
      return null;
    }

    const normPath = Kernel.vfs.normalizePath(pathOrAppId);
    if (normPath.startsWith('/.trash/')) {
      // Already in trash
      return null;
    }

    const content = await Kernel.vfs.read(normPath);
    if (content === null) {
      console.warn(`TrashManager: File not found at path ${normPath}`);
      return null;
    }

    const filename = normPath.split('/').pop() || 'unnamed';
    const id = `trash_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${filename}`;
    const trashPath = `/.trash/${id}`;
    const sizeKb = Math.max(1, Math.round((content.length || 0) / 1024));

    const metadata: TrashItemMetadata = {
      id,
      filename,
      originalPath: normPath,
      trashPath,
      deletedAt: new Date().toLocaleTimeString(),
      deletedAtTimestamp: Date.now(),
      sizeKb,
      type: 'file',
    };

    // Move to /.trash/ in VFS
    await Kernel.vfs.write(trashPath, content);
    await Kernel.vfs.delete(normPath);

    // Save in metadata manifest
    const map = await this.getMetadataMap();
    map[id] = metadata;
    await this.saveMetadataMap(map);

    SoundManager.play('trash');
    Toast.show(`Moved ${filename} to Trash`, '🗑️');
    this.notify();
    return metadata;
  }

  /**
   * Restore a trashed file or app back to its original location
   */
  public async restore(id: string): Promise<boolean> {
    if (id.startsWith('app:')) {
      const appId = id.replace('app:', '');
      const uninstalled = [...(Settings.get().uninstalledAppIds || [])];
      const idx = uninstalled.indexOf(appId);
      if (idx !== -1) {
        uninstalled.splice(idx, 1);
        Settings.update({ uninstalledAppIds: uninstalled });
        SoundManager.play('success');
        Toast.show(`Reinstalled app ${appId}`, '🔄');
        this.notify();
        return true;
      }
      return false;
    }

    const map = await this.getMetadataMap();
    const item = map[id];
    if (!item) {
      console.warn(`TrashManager: No trash metadata found for id ${id}`);
      return false;
    }

    const content = await Kernel.vfs.read(item.trashPath);
    if (content !== null) {
      await Kernel.vfs.write(item.originalPath, content);
      await Kernel.vfs.delete(item.trashPath);
    }

    delete map[id];
    await this.saveMetadataMap(map);

    SoundManager.play('success');
    Toast.show(`Restored ${item.filename} to ${item.originalPath}`, '🔄');
    this.notify();
    return true;
  }

  /**
   * Permanently delete a trashed item
   */
  public async deletePermanently(id: string): Promise<boolean> {
    if (id.startsWith('app:')) {
      // App remains uninstalled
      return true;
    }

    const map = await this.getMetadataMap();
    const item = map[id];
    if (item) {
      await Kernel.vfs.delete(item.trashPath);
      delete map[id];
      await this.saveMetadataMap(map);
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * List all current items in the Trash (both VFS items and uninstalled apps)
   */
  public async list(): Promise<TrashItemMetadata[]> {
    const list: TrashItemMetadata[] = [];
    const map = await this.getMetadataMap();

    // VFS trashed items
    const allFiles = await Kernel.vfs.list();
    const trashFiles = allFiles.filter((f) => f.path.startsWith('/.trash/') && f.path !== this.METADATA_PATH);

    for (const f of trashFiles) {
      const id = f.path.replace('/.trash/', '');
      const meta = map[id];

      if (meta) {
        list.push(meta);
      } else {
        // Fallback for files placed in /.trash/ without metadata record
        const filename = id.split('_').slice(2).join('_') || id;
        list.push({
          id,
          filename,
          originalPath: `/${filename}`,
          trashPath: f.path,
          deletedAt: new Date(f.timestamp || Date.now()).toLocaleTimeString(),
          deletedAtTimestamp: f.timestamp || Date.now(),
          sizeKb: Math.max(1, Math.round((f.content?.length || 0) / 1024)),
          type: 'file',
        });
      }
    }

    // Uninstalled system apps
    const uninstalled = Settings.get().uninstalledAppIds || [];
    for (const appId of uninstalled) {
      const appDef = Kernel.apps.get(appId as any);
      if (appDef) {
        list.push({
          id: `app:${appId}`,
          filename: appDef.title,
          originalPath: `System App Registry (${appId})`,
          trashPath: `app:${appId}`,
          deletedAt: 'Recent',
          deletedAtTimestamp: Date.now(),
          sizeKb: 120,
          type: 'app',
        });
      }
    }

    return list;
  }

  /**
   * Empty the entire trash bin
   */
  public async emptyTrash(): Promise<void> {
    const items = await this.list();
    for (const item of items) {
      if (item.type === 'file') {
        await Kernel.vfs.delete(item.trashPath);
      }
    }
    await Kernel.vfs.delete(this.METADATA_PATH);

    SoundManager.play('trash');
    Toast.show('Trash emptied completely', '🗑️');
    this.notify();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('TrashManager listener error:', err);
      }
    });
  }
}

export const TrashManager = TrashManagerService.getInstance();
