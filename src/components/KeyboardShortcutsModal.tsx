import React from 'react';
import { X, Command, Terminal, Folder, Settings, Globe, Edit3, Activity, Clock, Server, Monitor, Sparkles, LayoutGrid } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp?: (appId: string) => void;
}

interface ShortcutGroup {
  category: string;
  items: Array<{
    keys: string[];
    description: string;
    icon?: React.ReactNode;
    appId?: string;
  }>;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onLaunchApp,
}) => {
  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const superKey = isMac ? '⌘' : 'Super / Win';

  const shortcutGroups: ShortcutGroup[] = [
    {
      category: 'Desktop Navigation & App Launchers',
      items: [
        {
          keys: [superKey, 'T', 'or', 'Alt+T'],
          description: 'Launch Terminal Shell (real host POSIX shell)',
          icon: <Terminal className="w-4 h-4 text-emerald-400" />,
          appId: 'term',
        },
        {
          keys: [superKey, 'E', 'or', 'Alt+E'],
          description: 'Launch File Manager (Virtual Filesystem / IndexedDB)',
          icon: <Folder className="w-4 h-4 text-sky-400" />,
          appId: 'files',
        },
        {
          keys: [superKey, 'I', 'or', 'Alt+I'],
          description: 'Launch System Settings & Customization',
          icon: <Settings className="w-4 h-4 text-amber-400" />,
          appId: 'settings',
        },
        {
          keys: [superKey, 'B', 'or', 'Alt+B'],
          description: 'Launch Web Browser & Documentation Hub',
          icon: <Globe className="w-4 h-4 text-blue-400" />,
          appId: 'browser',
        },
        {
          keys: [superKey, 'C', 'or', 'Alt+C', 'or', 'Super+N'],
          description: 'Launch Text & Code Editor',
          icon: <Edit3 className="w-4 h-4 text-indigo-400" />,
          appId: 'edit',
        },
        {
          keys: [superKey, 'M', 'or', 'Ctrl+Shift+Esc'],
          description: 'Launch System Activity & Process Monitor',
          icon: <Activity className="w-4 h-4 text-rose-400" />,
          appId: 'mon',
        },
        {
          keys: [superKey, 'K', 'or', 'Alt+K'],
          description: 'Launch Cron Task Scheduler',
          icon: <Clock className="w-4 h-4 text-emerald-400" />,
          appId: 'cron',
        },
        {
          keys: [superKey, 'O', 'or', 'Alt+O'],
          description: 'Launch Multi-OS Boot Hub & Kernel Switcher',
          icon: <Server className="w-4 h-4 text-cyan-400" />,
          appId: 'osselector',
        },
      ],
    },
    {
      category: 'Window & System Controls',
      items: [
        {
          keys: [superKey, 'Space', 'or', 'Alt+Space', 'or', superKey, 'P'],
          description: 'Toggle Application Launcher',
          icon: <LayoutGrid className="w-4 h-4 text-purple-400" />,
        },
        {
          keys: ['Alt+Z', 'or', 'F11'],
          description: 'Toggle Zen Mode (Maximize screen workspace & hide title bars)',
          icon: <Monitor className="w-4 h-4 text-teal-400" />,
        },
        {
          keys: ['Alt+S', 'or', 'PrintScreen'],
          description: 'Hotshot Screenshot Capture & Image Annotation',
          icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
          appId: 'hotshot',
        },
        {
          keys: [superKey, 'D', 'or', 'Alt+D'],
          description: 'Show Desktop (Minimize all windows)',
          icon: <Monitor className="w-4 h-4 text-gray-400" />,
        },
        {
          keys: ['F1', 'or', 'Super+?', 'or', 'Alt+?'],
          description: 'Show this Global Keyboard Shortcuts Cheat Sheet',
          icon: <Command className="w-4 h-4 text-yellow-400" />,
        },
      ],
    },
    {
      category: 'Terminal Shell Hotkeys',
      items: [
        {
          keys: ['Ctrl+C'],
          description: 'Interrupt / cancel active running process or current line',
        },
        {
          keys: ['Ctrl+L'],
          description: 'Clear terminal screen buffer',
        },
        {
          keys: ['Tab'],
          description: 'Auto-complete Linux command or filename in VFS',
        },
        {
          keys: ['Arrow Up / Down'],
          description: 'Navigate bash / shell execution history',
        },
        {
          keys: ['theme [name]'],
          description: 'Switch terminal theme (e.g., theme nord, theme dracula, theme gruvbox)',
        },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] bg-[#0e111a] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#edf1f7] text-xs select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#141824] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Helix OS Global Keyboard Shortcuts
              </h2>
              <p className="text-[11px] text-gray-400">
                Speed up your desktop workflow with instantaneous keyboard navigation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2.5">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{group.category}</span>
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {group.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    onClick={() => {
                      if (item.appId && onLaunchApp) {
                        onLaunchApp(item.appId);
                        onClose();
                      }
                    }}
                    className={`p-2.5 rounded-xl border border-white/5 bg-white/[0.03] flex items-center justify-between gap-3 transition ${
                      item.appId ? 'hover:bg-white/10 hover:border-emerald-500/30 cursor-pointer group' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.icon && <span className="shrink-0">{item.icon}</span>}
                      <span className="text-gray-200 text-[11px] truncate">
                        {item.description}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.keys.map((k, kIdx) => {
                        if (k === 'or') {
                          return (
                            <span key={kIdx} className="text-[10px] text-gray-500 font-sans px-0.5">
                              or
                            </span>
                          );
                        }
                        return (
                          <kbd
                            key={kIdx}
                            className="px-2 py-1 rounded-md bg-black/60 border border-white/20 text-[10px] font-mono text-emerald-300 font-semibold shadow-inner"
                          >
                            {k}
                          </kbd>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#141824] border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400 shrink-0">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/15 text-emerald-300 font-mono">F1</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/15 text-emerald-300 font-mono">Super + ?</kbd> anytime to open this guide.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-medium transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
