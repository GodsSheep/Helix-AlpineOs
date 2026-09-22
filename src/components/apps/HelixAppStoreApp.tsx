import React, { useState, useMemo } from 'react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { Kernel } from '../../kernel';
import { AppId } from '../../kernel/types';
import { 
  ShoppingBag, 
  Search, 
  Sparkles, 
  Download, 
  Check, 
  Star, 
  ExternalLink, 
  ShieldCheck, 
  Terminal, 
  Gamepad2, 
  Code2, 
  Wrench, 
  Music, 
  Cpu, 
  Layers, 
  ArrowUpRight,
  Filter,
  PackageCheck,
  PlusCircle,
  FolderOpen
} from 'lucide-react';

interface StoreAppItem {
  id: AppId;
  name: string;
  category: 'Featured' | 'AI & LLM' | 'Development' | 'Utilities' | 'Games' | 'Media' | 'Security';
  tagline: string;
  description: string;
  icon: string;
  author: string;
  version: string;
  rating: number;
  downloads: string;
  permissions: string[];
  size: string;
  isInstalled: boolean;
  isFeatured?: boolean;
}

export const HelixAppStoreApp: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<StoreAppItem | null>(null);
  const [installedApps, setInstalledApps] = useState<Set<string>>(new Set([
    'terminal', 'files', 'edit', 'settings', 'monitor', 'browser', 'helix-ai', 'dev-tools-studio', 'retro-emulator'
  ]));
  const [activeTab, setActiveTab] = useState<'store' | 'publisher'>('store');

  // Custom app submission form state
  const [customAppName, setCustomAppName] = useState('');
  const [customAppDesc, setCustomAppDesc] = useState('');
  const [customAppCategory, setCustomAppCategory] = useState('Utilities');
  const [customAppCode, setCustomAppCode] = useState('// Helix OS Applet Script\nhelix.ui.toast("Hello from Custom Applet!");\n');

  const storeApps: StoreAppItem[] = useMemo(() => [
    {
      id: 'helix-ai',
      name: 'Helix Copilot & Neural Engine',
      category: 'AI & LLM',
      tagline: 'Multi-modal AI assistant with terminal scripting & VFS automation.',
      description: 'Integrated local intelligence engine powered by deep reasoning algorithms. Query system logs, generate shell scripts, and debug code right on your desktop.',
      icon: '🧠',
      author: 'Helix Neural Labs',
      version: '3.4.0',
      rating: 4.9,
      downloads: '142K',
      permissions: ['VFS Read/Write', 'Kernel Syscall Hook', 'Terminal Bridge'],
      size: '12.4 MB',
      isInstalled: installedApps.has('helix-ai'),
      isFeatured: true,
    },
    {
      id: 'dev-tools-studio',
      name: 'DevTools Engineering Studio',
      category: 'Development',
      tagline: 'Swiss Army knife for developers: AST viewers, Regex, REST clients.',
      description: 'Full-fledged web development workbench including JSON formatters, REST API test runners, JavaScript/TypeScript AST tokenizers, and visual code diffing.',
      icon: '🛠️',
      author: 'OpenDev Foundation',
      version: '2.1.0',
      rating: 4.8,
      downloads: '98K',
      permissions: ['Local Network', 'Clipboard API', 'VFS Access'],
      size: '8.2 MB',
      isInstalled: installedApps.has('dev-tools-studio'),
      isFeatured: true,
    },
    {
      id: 'retro-emulator',
      name: 'Retro Emulator & MicroVM',
      category: 'Games',
      tagline: 'Hardware-accurate CHIP-8, 8-bit space arcade, and scanline CRT shaders.',
      description: 'Play classic arcade shooters, CHIP-8 homebrew titles, and custom ROMs with full virtual gamepad support, turbo mode, and save state persistence.',
      icon: '🕹️',
      author: 'RetroByte Studios',
      version: '1.5.2',
      rating: 4.9,
      downloads: '115K',
      permissions: ['Web Audio API', 'Hardware Canvas 2D', 'Gamepad API'],
      size: '5.6 MB',
      isInstalled: installedApps.has('retro-emulator'),
      isFeatured: true,
    },
    {
      id: 'media-player',
      name: 'Hi-Fi Media Player & DSP',
      category: 'Media',
      tagline: 'Audio visualizer with frequency spectrum DSP and equalizer presets.',
      description: 'Multi-format media player featuring real-time 60 FPS audio spectrum visualizers (bars, oscilloscope waveforms, pulsing circles) and custom equalization curves.',
      icon: '🎵',
      author: 'Soundwave Systems',
      version: '2.0.4',
      rating: 4.7,
      downloads: '64K',
      permissions: ['Web Audio API', 'VFS File Streaming'],
      size: '6.8 MB',
      isInstalled: installedApps.has('media-player'),
      isFeatured: false,
    },
    {
      id: 'visual-game-engine',
      name: 'Visual Game Engine (No-Code)',
      category: 'Development',
      tagline: 'Node-based game creation studio with 2D physics and live playtesting.',
      description: 'Build and export 2D platformers and physics puzzles using intuitive drag-and-drop logic nodes, particle emitters, and immediate canvas simulation.',
      icon: '🎮',
      author: 'PixelLogic Team',
      version: '1.2.0',
      rating: 4.8,
      downloads: '77K',
      permissions: ['Hardware Canvas 2D', 'VFS Save Scenes'],
      size: '9.1 MB',
      isInstalled: installedApps.has('visual-game-engine'),
      isFeatured: false,
    },
    {
      id: 'linux-security',
      name: 'Linux Security & Hardening Suite',
      category: 'Security',
      tagline: 'Lynis security audits, AppArmor profiles, and UFW firewall configuration.',
      description: 'Enterprise security suite for auditing system vulnerabilities, inspecting open ports, monitoring auditd system calls, and generating OpenSSL cryptographic keys.',
      icon: '🛡️',
      author: 'CyberGuard Alliance',
      version: '4.0.1',
      rating: 4.9,
      downloads: '88K',
      permissions: ['Kernel Syscall Audit', 'Network Packet Filter', 'Root Access'],
      size: '11.0 MB',
      isInstalled: installedApps.has('linux-security'),
      isFeatured: false,
    },
    {
      id: 'universal-utils',
      name: 'Universal Utilities & DB Studio',
      category: 'Utilities',
      tagline: 'CSV/JSON converters, text transform workbenches, and cryptographic hashes.',
      description: 'High-speed utility suite for data conversions, MD5/SHA256 checksum verifications, Unix epoch timestamps, and URL slugifiers.',
      icon: '🧰',
      author: 'CoreUtils Project',
      version: '3.1.2',
      rating: 4.6,
      downloads: '52K',
      permissions: ['VFS File Access'],
      size: '4.5 MB',
      isInstalled: installedApps.has('universal-utils'),
      isFeatured: false,
    },
    {
      id: 'p2p-mesh',
      name: 'P2P Mesh Network & WebRTC Hub',
      category: 'Utilities',
      tagline: 'Decentralized peer-to-peer file transfer and real-time chat sockets.',
      description: 'Connect directly to other Helix OS nodes via encrypted WebRTC data channels for instant zero-server file sharing and peer synchronization.',
      icon: '🌐',
      author: 'MeshLink Network',
      version: '1.0.8',
      rating: 4.7,
      downloads: '41K',
      permissions: ['WebRTC Peer Connection', 'VFS Sync Engine'],
      size: '7.3 MB',
      isInstalled: installedApps.has('p2p-mesh'),
      isFeatured: false,
    },
    {
      id: 'wine-app',
      name: 'Wine 9.0 Pro Windows Bridge',
      category: 'Utilities',
      tagline: 'Win32 binary execution layer with PE header parser and DirectDraw emulation.',
      description: 'Execute classic Windows 95/XP .exe and .msi binaries with virtual registry mounts, GDI graphics simulation, and memory mapping.',
      icon: '🍷',
      author: 'WineHQ Community',
      version: '9.0.2',
      rating: 4.8,
      downloads: '130K',
      permissions: ['Win32 PE Runtime', 'DirectDraw Emulation'],
      size: '18.4 MB',
      isInstalled: installedApps.has('wine-app'),
      isFeatured: false,
    },
    {
      id: 'setup',
      name: 'Helix Mega Setup & Ecosystem Suite',
      category: 'Utilities',
      tagline: 'Kernel parameter tuner, baud rates, and Alpine chroot environment controls.',
      description: 'Comprehensive system administration control panel for configuring system swap partitions, kernel serial baud rates, and isolated chroot containers.',
      icon: '⚙️',
      author: 'Helix Systems Core',
      version: '5.0.0',
      rating: 4.9,
      downloads: '160K',
      permissions: ['Kernel Control', 'VFS Mounts', 'Root Privileges'],
      size: '14.0 MB',
      isInstalled: installedApps.has('setup'),
      isFeatured: false,
    },
  ], [installedApps]);

  const categories = ['All', 'Featured', 'AI & LLM', 'Development', 'Utilities', 'Games', 'Media', 'Security'];

  const filteredApps = useMemo(() => {
    return storeApps.filter(app => {
      const matchCat = activeCategory === 'All' 
        ? true 
        : activeCategory === 'Featured' 
          ? app.isFeatured 
          : app.category === activeCategory;
      const matchSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [storeApps, activeCategory, searchQuery]);

  const handleInstallToggle = (app: StoreAppItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (installedApps.has(app.id)) {
      // Launch app
      SoundManager.play('open');
      Toast.show(`Launching ${app.name}`, app.icon);
      Kernel.wm.launch(app.id);
    } else {
      // Install app
      SoundManager.play('success');
      setInstalledApps(prev => new Set(prev).add(app.id));
      Toast.show(`Installed ${app.name} to Desktop & Dock`, '✅');
      // Also register in VFS /opt/apps
      Kernel.vfs.write(`/opt/apps/${app.id}.manifest.json`, JSON.stringify({
        id: app.id,
        name: app.name,
        version: app.version,
        author: app.author,
        installedAt: new Date().toISOString()
      }, null, 2));
    }
  };

  const handlePublishCustomApp = () => {
    if (!customAppName.trim()) {
      Toast.show('Please specify an application name', '⚠️');
      return;
    }
    const slug = customAppName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    Kernel.vfs.write(`/opt/custom_apps/${slug}.js`, customAppCode);
    Kernel.vfs.write(`/opt/custom_apps/${slug}.json`, JSON.stringify({
      name: customAppName,
      category: customAppCategory,
      description: customAppDesc,
      script: `/opt/custom_apps/${slug}.js`,
      createdAt: new Date().toISOString()
    }, null, 2));

    SoundManager.play('success');
    Toast.show(`Published ${customAppName} to /opt/custom_apps/`, '🚀');
    setCustomAppName('');
    setCustomAppDesc('');
    setActiveTab('store');
  };

  return (
    <div className="h-full flex flex-col bg-[#070a10] text-gray-200 font-sans select-none overflow-hidden">
      {/* Top Header & Puter-style Search Bar */}
      <div className="p-4 bg-[#0d121c] border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              Helix App Store & App Hub
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                Puter.com & OS.js Model
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Curated cloud ecosystem, 1-click packages, and developer SDK distribution.
            </p>
          </div>
        </div>

        {/* View Tabs & Search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('store')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'store' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>App Store</span>
            </button>
            <button
              onClick={() => setActiveTab('publisher')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'publisher' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Developer Publisher</span>
            </button>
          </div>

          {activeTab === 'store' && (
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps, utilities, games..."
                className="w-full pl-9 pr-3 py-1.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          )}
        </div>
      </div>

      {activeTab === 'store' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Category Sidebar */}
          <div className="w-52 bg-[#0a0e17] border-r border-white/10 p-3 space-y-1 overflow-y-auto hidden sm:block shrink-0">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">
              Categories
            </div>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  SoundManager.play('click');
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <span>{cat}</span>
                {cat === 'Featured' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            ))}

            <div className="pt-4 border-t border-white/10 mt-4 space-y-2">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">
                SDK Stats
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 space-y-1 text-[11px] font-mono text-gray-400">
                <div className="flex justify-between">
                  <span>Packages:</span>
                  <span className="text-white font-bold">{storeApps.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Installed:</span>
                  <span className="text-emerald-400 font-bold">{installedApps.size}</span>
                </div>
                <div className="flex justify-between">
                  <span>Runtime:</span>
                  <span className="text-cyan-400 font-bold">Puter/OS.js</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main App Grid & Detail Panel */}
          <div className="flex-1 p-5 overflow-y-auto bg-[#070a10]">
            {/* Banner for Featured */}
            {activeCategory === 'All' && !searchQuery && (
              <div className="mb-6 p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-black border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                    FEATURED ECOSYSTEM
                  </span>
                  <h3 className="text-lg font-bold text-white">Next-Gen Web OS App Architecture</h3>
                  <p className="text-xs text-gray-300 max-w-xl">
                    Built upon the pioneering concepts of Puter.com and OS.js. Standardized JavaScript APIs (`window.helix`), unified VFS, sandboxed permissions, and 1-click cloud deployments.
                  </p>
                </div>
                <button
                  onClick={() => {
                    SoundManager.play('open');
                    Toast.show('Opened SDK Documentation', '📖');
                    Kernel.wm.launch('sdk-playground');
                  }}
                  className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer shrink-0"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Open SDK Studio</span>
                </button>
              </div>
            )}

            {/* App Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((app) => {
                const isInst = installedApps.has(app.id);
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="p-4 rounded-2xl bg-[#0f1422] border border-white/10 hover:border-emerald-500/50 transition duration-200 flex flex-col justify-between group cursor-pointer shadow-md hover:shadow-xl hover:bg-[#121828]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-105 transition">
                          {app.icon}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 flex items-center gap-0.5 text-xs font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {app.rating}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">({app.downloads})</span>
                        </div>
                      </div>

                      <div className="space-y-1 mb-3">
                        <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition">
                          {app.name}
                        </h4>
                        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                          {app.tagline}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-500">{app.author}</span>
                      <button
                        onClick={(e) => handleInstallToggle(app, e)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow ${
                          isInst
                            ? 'bg-white/10 hover:bg-emerald-600 text-white border border-white/10 hover:border-emerald-500'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                        }`}
                      >
                        {isInst ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Open</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Get</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Developer Publisher Studio */
        <div className="flex-1 p-6 overflow-y-auto bg-[#070a10] max-w-3xl mx-auto w-full space-y-5">
          <div className="p-5 rounded-3xl bg-[#0f1422] border border-white/10 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                Publish Custom Application to Helix VFS
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Create new standalone apps using the unified `window.helix` JavaScript SDK. Apps are saved directly to `/opt/custom_apps/`.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-300 font-bold">App Name</label>
                <input
                  type="text"
                  value={customAppName}
                  onChange={(e) => setCustomAppName(e.target.value)}
                  placeholder="e.g., Matrix Rain Screen"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-300 font-bold">Category</label>
                <select
                  value={customAppCategory}
                  onChange={(e) => setCustomAppCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/60"
                >
                  <option value="Utilities">Utilities</option>
                  <option value="AI & LLM">AI & LLM</option>
                  <option value="Development">Development</option>
                  <option value="Games">Games</option>
                  <option value="Media">Media</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-gray-300 font-bold">Description</label>
              <input
                type="text"
                value={customAppDesc}
                onChange={(e) => setCustomAppDesc(e.target.value)}
                placeholder="Brief summary of app capabilities"
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-gray-300 font-bold">JavaScript Entry Point (helix.js)</label>
              <textarea
                value={customAppCode}
                onChange={(e) => setCustomAppCode(e.target.value)}
                rows={8}
                className="w-full p-3 bg-black/70 border border-white/10 rounded-xl font-mono text-xs text-emerald-400 focus:outline-none focus:border-emerald-500/60"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handlePublishCustomApp}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Publish Package</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1422] border border-white/20 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-scale-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-md">
                  {selectedApp.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedApp.name}</h3>
                  <p className="text-xs text-emerald-400">{selectedApp.author} • v{selectedApp.version}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">{selectedApp.description}</p>

            {/* Sandbox Permissions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Granted Sandbox Permissions
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedApp.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-gray-300"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="text-xs font-mono text-gray-500">
                Package Size: {selectedApp.size}
              </div>
              <button
                onClick={() => {
                  handleInstallToggle(selectedApp);
                  setSelectedApp(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                {installedApps.has(selectedApp.id) ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Launch App</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Install App</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
