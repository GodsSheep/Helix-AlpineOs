import React, { useState, useEffect, useRef } from 'react';
import { WindowInstance } from './kernel';
import { Kernel } from './kernel';
import { BootScreen } from './components/BootScreen';
import { Menubar } from './components/Menubar';
import { Dock } from './components/Dock';
import { Launcher } from './components/Launcher';
import { WindowFrame } from './components/WindowFrame';
import { QuickSettingsDrawer } from './components/QuickSettingsDrawer';
import { NotificationCenter } from './components/NotificationCenter';
import { NotificationToast } from './components/NotificationToast';
import { MachineApp } from './components/apps/MachineApp';
import { TerminalApp } from './components/apps/TerminalApp';
import { EditorApp } from './components/apps/EditorApp';
import { StoreApp } from './components/apps/StoreApp';
import { MonitorApp } from './components/apps/MonitorApp';
import { FilesApp } from './components/apps/FilesApp';
import { SettingsApp } from './components/apps/SettingsApp';
import { NetScanApp } from './components/apps/NetScanApp';
import { ApkManagerApp } from './components/apps/ApkManagerApp';
import { SyslogApp } from './components/apps/SyslogApp';
import { ProcManApp } from './components/apps/ProcManApp';
import { SqlClientApp } from './components/apps/SqlClientApp';
import { DocViewerApp } from './components/apps/DocViewerApp';
import { EnvMgrApp } from './components/apps/EnvMgrApp';
import { WebBrowserApp } from './components/apps/WebBrowserApp';
import { DiskAnalyzerApp } from './components/apps/DiskAnalyzerApp';
import { SoundMixerApp } from './components/apps/SoundMixerApp';
import { GameRacerApp } from './components/apps/GameRacerApp';
import { GameHackerApp } from './components/apps/GameHackerApp';
import { Game2048App } from './components/apps/Game2048App';
import { GameTetrisApp } from './components/apps/GameTetrisApp';
import { GameMinesweeperApp } from './components/apps/GameMinesweeperApp';
import { CronManagerApp } from './components/apps/CronManagerApp';
import { FirewallApp } from './components/apps/FirewallApp';
import { ServicesApp } from './components/apps/ServicesApp';
import { CalculatorApp } from './components/apps/CalculatorApp';
import { PaintApp } from './components/apps/PaintApp';
import { SshClientApp } from './components/apps/SshClientApp';
import { ArchiveApp } from './components/apps/ArchiveApp';
import { HardwareInfoApp } from './components/apps/HardwareInfoApp';
import { DiffViewerApp } from './components/apps/DiffViewerApp';
import { ClipboardManagerApp } from './components/apps/ClipboardManagerApp';
import { GameSnakeApp } from './components/apps/GameSnakeApp';
import { GameSpaceInvadersApp } from './components/apps/GameSpaceInvadersApp';
import { GamePongApp } from './components/apps/GamePongApp';
import { GameMemoryApp } from './components/apps/GameMemoryApp';
import { GameWordleApp } from './components/apps/GameWordleApp';
import { NeofetchApp } from './components/apps/NeofetchApp';
import { TaskSchedulerApp } from './components/apps/TaskSchedulerApp';
import { HexEditorApp } from './components/apps/HexEditorApp';
import { BenchmarkApp } from './components/apps/BenchmarkApp';
import { PythonShowcaseApp } from './components/apps/PythonShowcaseApp';
import { AsyncIOManagerApp } from './components/apps/AsyncIOManagerApp';
import { GuiRunnerApp } from './components/apps/GuiRunnerApp';
import { UniversalGuiStudioApp } from './components/apps/UniversalGuiStudioApp';
import { RustCppStudioApp } from './components/apps/RustCppStudioApp';
import { DynamicGuiWindow } from './components/apps/DynamicGuiWindow';
import { DesktopContextMenu } from './components/DesktopContextMenu';
import { Settings, HelixSettings } from './kernel/Settings';

