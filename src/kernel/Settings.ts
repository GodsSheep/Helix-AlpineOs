// Helix OS Settings & Comprehensive System Configuration Engine

export type FontScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type DisplayScale = '80%' | '90%' | '100%' | '110%' | '125%';
export type UiDensity = 'compact' | 'comfortable' | 'spacious';
export type PowerProfile = 'performance' | 'balanced' | 'powersave' | 'eco';
export type CpuGovernor = 'performance' | 'powersave' | 'ondemand' | 'conservative';

export interface HelixTheme {
  id: string;
  name: string;
  description: string;
  bg: string;
  panelSolid: string;
  accent: string;
  text: string;
  muted: string;
  line: string;
  wallpaper: string;
  isFreeDownload?: boolean;
}

export interface RealDeviceHardwareInfo {
  batteryLevel: number | null;
  isCharging: boolean;
  chargingTime: number | null;
  dischargingTime: number | null;
  isOnline: boolean;
  cpuCores: number;
  deviceMemoryGB: number;
  screenResolution: string;
  pixelRatio: number;
  colorDepth: number;
  orientation: string;
  browserVendor: string;
  platform: string;
}

export interface HelixSettings {
  // Theme & Appearance
  themeId: string;
  previousDarkThemeId?: string;
  customWallpaperUrl?: string;
  wallpaperPreset: string;
  wallpaperStyle: 'cover' | 'contain' | 'stretch' | 'tile';
  accentColorHex?: string;
  dockPosition: 'bottom' | 'top';
  dockSize: 'compact' | 'normal' | 'large';
  enableBlur: boolean;
  enableAnimations: boolean;
  darkMode: boolean;
  highContrast: boolean;
  customThemes: HelixTheme[];
  
  // Display, Font & Screen Fit
  fontScale: FontScale;
  displayScale: DisplayScale;
  uiDensity: UiDensity;
  autoFitDisplay: boolean;
  enableSafeAreas: boolean;
  autoSnapWindows: boolean;
  windowSnapThreshold: number;

  // Terminal
  terminalFontSize: number;
  terminalCursor: 'block' | 'underline' | 'bar';
  terminalFontFamily: string;
  autoStartTerminal: boolean;

  // Linux Virtual Machine & Kernel
  vmMemoryMB: number;
  vmCores: number;
  vmEngineMode: 'jit' | 'interpreted' | 'microvm';
  sharedMountEnabled: boolean;
  bootVerbosity: 'quiet' | 'normal' | 'verbose';
  
  // Power & Battery Control
  powerProfile: PowerProfile;
  cpuGovernor: CpuGovernor;
  autoDimOnLowBattery: boolean;
  lowBatteryThreshold: number;
  suspendTimeoutMinutes: number;
  realDeviceBatterySync: boolean;

  // Package Manager & Repositories
  apkMirrorUrl: string;
  enableTestingRepo: boolean;
  enableCommunityRepo: boolean;
  autoUpdateReposOnBoot: boolean;

  // Network & Audio
  networkInterfaceEnabled: boolean;
  dnsServers: string;
  volume: number;
  isMuted: boolean;
  soundEffectsEnabled: boolean;

  // Hardware & Sensors Sync
  syncHostHardwareMetrics: boolean;

  // Desktop shortcuts
  desktopShortcuts: string[];
}

