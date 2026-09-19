import React, { useState, useEffect } from 'react';
import { Kernel } from '../../kernel';
import { SoundManager } from '../../kernel/SoundManager';
import { TarGzArchiveEngine } from '../../kernel/TarGzArchive';
import { Network, WifiNetworkProfile, NetworkInterfaceInfo } from '../../kernel/NetworkService';
import { 
  Settings as SettingsService, 
  THEME_PRESETS, 
  FREE_THEME_STORE, 
  HelixTheme, 
  FontScale, 
  DisplayScale, 
  PowerProfile, 
  CpuGovernor 
} from '../../kernel/Settings';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Monitor, 
  Cpu, 
  Wifi, 
  Database, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  Sparkles, 
  Sliders, 
  HardDrive,
  Moon,
  Sun,
  Shield,
  Layers,
  Image as ImageIcon,
  Battery,
  BatteryCharging,
  Zap,
  Power,
  Volume2,
  VolumeX,
  Gauge,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Package,
  Globe,
  Smartphone,
  Eye,
  Terminal,
  ShieldCheck,
  FileText,
  Flame,
  Clock,
  Trash2
} from 'lucide-react';
import { fetchAndValidateBiosRom, verifyBiosBufferIntegrity, KNOWN_BIOS_SIGNATURES } from '../../kernel/BiosValidator';

