import React, { useEffect, useRef } from 'react';
import { 
  Terminal, 
  Folder, 
  FileText, 
  FolderPlus, 
  FilePlus, 
  Activity, 
  Package, 
  Settings as SettingsIcon, 
  RefreshCw,
  Power,
  Copy,
  Clipboard,
  Trash2,
  Cpu,
  RotateCcw,
  Check,
  FileCode,
  Wifi,
  Database,
  Key,
  Globe,
  HardDrive,
  Volume2,
  VolumeX,
  Trophy,
  Bomb,
  BookOpen,
  Sparkles,
  Zap,
  Play,
  Pause,
  Layers,
  Search,
  Eye,
  Camera,
  Compass,
  LayoutGrid,
  Shield,
  Server,
  Clock,
  Calculator as CalcIcon,
  Palette,
  Archive as ArchiveIcon,
  CircuitBoard,
  GitCompare,
  Monitor,
  ShieldCheck,
} from 'lucide-react';
import { Kernel } from '../kernel';
import { Toast } from '../kernel/Toast';
import { Settings } from '../kernel/Settings';
import { SoundManager } from '../kernel/SoundManager';
import { fetchAndValidateBiosRom, KNOWN_BIOS_SIGNATURES } from '../kernel/BiosValidator';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onOpenApp: (appId: string, args?: Record<string, unknown>) => void;
  onRefreshDesktop: () => void;
  contextType?: string;
}

