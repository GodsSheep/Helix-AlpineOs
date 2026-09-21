import { AppDefinition } from './types';

export class AppRegistry {
  private static apps: AppDefinition[] = [
    {
      id: 'machine',
      title: 'Alpine Host Engine',
      icon: '⚡',
      category: 'System',
      description: 'v86 x86 VM with Alpine Linux, hardware BIOS, snapshots and RPC bus.',
      width: 680,
      height: 520,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-amber-600/35 to-yellow-500/20 border-amber-500/30 text-amber-200'
    },
    {
      id: 'term',
      title: 'Terminal',
      icon: '🖥️',
      category: 'Development',
      description: 'Direct interactive shell connected to the Alpine host engine.',
      width: 540,
      height: 380,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-zinc-900 to-zinc-700/50 border-zinc-500/30 text-emerald-400 font-mono'
    },
    {
      id: 'edit',
      title: 'Text Editor',
      icon: '📝',
      category: 'Development',
      description: 'Multi-runtime code and text editor with VFS sync and execution.',
      width: 580,
      height: 440,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-indigo-600/30 to-blue-500/20 border-indigo-500/30 text-indigo-300'
    },
    {
      id: 'setup',
      title: 'Mega Setup & Kernel Hub',
      icon: '🛠️',
      category: 'System',
      description: 'One-click installer for system kernels, AI model weights, Android ART runtimes, and Wine win32 layers.',
      width: 760,
      height: 560,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-cyan-600/35 to-blue-500/20 border-cyan-500/30 text-cyan-300'
    },
    {
      id: 'linux-security',
      title: 'Linux Security & Hardening Suite',
      icon: '🛡️',
      category: 'Utilities',
      description: 'Comprehensive open-source Linux security suite with Lynis audits, AppArmor/SELinux profiles, auditd logs, fail2ban rules, OpenSSL crypto workbench, and CIS benchmarks.',
      width: 800,
      height: 580,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-emerald-600/35 to-teal-500/20 border-emerald-500/30 text-emerald-300'
    },
    {
      id: 'dev-tools-studio',
      title: 'Developer Tools Studio',
      icon: '⚡',
      category: 'Development',
      description: 'All-in-one developer workbench: code formatters, AST parser, regex debugger, HTTP/REST API test console, multi-format encoders/decoders, JSON schema validator, and visual diff.',
      width: 820,
      height: 600,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-blue-600/35 to-indigo-500/20 border-blue-500/30 text-blue-300'
    },
    {
      id: 'visual-game-engine',
      title: 'Visual Game Engine (No-Code)',
      icon: '🎮',
      category: 'Games',
      description: 'Node-based visual scripting 2D game engine. Design levels, wire event triggers, actions, physics, sound, and playtest immediately without code.',
      width: 860,
      height: 620,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-pink-600/35 to-rose-500/20 border-pink-500/30 text-pink-300'
    },
    {
      id: 'universal-utils',
      title: 'Universal Utilities Suite',
      icon: '🧰',
      category: 'Utilities',
      description: 'Centralized productivity & system workbench: multi-format file converters, text manipulators, cryptographic checksum verifier, batch renamer, and diagnostics.',
      width: 800,
      height: 580,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-amber-600/35 to-yellow-500/20 border-amber-500/30 text-amber-300'
    },
    {
      id: 'store',
      title: 'App Store',
      icon: '📦',
      category: 'Utilities',
      description: 'Package repository to install system tools.',
      width: 460,
      height: 460,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-purple-600/35 to-pink-500/20 border-purple-500/30 text-purple-300'
    },
    {
      id: 'chroot',
      title: 'Chroot Sandbox Studio',
      icon: '🛡️',
      category: 'System',
      description: 'POSIX filesystem isolation, rootfs virtualization, multi-distro sandboxing and security audits.',
      width: 720,
      height: 520,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-amber-700/35 to-orange-500/20 border-amber-500/30 text-amber-300'
    },
    {
      id: 'mon',
      title: 'System Monitor',
      icon: '📊',
      category: 'System',
      description: 'Real-time CPU activity, RAM allocation, and task metrics.',
      width: 380,
      height: 300,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-rose-600/30 to-red-400/20 border-rose-500/30 text-rose-300'
    },
    {
      id: 'telemetry',
      title: 'Kernel Telemetry',
      icon: '📡',
      category: 'System',
      description: 'Real-time container kernel uptime and load average telemetry.',
      width: 380,
      height: 200,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-green-700/30 to-emerald-500/20 border-emerald-500/30 text-green-300'
    },
    {
      id: 'files',
      title: 'File Manager',
      icon: '📁',
      category: 'Utilities',
      description: 'Browse, create, and inspect virtual IndexedDB files.',
      width: 580,
      height: 420,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-sky-600/35 to-cyan-500/20 border-sky-500/30 text-sky-300'
    },
    {
      id: 'rustcpp',
      title: 'Rust & C++ Studio',
      icon: '🦀',
      category: 'Development',
      description: 'Ultra-fast native JIT compiler studio for Rust 2021 & C++23 with memory diagnostics.',
      width: 680,
      height: 520,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-amber-700/40 to-orange-500/20 border-orange-500/30 text-orange-300'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: '⚙️',
      category: 'System',
      description: 'System preferences, themes, wallpaper, networking, and Alpine VM controls.',
      width: 620,
      height: 480,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-neutral-700/40 to-neutral-500/20 border-neutral-400/30 text-gray-200'
    },
    {
      id: 'netscan',
      title: 'Network Diagnostics',
      icon: '📡',
      category: 'Utilities',
      description: 'Ping, traceroute simulation, DNS lookup, and active port scan.',
      width: 600,
      height: 420,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-emerald-600/35 to-teal-400/20 border-emerald-500/30 text-emerald-300'
    },
    {
      id: 'apkman',
      title: 'APK Package Manager',
      icon: '📥',
      category: 'Utilities',
      description: 'Advanced APK package repo manager to install & update tools.',
      width: 620,
      height: 460,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-fuchsia-600/35 to-pink-500/20 border-fuchsia-500/30 text-fuchsia-300'
    },
    {
      id: 'syslog',
      title: 'Kernel Log Viewer',
      icon: '🪵',
      category: 'System',
      description: 'Real-time kernel dmesg logs, system events and filtering.',
      width: 600,
      height: 400,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-amber-700/35 to-orange-500/20 border-amber-500/30 text-amber-200'
    },
    {
      id: 'procman',
      title: 'Process Manager',
      icon: '🔋',
      category: 'System',
      description: 'Task manager with CPU/RAM metrics and process signal controls.',
      width: 580,
      height: 400,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-red-600/30 to-orange-400/20 border-red-500/30 text-red-300'
    },
    {
      id: 'kernel-memory',
      title: 'Kernel Memory Monitor',
      icon: '🧠',
      category: 'System',
      description: 'Live-updated sparkline monitor tracking V8 heap memory pressure, GC frequency, and kernel slab telemetry.',
      width: 720,
      height: 520,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-emerald-600/35 to-teal-500/20 border-emerald-500/30 text-emerald-300'
    },
    {
      id: 'sqlclient',
      title: 'SQLite DB Console',
      icon: '🗄️',
      category: 'Development',
      description: 'In-memory SQL query console with table browser.',
      width: 600,
      height: 420,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-blue-700/30 to-cyan-500/20 border-blue-500/30 text-blue-300'
    },
    {
      id: 'docviewer',
      title: 'Documentation Reader',
      icon: '📖',
      category: 'Utilities',
      description: 'Alpine Linux cheat sheets, man pages and user guides.',
      width: 620,
      height: 440,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-yellow-700/30 to-lime-600/15 border-yellow-500/20 text-yellow-300'
    },
    {
      id: 'envmgr',
      title: 'Environment & Secrets',
      icon: '🔐',
      category: 'Development',
      description: 'Secure virtual env vars and configuration secrets manager.',
      width: 560,
      height: 380,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-rose-700/35 to-violet-500/20 border-rose-500/30 text-rose-300'
    },
    {
      id: 'browser',
      title: 'Web Sandbox',
      icon: '🌍',
      category: 'Utilities',
      description: 'Lightweight integrated browser sandbox and URL inspector.',
      width: 620,
      height: 440,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-cyan-600/35 to-blue-500/20 border-cyan-500/30 text-cyan-300'
    },
    {
      id: 'diskanalyzer',
      title: 'Disk Usage Analyzer',
      icon: '💾',
      category: 'Utilities',
      description: 'Visual virtual disk space breakdown and file tree analyzer.',
      width: 580,
      height: 400,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-teal-700/35 to-emerald-500/20 border-teal-500/30 text-teal-300'
    },
    {
      id: 'soundmixer',
      title: 'ALSA Sound Mixer',
      icon: '🎵',
      category: 'Utilities',
      description: 'Audio volume mixer, tone synthesizer and sound generator.',
      width: 500,
      height: 420,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-indigo-700/35 to-purple-500/20 border-indigo-500/30 text-indigo-300'
    },
    {
      id: 'neofetch',
      title: 'Neofetch System Profiler',
      icon: '💡',
      category: 'System',
      description: 'Alpine Linux hardware profiler, CPU architecture specs and uptime stats.',
      width: 600,
      height: 440,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-indigo-600/30 to-rose-500/20 border-indigo-500/30 text-indigo-300'
    },
    {
      id: 'taskscheduler',
      title: 'Daemon & Task Scheduler',
      icon: '⏱️',
      category: 'System',
      description: 'Manage OpenRC system service daemons, cron jobs and timer triggers.',
      width: 620,
      height: 480,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-violet-700/35 to-purple-500/20 border-violet-500/30 text-violet-300'
    },
    {
      id: 'hexedit',
      title: 'Binary Hex Inspector',
      icon: '⬡',
      category: 'Development',
      description: 'Hexadecimal file inspector, binary byte editor and ASCII decoder.',
      width: 640,
      height: 460,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-zinc-800 to-red-950/60 border-red-500/30 text-red-400'
    },
    {
      id: 'benchmark',
      title: 'Hardware Benchmark',
      icon: '📏',
      category: 'System',
      description: 'CPU FLOPS, WASM memory throughput and VFS storage benchmark suite.',
      width: 620,
      height: 460,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-amber-600/35 to-rose-500/25 border-amber-500/30 text-amber-300'
    },
    {
      id: 'asynciomonitor',
      title: 'Async 9P I/O Monitor',
      icon: '🔄',
      category: 'System',
      description: 'Dedicated asynchronous I/O worker thread monitor for V86 9P VFS mount operations.',
      width: 660,
      height: 480,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-cyan-600/40 to-teal-500/30 border-cyan-500/40 text-cyan-300'
    },
    {
      id: 'firewall',
      title: 'Netfilter Firewall',
      icon: '🛡️',
      category: 'System',
      description: 'Linux kernel packet filtering, iptables rules, and panic killswitch.',
      width: 640,
      height: 460,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-red-700/30 to-rose-500/20 border-red-500/30 text-red-300'
    },
    {
      id: 'services',
      title: 'OpenRC Services',
      icon: '🛠️',
      category: 'System',
      description: 'OpenRC init service manager, runlevels, and daemon controls.',
      width: 680,
      height: 480,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-teal-600/30 to-emerald-400/20 border-teal-500/30 text-teal-300'
    },
    {
      id: 'calc',
      title: 'GNU bc Calculator',
      icon: '🧮',
      category: 'Utilities',
      description: 'Arbitrary precision scientific and programmer bitwise calculator.',
      width: 540,
      height: 480,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-slate-600/35 to-neutral-500/20 border-slate-500/30 text-slate-300'
    },
    {
      id: 'paint',
      title: 'Pixel Studio',
      icon: '🎨',
      category: 'Utilities',
      description: 'KolourPaint / Pinta style pixel and vector canvas drawing tool.',
      width: 640,
      height: 520,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-pink-600/35 to-yellow-500/25 border-pink-500/30 text-pink-300'
    },
    {
      id: 'hotshot',
      title: 'Hotshot Capture',
      icon: '📸',
      category: 'Utilities',
      description: 'System-wide high-fidelity screen capture, annotation overlays, and markup editors.',
      width: 680,
      height: 520,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-cyan-600/35 to-emerald-400/20 border-cyan-500/30 text-cyan-300'
    },
    {
      id: 'ssh',
      title: 'OpenSSH Client',
      icon: '🔑',
      category: 'Development',
      description: 'OpenSSH remote shell client, keypair generator, and server book.',
      width: 620,
      height: 440,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-neutral-900 to-indigo-900/60 border-indigo-500/30 text-indigo-300'
    },
    {
      id: 'archive',
      title: 'Archive Manager',
      icon: '🗜️',
      category: 'Utilities',
      description: 'Tarball and gzip archive browser, compressor, and extractor.',
      width: 600,
      height: 420,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-amber-700/35 to-yellow-650/20 border-amber-500/30 text-yellow-300'
    },
    {
      id: 'hardware',
      title: 'Hardware Inspector',
      icon: '🔌',
      category: 'System',
      description: 'CPU, memory hierarchy, PCI bus devices, block devices and thermal sensors.',
      width: 640,
      height: 460,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-red-600/30 to-yellow-500/20 border-red-500/30 text-yellow-300'
    },
    {
      id: 'diff',
      title: 'Diff & Patch Studio',
      icon: '🔀',
      category: 'Development',
      description: 'Side-by-side Linux file diff viewer and unified patch generator.',
      width: 640,
      height: 440,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-green-700/20 to-red-700/20 border-neutral-500/20 text-white'
    },
    {
      id: 'clipboard',
      title: 'Clipboard Manager',
      icon: '📋',
      category: 'Utilities',
      description: 'Linux clipboard history daemon, pinned snippets, and regex search.',
      width: 560,
      height: 420,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-sky-600/35 to-indigo-500/20 border-sky-500/30 text-sky-300'
    },
    {
      id: 'game-racer',
      title: 'Alpine Highway Racer',
      icon: '🏎️',
      category: 'Games',
      description: 'Retro arcade highway obstacle dodging racing game.',
      width: 420,
      height: 540,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-red-600/40 to-yellow-500/30 border-red-500/35 text-red-200'
    },
    {
      id: 'game-hacker',
      title: 'Cyber Hacker',
      icon: '💻',
      category: 'Games',
      description: 'Terminal passcode decryption and memory hacking challenge.',
      width: 480,
      height: 420,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-emerald-950/90 to-emerald-800/40 border-emerald-500/40 text-emerald-400 font-mono'
    },
    {
      id: 'game-2048',
      title: 'Helix 2048',
      icon: '🔢',
      category: 'Games',
      description: 'Addictive sliding tile number puzzle with cyberpunk theme.',
      width: 400,
      height: 460,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-amber-500/40 to-orange-500/30 border-amber-400/40 text-amber-200'
    },
    {
      id: 'game-tetris',
      title: 'Alpine Tetris',
      icon: '🧱',
      category: 'Games',
      description: 'Classic block stacking puzzle game with speed progression.',
      width: 380,
      height: 520,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-indigo-600/40 to-pink-500/30 border-indigo-500/40 text-pink-300'
    },
    {
      id: 'game-minesweeper',
      title: 'Alpine Minesweeper',
      icon: '💣',
      category: 'Games',
      description: 'Classic grid mine clearance puzzle with flags and timer.',
      width: 400,
      height: 440,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-neutral-800/80 to-neutral-600/40 border-neutral-500/30 text-gray-300'
    },
    {
      id: 'game-snake',
      title: 'Alpine Snake',
      icon: '🐍',
      category: 'Games',
      description: 'Classic arcade snake game with high scores and speed ramping.',
      width: 420,
      height: 480,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-green-600/40 to-lime-500/30 border-green-500/45 text-green-300'
    },
    {
      id: 'game-spaceinvaders',
      title: 'Galaxy Invaders',
      icon: '👾',
      category: 'Games',
      description: 'Retro space defense arcade shooter with alien fleet waves.',
      width: 460,
      height: 500,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-indigo-900/80 to-purple-800/40 border-indigo-500/30 text-indigo-300'
    },
    {
      id: 'game-pong',
      title: 'Cyber Pong vs AI',
      icon: '🏓',
      category: 'Games',
      description: 'Fast-paced arcade pong with AI difficulty levels and CRT effects.',
      width: 480,
      height: 420,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-slate-800 to-slate-600/40 border-slate-500/30 text-white'
    },
    {
      id: 'game-memory',
      title: 'Matrix Memory Match',
      icon: '🧠',
      category: 'Games',
      description: 'Cybersecurity card matching puzzle game with timer and scoring.',
      width: 440,
      height: 460,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-violet-600/40 to-pink-500/30 border-violet-500/40 text-pink-300'
    },
    {
      id: 'game-wordle',
      title: 'Terminal CodeBreaker',
      icon: '🔤',
      category: 'Games',
      description: '5-letter Linux and coding vocabulary word deduction puzzle.',
      width: 440,
      height: 520,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-emerald-600/40 to-yellow-500/30 border-emerald-500/40 text-yellow-100'
    },
    {
      id: 'guirunner',
      title: 'Helix GUI Studio & X11 Server',
      icon: '🏃',
      category: 'Development',
      description: 'Run any Python GUI (Tkinter, PySimpleGUI, Turtle, WebGUI) & Linux Zenity dialogs directly on Helix DE with virtual X11 display server :0.0.',
      width: 760,
      height: 540,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-blue-600/35 to-indigo-500/20 border-blue-500/30 text-blue-300'
    },
    {
      id: 'gui-window',
      title: 'Helix GUI Application',
      icon: '🪟',
      category: 'Utilities',
      description: 'Native virtual X11 client window rendered inside Helix DE.',
      width: 480,
      height: 400,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-slate-700/45 to-slate-500/20 border-slate-400/30 text-slate-100'
    },
    {
      id: 'netmaster',
      title: 'Helix NetMaster',
      icon: '🌐',
      category: 'Utilities',
      description: 'Advanced VPN tunnels, SOCKS5/HTTP proxies, & Wi-Fi hotspot AP manager.',
      width: 720,
      height: 520,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-cyan-600/35 to-blue-500/25 border-cyan-500/30 text-cyan-300'
    },
    {
      id: 'unifiedstudio',
      title: 'Helix Unified Studio',
      icon: '✨',
      category: 'Development',
      description: 'Integrated development suite for Python GUIs, code showcases, and native systems programming.',
      width: 900,
      height: 600,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-purple-600/35 to-fuchsia-500/25 border-purple-500/30 text-purple-300'
    },
    {
      id: 'osselector',
      title: 'Multi-OS Boot Hub',
      icon: '🚀',
      category: 'System',
      description: 'Switch and boot alternative Linux distributions (Kali, Debian, Ubuntu, Void, Tiny Core) instantly inside Helix OS.',
      width: 820,
      height: 560,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-cyan-600/35 to-emerald-500/25 border-cyan-500/30 text-cyan-300'
    },
    {
      id: 'backpack',
      title: 'Helix Backpack',
      icon: '🎒',
      category: 'Utilities',
      description: 'System-wide item storage for files, snippets, and remote URLs. Carry your workflow across sessions.',
      width: 420,
      height: 520,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-orange-600/35 to-amber-500/25 border-orange-500/30 text-orange-200'
    },
    {
      id: 'sysscan',
      title: 'System Intelligence Scanner',
      icon: '🔍',
      category: 'System',
      description: 'Deep system scan for endpoints, missing configurations, and hardware nodes. Automated backpack harvesting.',
      width: 680,
      height: 480,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-indigo-700/40 to-blue-600/30 border-indigo-500/40 text-blue-100'
    },
    {
      id: 'bootassist',
      title: 'Multi-Boot Assistant',
      icon: '💡',
      category: 'System',
      description: 'Intelligent hardware tuner, BIOS compatibility matrix, and live diagnostics assistant for Multi-OS booting.',
      width: 760,
      height: 520,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-cyan-600/35 to-blue-500/25 border-cyan-500/30 text-cyan-200'
    },
    {
      id: 'healthcheck',
      title: 'System Health Diagnostics',
      icon: '🩺',
      category: 'System',
      description: 'Periodic background diagnostics on kernel uptime, VFS integrity, memory pressure, and auto-heal.',
      width: 780,
      height: 540,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-emerald-600/40 to-teal-500/30 border-emerald-500/40 text-emerald-200'
    },
    {
      id: 'betterbrowser',
      title: 'Helix Better Browser',
      icon: '🌐',
      category: 'Utilities',
      description: 'Advanced tabbed web browser sandbox with DevTools, security inspector, bookmarks, and user-agent spoofer.',
      width: 820,
      height: 580,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-cyan-600/40 to-blue-500/30 border-cyan-500/40 text-cyan-200'
    },
    {
      id: 'crossplatform',
      title: 'Cross-Platform Developer Tools',
      icon: '🛠️',
      category: 'Development',
      description: 'Linux & Windows compatibility suite with Wine Win32 runner, PowerShell-to-Bash translator, and PE/ELF binary inspector.',
      width: 800,
      height: 560,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-indigo-600/40 to-purple-500/30 border-indigo-500/40 text-indigo-200'
    },
    {
      id: 'pythonengine',
      title: 'Python Standard Runtime',
      icon: '🐍',
      category: 'Development',
      description: 'Helix standard Python language engine with REPL studio, pip package installer, and script runner.',
      width: 820,
      height: 580,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-yellow-600/40 to-amber-500/30 border-yellow-500/40 text-yellow-200'
    },
    {
      id: 'pythonarcade',
      title: 'Python Retro Arcade',
      icon: '🕹️',
      category: 'Games',
      description: 'Canvas arcade game suite driven by embedded Python execution loops (Cyber Serpent, Synth Racer, Space Defense).',
      width: 600,
      height: 520,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-emerald-600/40 to-lime-500/30 border-emerald-500/40 text-lime-200'
    },
    {
      id: 'trash',
      title: 'Trash & Recycle Bin',
      icon: '🗑️',
      category: 'System',
      description: 'System trash manager for restoring deleted files, recovering uninstalled applications, and managing purge quotas.',
      width: 720,
      height: 520,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-rose-600/40 to-pink-500/30 border-rose-500/40 text-rose-200'
    },
    {
      id: 'docker',
      title: 'Docker & Container Studio',
      icon: '🐳',
      category: 'Development',
      description: 'Manage OCI containers, build multi-stage Dockerfiles, inspect images, and exec container shells.',
      width: 820,
      height: 580,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-blue-600/40 to-cyan-500/30 border-blue-500/40 text-blue-200'
    },
    {
      id: 'gitstudio',
      title: 'Git Version Control Studio',
      icon: '🌿',
      category: 'Development',
      description: 'Visual Git DAG commit tree, staging diff viewer, branch manager, stash stack, and remote push/pull.',
      width: 820,
      height: 580,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-orange-600/40 to-amber-500/30 border-orange-500/40 text-orange-200'
    },
    {
      id: 'wireshark',
      title: 'Wireshark Packet Dissector',
      icon: '🦈',
      category: 'Utilities',
      description: 'Real-time packet sniffer, BPF filters, OSI layer dissection, and synchronized hex/ASCII inspector.',
      width: 840,
      height: 580,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-cyan-600/40 to-teal-500/30 border-cyan-500/40 text-cyan-200'
    },
    {
      id: 'apistudio',
      title: 'REST & WebSocket API Studio',
      icon: '⚡',
      category: 'Development',
      description: 'Postman-class HTTP/REST request engine, real-time WebSocket console, headers editor, and cURL generator.',
      width: 820,
      height: 580,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-purple-600/40 to-fuchsia-500/30 border-purple-500/40 text-purple-200'
    },
    {
      id: 'kmod',
      title: 'Kernel Modules & Sysctl',
      icon: '⚙️',
      category: 'System',
      description: 'Loaded kernel modules inspector (lsmod), modprobe/rmmod manager, and sysctl parameter tuner.',
      width: 760,
      height: 540,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-teal-600/40 to-emerald-500/30 border-teal-500/40 text-teal-200'
    },
    {
      id: 'autodetect',
      title: 'Auto-Detect & System Sync',
      icon: '📡',
      category: 'System',
      description: 'Comprehensive hardware auto-discovery, live connection mesh, package auto-updater, and self-healing audit.',
      width: 840,
      height: 600,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-cyan-600/40 to-emerald-500/30 border-cyan-500/40 text-cyan-200'
    },
    {
      id: 'wine-app',
      title: 'Wine 9.0 Application',
      icon: '🍷',
      category: 'Utilities',
      description: 'Native Win32 Windows application running under Wine 9.0 Pro compatibility layer.',
      width: 680,
      height: 480,
      pinnedToDock: false,
      iconBg: 'bg-gradient-to-tr from-indigo-700/40 to-purple-600/30 border-indigo-500/40 text-purple-200'
    },
    {
      id: 'helix-ai',
      title: 'Helix AI Copilot',
      icon: '🤖',
      category: 'Development',
      description: '100% Client-Side AI Copilot running WebGPU/WASM LLMs locally inside your browser container.',
      width: 720,
      height: 540,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-purple-600/40 to-indigo-500/30 border-purple-500/40 text-purple-200'
    },
    {
      id: 'p2p-mesh',
      title: 'P2P Mesh Workspace Sync',
      icon: '📶',
      category: 'Utilities',
      description: 'Decentralized WebRTC peer-to-peer workspace sync for cross-device shared clipboards, file streams, and terminal sessions.',
      width: 760,
      height: 520,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-cyan-600/40 to-blue-500/30 border-cyan-500/40 text-cyan-200'
    },
    {
      id: 'apk-bridge',
      title: 'Android APK Layer',
      icon: '📱',
      category: 'Utilities',
      description: 'Lightweight WASM/Wayland translation bridge for running Android APK packages alongside Linux and Wine apps.',
      width: 800,
      height: 580,
      pinnedToDock: true,
      iconBg: 'bg-gradient-to-tr from-purple-600/40 to-emerald-500/30 border-purple-500/40 text-emerald-200'
    },
  ];

