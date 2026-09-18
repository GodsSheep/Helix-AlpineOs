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
    },
    // 10 Powerful Alpine Apps
    {
      id: 'netscan',
      title: 'Network Diagnostics',
      icon: '🌐',
      category: 'Utilities',
      description: 'Ping, traceroute simulation, DNS lookup, and active port scan.',
      width: 600,
      height: 420,
      pinnedToDock: false,
    },
    {
      id: 'apkman',
      title: 'APK Package Manager',
      icon: '📦',
      category: 'Utilities',
      description: 'Advanced APK package repo manager to install & update tools.',
      width: 620,
      height: 460,
      pinnedToDock: false,
    },
    {
      id: 'syslog',
      title: 'Kernel Log Viewer',
      icon: '📜',
      category: 'System',
      description: 'Real-time kernel dmesg logs, system events and filtering.',
      width: 600,
      height: 400,
      pinnedToDock: false,
    },
    {
      id: 'procman',
      title: 'Process Manager',
      icon: '⚡',
      category: 'System',
      description: 'Task manager with CPU/RAM metrics and process signal controls.',
      width: 580,
      height: 400,
      pinnedToDock: false,
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
    },
    // Powerful New Linux Utilities & Profilers
    {
      id: 'neofetch',
      title: 'Neofetch System Profiler',
      icon: '🖥️',
      category: 'System',
      description: 'Alpine Linux hardware profiler, CPU architecture specs and uptime stats.',
      width: 600,
      height: 440,
      pinnedToDock: true,
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
    },
    {
      id: 'hexedit',
      title: 'Binary Hex Inspector',
      icon: '🔢',
      category: 'Development',
      description: 'Hexadecimal file inspector, binary byte editor and ASCII decoder.',
      width: 640,
      height: 460,
      pinnedToDock: false,
    },
    {
      id: 'benchmark',
      title: 'Hardware Benchmark',
      icon: '⚡',
      category: 'System',
      description: 'CPU FLOPS, WASM memory throughput and VFS storage benchmark suite.',
      width: 620,
      height: 460,
      pinnedToDock: false,
    },
    {
      id: 'rustcpp',
      title: 'Rust & C++ Native Studio',
      icon: '⚡',
      category: 'Development',
      description: 'Zero-latency local Rust 1.76 & C++23 WASM compiler, hardware profiler & vector execution engine.',
      width: 780,
      height: 560,
      pinnedToDock: true,
    },
    {
      id: 'guistudio',
      title: 'Universal GUI Studio & X11 Engine',
      icon: '✨',
      category: 'Development',
      description: 'Unified Python 3 GUI Studio, Virtual X11 Display Server (:0.0), and Universal Screen Converter.',
      width: 780,
      height: 560,
      pinnedToDock: true,
    },
    {
      id: 'pythonshowcase',
      title: 'Python 3 Studio & Showcase',
      icon: '🐍',
      category: 'Development',
      description: 'Unified Python 3.12 execution engine, standard library REPL, multi-framework GUI gallery & screen converter.',
      width: 780,
      height: 560,
      pinnedToDock: true,
    },
    {
      id: 'asynciomonitor',
      title: 'Async 9P I/O Monitor',
      icon: '⚙️',
      category: 'System',
      description: 'Dedicated asynchronous I/O worker thread monitor for V86 9P VFS mount operations.',
      width: 660,
      height: 480,
      pinnedToDock: true,
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
    },
    {
      id: 'services',
      title: 'OpenRC Services',
      icon: '⚙️',
      category: 'System',
      description: 'OpenRC init service manager, runlevels, and daemon controls.',
      width: 680,
      height: 480,
      pinnedToDock: false,
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
    },
    // Complete Linux Games Collection (10 Games)
    {
      id: 'game-racer',
      title: 'Alpine Highway Racer',
      icon: '🏎️',
      category: 'Games',
      description: 'Retro arcade highway obstacle dodging racing game.',
      width: 420,
      height: 540,
      pinnedToDock: false,
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
    },
    {
      id: 'guirunner',
      title: 'Helix GUI Studio & X11 Server',
      icon: '🖥️',
      category: 'Development',
      description: 'Run any Python GUI (Tkinter, PySimpleGUI, Turtle, WebGUI) & Linux Zenity dialogs directly on Helix DE with virtual X11 display server :0.0.',
      width: 760,
      height: 540,
      pinnedToDock: true,
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
          this.apps = parsed;
        }
      }
    } catch {
      // ignore
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
