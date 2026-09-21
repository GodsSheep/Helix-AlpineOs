import { ThemeEngine, CustomThemeProfile } from './ThemeEngine';
import { Toast } from './Toast';

export interface ColorPickerSetting {
  id: string;
  label: string;
  key: keyof CustomThemeProfile;
  category: 'terminal' | 'window' | 'dock' | 'topbar' | 'accent';
  defaultColor: string;
}

export const COLOR_SETTINGS: ColorPickerSetting[] = [
  // Terminal Colors
  { id: 'term_bg', label: 'Terminal Background', key: 'terminalBg', category: 'terminal', defaultColor: '#0a0d14' },
  { id: 'term_fg', label: 'Terminal Foreground Text', key: 'terminalFg', category: 'terminal', defaultColor: '#e2e8f0' },
  { id: 'term_cursor', label: 'Terminal Cursor Accent', key: 'terminalCursor', category: 'terminal', defaultColor: '#6ee7b7' },
  { id: 'term_prompt', label: 'Terminal Prompt Color', key: 'terminalPrompt', category: 'terminal', defaultColor: '#38bdf8' },

  // Window Frame Colors
  { id: 'win_bg', label: 'Window Canvas Background', key: 'windowBg', category: 'window', defaultColor: '#11131f' },
  { id: 'win_border', label: 'Window Border Outline', key: 'windowBorder', category: 'window', defaultColor: '#1e293b' },
  { id: 'win_header', label: 'Window Titlebar Header', key: 'windowHeaderBg', category: 'window', defaultColor: '#0f172a' },
  { id: 'win_title', label: 'Window Title Text', key: 'windowTitleFg', category: 'window', defaultColor: '#f8fafc' },

  // Dock & Taskbar Colors
  { id: 'dock_bg', label: 'Dock Panel Background', key: 'dockBg', category: 'dock', defaultColor: '#0d1117' },
  { id: 'dock_border', label: 'Dock Border Accent', key: 'dockBorder', category: 'dock', defaultColor: '#30363d' },
  { id: 'dock_active', label: 'Dock Active Indicator', key: 'dockActiveDot', category: 'dock', defaultColor: '#38bdf8' },

  // Top Bar Colors
  { id: 'bar_bg', label: 'Top Bar Background', key: 'topBarBg', category: 'topbar', defaultColor: '#090d16' },
  { id: 'bar_fg', label: 'Top Bar Text & Icons', key: 'topBarFg', category: 'topbar', defaultColor: '#cbd5e1' },

  // Global Accent
  { id: 'accent_primary', label: 'Primary Accent Theme', key: 'accentPrimary', category: 'accent', defaultColor: '#6ee7b7' },
  { id: 'accent_secondary', label: 'Secondary Accent Theme', key: 'accentSecondary', category: 'accent', defaultColor: '#38bdf8' },
];

export const PRESET_THEMES: { id: string; name: string; profile: CustomThemeProfile }[] = [
  {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neon 2077',
    profile: {
      terminalBg: '#090014',
      terminalFg: '#00ffcc',
      terminalCursor: '#ff0055',
      terminalPrompt: '#ffe600',
      windowBg: '#120024',
      windowBorder: '#ff0055',
      windowHeaderBg: '#1a0033',
      windowTitleFg: '#ffffff',
      dockBg: '#0f001f',
      dockBorder: '#00ffcc',
      dockActiveDot: '#ff0055',
      topBarBg: '#0a0014',
      topBarFg: '#00ffcc',
      accentPrimary: '#ff0055',
      accentSecondary: '#00ffcc',
    },
  },
  {
    id: 'nordic_frost',
    name: 'Nordic Frost Aurora',
    profile: {
      terminalBg: '#2e3440',
      terminalFg: '#eceff4',
      terminalCursor: '#88c0d0',
      terminalPrompt: '#81a1c1',
      windowBg: '#3b4252',
      windowBorder: '#4c566a',
      windowHeaderBg: '#2e3440',
      windowTitleFg: '#e5e9f0',
      dockBg: '#2e3440',
      dockBorder: '#88c0d0',
      dockActiveDot: '#a3be8c',
      topBarBg: '#2e3440',
      topBarFg: '#d8dee9',
      accentPrimary: '#88c0d0',
      accentSecondary: '#81a1c1',
    },
  },
  {
    id: 'emerald_matrix',
    name: 'Emerald Matrix Hacker',
    profile: {
      terminalBg: '#020d08',
      terminalFg: '#22c55e',
      terminalCursor: '#4ade80',
      terminalPrompt: '#16a34a',
      windowBg: '#05180e',
      windowBorder: '#14532d',
      windowHeaderBg: '#031209',
      windowTitleFg: '#86efac',
      dockBg: '#020f09',
      dockBorder: '#22c55e',
      dockActiveDot: '#4ade80',
      topBarBg: '#010a05',
      topBarFg: '#4ade80',
      accentPrimary: '#22c55e',
      accentSecondary: '#16a34a',
    },
  },
  {
    id: 'monokai_pro',
    name: 'Monokai Pro Dark',
    profile: {
      terminalBg: '#2d2a2e',
      terminalFg: '#fcfcfa',
      terminalCursor: '#ffd866',
      terminalPrompt: '#ff6188',
      windowBg: '#221f22',
      windowBorder: '#403e41',
      windowHeaderBg: '#2d2a2e',
      windowTitleFg: '#fcfcfa',
      dockBg: '#19181a',
      dockBorder: '#a9dc76',
      dockActiveDot: '#78dce8',
      topBarBg: '#19181a',
      topBarFg: '#fcfcfa',
      accentPrimary: '#ffd866',
      accentSecondary: '#ff6188',
    },
  },
];
