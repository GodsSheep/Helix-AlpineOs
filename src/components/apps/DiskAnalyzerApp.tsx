import React, { useState } from 'react';
import { HardDrive, Folder, FileText, PieChart, Trash2, RefreshCw, PanelLeftClose, PanelLeft, Database, Sparkles, Layers } from 'lucide-react';
import { Toast } from '../../kernel/Toast';

interface PartitionItem {
  id: string;
  mount: string;
  filesystem: string;
  totalMB: number;
  usedMB: number;
  type: string;
}

interface DirectoryUsage {
  path: string;
  sizeMB: number;
  percent: number;
  color: string;
  fileCount: number;
}

const PARTITIONS: PartitionItem[] = [
  { id: 'root', mount: '/', filesystem: '/dev/vda1 (ext4)', totalMB: 512, usedMB: 95.5, type: 'Root Filesystem' },
  { id: 'home', mount: '/home', filesystem: '/dev/vda2 (btrfs)', totalMB: 1024, usedMB: 142.0, type: 'User Data' },
  { id: 'var', mount: '/var', filesystem: '/dev/vda3 (ext4)', totalMB: 256, usedMB: 48.2, type: 'Logs & Spool' },
  { id: 'tmp', mount: '/tmp', filesystem: 'tmpfs (ramdisk)', totalMB: 128, usedMB: 14.5, type: 'Temporary Memory' },
];

const ROOT_DIRECTORIES: DirectoryUsage[] = [
  { path: '/usr/share/alpine', sizeMB: 42.8, percent: 45, color: 'bg-cyan-500', fileCount: 1420 },
  { path: '/var/lib/sqlite', sizeMB: 24.2, percent: 25, color: 'bg-purple-500', fileCount: 84 },
  { path: '/etc/config', sizeMB: 12.4, percent: 13, color: 'bg-amber-500', fileCount: 160 },
  { path: '/home/helix/docs', sizeMB: 9.6, percent: 10, color: 'bg-[#6ee7b7]', fileCount: 38 },
  { path: '/tmp/cache', sizeMB: 6.5, percent: 7, color: 'bg-rose-500', fileCount: 112 },
];

export const DiskAnalyzerApp: React.FC = () => {
  const [selectedPartition, setSelectedPartition] = useState<PartitionItem>(PARTITIONS[0]);
  const [directories, setDirectories] = useState<DirectoryUsage[]>(ROOT_DIRECTORIES);
  const [showSidebar, setShowSidebar] = useState(true);

  const handleCleanCache = () => {
    setDirectories((prev) =>
      prev.map((d) => (d.path === '/tmp/cache' ? { ...d, sizeMB: 0.2, percent: 1, fileCount: 2 } : d))
    );
    Toast.show('Cleaned ephemeral cache and transient package locks', '🧹');
  };

  const totalUsed = directories.reduce((acc, curr) => acc + curr.sizeMB, 0).toFixed(1);

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden">
      {/* Top Header */}
      <div className="px-3 py-2 bg-[#141724] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showSidebar ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
            }`}
            title={showSidebar ? 'Collapse Mount Points' : 'Expand Mount Points'}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-sm">Storage & Disk Analyzer (`ncdu`)</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400 hidden sm:inline">
            VFS Block Allocator
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-gray-400">Mount: <strong className="text-cyan-300">{selectedPartition.mount}</strong></span>
          <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10">
            {totalUsed} MB / {selectedPartition.totalMB} MB
          </span>
          <button
            onClick={handleCleanCache}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 transition cursor-pointer flex items-center gap-1 font-sans text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clean Cache</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Mount Points Sidebar */}
        {showSidebar && (
          <div className="w-60 bg-[#10121d] border-r border-white/10 flex flex-col p-2.5 space-y-2 shrink-0 overflow-y-auto">
            <div className="text-[10px] uppercase text-gray-500 font-bold px-1.5 py-1 font-mono">
              Mount Points & Disks ({PARTITIONS.length})
            </div>
            <div className="space-y-1.5">
              {PARTITIONS.map((p) => {
                const pct = Math.round((p.usedMB / p.totalMB) * 100);
                const isSelected = selectedPartition.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPartition(p)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-white'
                        : 'bg-white/5 border-white/5 hover:border-white/15 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-cyan-400" />
                        {p.mount}
                      </span>
                      <span className="font-mono text-[10px] text-cyan-300">{pct}%</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">{p.type}</div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mt-1.5 border border-white/5">
                      <div className="h-full bg-cyan-400" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="font-mono text-[9px] text-gray-500 mt-1 flex justify-between">
                      <span>{p.filesystem}</span>
                      <span>{p.usedMB} MB</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
          {/* Quick partition switcher chips when collapsed */}
          {!showSidebar && (
            <div className="px-3 py-1.5 bg-[#141724] border-b border-white/10 flex items-center gap-1.5 overflow-x-auto shrink-0 font-mono text-[11px]">
              <span className="text-gray-400 text-[10px] uppercase">Mounts:</span>
              {PARTITIONS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPartition(p)}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                    selectedPartition.id === p.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {p.mount} ({Math.round((p.usedMB / p.totalMB) * 100)}%)
                </button>
              ))}
            </div>
          )}

          {/* Visual Usage Multi-bar */}
          <div className="p-3 bg-[#10121d] border-b border-white/10 space-y-2.5 shrink-0">
            <div className="w-full h-3 rounded-full bg-black/50 overflow-hidden flex border border-white/10">
              {directories.map((it, idx) => (
                <div
                  key={idx}
                  style={{ width: `${it.percent}%` }}
                  className={`${it.color} h-full transition-all duration-300`}
                  title={`${it.path}: ${it.sizeMB} MB (${it.percent}%)`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] font-mono">
              {directories.map((it, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${it.color}`} />
                  <span className="text-gray-300">{it.path}</span>
                  <span className="text-gray-500">({it.sizeMB} MB)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Directory Breakdown List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono px-1">
              <span>PATH / DIRECTORY HIERARCHY</span>
              <span>USAGE & INODES</span>
            </div>
            {directories.map((it, idx) => (
              <div
                key={idx}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-between font-mono transition cursor-pointer"
                onClick={() => Toast.show(`Inspected ${it.path} (${it.fileCount} inodes)`, '📁')}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-8 rounded-full ${it.color}`} />
                  <Folder className="w-4 h-4 text-cyan-300 shrink-0" />
                  <div>
                    <span className="font-bold text-white text-xs block">{it.path}</span>
                    <span className="text-[10px] text-gray-400">{it.fileCount} files & directories</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-cyan-300 font-bold block">{it.sizeMB} MB</span>
                    <span className="text-gray-500 text-[10px]">{it.percent}% of mount</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
