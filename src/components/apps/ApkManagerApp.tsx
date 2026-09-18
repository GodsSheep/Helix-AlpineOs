import React, { useState } from 'react';
import { Package, Download, Trash2, RefreshCw, CheckCircle2, Shield, Search, PanelLeftClose, PanelLeft, ArrowUpCircle, Check } from 'lucide-react';
import { Toast } from '../../kernel/Toast';

interface PackageItem {
  id: string;
  name: string;
  version: string;
  size: string;
  description: string;
  installed: boolean;
  category: string;
}

const INITIAL_PACKAGES: PackageItem[] = [
  { id: 'git', name: 'git', version: '2.43.0-r0', size: '4.8 MB', description: 'Fast, scalable, distributed revision control system', installed: true, category: 'Development' },
  { id: 'python3', name: 'python3', version: '3.11.7-r0', size: '18.2 MB', description: 'High-level scripting and general-purpose programming language', installed: true, category: 'Development' },
  { id: 'nodejs', name: 'nodejs', version: '20.11.0-r0', size: '24.5 MB', description: 'JavaScript runtime built on Chrome V8 engine', installed: true, category: 'Development' },
  { id: 'htop', name: 'htop', version: '3.3.0-r0', size: '140 KB', description: 'Interactive process viewer and system monitor', installed: true, category: 'System' },
  { id: 'docker', name: 'docker-cli', version: '25.0.1-r0', size: '32.1 MB', description: 'Alpine container orchestration command-line interface', installed: false, category: 'Containers' },
  { id: 'tmux', name: 'tmux', version: '3.4-r0', size: '380 KB', description: 'Terminal multiplexer for managing multiple sessions', installed: false, category: 'Utilities' },
  { id: 'curl', name: 'curl', version: '8.5.0-r0', size: '520 KB', description: 'Command line tool for transferring data with URLs', installed: true, category: 'Network' },
  { id: 'sqlite', name: 'sqlite', version: '3.45.0-r0', size: '1.2 MB', description: 'C library that provides a lightweight disk-based database', installed: false, category: 'Database' },
  { id: 'nginx', name: 'nginx', version: '1.24.0-r0', size: '780 KB', description: 'HTTP and reverse proxy server, mail proxy server', installed: false, category: 'Server' },
  { id: 'vim', name: 'vim', version: '9.0.2103-r0', size: '16.4 MB', description: 'Vi IMproved, a programmers text editor', installed: true, category: 'Development' },
  { id: 'ripgrep', name: 'ripgrep', version: '14.1.0-r0', size: '2.1 MB', description: 'Line-oriented search tool combining grep speed with usability', installed: true, category: 'Utilities' },
  { id: 'neofetch', name: 'neofetch', version: '7.1.0-r2', size: '85 KB', description: 'CLI system information tool written in BASH', installed: true, category: 'System' },
  { id: 'wireguard', name: 'wireguard-tools', version: '1.0.20210914-r3', size: '310 KB', description: 'Fast, modern, secure VPN kernel tunneling protocol tools', installed: false, category: 'Network' },
  { id: 'redis', name: 'redis', version: '7.2.4-r0', size: '3.4 MB', description: 'Advanced key-value database and cache server', installed: false, category: 'Database' },
];

const CATEGORIES = [
  'ALL',
  'INSTALLED',
  'AVAILABLE',
  'Development',
  'System',
  'Network',
  'Database',
  'Containers',
  'Utilities',
  'Server',
];

export const ApkManagerApp: React.FC = () => {
  const [packages, setPackages] = useState<PackageItem[]>(INITIAL_PACKAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [isUpdatingIndex, setIsUpdatingIndex] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const handleToggleInstall = (id: string) => {
    setInstallingId(id);
    const target = packages.find((p) => p.id === id);
    setTimeout(() => {
      setPackages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, installed: !p.installed } : p))
      );
      setInstallingId(null);
      if (target) {
        Toast.show(
          `apk ${target.installed ? 'del' : 'add'} ${target.name} [OK]`,
          target.installed ? '🗑️' : '✓'
        );
      }
    }, 700);
  };

  const handleUpdateRepos = () => {
    setIsUpdatingIndex(true);
    Toast.show('apk update: Fetching mirrors from dl-cdn.alpinelinux.org...', '🔄');
    setTimeout(() => {
      setIsUpdatingIndex(false);
      Toast.show('apk update: 14 indexes updated, 14,290 packages available', '✓');
    }, 1000);
  };

  const handleUpgradeAll = () => {
    Toast.show('apk upgrade: All system binaries are up to date.', '✓');
  };

  const filtered = packages.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'INSTALLED') return p.installed;
    if (selectedCategory === 'AVAILABLE') return !p.installed;
    return p.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const installedCount = packages.filter((p) => p.installed).length;

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-[#141724] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showSidebar ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
            }`}
            title={showSidebar ? 'Collapse Categories' : 'Expand Categories'}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <Package className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-sm">Alpine APK Package Manager</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400 hidden sm:inline">
            apk-tools v3.20
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdateRepos}
            disabled={isUpdatingIndex}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingIndex ? 'animate-spin text-amber-400' : ''}`} />
            <span>Update Repo Index</span>
          </button>
          <button
            onClick={handleUpgradeAll}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 border border-amber-500/30"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Upgrade All</span>
          </button>
        </div>
      </div>

      {/* Sub Toolbar & Search */}
      <div className="p-2.5 bg-[#10121d] border-b border-white/10 flex items-center justify-between shrink-0 gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search binary, library or utility..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/15 rounded-lg pl-8 pr-3 py-1 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>
        <div className="font-mono text-[11px] text-gray-400 flex items-center gap-2">
          <span>{installedCount} installed</span>
          <span>•</span>
          <span>{packages.length - installedCount} available</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Category Sidebar */}
        {showSidebar && (
          <div className="w-52 bg-[#0f111a] border-r border-white/10 flex flex-col p-2 space-y-1 shrink-0 overflow-y-auto font-sans">
            <div className="text-[10px] uppercase text-gray-500 font-bold px-2 py-1 font-mono">
              Categories & Filters
            </div>
            {CATEGORIES.map((cat) => {
              const count =
                cat === 'ALL'
                  ? packages.length
                  : cat === 'INSTALLED'
                  ? installedCount
                  : cat === 'AVAILABLE'
                  ? packages.length - installedCount
                  : packages.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  <span className="text-[10px] font-mono text-gray-500">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Package Content List */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
          {/* Quick category chips fallback when collapsed */}
          {!showSidebar && (
            <div className="px-3 py-1.5 bg-[#141724] border-b border-white/10 flex items-center gap-1.5 overflow-x-auto shrink-0 font-mono text-[11px]">
              <span className="text-gray-400 text-[10px] uppercase">Cat:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.map((pkg) => (
              <div
                key={pkg.id}
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-xl bg-black/40 border border-white/10 text-amber-400 font-mono font-bold text-xs">
                    {pkg.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{pkg.name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                        {pkg.version}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                        {pkg.category}
                      </span>
                      {pkg.installed && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                          <Check className="w-3 h-3" /> installed
                        </span>
                      )}
                    </div>
                    <div className="text-gray-300 text-[11px] mt-0.5">{pkg.description}</div>
                    <div className="text-[10px] font-mono text-gray-500 mt-1">Package size: {pkg.size}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleInstall(pkg.id)}
                  disabled={installingId === pkg.id}
                  className={`px-3.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs ${
                    pkg.installed
                      ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold'
                  }`}
                >
                  {installingId === pkg.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : pkg.installed ? (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Uninstall</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Install APK</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
