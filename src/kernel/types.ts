export type AppId = 
  | 'machine' 
  | 'term' 
  | 'edit' 
  | 'store' 
  | 'mon' 
  | 'files' 
  | 'settings'
  | 'netscan'
  | 'apkman'
  | 'syslog'
  | 'procman'
  | 'sqlclient'
  | 'docviewer'
  | 'envmgr'
  | 'browser'
  | 'diskanalyzer'
  | 'soundmixer'
  | 'game-racer'
  | 'game-hacker'
  | 'game-2048'
  | 'game-tetris'
  | 'game-minesweeper'
  | 'cron'
  | 'firewall'
  | 'services'
  | 'calc'
  | 'paint'
  | 'ssh'
  | 'archive'
  | 'hardware'
  | 'diff'
  | 'clipboard'
  | 'game-snake'
  | 'game-spaceinvaders'
  | 'game-pong'
  | 'game-memory'
  | 'game-wordle'
  | 'guirunner'
  | 'gui-window'
  | 'neofetch'
  | 'taskscheduler'
  | 'hexedit'
  | 'benchmark'
  | 'pythonshowcase'
  | 'guistudio'
  | 'rustcpp'
  | 'hotshot'
  | 'netmaster'
  | 'asynciomonitor'
  | 'unifiedstudio'
  | 'osselector'
  | 'backpack'
  | 'sysscan'
  | 'bootassist'
  | 'healthcheck'
  | 'betterbrowser'
  | 'crossplatform'
  | 'pythonengine'
  | 'pythonarcade'
  | 'telemetry'
  | 'trash'
  | 'docker'
  | 'gitstudio'
  | 'wireshark'
  | 'apistudio'
  | 'kmod'
  | 'autodetect'
  | 'kernel-memory'
  | 'wine-app'
  | 'helix-ai'
  | 'p2p-mesh'
  | 'apk-bridge'
  | 'chroot'
  | 'setup'
  | 'linux-security'
  | 'dev-tools-studio'
  | 'visual-game-engine'
  | 'universal-utils';

declare global {
  interface Window {
    emulator?: any;
  }
}

export interface AppDefinition {
  id: AppId;
  title: string;
  icon: string;
  category: 'System' | 'Development' | 'Utilities' | 'Games';
  description: string;
  width: number;
  height: number;
  pinnedToDock?: boolean;
  iconBg?: string;
}

export interface WindowInstance {
  id: string;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isShaded?: boolean;
  prevBounds?: { x: number; y: number; width: number; height: number };
  args?: Record<string, unknown>;
}

export interface VFSFile {
  path: string;
  content: string;
  timestamp: number;
}

export interface SoftwarePackage {
  id: string;
  name: string;
  pkg: string;
  desc: string;
  version: string;
  installed: boolean;
  size: string;
}

export type VMState = 'cold' | 'booting' | 'ready' | 'stopping' | 'stopped' | 'suspended' | 'error';

export interface VMConfig {
  biosUrl?: string;
  vgaBiosUrl?: string;
  cdromUrl?: string;
  hasSnapshot?: boolean;
}

export interface TelemetryData {
  ramUsed: number;
  ramTotal: number;
  cpuUsage: number;
  processes: { pid: number; cmd: string; mem: string }[];
}