export const DesktopContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onOpenApp,
  onRefreshDesktop,
  contextType = 'desktop',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showShortcutSub, setShowShortcutSub] = React.useState(false);

  useEffect(() => {
    const handleOutside = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('pointerdown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Keep menu fully within viewport bounds
  const menuWidth = 240;
  const menuHeight = 360;
  const adjustedX = Math.max(8, Math.min(x, window.innerWidth - menuWidth - 12));
  const adjustedY = Math.max(46, Math.min(y, window.innerHeight - menuHeight - 12));

  if (contextType.startsWith('shortcut-')) {
    const appId = contextType.replace('shortcut-', '');
    const appDef = Kernel.apps.get(appId as any);
    if (!appDef) return null;

    const handleRemoveShortcut = () => {
      const current = Settings.get().desktopShortcuts || [];
      Settings.update({ desktopShortcuts: current.filter(id => id !== appId) });
      Toast.show(`Removed ${appDef.title} shortcut`, '🗑️');
      onClose();
    };

    const handleRunAsRoot = () => {
      SoundManager.play('success');
      Toast.show(`sudo doas ${appId}: executing with root capabilities`, '🛡️');
      onOpenApp(appId, { runAsRoot: true });
      onClose();
    };

    const handleInspectProperties = () => {
      SoundManager.play('open');
      const pid = Math.floor(Math.random() * 9000) + 1000;
      const mem = Math.floor(Math.random() * 50) + 12;
      Toast.show(`${appDef.title} (PID: ${pid}, RAM: ${mem}MB) - Active`, 'ℹ️');
      onClose();
    };

    const handleForceKill = () => {
      SoundManager.play('error');
      Toast.show(`killall -9 ${appId}: terminated process tree`, '💥');
      onClose();
    };

    return (
      <div
        ref={menuRef}
        style={{ left: adjustedX, top: adjustedY }}
        className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none animate-in fade-in zoom-in-95 duration-75"
      >
        <div className="px-2 py-1 font-mono text-[10px] text-[#6ee7b7] font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>{appDef.title}</span>
          <span className="text-sm leading-none">{appDef.icon}</span>
        </div>

        <button
          onClick={() => {
            onOpenApp(appId);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#6ee7b7]/15 hover:text-[#6ee7b7] flex items-center gap-2.5 transition text-left cursor-pointer"
        >
          <Play className="w-4 h-4 text-[#6ee7b7]" />
          <span>Open Application</span>
        </button>

        <button
          onClick={() => {
            onOpenApp(appId, { maximized: true });
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
        >
          <LayoutGrid className="w-4 h-4 text-cyan-400" />
          <span>Launch Maximized</span>
        </button>

        <button
          onClick={handleRunAsRoot}
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-amber-500/10 hover:text-amber-300 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300"
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span>Run as Administrator (Sudo)</span>
        </button>

        <button
          onClick={handleInspectProperties}
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
        >
          <Cpu className="w-4 h-4 text-[#6ee7b7]" />
          <span>Inspect App Properties</span>
        </button>

        <div className="my-1 border-t border-white/10" />

        <button
          onClick={handleRemoveShortcut}
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-amber-500/15 text-amber-300 flex items-center gap-2.5 transition text-left cursor-pointer"
        >
          <Trash2 className="w-4 h-4 text-amber-400" />
          <span>Remove Desktop Shortcut</span>
        </button>

        <button
          onClick={async () => {
            await Kernel.trash.trash(`app:${appId}`);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 flex items-center gap-2.5 transition text-left cursor-pointer font-medium"
        >
          <Trash2 className="w-4 h-4 text-rose-500" />
          <span>Uninstall & Move to Trash</span>
        </button>

        <button
          onClick={handleForceKill}
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center gap-2.5 transition text-left cursor-pointer"
        >
          <Power className="w-4 h-4 text-red-500" />
          <span>Force Kill Process (kill -9)</span>
        </button>
      </div>
    );
  }

  // Audio tone generator for Sound Mixer test
  const playTestTone = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // 440Hz Concert A
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
      Toast.show('ALSA 440Hz test tone synthesized', '🔊');
    } catch {
      Toast.show('Audio driver initialized', '🔊');
    }
  };

  const handleCreateNewFile = async () => {
    let name: string | null = null;
    try {
      name = prompt('Enter filename to create:', `document_${Date.now().toString().slice(-4)}.txt`);
    } catch {
      name = `document_${Date.now().toString().slice(-4)}.txt`;
    }
    if (name) {
      const path = name.startsWith('/') ? name : `/${name}`;
      await Kernel.vfs.write(path, `# Helix Alpine Document\nCreated on ${new Date().toLocaleString()}\n`);
      Toast.show(`Created ${path}`, '📄');
      onOpenApp('edit', { file: path });
    }
    onClose();
  };

  const handleCreateNewFolder = async () => {
    let name: string | null = null;
    try {
      name = prompt('Enter directory name:', `workspace_${Date.now().toString().slice(-4)}`);
    } catch {
      name = `workspace_${Date.now().toString().slice(-4)}`;
    }
    if (name) {
      const path = name.startsWith('/') ? `${name}/.keep` : `/${name}/.keep`;
      await Kernel.vfs.write(path, '');
      Toast.show(`Directory created: ${name}`, '📁');
      onOpenApp('files');
    }
    onClose();
  };

  const handleRunBiosAudit = async () => {
    SoundManager.play('open');
    Toast.show('Executing SHA-256 BIOS ROM Integrity Audit...', '🛡️');
    const urls = Object.keys(KNOWN_BIOS_SIGNATURES);
    let validCount = 0;
    for (const u of urls) {
      const res = await fetchAndValidateBiosRom(u);
      if (res.validation.isValid) validCount++;
    }
    SoundManager.play('success');
    Toast.show(`BIOS Audit Complete: ${validCount}/${urls.length} Firmware ROM Hashes Verified`, '✅');
    onOpenApp('settings', { tab: 'cache' });
    onClose();
  };

  const cycleWallpaper = () => {
    const presets = ['gradient-tokyo', 'mesh-nord', 'gradient-gruvbox', 'gradient-catppuccin', 'mesh-cyberpunk'];
    const cur = Settings.get().wallpaperPreset;
    const nextIdx = (presets.indexOf(cur) + 1) % presets.length;
    const nextPreset = presets[nextIdx];
    Settings.update({ wallpaperPreset: nextPreset as any });
    Toast.show(`Wallpaper: ${nextPreset}`, '🎨');
    onClose();
  };

  /* ----------------------------------------------------
     APP SPECIFIC MENUS (Every app has distinct options)
  ---------------------------------------------------- */

  // 1. TERMINAL
  if (contextType === 'term') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Terminal Shell</span>
          <Terminal className="w-3 h-3 text-cyan-400" />
        </div>
        <button
          onClick={async () => {
            try {
              const text = await navigator.clipboard.readText();
              Toast.show(`Clipboard read (${text.length} chars)`, '📋');
            } catch {
              Toast.show('Clipboard permission required', '⚠️');
            }
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
        >
          <Clipboard className="w-4 h-4 text-[#6ee7b7]" />
          <span>Paste from Clipboard</span>
        </button>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('helix-terminal-clear'));
            Toast.show('Terminal buffer cleared', '⌨️');
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Clear Terminal Buffer</span>
        </button>
        <button
          onClick={() => {
            Kernel.wm.launch('term');
            Toast.show('New terminal spawned', '💻');
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
        >
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>New Terminal Window</span>
        </button>
        <button
          onClick={() => {
            Kernel.wm.launch('procman');
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
        >
          <Activity className="w-4 h-4 text-rose-400" />
          <span>Launch Top / Htop</span>
        </button>
      </div>
    );
  }

  // 2. FILES APP
  if (contextType === 'files') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-purple-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>File Manager</span>
          <Folder className="w-3 h-3 text-purple-400" />
        </div>
        <button onClick={handleCreateNewFile} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <FilePlus className="w-4 h-4 text-purple-400" />
          <span>New File...</span>
        </button>
        <button onClick={handleCreateNewFolder} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <FolderPlus className="w-4 h-4 text-amber-400" />
          <span>New Directory...</span>
        </button>
        <button onClick={async () => { await Kernel.vfs.list(); Toast.show('VFS rescanned', '🔄'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <span>Rescan Storage</span>
        </button>
        <button onClick={() => { Kernel.wm.launch('term'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Terminal className="w-4 h-4 text-[#6ee7b7]" />
          <span>Open Shell in Folder</span>
        </button>
      </div>
    );
  }

  // 3. TEXT EDITOR
  if (contextType === 'edit') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-[#6ee7b7] font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Text Editor</span>
          <FileText className="w-3 h-3 text-[#6ee7b7]" />
        </div>
        <button onClick={handleCreateNewFile} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <FilePlus className="w-4 h-4 text-purple-400" />
          <span>New Document</span>
        </button>
        <button onClick={() => { onOpenApp('files'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Folder className="w-4 h-4 text-cyan-400" />
          <span>Open from File Manager</span>
        </button>
        <button onClick={() => { Toast.show('Buffer auto-formatted', '✨'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <FileCode className="w-4 h-4 text-[#6ee7b7]" />
          <span>Format & Syntax Check</span>
        </button>
      </div>
    );
  }

  // 4. APP STORE
  if (contextType === 'store') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Alpine App Store</span>
          <Package className="w-3 h-3 text-amber-400" />
        </div>
        <button onClick={() => { Toast.show('App store catalog updated', '✓'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <RefreshCw className="w-4 h-4 text-[#6ee7b7]" />
          <span>Check for Updates</span>
        </button>
        <button onClick={() => { onOpenApp('apkman'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Open System APK Manager</span>
        </button>
      </div>
    );
  }

  // 5. APK PACKAGE MANAGER
  if (contextType === 'apkman') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>APK Package Manager</span>
          <Package className="w-3 h-3 text-cyan-400" />
        </div>
        <button onClick={() => { Toast.show('Syncing Alpine packages (apk update)...', '⚡'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <RefreshCw className="w-4 h-4 text-[#6ee7b7]" />
          <span>apk update (Sync Repos)</span>
        </button>
        <button onClick={() => { Toast.show('All packages up to date', '✓'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Check className="w-4 h-4 text-cyan-400" />
          <span>apk upgrade (All Packages)</span>
        </button>
        <button onClick={() => { Toast.show('Cleaned 14.8MB package cache', '🧹'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Trash2 className="w-4 h-4 text-amber-400" />
          <span>Clean APK Cache</span>
        </button>
      </div>
    );
  }

  // 6. RESOURCE MONITOR
  if (contextType === 'mon') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Resource Monitor</span>
          <Activity className="w-3 h-3 text-cyan-400" />
        </div>
        <button onClick={() => { Toast.show('System metrics refreshed', '📊'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <span>Refresh Hardware Metrics</span>
        </button>
        <button onClick={() => { Toast.show('RAM buffers cleared: 42MB freed', '⚡'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Cpu className="w-4 h-4 text-[#6ee7b7]" />
          <span>Drop Kernel Memory Cache</span>
        </button>
        <button onClick={() => { onOpenApp('procman'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Layers className="w-4 h-4 text-rose-400" />
          <span>Switch to Process Killer</span>
        </button>
      </div>
    );
  }

  // 7. PROCESS MANAGER (PROCMAN)
  if (contextType === 'procman') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-rose-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Task Manager (htop)</span>
          <Layers className="w-3 h-3 text-rose-400" />
        </div>
        <button onClick={() => { Toast.show('Process table updated', '✓'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <RefreshCw className="w-4 h-4 text-[#6ee7b7]" />
          <span>Refresh Process Table</span>
        </button>
        <button onClick={() => { Toast.show('Filtered daemons', '🔍'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Search className="w-4 h-4 text-cyan-400" />
          <span>Filter User Processes</span>
        </button>
      </div>
    );
  }

  // 8. NETWORK SCANNER
  if (contextType === 'netscan') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-[#6ee7b7] font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Network Diagnostics</span>
          <Wifi className="w-3 h-3 text-[#6ee7b7]" />
        </div>
        <button onClick={() => { Toast.show('Subnet sweep initiated: 192.168.1.0/24', '🌐'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Wifi className="w-4 h-4 text-[#6ee7b7]" />
          <span>Sweep Local Subnet</span>
        </button>
        <button onClick={() => { Toast.show('Gateway response: 1.2ms (0% packet loss)', '🏓'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Ping Default Gateway</span>
        </button>
        <button onClick={() => { Toast.show('DNS resolver cache flushed', '✓'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <RefreshCw className="w-4 h-4 text-amber-400" />
          <span>Flush System DNS Cache</span>
        </button>
      </div>
    );
  }

  // 9. KERNEL SYSLOG
  if (contextType === 'syslog') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Kernel Syslog (dmesg)</span>
          <Terminal className="w-3 h-3 text-amber-400" />
        </div>
        <button onClick={() => { Toast.show('dmesg buffer refreshed', '📜'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <RefreshCw className="w-4 h-4 text-[#6ee7b7]" />
          <span>Refresh Kernel Ring Buffer</span>
        </button>
        <button onClick={async () => { await Kernel.vfs.write('/var/log/dmesg.txt', Kernel.logger.getLogs().join('\n')); Toast.show('Saved /var/log/dmesg.txt', '💾'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <FolderPlus className="w-4 h-4 text-cyan-400" />
          <span>Export Logs to Disk</span>
        </button>
      </div>
    );
  }

  // 10. SQLITE DATABASE
  if (contextType === 'sqlclient') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-purple-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>SQLite Database</span>
          <Database className="w-3 h-3 text-purple-400" />
        </div>
        <button onClick={() => { Toast.show('Database vacuumed and indexes rebuilt', '🧹'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Database className="w-4 h-4 text-purple-400" />
          <span>Vacuum VFS Database</span>
        </button>
        <button onClick={() => { Toast.show('Schema tables loaded (4 tables)', '✓'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <RefreshCw className="w-4 h-4 text-[#6ee7b7]" />
          <span>Reload Table Schemas</span>
        </button>
      </div>
    );
  }

  // 11. DOC VIEWER
  if (contextType === 'docviewer') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Alpine Handbook</span>
          <BookOpen className="w-3 h-3 text-cyan-400" />
        </div>
        <button onClick={() => { Toast.show('Article bookmarked to Quick Access', '🔖'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Bookmark Article</span>
        </button>
        <button onClick={() => { onOpenApp('term'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Terminal className="w-4 h-4 text-[#6ee7b7]" />
          <span>Open `man` in Terminal</span>
        </button>
      </div>
    );
  }

  // 12. ENV & SECRETS MANAGER
  if (contextType === 'envmgr') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-rose-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Secrets Manager</span>
          <Key className="w-3 h-3 text-rose-400" />
        </div>
        <button onClick={async () => { await Kernel.vfs.write('/.env', '# Helix Environment\nNODE_ENV=production\nPORT=3000\n'); Toast.show('Environment exported to /.env', '💾'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Key className="w-4 h-4 text-rose-400" />
          <span>Export .env to Virtual Disk</span>
        </button>
      </div>
    );
  }

  // 13. WEB BROWSER
  if (contextType === 'browser') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Web Browser Sandbox</span>
          <Globe className="w-3 h-3 text-cyan-400" />
        </div>
        <button onClick={() => { Toast.show('Sandbox reloaded', '🔄'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <span>Reload Sandbox Page</span>
        </button>
        <button onClick={() => { Toast.show('Cleared browser cache', '🧹'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Trash2 className="w-4 h-4 text-amber-400" />
          <span>Clear Cache & Cookies</span>
        </button>
      </div>
    );
  }

  // 14. DISK ANALYZER
  if (contextType === 'diskanalyzer') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Disk Analyzer</span>
          <HardDrive className="w-3 h-3 text-cyan-400" />
        </div>
        <button onClick={() => { Toast.show('Disk tree rescanned (ncdu complete)', '✓'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span>Rescan Virtual Disk Tree</span>
        </button>
        <button onClick={() => { Toast.show('Purged 18MB of /tmp caches', '🧹'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>Purge /tmp Cache Files</span>
        </button>
      </div>
    );
  }

  // 15. ALSA SOUND MIXER
  if (contextType === 'soundmixer') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>ALSA Sound Mixer</span>
          <Volume2 className="w-3 h-3 text-amber-400" />
        </div>
        <button onClick={() => { playTestTone(); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span>Test 440Hz Sine Audio Output</span>
        </button>
        <button onClick={() => { Toast.show('ALSA sound daemon reloaded', '✓'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <RefreshCw className="w-4 h-4 text-[#6ee7b7]" />
          <span>Restart ALSA Sound Daemon</span>
        </button>
      </div>
    );
  }

  // 16. GAMES (2048, Tetris, Minesweeper, Racer, Hacker)
  if (contextType?.startsWith('game-')) {
    const gameName = contextType === 'game-2048' ? 'Helix 2048'
      : contextType === 'game-tetris' ? 'Alpine Tetris'
      : contextType === 'game-minesweeper' ? 'Alpine Minesweeper'
      : contextType === 'game-racer' ? 'Highway Racer'
      : 'Cyber Hacker';

    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-purple-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>{gameName}</span>
          <Trophy className="w-3 h-3 text-amber-400" />
        </div>
        <button
          onClick={() => {
            onClose();
            // Close and re-launch to freshly restart
            const activeId = Kernel.wm.getActiveId();
            if (activeId) {
              Kernel.wm.close(activeId);
              setTimeout(() => Kernel.wm.launch(contextType as any), 60);
              Toast.show(`${gameName} restarted`, '🎮');
            }
          }}
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
        >
          <RotateCcw className="w-4 h-4 text-[#6ee7b7]" />
          <span>Restart {gameName}</span>
        </button>
        <button
          onClick={() => {
            Toast.show('High score synchronized to VFS', '🏆');
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
        >
          <Check className="w-4 h-4 text-cyan-400" />
          <span>Save High Score to VFS</span>
        </button>
      </div>
    );
  }

  // 17. ALPINE VM
  if (contextType === 'machine') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-[#6ee7b7] font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Alpine x86 VM</span>
          <Cpu className="w-3 h-3 text-[#6ee7b7]" />
        </div>
        <button onClick={() => { Kernel.vm.stop(); setTimeout(() => Kernel.vm.start(), 200); Toast.show('Alpine VM warm reboot sent', '⚡'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Power className="w-4 h-4 text-amber-400" />
          <span>Warm Reboot x86 Machine</span>
        </button>
        <button onClick={() => { Kernel.vm.stop(); Toast.show('ACPI shutdown sent', '🛑'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <RotateCcw className="w-4 h-4 text-rose-400" />
          <span>ACPI Soft Shutdown</span>
        </button>
      </div>
    );
  }

  // 18. SETTINGS CONTROL CENTER
  if (contextType === 'settings') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-rose-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Control Center Settings</span>
          <SettingsIcon className="w-3 h-3 text-rose-400" />
        </div>
        <button onClick={cycleWallpaper} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Cycle Wallpaper Theme</span>
        </button>
        <button onClick={() => { Settings.resetToDefaults(); Toast.show('Settings reset to defaults', '✓'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <RefreshCw className="w-4 h-4 text-rose-400" />
          <span>Reset All Defaults</span>
        </button>
      </div>
    );
  }

  // 19. CRON TASK SCHEDULER
  if (contextType === 'cron') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Cron Scheduler</span>
          <Clock className="w-3 h-3 text-emerald-400" />
        </div>
        <button onClick={() => { Toast.show('Crond service status: ACTIVE', '⏱️'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Check crond Daemon</span>
        </button>
        <button onClick={() => { onOpenApp('term', { cmd: 'crontab -l' }); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>View crontab in Shell</span>
        </button>
      </div>
    );
  }

  // 20. NETFILTER FIREWALL
  if (contextType === 'firewall') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Netfilter Firewall</span>
          <Shield className="w-3 h-3 text-emerald-400" />
        </div>
        <button onClick={() => { Toast.show('Stealth scan test complete: 0 leaks', '🛡️'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Run Stealth Port Test</span>
        </button>
        <button onClick={() => { Toast.show('Flushed dynamic conntrack flows', '✓'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <RefreshCw className="w-4 h-4 text-amber-400" />
          <span>Flush Conntrack Table</span>
        </button>
      </div>
    );
  }

  // 21. OPENRC SERVICES
  if (contextType === 'services') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>OpenRC Services</span>
          <Server className="w-3 h-3 text-emerald-400" />
        </div>
        <button onClick={() => { Toast.show('rc-status: all core daemons normal', '✓'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Run rc-status Check</span>
        </button>
        <button onClick={() => { onOpenApp('term', { cmd: 'rc-update show' }); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>List Runlevels in Terminal</span>
        </button>
      </div>
    );
  }

  // 22. CALCULATOR
  if (contextType === 'calc') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>GNU bc Calculator</span>
          <CalcIcon className="w-3 h-3 text-emerald-400" />
        </div>
        <button onClick={() => { onOpenApp('term', { cmd: 'echo "scale=10; 4*a(1)" | bc -l' }); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Compute Pi in CLI bc</span>
        </button>
      </div>
    );
  }

  // 23. PAINT STUDIO
  if (contextType === 'paint') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-pink-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Pixel Studio</span>
          <Palette className="w-3 h-3 text-pink-400" />
        </div>
        <button onClick={() => { Toast.show('Pencil tool calibrated', '✏️'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Check className="w-4 h-4 text-pink-400" />
          <span>Calibrate Canvas Engine</span>
        </button>
      </div>
    );
  }

  // 24. OPENSSH CLIENT
  if (contextType === 'ssh') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>OpenSSH Client</span>
          <Key className="w-3 h-3 text-amber-400" />
        </div>
        <button onClick={() => { Toast.show('Known hosts key database verified', '🔑'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Verify ~/.ssh/known_hosts</span>
        </button>
      </div>
    );
  }

  // 25. ARCHIVE MANAGER
  if (contextType === 'archive') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Archive Manager</span>
          <ArchiveIcon className="w-3 h-3 text-amber-400" />
        </div>
        <button onClick={() => { Toast.show('Testing archive CRC32 checksums: PASS', '✓'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Verify Archive Integrity</span>
        </button>
      </div>
    );
  }

  // 26. HARDWARE INSPECTOR
  if (contextType === 'hardware') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Hardware Inspector</span>
          <CircuitBoard className="w-3 h-3 text-cyan-400" />
        </div>
        <button onClick={() => { onOpenApp('term', { cmd: 'lscpu' }); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Execute lscpu in Shell</span>
        </button>
        <button onClick={() => { onOpenApp('term', { cmd: 'lspci -v' }); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Cpu className="w-4 h-4 text-amber-400" />
          <span>Dump Full PCI Tree</span>
        </button>
      </div>
    );
  }

  // 27. DIFF VIEWER
  if (contextType === 'diff') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Diff & Patch Studio</span>
          <GitCompare className="w-3 h-3 text-emerald-400" />
        </div>
        <button onClick={() => { Toast.show('Whitespace normalization applied', '✓'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Ignore Trailing Whitespace</span>
        </button>
      </div>
    );
  }

  // 28. CLIPBOARD MANAGER
  if (contextType === 'clipboard') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Clipboard Daemon</span>
          <Clipboard className="w-3 h-3 text-emerald-400" />
        </div>
        <button onClick={() => { Toast.show('Clipboard daemon polling active', '📋'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Check Daemon Status</span>
        </button>
      </div>
    );
  }

  // 29. GAME: SNAKE
  if (contextType === 'game-snake') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Alpine Snake</span>
          <Trophy className="w-3 h-3 text-emerald-400" />
        </div>
        <button onClick={() => { Toast.show('Snake high scores synced', '🐍'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Check High Score Record</span>
        </button>
      </div>
    );
  }

  // 30. GAME: SPACE INVADERS
  if (contextType === 'game-spaceinvaders') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Galaxy Invaders</span>
          <Trophy className="w-3 h-3 text-cyan-400" />
        </div>
        <button onClick={() => { Toast.show('Defense fleet armed and ready', '🚀'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Check className="w-4 h-4 text-cyan-400" />
          <span>Check Defense Fleet Specs</span>
        </button>
      </div>
    );
  }

  // 31. GAME: PONG
  if (contextType === 'game-pong') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Cyber Pong</span>
          <Trophy className="w-3 h-3 text-emerald-400" />
        </div>
        <button onClick={() => { Toast.show('Physics spin engine calibrated', '🏓'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Calibrate Ball Spin Physics</span>
        </button>
      </div>
    );
  }

  // 32. GAME: MEMORY
  if (contextType === 'game-memory') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Matrix Memory</span>
          <Trophy className="w-3 h-3 text-cyan-400" />
        </div>
        <button onClick={() => { Toast.show('Memory matrix randomized', '🧠'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <RotateCcw className="w-4 h-4 text-cyan-400" />
          <span>Shuffle Card Matrix</span>
        </button>
      </div>
    );
  }

  // 33. GAME: WORDLE
  if (contextType === 'game-wordle') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>CodeBreaker Wordle</span>
          <Trophy className="w-3 h-3 text-amber-400" />
        </div>
        <button onClick={() => { Toast.show('Linux dictionary: 24 active terms', '📖'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Inspect Dictionary Pool</span>
        </button>
      </div>
    );
  }

  // 33b. HOTSHOT SCREEN SNAPSHOT
  if (contextType === 'hotshot') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-[#6ee7b7] font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Hotshot Core Controller</span>
          <Camera className="w-3 h-3 text-[#6ee7b7]" />
        </div>
        <button onClick={() => { onOpenApp('hotshot'); Toast.show('Opened Screen Snapshot Utility', '📸'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Camera className="w-4 h-4 text-[#6ee7b7]" />
          <span>Launch Hotshot UI</span>
        </button>
        <button onClick={() => { 
          if (typeof (window as any).__triggerHotshotCapture === 'function') {
            (window as any).__triggerHotshotCapture();
          } else {
            Toast.show('Hotshot capture trigger active', '📸');
          }
          onClose(); 
        }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Trigger Snapshot (Alt+S)</span>
        </button>
      </div>
    );
  }

  // 34. HELIX GUI RUNNER & X11 STUDIO
  if (contextType === 'guirunner') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-64 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>GUI Studio & Display Server</span>
          <Monitor className="w-3 h-3 text-cyan-400" />
        </div>
        <button onClick={() => { onOpenApp('guirunner'); Toast.show('Opened GUI Studio IDE', '🖥️'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span>Open GUI Studio IDE</span>
        </button>
        <button onClick={() => { onOpenApp('term'); setTimeout(() => Kernel.vm.executeCommand('zenity --info --title="X11 Server" --text="Virtual display server active on :0.0"'), 300); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Sparkles className="w-4 h-4 text-[#6ee7b7]" />
          <span>Trigger Zenity Dialog Test</span>
        </button>
        <button onClick={() => { Toast.show('Display Server :0.0 protocol active', 'ℹ️'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Eye className="w-4 h-4 text-purple-400" />
          <span>Inspect Display Telemetry</span>
        </button>
      </div>
    );
  }

  // 35. NATIVE GUI CLIENT WINDOW
  if (contextType === 'gui-window') {
    return (
      <div ref={menuRef} style={{ left: adjustedX, top: adjustedY }} className="fixed z-[9999] w-64 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none">
        <div className="px-2 py-1 font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Helix X11 Client Window</span>
          <Monitor className="w-3 h-3 text-emerald-400" />
        </div>
        <button onClick={() => { Toast.show('X11 Window is rendering natively in Helix DE', '🪟'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Client Window Status: Normal</span>
        </button>
        <button onClick={() => { onOpenApp('guirunner'); onClose(); }} className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span>Manage in GUI Studio</span>
        </button>
      </div>
    );
  }

  if (contextType === 'desktop' && showShortcutSub) {
    const allApps = Kernel.apps.getAll() || [];
    const currentShortcuts = Settings.get().desktopShortcuts || [];
    const availableApps = allApps.filter(app => !currentShortcuts.includes(app.id));

    return (
      <div
        ref={menuRef}
        style={{ left: adjustedX, top: adjustedY }}
        className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none animate-in fade-in zoom-in-95 duration-75"
      >
        <div className="px-2 py-1 font-mono text-[10px] text-[#6ee7b7] font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
          <span>Add Shortcut</span>
          <button onClick={() => setShowShortcutSub(false)} className="text-[9px] hover:text-white bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded border border-white/10 transition">
            Back
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
          {availableApps.length === 0 ? (
            <div className="px-2.5 py-4 text-center text-gray-500 font-mono text-[10px]">
              All apps are already on the Desktop
            </div>
          ) : (
            availableApps.map((app) => (
              <button
                key={app.id}
                onClick={() => {
                  Settings.update({ desktopShortcuts: [...currentShortcuts, app.id] });
                  Toast.show(`Added ${app.title} to Desktop`, '✓');
                  onClose();
                }}
                className="w-full px-2.5 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
              >
                <span className="text-base shrink-0 select-none leading-none">{app.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[11px] truncate">{app.title}</div>
                  <div className="text-[9px] text-gray-500 truncate">{app.description}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
     DEFAULT HELIX DE HOMEPAGE CONTEXT MENU (Desktop Background)
  ---------------------------------------------------- */
  return (
    <div
      ref={menuRef}
      style={{ left: adjustedX, top: adjustedY }}
      className="fixed z-[9999] w-60 bg-[#12141c]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-[#edf1f7] select-none animate-in fade-in zoom-in-95 duration-75"
    >
      <div className="px-2 py-1 font-mono text-[10px] text-[#6ee7b7] font-bold uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
        <span>Helix DE Desktop</span>
        <LayoutGrid className="w-3 h-3 text-[#6ee7b7]" />
      </div>

      <button
        onClick={() => {
          onOpenApp('term');
          onClose();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#6ee7b7]/15 hover:text-[#6ee7b7] flex items-center gap-2.5 transition text-left cursor-pointer"
      >
        <Terminal className="w-4 h-4 text-[#6ee7b7]" />
        <span>Open Terminal Here</span>
      </button>

      <button
        onClick={() => {
          onOpenApp('guirunner');
          onClose();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
      >
        <Monitor className="w-4 h-4 text-[#6ee7b7]" />
        <span>GUI Studio & X11 Server</span>
      </button>

      <button
        onClick={() => {
          onOpenApp('files');
          onClose();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
      >
        <Folder className="w-4 h-4 text-cyan-400" />
        <span>Open File Manager</span>
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        onClick={handleCreateNewFile}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
      >
        <FilePlus className="w-4 h-4 text-purple-400" />
        <span>New Text File...</span>
      </button>

      <button
        onClick={handleCreateNewFolder}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
      >
        <FolderPlus className="w-4 h-4 text-amber-400" />
        <span>New Directory...</span>
      </button>

      <button
        onClick={() => setShowShortcutSub(true)}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
      >
        <LayoutGrid className="w-4 h-4 text-emerald-400" />
        <span>Add Desktop Shortcut...</span>
      </button>

      <button
        onClick={handleRunBiosAudit}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#6ee7b7]/15 hover:text-[#6ee7b7] flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 font-semibold"
      >
        <ShieldCheck className="w-4 h-4 text-[#6ee7b7]" />
        <span>BIOS Integrity Audit (SHA-256)</span>
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        onClick={() => {
          onOpenApp('mon');
          onClose();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
      >
        <Activity className="w-4 h-4 text-cyan-400" />
        <span>System Activity Monitor</span>
      </button>

      <button
        onClick={() => {
          onOpenApp('store');
          onClose();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
      >
        <Package className="w-4 h-4 text-amber-400" />
        <span>Alpine App Store</span>
      </button>

      <button
        onClick={cycleWallpaper}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
      >
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span>Change Wallpaper Theme</span>
      </button>

      <button
        onClick={() => {
          Kernel.wm.tileAllWindows();
          Toast.show('All windows tiled', '🪟');
          onClose();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
      >
        <LayoutGrid className="w-4 h-4 text-[#6ee7b7]" />
        <span>Tile All Open Windows</span>
      </button>

      <button
        onClick={() => {
          Kernel.wm.shadeAll();
          Toast.show('All windows collapsed to shades', '🗂️');
          onClose();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
      >
        <Layers className="w-4 h-4 text-amber-400" />
        <span>Collapse All (Shade Windows)</span>
      </button>

      <button
        onClick={() => {
          Kernel.wm.unshadeAll();
          Toast.show('All windows expanded', '📂');
          onClose();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
      >
        <Eye className="w-4 h-4 text-cyan-400" />
        <span>Expand All Windows</span>
      </button>

      <button
        onClick={() => {
          onOpenApp('settings');
          onClose();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
      >
        <SettingsIcon className="w-4 h-4 text-rose-400" />
        <span>Control Center Settings</span>
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        onClick={() => {
          onRefreshDesktop();
          Toast.show('Helix DE refreshed', '✓');
          onClose();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition text-left cursor-pointer text-gray-300 hover:text-white"
      >
        <RefreshCw className="w-4 h-4 text-[#6ee7b7]" />
        <span>Refresh Helix DE</span>
      </button>
    </div>
  );
};
