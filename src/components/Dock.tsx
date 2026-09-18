import React, { useState, useEffect, useRef } from 'react';
import { Kernel } from '../kernel';
import { SoundManager } from '../kernel/SoundManager';
import { AppId } from '../kernel/types';
import {
  Rocket,
  ChevronUp,
  ChevronDown,
  X,
  Minimize2,
  Maximize2,
  Plus,
  Pin,
  PinOff,
  LayoutGrid,
  Layers,
  Settings,
  Power,
  ExternalLink,
} from 'lucide-react';

interface DockProps {
  openAppIds: Set<string>;
  backgroundAppIds?: Set<string>;
  activeAppId: string | null;
  onLaunchApp: (appId: string) => void;
  onToggleLauncher: () => void;
  isLauncherOpen: boolean;
  isZenMode?: boolean;
}

interface ContextMenuState {
  type: 'app' | 'start';
  appId?: string;
  x: number;
  y: number;
}

export const Dock: React.FC<DockProps> = ({
  openAppIds,
  backgroundAppIds = new Set(),
  activeAppId,
  onLaunchApp,
  onToggleLauncher,
  isLauncherOpen,
  isZenMode = false,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Combine pinned apps and currently open apps
  const allApps = Kernel.apps.getAll();
  const pinnedApps = allApps.filter(a => a.pinnedToDock);
  const unpinnedOpenApps = allApps.filter(a => !a.pinnedToDock && openAppIds.has(a.id));
  const dockApps = [...pinnedApps, ...unpinnedOpenApps];

  const shouldCollapse = isZenMode || isDockCollapsed;

  // Dismiss context menu on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHoldTimer = (
    e: React.PointerEvent,
    type: 'app' | 'start',
    appId?: string
  ) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    cancelHoldTimer();
    const target = e.currentTarget as HTMLElement;

    holdTimerRef.current = setTimeout(() => {
      SoundManager.play('click');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(35);
      }
      const rect = target.getBoundingClientRect();
      const popupX = Math.min(rect.left, window.innerWidth - 220);
      const popupY = Math.max(10, rect.top - (type === 'app' ? 210 : 230));
      setContextMenu({ type, appId, x: popupX, y: popupY });
      holdTimerRef.current = null;
    }, 380);
  };

  const cancelHoldTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleAppContextMenu = (e: React.MouseEvent, appId: string) => {
    e.preventDefault();
    e.stopPropagation();
    cancelHoldTimer();
    SoundManager.play('click');
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popupX = Math.min(rect.left, window.innerWidth - 220);
    const popupY = Math.max(10, rect.top - 210);
    setContextMenu({ type: 'app', appId, x: popupX, y: popupY });
  };

  const handleStartContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cancelHoldTimer();
    SoundManager.play('click');
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popupX = Math.min(rect.left, window.innerWidth - 220);
    const popupY = Math.max(10, rect.top - 230);
    setContextMenu({ type: 'start', x: popupX, y: popupY });
  };

  return (
    <div className="fixed bottom-[max(0.4rem,env(safe-area-inset-bottom,8px))] left-0 right-0 flex justify-center pointer-events-none z-50 px-2 select-none transition-transform duration-200">
      {/* Universal Floating Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          className="pointer-events-auto fixed z-50 w-56 p-1.5 bg-[#141822]/95 border border-white/20 rounded-xl shadow-2xl backdrop-blur-2xl text-xs text-gray-200 animate-in fade-in zoom-in-95 duration-150"
        >
          {contextMenu.type === 'app' && contextMenu.appId && (() => {
            const app = Kernel.apps.get(contextMenu.appId as AppId);
            if (!app) return null;
            const isOpen = openAppIds.has(app.id);
            const isPinned = app.pinnedToDock;

            return (
              <div className="space-y-0.5">
                {/* Header */}
                <div className="px-2.5 py-1.5 flex items-center gap-2 border-b border-white/10 mb-1">
                  <span className="text-base">{app.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{app.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">{isOpen ? 'Running' : 'Closed'}</p>
                  </div>
                </div>

                {/* Open / Focus */}
                <button
                  onClick={() => {
                    SoundManager.play('dock');
                    if (isOpen) {
                      Kernel.wm.restoreByAppId(app.id);
                    } else {
                      onLaunchApp(app.id);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 transition text-left cursor-pointer font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isOpen ? 'Bring to Front / Focus' : 'Open Application'}</span>
                </button>

                {/* Launch New Instance */}
                <button
                  onClick={() => {
                    SoundManager.play('dock');
                    Kernel.wm.launch(app.id as AppId, { multiInstance: true });
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-gray-200 transition text-left cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Launch New Instance</span>
                </button>

                {isOpen && (
                  <>
                    {/* Minimize App */}
                    <button
                      onClick={() => {
                        SoundManager.play('click');
                        Kernel.wm.minimizeByAppId(app.id);
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-gray-300 transition text-left cursor-pointer"
                    >
                      <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Minimize App</span>
                    </button>

                    <div className="my-1 border-t border-white/10" />

                    {/* Close App */}
                    <button
                      onClick={() => {
                        SoundManager.play('close');
                        Kernel.wm.closeByAppId(app.id);
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition text-left cursor-pointer font-medium"
                    >
                      <X className="w-3.5 h-3.5 text-rose-400" />
                      <span>Close App</span>
                    </button>
                  </>
                )}

                <div className="my-1 border-t border-white/10" />

                {/* Pin / Unpin */}
                <button
                  onClick={() => {
                    SoundManager.play('click');
                    Kernel.apps.togglePinToDock(app.id);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-gray-300 transition text-left cursor-pointer"
                >
                  {isPinned ? (
                    <>
                      <PinOff className="w-3.5 h-3.5 text-gray-400" />
                      <span>Unpin from Start Bar</span>
                    </>
                  ) : (
                    <>
                      <Pin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pin to Start Bar</span>
                    </>
                  )}
                </button>

                {/* Close All Windows across System */}
                <button
                  onClick={() => {
                    SoundManager.play('close');
                    Kernel.wm.closeAll();
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-600/30 text-red-300 hover:text-red-200 transition text-left cursor-pointer font-medium"
                >
                  <Power className="w-3.5 h-3.5 text-red-400" />
                  <span>Close All Windows</span>
                </button>
              </div>
            );
          })()}

          {contextMenu.type === 'start' && (
            <div className="space-y-0.5">
              <div className="px-2.5 py-1.5 flex items-center gap-2 border-b border-white/10 mb-1">
                <Rocket className="w-4 h-4 text-[#6ee7b7]" />
                <div>
                  <p className="font-semibold text-white">Helix OS Start Bar</p>
                  <p className="text-[10px] text-gray-400">System Launcher & WM</p>
                </div>
              </div>

              {/* Toggle Launcher */}
              <button
                onClick={() => {
                  SoundManager.play('dock');
                  onToggleLauncher();
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#6ee7b7]/20 text-[#6ee7b7] transition text-left cursor-pointer font-medium"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Open Start Launcher</span>
              </button>

              {/* Show Desktop / Minimize All */}
              <button
                onClick={() => {
                  SoundManager.play('click');
                  Kernel.wm.getWindows().forEach(w => Kernel.wm.minimize(w.id));
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-gray-300 transition text-left cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Show Desktop (Minimize All)</span>
              </button>

              {/* Tile All */}
              <button
                onClick={() => {
                  SoundManager.play('click');
                  Kernel.wm.tileAllWindows();
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-gray-300 transition text-left cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tile All Windows</span>
              </button>

              {/* Cascade Windows */}
              <button
                onClick={() => {
                  SoundManager.play('click');
                  Kernel.wm.cascadeAllWindows();
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-gray-300 transition text-left cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Cascade Windows</span>
              </button>

              <div className="my-1 border-t border-white/10" />

              {/* Settings */}
              <button
                onClick={() => {
                  SoundManager.play('dock');
                  onLaunchApp('settings');
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-gray-300 transition text-left cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                <span>System Preferences</span>
              </button>

              {/* Close All Windows */}
              <button
                onClick={() => {
                  SoundManager.play('close');
                  Kernel.wm.closeAll();
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 transition text-left cursor-pointer font-medium"
              >
                <X className="w-3.5 h-3.5 text-rose-400" />
                <span>Close All Windows</span>
              </button>
            </div>
          )}
        </div>
      )}

      {shouldCollapse ? (
        /* Ultra-Compact Dock Pill for Maximum Screen Space */
        <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 bg-[#101218]/90 border border-white/20 rounded-full backdrop-blur-xl shadow-2xl">
          <button
            onClick={() => {
              SoundManager.play('dock');
              onToggleLauncher();
            }}
            onContextMenu={handleStartContextMenu}
            className="w-7 h-7 rounded-full bg-[#6ee7b7]/20 text-[#6ee7b7] flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-[#6ee7b7]/30 transition"
            title="Open Start Menu (Right-click for options)"
          >
            <Rocket className="w-3.5 h-3.5" />
          </button>
          
          <div className="flex items-center gap-1">
            {dockApps.filter(a => openAppIds.has(a.id)).slice(0, 6).map(app => (
              <button
                key={app.id}
                onClick={() => {
                  SoundManager.play('dock');
                  onLaunchApp(app.id);
                }}
                onContextMenu={(e) => handleAppContextMenu(e, app.id)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition cursor-pointer overflow-hidden border ${
                  activeAppId === app.id
                    ? 'ring-1 ring-[#6ee7b7]'
                    : ''
                } ${app.iconBg || 'bg-white/5 border-transparent'}`}
                title={`${app.title} (Right-click for options)`}
              >
                <span className="scale-90 select-none">{app.icon}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              SoundManager.play('click');
              setIsDockCollapsed(false);
            }}
            className="w-6 h-6 rounded-full hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Expand Full Dock"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Full Expanded Dock */
        <nav className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-[#101218]/90 border border-white/15 rounded-2xl backdrop-blur-xl shadow-2xl max-w-[calc(100vw-1rem)] overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Start Menu / Launcher Button */}
          <button
            onClick={() => {
              cancelHoldTimer();
              SoundManager.play('dock');
              onToggleLauncher();
            }}
            onContextMenu={handleStartContextMenu}
            onPointerDown={(e) => startHoldTimer(e, 'start')}
            onPointerUp={cancelHoldTimer}
            onPointerLeave={cancelHoldTimer}
            onPointerCancel={cancelHoldTimer}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl transition-all cursor-pointer relative group shrink-0 ${
              isLauncherOpen
                ? 'bg-[#6ee7b7]/20 border border-[#6ee7b7]/40 text-[#6ee7b7]'
                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:-translate-y-1 active:scale-95'
            }`}
            title="Start Menu (Ctrl+K) • Press-hold or right-click for System Menu"
          >
            <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-[#6ee7b7]" />
            <span className="hidden sm:inline absolute -top-8 px-2 py-0.5 rounded bg-[#161822] border border-white/10 text-[10px] text-white opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
              Launcher (Hold or right-click)
            </span>
          </button>

          <div className="w-[1px] h-6 sm:h-8 bg-white/10 mx-0.5 shrink-0" />

          {/* Dock Apps */}
          {dockApps.map((app) => {
            const isOpen = openAppIds.has(app.id);
            const isBackground = backgroundAppIds.has(app.id);
            const isActive = activeAppId === app.id && !isBackground;

            return (
              <button
                key={app.id}
                onClick={() => {
                  cancelHoldTimer();
                  SoundManager.play('dock');
                  onLaunchApp(app.id);
                }}
                onContextMenu={(e) => handleAppContextMenu(e, app.id)}
                onPointerDown={(e) => startHoldTimer(e, 'app', app.id)}
                onPointerUp={cancelHoldTimer}
                onPointerLeave={cancelHoldTimer}
                onPointerCancel={cancelHoldTimer}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center text-lg sm:text-xl transition-all cursor-pointer relative group shrink-0 active:scale-95 border ${
                  isActive
                    ? 'shadow-[0_0_14px_rgba(110,231,183,0.3)] -translate-y-0.5 sm:-translate-y-1'
                    : isBackground
                    ? 'border-cyan-400/40'
                    : 'hover:-translate-y-0.5 sm:hover:-translate-y-1'
                } ${app.iconBg || 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                title={`${app.title} • Press-hold or right-click for menu`}
              >
                <span className="text-lg sm:text-xl leading-none select-none filter drop-shadow-md">{app.icon}</span>

                {/* Indicator Dot/Bar */}
                {isOpen && (
                  <span
                    className={`absolute bottom-1 rounded-full transition-all ${
                      isActive
                        ? 'bg-[#6ee7b7] w-2.5 sm:w-3 h-0.5 sm:h-1 shadow-[0_0_6px_#6ee7b7]'
                        : isBackground
                        ? 'bg-cyan-400/80 w-1 sm:w-1.5 h-1 sm:h-1.5 ring-1 ring-cyan-400/20'
                        : 'bg-white/60 w-1 sm:w-1.5 h-1 sm:h-1.5'
                    }`}
                  />
                )}

                {/* Hover Tooltip for desktop */}
                <span className="hidden sm:inline absolute -top-8 px-2 py-0.5 rounded bg-[#161822] border border-white/10 text-[10px] text-white opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                  {app.title} {isBackground && '(Background)'}
                </span>
              </button>
            );
          })}

          {/* Quick Collapse to Pill Button */}
          <button
            onClick={() => setIsDockCollapsed(true)}
            className="w-7 h-10 sm:w-8 sm:h-12 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Collapse Dock to Pill (Free up screen space)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </nav>
      )}
    </div>
  );
};