const WALLPAPERS = [
  { id: 'mesh-emerald', name: 'Emerald Obsidian (Default)', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80' },
  { id: 'cyber-dark', name: 'Cyber Carbon', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2000&q=80' },
  { id: 'nord-aurora', name: 'Nord Aurora', url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=2000&q=80' },
  { id: 'deep-nebula', name: 'Deep Cosmic Nebula', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2000&q=80' },
  { id: 'minimal-slate', name: 'Alpine Minimal Slate', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2000&q=80' },
];

const ACCENT_COLORS = [
  { name: 'Emerald', hex: '#6ee7b7' },
  { name: 'Cyan', hex: '#38bdf8' },
  { name: 'Violet', hex: '#c084fc' },
  { name: 'Amber', hex: '#fbbf24' },
  { name: 'Rose', hex: '#fb7185' },
  { name: 'Blue', hex: '#60a5fa' },
  { name: 'Green Phosphor', hex: '#22c55e' },
  { name: 'Yellow Neon', hex: '#fcee0a' },
];

type SettingsTab = 
  | 'appearance' 
  | 'display' 
  | 'dock'
  | 'appmgmt'
  | 'topbar'
  | 'cache'
  | 'power' 
  | 'vm' 
  | 'package' 
  | 'network' 
  | 'backup' 
  | 'diagnostics';

export const SettingsApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [settings, setSettings] = useState(Kernel.settings.get());
  const [hwInfo, setHwInfo] = useState(Kernel.settings.getHardwareInfo());
  const [customWallpaper, setCustomWallpaper] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [diagResults, setDiagResults] = useState<{ name: string; status: 'ok' | 'warn'; detail: string }[] | null>(null);
  const [diagRunning, setDiagRunning] = useState(false);

  // Network tab states
  const [networkState, setNetworkState] = useState({
    isWifiOn: Network.getIsWifiPoweredOn(),
    activeNetwork: Network.getActiveNetwork(),
    networks: Network.getNetworks(),
    wlan: Network.getInterface('wlan0'),
    eth: Network.getInterface('eth0'),
    vpn: Network.getVpnConfig(),
    hotspot: Network.getHotspotConfig(),
  });
  const [pingTarget, setPingTarget] = useState('1.1.1.1');
  const [pingResult, setPingResult] = useState<string[] | null>(null);
  const [pingRunning, setPingRunning] = useState(false);

  const [dnsTarget, setDnsTarget] = useState('alpinelinux.org');
  const [dnsResult, setDnsResult] = useState<{ server: string; addresses: string[]; queryTimeMs: number } | null>(null);
  const [dnsRunning, setDnsRunning] = useState(false);

  // BIOS Audit state
  const [biosAuditResults, setBiosAuditResults] = useState<{ url: string; isValid: boolean; sha256: string; sizeBytes: number; message: string }[] | null>(null);
  const [biosAuditRunning, setBiosAuditRunning] = useState(false);

  const runBiosAudit = async () => {
    setBiosAuditRunning(true);
    const urls = Object.keys(KNOWN_BIOS_SIGNATURES);
    const results = [];
    for (const u of urls) {
      const res = await fetchAndValidateBiosRom(u);
      results.push({
        url: u,
        isValid: res.validation.isValid,
        sha256: res.validation.sha256,
        sizeBytes: res.validation.sizeBytes,
        message: res.validation.message
      });
    }
    setBiosAuditResults(results);
    setBiosAuditRunning(false);
    notify('BIOS ROM & Firmware Integrity Audit Completed');
  };

  useEffect(() => {
    const unsub = Kernel.settings.subscribe((s) => {
      setSettings(s);
      setHwInfo(Kernel.settings.getHardwareInfo());
    });

    const unsubNet = Network.subscribe((net) => {
      setNetworkState({
        isWifiOn: net.getIsWifiPoweredOn(),
        activeNetwork: net.getActiveNetwork(),
        networks: net.getNetworks(),
        wlan: net.getInterface('wlan0'),
        eth: net.getInterface('eth0'),
        vpn: net.getVpnConfig(),
        hotspot: net.getHotspotConfig(),
      });
    });

    return () => {
      unsub();
      unsubNet();
    };
  }, []);

  const notify = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleUpdate = (partial: Partial<typeof settings>) => {
    SoundManager.play('click');
    Kernel.settings.update(partial);
    notify('Settings updated and saved');
  };

  const handleSetWallpaper = (url: string) => {
    SoundManager.play('open');
    Kernel.settings.setWallpaper(url);
    notify('Desktop wallpaper updated');
  };

  const handleCustomWallpaperSubmit = () => {
    if (customWallpaper.trim()) {
      handleSetWallpaper(customWallpaper.trim());
      setCustomWallpaper('');
    }
  };

  const handleExportBackup = async () => {
    const json = Kernel.settings.exportStateJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helix_os_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Helix OS system backup downloaded');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const success = Kernel.settings.importStateJSON(text);
        if (success) {
          notify('System configuration restored successfully');
        } else {
          notify('Failed to parse backup JSON file');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExportTarGz = async () => {
    SoundManager.play('click');
    notify('Packaging entire workspace, settings, and VFS files into .tar.gz archive...');
    try {
      const blob = await TarGzArchiveEngine.exportWorkspaceTarGz();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `helix_workspace_archive_${Date.now()}.tar.gz`;
      a.click();
      URL.revokeObjectURL(url);
      notify('Workspace .tar.gz archive exported successfully!');
    } catch (err: any) {
      notify(`Export error: ${err?.message || err}`);
    }
  };

  const handleImportTarGz = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    SoundManager.play('open');
    notify('Extracting .tar.gz workspace archive...');
    try {
      const res = await TarGzArchiveEngine.importWorkspaceTarGz(file);
      if (res.success) {
        SoundManager.play('success');
        notify(res.message);
      } else {
        SoundManager.play('error');
        notify(res.message);
      }
    } catch (err: any) {
      SoundManager.play('error');
      notify(`Import error: ${err?.message || err}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleFactoryReset = async () => {
    if (window.confirm('Are you sure you want to reset Helix OS to initial factory defaults?')) {
      Kernel.settings.resetToDefaults();
      notify('Helix OS restored to factory default settings');
    }
  };

  const runDiagnostics = async () => {
    setDiagRunning(true);
    setDiagResults(null);
    await new Promise((r) => setTimeout(r, 600));

    const results: { name: string; status: 'ok' | 'warn'; detail: string }[] = [
      { name: 'Helix OS Microkernel', status: 'ok', detail: 'State: Online & JIT Ready' },
      { name: 'Alpine Linux 3.20 Host', status: 'ok', detail: 'POSIX layer & OpenRC active' },
      { name: 'Virtual File System (VFS)', status: 'ok', detail: 'IndexedDB & memory mount synchronized' },
      { name: 'Hardware Battery Sensor', status: hwInfo.batteryLevel !== null ? 'ok' : 'warn', detail: `${hwInfo.batteryLevel ?? 98}% (${hwInfo.isCharging ? 'AC Powered' : 'Discharging'})` },
      { name: 'Display & Safe Areas Fit', status: 'ok', detail: `${window.innerWidth}x${window.innerHeight} viewport with auto-fit` },
      { name: 'Network & RPC Socket', status: hwInfo.isOnline ? 'ok' : 'warn', detail: hwInfo.isOnline ? 'Host gateway online' : 'Offline sandbox mode' },
      { name: 'Package Keeper (APK)', status: 'ok', detail: 'Repository channels connected (18,452 packages)' },
      { name: 'Power Management Subsystem', status: 'ok', detail: `Profile: ${settings.powerProfile} • Governor: ${settings.cpuGovernor}` },
    ];
    setDiagResults(results);
    setDiagRunning(false);
    notify('Diagnostic self-test completed');
  };

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'display', label: 'Display & Scaling', icon: Monitor },
    { id: 'dock', label: 'Dock & Bottom Bar', icon: Layers },
    { id: 'appmgmt', label: 'Apps & Recycle Bin', icon: Trash2 },
    { id: 'topbar', label: 'Top Bar & Menubar', icon: Sliders },
    { id: 'cache', label: 'VFS & BIOS Firmware', icon: ShieldCheck },
    { id: 'power', label: 'Power & Battery', icon: Zap },
    { id: 'vm', label: 'Linux & VM Engine', icon: Cpu },
    { id: 'package', label: 'Packages & APK', icon: Package },
    { id: 'network', label: 'Network & Audio', icon: Wifi },
    { id: 'backup', label: 'Storage & Backup', icon: Database },
    { id: 'diagnostics', label: 'System Diagnostics', icon: Activity },
  ];

  const currentTheme = Kernel.settings.getActiveTheme();

  return (
    <div className="h-full flex flex-col bg-[#0b0d14] text-[#edf1f7] text-xs select-none overflow-hidden relative">
      {/* Top Header */}
      <div className="p-3 bg-[#11131c] border-b border-white/10 flex items-center justify-between gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/30">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">System Settings & Configuration</h2>
            <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
              <span>Helix OS v6.5 Pro</span>
              <span>•</span>
              <span className="text-[#6ee7b7] font-semibold">Alpine Linux 3.20</span>
              <span>•</span>
              <span>{hwInfo.cpuCores} vCPUs</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => Kernel.settings.toggleDarkMode()}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-1.5 transition text-xs font-medium"
          >
            {settings.darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
            <span>{settings.darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left Navigation Tabs */}
        <div className="w-full md:w-52 bg-[#0e1017] border-b md:border-b-0 md:border-r border-white/10 p-2 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left whitespace-nowrap transition cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/30 font-bold'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#6ee7b7]' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="mt-auto pt-3 border-t border-white/10 hidden md:block">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-[10px] text-gray-400 space-y-1">
              <div className="font-semibold text-gray-300">Live Hardware Link</div>
              <div>Battery: {hwInfo.batteryLevel ?? 98}% {hwInfo.isCharging ? '⚡' : ''}</div>
              <div>Display: {window.innerWidth}x{window.innerHeight}</div>
            </div>
          </div>
        </div>

        {/* Right Scrollable Content Pane */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* TAB 1: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="max-w-3xl space-y-6">
              {/* Theme Presets */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">Theme Presets</h3>
                    <p className="text-[11px] text-gray-400">Select an integrated color theme or install free store themes</p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#6ee7b7]/20 text-[#6ee7b7] font-semibold">
                    {currentTheme.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {THEME_PRESETS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => Kernel.settings.setTheme(t.id)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                        settings.themeId === t.id
                          ? 'bg-white/10 border-[#6ee7b7] ring-1 ring-[#6ee7b7]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.accent }} />
                          <span>{t.name}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 line-clamp-1">{t.description}</div>
                      </div>
                      {settings.themeId === t.id && <Check className="w-4 h-4 text-[#6ee7b7] shrink-0" />}
                    </button>
                  ))}
                </div>

                {/* Free Themes Store */}
                <div className="pt-3 border-t border-white/10">
                  <h4 className="font-semibold text-xs text-gray-300 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Free Community Themes Catalog</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FREE_THEME_STORE.map((ft) => (
                      <div
                        key={ft.id}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-xs text-white">{ft.name}</div>
                          <div className="text-[10px] text-gray-400 line-clamp-1">{ft.description}</div>
                        </div>
                        <button
                          onClick={() => Kernel.settings.installFreeTheme(ft)}
                          className="px-2.5 py-1 rounded-lg bg-[#6ee7b7] text-black font-semibold text-[10px] hover:bg-[#5eead4] transition shrink-0"
                        >
                          {settings.themeId === ft.id ? 'Applied' : 'Apply Free'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Accent Colors */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-3">
                <h3 className="font-bold text-white text-sm">System Accent Color</h3>
                <div className="flex flex-wrap gap-2.5">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => handleUpdate({ accentColorHex: c.hex })}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                    >
                      <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
                      <span className="text-xs text-white">{c.name}</span>
                      {settings.accentColorHex === c.hex && <Check className="w-3 h-3 text-[#6ee7b7]" />}
                    </button>
                  ))}
                  
                  {/* Custom Color Input */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5">
                    <span className="text-xs text-gray-400">Custom:</span>
                    <input
                      type="color"
                      value={settings.accentColorHex || '#6ee7b7'}
                      onChange={(e) => handleUpdate({ accentColorHex: e.target.value })}
                      className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>
              </div>

              {/* Wallpapers */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-3">
                <h3 className="font-bold text-white text-sm">Desktop Wallpapers</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {WALLPAPERS.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => handleSetWallpaper(w.url)}
                      className="group relative rounded-xl overflow-hidden border border-white/10 aspect-video text-left"
                    >
                      <img
                        src={w.url}
                        alt={w.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                        <span className="text-[10px] font-semibold text-white truncate">{w.name}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter custom image URL for wallpaper..."
                    value={customWallpaper}
                    onChange={(e) => setCustomWallpaper(e.target.value)}
                    className="flex-1 bg-[#0d0f18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#6ee7b7]"
                  />
                  <button
                    onClick={handleCustomWallpaperSubmit}
                    className="px-4 py-2 rounded-xl bg-[#6ee7b7] text-black font-semibold text-xs hover:bg-[#5eead4] transition"
                  >
                    Set URL
                  </button>
                </div>

                {/* Wallpaper Scale Style */}
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <label className="text-xs text-gray-300 font-semibold">Wallpaper Style / Fitting Mode</label>
                  <select
                    value={settings.wallpaperStyle || 'cover'}
                    onChange={(e) => handleUpdate({ wallpaperStyle: e.target.value as any })}
                    className="w-full bg-[#0d0f18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6ee7b7]"
                  >
                    <option value="cover">Cover (Fill screen, crop edges if needed)</option>
                    <option value="contain">Contain (Fit on screen, preserve aspect ratio)</option>
                    <option value="stretch">Stretch (Fill screen exactly, ignore aspect ratio)</option>
                    <option value="tile">Tile (Repeat image in grid pattern)</option>
                  </select>
                </div>
              </div>

              {/* Dock and UI Controls */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <h3 className="font-bold text-white text-sm">Dock & Visual FX</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold">Dock Position</label>
                    <select
                      value={settings.dockPosition}
                      onChange={(e) => handleUpdate({ dockPosition: e.target.value as any })}
                      className="w-full bg-[#0d0f18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="bottom">Bottom Edge (Standard)</option>
                      <option value="top">Top Edge (Menubar Overlay)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold">Dock Sizing</label>
                    <select
                      value={settings.dockSize}
                      onChange={(e) => handleUpdate({ dockSize: e.target.value as any })}
                      className="w-full bg-[#0d0f18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="compact">Compact (Mobile Optimized)</option>
                      <option value="normal">Normal (Default)</option>
                      <option value="large">Large (High Res)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">High-Contrast Dark Theme</div>
                      <div className="text-[10px] text-gray-400">Enforces sharp high-contrast dark palette and vivid accents across all UI elements</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.highContrast ?? false}
                      onChange={(e) => handleUpdate({ highContrast: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Glassmorphism & Background Blur</div>
                      <div className="text-[10px] text-gray-400">Adds frosted glass blur backdrop on all window frames</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableBlur}
                      onChange={(e) => handleUpdate({ enableBlur: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Window Motion Animations</div>
                      <div className="text-[10px] text-gray-400">Smooth spring animations for opening, snapping, and closing</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableAnimations}
                      onChange={(e) => handleUpdate({ enableAnimations: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Desktop Shortcuts Control Panel */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div>
                  <h3 className="font-bold text-white text-sm">Desktop App Shortcuts</h3>
                  <p className="text-[11px] text-gray-400">Toggle which application shortcuts are pinned directly to the desktop layer</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {Kernel.apps.getAll().map((app) => {
                    const isPinned = (settings.desktopShortcuts || []).includes(app.id);
                    return (
                      <div 
                        key={app.id} 
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg leading-none select-none">{app.icon}</span>
                          <span className="font-semibold text-white truncate text-xs">{app.title}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isPinned}
                          onChange={(e) => {
                            const list = settings.desktopShortcuts || [];
                            const nextList = e.target.checked 
                              ? [...list, app.id] 
                              : list.filter(id => id !== app.id);
                            handleUpdate({ desktopShortcuts: nextList });
                          }}
                          className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DISPLAY, FONT & SCALING */}
          {activeTab === 'display' && (
            <div className="max-w-3xl space-y-6">
              {/* Screen Metrics Summary */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Screen & Resolution Metrics</h3>
                    <p className="text-[11px] text-gray-400 font-mono">
                      Viewport: {window.innerWidth}x{window.innerHeight} px • DPR: {window.devicePixelRatio || 1}x • {hwInfo.orientation}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Auto-Fit Active
                </span>
              </div>

              {/* Global Font Scaling */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div>
                  <h3 className="font-bold text-white text-sm">Global Font Scaling</h3>
                  <p className="text-[11px] text-gray-400">
                    Dynamically scale typography across all desktop windows, apps, dialogs, and terminal controls
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'xs', label: 'Extra Small', ratio: '85%' },
                    { id: 'sm', label: 'Small', ratio: '92%' },
                    { id: 'md', label: 'Standard', ratio: '100%' },
                    { id: 'lg', label: 'Large', ratio: '108%' },
                    { id: 'xl', label: 'Extra Large', ratio: '118%' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => Kernel.settings.setFontScale(f.id as FontScale)}
                      className={`p-3 rounded-xl border text-center transition ${
                        settings.fontScale === f.id
                          ? 'bg-[#6ee7b7]/15 border-[#6ee7b7] text-white font-bold'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xs font-semibold">{f.label}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{f.ratio}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Zoom Scale */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div>
                  <h3 className="font-bold text-white text-sm">UI Display Scale (Zoom Factor)</h3>
                  <p className="text-[11px] text-gray-400">
                    Adjust interface proportions for high-DPI retina displays or smaller mobile phone screens
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['80%', '90%', '100%', '110%', '125%'] as DisplayScale[]).map((ds) => (
                    <button
                      key={ds}
                      onClick={() => Kernel.settings.setDisplayScale(ds)}
                      className={`p-3 rounded-xl border text-center transition ${
                        settings.displayScale === ds
                          ? 'bg-[#6ee7b7]/15 border-[#6ee7b7] text-white font-bold'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-sm font-bold">{ds}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {ds === '100%' ? 'Default' : ds === '80%' ? 'Compact' : 'Expanded'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Window Snapping & Accessibility */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-3">
                <h3 className="font-bold text-white text-sm">Screen Fitting & Window Snapping</h3>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Auto-Fit Windows on Screen Resize</div>
                      <div className="text-[10px] text-gray-400">Automatically refits and clamps windows when device rotates or viewport shrinks</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoFitDisplay}
                      onChange={(e) => handleUpdate({ autoFitDisplay: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Device Safe Area Insets (iPhone & Notch Support)</div>
                      <div className="text-[10px] text-gray-400">Pads menubar and dock to avoid camera cutouts and home indicators</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableSafeAreas}
                      onChange={(e) => handleUpdate({ enableSafeAreas: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">High Contrast Accessibility Mode</div>
                      <div className="text-[10px] text-gray-400">Enhances element borders and text contrast for maximum visibility</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.highContrast}
                      onChange={(e) => handleUpdate({ highContrast: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Window Edge Snapping</div>
                      <div className="text-[10px] text-gray-400">Snaps moving windows to viewport edges and adjacent window bounds</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoSnapWindows}
                      onChange={(e) => handleUpdate({ autoSnapWindows: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DOCK & BOTTOM BAR */}
          {activeTab === 'dock' && (
            <div className="max-w-3xl space-y-6">
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div>
                  <h3 className="font-bold text-white text-sm">Dock Bar Position & Layout</h3>
                  <p className="text-[11px] text-gray-400">Choose screen edge attachment and sizing options for the desktop Dock</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1.5">Dock Screen Position</label>
                    <select
                      value={settings.dockPosition || 'bottom'}
                      onChange={(e) => handleUpdate({ dockPosition: e.target.value as any })}
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      <option value="bottom">Bottom Edge (Standard Desktop)</option>
                      <option value="top">Top Edge (Integrated Bar)</option>
                      <option value="left">Left Edge (Ubuntu / GNOME Dock)</option>
                      <option value="right">Right Edge (Vertical Panel)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1.5">Dock Icon Size</label>
                    <select
                      value={settings.dockIconSize || 'medium'}
                      onChange={(e) => handleUpdate({ dockIconSize: e.target.value as any })}
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      <option value="small">Compact (32px)</option>
                      <option value="medium">Standard (48px)</option>
                      <option value="large">Spacious (64px)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Auto-Hide Dock Bar</div>
                      <div className="text-[10px] text-gray-400">Automatically collapse Dock when windows overlap or screen space is constrained</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.dockAutoHide || false}
                      onChange={(e) => handleUpdate({ dockAutoHide: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Active App Indicators</div>
                      <div className="text-[10px] text-gray-400">Display glowing green dot underneath currently running applications</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.dockShowActiveIndicators ?? true}
                      onChange={(e) => handleUpdate({ dockShowActiveIndicators: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Icon Hover Magnification</div>
                      <div className="text-[10px] text-gray-400">Smooth zoom magnification effect when hovering over Dock icons</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.dockMagnification ?? true}
                      onChange={(e) => handleUpdate({ dockMagnification: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB: APP MANAGEMENT, PYTHON & RECYCLE BIN */}
          {activeTab === 'appmgmt' && (
            <div className="max-w-3xl space-y-6">
              {/* Python Language Engine Settings */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="text-lg">🐍</span> Python Standard Language Engine
                  </h3>
                  <p className="text-[11px] text-gray-400">Configure default execution backend for running Python scripts, apps, and games</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1.5">Execution Engine Backend</label>
                    <select
                      value={settings.pythonExecutionEngine || 'kernel'}
                      onChange={(e) => handleUpdate({ pythonExecutionEngine: e.target.value as any })}
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      <option value="kernel">Helix Alpine Linux Kernel (/usr/bin/python3)</option>
                      <option value="wasm">Embedded Pyodide WASM Runtime (Client JIT)</option>
                      <option value="hybrid">Hybrid Auto-Select (Kernel primary, WASM fallback)</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Auto-Load Scientific Libraries</div>
                      <div className="text-[10px] text-gray-400">Pre-import NumPy, SymPy, and Matplotlib in Python REPL environment</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.pythonAutoImportNumpy ?? true}
                      onChange={(e) => handleUpdate({ pythonAutoImportNumpy: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Uninstalled Apps & Reinstallation Studio */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-400" /> App Lifecycle & Uninstalled Applications
                  </h3>
                  <p className="text-[11px] text-gray-400">Reinstall previously uninstalled applications or manage app installation state</p>
                </div>

                {(settings.uninstalledAppIds || []).length === 0 ? (
                  <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-center text-gray-500 italic">
                    All system applications are currently installed and active.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {(settings.uninstalledAppIds || []).map((appId) => {
                      const appDef = Kernel.apps.get(appId as any);
                      return (
                        <div
                          key={appId}
                          className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{appDef?.icon || '📦'}</span>
                            <div>
                              <div className="font-bold text-white">{appDef?.title || appId}</div>
                              <div className="text-[10px] text-gray-400">Status: Uninstalled (In Trash)</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                SoundManager.play('success');
                                const current = settings.uninstalledAppIds || [];
                                handleUpdate({ uninstalledAppIds: current.filter((id) => id !== appId) });
                                notify(`Reinstalled ${appDef?.title || appId} successfully`);
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition cursor-pointer"
                            >
                              Reinstall App
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Trash & Recycle Bin Quota */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-400" /> Trash & Recycle Bin Settings
                  </h3>
                  <p className="text-[11px] text-gray-400">Configure auto-cleanup cycles and confirmation preferences for deleted items</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1.5">Auto-Empty Frequency</label>
                    <select
                      value={settings.trashAutoEmptyDays || 30}
                      onChange={(e) => handleUpdate({ trashAutoEmptyDays: Number(e.target.value) })}
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      <option value={7}>After 7 Days</option>
                      <option value={14}>After 14 Days</option>
                      <option value={30}>After 30 Days (Standard)</option>
                      <option value={0}>Never Auto-Empty (Manual Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1.5">Trash Storage Capacity</label>
                    <select
                      value={settings.trashMaxCapacityMb || 256}
                      onChange={(e) => handleUpdate({ trashMaxCapacityMb: Number(e.target.value) })}
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      <option value={128}>128 MB Limit</option>
                      <option value={256}>256 MB Limit (Default)</option>
                      <option value={512}>512 MB Limit</option>
                      <option value={1024}>1 GB Limit</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'topbar' && (
            <div className="max-w-3xl space-y-6">
              {/* Header */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/30">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Top Bar & Menubar Customization</h3>
                    <p className="text-[11px] text-gray-400">
                      Toggle top bar modules, configure clock preferences, and customize status bar items
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUpdate({
                    topbarShowOsBadge: true,
                    topbarShowShellButton: true,
                    topbarShowActivityButton: true,
                    topbarShowSettingsButton: true,
                    topbarShowZenButton: true,
                    topbarShowPwaInstall: true,
                    topbarShowBattery: true,
                    topbarShowWifi: true,
                    topbarShowQuickSettings: true,
                    topbarShowLinuxStatus: true,
                    topbarShowNotificationBell: true,
                    topbarClockFormat: '12h',
                    topbarShowClockSeconds: false,
                  })}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 transition"
                >
                  Reset Top Bar Defaults
                </button>
              </div>

              {/* Elements Toggles Grid */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-gray-400">
                  Visible Header Modules & Controls
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                    <div>
                      <div className="font-semibold text-white text-xs">Active OS & Kernel Badge</div>
                      <div className="text-[10px] text-gray-400">Displays active distro name & profile switcher trigger</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.topbarShowOsBadge ?? true}
                      onChange={(e) => handleUpdate({ topbarShowOsBadge: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                    <div>
                      <div className="font-semibold text-white text-xs">Terminal Shell Quick Launcher</div>
                      <div className="text-[10px] text-gray-400">Shell icon for instant terminal window access</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.topbarShowShellButton ?? true}
                      onChange={(e) => handleUpdate({ topbarShowShellButton: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                    <div>
                      <div className="font-semibold text-white text-xs">Activity Monitor Launcher</div>
                      <div className="text-[10px] text-gray-400">System task manager & memory usage indicator</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.topbarShowActivityButton ?? true}
                      onChange={(e) => handleUpdate({ topbarShowActivityButton: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                    <div>
                      <div className="font-semibold text-white text-xs">Settings Quick Button</div>
                      <div className="text-[10px] text-gray-400">Top bar launcher button for System Settings</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.topbarShowSettingsButton ?? true}
                      onChange={(e) => handleUpdate({ topbarShowSettingsButton: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                    <div>
                      <div className="font-semibold text-white text-xs">Zen / Screen Space Maximizer</div>
                      <div className="text-[10px] text-gray-400">Compact layout toggle for small displays</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.topbarShowZenButton ?? true}
                      onChange={(e) => handleUpdate({ topbarShowZenButton: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                    <div>
                      <div className="font-semibold text-white text-xs">In-App PWA Install Button</div>
                      <div className="text-[10px] text-gray-400">One-click PWA desktop app installation banner</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.topbarShowPwaInstall ?? true}
                      onChange={(e) => handleUpdate({ topbarShowPwaInstall: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                    <div>
                      <div className="font-semibold text-white text-xs">Battery Status Sensor</div>
                      <div className="text-[10px] text-gray-400">Live hardware battery level & power status</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.topbarShowBattery ?? true}
                      onChange={(e) => handleUpdate({ topbarShowBattery: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                    <div>
                      <div className="font-semibold text-white text-xs">Wi-Fi Network Indicator & Flyout</div>
                      <div className="text-[10px] text-gray-400">Wireless network status and fast connection menu</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.topbarShowWifi ?? true}
                      onChange={(e) => handleUpdate({ topbarShowWifi: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                    <div>
                      <div className="font-semibold text-white text-xs">Quick Control Center</div>
                      <div className="text-[10px] text-gray-400">Sliders button to pop out system control center</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.topbarShowQuickSettings ?? true}
                      onChange={(e) => handleUpdate({ topbarShowQuickSettings: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                    <div>
                      <div className="font-semibold text-white text-xs">Linux Guest Kernel Pulse Dot</div>
                      <div className="text-[10px] text-gray-400">Live status indicator for guest kernel</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.topbarShowLinuxStatus ?? true}
                      onChange={(e) => handleUpdate({ topbarShowLinuxStatus: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                    <div>
                      <div className="font-semibold text-white text-xs">Notification Center Bell</div>
                      <div className="text-[10px] text-gray-400">Unread notifications count & alert pulse icon</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.topbarShowNotificationBell ?? true}
                      onChange={(e) => handleUpdate({ topbarShowNotificationBell: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                    />
                  </label>
                </div>
              </div>

              {/* System Clock Preferences */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-bold text-white text-sm">System Clock & Time Display Format</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <div className="font-semibold text-white text-xs">Time Format</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdate({ topbarClockFormat: '12h' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          settings.topbarClockFormat !== '24h'
                            ? 'bg-[#6ee7b7] text-black'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        12-Hour (1:30 PM)
                      </button>
                      <button
                        onClick={() => handleUpdate({ topbarClockFormat: '24h' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          settings.topbarClockFormat === '24h'
                            ? 'bg-[#6ee7b7] text-black'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        24-Hour (13:30)
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                    <div>
                      <div className="font-semibold text-white text-xs">Show Seconds Count</div>
                      <div className="text-[10px] text-gray-400">Include live seconds timer in header clock</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.topbarShowClockSeconds ?? false}
                      onChange={(e) => handleUpdate({ topbarShowClockSeconds: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2.6: VFS & BIOS FIRMWARE INTEGRITY */}
          {activeTab === 'cache' && (
            <div className="max-w-3xl space-y-6">
              {/* Header */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">VFS Storage & BIOS Firmware Integrity</h3>
                    <p className="text-[11px] text-gray-400">
                      Persistent Virtual File System storage parameters and SHA-256 BIOS ROM verification
                    </p>
                  </div>
                </div>

                <button
                  onClick={runBiosAudit}
                  disabled={biosAuditRunning}
                  className="px-4 py-2 rounded-xl bg-[#6ee7b7] hover:bg-[#5eead4] text-black font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${biosAuditRunning ? 'animate-spin' : ''}`} />
                  <span>{biosAuditRunning ? 'Auditing ROMs...' : 'Run BIOS Integrity Audit'}</span>
                </button>
              </div>

              {/* Safety Toggles */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-gray-400">
                  Storage & Boot Protection Controls
                </h4>

                <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                  <div>
                    <div className="font-semibold text-white text-xs">Verify SHA-256 BIOS ROM Integrity Before VM Boot</div>
                    <div className="text-[10px] text-gray-400">Verifies binary signatures and magic bytes of x86 ROMs before launch</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.biosIntegrityValidationOnBoot ?? true}
                    onChange={(e) => handleUpdate({ biosIntegrityValidationOnBoot: e.target.checked })}
                    className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                  <div>
                    <div className="font-semibold text-white text-xs">Prioritize Persistent VFS File Storage</div>
                    <div className="text-[10px] text-gray-400">Prevents browser auto-eviction of user VFS files and OS disks</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.prioritizeVfsStorage ?? true}
                    onChange={(e) => handleUpdate({ prioritizeVfsStorage: e.target.checked })}
                    className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition">
                  <div>
                    <div className="font-semibold text-white text-xs">Automatic Service Worker Cache Reload</div>
                    <div className="text-[10px] text-gray-400">Attempts automatic SW reload if firmware network fetch is corrupted</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.swAutoReloadOnCorruption ?? true}
                    onChange={(e) => handleUpdate({ swAutoReloadOnCorruption: e.target.checked })}
                    className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer shrink-0"
                  />
                </label>
              </div>

              {/* Audit Results Panel */}
              {biosAuditResults && (
                <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-3">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#6ee7b7]" />
                    <span>Firmware Verification Report</span>
                  </h4>

                  <div className="space-y-2">
                    {biosAuditResults.map((r, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-white text-xs font-mono">{r.url}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            SHA-256: {r.sha256 ? `${r.sha256.substring(0, 24)}...` : 'N/A'} • {r.sizeBytes > 0 ? `${(r.sizeBytes / 1024).toFixed(1)} KB` : 'Embedded fallback'}
                          </div>
                          <div className="text-[10px] text-gray-300">{r.message}</div>
                        </div>

                        <span
                          className={`self-start sm:self-center text-[10px] px-2.5 py-1 rounded-md font-bold font-mono uppercase shrink-0 ${
                            r.isValid
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {r.isValid ? 'VALIDATED' : 'WARNING'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: POWER & BATTERY CONTROL */}
          {activeTab === 'power' && (
            <div className="max-w-3xl space-y-6">
              {/* Real Battery Status Header */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {hwInfo.isCharging ? <BatteryCharging className="w-5 h-5" /> : <Battery className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Real Device Hardware Battery Sensor</h3>
                    <p className="text-[11px] text-gray-400">
                      Level: <span className="text-white font-bold">{hwInfo.batteryLevel ?? 98}%</span> •{' '}
                      Status: <span className="text-[#6ee7b7] font-semibold">{hwInfo.isCharging ? 'Charging (AC Adapter)' : 'On Battery'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/10 font-mono">
                    /sys/class/power_supply/BAT0
                  </span>
                </div>
              </div>

              {/* Power Profile Mode */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div>
                  <h3 className="font-bold text-white text-sm">Helix Power Mode</h3>
                  <p className="text-[11px] text-gray-400">
                    Controls virtual clock governor, background telemetry intervals, and CPU throttling
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'performance', name: 'Performance Mode', desc: 'Maximum JIT speed and unrestricted IPC throughput', icon: Flame, color: 'text-rose-400' },
                    { id: 'balanced', name: 'Balanced (Default)', desc: 'Dynamic CPU scaling with optimal battery efficiency', icon: Zap, color: 'text-amber-400' },
                    { id: 'powersave', name: 'Power Saver', desc: 'Preserves device battery life and reduces background polling', icon: Battery, color: 'text-emerald-400' },
                    { id: 'eco', name: 'Eco Ultra', desc: 'Aggressive energy saving with minimal UI animations', icon: ShieldCheck, color: 'text-cyan-400' },
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        onClick={() => Kernel.settings.setPowerProfile(p.id as PowerProfile)}
                        className={`p-3.5 rounded-xl border text-left flex items-start justify-between transition ${
                          settings.powerProfile === p.id
                            ? 'bg-white/10 border-[#6ee7b7] ring-1 ring-[#6ee7b7]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <Icon className={`w-4 h-4 mt-0.5 ${p.color}`} />
                          <div>
                            <div className="font-bold text-xs text-white">{p.name}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{p.desc}</div>
                          </div>
                        </div>
                        {settings.powerProfile === p.id && <Check className="w-4 h-4 text-[#6ee7b7] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Power Governors & Auto-Dim */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-3">
                <h3 className="font-bold text-white text-sm">Governor & Battery Protection</h3>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold">Virtual CPU Governor</label>
                    <select
                      value={settings.cpuGovernor}
                      onChange={(e) => handleUpdate({ cpuGovernor: e.target.value as CpuGovernor })}
                      className="w-full bg-[#0d0f18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="ondemand">ondemand (Dynamic clock scaling)</option>
                      <option value="performance">performance (Full 2.4 GHz lock)</option>
                      <option value="powersave">powersave (Low frequency throttle)</option>
                      <option value="conservative">conservative (Smooth gradual scaling)</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Auto Power-Saver on Low Battery (≤20%)</div>
                      <div className="text-[10px] text-gray-400">Automatically engages Power Saver mode when device battery drops below threshold</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoDimOnLowBattery}
                      onChange={(e) => handleUpdate({ autoDimOnLowBattery: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Synchronize Real Host Battery into Linux /proc & /sys</div>
                      <div className="text-[10px] text-gray-400">Exposes actual device battery values to CLI commands (acpi, tlp, sensors)</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.realDeviceBatterySync}
                      onChange={(e) => handleUpdate({ realDeviceBatterySync: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Sophisticated Power & System Lifecycle Controls */}
              <div className="p-5 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div>
                  <h3 className="font-bold text-white text-sm">Advanced System Power Controls</h3>
                  <p className="text-[11px] text-gray-400">
                    Manage the lifecycle states of both the underlying Alpine Linux MicroVM and the Helix Desktop Environment (Compositor)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Alpine VM Card */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Alpine Linux MicroVM</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                        Control the lifecycle of the host Alpine x86_64 virtualization layer running OpenRC & musl libc.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={async () => {
                          SoundManager.play('click');
                          notify('Rebooting Alpine Linux MicroVM...');
                          Kernel.vm.stop();
                          await new Promise(r => setTimeout(r, 800));
                          await Kernel.vm.start();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 flex items-center gap-1.5 font-bold text-[10px] transition cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reboot VM</span>
                      </button>
                      <button
                        onClick={() => {
                          SoundManager.play('click');
                          notify('Halt sequence initiated...');
                          Kernel.vm.stop();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 flex items-center gap-1.5 font-bold text-[10px] transition cursor-pointer"
                      >
                        <Power className="w-3 h-3" />
                        <span>Halt / Poweroff</span>
                      </button>
                    </div>
                  </div>

                  {/* Helix DE Card */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span>Helix Desktop Environment</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                        Control the graphical desktop layer, compositor server, and application state managers.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => {
                          SoundManager.play('click');
                          notify('Restarting Helix compositor...');
                          setTimeout(() => window.location.reload(), 600);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 flex items-center gap-1.5 font-bold text-[10px] transition cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Restart Desktop</span>
                      </button>
                      <button
                        onClick={() => {
                          SoundManager.play('click');
                          notify('Suspending system services...');
                          Kernel.vm.executeCommand('systemctl suspend');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 flex items-center gap-1.5 font-bold text-[10px] transition cursor-pointer"
                      >
                        <Moon className="w-3 h-3" />
                        <span>Suspend Session</span>
                      </button>
                    </div>
                  </div>

                  {/* Unified Controls Card */}
                  <div className="p-4 rounded-xl bg-[#1e1c15] border border-amber-500/10 space-y-3 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Unified Full-System Actions</span>
                        </div>
                        <p className="text-[10px] text-gray-300 mt-1 leading-relaxed">
                          Synchronize power operations across both Alpine Linux and the Helix window manager for complete system cycles.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5 pt-1.5 border-t border-amber-500/5">
                      <button
                        onClick={async () => {
                          SoundManager.play('click');
                          notify('Initiating complete cold reboot...');
                          Kernel.vm.stop();
                          await new Promise(r => setTimeout(r, 600));
                          window.location.reload();
                        }}
                        className="px-3 py-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400 flex items-center gap-1.5 font-bold text-xs transition cursor-pointer shadow-md shadow-amber-500/5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restart Both Systems</span>
                      </button>
                      <button
                        onClick={() => {
                          SoundManager.play('click');
                          notify('Unified shutdown sequence active...');
                          Kernel.vm.stop();
                        }}
                        className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white flex items-center gap-1.5 font-bold text-xs transition cursor-pointer shadow-md shadow-red-500/5"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>Shut Down Both Systems</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LINUX & VM ENGINE */}
          {activeTab === 'vm' && (
            <div className="max-w-3xl space-y-6">
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/30">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Alpine Linux Host Virtualization</h3>
                    <p className="text-[11px] text-gray-400 font-mono">Kernel 6.6.14-virt • OpenRC • musl libc</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold">Virtual RAM Allocation</label>
                    <select
                      value={settings.vmMemoryMB}
                      onChange={(e) => handleUpdate({ vmMemoryMB: parseInt(e.target.value) })}
                      className="w-full bg-[#0d0f18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value={128}>128 MB (Lightweight)</option>
                      <option value={256}>256 MB (Standard Recommended)</option>
                      <option value={512}>512 MB (High Performance)</option>
                      <option value={1024}>1024 MB (Maximum JIT Heap)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold">Virtual CPU Allocation</label>
                    <select
                      value={settings.vmCores}
                      onChange={(e) => handleUpdate({ vmCores: parseInt(e.target.value) })}
                      className="w-full bg-[#0d0f18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value={1}>1 Core (Single-threaded)</option>
                      <option value={2}>2 Cores (Recommended SMP)</option>
                      <option value={4}>4 Cores (Quad-Core JIT)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Virtio 9P Shared Host Mount (/mnt/helix)</div>
                      <div className="text-[10px] text-gray-400">Bidirectional filesystem sync between browser VFS and Alpine Linux</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.sharedMountEnabled}
                      onChange={(e) => handleUpdate({ sharedMountEnabled: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Auto-launch Terminal on Desktop Boot</div>
                      <div className="text-[10px] text-gray-400">Opens the interactive Alpine terminal upon startup</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoStartTerminal}
                      onChange={(e) => handleUpdate({ autoStartTerminal: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Terminal Customization */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <h3 className="font-bold text-white text-sm">Terminal Font & Appearance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold">Terminal Font Size (px)</label>
                    <input
                      type="number"
                      min={10}
                      max={20}
                      value={settings.terminalFontSize}
                      onChange={(e) => handleUpdate({ terminalFontSize: parseInt(e.target.value) || 13 })}
                      className="w-full bg-[#0d0f18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold">Cursor Shape</label>
                    <select
                      value={settings.terminalCursor}
                      onChange={(e) => handleUpdate({ terminalCursor: e.target.value as any })}
                      className="w-full bg-[#0d0f18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="block">Solid Block (█)</option>
                      <option value="underline">Underline (_)</option>
                      <option value="bar">Vertical Bar (|)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PACKAGES & APK */}
          {activeTab === 'package' && (
            <div className="max-w-3xl space-y-6">
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/30">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Alpine Package Keeper (APK) Settings</h3>
                    <p className="text-[11px] text-gray-400">Configure package repository URLs, caching, and auto-updates</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-300 font-semibold">Active Repository URL</label>
                  <input
                    type="text"
                    value={settings.apkMirrorUrl}
                    onChange={(e) => handleUpdate({ apkMirrorUrl: e.target.value })}
                    className="w-full bg-[#0d0f18] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Enable Community Repositories</div>
                      <div className="text-[10px] text-gray-400">Allows installation of extended developer tools and language engines</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableCommunityRepo}
                      onChange={(e) => handleUpdate({ enableCommunityRepo: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Enable Edge Testing Repositories</div>
                      <div className="text-[10px] text-gray-400">Access experimental package builds and prerelease dependencies</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableTestingRepo}
                      onChange={(e) => handleUpdate({ enableTestingRepo: e.target.checked })}
                      className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                    />
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                  <button
                    onClick={() => {
                      Kernel.wm.launch('store');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#6ee7b7] text-black font-semibold text-xs hover:bg-[#5eead4] transition"
                  >
                    Open Package Keeper App
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: NETWORK & AUDIO */}
          {activeTab === 'network' && (
            <div className="max-w-3xl space-y-6">
              {/* Wi-Fi Interface wlan0 */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/30">
                      <Wifi className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <span>Wireless LAN (wlan0)</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${networkState.isWifiOn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-400'}`}>
                          {networkState.isWifiOn ? 'UP • RUNNING' : 'DOWN'}
                        </span>
                      </h3>
                      <p className="text-[11px] text-gray-400 font-mono">
                        Driver: mac80211_hwsim • Mode: IEEE 802.11ax Wi-Fi 6
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={networkState.isWifiOn}
                      onChange={(e) => Network.setWifiPower(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6ee7b7]" />
                  </label>
                </div>

                {networkState.isWifiOn ? (
                  <div className="space-y-4">
                    {/* Active Wi-Fi Telemetry */}
                    {networkState.activeNetwork ? (
                      <div className="p-3.5 rounded-xl bg-black/40 border border-[#6ee7b7]/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-400">Connected Access Point</div>
                            <div className="font-bold text-emerald-400 text-sm">{networkState.activeNetwork.ssid}</div>
                          </div>
                          <button
                            onClick={() => Network.disconnectNetwork()}
                            className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-semibold transition cursor-pointer"
                          >
                            Disconnect
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono">
                          <div className="p-2 rounded-lg bg-white/5">
                            <span className="text-gray-400 block text-[10px]">IPv4 Address</span>
                            <span className="text-white font-semibold">{networkState.wlan.ipv4}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white/5">
                            <span className="text-gray-400 block text-[10px]">Signal Strength</span>
                            <span className="text-[#6ee7b7] font-semibold">{networkState.activeNetwork.rssi} dBm ({networkState.activeNetwork.signal}%)</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white/5">
                            <span className="text-gray-400 block text-[10px]">Band / Channel</span>
                            <span className="text-white">{networkState.activeNetwork.band} (Ch {networkState.activeNetwork.channel})</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white/5">
                            <span className="text-gray-400 block text-[10px]">PHY Link Speed</span>
                            <span className="text-white">{networkState.activeNetwork.speedMbps} Mbps</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-black/20 border border-white/5 text-gray-400 text-xs text-center">
                        Not connected to any Wi-Fi network. Select an SSID below or scan channels.
                      </div>
                    )}

                    {/* Wi-Fi Available Networks List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-300">Discovered Networks ({networkState.networks.length})</span>
                        <button
                          onClick={() => Network.scanNetworks()}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3 text-[#6ee7b7]" />
                          <span>Rescan Channels</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {networkState.networks.map((net) => (
                          <div
                            key={net.ssid}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                              net.connected
                                ? 'bg-[#6ee7b7]/15 border-[#6ee7b7]/40 text-white'
                                : 'bg-white/5 border-white/5 hover:border-white/15 text-gray-300'
                            }`}
                          >
                            <div className="truncate">
                              <div className="font-semibold text-white flex items-center gap-1.5 truncate">
                                <span>{net.ssid}</span>
                                {net.saved && (
                                  <span className="text-[9px] px-1 bg-white/10 text-gray-300 rounded">Saved</span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {net.band} • {net.security} • {net.signal}%
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              {net.connected ? (
                                <span className="text-[10px] text-[#6ee7b7] font-semibold">Active</span>
                              ) : (
                                <button
                                  onClick={() => Network.connectNetwork(net.ssid, net.password)}
                                  className="px-2 py-1 rounded-lg bg-[#6ee7b7]/20 hover:bg-[#6ee7b7]/30 text-[#6ee7b7] text-[11px] font-semibold cursor-pointer"
                                >
                                  Connect
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Advanced Wi-Fi Toggles (Power Save & MAC Randomization) */}
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                        <div>
                          <div className="font-semibold text-white text-xs">Wi-Fi Power Management (iw wlan0 set power_save)</div>
                          <div className="text-[10px] text-gray-400">Reduces wireless adapter radio polling to conserve battery during idle periods</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={networkState.wlan.powerSave}
                          onChange={(e) => Network.updateInterfaceConfig('wlan0', { powerSave: e.target.checked })}
                          className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 cursor-pointer">
                        <div>
                          <div className="font-semibold text-white text-xs">MAC Address Randomization (macchanger -r)</div>
                          <div className="text-[10px] text-gray-400">
                            Current MAC: <span className="font-mono text-[#6ee7b7]">{networkState.wlan.macAddress}</span> (Hardware: {networkState.wlan.hardwareMac})
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={networkState.wlan.randomizeMac}
                          onChange={(e) => Network.updateInterfaceConfig('wlan0', { randomizeMac: e.target.checked })}
                          className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-400 text-xs">
                    Wi-Fi interface is soft-blocked or powered off via rfkill.
                  </div>
                )}
              </div>

              {/* WireGuard VPN (wg0) & Hotspot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* WireGuard */}
                <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <h3 className="font-bold text-white text-sm">WireGuard (wg0)</h3>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${networkState.vpn.connected ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'bg-gray-700 text-gray-400'}`}>
                      {networkState.vpn.connected ? 'ACTIVE' : 'IDLE'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-mono text-gray-300">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Endpoint:</span>
                      <span>{networkState.vpn.endpoint}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tunnel IP:</span>
                      <span>{networkState.vpn.address}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => Network.toggleVpn()}
                    className={`w-full py-2 rounded-xl font-semibold text-xs transition cursor-pointer ${
                      networkState.vpn.connected
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
                        : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40'
                    }`}
                  >
                    {networkState.vpn.connected ? 'Disconnect Tunnel' : 'Connect WireGuard VPN'}
                  </button>
                </div>

                {/* Hotspot AP */}
                <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <h3 className="font-bold text-white text-sm">Wireless Hotspot (hostapd)</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={networkState.hotspot.enabled}
                        onChange={(e) => Network.toggleHotspot(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400" />
                    </label>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-gray-300">
                      <span className="text-gray-400">Hotspot SSID:</span>
                      <span className="font-mono font-semibold text-white">{networkState.hotspot.ssid}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span className="text-gray-400">Passphrase:</span>
                      <span className="font-mono text-amber-300">{networkState.hotspot.passphrase}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linux Network Diagnostics (Ping & DNS) */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Network Diagnostics</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ping Tester */}
                  <div className="p-3 rounded-xl bg-white/5 space-y-2">
                    <label className="text-xs font-semibold text-gray-300">Ping Host / IP</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pingTarget}
                        onChange={(e) => setPingTarget(e.target.value)}
                        className="flex-1 bg-[#0d0f18] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                        placeholder="1.1.1.1"
                      />
                      <button
                        onClick={async () => {
                          setPingRunning(true);
                          const res = await Network.runPing(pingTarget, 3);
                          setPingResult(res.output);
                          setPingRunning(false);
                        }}
                        disabled={pingRunning}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        {pingRunning ? 'Pinging...' : 'Ping'}
                      </button>
                    </div>

                    {pingResult && (
                      <div className="p-2 bg-black/60 rounded-lg font-mono text-[10px] text-gray-300 space-y-0.5 max-h-24 overflow-y-auto">
                        {pingResult.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* DNS Resolver Tester */}
                  <div className="p-3 rounded-xl bg-white/5 space-y-2">
                    <label className="text-xs font-semibold text-gray-300">DNS Query (nslookup / dig)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={dnsTarget}
                        onChange={(e) => setDnsTarget(e.target.value)}
                        className="flex-1 bg-[#0d0f18] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                        placeholder="alpinelinux.org"
                      />
                      <button
                        onClick={async () => {
                          setDnsRunning(true);
                          const res = await Network.runDnsQuery(dnsTarget);
                          setDnsResult(res);
                          setDnsRunning(false);
                        }}
                        disabled={dnsRunning}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        {dnsRunning ? 'Querying...' : 'Resolve'}
                      </button>
                    </div>

                    {dnsResult && (
                      <div className="p-2 bg-black/60 rounded-lg font-mono text-[10px] text-gray-300 space-y-0.5">
                        <div className="text-emerald-400">Server: {dnsResult.server} ({dnsResult.queryTimeMs}ms)</div>
                        {dnsResult.addresses.map((ip, i) => (
                          <div key={i}>Address: {ip}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Audio Volume */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-[#6ee7b7]" />}
                    <h3 className="font-bold text-white text-sm">Audio Volume & Sound FX</h3>
                  </div>
                  <button
                    onClick={() => Kernel.settings.toggleMute()}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition cursor-pointer"
                  >
                    {settings.isMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-300">
                    <span>Master Output Volume</span>
                    <span className="font-mono font-bold text-white">{settings.isMuted ? 'Muted' : `${settings.volume}%`}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.isMuted ? 0 : settings.volume}
                    onChange={(e) => Kernel.settings.setVolume(parseInt(e.target.value))}
                    className="w-full accent-[#6ee7b7] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}


          {/* TAB 7: STORAGE & BACKUP */}
          {activeTab === 'backup' && (
            <div className="max-w-3xl space-y-6">
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Storage, Backup & State Export</h3>
                    <p className="text-[11px] text-gray-400">Save complete workspace configuration, settings and virtual disk states</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleExportTarGz}
                    className="p-3.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 flex items-center gap-3 transition text-left cursor-pointer"
                  >
                    <Download className="w-5 h-5 text-purple-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-white">Export Workspace (.tar.gz)</div>
                      <div className="text-[10px] text-gray-400">Complete archive of settings, state & VFS files</div>
                    </div>
                  </button>

                  <label className="p-3.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 flex items-center gap-3 transition text-left cursor-pointer">
                    <Upload className="w-5 h-5 text-purple-300 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-white">Import Workspace (.tar.gz)</div>
                      <div className="text-[10px] text-gray-400">Extract & restore complete state and VFS files</div>
                    </div>
                    <input type="file" accept=".tar.gz,.tgz,.tar" onChange={handleImportTarGz} className="hidden" />
                  </label>

                  <button
                    onClick={handleExportBackup}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 transition text-left cursor-pointer"
                  >
                    <Download className="w-5 h-5 text-[#6ee7b7] shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-white">Export Backup JSON</div>
                      <div className="text-[10px] text-gray-400">Download snapshot of settings & state</div>
                    </div>
                  </button>

                  <label className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 transition text-left cursor-pointer">
                    <Upload className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-white">Restore from JSON</div>
                      <div className="text-[10px] text-gray-400">Load previously exported Helix JSON</div>
                    </div>
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Factory Reset */}
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Factory System Reset</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  Resets all system settings, themes, and wallpaper to default vanilla state.
                </p>
                <button
                  onClick={handleFactoryReset}
                  className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-semibold text-xs transition cursor-pointer"
                >
                  Perform Factory Reset
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: SYSTEM DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="max-w-3xl space-y-6">
              <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/30">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Helix OS Diagnostics & Self-Test</h3>
                      <p className="text-[11px] text-gray-400">Comprehensive automated test of all hardware and software subsystems</p>
                    </div>
                  </div>

                  <button
                    onClick={runDiagnostics}
                    disabled={diagRunning}
                    className="px-4 py-2 rounded-xl bg-[#6ee7b7] hover:bg-[#5eead4] text-black font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${diagRunning ? 'animate-spin' : ''}`} />
                    <span>{diagRunning ? 'Testing Subsystems...' : 'Run Diagnostics'}</span>
                  </button>
                </div>

                {diagResults && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    {diagResults.map((d, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          {d.status === 'ok' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          <div>
                            <div className="font-bold text-xs text-white">{d.name}</div>
                            <div className="text-[11px] text-gray-400">{d.detail}</div>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            d.status === 'ok'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {d.status === 'ok' ? 'PASS' : 'WARN'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Notice Banner */}
      {notice && (
        <div className="absolute bottom-4 right-4 z-40 px-3.5 py-2 rounded-xl bg-[#141724] border border-[#6ee7b7]/40 text-white text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#6ee7b7] shrink-0" />
          <span>{notice}</span>
        </div>
      )}
    </div>
  );
};
