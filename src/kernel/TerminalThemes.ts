// Helix OS Terminal Themes Engine

export interface TerminalTheme {
  id: string;
  name: string;
  description: string;
  bg: string;
  topBarBg: string;
  inputRowBg: string;
  borderColor: string;
  promptUser: string;
  promptHost: string;
  promptPath: string;
  promptSymbol: string;
  inputColor: string;
  caretColor: string;
  outputColor: string;
  errorColor: string;
  systemColor: string;
  accentColor: string;
  chipBg: string;
  chipText: string;
  chipBorder: string;
  badgeBg: string;
  badgeText: string;
}

export const TERMINAL_THEMES: Record<string, TerminalTheme> = {
  emerald: {
    id: 'emerald',
    name: 'Helix Emerald (Default)',
    description: 'Sleek obsidian canvas with neon mint emerald prompt & accents.',
    bg: '#07080b',
    topBarBg: '#0d0f17',
    inputRowBg: '#0a0c12',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    promptUser: '#6ee7b7',
    promptHost: '#8b93a7',
    promptPath: '#38bdf8',
    promptSymbol: '#ffffff',
    inputColor: '#6ee7b7',
    caretColor: '#6ee7b7',
    outputColor: '#d8e2dc',
    errorColor: '#f87171',
    systemColor: '#8b93a7',
    accentColor: '#6ee7b7',
    chipBg: 'rgba(255, 255, 255, 0.05)',
    chipText: '#e2e8f0',
    chipBorder: 'rgba(255, 255, 255, 0.1)',
    badgeBg: 'rgba(110, 231, 183, 0.1)',
    badgeText: '#6ee7b7',
  },
  nord: {
    id: 'nord',
    name: 'Nord Arctic',
    description: 'Polar arctic dark palette with frozen cyan and snow white.',
    bg: '#2e3440',
    topBarBg: '#242933',
    inputRowBg: '#222630',
    borderColor: 'rgba(216, 222, 233, 0.15)',
    promptUser: '#88c0d0',
    promptHost: '#d8dee9',
    promptPath: '#81a1c1',
    promptSymbol: '#eceff4',
    inputColor: '#eceff4',
    caretColor: '#88c0d0',
    outputColor: '#d8dee9',
    errorColor: '#bf616a',
    systemColor: '#5e81ac',
    accentColor: '#88c0d0',
    chipBg: '#3b4252',
    chipText: '#eceff4',
    chipBorder: '#4c566a',
    badgeBg: 'rgba(136, 192, 208, 0.15)',
    badgeText: '#88c0d0',
  },
  gruvbox: {
    id: 'gruvbox',
    name: 'Gruvbox Dark',
    description: 'Retro warm earth tones with parchment contrasts and amber accent.',
    bg: '#1d2021',
    topBarBg: '#282828',
    inputRowBg: '#232627',
    borderColor: 'rgba(250, 189, 47, 0.18)',
    promptUser: '#fabd2f',
    promptHost: '#ebdbb2',
    promptPath: '#83a598',
    promptSymbol: '#fe8019',
    inputColor: '#ebdbb2',
    caretColor: '#fabd2f',
    outputColor: '#ebdbb2',
    errorColor: '#fb4934',
    systemColor: '#bdae93',
    accentColor: '#fabd2f',
    chipBg: '#32302f',
    chipText: '#ebdbb2',
    chipBorder: '#504945',
    badgeBg: 'rgba(250, 189, 47, 0.15)',
    badgeText: '#fabd2f',
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula Gothic',
    description: 'Iconic gothic palette with vampire purple, pink and neon cyan.',
    bg: '#282a36',
    topBarBg: '#21222c',
    inputRowBg: '#191a21',
    borderColor: 'rgba(255, 121, 198, 0.18)',
    promptUser: '#50fa7b',
    promptHost: '#f8f8f2',
    promptPath: '#8be9fd',
    promptSymbol: '#ff79c6',
    inputColor: '#f1fa8c',
    caretColor: '#ff79c6',
    outputColor: '#f8f8f2',
    errorColor: '#ff5555',
    systemColor: '#bd93f9',
    accentColor: '#ff79c6',
    chipBg: '#44475a',
    chipText: '#f8f8f2',
    chipBorder: '#6272a4',
    badgeBg: 'rgba(255, 121, 198, 0.15)',
    badgeText: '#ff79c6',
  },
  monokai: {
    id: 'monokai',
    name: 'Monokai Pro',
    description: 'Legendary syntax highlighter with neon lime, magenta and bright gold.',
    bg: '#272822',
    topBarBg: '#1e1f1c',
    inputRowBg: '#191a17',
    borderColor: 'rgba(166, 226, 46, 0.18)',
    promptUser: '#a6e22e',
    promptHost: '#f8f8f2',
    promptPath: '#66d9ef',
    promptSymbol: '#f92672',
    inputColor: '#fd971f',
    caretColor: '#a6e22e',
    outputColor: '#f8f8f2',
    errorColor: '#f92672',
    systemColor: '#ae81ff',
    accentColor: '#a6e22e',
    chipBg: '#3e3d32',
    chipText: '#f8f8f2',
    chipBorder: '#75715e',
    badgeBg: 'rgba(166, 226, 46, 0.15)',
    badgeText: '#a6e22e',
  },
  solarized: {
    id: 'solarized',
    name: 'Solarized Dark',
    description: 'Scientifically calibrated palette by Ethan Schoonover with rich teal.',
    bg: '#002b36',
    topBarBg: '#073642',
    inputRowBg: '#00212b',
    borderColor: 'rgba(42, 161, 152, 0.2)',
    promptUser: '#2aa198',
    promptHost: '#93a1a1',
    promptPath: '#268bd2',
    promptSymbol: '#b58900',
    inputColor: '#859900',
    caretColor: '#2aa198',
    outputColor: '#93a1a1',
    errorColor: '#dc322f',
    systemColor: '#657b83',
    accentColor: '#2aa198',
    chipBg: '#073642',
    chipText: '#93a1a1',
    chipBorder: '#586e75',
    badgeBg: 'rgba(42, 161, 152, 0.18)',
    badgeText: '#2aa198',
  },
  onedark: {
    id: 'onedark',
    name: 'One Dark Pro',
    description: 'Modern developer dark theme with pastel lavender, soft red and cyan.',
    bg: '#21252b',
    topBarBg: '#1d1f23',
    inputRowBg: '#181a1f',
    borderColor: 'rgba(97, 175, 239, 0.18)',
    promptUser: '#61afef',
    promptHost: '#abb2bf',
    promptPath: '#98c379',
    promptSymbol: '#c678dd',
    inputColor: '#e5c07b',
    caretColor: '#61afef',
    outputColor: '#abb2bf',
    errorColor: '#e06c75',
    systemColor: '#5c6370',
    accentColor: '#61afef',
    chipBg: '#282c34',
    chipText: '#abb2bf',
    chipBorder: '#3e4451',
    badgeBg: 'rgba(97, 175, 239, 0.15)',
    badgeText: '#61afef',
  },
  tokyonight: {
    id: 'tokyonight',
    name: 'Tokyo Night',
    description: 'Deep navy city twilight with neon indigo, cyan and pastel violet.',
    bg: '#1a1b26',
    topBarBg: '#16161e',
    inputRowBg: '#13141c',
    borderColor: 'rgba(122, 162, 247, 0.2)',
    promptUser: '#7aa2f7',
    promptHost: '#a9b1d6',
    promptPath: '#7dcfff',
    promptSymbol: '#bb9af7',
    inputColor: '#c0caf5',
    caretColor: '#7aa2f7',
    outputColor: '#c0caf5',
    errorColor: '#f7768e',
    systemColor: '#565f89',
    accentColor: '#7aa2f7',
    chipBg: '#24283b',
    chipText: '#c0caf5',
    chipBorder: '#414868',
    badgeBg: 'rgba(122, 162, 247, 0.15)',
    badgeText: '#7aa2f7',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    description: 'High-voltage electric yellow, hot pink and glowing cyan matrix.',
    bg: '#0a0a0f',
    topBarBg: '#12131a',
    inputRowBg: '#0e0f14',
    borderColor: 'rgba(252, 238, 10, 0.25)',
    promptUser: '#fcee0a',
    promptHost: '#f3f3f3',
    promptPath: '#00e5ff',
    promptSymbol: '#ff0055',
    inputColor: '#00ff9f',
    caretColor: '#fcee0a',
    outputColor: '#00ff9f',
    errorColor: '#ff0055',
    systemColor: '#00e5ff',
    accentColor: '#fcee0a',
    chipBg: '#181a24',
    chipText: '#00ff9f',
    chipBorder: 'rgba(252, 238, 10, 0.3)',
    badgeBg: 'rgba(252, 238, 10, 0.15)',
    badgeText: '#fcee0a',
  },
  matrix: {
    id: 'matrix',
    name: 'Matrix Phosphor',
    description: 'Deep mainframe green phosphor terminal with pure dark canvas.',
    bg: '#030c04',
    topBarBg: '#051507',
    inputRowBg: '#020903',
    borderColor: 'rgba(34, 197, 94, 0.25)',
    promptUser: '#22c55e',
    promptHost: '#86efac',
    promptPath: '#4ade80',
    promptSymbol: '#16a34a',
    inputColor: '#86efac',
    caretColor: '#22c55e',
    outputColor: '#86efac',
    errorColor: '#ef4444',
    systemColor: '#15803d',
    accentColor: '#22c55e',
    chipBg: '#09210c',
    chipText: '#86efac',
    chipBorder: '#166534',
    badgeBg: 'rgba(34, 197, 94, 0.15)',
    badgeText: '#22c55e',
  },
};

export class TerminalThemeEngine {
  private static activeThemeId: string = 'emerald';
  private static listeners: Set<(theme: TerminalTheme) => void> = new Set();

  static init(): void {
    try {
      const saved = localStorage.getItem('helix_term_theme');
      if (saved && TERMINAL_THEMES[saved]) {
        this.activeThemeId = saved;
      }
    } catch {}
  }

  static getActiveTheme(): TerminalTheme {
    return TERMINAL_THEMES[this.activeThemeId] || TERMINAL_THEMES.emerald;
  }

  static setTheme(themeId: string): boolean {
    const target = TERMINAL_THEMES[themeId.toLowerCase()];
    if (!target) return false;

    this.activeThemeId = target.id;
    try {
      localStorage.setItem('helix_term_theme', target.id);
    } catch {}

    const active = this.getActiveTheme();
    this.listeners.forEach((cb) => cb(active));
    return true;
  }

  static subscribe(callback: (theme: TerminalTheme) => void): () => void {
    this.listeners.add(callback);
    callback(this.getActiveTheme());
    return () => this.listeners.delete(callback);
  }

  static getAllThemes(): TerminalTheme[] {
    return Object.values(TERMINAL_THEMES);
  }
}

TerminalThemeEngine.init();
