import React, { useState, useEffect } from 'react';
import {
  Trash2,
  RefreshCw,
  RotateCcw,
  FileText,
  Package,
  AlertTriangle,
  Folder,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { Kernel } from '../../kernel';
import { Settings } from '../../kernel/Settings';
import { TrashManager, TrashItemMetadata } from '../../kernel/TrashManager';

export const TrashApp: React.FC = () => {
  const [trashedItems, setTrashedItems] = useState<TrashItemMetadata[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmEmptyOpen, setIsConfirmEmptyOpen] = useState<boolean>(false);

  const loadTrash = async () => {
    try {
      const items = await TrashManager.list();
      setTrashedItems(items);
    } catch (err) {
      console.warn('Failed to load trash items:', err);
    }
  };

  useEffect(() => {
    loadTrash();
    const unsub = TrashManager.subscribe(() => loadTrash());
    return () => unsub();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRestoreSelected = async () => {
    if (selectedIds.size === 0) return;
    let count = 0;

    for (const id of Array.from(selectedIds)) {
      const ok = await TrashManager.restore(id);
      if (ok) count++;
    }

    setSelectedIds(new Set());
    await loadTrash();
  };

  const handleEmptyTrash = async () => {
    await TrashManager.emptyTrash();
    setIsConfirmEmptyOpen(false);
    setSelectedIds(new Set());
    await loadTrash();
  };

  const totalSizeKb = trashedItems.reduce((acc, curr) => acc + curr.sizeKb, 0);

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-gray-100 select-none font-sans overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-[#131622] border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              Helix Trash & Recycle Bin
            </h2>
            <p className="text-[11px] text-gray-400">
              Recover deleted files and uninstalled apps or purge permanently
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRestoreSelected}
            disabled={selectedIds.size === 0}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore ({selectedIds.size})</span>
          </button>

          <button
            onClick={() => setIsConfirmEmptyOpen(true)}
            disabled={trashedItems.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-lg shadow-rose-900/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Trash</span>
          </button>
        </div>
      </div>

      {/* Info Stats Bar */}
      <div className="px-4 py-2 bg-[#10121d] border-b border-white/5 flex items-center justify-between text-xs font-mono text-gray-400">
        <span className="flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
          <span>{trashedItems.length} items in trash</span>
          <span className="text-gray-600">•</span>
          <span className="text-amber-300">{totalSizeKb} KB allocated</span>
        </span>

        <button
          onClick={loadTrash}
          className="text-gray-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Main Items Table */}
      <div className="flex-1 p-3 overflow-y-auto">
        {trashedItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
            <Trash2 className="w-12 h-12 text-gray-500 stroke-[1.5]" />
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">Trash is Empty</h3>
              <p className="text-xs text-gray-400 max-w-xs">
                Deleted files and uninstalled system apps will appear here for safe recovery.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {trashedItems.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500/15 border-rose-500/50 text-white'
                      : 'bg-[#151825] border-white/5 hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded bg-black/40 border-white/20 text-rose-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="p-2 rounded-lg bg-white/5 text-rose-400 border border-white/10">
                      {item.type === 'app' ? <Package className="w-4 h-4 text-purple-400" /> : <FileText className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">{item.filename}</div>
                      <div className="text-[11px] text-gray-400 font-mono">Original Location: {item.originalPath}</div>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono text-gray-400">
                    <div>{item.sizeKb} KB</div>
                    <div className="text-[10px] text-gray-500">{item.deletedAt}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Empty Modal */}
      {isConfirmEmptyOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151825] border border-rose-500/40 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-base">Empty Trash Permanently?</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete all {trashedItems.length} item(s)? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsConfirmEmptyOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-rose-900/40"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