export const THEME_PRESETS: HelixTheme[] = [
  {
    id: 'default',
    name: 'Emerald Obsidian (Default)',
    description: 'Deep obsidian backdrop with vibrant mint emerald glow.',
    bg: '#07080b',
    panelSolid: '#12141b',
    accent: '#6ee7b7',
    text: '#edf1f7',
    muted: '#8b93a7',
    line: 'rgba(255, 255, 255, 0.08)',
    wallpaper: 'mesh-emerald',
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    description: 'Deep navy twilight with neon cyan and magenta accents.',
    bg: '#1a1b26',
    panelSolid: '#24283b',
    accent: '#7aa2f7',
    text: '#c0caf5',
    muted: '#787c99',
    line: 'rgba(122, 162, 247, 0.12)',
    wallpaper: 'gradient-tokyo',
  },
  {
    id: 'nord',
    name: 'Nordic Frost',
    description: 'Arctic blue palette inspired by polar aurora night.',
    bg: '#2e3440',
    panelSolid: '#3b4252',
    accent: '#88c0d0',
    text: '#eceff4',
    muted: '#d8dee9',
    line: 'rgba(216, 222, 233, 0.1)',
    wallpaper: 'mesh-nord',
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox Retro',
    description: 'Warm earth tones, parchment contrasts, and retro amber accent.',
    bg: '#1d2021',
    panelSolid: '#282828',
    accent: '#fabd2f',
    text: '#ebdbb2',
    muted: '#a89984',
    line: 'rgba(250, 189, 47, 0.12)',
    wallpaper: 'gradient-gruvbox',
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin Mocha',
    description: 'Soothing pastel accents on warm dark lavender canvas.',
    bg: '#1e1e2e',
    panelSolid: '#181825',
    accent: '#cba6f7',
    text: '#cdd6f4',
    muted: '#a6adc8',
    line: 'rgba(203, 166, 247, 0.12)',
    wallpaper: 'gradient-catppuccin',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    description: 'High-contrast neon yellow and midnight carbon.',
    bg: '#0a0a0f',
    panelSolid: '#12131a',
    accent: '#fcee0a',
    text: '#f3f3f3',
    muted: '#808090',
    line: 'rgba(252, 238, 10, 0.18)',
    wallpaper: 'mesh-cyberpunk',
  },
  {
    id: 'alpine-daylight',
    name: 'Alpine Daylight (Light)',
    description: 'Clean high-contrast light theme with cobalt highlights.',
    bg: '#f3f4f6',
    panelSolid: '#ffffff',
    accent: '#2563eb',
    text: '#111827',
    muted: '#6b7280',
    line: 'rgba(0, 0, 0, 0.1)',
    wallpaper: 'light-clean',
  },
  {
    id: 'matrix',
    name: 'Matrix Phosphor',
    description: 'Classic green phosphor terminal glow and pure dark canvas.',
    bg: '#040d06',
    panelSolid: '#091c0e',
    accent: '#22c55e',
    text: '#86efac',
    muted: '#4ade80',
    line: 'rgba(34, 197, 94, 0.18)',
    wallpaper: 'matrix-grid',
  },
];

export const FREE_THEME_STORE: HelixTheme[] = [
  {
    id: 'solarized-dark',
    name: 'Solarized Dark Pro',
    description: 'Precision colors by Ethan Schoonover with cyan & yellow accents.',
    bg: '#002b36',
    panelSolid: '#073642',
    accent: '#2aa198',
    text: '#93a1a1',
    muted: '#657b83',
    line: 'rgba(42, 161, 152, 0.15)',
    wallpaper: 'gradient-tokyo',
    isFreeDownload: true,
  },
  {
    id: 'dracula',
    name: 'Dracula Gothic',
    description: 'Famous dark theme with purple and pink accents.',
    bg: '#282a36',
    panelSolid: '#44475a',
    accent: '#ff79c6',
    text: '#f8f8f2',
    muted: '#6272a4',
    line: 'rgba(255, 121, 198, 0.15)',
    wallpaper: 'mesh-nord',
    isFreeDownload: true,
  },
  {
    id: 'rose-pine',
    name: 'Rosé Pine Moon',
    description: 'Minimal, elegant palette with muted gold, rose, and pine tones.',
    bg: '#232136',
    panelSolid: '#2a273f',
    accent: '#eb6f92',
    text: '#e0def4',
    muted: '#908caa',
    line: 'rgba(235, 111, 146, 0.15)',
    wallpaper: 'gradient-catppuccin',
    isFreeDownload: true,
  },
  {
    id: 'monokai-pro',
    name: 'Monokai Pro Synth',
    description: 'Iconic developer color scheme with energetic amber and green.',
    bg: '#2d2a2e',
    panelSolid: '#403e41',
    accent: '#a9dc76',
    text: '#fcfcfa',
    muted: '#727072',
    line: 'rgba(169, 220, 118, 0.15)',
    wallpaper: 'mesh-cyberpunk',
    isFreeDownload: true,
  },
];

