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
  status: 'installed' | 'running' | 'paused' | 'downloading';
  downloadProgress?: number;
  description: string;
  category: 'Tools' | 'Media' | 'Games' | 'Browser';
  downloadUrl: string;
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
        iconSymbol: '💻',
        apkSizeBytes: 18400000,
        minSdkVersion: 24,
        permissions: ['android.permission.INTERNET', 'android.permission.WRITE_EXTERNAL_STORAGE'],
        installedTimestamp: now - 1000 * 60 * 60,
        status: 'installed',
        description: 'Powerful Android terminal emulator and Linux environment with package manager.',
        category: 'Tools',
        downloadUrl: 'https://github.com/termux/termux-app/releases/download/v0.118.0/termux-app_v0.118.0+github-debug_universal.apk'
      },
      {
        id: 'apk-retroarch',
        packageName: 'com.retroarch',
        appName: 'RetroArch Game Emulator',
        versionName: '1.16.0',
        iconSymbol: '🎮',
        apkSizeBytes: 135000000,
        minSdkVersion: 21,
        permissions: ['android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.RECORD_AUDIO'],
        installedTimestamp: now - 1000 * 60 * 120,
        status: 'installed',
        description: 'Frontend for emulators, game engines and media players supporting classic retro games.',
        category: 'Games',
        downloadUrl: 'https://buildbot.libretro.com/stable/1.16.0/android/RetroArch.apk'
      },
      {
        id: 'apk-vlc',
        packageName: 'org.videolan.vlc',
        appName: 'VLC Media Player',
        versionName: '3.5.4',
        iconSymbol: '🎬',
        apkSizeBytes: 32100000,
        minSdkVersion: 21,
        permissions: ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.RECORD_AUDIO'],
        installedTimestamp: now - 1000 * 60 * 180,
        status: 'installed',
        description: 'Free and open source cross-platform multimedia player that plays most multimedia files.',
        category: 'Media',
        downloadUrl: 'https://get.videolan.org/vlc/3.5.4/android/vlc-3.5.4-ARMv7.apk'
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
        installedTimestamp: now - 1000 * 60 * 240,
        status: 'installed',
        description: 'Fast browser that supports Chrome extensions, night mode and bottom address bar.',
        category: 'Browser',
        downloadUrl: 'https://kiwibrowser.com/download/kiwi-arm.apk'
      },
      {
        id: 'apk-minetest',
        packageName: 'net.minetest.minetest',
        appName: 'Minetest Voxel Sandbox',
        versionName: '5.8.0',
        iconSymbol: '🧱',
        apkSizeBytes: 78000000,
        minSdkVersion: 23,
        permissions: ['android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.INTERNET'],
        installedTimestamp: now - 1000 * 60 * 300,
        status: 'installed',
        description: 'Open source voxel game engine with infinite worlds and gameplay creation.',
        category: 'Games',
        downloadUrl: 'https://github.com/minetest/minetest/releases/download/5.8.0/minetest-5.8.0-android.apk'
      }
    ];
  }

  public getInstalledApks(): InstalledApk[] {
    return [...this.installedApks];
  }

  public async downloadAndInstallApp(appId: string): Promise<void> {
    const apk = this.installedApks.find(a => a.id === appId);
    if (!apk) return;

    this.installedApks = this.installedApks.map(a => 
      a.id === appId ? { ...a, status: 'downloading', downloadProgress: 0 } : a
    );
    this.notify();

    for (let p = 15; p <= 100; p += 25) {
      await new Promise(r => setTimeout(r, 250));
      this.installedApks = this.installedApks.map(a => 
        a.id === appId ? { ...a, downloadProgress: p } : a
      );
      this.notify();
    }

    this.installedApks = this.installedApks.map(a => 
      a.id === appId ? { ...a, status: 'installed', downloadProgress: 100 } : a
    );
    this.notify();
    Toast.show(`Successfully downloaded & installed ${apk.appName}`, '🤖');
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
        description: 'User-installed APK package running in Android ART sandbox.',
        category: 'Tools',
        downloadUrl: 'local://' + file.name
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
