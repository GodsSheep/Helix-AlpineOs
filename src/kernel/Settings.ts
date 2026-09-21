import { HostKernelBridge } from './HostKernelBridge';

// Helix OS Settings & Comprehensive System Configuration Engine

export type FontScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type DisplayScale = '75%' | '80%' | '90%' | '100%' | '110%' | '125%' | '150%' | '175%' | '200%';
export type UiDensity = 'ultra-compact' | 'compact' | 'comfortable' | 'spacious' | 'touch';
export type PowerProfile = 'performance' | 'balanced' | 'powersave' | 'eco';
export type CpuGovernor = 'performance' | 'powersave' | 'ondemand' | 'conservative' | 'schedutil';
export type WindowSizePreset = 'compact' | 'standard' | 'large' | 'wide' | 'ultrawide' | 'maximized' | 'custom';
export type WindowTitlebarHeight = 'minimal' | 'compact' | 'standard' | 'spacious';
export type WindowCornerRadius = 'sharp' | 'subtle' | 'modern' | 'curved' | 'extra-round';
export type WindowBorderWidth = 'none' | '1px' | '2px' | '3px';
export type WindowGlowEffect = 'none' | 'subtle' | 'medium' | 'high' | 'neon';
export type WindowControlsStyle = 'mac' | 'windows' | 'linux' | 'minimal';
export type WindowMinimizeStyle = 'scale' | 'slide' | 'genie' | 'instant';
export type WindowDoubleClickAction = 'maximize' | 'shade' | 'center' | 'snap-left' | 'fit-screen' | 'none';
export type WindowAspectLock = 'freeform' | '16:9' | '4:3' | '16:10' | '3:2';
export type WindowPlacementStrategy = 'center' | 'cascade' | 'tile';
export type SoundTheme = 'modern' | 'cyber' | 'mech' | 'scifi' | 'silent';
export type NightShiftMode = 'off' | 'mild' | 'warm' | 'intense';
export type LiveWallpaperMode = 'none' | 'matrix' | 'starfield' | 'aurora' | 'cyber-grid';
export type DockStyle = 'floating' | 'full-width' | 'pill' | 'windows-bar';
export type DockAlignment = 'center' | 'start' | 'end';
export type DockIconSize = 'micro' | 'small' | 'medium' | 'large' | 'xlarge';
export type GlobalFontFamily = 'system' | 'jetbrains' | 'fira' | 'inter' | 'outfit' | 'space' | 'roboto';

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
  wallpaperStyle: 'cover' | 'contain' | 'stretch' | 'tile' | 'center';
  wallpaperSolidColor: string;
  liveWallpaper: LiveWallpaperMode;
  wallpaperBrightness: number;
  accentColorHex?: string;
  enableBlur: boolean;
  blurIntensity: number;
  glassOpacity: number;
  enableAnimations: boolean;
  animationSpeed: 'fast' | 'normal' | 'relaxed';
  darkMode: boolean;
  highContrast: boolean;
  customThemes: HelixTheme[];
  customFontFamily: GlobalFontFamily;
  cursorStyle: 'default' | 'cyan-glow' | 'emerald-glow' | 'amber-glow' | 'large-white';

  // Window Fit, Sizing & Customization
  windowDefaultSize: WindowSizePreset;
  windowCustomWidth: number;
  windowCustomHeight: number;
  windowTitlebarHeight: WindowTitlebarHeight;
  windowCornerRadius: WindowCornerRadius;
  windowBorderWidth: WindowBorderWidth;
  windowGlowEffect: WindowGlowEffect;
  windowInactiveOpacity: number;
  windowControlsStyle: WindowControlsStyle;
  windowMinimizeStyle: WindowMinimizeStyle;
  windowTitlebarDoubleClick: WindowDoubleClickAction;
  windowAeroShake: boolean;
  windowEdgeMagnetism: boolean;
  windowInterlockMagnetism: boolean;
  windowDefaultPlacement: WindowPlacementStrategy;
  windowAspectLock: WindowAspectLock;
  autoSnapWindows: boolean;
  windowSnapThreshold: number;
  windowShowSnapPreview: boolean;

  // Display, Font & Screen Fit
  fontScale: FontScale;
  displayScale: DisplayScale;
  uiDensity: UiDensity;
  autoFitDisplay: boolean;
  enableSafeAreas: boolean;
  nightShift: NightShiftMode;
  refreshRateCap: number;

  // Dock, Taskbar & Launcher
  dockPosition: 'bottom' | 'top' | 'left' | 'right';
  dockAlignment: DockAlignment;
  dockStyle: DockStyle;
  dockSize: 'compact' | 'normal' | 'large';
  dockAutoHide: boolean;
  dockAutoHideDelay: number;
  dockIconSize: DockIconSize;
  dockShowActiveIndicators: boolean;
  dockMagnification: boolean;
  dockMagnificationScale: number;
  dockShowRecentApps: boolean;
  dockRecentAppsCount: number;
  dockShowTrash: boolean;
  dockBounceOnLaunch: boolean;

  // Audio, Sounds & Haptics
  volume: number;
  isMuted: boolean;
  soundEffectsEnabled: boolean;
  soundTheme: SoundTheme;
  soundEventWindowOpen: boolean;
  soundEventWindowClose: boolean;
  soundEventWindowMinimize: boolean;
  soundEventWindowSnap: boolean;
  soundEventTrash: boolean;
  soundEventError: boolean;
  soundEventTerminalBell: boolean;
  hapticFeedbackEnabled: boolean;

  // Top Bar & Menubar Customization
  topbarShowOsBadge: boolean;
  topbarShowShellButton: boolean;
  topbarShowActivityButton: boolean;
  topbarShowSettingsButton: boolean;
  topbarShowZenButton: boolean;
  topbarShowPwaInstall: boolean;
  topbarShowBattery: boolean;
  topbarShowBatteryPercent: boolean;
  topbarShowWifi: boolean;
  topbarShowQuickSettings: boolean;
  topbarShowLinuxStatus: boolean;
  topbarShowNotificationBell: boolean;
  topbarShowClockSeconds: boolean;
  topbarShowDate: boolean;
  topbarClockFormat: '12h' | '24h';
  topbarBlur: boolean;

  // Terminal & Shell Environment
  terminalFontSize: number;
  terminalCursor: 'block' | 'underline' | 'bar';
  terminalCursorBlink: boolean;
  terminalFontFamily: string;
  terminalScrollback: number;
  autoStartTerminal: boolean;
  terminalBellSound: boolean;
  terminalCopyOnSelect: boolean;
  terminalRightClickPaste: boolean;
  terminalOpacity: number;

  // Linux Virtual Machine & Kernel
  vmMemoryMB: number;
  vmCores: number;
  vmEngineMode: 'jit' | 'interpreted' | 'microvm';
  vmSwapMB: number;
  sharedMountEnabled: boolean;
  bootVerbosity: 'quiet' | 'normal' | 'verbose' | 'debug';
  virtioBlockDevice: boolean;
  virtioNetworkDevice: boolean;
  osDistroProfile: string;
  
  // Safe-State Engine & RAM Checkpoint Automation
  safeStateAutoSnapshot: boolean;
  safeStateThresholdPercent: number;
  safeStateTerminalBroadcast: boolean;
  safeStateAutoRecoverOnPanic: boolean;

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

  // Network & DNS
  networkInterfaceEnabled: boolean;
  dnsServers: string;
  dnsPreset: string;
  mtuSize: number;
  vpnEnabled: boolean;
  hotspotEnabled: boolean;

  // Hardware & Sensors Sync
  syncHostHardwareMetrics: boolean;

  // VFS & Cache Persistence Settings
  vfsQuotaMegabytes: number;
  prioritizeVfsStorage: boolean;
  biosIntegrityValidationOnBoot: boolean;
  swAutoReloadOnCorruption: boolean;

  // Trash & Recycle Bin Settings
  trashAutoEmptyDays: number;
  trashConfirmOnDelete: boolean;
  trashPlaySoundOnEmpty: boolean;
  trashMaxCapacityMb: number;

  // Python Execution Engine
  pythonExecutionEngine: 'kernel' | 'wasm' | 'hybrid';
  pythonAutoImportNumpy: boolean;

  // Security, Privacy & Lock Screen
  screenLockEnabled: boolean;
  screenLockPin: string;
  idleLockMinutes: number;
  anonymousTelemetry: boolean;

  // App Lifecycle & Uninstall Management
  uninstalledAppIds: string[];

  // Desktop shortcuts & Icons
  desktopShortcuts: string[];
  desktopIconSize: 'small' | 'medium' | 'large';
  desktopGridSnap: boolean;
  desktopShowWatermark: boolean;
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
  wallpaperSolidColor: '#07080b',
  liveWallpaper: 'none',
  wallpaperBrightness: 100,
  accentColorHex: '#6ee7b7',
  enableBlur: true,
  blurIntensity: 12,
  glassOpacity: 85,
  enableAnimations: true,
  animationSpeed: 'normal',
  darkMode: true,
  highContrast: false,
  customThemes: [],
  customFontFamily: 'system',
  cursorStyle: 'default',

  // Window Fit, Sizing & Customization
  windowDefaultSize: 'standard',
  windowCustomWidth: 800,
  windowCustomHeight: 520,
  windowTitlebarHeight: 'standard',
  windowCornerRadius: 'modern',
  windowBorderWidth: '1px',
  windowGlowEffect: 'medium',
  windowInactiveOpacity: 95,
  windowControlsStyle: 'linux',
  windowMinimizeStyle: 'scale',
  windowTitlebarDoubleClick: 'maximize',
  windowAeroShake: true,
  windowEdgeMagnetism: true,
  windowInterlockMagnetism: true,
  windowDefaultPlacement: 'cascade',
  windowAspectLock: 'freeform',
  autoSnapWindows: true,
  windowSnapThreshold: 15,
  windowShowSnapPreview: true,

  // Display, Font & Screen Fit
  fontScale: 'md',
  displayScale: '100%',
  uiDensity: 'comfortable',
  autoFitDisplay: true,
  enableSafeAreas: true,
  nightShift: 'off',
  refreshRateCap: 60,

  // Dock, Taskbar & Launcher
  dockPosition: 'bottom',
  dockAlignment: 'center',
  dockStyle: 'floating',
  dockSize: 'normal',
  dockAutoHide: false,
  dockAutoHideDelay: 300,
  dockIconSize: 'medium',
  dockShowActiveIndicators: true,
  dockMagnification: true,
  dockMagnificationScale: 1.25,
  dockShowRecentApps: true,
  dockRecentAppsCount: 5,
  dockShowTrash: true,
  dockBounceOnLaunch: true,

  // Audio, Sounds & Haptics
  volume: 80,
  isMuted: false,
  soundEffectsEnabled: true,
  soundTheme: 'modern',
  soundEventWindowOpen: true,
  soundEventWindowClose: true,
  soundEventWindowMinimize: true,
  soundEventWindowSnap: true,
  soundEventTrash: true,
  soundEventError: true,
  soundEventTerminalBell: true,
  hapticFeedbackEnabled: true,

  // Top Bar & Menubar Customization
  topbarShowOsBadge: true,
  topbarShowShellButton: true,
  topbarShowActivityButton: true,
  topbarShowSettingsButton: true,
  topbarShowZenButton: true,
  topbarShowPwaInstall: true,
  topbarShowBattery: true,
  topbarShowBatteryPercent: true,
  topbarShowWifi: true,
  topbarShowQuickSettings: true,
  topbarShowLinuxStatus: true,
  topbarShowNotificationBell: true,
  topbarShowClockSeconds: false,
  topbarShowDate: true,
  topbarClockFormat: '12h',
  topbarBlur: true,

  // Terminal & Shell Environment
  terminalFontSize: 13,
  terminalCursor: 'block',
  terminalCursorBlink: true,
  terminalFontFamily: 'JetBrains Mono, Fira Code, Menlo, Monaco, monospace',
  terminalScrollback: 5000,
  autoStartTerminal: true,
  terminalBellSound: true,
  terminalCopyOnSelect: false,
  terminalRightClickPaste: true,
  terminalOpacity: 95,

  // Linux Virtual Machine & Kernel
  vmMemoryMB: 256,
  vmCores: 2,
  vmEngineMode: 'jit',
  vmSwapMB: 256,
  sharedMountEnabled: true,
  bootVerbosity: 'normal',
  virtioBlockDevice: true,
  virtioNetworkDevice: true,
  osDistroProfile: 'alpine',

  // Safe-State Engine & RAM Checkpoint Automation
  safeStateAutoSnapshot: false,
  safeStateThresholdPercent: 85,
  safeStateTerminalBroadcast: false,
  safeStateAutoRecoverOnPanic: true,

  // Power & Battery Control
  powerProfile: 'balanced',
  cpuGovernor: 'ondemand',
  autoDimOnLowBattery: true,
  lowBatteryThreshold: 20,
  suspendTimeoutMinutes: 15,
  realDeviceBatterySync: true,

  // Package Manager & Repositories
  apkMirrorUrl: 'https://dl-cdn.alpinelinux.org/alpine/v3.20',
  enableTestingRepo: true,
  enableCommunityRepo: true,
  autoUpdateReposOnBoot: false,

  // Network & DNS
  networkInterfaceEnabled: true,
  dnsServers: '1.1.1.1, 8.8.8.8, 9.9.9.9',
  dnsPreset: 'cloudflare',
  mtuSize: 1500,
  vpnEnabled: false,
  hotspotEnabled: false,

  // Hardware & Sensors Sync
  syncHostHardwareMetrics: true,

  // VFS & Cache Persistence Settings
  vfsQuotaMegabytes: 512,
  prioritizeVfsStorage: true,
  biosIntegrityValidationOnBoot: true,
  swAutoReloadOnCorruption: true,

  // Trash & Recycle Bin Settings
  trashAutoEmptyDays: 30,
  trashConfirmOnDelete: true,
  trashPlaySoundOnEmpty: true,
  trashMaxCapacityMb: 256,

  // Python Execution Engine
  pythonExecutionEngine: 'kernel',
  pythonAutoImportNumpy: true,

  // Security, Privacy & Lock Screen
  screenLockEnabled: false,
  screenLockPin: '',
  idleLockMinutes: 0,
  anonymousTelemetry: false,

  // App Lifecycle & Uninstall Management
  uninstalledAppIds: [],

  // Desktop shortcuts & Icons
  desktopShortcuts: ['term', 'files', 'trash', 'pythonengine', 'crossplatform', 'betterbrowser', 'healthcheck', 'settings'],
  desktopIconSize: 'medium',
  desktopGridSnap: true,
  desktopShowWatermark: true,
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

  private syncDebounceTimer: any = null;

  private save(): void {
    try {
      localStorage.setItem('helix_settings', JSON.stringify(this.settings));
    } catch {}

    // Debounced auto-sync to Linux host storage
    if (typeof window !== 'undefined') {
      if (this.syncDebounceTimer) clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = setTimeout(() => {
        try {
          const vfs = (window as any).Kernel?.vfs || null;
          HostKernelBridge.syncUserData(this.settings.osDistroProfile || 'alpine', vfs).catch(() => {});
        } catch {}
      }, 1200);
    }
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

    // Window Radius Map
    const radiusMap: Record<string, string> = {
      sharp: '0px',
      subtle: '8px',
      modern: '16px',
      curved: '22px',
      'extra-round': '28px',
    };
    root.style.setProperty('--helix-radius', radiusMap[this.settings.windowCornerRadius] || '16px');

    // Inactive window opacity
    root.style.setProperty('--helix-inactive-opacity', `${(this.settings.windowInactiveOpacity || 95) / 100}`);

    // Blur intensity & Glass opacity
    root.style.setProperty('--helix-blur', this.settings.enableBlur ? `${this.settings.blurIntensity || 12}px` : '0px');
    root.style.setProperty('--helix-glass-opacity', `${(this.settings.glassOpacity || 85) / 100}`);

    // Custom Font Family Map
    const fontMap: Record<string, string> = {
      system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      jetbrains: '"JetBrains Mono", monospace',
      fira: '"Fira Code", monospace',
      inter: 'Inter, system-ui, sans-serif',
      outfit: 'Outfit, system-ui, sans-serif',
      space: '"Space Grotesk", sans-serif',
      roboto: 'Roboto, sans-serif',
    };
    root.style.setProperty('--helix-font-family', fontMap[this.settings.customFontFamily] || fontMap.system);

    // Night Shift Warm Overlay Filter
    if (this.settings.nightShift === 'warm') {
      root.style.filter = 'sepia(0.25) saturate(0.95)';
    } else if (this.settings.nightShift === 'intense') {
      root.style.filter = 'sepia(0.45) saturate(0.9) hue-rotate(-10deg)';
    } else if (this.settings.nightShift === 'mild') {
      root.style.filter = 'sepia(0.12)';
    } else {
      root.style.filter = 'none';
    }
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
      '2xl': '1.30',
    };
    root.style.setProperty('--font-scale', fontScaleMap[this.settings.fontScale] || '1.0');

    // UI Display Scaling
    const displayScaleMap: Record<DisplayScale, string> = {
      '75%': '0.75',
      '80%': '0.80',
      '90%': '0.90',
      '100%': '1.0',
      '110%': '1.10',
      '125%': '1.25',
      '150%': '1.50',
      '175%': '1.75',
      '200%': '2.0',
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