const DEFAULT_SETTINGS: HelixSettings = {
  themeId: 'default',
  previousDarkThemeId: 'default',
  wallpaperPreset: 'mesh-emerald',
  wallpaperStyle: 'cover',
  accentColorHex: '#6ee7b7',
  dockPosition: 'bottom',
  dockSize: 'normal',
  enableBlur: true,
  enableAnimations: true,
  darkMode: true,
  highContrast: false,
  customThemes: [],

  fontScale: 'md',
  displayScale: '100%',
  uiDensity: 'comfortable',
  autoFitDisplay: true,
  enableSafeAreas: true,
  autoSnapWindows: true,
  windowSnapThreshold: 15,

  terminalFontSize: 13,
  terminalCursor: 'block',
  terminalFontFamily: 'JetBrains Mono, Fira Code, Menlo, Monaco, monospace',
  autoStartTerminal: true,

  vmMemoryMB: 256,
  vmCores: 2,
  vmEngineMode: 'jit',
  sharedMountEnabled: true,
  bootVerbosity: 'normal',

  powerProfile: 'balanced',
  cpuGovernor: 'ondemand',
  autoDimOnLowBattery: true,
  lowBatteryThreshold: 20,
  suspendTimeoutMinutes: 15,
  realDeviceBatterySync: true,

  apkMirrorUrl: 'https://dl-cdn.alpinelinux.org/alpine/v3.20',
  enableTestingRepo: true,
  enableCommunityRepo: true,
  autoUpdateReposOnBoot: false,

  networkInterfaceEnabled: true,
  dnsServers: '1.1.1.1, 8.8.8.8, 9.9.9.9',
  volume: 80,
  isMuted: false,
  soundEffectsEnabled: true,

  syncHostHardwareMetrics: true,
  desktopShortcuts: ['term', 'files', 'rustcpp', 'pythonshowcase', 'settings', 'browser', 'paint'],
};

export class SettingsService {
  private static instance: SettingsService;
  private settings: HelixSettings = { ...DEFAULT_SETTINGS };
  private listeners: Set<(settings: HelixSettings) => void> = new Set();
  private hardwareListeners: Set<(info: RealDeviceHardwareInfo) => void> = new Set();
  private hardwareInfo: RealDeviceHardwareInfo = {
    batteryLevel: null,
    isCharging: false,
    chargingTime: null,
    dischargingTime: null,
    isOnline: true,
    cpuCores: 4,
    deviceMemoryGB: 8,
    screenResolution: '1920x1080',
    pixelRatio: 1,
    colorDepth: 24,
    orientation: 'landscape-primary',
    browserVendor: 'Google Chrome / Chromium Engine',
    platform: 'WebContainer (Linux)',
  };

  private constructor() {
    this.load();
    this.initHardwareSensors();
    this.applyThemeToDOM();
    this.applyDisplayScalingToDOM();
  }

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  public get(): HelixSettings {
    return { ...this.settings };
  }

  public getHardwareInfo(): RealDeviceHardwareInfo {
    return { ...this.hardwareInfo };
  }

  public getWallpaper(): string {
    return (
      this.settings.customWallpaperUrl ||
      this.settings.wallpaperPreset ||
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80'
    );
  }

  public setWallpaper(url: string): void {
    this.update({ customWallpaperUrl: url, wallpaperPreset: 'custom' });
  }

