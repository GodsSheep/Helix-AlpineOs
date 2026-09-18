import React, { useState } from 'react';
import { Toast } from '../../kernel/Toast';
import { Kernel } from '../../kernel';
import { Archive, FolderArchive, FileText, Download, Upload, Plus, CheckCircle2, Shield, Search, PanelLeftClose, PanelLeft } from 'lucide-react';

interface ArchivedEntry {
  path: string;
  size: number;
  compressedSize: number;
  mode: string;
  modified: string;
}

const DEMO_ARCHIVES = [
  {
    name: 'alpine-base-system.tar.gz',
    format: 'tar.gz',
    sizeBytes: 2840192,
    entriesCount: 8,
    entries: [
      { path: 'etc/alpine-release', size: 14, compressedSize: 10, mode: '-rw-r--r--', modified: '2026-05-12' },
      { path: 'etc/apk/repositories', size: 184, compressedSize: 92, mode: '-rw-r--r--', modified: '2026-05-12' },
      { path: 'etc/inittab', size: 840, compressedSize: 310, mode: '-rw-r--r--', modified: '2026-05-12' },
      { path: 'etc/motd', size: 240, compressedSize: 110, mode: '-rw-r--r--', modified: '2026-05-12' },
      { path: 'bin/busybox', size: 1048576, compressedSize: 610000, mode: '-rwxr-xr-x', modified: '2026-05-10' },
      { path: 'sbin/apk', size: 524288, compressedSize: 312000, mode: '-rwxr-xr-x', modified: '2026-05-10' },
      { path: 'usr/bin/helix-core', size: 409600, compressedSize: 180000, mode: '-rwxr-xr-x', modified: '2026-05-14' },
      { path: 'usr/share/doc/alpine/README', size: 4200, compressedSize: 1400, mode: '-rw-r--r--', modified: '2026-05-10' },
    ],
  },
  {
    name: 'helix-configs-backup.zip',
    format: 'zip',
    sizeBytes: 142050,
    entriesCount: 4,
    entries: [
      { path: 'root/.bashrc', size: 1240, compressedSize: 520, mode: '-rw-r--r--', modified: '2026-06-01' },
      { path: 'root/.profile', size: 420, compressedSize: 190, mode: '-rw-r--r--', modified: '2026-06-01' },
      { path: 'etc/crontabs/root', size: 680, compressedSize: 290, mode: '-rw-r--r--', modified: '2026-06-01' },
      { path: 'etc/network/interfaces', size: 512, compressedSize: 220, mode: '-rw-r--r--', modified: '2026-06-01' },
    ],
  },
];

