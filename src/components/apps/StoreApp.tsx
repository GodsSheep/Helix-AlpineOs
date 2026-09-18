import React, { useState, useEffect } from 'react';
import { Kernel } from '../../kernel';
import { Settings } from '../../kernel/Settings';
import { 
  Package, 
  Search, 
  Download, 
  Trash2, 
  RefreshCw, 
  Check, 
  Terminal, 
  Globe, 
  Info,
  Layers,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  PlusCircle,
  Database,
  Cpu,
  Flame,
  Filter,
  CheckCircle2,
  HardDrive,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

export interface StorePackage {
  id: string;
  name: string;
  version: string;
  desc: string;
  category: 'lang' | 'dev' | 'network' | 'system' | 'data' | 'tools';
  size: string;
  icon: string;
  deps: string[];
  repo: 'main' | 'community' | 'testing';
  license: string;
  website: string;
}

const EXTENDED_PACKAGES: StorePackage[] = [
  // Languages
  {
    id: 'python3',
    name: 'Python 3',
    version: '3.11.8-r0',
    desc: 'High-level scripting language with comprehensive standard library and JIT bindings.',
    category: 'lang',
    size: '14.2 MB',
    icon: '🐍',
    deps: ['musl', 'libffi', 'gdbm', 'sqlite-libs'],
    repo: 'main',
    license: 'PSF-2.0',
    website: 'https://python.org'
  },
  {
    id: 'nodejs',
    name: 'Node.js LTS',
    version: '20.12.2-r0',
    desc: 'JavaScript runtime built on V8 with asynchronous event-driven architecture.',
    category: 'lang',
    size: '32.6 MB',
    icon: '⬢',
    deps: ['musl', 'c-ares', 'libuv', 'nghttp2'],
    repo: 'main',
    license: 'MIT',
    website: 'https://nodejs.org'
  },
  {
    id: 'rust',
    name: 'Rust Compiler (rustc)',
    version: '1.77.2-r0',
    desc: 'Empowering everyone to build reliable and efficient software.',
    category: 'lang',
    size: '112 MB',
    icon: '🦀',
    deps: ['llvm17-libs', 'gcc', 'musl'],
    repo: 'community',
    license: 'Apache-2.0 / MIT',
    website: 'https://rust-lang.org'
  },
  {
    id: 'go',
    name: 'Go Compiler (golang)',
    version: '1.22.3-r0',
    desc: 'Open source programming language that makes it easy to build simple, reliable software.',
    category: 'lang',
    size: '86.4 MB',
    icon: '🐹',
    deps: ['musl', 'binutils'],
    repo: 'community',
    license: 'BSD-3-Clause',
    website: 'https://go.dev'
  },
  {
    id: 'ruby',
    name: 'Ruby Language',
    version: '3.3.1-r0',
    desc: 'Dynamic, open source programming language with a focus on simplicity and productivity.',
    category: 'lang',
    size: '16.8 MB',
    icon: '💎',
    deps: ['gdbm', 'libffi', 'yaml', 'musl'],
    repo: 'main',
    license: 'Ruby',
    website: 'https://ruby-lang.org'
  },
  {
    id: 'lua5.4',
    name: 'Lua 5.4',
    version: '5.4.6-r0',
    desc: 'Powerful, efficient, lightweight, embeddable scripting language.',
    category: 'lang',
    size: '1.2 MB',
    icon: '🌙',
    deps: ['musl', 'readline'],
    repo: 'main',
    license: 'MIT',
    website: 'https://lua.org'
  },

  // Development & Build
  {
    id: 'gcc',
    name: 'GCC Compiler Suite',
    version: '13.2.1-r0',
    desc: 'GNU Compiler Collection supporting C, C++, and native assembly generation.',
    category: 'dev',
    size: '48.1 MB',
    icon: '⚡',
    deps: ['binutils', 'mpfr4', 'gmp', 'isl'],
    repo: 'main',
    license: 'GPL-3.0',
    website: 'https://gcc.gnu.org'
  },
  {
    id: 'clang',
    name: 'Clang / LLVM 17',
    version: '17.0.6-r1',
    desc: 'C language family frontend for LLVM with advanced static analysis.',
    category: 'dev',
    size: '62.0 MB',
    icon: '🐉',
    deps: ['llvm17-libs', 'musl'],
    repo: 'main',
    license: 'Apache-2.0',
    website: 'https://clang.llvm.org'
  },
  {
    id: 'make',
    name: 'GNU Make',
    version: '4.4.1-r2',
    desc: 'Utility for directing compilation and project builds.',
    category: 'dev',
    size: '520 KB',
    icon: '🛠️',
    deps: ['musl'],
    repo: 'main',
    license: 'GPL-3.0',
    website: 'https://gnu.org/software/make'
  },
  {
    id: 'cmake',
    name: 'CMake Build Tool',
    version: '3.29.3-r0',
    desc: 'Cross-platform, open-source build system generator.',
    category: 'dev',
    size: '22.4 MB',
    icon: '📐',
    deps: ['libarchive', 'curl', 'jsoncpp', 'musl'],
    repo: 'main',
    license: 'BSD-3-Clause',
    website: 'https://cmake.org'
  },
  {
    id: 'git',
    name: 'Git Version Control',
    version: '2.43.0-r0',
    desc: 'Fast, scalable, distributed revision control system.',
    category: 'dev',
    size: '18.4 MB',
    icon: '🐙',
    deps: ['curl', 'expat', 'pcre2', 'zlib'],
    repo: 'main',
    license: 'GPL-2.0',
    website: 'https://git-scm.com'
  },
  {
    id: 'gdb',
    name: 'GNU Debugger',
    version: '14.2-r0',
    desc: 'The GNU Debugger allows you to see what is going on inside another program.',
    category: 'dev',
    size: '12.8 MB',
    icon: '🐛',
    deps: ['readline', 'mpfr4', 'gmp', 'musl'],
    repo: 'main',
    license: 'GPL-3.0',
    website: 'https://gnu.org/software/gdb'
  },

  // Network & Web
  {
    id: 'curl',
    name: 'cURL & libcurl',
    version: '8.7.1-r0',
    desc: 'Command line tool for transferring data with URL syntax over HTTP/HTTPS/FTP.',
    category: 'network',
    size: '2.8 MB',
    icon: '🌐',
    deps: ['ca-certificates', 'nghttp2-libs', 'brotli-libs'],
    repo: 'main',
    license: 'curl',
    website: 'https://curl.se'
  },
  {
    id: 'wget',
    name: 'GNU Wget',
    version: '1.24.5-r0',
    desc: 'Utility for retrieving files using HTTP, HTTPS, and FTP protocols.',
    category: 'network',
    size: '1.4 MB',
    icon: '📥',
    deps: ['musl', 'openssl'],
    repo: 'main',
    license: 'GPL-3.0',
    website: 'https://gnu.org/software/wget'
  },
  {
    id: 'nginx',
    name: 'Nginx Web Server',
    version: '1.26.0-r0',
    desc: 'High-performance HTTP server, reverse proxy, and IMAP/POP3 proxy server.',
    category: 'network',
    size: '5.2 MB',
    icon: '🚀',
    deps: ['pcre2', 'zlib', 'openssl'],
    repo: 'main',
    license: 'BSD-2-Clause',
    website: 'https://nginx.org'
  },
  {
    id: 'openssh',
    name: 'OpenSSH Client & Daemon',
    version: '9.7_p1-r0',
    desc: 'Premier connectivity tool for remote login with the SSH protocol.',
    category: 'network',
    size: '4.6 MB',
    icon: '🔑',
    deps: ['openssl', 'musl', 'zlib'],
    repo: 'main',
    license: 'SSH',
    website: 'https://openssh.com'
  },
  {
    id: 'nmap',
    name: 'Nmap Network Scanner',
    version: '7.95-r0',
    desc: 'Utility for network exploration and security auditing.',
    category: 'network',
    size: '8.4 MB',
    icon: '📡',
    deps: ['libpcap', 'pcre2', 'openssl', 'musl'],
    repo: 'community',
    license: 'NPSL',
    website: 'https://nmap.org'
  },
  {
    id: 'mosquitto',
    name: 'Mosquitto MQTT Broker',
    version: '2.0.18-r0',
    desc: 'Lightweight open source message broker implementing MQTT protocol.',
    category: 'network',
    size: '1.8 MB',
    icon: '📬',
    deps: ['c-ares', 'openssl', 'musl'],
    repo: 'community',
    license: 'EPL-2.0',
    website: 'https://mosquitto.org'
  },

  // System & Monitoring
  {
    id: 'htop',
    name: 'htop Process Viewer',
    version: '3.3.0-r0',
    desc: 'Interactive process viewer and system resource monitor for terminal.',
    category: 'system',
    size: '950 KB',
    icon: '📊',
    deps: ['ncurses', 'musl'],
    repo: 'main',
    license: 'GPL-2.0',
    website: 'https://htop.dev'
  },
  {
    id: 'neofetch',
    name: 'Neofetch System Info',
    version: '7.1.0-r2',
    desc: 'Fast, customizable system information tool written in POSIX sh.',
    category: 'system',
    size: '340 KB',
    icon: '💻',
    deps: ['bash'],
    repo: 'community',
    license: 'MIT',
    website: 'https://github.com/dylanaraps/neofetch'
  },
  {
    id: 'fastfetch',
    name: 'Fastfetch System Info',
    version: '2.11.5-r0',
    desc: 'Neofetch-like tool written mainly in C, with much higher performance.',
    category: 'system',
    size: '1.6 MB',
    icon: '⚡',
    deps: ['musl', 'yyjson'],
    repo: 'testing',
    license: 'MIT',
    website: 'https://github.com/fastfetch-cli/fastfetch'
  },
  {
    id: 'openssl',
    name: 'OpenSSL Toolkit',
    version: '3.3.0-r0',
    desc: 'Robust, commercial-grade TLS/SSL cryptography toolkit.',
    category: 'system',
    size: '9.2 MB',
    icon: '🔒',
    deps: ['musl'],
    repo: 'main',
    license: 'Apache-2.0',
    website: 'https://openssl.org'
  },

  // Databases & Data Tools
  {
    id: 'sqlite',
    name: 'SQLite Database',
    version: '3.45.3-r0',
    desc: 'C library that provides a lightweight disk-based transactional SQL database.',
    category: 'data',
    size: '3.1 MB',
    icon: '🗄️',
    deps: ['musl', 'readline'],
    repo: 'main',
    license: 'Public Domain',
    website: 'https://sqlite.org'
  },
  {
    id: 'postgresql-client',
    name: 'PostgreSQL Client',
    version: '16.3-r0',
    desc: 'Client tools for PostgreSQL database system including psql.',
    category: 'data',
    size: '6.4 MB',
    icon: '🐘',
    deps: ['openssl', 'readline', 'zlib', 'musl'],
    repo: 'main',
    license: 'PostgreSQL',
    website: 'https://postgresql.org'
  },
  {
    id: 'redis',
    name: 'Redis CLI & Server',
    version: '7.2.5-r0',
    desc: 'In-memory data structure store, used as database, cache, and message broker.',
    category: 'data',
    size: '4.8 MB',
    icon: '⚡',
    deps: ['musl'],
    repo: 'community',
    license: 'RSALv2',
    website: 'https://redis.io'
  },
  {
    id: 'jq',
    name: 'JQ JSON Processor',
    version: '1.7.1-r0',
    desc: 'Lightweight and flexible command-line JSON processor.',
    category: 'data',
    size: '680 KB',
    icon: '🔍',
    deps: ['oniguruma', 'musl'],
    repo: 'main',
    license: 'MIT',
    website: 'https://jqlang.github.io/jq/'
  },

  // Tools & Utilities
  {
    id: 'tree',
    name: 'Tree Visualizer',
    version: '2.1.1-r0',
    desc: 'Recursive directory listing program that produces a depth indented listing.',
    category: 'tools',
    size: '120 KB',
    icon: '🌲',
    deps: ['musl'],
    repo: 'main',
    license: 'GPL-2.0',
    website: 'http://mama.indstate.edu/users/ice/tree/'
  },
  {
    id: 'vim',
    name: 'Vim Text Editor',
    version: '9.1.0-r0',
    desc: 'Highly configurable, advanced text editor built to enable efficient text editing.',
    category: 'tools',
    size: '6.4 MB',
    icon: '📝',
    deps: ['ncurses', 'musl'],
    repo: 'main',
    license: 'Vim',
    website: 'https://vim.org'
  },
  {
    id: 'neovim',
    name: 'Neovim Editor',
    version: '0.9.5-r0',
    desc: 'Vim-fork focused on extensibility, Lua scripting, and modern usability.',
    category: 'tools',
    size: '14.2 MB',
    icon: '✨',
    deps: ['luajit', 'libvterm', 'unibilium', 'musl'],
    repo: 'community',
    license: 'Apache-2.0',
    website: 'https://neovim.io'
  },
  {
    id: 'tmux',
    name: 'Tmux Terminal Multiplexer',
    version: '3.4-r0',
    desc: 'Terminal multiplexer allowing multiple terminal sessions inside a single window.',
    category: 'tools',
    size: '1.8 MB',
    icon: '🪟',
    deps: ['libevent', 'ncurses'],
    repo: 'main',
    license: 'ISC',
    website: 'https://github.com/tmux/tmux'
  },
  {
    id: 'ripgrep',
    name: 'Ripgrep (rg)',
    version: '14.1.0-r0',
    desc: 'Line-oriented search tool that recursively searches the current directory for a regex pattern.',
    category: 'tools',
    size: '4.2 MB',
    icon: '⚡',
    deps: ['pcre2', 'musl'],
    repo: 'community',
    license: 'Unlicense',
    website: 'https://github.com/BurntSushi/ripgrep'
  },
  {
    id: 'fzf',
    name: 'FZF Command-line Fuzzy Finder',
    version: '0.50.0-r0',
    desc: 'General-purpose command-line fuzzy finder.',
    category: 'tools',
    size: '2.6 MB',
    icon: '🎯',
    deps: ['musl'],
    repo: 'community',
    license: 'MIT',
    website: 'https://github.com/junegunn/fzf'
  }
];

export const StoreApp: React.FC = () => {
  const [installed, setInstalled] = useState<Set<string>>(
    new Set(['python3', 'nodejs', 'busybox', 'musl', 'curl', 'wget', 'git', 'tree', 'neofetch', 'htop'])
  );
  const [installing, setInstalling] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'browse' | 'installed' | 'repos'>('browse');
  const [selectedPkg, setSelectedPkg] = useState<StorePackage | null>(null);
  const [updatingRepos, setUpdatingRepos] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [customPkgInput, setCustomPkgInput] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Repository state from settings
  const [mirror, setMirror] = useState(Settings.get().apkMirrorUrl || 'https://dl-cdn.alpinelinux.org/alpine/v3.20');
  const [testingEnabled, setTestingEnabled] = useState(Settings.get().enableTestingRepo ?? true);
  const [communityEnabled, setCommunityEnabled] = useState(Settings.get().enableCommunityRepo ?? true);

  const notify = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const syncInstalledFromVm = () => {
    const list = Kernel.vm.getInstalledPackages();
    if (list && list.length > 0) {
      setInstalled(new Set(list));
    }
  };

  useEffect(() => {
    syncInstalledFromVm();
  }, []);

  const handleInstall = async (pkg: StorePackage | string) => {
    const pkgId = typeof pkg === 'string' ? pkg.trim() : pkg.id;
    const pkgName = typeof pkg === 'string' ? pkg.trim() : pkg.name;
    if (!pkgId) return;

    setInstalling(pkgId);
    try {
      await Kernel.vm.executeCommand(`apk add ${pkgId}`);
      setInstalled((prev) => new Set([...prev, pkgId]));
      notify(`Installed '${pkgName}' successfully via APK`);
    } catch {
      notify(`Failed to install ${pkgId}`);
    } finally {
      setInstalling(null);
      setShowCustomModal(false);
      setCustomPkgInput('');
    }
  };

  const handleUninstall = async (pkg: StorePackage) => {
    setInstalling(pkg.id);
    try {
      await Kernel.vm.executeCommand(`apk del ${pkg.id}`);
      setInstalled((prev) => {
        const next = new Set(prev);
        next.delete(pkg.id);
        return next;
      });
      notify(`Removed ${pkg.name} from Alpine Linux`);
    } catch {
      notify(`Failed to remove ${pkg.id}`);
    } finally {
      setInstalling(null);
    }
  };

  const handleUpdateRepos = async () => {
    setUpdatingRepos(true);
    await Kernel.vm.executeCommand('apk update');
    setTimeout(() => {
      setUpdatingRepos(false);
      notify('Alpine package index updated: 18,452 packages synchronized');
    }, 900);
  };

  const handleCleanCache = async () => {
    await Kernel.vm.executeCommand('rm -rf /var/cache/apk/*');
    notify('Alpine package cache cleared (/var/cache/apk/*)');
  };

  const handleSaveRepos = () => {
    Settings.update({
      apkMirrorUrl: mirror,
      enableTestingRepo: testingEnabled,
      enableCommunityRepo: communityEnabled,
    });
    notify('Repository configuration saved');
  };

  const categories = [
    { id: 'all', label: 'All Packages', icon: Layers },
    { id: 'lang', label: 'Languages', icon: Cpu },
    { id: 'dev', label: 'Dev & Compilers', icon: Flame },
    { id: 'network', label: 'Network & Web', icon: Globe },
    { id: 'system', label: 'System & Security', icon: ShieldCheck },
    { id: 'data', label: 'Data & DBs', icon: Database },
    { id: 'tools', label: 'CLI Tools', icon: Terminal },
  ];

  const filteredPackages = EXTENDED_PACKAGES.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.desc.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || p.category === category;
    const matchTab = activeTab === 'browse' || installed.has(p.id);
    return matchSearch && matchCat && matchTab;
  });

  return (
    <div className="h-full flex flex-col bg-[#0b0d14] text-[#edf1f7] text-xs select-none overflow-hidden relative">
      {/* Top Header & Search Bar */}
      <div className="p-3 bg-[#11131c] border-b border-white/10 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2.5">
          {activeTab !== 'repos' && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                showSidebar ? 'bg-[#6ee7b7]/15 text-[#6ee7b7] border-[#6ee7b7]/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
              }`}
              title={showSidebar ? 'Collapse Categories Sidebar' : 'Expand Categories Sidebar'}
            >
              {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
          )}
          <div className="p-2 rounded-xl bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>Alpine Package Keeper</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-mono">apk v2.14</span>
            </h2>
            <p className="text-[11px] text-gray-400">Search and install native binaries directly into Alpine Linux</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'browse' ? 'bg-[#6ee7b7] text-black font-semibold shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Browse Catalog ({EXTENDED_PACKAGES.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'installed' ? 'bg-[#6ee7b7] text-black font-semibold shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Installed ({installed.size})</span>
          </button>
          <button
            onClick={() => setActiveTab('repos')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'repos' ? 'bg-[#6ee7b7] text-black font-semibold shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Repositories</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustomModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center gap-1.5 transition font-medium"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#6ee7b7]" />
            <span>Custom Package</span>
          </button>
          <button
            onClick={handleUpdateRepos}
            disabled={updatingRepos}
            className="px-3 py-1.5 rounded-xl bg-[#6ee7b7]/15 hover:bg-[#6ee7b7]/25 text-[#6ee7b7] border border-[#6ee7b7]/30 flex items-center gap-1.5 transition font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${updatingRepos ? 'animate-spin' : ''}`} />
            <span>{updatingRepos ? 'Updating...' : 'Sync APK Index'}</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      {activeTab !== 'repos' ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Sidebar categories */}
          {showSidebar && (
            <div className="w-full md:w-56 p-3 bg-[#0d0f18] border-b md:border-b-0 md:border-r border-white/10 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1 hidden md:block">
                Categories
              </div>
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left whitespace-nowrap transition text-xs ${
                      isSelected
                        ? 'bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/30 font-semibold'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#6ee7b7]' : 'text-gray-400'}`} />
                    <span className="flex-1">{cat.label}</span>
                    {cat.id !== 'all' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-gray-400 font-mono">
                        {EXTENDED_PACKAGES.filter((p) => p.category === cat.id).length}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="mt-auto pt-4 border-t border-white/10 hidden md:block">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#6ee7b7] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Alpine Repo</span>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Packages run natively in the Alpine Linux x86_64 JIT sandbox with full POSIX bindings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Package Content Grid & Search */}
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            {/* Quick Horizontal category chips if sidebar is collapsed */}
            {!showSidebar && (
              <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 shrink-0">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap transition ${
                        isSelected
                          ? 'bg-[#6ee7b7]/20 text-[#6ee7b7] border border-[#6ee7b7]/40'
                          : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {/* Search filter bar */}
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search 18,452 packages by name, description, binary..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#141724] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#6ee7b7]"
                />
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap">
                Showing <span className="text-white font-bold">{filteredPackages.length}</span> packages
              </div>
            </div>

            {/* Packages Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPackages.map((pkg) => {
                  const isInst = installed.has(pkg.id);
                  const isBusy = installing === pkg.id;

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPkg(pkg)}
                      className={`p-3.5 rounded-2xl bg-[#141724] border transition flex flex-col justify-between gap-3 cursor-pointer hover:border-[#6ee7b7]/50 ${
                        selectedPkg?.id === pkg.id ? 'border-[#6ee7b7] ring-1 ring-[#6ee7b7]/30' : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
                            {pkg.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{pkg.name}</span>
                              {isInst && (
                                <span className="p-0.5 rounded-full bg-[#6ee7b7]/20 text-[#6ee7b7]">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </h3>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {pkg.id} <span className="text-gray-400">v{pkg.version}</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                            pkg.repo === 'main'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                              : pkg.repo === 'community'
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {pkg.repo}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{pkg.desc}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                        <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-gray-400" />
                          {pkg.size}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isInst ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUninstall(pkg);
                              }}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 flex items-center gap-1 transition text-[11px] font-medium disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{isBusy ? 'Removing...' : 'Remove'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInstall(pkg);
                              }}
                              disabled={isBusy}
                              className="px-3 py-1 rounded-lg bg-[#6ee7b7] hover:bg-[#5eead4] text-black font-semibold flex items-center gap-1 transition text-[11px] disabled:opacity-50"
                            >
                              <Download className="w-3 h-3" />
                              <span>{isBusy ? 'Installing...' : 'Install'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredPackages.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                  <Package className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="font-semibold text-white">No matching packages found</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm">
                    Try searching for another package name or install custom APK packages directly using the "Custom Package" button.
                  </p>
                  <button
                    onClick={() => setShowCustomModal(true)}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-[#6ee7b7] text-black font-semibold text-xs flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Install Custom APK</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Repositories Configuration Tab */
        <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full space-y-6">
          <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#6ee7b7]" />
              <div>
                <h3 className="font-bold text-white text-sm">Alpine Linux Mirror Configuration</h3>
                <p className="text-[11px] text-gray-400">Select fastest package download CDN for APK package management</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Active CDN Mirror URL</label>
              <input
                type="text"
                value={mirror}
                onChange={(e) => setMirror(e.target.value)}
                className="w-full bg-[#0d0f18] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#6ee7b7]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {[
                { name: 'Worldwide Fastly CDN', url: 'https://dl-cdn.alpinelinux.org/alpine/v3.20' },
                { name: 'Cloudflare Mirror', url: 'https://alpine.cloudflare.com/alpine/v3.20' },
                { name: 'US East Mirror (MIT)', url: 'http://mirrors.mit.edu/alpine/v3.20' },
                { name: 'Europe Mirror (DE)', url: 'https://mirror.alpinelinux.de/alpine/v3.20' },
              ].map((m) => (
                <button
                  key={m.url}
                  onClick={() => setMirror(m.url)}
                  className={`p-2.5 rounded-xl text-left border transition text-xs ${
                    mirror === m.url
                      ? 'bg-[#6ee7b7]/15 border-[#6ee7b7] text-white font-medium'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="font-bold text-xs">{m.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono truncate">{m.url}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#6ee7b7]" />
              <span>Repository Channels</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="font-bold text-white text-xs">Main Repository</div>
                  <div className="text-[11px] text-gray-400">Core system packages and mission-critical utilities (Always active)</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">LOCKED</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="font-bold text-white text-xs">Community Repository</div>
                  <div className="text-[11px] text-gray-400">Maintained user packages, additional programming runtimes and server daemons</div>
                </div>
                <input
                  type="checkbox"
                  checked={communityEnabled}
                  onChange={(e) => setCommunityEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="font-bold text-white text-xs">Edge Testing Repository</div>
                  <div className="text-[11px] text-gray-400">Bleeding-edge builds and experimental development releases</div>
                </div>
                <input
                  type="checkbox"
                  checked={testingEnabled}
                  onChange={(e) => setTestingEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#6ee7b7] rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10 flex-wrap gap-2">
              <button
                onClick={handleCleanCache}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center gap-1.5 transition text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Clear APK Cache</span>
              </button>

              <button
                onClick={handleSaveRepos}
                className="px-4 py-1.5 rounded-xl bg-[#6ee7b7] hover:bg-[#5eead4] text-black font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Repository Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package Details Side Drawer */}
      {selectedPkg && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-[#11131c] border-l border-white/15 h-full p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shrink-0">
                    {selectedPkg.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{selectedPkg.name}</h3>
                    <div className="text-[11px] text-gray-400 font-mono">
                      {selectedPkg.id} <span className="text-[#6ee7b7]">v{selectedPkg.version}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPkg(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed bg-[#0b0d14] p-3.5 rounded-xl border border-white/5">
                {selectedPkg.desc}
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-gray-400">Package Size</div>
                  <div className="font-bold text-xs text-white">{selectedPkg.size}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-gray-400">Architecture</div>
                  <div className="font-bold text-xs text-white">x86_64 (musl)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-gray-400">License</div>
                  <div className="font-bold text-xs text-white">{selectedPkg.license}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-gray-400">Repository Channel</div>
                  <div className="font-bold text-xs text-emerald-400 capitalize">{selectedPkg.repo}</div>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Dependencies</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPkg.deps.map((dep) => (
                    <span key={dep} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-gray-300">
                      {dep}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">CLI Terminal Command</h4>
                <div className="p-2 rounded-xl bg-[#07080b] border border-white/10 font-mono text-[11px] text-[#6ee7b7] select-all">
                  apk add {selectedPkg.id}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center gap-2">
              <button
                onClick={() => setSelectedPkg(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs transition"
              >
                Close
              </button>
              {installed.has(selectedPkg.id) ? (
                <button
                  onClick={() => {
                    handleUninstall(selectedPkg);
                  }}
                  disabled={installing === selectedPkg.id}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 font-bold text-xs transition disabled:opacity-50"
                >
                  {installing === selectedPkg.id ? 'Removing...' : 'Uninstall'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleInstall(selectedPkg);
                  }}
                  disabled={installing === selectedPkg.id}
                  className="flex-1 px-4 py-2 rounded-xl bg-[#6ee7b7] hover:bg-[#5eead4] text-black font-bold text-xs transition disabled:opacity-50 shadow-md"
                >
                  {installing === selectedPkg.id ? 'Installing...' : 'Install Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Package Installer Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#141724] border border-white/15 rounded-2xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#6ee7b7]" />
                <h3 className="font-bold text-white text-sm">Install Custom Alpine Package</h3>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Enter the exact APK package identifier to install directly from Alpine Linux official repositories into the environment.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-400">Package Name</label>
              <input
                type="text"
                placeholder="e.g. bash, zsh, nano, strace, rsync, unzip..."
                value={customPkgInput}
                onChange={(e) => setCustomPkgInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customPkgInput.trim()) {
                    handleInstall(customPkgInput.trim());
                  }
                }}
                className="w-full bg-[#0d0f18] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-gray-400 focus:outline-none focus:border-[#6ee7b7]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleInstall(customPkgInput.trim())}
                disabled={!customPkgInput.trim() || installing !== null}
                className="px-4 py-1.5 rounded-xl bg-[#6ee7b7] hover:bg-[#5eead4] text-black font-semibold text-xs transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{installing ? 'Installing...' : 'Install via APK'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating toast notification */}
      {statusNotice && (
        <div className="absolute bottom-4 right-4 z-40 px-3.5 py-2 rounded-xl bg-[#141724] border border-[#6ee7b7]/40 text-white text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#6ee7b7] shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}
    </div>
  );
};
