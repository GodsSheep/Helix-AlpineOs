import { Toast } from './Toast';

export interface InstalledApk {
  id: string;
  packageName: string;
  appName: string;
  versionName: string;
  iconSymbol: string;
  apkSizeBytes: number;
  minSdkVersion: number;
  permissions: string[];
  installedTimestamp: number;
  status: 'installed' | 'running' | 'paused';
  windowId?: string;
}

type AndroidBridgeListener = (apks: InstalledApk[]) => void;

class AndroidBridgeEngine {
  private installedApks: InstalledApk[] = [];
  private listeners: Set<AndroidBridgeListener> = new Set();

  constructor() {
    this.seedDefaultApks();
  }

  private seedDefaultApks() {
    const now = Date.now();
    this.installedApks = [
      {
        id: 'apk-termux',
        packageName: 'com.termux',
        appName: 'Termux Android Shell',
        versionName: '0.118.0',
        iconSymbol: '📱',
        apkSizeBytes: 18400000,
        minSdkVersion: 24,
        permissions: ['android.permission.INTERNET', 'android.permission.WRITE_EXTERNAL_STORAGE'],
        installedTimestamp: now - 1000 * 60 * 60,
        status: 'installed',
      },
      {
        id: 'apk-vlc',
        packageName: 'org.videolan.vlc',
        appName: 'VLC Android Media Player',
        versionName: '3.5.4',
        iconSymbol: '🎬',
        apkSizeBytes: 32100000,
        minSdkVersion: 21,
        permissions: ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.RECORD_AUDIO'],
        installedTimestamp: now - 1000 * 60 * 120,
        status: 'installed',
      },
      {
        id: 'apk-kiwi',
        packageName: 'com.kiwibrowser.browser',
        appName: 'Kiwi Mobile Browser',
        versionName: '116.0.5845',
        iconSymbol: '🌐',
        apkSizeBytes: 54000000,
        minSdkVersion: 23,
        permissions: ['android.permission.INTERNET', 'android.permission.CAMERA'],
        installedTimestamp: now - 1000 * 60 * 180,
        status: 'installed',
      },
    ];
  }

  public getInstalledApks(): InstalledApk[] {
    return [...this.installedApks];
  }

  public installApkFile(file: File): Promise<InstalledApk> {
    return new Promise((resolve) => {
      const now = Date.now();
      const cleanName = file.name.replace(/\.apk$/i, '');
      const newApk: InstalledApk = {
        id: `apk-${Date.now()}`,
        packageName: `com.helix.apk.${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        appName: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        versionName: '1.0.0-WASM',
        iconSymbol: '🤖',
        apkSizeBytes: file.size,
        minSdkVersion: 26,
        permissions: ['android.permission.INTERNET', 'android.permission.VIBRATE'],
        installedTimestamp: now,
        status: 'installed',
      };

      this.installedApks.push(newApk);
      this.notify();
      Toast.show(`Android APK Installed: ${newApk.appName}`, '🤖');
      resolve(newApk);
    });
  }

  public launchApk(id: string): InstalledApk | null {
    const apk = this.installedApks.find((a) => a.id === id);
    if (!apk) return null;

    this.installedApks = this.installedApks.map((a) =>
      a.id === id ? { ...a, status: 'running' } : a
    );
    this.notify();
    Toast.show(`Launching Wayland APK Bridge: ${apk.appName}`, '🚀');
    return apk;
  }

  public stopApk(id: string) {
    this.installedApks = this.installedApks.map((a) =>
      a.id === id ? { ...a, status: 'installed' } : a
    );
    this.notify();
  }

  public subscribe(cb: AndroidBridgeListener): () => void {
    this.listeners.add(cb);
    cb(this.getInstalledApks());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.getInstalledApks()));
  }
}

export const AndroidBridge = new AndroidBridgeEngine();