export default function App() {
  const [isBooted, setIsBooted] = useState(false);
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [settings, setSettings] = useState<HelixSettings>(Settings.get());
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number; type?: string } | null>(null);
  const [selectedShortcutId, setSelectedShortcutId] = useState<string | null>(null);

  const desktopHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const desktopHoldStart = useRef<{ x: number; y: number } | null>(null);
  const touchStartEdge = useRef<{ x: number; y: number; edge: 'top' | 'bottom' | 'none' } | null>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const resizeDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mainContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (resizeDebounceTimer.current) clearTimeout(resizeDebounceTimer.current);
      resizeDebounceTimer.current = setTimeout(() => {
        Kernel.wm.refitWindows();
      }, 100);
    });
    observer.observe(mainContainerRef.current);
    return () => {
      observer.disconnect();
      if (resizeDebounceTimer.current) clearTimeout(resizeDebounceTimer.current);
    };
  }, []);

  const cancelDesktopHold = () => {
    if (desktopHoldTimer.current) {
      clearTimeout(desktopHoldTimer.current);
      desktopHoldTimer.current = null;
    }
    desktopHoldStart.current = null;
  };

  useEffect(() => {
    Kernel.init().catch((err) => console.warn('Kernel init failed:', err));
    Kernel.apps.loadCustomApps();

    const unsubSettings = Settings.subscribe((s) => {
      setSettings(s);
    });

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((e) => {
        console.warn('SW registration:', e);
      });
    }

    const unsubWM = Kernel.wm.subscribe((wins) => {
      setWindows([...wins]);
      setActiveWindowId(Kernel.wm.getActiveId());
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+Z or F11 toggles Zen / Screen space mode
      if ((e.altKey && e.key.toLowerCase() === 'z') || e.key === 'F11') {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      }
    };

    // Global touch edge swipe listener (Swipe top edge -> Notification Center, Swipe bottom edge -> Launcher)
    const handleGlobalTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const y = e.touches[0].clientY;
        const screenH = window.innerHeight;
        if (y < 45) {
          touchStartEdge.current = { x: e.touches[0].clientX, y, edge: 'top' };
        } else if (y > screenH - 50) {
          touchStartEdge.current = { x: e.touches[0].clientX, y, edge: 'bottom' };
        } else {
          touchStartEdge.current = null;
        }
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (touchStartEdge.current && e.changedTouches.length === 1) {
        const start = touchStartEdge.current;
        const endY = e.changedTouches[0].clientY;
        const dy = endY - start.y;

        if (start.edge === 'top' && dy > 50) {
          if ('vibrate' in navigator) navigator.vibrate?.(30);
          setIsNotificationCenterOpen(true);
        } else if (start.edge === 'bottom' && dy < -50) {
          if ('vibrate' in navigator) navigator.vibrate?.(30);
          setIsLauncherOpen(true);
        }
      }
      touchStartEdge.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleGlobalTouchStart, { passive: true });
    window.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      unsubWM();
      unsubSettings();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleGlobalTouchStart);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      cancelDesktopHold();
    };
  }, []);

  const handleBootComplete = () => {
    setIsBooted(true);
    setTimeout(() => {
      Kernel.wm.launch('term');
    }, 200);
  };

  const openAppIds = new Set(windows.map((w) => w.appId));
  const backgroundAppIds = new Set(windows.filter((w) => w.isMinimized).map((w) => w.appId));
  const activeWin = windows.find((w) => w.id === activeWindowId && !w.isMinimized);
  const activeAppId = activeWin ? activeWin.appId : null;

  const renderAppContent = (win: WindowInstance) => {
    switch (win.appId) {
      case 'machine': return <MachineApp />;
      case 'term': return <TerminalApp />;
      case 'edit': return <EditorApp initialFile={(win.args?.file as string) || undefined} />;
      case 'store': return <StoreApp />;
      case 'mon': return <MonitorApp />;
      case 'files':
        return (
          <FilesApp
            onOpenFileInEditor={(path) => {
              Kernel.wm.launch('edit', { file: path });
            }}
          />
        );
      case 'settings': return <SettingsApp />;
      case 'netscan': return <NetScanApp />;
      case 'apkman': return <ApkManagerApp />;
      case 'syslog': return <SyslogApp />;
      case 'procman': return <ProcManApp />;
      case 'sqlclient': return <SqlClientApp />;
      case 'docviewer': return <DocViewerApp />;
      case 'envmgr': return <EnvMgrApp />;
      case 'browser': return <WebBrowserApp />;
      case 'diskanalyzer': return <DiskAnalyzerApp />;
      case 'soundmixer': return <SoundMixerApp />;
      case 'game-racer': return <GameRacerApp />;
      case 'game-hacker': return <GameHackerApp />;
      case 'game-2048': return <Game2048App />;
      case 'game-tetris': return <GameTetrisApp />;
      case 'game-minesweeper': return <GameMinesweeperApp />;
      case 'cron': return <CronManagerApp />;
      case 'firewall': return <FirewallApp />;
      case 'services': return <ServicesApp />;
      case 'calc': return <CalculatorApp />;
      case 'paint': return <PaintApp />;
      case 'ssh': return <SshClientApp />;
      case 'archive': return <ArchiveApp />;
      case 'hardware': return <HardwareInfoApp />;
      case 'diff': return <DiffViewerApp />;
      case 'clipboard': return <ClipboardManagerApp />;
      case 'game-snake': return <GameSnakeApp />;
      case 'game-spaceinvaders': return <GameSpaceInvadersApp />;
      case 'game-pong': return <GamePongApp />;
      case 'game-memory': return <GameMemoryApp />;
      case 'game-wordle': return <GameWordleApp />;
      case 'neofetch': return <NeofetchApp />;
      case 'taskscheduler': return <TaskSchedulerApp />;
      case 'hexedit': return <HexEditorApp />;
      case 'benchmark': return <BenchmarkApp />;
      case 'rustcpp': return <RustCppStudioApp />;
      case 'guistudio':
      case 'guirunner': return <UniversalGuiStudioApp />;
      case 'pythonshowcase': return <PythonShowcaseApp />;
      case 'asynciomonitor': return <AsyncIOManagerApp />;
      case 'gui-window': return <DynamicGuiWindow guiId={win.args?.guiId as string} args={win.args} />;
      default: return <TerminalApp />;
    }
  };

  const getWallpaperBackground = () => {
    if (settings.customWallpaperUrl) {
      let size = 'cover';
      let repeat = 'no-repeat';
      let position = 'center';
      let color = 'transparent';

      if (settings.wallpaperStyle === 'contain') {
        size = 'contain';
        color = '#000000';
      } else if (settings.wallpaperStyle === 'stretch') {
        size = '100% 100%';
      } else if (settings.wallpaperStyle === 'tile') {
        size = 'auto';
        repeat = 'repeat';
        position = 'top left';
      }

      return {
        backgroundImage: `url("${settings.customWallpaperUrl}")`,
        backgroundSize: size,
        backgroundRepeat: repeat as any,
        backgroundPosition: position,
        backgroundColor: color,
      };
    }
    switch (settings.wallpaperPreset) {
      case 'gradient-tokyo':
        return { background: 'radial-gradient(ellipse at top, #24283b 0%, #1a1b26 100%)' };
      case 'mesh-nord':
        return { background: 'radial-gradient(circle at 50% 20%, #3b4252 0%, #2e3440 100%)' };
      case 'gradient-gruvbox':
        return { background: 'radial-gradient(ellipse at bottom, #32302f 0%, #1d2021 100%)' };
      case 'gradient-catppuccin':
        return { background: 'radial-gradient(circle at 80% 20%, #232136 0%, #181825 100%)' };
      case 'mesh-cyberpunk':
        return { background: 'radial-gradient(circle at 30% 70%, #1b1603 0%, #0a0a0f 100%)' };
      default:
        return { background: 'var(--bg, #07080b)' };
    }
  };

  return (
    <div
      ref={mainContainerRef}
      className="fixed inset-0 text-[#edf1f7] font-sans select-none overflow-hidden flex flex-col"
      style={getWallpaperBackground()}
    >
      {!isBooted && <BootScreen onBootComplete={handleBootComplete} />}

      {/* Lightweight GPU-friendly decorative backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="absolute -top-32 left-1/4 w-80 h-80 rounded-full pointer-events-none opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(110,231,183,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 right-1/4 w-80 h-80 rounded-full pointer-events-none opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)' }}
        />
      </div>

      <Menubar
        onToggleLauncher={() => setIsLauncherOpen((prev) => !prev)}
        onOpenApp={(appId) => Kernel.wm.launch(appId as any)}
        onToggleQuickSettings={() => setIsQuickSettingsOpen((prev) => !prev)}
        isQuickSettingsOpen={isQuickSettingsOpen}
        isZenMode={isZenMode}
        onToggleZenMode={() => setIsZenMode((prev) => !prev)}
        onToggleNotificationCenter={() => setIsNotificationCenterOpen((prev) => !prev)}
        isNotificationCenterOpen={isNotificationCenterOpen}
      />

      <div
        id="desktop"
        className="flex-1 relative overflow-hidden"
        onContextMenu={(e) => {
          const target = e.target as HTMLElement;
          if (target.id === 'desktop' || target.closest('#desktop-bg')) {
            e.preventDefault();
            setContextMenuPos({ x: e.clientX, y: e.clientY, type: 'desktop' });
          }
        }}
        onPointerDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.id === 'desktop' || target.closest('#desktop-bg')) {
            if (e.button === 0) {
              cancelDesktopHold();
              desktopHoldStart.current = { x: e.clientX, y: e.clientY };
              desktopHoldTimer.current = setTimeout(() => {
                if ('vibrate' in navigator) navigator.vibrate?.(35);
                setContextMenuPos({ x: e.clientX, y: e.clientY, type: 'desktop' });
                cancelDesktopHold();
              }, 420);
            }
          }
        }}
        onPointerMove={(e) => {
          if (desktopHoldStart.current) {
            const dist = Math.hypot(e.clientX - desktopHoldStart.current.x, e.clientY - desktopHoldStart.current.y);
            if (dist > 8) cancelDesktopHold();
          }
        }}
        onPointerUp={cancelDesktopHold}
        onPointerCancel={cancelDesktopHold}
      >
        <div id="desktop-bg" className="absolute inset-0 flex items-center justify-center p-8" onClick={() => { setContextMenuPos(null); setSelectedShortcutId(null); }}>
          <div className="text-center space-y-3 opacity-30 select-none pointer-events-none">
            <div className="text-4xl font-mono tracking-wider font-bold text-[#6ee7b7]">Helix DE</div>
            <div className="text-xs font-mono text-gray-400">Alpine Linux 6.6 LTS • Wayland Compositor</div>
          </div>
        </div>

        {/* Dynamic Desktop Shortcut Layer */}
        <div 
          className="absolute left-6 top-16 bottom-20 flex flex-col flex-wrap gap-4 select-none pointer-events-none z-10"
          style={{ width: 'fit-content', maxHeight: 'calc(100vh - 140px)' }}
        >
          {(settings.desktopShortcuts || []).map((appId) => {
            const appDef = Kernel.apps.get(appId as any);
            if (!appDef) return null;
            const isSelected = selectedShortcutId === appId;
            return (
              <div
                key={appId}
                onDoubleClick={() => Kernel.wm.launch(appId as any)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedShortcutId(appId);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedShortcutId(appId);
                  setContextMenuPos({ x: e.clientX, y: e.clientY, type: 'shortcut-' + appId });
                }}
                className={`w-20 h-20 flex flex-col items-center justify-center rounded-xl p-2 transition duration-150 cursor-pointer pointer-events-auto border ${
                  isSelected 
                    ? 'bg-white/15 border-[#6ee7b7]/60 text-white shadow-lg shadow-black/40' 
                    : 'bg-transparent border-transparent hover:bg-white/5 active:bg-white/10 text-gray-200'
                }`}
              >
                <span className="text-3xl select-none filter drop-shadow-sm leading-none">{appDef.icon}</span>
                <span className="text-[10px] font-medium font-mono truncate w-full text-center mt-1.5 px-0.5 select-none drop-shadow-md">
                  {appDef.title}
                </span>
              </div>
            );
          })}
        </div>

        {windows.map((win) => {
          const def = Kernel.apps.get(win.appId);
          return (
            <div key={win.id}>
              <WindowFrame
                win={win}
                icon={def?.icon || '⚙️'}
                isActive={win.id === activeWindowId}
                onFocus={() => Kernel.wm.focus(win.id)}
                onClose={() => Kernel.wm.close(win.id)}
                onMinimize={() => Kernel.wm.minimize(win.id)}
                onMaximize={() => Kernel.wm.toggleMaximize(win.id)}
                onToggleShade={() => Kernel.wm.toggleShade(win.id)}
                onUpdatePosition={(x, y) => Kernel.wm.updatePosition(win.id, x, y)}
                onUpdateSize={(w, h) => Kernel.wm.updateBounds(win.id, { width: w, height: h })}
                onOpenAppMenu={(x, y, appId) => setContextMenuPos({ x, y, type: appId })}
              >
                {renderAppContent(win)}
              </WindowFrame>
            </div>
          );
        })}

        {contextMenuPos && (
          <DesktopContextMenu
            x={contextMenuPos.x}
            y={contextMenuPos.y}
            contextType={contextMenuPos.type as any || 'desktop'}
            onClose={() => setContextMenuPos(null)}
            onOpenApp={(appId, args) => Kernel.wm.launch(appId as any, args)}
            onRefreshDesktop={() => {
              Kernel.vfs.list();
              setSettings(Settings.get());
            }}
          />
        )}
      </div>

      <NotificationToast />

      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onOpenApp={(appId, args) => Kernel.wm.launch(appId as any, args)}
      />

      <QuickSettingsDrawer
        isOpen={isQuickSettingsOpen}
        onClose={() => setIsQuickSettingsOpen(false)}
        onOpenSettings={() => Kernel.wm.launch('settings')}
      />

      <Launcher
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        onLaunchApp={(appId) => Kernel.wm.launch(appId as any)}
      />

      <Dock
        openAppIds={openAppIds}
        backgroundAppIds={backgroundAppIds}
        activeAppId={activeAppId}
        onLaunchApp={(appId) => Kernel.wm.launch(appId as any)}
        onToggleLauncher={() => setIsLauncherOpen((prev) => !prev)}
        isLauncherOpen={isLauncherOpen}
        isZenMode={isZenMode}
      />
    </div>
  );
}