  public getActiveTheme(): HelixTheme {
    const all = [...THEME_PRESETS, ...this.settings.customThemes, ...FREE_THEME_STORE];
    return all.find((t) => t.id === this.settings.themeId) || THEME_PRESETS[0];
  }

  public update(partial: Partial<HelixSettings>): void {
    this.settings = { ...this.settings, ...partial };
    this.save();
    this.applyThemeToDOM();
    this.applyDisplayScalingToDOM();
    this.notify();
  }

  public setTheme(themeId: string): void {
    const isLight = themeId === 'alpine-daylight';
    const all = [...THEME_PRESETS, ...this.settings.customThemes, ...FREE_THEME_STORE];
    const theme = all.find((t) => t.id === themeId) || THEME_PRESETS[0];

    this.update({
      themeId,
      darkMode: !isLight,
      previousDarkThemeId: !isLight ? themeId : this.settings.previousDarkThemeId,
      customWallpaperUrl: undefined,
      wallpaperPreset: theme.wallpaper,
    });
  }

  public toggleDarkMode(): void {
    if (this.settings.darkMode) {
      const prevDark = this.settings.themeId !== 'alpine-daylight' ? this.settings.themeId : 'default';
      this.update({
        darkMode: false,
        themeId: 'alpine-daylight',
        previousDarkThemeId: prevDark,
      });
    } else {
      const targetDark = this.settings.previousDarkThemeId || 'default';
      this.update({
        darkMode: true,
        themeId: targetDark,
      });
    }
  }

  public setFontScale(scale: FontScale): void {
    this.update({ fontScale: scale });
  }

  public setDisplayScale(scale: DisplayScale): void {
    this.update({ displayScale: scale });
  }

