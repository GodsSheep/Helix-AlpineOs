import { Settings, THEME_PRESETS, FREE_THEME_STORE, HelixTheme, FontScale } from './Settings';

export interface CustomThemeProfile {
  terminalBg: string;
  terminalFg: string;
  terminalCursor: string;
  terminalPrompt: string;
  windowBg: string;
  windowBorder: string;
  windowHeaderBg: string;
  windowTitleFg: string;
  dockBg: string;
  dockBorder: string;
  dockActiveDot: string;
  topBarBg: string;
  topBarFg: string;
  accentPrimary: string;
  accentSecondary: string;
}

export interface ThemeEngineConfig {
  themeId: string;
  fontScale: FontScale;
  borderRadiusPx: number;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double';
  borderWidthPx: number;
  highContrast: boolean;
  accentColorHex?: string;
  customProfile?: CustomThemeProfile;
}

export class ThemeEngineService {
  private static instance: ThemeEngineService;
  private listeners: Set<(config: ThemeEngineConfig) => void> = new Set();

  private currentConfig: ThemeEngineConfig = {
    themeId: 'default',
    fontScale: 'md',
    borderRadiusPx: 16,
    borderStyle: 'solid',
    borderWidthPx: 1,
    highContrast: false,
  };

  public static getInstance(): ThemeEngineService {
    if (!ThemeEngineService.instance) {
      ThemeEngineService.instance = new ThemeEngineService();
    }
    return ThemeEngineService.instance;
  }

  private constructor() {
    this.init();
  }

  public init(): void {
    if (typeof window === 'undefined') return;

    // Load initial configuration from Settings
    const settings = Settings.get();
    this.currentConfig = {
      themeId: settings.themeId || 'default',
      fontScale: settings.fontScale || 'md',
      borderRadiusPx: 16,
      borderStyle: 'solid',
      borderWidthPx: 1,
      highContrast: settings.highContrast || false,
      accentColorHex: settings.accentColorHex,
    };

    // Apply CSS variables to DOM root
    this.applyToDOM();

    // Subscribe to Settings updates
    Settings.subscribe((s) => {
      let changed = false;
      if (s.themeId !== this.currentConfig.themeId) {
        this.currentConfig.themeId = s.themeId;
        changed = true;
      }
      if (s.fontScale !== this.currentConfig.fontScale) {
        this.currentConfig.fontScale = s.fontScale;
        changed = true;
      }
      if (s.highContrast !== this.currentConfig.highContrast) {
        this.currentConfig.highContrast = s.highContrast;
        changed = true;
      }
      if (s.accentColorHex !== this.currentConfig.accentColorHex) {
        this.currentConfig.accentColorHex = s.accentColorHex;
        changed = true;
      }

      if (changed) {
        this.applyToDOM();
        this.notify();
      }
    });
  }

  public getActiveTheme(): HelixTheme {
    const settings = Settings.get();
    const all = [...THEME_PRESETS, ...(settings.customThemes || []), ...FREE_THEME_STORE];
    return all.find((t) => t.id === this.currentConfig.themeId) || THEME_PRESETS[0];
  }

  public getConfig(): ThemeEngineConfig {
    return { ...this.currentConfig };
  }

  public setTheme(themeId: string): void {
    this.currentConfig.themeId = themeId;
    Settings.setTheme(themeId);
    this.applyToDOM();
    this.notify();
  }

  public setFontScale(scale: FontScale): void {
    this.currentConfig.fontScale = scale;
    Settings.setFontScale(scale);
    this.applyToDOM();
    this.notify();
  }

  public setBorderRadius(radiusPx: number): void {
    this.currentConfig.borderRadiusPx = Math.max(0, Math.min(32, radiusPx));
    this.applyToDOM();
    this.notify();
  }

  public setBorderStyle(style: 'solid' | 'dashed' | 'dotted' | 'double', widthPx: number = 1): void {
    this.currentConfig.borderStyle = style;
    this.currentConfig.borderWidthPx = widthPx;
    this.applyToDOM();
    this.notify();
  }

  public setCustomProfile(profile: CustomThemeProfile): void {
    this.currentConfig.customProfile = profile;
    this.applyToDOM();
    this.notify();
  }

  /**
   * Applies CSS custom properties to document.documentElement
   */
  public applyToDOM(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const theme = this.getActiveTheme();

    // Color Palette Variables
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--panel-solid', theme.panelSolid);
    root.style.setProperty('--accent', this.currentConfig.accentColorHex || theme.accent);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--muted', theme.muted);
    root.style.setProperty('--line', theme.line);

    // Apply custom profile variables if set
    if (this.currentConfig.customProfile) {
      const p = this.currentConfig.customProfile;
      root.style.setProperty('--term-bg', p.terminalBg);
      root.style.setProperty('--term-fg', p.terminalFg);
      root.style.setProperty('--term-cursor', p.terminalCursor);
      root.style.setProperty('--term-prompt', p.terminalPrompt);
      root.style.setProperty('--win-bg', p.windowBg);
      root.style.setProperty('--win-border', p.windowBorder);
      root.style.setProperty('--win-header-bg', p.windowHeaderBg);
      root.style.setProperty('--win-title-fg', p.windowTitleFg);
      root.style.setProperty('--dock-bg', p.dockBg);
      root.style.setProperty('--dock-border', p.dockBorder);
      root.style.setProperty('--dock-active-dot', p.dockActiveDot);
      root.style.setProperty('--topbar-bg', p.topBarBg);
      root.style.setProperty('--topbar-fg', p.topBarFg);
      root.style.setProperty('--accent-primary', p.accentPrimary);
      root.style.setProperty('--accent-secondary', p.accentSecondary);
    }

    // Font Scale Multipliers
    const fontScaleMap: Record<FontScale, string> = {
      xs: '0.85',
      sm: '0.92',
      md: '1.0',
      lg: '1.08',
      xl: '1.18',
      '2xl': '1.30',
    };
    const scaleVal = fontScaleMap[this.currentConfig.fontScale] || '1.0';
    root.style.setProperty('--font-scale', scaleVal);

    // Border Variables
    root.style.setProperty('--helix-radius', `${this.currentConfig.borderRadiusPx}px`);
    root.style.setProperty('--helix-border-style', this.currentConfig.borderStyle);
    root.style.setProperty('--helix-border-width', `${this.currentConfig.borderWidthPx}px`);

    // High Contrast Modifier
    if (this.currentConfig.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }

  public subscribe(fn: (config: ThemeEngineConfig) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn(this.currentConfig);
      } catch (err) {
        console.error('ThemeEngine listener error:', err);
      }
    });
  }
}

export const ThemeEngine = ThemeEngineService.getInstance();
