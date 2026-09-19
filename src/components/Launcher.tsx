import React, { useState, useEffect, useRef } from 'react';
import { Kernel } from '../kernel';
import { SoundManager } from '../kernel/SoundManager';
import { Search, Sparkles, X, Plus, Pin, PinOff, Terminal, Globe, FileText, Check, Trash2 } from 'lucide-react';
import { AppDefinition } from '../kernel/types';
import { Settings } from '../kernel/Settings';

interface LauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp: (appId: string) => void;
}

export const Launcher: React.FC<LauncherProps> = ({ isOpen, onClose, onLaunchApp }) => {
  const [query, setQuery] = useState('');
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [newAppTitle, setNewAppTitle] = useState('');
  const [newAppIcon, setNewAppIcon] = useState('🚀');
  const [newAppCategory, setNewAppCategory] = useState<'Development' | 'Utilities' | 'System'>('Utilities');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [newAppCmd, setNewAppCmd] = useState('');
  const [newAppPin, setNewAppPin] = useState(true);
  const [appListVersion, setAppListVersion] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setShowAddAppModal(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Escape' && isOpen) {
        if (showAddAppModal) {
          setShowAddAppModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showAddAppModal]);

  if (!isOpen) return null;

  const uninstalledIds = new Set(Settings.get().uninstalledAppIds || []);
  const allApps = Kernel.apps.getAll().filter(a => !uninstalledIds.has(a.id));
  const filtered = Kernel.apps.search(query).filter(a => !uninstalledIds.has(a.id));

  const handleSelect = (appId: string) => {
    SoundManager.play('dock');
    onLaunchApp(appId);
    onClose();
  };

  const handleTogglePin = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    SoundManager.play('click');
    Kernel.apps.togglePinToDock(appId);
    setAppListVersion((v) => v + 1);
  };

  const handleCreateCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppTitle.trim()) return;

    const id = `custom-${newAppTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newApp: AppDefinition = {
      id: id as any,
      title: newAppTitle.trim(),
      icon: newAppIcon || '🚀',
      category: newAppCategory,
      description: newAppDesc.trim() || `Custom Helix command: ${newAppCmd || 'echo Hello'}`,
      width: 540,
      height: 400,
      pinnedToDock: newAppPin,
    };

    Kernel.apps.addApp(newApp);

    // If user provided command, save script to /mnt/helix
    if (newAppCmd.trim()) {
      Kernel.vfs.write(`/${newAppTitle.toLowerCase().replace(/\s+/g, '_')}.sh`, `#!/bin/sh\n# Helix shortcut: ${newAppTitle}\n${newAppCmd}\n`);
    }

    setAppListVersion((v) => v + 1);
    setShowAddAppModal(false);
    setNewAppTitle('');
    setNewAppCmd('');
    setNewAppDesc('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-md select-none"
      onClick={onClose}
    >
      <div
        className="w-[92vw] max-w-xl bg-[#12141b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search & Top Action Header */}
        <div className="p-3.5 border-b border-white/10 flex items-center gap-3 bg-[#151720]">
          <Search className="w-4 h-4 text-[#8b93a7]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtered.length > 0) {
                handleSelect(filtered[0].id);
              }
            }}
            placeholder="Search applications or commands (Ctrl+K)..."
            className="flex-1 bg-transparent border-0 text-white text-sm outline-none placeholder:text-[#5b6478]"
          />

          {/* Add App Button */}
          <button
            onClick={() => setShowAddAppModal((prev) => !prev)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition cursor-pointer border ${
              showAddAppModal
                ? 'bg-[#6ee7b7]/20 border-[#6ee7b7]/40 text-[#6ee7b7]'
                : 'bg-white/5 border-white/10 text-[#8b93a7] hover:text-white hover:bg-white/10'
            }`}
            title="Add new app to start menu or Helix"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add App</span>
          </button>

          {/* Top ESC Button with close action */}
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition cursor-pointer font-mono border border-red-500/20"
            title="Close Start Menu (Esc)"
          >
            <X className="w-3.5 h-3.5" />
            <span>ESC</span>
          </button>
        </div>

        {/* Modal: Add Custom App to Start Menu */}
        {showAddAppModal && (
          <form onSubmit={handleCreateCustomApp} className="p-4 bg-[#181a24] border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#6ee7b7]">
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add New App to Start Menu & Helix
              </span>
              <button
                type="button"
                onClick={() => setShowAddAppModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] text-[#8b93a7] block mb-1">App Title</label>
                <input
                  type="text"
                  required
                  value={newAppTitle}
                  onChange={(e) => setNewAppTitle(e.target.value)}
                  placeholder="e.g. Python REPL, Web Browser, Game"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/10 text-white text-xs outline-none focus:border-[#6ee7b7]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#8b93a7] block mb-1">Icon (Emoji)</label>
                <input
                  type="text"
                  value={newAppIcon}
                  onChange={(e) => setNewAppIcon(e.target.value)}
                  placeholder="🚀"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/10 text-white text-xs text-center outline-none focus:border-[#6ee7b7]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[#8b93a7] block mb-1">Category</label>
                <select
                  value={newAppCategory}
                  onChange={(e) => setNewAppCategory(e.target.value as any)}
                  className="w-full px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 text-white text-xs outline-none cursor-pointer"
                >
                  <option value="Development">Development</option>
                  <option value="Utilities">Utilities</option>
                  <option value="System">System</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#8b93a7] block mb-1">Shell Action / Command</label>
                <input
                  type="text"
                  value={newAppCmd}
                  onChange={(e) => setNewAppCmd(e.target.value)}
                  placeholder="python3 /mnt/helix/app.py"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/10 text-white text-xs outline-none focus:border-[#6ee7b7]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#8b93a7] block mb-1">Description</label>
              <input
                type="text"
                value={newAppDesc}
                onChange={(e) => setNewAppDesc(e.target.value)}
                placeholder="Brief description of application..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/10 text-white text-xs outline-none focus:border-[#6ee7b7]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 text-xs text-[#8b93a7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAppPin}
                  onChange={(e) => setNewAppPin(e.target.checked)}
                  className="rounded accent-[#6ee7b7]"
                />
                Pin to Bottom Dock
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAppModal(false)}
                  className="px-3 py-1 text-xs rounded-lg text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#6ee7b7] text-black hover:bg-[#5cd4a5] transition cursor-pointer"
                >
                  Save App
                </button>
              </div>
            </div>
          </form>
        )}

        {/* App List */}
        <div className="max-h-[50vh] overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((app) => (
              <div
                key={app.id}
                onClick={() => handleSelect(app.id)}
                className="w-full p-2.5 rounded-xl hover:bg-[#6ee7b7]/10 border border-transparent hover:border-[#6ee7b7]/20 flex items-center justify-between transition group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-105 transition shrink-0 border ${app.iconBg || 'bg-white/5 border-white/10'}`}>
                    <span className="select-none filter drop-shadow-md">{app.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs truncate">{app.title}</span>
                      <span className="text-[10px] text-[#8b93a7] font-mono">[{app.category}]</span>
                    </div>
                    <p className="text-[11px] text-[#8b93a7] truncate">{app.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-2">
                  {/* Pin/Unpin Action */}
                  <button
                    onClick={(e) => handleTogglePin(e, app.id)}
                    className={`p-1.5 rounded-lg transition ${
                      app.pinnedToDock
                        ? 'text-[#6ee7b7] hover:bg-[#6ee7b7]/20'
                        : 'text-gray-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100'
                    }`}
                    title={app.pinnedToDock ? 'Unpin from dock' : 'Pin to dock'}
                  >
                    {app.pinnedToDock ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Uninstall App Action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      SoundManager.play('trash');
                      const uninstalled = [...(Settings.get().uninstalledAppIds || [])];
                      if (!uninstalled.includes(app.id)) {
                        uninstalled.push(app.id);
                        Settings.update({ uninstalledAppIds: uninstalled });
                      }
                      setAppListVersion((v) => v + 1);
                    }}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 opacity-0 group-hover:opacity-100 transition"
                    title="Uninstall App (Move to Trash)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-[#8b93a7] text-xs space-y-2">
              <p>No applications matching &quot;{query}&quot;</p>
              <button
                onClick={() => {
                  setNewAppTitle(query);
                  setShowAddAppModal(true);
                }}
                className="text-[#6ee7b7] underline hover:text-[#5cd4a5] cursor-pointer"
              >
                Add &quot;{query}&quot; as a new Helix application
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-3.5 py-2 border-t border-white/10 bg-[#0d0e14] flex items-center justify-between text-[11px] text-[#5b6478]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#6ee7b7]" />
            <span>Helix OS Start Menu</span>
          </span>
          <span>{filtered.length} apps installed</span>
        </div>
      </div>
    </div>
  );
};
