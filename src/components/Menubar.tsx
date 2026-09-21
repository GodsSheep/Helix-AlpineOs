import React, { useState, useEffect, useRef } from 'react';
import { Kernel } from '../kernel';
import { Network } from '../kernel/NetworkService';
import { NotificationService } from '../kernel/NotificationService';
import { 
  Terminal, 
  Activity, 
  Wifi, 
  WifiOff, 
  Settings as SettingsIcon, 
  Sliders,
  Maximize2,
  Minimize2,
  ChevronsUpDown,
  Bell,
  Cpu,
  Layers,
  Radio
} from 'lucide-react';
import { SystemState } from '../kernel';
import { PWAInstallButton } from './PWAInstallButton';
import { BatteryIndicator } from './BatteryIndicator';
import { WifiFlyout } from './WifiFlyout';

interface MenubarProps {
  onToggleLauncher: () => void;
  onOpenApp: (appId: string) => void;
  onToggleQuickSettings?: () => void;
  isQuickSettingsOpen?: boolean;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
  onToggleNotificationCenter?: () => void;
  isNotificationCenterOpen?: boolean;
}

export const Menubar: React.FC<MenubarProps> = ({ 
  onToggleLauncher, 
  onOpenApp, 
  onToggleQuickSettings,
  isQuickSettingsOpen,
  isZenMode = false,
  onToggleZenMode,
  onToggleNotificationCenter,
  isNotificationCenterOpen = false,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [systemState, setSystemState] = useState<SystemState>(Kernel.state.current);
  const [isWifiMenuOpen, setIsWifiMenuOpen] = useState(false);
  const [isWifiEnabled, setIsWifiEnabled] = useState(Network.getIsWifiPoweredOn());
  const [activeSsid, setActiveSsid] = useState<string | null>(Network.getActiveNetwork()?.ssid || null);
  const [unreadCount, setUnreadCount] = useState(NotificationService.getUnreadCount());
  const [osMeta, setOsMeta] = useState(Kernel.vm.getOsMetadata());
  const [settings, setSettings] = useState(Kernel.settings.get());

  const wifiMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: settings.topbarClockFormat !== '24h',
      };
      if (settings.topbarShowClockSeconds) {
        options.second = '2-digit';
      }
      setTimeStr(d.toLocaleTimeString([], options));
    };
    updateClock();
    const clockTimer = setInterval(updateClock, 1000);

    const unsubSettings = Kernel.settings.subscribe((s) => {
      setSettings(s);
    });

    const unsubState = Kernel.state.subscribe((state) => {
      setSystemState(state);
    });

    const unsubNet = Network.subscribe((net) => {
      setIsWifiEnabled(net.getIsWifiPoweredOn());
      setActiveSsid(net.getActiveNetwork()?.ssid || null);
    });

    const unsubNotif = NotificationService.subscribe(() => {
      setUnreadCount(NotificationService.getUnreadCount());
    });

    const unsubOs = Kernel.vm.onOsChange((_id, meta) => {
      setOsMeta(meta);
    });

    const handlePointerDownOutside = (e: PointerEvent) => {
      if (wifiMenuRef.current && !wifiMenuRef.current.contains(e.target as Node)) {
        setIsWifiMenuOpen(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDownOutside);

    return () => {
      clearInterval(clockTimer);
      unsubSettings();
      unsubState();
      unsubNet();
      unsubNotif();
      unsubOs();
      window.removeEventListener('pointerdown', handlePointerDownOutside);
    };
  }, [settings.topbarClockFormat, settings.topbarShowClockSeconds]);

  const isLinuxReady = systemState.linux === 'ready';

  return (
    <header className={`pt-[env(safe-area-inset-top,0px)] px-2 sm:px-3.5 bg-[#08090c]/95 border-b border-white/10 flex items-center justify-between select-none z-[8000] backdrop-blur-md text-xs relative touch-none shrink-0 transition-all duration-200 ${
      isZenMode ? 'h-[calc(34px+env(safe-area-inset-top,0px))] opacity-85 hover:opacity-100' : 'h-[calc(42px+env(safe-area-inset-top,0px))]'
    }`}>
      {/* Left items: Helix Menu & Quick Apps */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onToggleLauncher}
          className="px-1.5 sm:px-2 py-1 rounded font-bold tracking-widest text-[#6ee7b7] hover:bg-white/5 transition flex items-center gap-1.5 cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-[#6ee7b7] shadow-[0_0_8px_#6ee7b7]" />
          <span className="font-semibold text-xs sm:text-sm">HELIX</span>
        </button>

        <span className="text-white/20 hidden xs:inline">|</span>

        {/* Active OS Switcher Indicator */}
        {settings.topbarShowOsBadge && (
          <button
            onClick={() => onOpenApp('osselector')}
            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-1.5 text-xs text-white cursor-pointer"
            title={`Active OS: ${osMeta.name} ${osMeta.version} - Click to switch OS or tune BIOS`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-mono text-[11px] font-bold text-cyan-200 truncate max-w-[110px] sm:max-w-none">
              {osMeta.name}
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono hidden md:inline">
              {osMeta.version}
            </span>
          </button>
        )}

        {settings.topbarShowShellButton && (
          <button
            onClick={() => onOpenApp('term')}
            className="p-1 sm:px-2 sm:py-1 rounded text-[#8b93a7] hover:text-white hover:bg-white/5 transition flex items-center gap-1 cursor-pointer"
            title="Terminal Shell"
          >
            <Terminal className="w-3.5 h-3.5 text-[#6ee7b7]" />
            <span className="hidden md:inline">Shell</span>
          </button>
        )}

        {settings.topbarShowActivityButton && (
          <button
            onClick={() => onOpenApp('mon')}
            className="p-1 sm:px-2 sm:py-1 rounded text-[#8b93a7] hover:text-white hover:bg-white/5 transition flex items-center gap-1 cursor-pointer"
            title="System Activity Monitor"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Activity</span>
          </button>
        )}

        {settings.topbarShowSettingsButton && (
          <button
            onClick={() => onOpenApp('settings')}
            className="p-1 sm:px-2 sm:py-1 rounded text-[#8b93a7] hover:text-white hover:bg-white/5 transition flex items-center gap-1 cursor-pointer"
            title="Settings"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Settings</span>
          </button>
        )}

        <button
          onClick={() => onOpenApp('autodetect')}
          className="p-1 sm:px-2 sm:py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[#8b93a7] hover:text-white transition flex items-center gap-1.5 cursor-pointer text-xs"
          title="Auto-Detection, Connection Mesh & Package Sync"
        >
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="hidden lg:inline text-emerald-300 font-mono font-medium">Sync Mesh</span>
        </button>

        <button
          onClick={() => onOpenApp('kernel-memory')}
          className="p-1 sm:px-2 sm:py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[#8b93a7] hover:text-white transition flex items-center gap-1.5 cursor-pointer text-xs"
          title="Kernel Memory Monitor & Live GC Telemetry"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xl:inline text-cyan-300 font-mono font-medium">Memory & GC</span>
        </button>
      </div>

      {/* Right items: Space Maximizer, PWA Install, Battery Indicator, WiFi, Quick Settings, Clock */}
      <div className="flex items-center gap-1 sm:gap-2 text-[#8b93a7]">
        {/* Workspace Space Maximizer (Zen Mode) */}
        {settings.topbarShowZenButton && onToggleZenMode && (
          <button
            onClick={onToggleZenMode}
            className={`p-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
              isZenMode ? 'bg-[#6ee7b7]/20 text-[#6ee7b7] border border-[#6ee7b7]/40' : 'hover:bg-white/10 text-gray-300'
            }`}
            title={isZenMode ? 'Exit Compact Screen Space Mode' : 'Maximize Screen Space (Compact Bars for Small Screens)'}
          >
            {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-[#6ee7b7]" />}
          </button>
        )}

        {/* In-App PWA Install Trigger */}
        {settings.topbarShowPwaInstall && (
          <PWAInstallButton compact className="hidden xs:flex" />
        )}

        {/* Real-Device Battery Status Indicator */}
        {settings.topbarShowBattery && (
          <BatteryIndicator onOpenSettings={(tab) => onOpenApp('settings')} />
        )}

        {/* WiFi Button with Dropdown Trigger */}
        {settings.topbarShowWifi && (
          <div className="relative" ref={wifiMenuRef}>
            <button
              onClick={() => setIsWifiMenuOpen((prev) => !prev)}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                isWifiMenuOpen
                  ? 'bg-white/15 text-[#6ee7b7]'
                  : isWifiEnabled && activeSsid
                  ? 'hover:bg-white/10 text-[#6ee7b7]'
                  : isWifiEnabled
                  ? 'hover:bg-white/10 text-amber-400'
                  : 'hover:bg-white/10 text-red-400'
              }`}
              title={`WiFi: ${isWifiEnabled ? (activeSsid ? `Connected to ${activeSsid}` : 'Disconnected (Scanning)') : 'Hardware Radio Disabled'}`}
              aria-label="Wi-Fi Network Menu"
            >
              {isWifiEnabled ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
            </button>

            {/* Wi-Fi Flyout Menu */}
            <WifiFlyout
              isOpen={isWifiMenuOpen}
              onClose={() => setIsWifiMenuOpen(false)}
              onOpenSettings={() => {
                setIsWifiMenuOpen(false);
                onOpenApp('settings');
              }}
            />
          </div>
        )}

        {/* Quick Settings Control Center Button */}
        {settings.topbarShowQuickSettings && onToggleQuickSettings && (
          <button
            onClick={onToggleQuickSettings}
            className={`p-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
              isQuickSettingsOpen ? 'bg-white/15 text-cyan-300' : 'hover:bg-white/10 text-gray-300'
            }`}
            title="Quick Settings & System Control Center"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        )}

        {/* Alpine Linux Kernel Status */}
        {settings.topbarShowLinuxStatus && (
          <div className="hidden lg:flex items-center gap-1.5 font-mono text-[11px]" title={`Linux Guest: ${systemState.linux}`}>
            <span
              className={`w-2 h-2 rounded-full ${
                isLinuxReady
                  ? 'bg-[#6ee7b7] shadow-[0_0_6px_#6ee7b7]'
                  : systemState.linux === 'booting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-gray-300">linux-alpine</span>
          </div>
        )}

        {/* System Clock & Notification Center Trigger */}
        <button
          id="time-clock-btn"
          onClick={onToggleNotificationCenter}
          className={`px-2.5 py-1 rounded-xl font-mono text-xs tracking-wide cursor-pointer transition flex items-center gap-1.5 ${
            isNotificationCenterOpen
              ? 'bg-[#6ee7b7]/20 text-[#6ee7b7] border border-[#6ee7b7]/40 ring-2 ring-[#6ee7b7]/20'
              : 'bg-white/5 hover:bg-white/10 text-white'
          }`}
          title="Open Notification Center & Calendar Hub"
        >
          {settings.topbarShowNotificationBell && (
            <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? 'text-[#6ee7b7] animate-pulse' : 'text-gray-400'}`} />
          )}
          <span>{timeStr || '00:00'}</span>
          {unreadCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#6ee7b7] shadow-[0_0_6px_#6ee7b7]" />
          )}
        </button>
      </div>
    </header>
  );
};