export const ArchiveApp: React.FC = () => {
  const [archives, setArchives] = useState(DEMO_ARCHIVES);
  const [selectedArchive, setSelectedArchive] = useState(DEMO_ARCHIVES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const handleExtractAll = async () => {
    setIsExtracting(true);
    Toast.show(`Extracting ${selectedArchive.name}...`, '📦');
    try {
      for (const entry of selectedArchive.entries) {
        await Kernel.vfs.write(
          `/${entry.path}`,
          `# Extracted from ${selectedArchive.name}\n# Path: ${entry.path}\n# Date: ${new Date().toISOString()}\n`
        );
      }
      setTimeout(() => {
        setIsExtracting(false);
        Toast.show(`Extracted ${selectedArchive.entries.length} files to / successfully!`, '✓');
      }, 500);
    } catch {
      setIsExtracting(false);
      Toast.show('Extraction encountered an error', '⚠️');
    }
  };

  const handleCreateArchive = () => {
    const name = prompt('Enter new archive name (e.g. user_backup.tar.gz):', 'my_backup.tar.gz');
    if (!name) return;
    const newArch = {
      name,
      format: name.endsWith('.zip') ? 'zip' : 'tar.gz',
      sizeBytes: 52400,
      entriesCount: 3,
      entries: [
        { path: 'home/user/document.txt', size: 1024, compressedSize: 340, mode: '-rw-r--r--', modified: 'Just now' },
        { path: 'home/user/notes.md', size: 2048, compressedSize: 810, mode: '-rw-r--r--', modified: 'Just now' },
        { path: 'home/user/script.sh', size: 512, compressedSize: 180, mode: '-rwxr-xr-x', modified: 'Just now' },
      ],
    };
    setArchives([newArch, ...archives]);
    setSelectedArchive(newArch);
    Toast.show(`Created archive ${name}`, '✓');
  };

  const filteredEntries = selectedArchive.entries.filter((e) =>
    e.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141724] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showSidebar ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
            }`}
            title={showSidebar ? 'Collapse Archive List' : 'Expand Archive List'}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <Archive className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-sm">Linux Archive Manager</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400 hidden sm:inline">
            tar / gzip / bzip2 / zip
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateArchive}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg flex items-center gap-1.5 font-medium transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Archive</span>
          </button>
          <button
            onClick={handleExtractAll}
            disabled={isExtracting}
            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 font-medium transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExtracting ? 'Extracting...' : 'Extract All'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Archive Selector Sidebar */}
        {showSidebar && (
          <div className="w-60 border-r border-white/10 bg-[#10121d] flex flex-col shrink-0">
            <div className="p-2 border-b border-white/10 text-[11px] text-gray-400 font-mono">
              LOADED ARCHIVES ({archives.length})
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {archives.map((arch) => (
                <div
                  key={arch.name}
                  onClick={() => setSelectedArchive(arch)}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    selectedArchive.name === arch.name
                      ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-sm'
                      : 'bg-white/5 border-white/5 hover:border-white/15 text-gray-300'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-2 truncate">
                    <FolderArchive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{arch.name}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 flex justify-between font-mono">
                    <span>{(arch.sizeBytes / 1024).toFixed(1)} KB</span>
                    <span className="text-amber-400">{arch.entries.length} items</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entries Table */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
          {/* Quick switcher when sidebar is collapsed */}
          {!showSidebar && (
            <div className="px-3 py-1.5 bg-[#141724] border-b border-white/10 flex items-center gap-1.5 overflow-x-auto shrink-0 font-mono text-[11px]">
              {archives.map((arch) => (
                <button
                  key={arch.name}
                  onClick={() => setSelectedArchive(arch)}
                  className={`px-2 py-1 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                    selectedArchive.name === arch.name
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FolderArchive className="w-3 h-3 text-amber-400" />
                  <span>{arch.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search bar */}
          <div className="p-2 bg-[#10121d] border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Filter files in archive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 bg-black/40 border border-white/15 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div className="font-mono text-[11px] text-gray-400">
              Format: <span className="text-amber-400 uppercase font-bold">{selectedArchive.format}</span>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-[#141724] text-gray-400 text-[10px] uppercase border-b border-white/10 sticky top-0">
                <tr>
                  <th className="p-2.5">Filename / Path</th>
                  <th className="p-2.5">Uncompressed</th>
                  <th className="p-2.5">Packed</th>
                  <th className="p-2.5">Ratio</th>
                  <th className="p-2.5">Permissions</th>
                  <th className="p-2.5">Modified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEntries.map((e) => {
                  const ratio = Math.round((1 - e.compressedSize / e.size) * 100);
                  return (
                    <tr key={e.path} className="hover:bg-white/5 transition">
                      <td className="p-2.5 font-medium text-white flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{e.path}</span>
                      </td>
                      <td className="p-2.5 text-gray-300">{e.size.toLocaleString()} B</td>
                      <td className="p-2.5 text-gray-400">{e.compressedSize.toLocaleString()} B</td>
                      <td className="p-2.5 text-emerald-400 font-bold">{ratio}%</td>
                      <td className="p-2.5 text-gray-400">{e.mode}</td>
                      <td className="p-2.5 text-gray-500">{e.modified}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