  static get(id: string): AppDefinition | undefined {
    return this.apps.find(a => a.id === id);
  }

  static getAll(): AppDefinition[] {
    return [...this.apps];
  }

  static addApp(app: AppDefinition): void {
    if (!this.apps.some(a => a.id === app.id)) {
      this.apps.push(app);
      this.saveCustomApps();
    }
  }

  static removeApp(id: string): void {
    this.apps = this.apps.filter(a => a.id !== id);
    this.saveCustomApps();
  }

  static togglePinToDock(id: string): void {
    const app = this.apps.find(a => a.id === id);
    if (app) {
      app.pinnedToDock = !app.pinnedToDock;
      this.saveCustomApps();
    }
  }

  private static saveCustomApps(): void {
    try {
      localStorage.setItem('helix_custom_apps', JSON.stringify(this.apps));
    } catch {
      // ignore
    }
  }

  static loadCustomApps(): void {
    try {
      const saved = localStorage.getItem('helix_custom_apps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaultAppIds = new Set(this.apps.map(a => a.id));
          const validCustomApps = parsed.filter((p: AppDefinition) => p && typeof p.id === 'string' && !defaultAppIds.has(p.id));
          
          // Apply custom pin overrides
          const pinMap = new Map<string, boolean>();
          for (const item of parsed) {
            if (item && item.id && typeof item.pinnedToDock === 'boolean') {
              pinMap.set(item.id, item.pinnedToDock);
            }
          }

          this.apps = this.apps.map(app => {
            if (pinMap.has(app.id)) {
              return { ...app, pinnedToDock: pinMap.get(app.id)! };
            }
            return app;
          }).concat(validCustomApps);
        }
      }
    } catch {
      // ignore non-fatal storage parse errors
    }
  }

  static search(query: string): AppDefinition[] {
    const q = query.toLowerCase();
    return this.apps.filter(a => 
      a.title.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
  }
}