  public setPowerProfile(profile: PowerProfile): void {
    this.update({ powerProfile: profile });
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(100, Math.round(volume)));
    this.update({
      volume: clamped,
      isMuted: clamped === 0,
    });
  }

  public toggleMute(): void {
    this.update({
      isMuted: !this.settings.isMuted,
    });
  }

  public installFreeTheme(theme: HelixTheme): void {
    const exists = this.settings.customThemes.some((t) => t.id === theme.id);
    if (!exists) {
      const updatedThemes = [...this.settings.customThemes, theme];
      this.update({ customThemes: updatedThemes, themeId: theme.id });
    } else {
      this.setTheme(theme.id);
    }
  }

  public resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    try {
      localStorage.removeItem('helix_settings');
    } catch {}
    this.applyThemeToDOM();
    this.applyDisplayScalingToDOM();
    this.notify();
  }

  public exportStateJSON(): string {
    return JSON.stringify(
      {
        version: '6.5.0',
        exportedAt: new Date().toISOString(),
        settings: this.settings,
        hardwareSnapshot: this.hardwareInfo,
      },
      null,
      2
    );
  }

  public importStateJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data && data.settings) {
        this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
        this.save();
        this.applyThemeToDOM();
        this.applyDisplayScalingToDOM();
        this.notify();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public subscribe(fn: (s: HelixSettings) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public subscribeHardware(fn: (info: RealDeviceHardwareInfo) => void): () => void {
    this.hardwareListeners.add(fn);
    // Immediately invoke with current state
    fn(this.hardwareInfo);
    return () => this.hardwareListeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.settings));
  }

  private notifyHardware(): void {
    this.hardwareListeners.forEach((fn) => fn(this.hardwareInfo));
  }

  private save(): void {
    try {
      localStorage.setItem('helix_settings', JSON.stringify(this.settings));
    } catch {}
  }

  private load(): void {
    try {
      const stored = localStorage.getItem('helix_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {}
  }

  private initHardwareSensors(): void {
    if (typeof window === 'undefined') return;

    // Detect screen and hardware capabilities
    const updateMetrics = () => {
      const sw = window.innerWidth;
      const sh = window.innerHeight;
      const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
      const mem = typeof navigator !== 'undefined' && 'deviceMemory' in navigator ? (navigator as any).deviceMemory || 8 : 8;
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const ratio = window.devicePixelRatio || 1;
      const depth = window.screen.colorDepth || 24;
      const orient = window.screen.orientation ? window.screen.orientation.type : 'landscape-primary';
      const vendor = navigator.userAgent;

      this.hardwareInfo = {
        ...this.hardwareInfo,
        screenResolution: `${sw}x${sh} (${window.screen.width}x${window.screen.height} physical)`,
        pixelRatio: ratio,
        colorDepth: depth,
        orientation: orient,
        cpuCores: cores,
        deviceMemoryGB: mem,
        isOnline: online,
        browserVendor: vendor.includes('Firefox') ? 'Firefox' : vendor.includes('Safari') && !vendor.includes('Chrome') ? 'Apple Safari' : 'Chromium / Blink',
        platform: navigator.platform || 'Linux x86_64',
      };
      this.notifyHardware();
    };

    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    window.addEventListener('orientationchange', updateMetrics);
    window.addEventListener('online', () => {
      this.hardwareInfo.isOnline = true;
      this.notify();
      this.notifyHardware();
    });
    window.addEventListener('offline', () => {
      this.hardwareInfo.isOnline = false;
      this.notify();
      this.notifyHardware();
    });

    // Real device battery API
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const handleBattery = () => {
          const lvl = Math.round(battery.level * 100);
          this.hardwareInfo.batteryLevel = lvl;
          this.hardwareInfo.isCharging = battery.charging;
          this.hardwareInfo.chargingTime = Number.isFinite(battery.chargingTime) ? battery.chargingTime : null;
          this.hardwareInfo.dischargingTime = Number.isFinite(battery.dischargingTime) ? battery.dischargingTime : null;

          // Auto-dim / power-saver trigger if enabled
          if (this.settings.autoDimOnLowBattery && lvl <= this.settings.lowBatteryThreshold && !battery.charging) {
            if (this.settings.powerProfile !== 'powersave' && this.settings.powerProfile !== 'eco') {
              this.update({ powerProfile: 'powersave' });
            }
          }
          this.notify();
          this.notifyHardware();
        };

        handleBattery();
        battery.addEventListener('levelchange', handleBattery);
        battery.addEventListener('chargingchange', handleBattery);
        battery.addEventListener('chargingtimechange', handleBattery);
        battery.addEventListener('dischargingtimechange', handleBattery);
      }).catch(() => {
        this.hardwareInfo.batteryLevel = 98;
        this.hardwareInfo.isCharging = true;
        this.notifyHardware();
      });
    } else {
      this.hardwareInfo.batteryLevel = 98;
      this.hardwareInfo.isCharging = true;
      this.notifyHardware();
    }
  }

  private applyThemeToDOM(): void {
    if (typeof document === 'undefined') return;
    const theme = this.getActiveTheme();
    const root = document.documentElement;

    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--panel-solid', theme.panelSolid);
    root.style.setProperty('--accent', this.settings.accentColorHex || theme.accent);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--muted', theme.muted);
    root.style.setProperty('--line', theme.line);
  }

  private applyDisplayScalingToDOM(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Font scaling multipliers
    const fontScaleMap: Record<FontScale, string> = {
      xs: '0.85',
      sm: '0.92',
      md: '1.0',
      lg: '1.08',
      xl: '1.18',
    };
    root.style.setProperty('--font-scale', fontScaleMap[this.settings.fontScale] || '1.0');

    // UI Display Scaling
    const displayScaleMap: Record<DisplayScale, string> = {
      '80%': '0.80',
      '90%': '0.90',
      '100%': '1.0',
      '110%': '1.10',
      '125%': '1.25',
    };
    root.style.setProperty('--ui-scale', displayScaleMap[this.settings.displayScale] || '1.0');

    // High contrast toggle class
    if (this.settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }
}

export const Settings = SettingsService.getInstance();
