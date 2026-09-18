import { VMState, TelemetryData } from './types';
import { RPCEngine } from './RPC';
import { VirtualFileSystem } from './VFS';
import { Settings } from './Settings';
import { Network } from './NetworkService';
import { GuiDisplayServer } from './GuiServer';
import { PythonEngine } from './PythonEngine';
import { Async9PIOThread } from './Async9PIOThread';
import { NativeEngine } from './NativeEngine';

export type TerminalCallback = (text: string) => void;
export type TelemetryCallback = (data: TelemetryData) => void;
export type StateCallback = (state: VMState) => void;

function getWindowEmulator(): any {
  if (typeof window !== 'undefined') {
    return (window as any).emulator;
  }
  return null;
}

function setWindowEmulator(val: any): void {
  if (typeof window !== 'undefined') {
    (window as any).emulator = val;
  }
}

function getV86Constructor(): any {
  if (typeof window !== 'undefined') {
    return (window as any).V86 || (window as any).V86Starter;
  }
  return undefined;
}

export class VirtualMachineEngine {
  public state: VMState = 'cold';
  public rpc: RPCEngine;
  
  private termListeners: Set<TerminalCallback> = new Set();
  private telemetryListeners: Set<TelemetryCallback> = new Set();
  private stateListeners: Set<StateCallback> = new Set();
  private telemetryInterval: ReturnType<typeof setInterval> | null = null;
  private bootTimers: any[] = [];
  private bootLogs: string[] = [];
  private bootStartTime: number = Date.now();
  
  // Environment variables
  private env: Record<string, string> = {
    USER: 'root',
    HOME: '/root',
    SHELL: '/bin/ash',
    TERM: 'xterm-256color',
    HOSTNAME: 'helix-alpine',
    LANG: 'C.UTF-8',
    PAGER: 'cat',
    PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    EDITOR: 'helix-edit',
    ALPINE_VERSION: '3.20.0',
    DISPLAY: ':0.0',
    XDG_SESSION_TYPE: 'x11',
    WAYLAND_DISPLAY: 'wayland-0'
  };

  // Command execution history
  private executionHistory: string[] = [];
  private aliases: Record<string, string> = {
    ll: 'ls -la',
    l: 'ls -l',
    la: 'ls -a',
    cls: 'clear',
    py: 'python3',
    md: 'mkdir -p',
    rd: 'rmdir'
  };

  // Installed packages in Alpine
  private installedPkgs = new Set<string>([
    'alpine-base',
    'python3',
    'py3-pip',
    'nodejs',
    'npm',
    'busybox',
    'openrc',
    'musl',
    'curl',
    'wget',
    'git',
    'tree',
    'neofetch',
    'htop'
  ]);

  private cwd: string = '/mnt/helix';
  private systemDirs: Set<string> = new Set([
    '/',
    '/bin',
    '/dev',
    '/etc',
    '/etc/apk',
    '/etc/network',
    '/etc/init.d',
    '/home',
    '/home/helix',
    '/lib',
    '/lib/modules',
    '/media',
    '/mnt',
    '/mnt/helix',
    '/proc',
    '/root',
    '/run',
    '/sbin',
    '/sys',
    '/tmp',
    '/usr',
    '/usr/bin',
    '/usr/lib',
    '/usr/local',
    '/usr/local/bin',
    '/usr/share',
    '/var',
    '/var/log',
    '/var/cache',
    '/var/run'
  ]);

  private systemFiles: Record<string, string> = {
    '/etc/os-release': 'NAME="Alpine Linux"\nID=alpine\nVERSION_ID=3.20.0\nPRETTY_NAME="Alpine Linux v3.20"\nHOME_URL="https://alpinelinux.org/"\nBUG_REPORT_URL="https://gitlab.alpinelinux.org/alpine/aports/-/issues"\n',
    '/etc/alpine-release': '3.20.0\n',
    '/etc/hosts': '127.0.0.1\tlocalhost helix-alpine\n::1\tlocalhost ip6-localhost ip6-loopback\n10.0.2.2\thost.virtnet\n',
    '/etc/resolv.conf': 'nameserver 1.1.1.1\nnameserver 8.8.8.8\nnameserver 9.9.9.9\n',
    '/etc/fstab': '/dev/sda1\t/\text4\tdefaults,noatime\t1 1\nhost9p\t/mnt/helix\t9p\ttrans=virtio,version=9p2000.L,rw\t0 0\nproc\t/proc\tproc\tdefaults\t0 0\nsysfs\t/sys\tsysfs\tdefaults\t0 0\ndevtmpfs\t/dev\tdevtmpfs\tdefaults\t0 0\n',
    '/etc/issue': 'Welcome to Alpine Linux 3.20 (x86_64)\nKernel \\r on an \\m (\\l)\n',
    '/etc/motd': 'Alpine Linux v3.20.0 Host Environment (Helix OS v6 JIT Engine)\nType "help" for a list of available system commands.\n',
    '/proc/version': 'Linux version 6.6.14-virt (alpine@builder) (gcc 13.2.1) #1-Alpine SMP PREEMPT_DYNAMIC\n',
    '/proc/cpuinfo': 'processor\t: 0\nvendor_id\t: GenuineIntel\nmodel name\t: Intel(R) Core(TM) Architecture (Helix v86 JIT)\ncpu MHz\t\t: 2400.000\ncache size\t: 16384 KB\nflags\t\t: fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ss syscall nx lm constant_tsc rep_good nopl cpuid pni pclmulqdq ssse3 cx16 sse4_1 sse4_2 popcnt aes xsave avx hypervisor\n',
    '/proc/meminfo': 'MemTotal:         262144 kB\nMemFree:          186368 kB\nMemAvailable:     206848 kB\nBuffers:           14336 kB\nCached:            13312 kB\nSwapTotal:             0 kB\nSwapFree:              0 kB\n',
    '/proc/uptime': '3600.42 3580.12\n',
    '/proc/loadavg': '0.18 0.12 0.05 1/45 142\n',
    '/root/.profile': 'export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"\nexport PS1="\\h:\\w\\$ "\n',
    '/root/.ashrc': 'alias ll="ls -la"\nalias l="ls -l"\nalias cls="clear"\n',
    '/etc/apk/repositories': 'https://dl-cdn.alpinelinux.org/alpine/v3.20/main\nhttps://dl-cdn.alpinelinux.org/alpine/v3.20/community\nhttps://dl-cdn.alpinelinux.org/alpine/edge/testing\n',
    '/etc/network/interfaces': 'auto lo\niface lo inet loopback\n\nauto eth0\niface eth0 inet dhcp\n',
    '/etc/init.d/syslog': '#!/sbin/openrc-run\ndescription="Syslog daemon"\n',
    '/etc/init.d/sshd': '#!/sbin/openrc-run\ndescription="OpenSSH server daemon"\n'
  };

  constructor(private vfs: VirtualFileSystem) {
    this.rpc = new RPCEngine((cmd) => this.rawSerialSend(cmd));
  }

  public getCwd(): string {
    return this.cwd;
  }

  public setCwd(path: string): void {
    this.cwd = this.resolvePath(path);
  }

  public resolvePath(target: string): string {
    const raw = (target || '').trim();
    if (!raw || raw === '~') return '/mnt/helix';
    if (raw === '~/') return '/mnt/helix';
    if (raw.startsWith('~/')) return '/mnt/helix/' + raw.substring(2);

    let full = raw.startsWith('/') ? raw : (this.cwd === '/' ? `/${raw}` : `${this.cwd}/${raw}`);
    // Normalize path components
    const parts = full.split('/').filter(Boolean);
    const stack: string[] = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(part);
      }
    }
    return '/' + stack.join('/');
  }

  public getBootLogs(): string[] {
    return [...this.bootLogs];
  }

  public getInstalledPackages(): string[] {
    return Array.from(this.installedPkgs);
  }

  public getHistory(): string[] {
    return [...this.executionHistory];
  }

  // --- External API ---

  async start(): Promise<void> {
    if (this.state === 'ready') return;
    this.setState('booting');
    this.bootLogs = [];
    this.bootStartTime = Date.now();

    // Ensure persistent VFS storage is initialized before 9P mount
    await this.vfs.init().catch(() => {});

    const bootSequence: { text: string; delay: number }[] = [
      { text: '[BIOS] SeaBIOS (version rel-1.16.3-0-ga39e2d0-prebuilt.qemu.org)', delay: 5 },
      { text: '[BIOS] Machine: Helix Virtual x86_64 (256 MB RAM, ACPI 2.0, SMP 1-Core)', delay: 10 },
      { text: '[BIOS] Booting from ROM / Hard Disk 0 (/dev/sda1)...', delay: 15 },
      { text: '[ OK ] PCI: Probing PCI hardware (host bridge, virtio-net, virtio-9p, ac97 audio)', delay: 15 },
      { text: '[ OK ] ACPI: Core subsystem initialized (FADT, DSDT, MADT)', delay: 10 },
      { text: '[ OK ] Linux version 6.6.14-virt (alpine@build-edge) (gcc 13.2.1) #1-Alpine SMP', delay: 15 },
      { text: '[ OK ] Memory: 236480K/262144K available (6144K kernel code, 1280K rwdata)', delay: 10 },
      { text: '[ OK ] CPU: Intel(R) Core(TM) Architecture Emulated @ 2.40GHz', delay: 10 },
      { text: '[ OK ] devtmpfs: mounted on /dev', delay: 10 },
      { text: '[ OK ] virtio-pci 0000:00:03.0: virtio_net eth0 (MAC 52:54:00:12:34:56, 192.168.1.105)', delay: 15 },
      { text: '[ OK ] 9pnet: Installing 9P2000 support (virtio transport)', delay: 10 },
      { text: '[ OK ] 9p: Mounting host filesystem \'host9p\' at /mnt/helix (trans=virtio,rw,cache=mmap)', delay: 15 },
      { text: '[ OK ] OpenRC 0.52.1 is starting up Alpine Linux 3.20.0 (x86_64)', delay: 10 },
      { text: '[ OK ] Starting syslogd: busybox-1.36.1 syslog daemon...', delay: 10 },
      { text: '[ OK ] Starting sshd: OpenSSH_9.7p1 [port 22]...', delay: 15 },
      { text: '[ OK ] Starting helix-rpc-bus daemon on ttyS0 [115200 baud]...', delay: 15 },
      { text: '[ OK ] Alpine Linux 3.20.0 (x86_64) login: root (automatic login)', delay: 10 },
      { text: 'Welcome to Alpine Linux 3.20!', delay: 10 },
      { text: 'Alpine Virtual Host Engine is ONLINE with 9P persistent storage mounted.', delay: 10 },
    ];

    this.bootTimers.forEach(t => clearTimeout(t));
    this.bootTimers = [];
    
    let totalDelay = 0;
    for (const step of bootSequence) {
      this.bootLogs.push(step.text);
      totalDelay += step.delay;
      const t = setTimeout(() => {
        this.broadcastTerminal(step.text + '\n');
      }, totalDelay);
      this.bootTimers.push(t);
    }

    const V86Constructor = getV86Constructor();
    if (typeof V86Constructor !== 'undefined') {
      try {
        const emu = new V86Constructor({
          wasm_path: '/v86/v86.wasm',
          wasm_fn: async (param: any) => {
            try {
              let buf: ArrayBuffer;
              try {
                const res = await fetch('/v86/v86-fallback.wasm');
                if (res.ok) {
                  buf = await res.arrayBuffer();
                } else {
                  throw new Error('Fallback not OK');
                }
              } catch (e) {
                const alt = await fetch('/v86/v86.wasm');
                if (!alt.ok) throw new Error(`v86.wasm status: ${alt.status}`);
                buf = await alt.arrayBuffer();
              }
              const { instance } = await WebAssembly.instantiate(buf, param);
              return instance.exports;
            } catch (err) {
              console.warn('Wasm instantiate fallback:', err);
              throw err;
            }
          },
          memory_size: 256 * 1024 * 1024,
          vga_memory_size: 8 * 1024 * 1024,
          bios: { url: '/v86/seabios.bin', async: false },
          vga_bios: { url: '/v86/vgabios.bin', async: false },
          cdrom: { url: '/v86/linux3.iso', async: false },
          filesystem: {},
          autostart: true,
          disable_keyboard: true,
          disable_mouse: true,
        });
        setWindowEmulator(emu);

        if (emu && typeof emu.add_listener === 'function') {
          emu.add_listener('serial0-output-char', (char: string) => {
            this.handleSerialData(char);
          });
          emu.add_listener('emulator-stopped', () => {
            console.warn('Alpine hardware emulator stopped.');
          });
        }
      } catch (e) {
        console.warn('V86 init skipped/fallback active:', e);
      }
    }

    const finalTimer = setTimeout(() => {
      this.setState('ready');
      this.startTelemetryLoop();
      // Offload 9P mount and file reads to dedicated Asynchronous I/O Thread
      Async9PIOThread.get().mountHost9pAsync().then(() => {
        this.executeCommand('mkdir -p /mnt/helix && mount -t 9p -o trans=virtio,version=9p2000.L host9p /mnt/helix 2>/dev/null || true')
          .catch(() => {});
      });
      this.broadcastTerminal('\n[root@helix-alpine ~]# ');
    }, totalDelay + 30);
    this.bootTimers.push(finalTimer);
  }

  stop(): void {
    const emu = getWindowEmulator();
    if (emu) {
      try {
        emu.stop();
        emu.destroy();
      } catch (err) {
        console.warn('V86 stop skipped:', err);
      }
      setWindowEmulator(null);
    }
    this.bootTimers.forEach(t => clearTimeout(t));
    this.bootTimers = [];
    if (this.telemetryInterval) clearInterval(this.telemetryInterval);
    this.setState('stopped');
  }

  async restoreSnapshot(): Promise<void> {
    this.setState('booting');
    this.bootLogs = [];
    this.bootStartTime = Date.now();

    const steps = [
      '[SNAPSHOT] Locating /sys/snapshot.bin from persistent VFS storage...',
      '[SNAPSHOT] Verified RAM checkpoint checksum (256 MB State Object)...',
      '[SNAPSHOT] Restoring CPU registers, page tables, and MMU descriptors...',
      '[SNAPSHOT] Attaching 9P2000 virtio bridge to /mnt/helix...',
      '[ OK ] Alpine Linux 3.20 state restored instantaneously in 12ms!',
    ];

    steps.forEach((s, idx) => {
      setTimeout(() => {
        this.bootLogs.push(s);
        this.broadcastTerminal(s + '\n');
        if (idx === steps.length - 1) {
          this.setState('ready');
          this.startTelemetryLoop();
          this.broadcastTerminal('\n[root@helix-alpine ~]# ');
        }
      }, (idx + 1) * 60);
    });
  }

  // --- Command Execution Layer with Compound & Pipeline Support ---

  async executeCommand(cmd: string): Promise<string> {
    const trimmed = cmd.trim();
    if (!trimmed) return '';
    this.executionHistory.push(trimmed);

    // 1. Compound statement: semicolon `;` or `&&`
    if (trimmed.includes('&&')) {
      const parts = trimmed.split('&&');
      const results: string[] = [];
      for (const part of parts) {
        const out = await this.executePipeline(part.trim());
        if (out) results.push(out);
      }
      return results.join('\n');
    }

    if (trimmed.includes(';')) {
      const parts = trimmed.split(';');
      const results: string[] = [];
      for (const part of parts) {
        if (part.trim()) {
          const out = await this.executePipeline(part.trim());
          if (out) results.push(out);
        }
      }
      return results.join('\n');
    }

    return this.executePipeline(trimmed);
  }

  /**
   * Execute pipeline e.g. cmd1 | cmd2 | cmd3
   */
  private async executePipeline(pipelineCmd: string): Promise<string> {
    const pipeParts = pipelineCmd.split('|');
    if (pipeParts.length === 1) {
      return this.executeSingleWithRedirection(pipelineCmd);
    }

    let currentInput = '';
    for (let i = 0; i < pipeParts.length; i++) {
      const stage = pipeParts[i].trim();
      if (!stage) continue;
      currentInput = await this.executeSingleWithRedirection(stage, currentInput);
    }
    return currentInput;
  }

  /**
   * Execute single command with file redirection (> or >>)
   */
  private async executeSingleWithRedirection(rawCmd: string, pipedInput?: string): Promise<string> {
    if (rawCmd.includes('>') || rawCmd.includes('>>')) {
      const isAppend = rawCmd.includes('>>');
      const parts = rawCmd.split(isAppend ? '>>' : '>');
      const commandPart = parts[0].trim();
      const rawTarget = parts[1].trim();
      const resolved = this.resolvePath(rawTarget);
      
      const content = await this.executeNativeCommand(commandPart, pipedInput);
      
      const vfsPath = resolved.replace('/mnt/helix', '') || '/';
      const normalizedPath = vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath;
      if (isAppend) {
        const existing = (await this.vfs.read(normalizedPath)) || '';
        await this.vfs.write(normalizedPath, existing + content + '\n');
      } else {
        await this.vfs.write(normalizedPath, content + '\n');
      }
      return '';
    }

    return this.executeNativeCommand(rawCmd, pipedInput);
  }

  /**
   * Parse command line arguments preserving double and single quotes
   */
  private parseArgs(commandLine: string): string[] {
    const args: string[] = [];
    let current = '';
    let inDoubleQuote = false;
    let inSingleQuote = false;

    for (let i = 0; i < commandLine.length; i++) {
      const char = commandLine[i];
      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
      } else if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
      } else if (char === ' ' && !inDoubleQuote && !inSingleQuote) {
        if (current.length > 0) {
          args.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    if (current.length > 0) {
      args.push(current);
    }
    return args;
  }

  /**
   * Core POSIX command engine
   */
  private async executeNativeCommand(rawCmd: string, pipedInput?: string): Promise<string> {
    let args = this.parseArgs(rawCmd.trim());
    if (args.length === 0) return '';

    let cmd = args[0];
    // Check aliases
    if (this.aliases[cmd]) {
      const aliasExpanded = this.aliases[cmd];
      const restArgs = args.slice(1);
      return this.executeNativeCommand(`${aliasExpanded} ${restArgs.join(' ')}`, pipedInput);
    }

    const restArgs = args.slice(1);

    switch (cmd.toLowerCase()) {
      case 'cd': {
        const target = restArgs[0] || '~';
        const resolved = this.resolvePath(target);
        
        const isSysDir = this.systemDirs.has(resolved);
        const isVfsDir = resolved === '/mnt/helix' || resolved.startsWith('/mnt/helix/');
        
        if (isSysDir || isVfsDir) {
          this.cwd = resolved;
          this.env.PWD = this.cwd;
          return '';
        }

        const vfsRel = resolved.replace('/mnt/helix', '');
        const files = await this.vfs.list();
        const hasVfsChild = files.some(f => f.path.startsWith(vfsRel));
        if (hasVfsChild) {
          this.cwd = resolved;
          this.env.PWD = this.cwd;
          return '';
        }

        return `sh: cd: can't cd to ${restArgs[0]}: No such file or directory`;
      }

      case 'pwd':
        return this.cwd;

      case 'uname': {
        const flag = restArgs[0];
        if (!flag || flag === '-s') return 'Linux';
        if (flag === '-r') return '6.6.14-virt';
        if (flag === '-m') return 'x86_64';
        if (flag === '-n') return 'helix-alpine';
        if (flag === '-v') return '#1-Alpine SMP PREEMPT_DYNAMIC';
        return 'Linux helix-alpine 6.6.14-virt #1-Alpine SMP PREEMPT_DYNAMIC x86_64 Linux';
      }

      case 'help':
      case '?': {
        return [
          '╔═══════════════════════════════════════════════════════════════════════╗',
          '║           Helix OS - Alpine Linux v3.20.0 Host Environment            ║',
          '╚═══════════════════════════════════════════════════════════════════════╝',
          'Core Shell & Navigation:',
          '  cd [dir]          Change working directory (cd ~, cd /, cd .., cd /etc)',
          '  pwd               Print current working directory',
          '  ls [-la] [dir]    List directory contents with detailed permissions & sizes',
          '  tree [dir]        Recursive visual directory tree view',
          '  cat <file>        Display content of files (supports pipes: cat f | grep x)',
          '  echo <text>       Print text, supports file redirection (> and >>)',
          '  clear             Clear terminal screen (or press Ctrl+L)',
          '',
          'File & Directory Operations:',
          '  touch <file>      Create or update file timestamp',
          '  mkdir [-p] <dir>  Create directories',
          '  rm [-rf] <path>   Remove files or directories',
          '  cp <src> <dst>    Copy files',
          '  mv <src> <dst>    Move or rename files',
          '  head / tail [-n]  Display beginning or end of files or piped streams',
          '  grep [-i -v -n]   Search for regular expressions or keywords in text',
          '  wc [-l -w -c]     Count lines, words, and bytes',
          '  find [path]       Locate files by name pattern',
          '  diff <f1> <f2>    Compare two files line by line',
          '  du [-sh] [dir]    Estimate file space usage',
          '  stat <file>       Display detailed inode and timestamp statistics',
          '  file <file>       Determine file type and encoding',
          '',
          'System Inspection & Management:',
          '  neofetch          Show Alpine Linux ASCII logo and system information',
          '  htop / top        Interactive process snapshot and CPU/RAM breakdown',
          '  ps [aux]          List current process table',
          '  kill <pid>        Terminate a process',
          '  free [-h -m]      Display total, used, and available RAM',
          '  df [-h]           Display filesystem disk space usage',
          '  uptime            Show system uptime and load average',
          '  whoami / id       Show user identity and group memberships',
          '  hostname          Display system network name',
          '  date / cal        Display system clock, UTC timestamp, or calendar',
          '  env / export      Inspect and set environment variables',
          '  which <cmd>       Locate executable binary path',
          '  dmesg             Display Linux kernel ring buffer logs',
          '  rc-service/status Check OpenRC service daemon status',
          '',
          'Networking & Web:',
          '  ip a / ifconfig   Show network interface configurations and IP address',
          '  ping <host>       Send ICMP Echo requests with latency statistics',
          '  curl / wget       Fetch web documents, endpoints, or REST APIs',
          '  netstat / ss      Show active network sockets and routing table',
          '',
          'Runtimes, Development & Package Management:',
          '  apk [add/del/info] Alpine Package Keeper package manager',
          '  python3 <file>    Execute Python scripts or interactive snippets',
          '  node <file>       Execute JavaScript with Node.js runtime',
          '  gcc <file>        Compile C/C++ source code',
          '  git [status/log]  Git version control repository tools',
          '  tar / gzip        Archive and compress files',
          '  cmatrix / figlet  Terminal animations and ASCII art banners'
        ].join('\n');
      }

      case 'clear':
      case 'cls':
        return '';

      case 'whoami':
        return this.env.USER || 'root';

      case 'id':
        return 'uid=0(root) gid=0(root) groups=0(root),1(bin),2(daemon),3(sys),4(adm),6(disk),10(wheel),11(floppy),20(dialout),26(tape),27(video)';

      case 'hostname':
        return this.env.HOSTNAME || 'helix-alpine';

      case 'date':
        return new Date().toUTCString();

      case 'cal': {
        const now = new Date();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const m = monthNames[now.getMonth()];
        const y = now.getFullYear();
        const header = `   ${m} ${y}`;
        const daysHeader = 'Su Mo Tu We Th Fr Sa';
        
        const firstDay = new Date(y, now.getMonth(), 1).getDay();
        const lastDate = new Date(y, now.getMonth() + 1, 0).getDate();
        
        let calLines: string[] = [header, daysHeader];
        let currentWeek: string[] = Array(firstDay).fill('  ');
        
        for (let d = 1; d <= lastDate; d++) {
          const dStr = String(d).padStart(2, ' ');
          if (d === now.getDate()) {
            currentWeek.push(`\x1b[7m${dStr}\x1b[0m`);
          } else {
            currentWeek.push(dStr);
          }
          if (currentWeek.length === 7) {
            calLines.push(currentWeek.join(' '));
            currentWeek = [];
          }
        }
        if (currentWeek.length > 0) {
          calLines.push(currentWeek.join(' '));
        }
        return calLines.join('\n');
      }

      case 'uptime': {
        const diffMinutes = Math.floor((Date.now() - this.bootStartTime) / 60000);
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        const nowStr = new Date().toTimeString().split(' ')[0];
        return `${nowStr} up ${hours > 0 ? `${hours} hr ` : ''}${mins} min, 1 user, load average: 0.18, 0.12, 0.05`;
      }

      case 'echo': {
        const text = restArgs.join(' ');
        // Expand env variables e.g. $USER, $HOME, $PWD
        const expanded = text.replace(/\$([A-Z_]+)/g, (_, name) => this.env[name] || '');
        return expanded.replace(/^["']|["']$/g, '');
      }

      case 'ls': {
        const targetArg = restArgs.find(a => !a.startsWith('-'));
        const isLong = restArgs.some(a => a.includes('l'));
        const showAll = restArgs.some(a => a.includes('a'));
        
        const targetPath = targetArg ? this.resolvePath(targetArg) : this.cwd;

        if (!targetPath.startsWith('/mnt/helix')) {
          if (targetPath === '/') {
            const rootItems = ['bin', 'dev', 'etc', 'home', 'lib', 'media', 'mnt', 'proc', 'root', 'run', 'sbin', 'sys', 'tmp', 'usr', 'var'];
            if (isLong) {
              return rootItems.map(item => `drwxr-xr-x 2 root root 4096 Sep 17 19:20 ${item}`).join('\n');
            }
            return rootItems.join('  ');
          }
          if (targetPath === '/mnt') {
            return isLong ? 'drwxr-xr-x 2 root root 4096 Sep 17 19:20 helix' : 'helix';
          }
          if (targetPath === '/etc') {
            const etcItems = ['alpine-release', 'apk', 'fstab', 'hosts', 'init.d', 'issue', 'motd', 'network', 'os-release', 'resolv.conf'];
            if (isLong) {
              return etcItems.map(item => `-rw-r--r-- 1 root root  512 Sep 17 19:20 ${item}`).join('\n');
            }
            return etcItems.join('  ');
          }
          if (targetPath === '/bin') {
            const binItems = ['ash', 'busybox', 'cat', 'chmod', 'chown', 'clear', 'cp', 'date', 'echo', 'grep', 'kill', 'ls', 'mkdir', 'mv', 'ps', 'pwd', 'rm', 'sed', 'sh', 'tar', 'touch', 'uname', 'wc'];
            return binItems.join('  ');
          }
          if (targetPath === '/sbin') {
            const sbinItems = ['apk', 'halt', 'ifconfig', 'init', 'ip', 'openrc', 'poweroff', 'reboot', 'route', 'syslogd'];
            return sbinItems.join('  ');
          }
          if (targetPath === '/proc') {
            const procItems = ['cpuinfo', 'loadavg', 'meminfo', 'uptime', 'version'];
            return procItems.join('  ');
          }
          if (targetPath === '/root') {
            const rootItems = showAll ? ['.', '..', '.ashrc', '.profile'] : [];
            return rootItems.join('  ');
          }
          if (targetPath === '/home' || targetPath === '/home/helix') {
            return 'helix';
          }
          if (targetPath === '/tmp' || targetPath === '/var') {
            return 'cache  log  run  tmp';
          }
        }

        const files = await this.vfs.list();
        const vfsRel = targetPath.replace('/mnt/helix', '');
        
        const filteredFiles = files.filter(f => {
          if (!vfsRel || vfsRel === '/') return true;
          return f.path.startsWith(vfsRel);
        });

        if (filteredFiles.length === 0) return '';

        if (isLong) {
          const lines = [
            `total ${filteredFiles.length * 4}`,
            'drwxr-xr-x 2 root root 4096 Sep 17 19:20 .',
            'drwxr-xr-x 3 root root 4096 Sep 17 19:20 ..'
          ];
          for (const f of filteredFiles) {
            const cleanName = f.path.replace(/^\//, '');
            const size = f.content.length;
            const dateStr = new Date(f.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            lines.push(`-rw-r--r-- 1 root root ${String(size).padStart(6, ' ')} ${dateStr} ${cleanName}`);
          }
          return lines.join('\n');
        }

        return filteredFiles.map(f => f.path.replace(/^\//, '')).join('  ');
      }

      case 'tree': {
        const target = restArgs[0] ? this.resolvePath(restArgs[0]) : this.cwd;
        const files = await this.vfs.list();
        const vfsRel = target.replace('/mnt/helix', '');
        const matching = files.filter(f => !vfsRel || vfsRel === '/' || f.path.startsWith(vfsRel));
        
        const lines = [target];
        matching.forEach((f, idx) => {
          const isLast = idx === matching.length - 1;
          const prefix = isLast ? '└── ' : '├── ';
          lines.push(prefix + f.path.replace(/^\//, ''));
        });
        lines.push(`\n${matching.length} files`);
        return lines.join('\n');
      }

      case 'cat': {
        if (pipedInput !== undefined && restArgs.length === 0) {
          return pipedInput;
        }
        if (restArgs.length === 0) return 'cat: missing file operand';
        const resolved = this.resolvePath(restArgs[0]);
        
        // Dynamic /proc and /sys files
        if (resolved === '/proc/cpuinfo') {
          const hw = Settings.getHardwareInfo();
          const s = Settings.get();
          const cores = s.vmCores || hw.cpuCores || 2;
          const cpuBlocks = [];
          for (let i = 0; i < cores; i++) {
            cpuBlocks.push([
              `processor\t: ${i}`,
              `vendor_id\t: GenuineIntel`,
              `cpu family\t: 6`,
              `model\t\t: 158`,
              `model name\t: Intel(R) Core(TM) Architecture (Helix v86 JIT)`,
              `stepping\t: 9`,
              `microcode\t: 0xca`,
              `cpu MHz\t\t: 2400.000`,
              `cache size\t: 16384 KB`,
              `physical id\t: 0`,
              `siblings\t: ${cores}`,
              `core id\t\t: ${i}`,
              `cpu cores\t: ${cores}`,
              `flags\t\t: fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ss ht syscall nx lm constant_tsc rep_good nopl cpuid pni pclmulqdq ssse3 cx16 sse4_1 sse4_2 popcnt aes xsave avx hypervisor`,
              `bugs\t\t:`,
              `bogomips\t: 4800.00`,
              `clflush size\t: 64`,
              `cache_alignment\t: 64`,
              `address sizes\t: 39 bits physical, 48 bits virtual`,
              `power management:`
            ].join('\n'));
          }
          return cpuBlocks.join('\n\n');
        }

        if (resolved === '/proc/meminfo') {
          const s = Settings.get();
          const totalKb = (s.vmMemoryMB || 256) * 1024;
          const freeKb = Math.round(totalKb * 0.68);
          const availKb = Math.round(totalKb * 0.78);
          return [
            `MemTotal:       ${String(totalKb).padStart(8, ' ')} kB`,
            `MemFree:        ${String(freeKb).padStart(8, ' ')} kB`,
            `MemAvailable:   ${String(availKb).padStart(8, ' ')} kB`,
            `Buffers:           14336 kB`,
            `Cached:            18432 kB`,
            `SwapCached:            0 kB`,
            `Active:            48128 kB`,
            `Inactive:          12288 kB`,
            `SwapTotal:             0 kB`,
            `SwapFree:              0 kB`,
            `Dirty:                 0 kB`,
            `Writeback:             0 kB`,
            `AnonPages:         34816 kB`,
            `Mapped:            16384 kB`,
            `Shmem:              3072 kB`
          ].join('\n');
        }

        if (resolved === '/proc/loadavg') {
          const s = Settings.get();
          const factor = s.powerProfile === 'performance' ? '0.45 0.32 0.18' : s.powerProfile === 'powersave' ? '0.08 0.05 0.01' : '0.18 0.12 0.05';
          return `${factor} 2/52 ${Math.floor(Math.random() * 200 + 100)}`;
        }

        if (resolved === '/proc/uptime') {
          const uptimeSec = Math.floor((Date.now() - this.bootStartTime) / 1000);
          return `${uptimeSec}.42 ${(uptimeSec * 0.95).toFixed(2)}`;
        }

        if (resolved === '/sys/class/power_supply/BAT0/capacity' || resolved === '/proc/battery') {
          const hw = Settings.getHardwareInfo();
          return String(hw.batteryLevel ?? 98);
        }

        if (resolved === '/sys/class/power_supply/BAT0/status') {
          const hw = Settings.getHardwareInfo();
          return hw.isCharging ? 'Charging' : 'Discharging';
        }

        if (resolved === '/sys/class/power_supply/AC0/online') {
          const hw = Settings.getHardwareInfo();
          return hw.isCharging ? '1' : '0';
        }

        if (resolved === '/etc/network/interfaces') {
          return Network.generateNetworkInterfaces();
        }

        if (resolved === '/etc/wpa_supplicant/wpa_supplicant.conf') {
          return Network.generateWpaSupplicantConf();
        }

        if (resolved === '/etc/resolv.conf') {
          return Network.generateResolvConf();
        }

        if (resolved === '/proc/net/dev') {
          const wlan = Network.getInterface('wlan0');
          const eth = Network.getInterface('eth0');
          const lo = Network.getInterface('lo');
          return [
            'Inter-|   Receive                                                |  Transmit',
            ' face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed',
            `    lo: ${String(lo.rxBytes).padStart(7, ' ')}     ${String(lo.rxPackets).padStart(4, ' ')}    0    0    0     0          0         0  ${String(lo.txBytes).padStart(7, ' ')}     ${String(lo.txPackets).padStart(4, ' ')}    0    0    0     0       0          0`,
            `  eth0: ${String(eth.rxBytes).padStart(7, ' ')}     ${String(eth.rxPackets).padStart(4, ' ')}    0    0    0     0          0         0  ${String(eth.txBytes).padStart(7, ' ')}     ${String(eth.txPackets).padStart(4, ' ')}    0    0    0     0       0          0`,
            ` wlan0: ${String(wlan.rxBytes).padStart(7, ' ')}     ${String(wlan.rxPackets).padStart(4, ' ')}    0    0    0     0          0         0  ${String(wlan.txBytes).padStart(7, ' ')}     ${String(wlan.txPackets).padStart(4, ' ')}    0    0    0     0       0          0`
          ].join('\n');
        }

        if (resolved === '/proc/net/wireless') {
          const active = Network.getActiveNetwork();
          const pwr = Network.getIsWifiPoweredOn();
          return [
            'Inter-| sta-|   Quality        |   Discarded packets               | Missed | WE',
            ' face | tus | link level noise |  nwid  crypt   frag  retry   misc | beacon | 22',
            ` wlan0: 0000   ${pwr && active ? String(active.signal).padStart(2, ' ') : ' 0'}.  ${pwr && active ? active.rssi : -95}.  -256        0      0      0      0      0        0`
          ].join('\n');
        }

        if (resolved === '/proc/net/route') {
          return [
            'Iface\tDestination\tGateway \tFlags\tRefCnt\tUse\tMetric\tMask\t\tMTU\tWindow\tIRTT',
            'eth0\t0002000A\t00000000\t0001\t0\t0\t100\t00FFFFFF\t0\t0\t0',
            'wlan0\t0001A8C0\t00000000\t0001\t0\t0\t600\t00FFFFFF\t0\t0\t0',
            'wlan0\t00000000\t0101A8C0\t0003\t0\t0\t600\t00000000\t0\t0\t0'
          ].join('\n');
        }

        if (resolved === '/proc/net/arp') {
          const active = Network.getActiveNetwork();
          return [
            'IP address       HW type     Flags       HW address            Mask     Device',
            `192.168.1.1      0x1         0x2         ${active ? active.bssid : '00:c0:ca:9b:12:4a'}     *        wlan0`,
            '10.0.2.2         0x1         0x2         52:55:0a:00:02:02     *        eth0'
          ].join('\n');
        }

        if (resolved.startsWith('/sys/class/net/wlan0/operstate')) {
          return Network.getIsWifiPoweredOn() && Network.getActiveNetwork() ? 'up' : 'down';
        }

        if (resolved.startsWith('/sys/class/net/wlan0/address')) {
          return Network.getInterface('wlan0').macAddress;
        }

        if (resolved.startsWith('/sys/class/net/eth0/operstate')) {
          return 'up';
        }

        if (resolved.startsWith('/sys/class/net/eth0/address')) {
          return Network.getInterface('eth0').macAddress;
        }

        if (this.systemFiles[resolved]) {
          return this.systemFiles[resolved].trimEnd();
        }

        const vfsPath = resolved.replace('/mnt/helix', '') || '/';
        const normPath = vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath;
        const content = await this.vfs.read(normPath);
        if (content !== null) {
          return content.trimEnd();
        }
        return `cat: ${restArgs[0]}: No such file or directory`;
      }

      case 'touch': {
        if (restArgs.length === 0) return 'touch: missing file operand';
        for (const file of restArgs) {
          const resolved = this.resolvePath(file);
          const vfsPath = resolved.replace('/mnt/helix', '') || '/';
          const normPath = vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath;
          const existing = await this.vfs.read(normPath);
          if (existing === null) {
            await this.vfs.write(normPath, '');
          }
        }
        return '';
      }

      case 'mkdir': {
        if (restArgs.length === 0) return 'mkdir: missing operand';
        const dirArg = restArgs.find(a => !a.startsWith('-'));
        if (dirArg) {
          const resolved = this.resolvePath(dirArg);
          this.systemDirs.add(resolved);
          const vfsPath = resolved.replace('/mnt/helix', '') || '/';
          const normPath = (vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath) + '/.keep';
          await this.vfs.write(normPath, '');
        }
        return '';
      }

      case 'rm': {
        const fileArgs = restArgs.filter(a => !a.startsWith('-'));
        if (fileArgs.length === 0) return 'rm: missing operand';
        for (const fileArg of fileArgs) {
          const resolved = this.resolvePath(fileArg);
          const vfsPath = resolved.replace('/mnt/helix', '') || '/';
          const normPath = vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath;
          await this.vfs.delete(normPath);
          this.systemDirs.delete(resolved);
        }
        return '';
      }

      case 'cp': {
        if (restArgs.length < 2) return 'cp: missing destination file operand';
        const src = this.resolvePath(restArgs[0]);
        const dst = this.resolvePath(restArgs[1]);
        const srcVfs = src.replace('/mnt/helix', '') || '/';
        const dstVfs = dst.replace('/mnt/helix', '') || '/';
        const content = await this.vfs.read(srcVfs.startsWith('/') ? srcVfs : '/' + srcVfs);
        if (content !== null) {
          await this.vfs.write(dstVfs.startsWith('/') ? dstVfs : '/' + dstVfs, content);
          return '';
        }
        return `cp: can't stat '${restArgs[0]}': No such file or directory`;
      }

      case 'mv': {
        if (restArgs.length < 2) return 'mv: missing destination file operand';
        const src = this.resolvePath(restArgs[0]);
        const dst = this.resolvePath(restArgs[1]);
        const srcVfs = src.replace('/mnt/helix', '') || '/';
        const dstVfs = dst.replace('/mnt/helix', '') || '/';
        const content = await this.vfs.read(srcVfs.startsWith('/') ? srcVfs : '/' + srcVfs);
        if (content !== null) {
          await this.vfs.write(dstVfs.startsWith('/') ? dstVfs : '/' + dstVfs, content);
          await this.vfs.delete(srcVfs.startsWith('/') ? srcVfs : '/' + srcVfs);
          return '';
        }
        return `mv: can't rename '${restArgs[0]}': No such file or directory`;
      }

      case 'grep': {
        let pattern = '';
        let targetFile = '';
        let invert = false;
        let lineNum = false;
        let caseInsensitive = false;

        for (const a of restArgs) {
          if (a === '-v') invert = true;
          else if (a === '-n') lineNum = true;
          else if (a === '-i') caseInsensitive = true;
          else if (!pattern) pattern = a.replace(/^["']|["']$/g, '');
          else if (!targetFile) targetFile = a;
        }

        let sourceText = pipedInput ?? '';
        if (targetFile) {
          const resolved = this.resolvePath(targetFile);
          sourceText = this.systemFiles[resolved] || '';
          if (!sourceText) {
            const vfsPath = resolved.replace('/mnt/helix', '') || '/';
            sourceText = (await this.vfs.read(vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath)) || '';
          }
        }

        if (!sourceText && !pattern) return '';

        const lines = sourceText.split('\n');
        const matches = lines
          .map((line, idx) => ({ line, num: idx + 1 }))
          .filter(({ line }) => {
            const l = caseInsensitive ? line.toLowerCase() : line;
            const p = caseInsensitive ? pattern.toLowerCase() : pattern;
            const has = l.includes(p);
            return invert ? !has : has;
          });

        return matches.map(m => (lineNum ? `${m.num}:${m.line}` : m.line)).join('\n');
      }

      case 'wc': {
        let countLines = restArgs.includes('-l');
        let countWords = restArgs.includes('-w');
        let countBytes = restArgs.includes('-c');
        if (!countLines && !countWords && !countBytes) {
          countLines = countWords = countBytes = true;
        }

        let target = restArgs.find(a => !a.startsWith('-'));
        let text = pipedInput ?? '';
        if (target) {
          const resolved = this.resolvePath(target);
          text = this.systemFiles[resolved] || '';
          if (!text) {
            const vfsPath = resolved.replace('/mnt/helix', '') || '/';
            text = (await this.vfs.read(vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath)) || '';
          }
        }

        const lines = text ? text.split('\n').length : 0;
        const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        const bytes = text.length;

        const parts: string[] = [];
        if (countLines) parts.push(String(lines).padStart(4, ' '));
        if (countWords) parts.push(String(words).padStart(4, ' '));
        if (countBytes) parts.push(String(bytes).padStart(6, ' '));
        if (target) parts.push(target);

        return parts.join(' ');
      }

      case 'head': {
        let count = 10;
        const nIndex = restArgs.indexOf('-n');
        if (nIndex !== -1 && restArgs[nIndex + 1]) {
          count = parseInt(restArgs[nIndex + 1], 10) || 10;
        }

        const file = restArgs.find(a => !a.startsWith('-') && a !== String(count));
        let text = pipedInput ?? '';
        if (file) {
          const resolved = this.resolvePath(file);
          text = this.systemFiles[resolved] || '';
          if (!text) {
            const vfsPath = resolved.replace('/mnt/helix', '') || '/';
            text = (await this.vfs.read(vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath)) || '';
          }
        }
        return text.split('\n').slice(0, count).join('\n');
      }

      case 'tail': {
        let count = 10;
        const nIndex = restArgs.indexOf('-n');
        if (nIndex !== -1 && restArgs[nIndex + 1]) {
          count = parseInt(restArgs[nIndex + 1], 10) || 10;
        }

        const file = restArgs.find(a => !a.startsWith('-') && a !== String(count));
        let text = pipedInput ?? '';
        if (file) {
          const resolved = this.resolvePath(file);
          text = this.systemFiles[resolved] || '';
          if (!text) {
            const vfsPath = resolved.replace('/mnt/helix', '') || '/';
            text = (await this.vfs.read(vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath)) || '';
          }
        }
        const lines = text.split('\n');
        return lines.slice(Math.max(0, lines.length - count)).join('\n');
      }

      case 'find': {
        const root = restArgs[0] && !restArgs[0].startsWith('-') ? this.resolvePath(restArgs[0]) : this.cwd;
        const nameIdx = restArgs.indexOf('-name');
        const pattern = nameIdx !== -1 ? restArgs[nameIdx + 1]?.replace(/[*"']/g, '') : '';

        const files = await this.vfs.list();
        const vfsRel = root.replace('/mnt/helix', '');
        const filtered = files.filter(f => {
          const inRoot = !vfsRel || vfsRel === '/' || f.path.startsWith(vfsRel);
          if (!inRoot) return false;
          if (pattern) return f.path.includes(pattern);
          return true;
        });

        const list = [root];
        filtered.forEach(f => list.push('/mnt/helix' + f.path));
        return list.join('\n');
      }

      case 'diff': {
        if (restArgs.length < 2) return 'diff: missing operand';
        const p1 = this.resolvePath(restArgs[0]);
        const p2 = this.resolvePath(restArgs[1]);

        const c1 = (await this.vfs.read(p1.replace('/mnt/helix', ''))) || this.systemFiles[p1] || '';
        const c2 = (await this.vfs.read(p2.replace('/mnt/helix', ''))) || this.systemFiles[p2] || '';

        if (c1 === c2) return '';
        const l1 = c1.split('\n');
        const l2 = c2.split('\n');
        const output: string[] = [`--- ${restArgs[0]}`, `+++ ${restArgs[1]}`];
        const max = Math.max(l1.length, l2.length);
        for (let i = 0; i < max; i++) {
          if (l1[i] !== l2[i]) {
            if (l1[i] !== undefined) output.push(`< ${l1[i]}`);
            if (l2[i] !== undefined) output.push(`> ${l2[i]}`);
          }
        }
        return output.join('\n');
      }

      case 'stat': {
        if (restArgs.length === 0) return 'stat: missing operand';
        const file = restArgs[0];
        const resolved = this.resolvePath(file);
        const vfsPath = resolved.replace('/mnt/helix', '') || '/';
        const item = (await this.vfs.list()).find(f => f.path === vfsPath || f.path === '/' + vfsPath);
        
        const size = item ? item.content.length : 4096;
        const date = item ? new Date(item.timestamp).toISOString() : new Date().toISOString();
        return [
          `  File: ${file}`,
          `  Size: ${size}       Blocks: 8          IO Block: 4096   regular file`,
          'Device: 0019h/25d Inode: 142095     Links: 1',
          'Access: (0644/-rw-r--r--)  Uid: (    0/    root)   Gid: (    0/    root)',
          `Access: ${date}`,
          `Modify: ${date}`,
          `Change: ${date}`
        ].join('\n');
      }

      case 'file': {
        if (restArgs.length === 0) return 'file: missing operand';
        const file = restArgs[0];
        if (file.endsWith('.py')) return `${file}: Python script, ASCII text executable`;
        if (file.endsWith('.js') || file.endsWith('.ts')) return `${file}: JavaScript source, UTF-8 Unicode text`;
        if (file.endsWith('.sh')) return `${file}: POSIX shell script, ASCII text executable`;
        if (file.endsWith('.c') || file.endsWith('.cpp')) return `${file}: C/C++ source, ASCII text`;
        if (file.endsWith('.json')) return `${file}: JSON text data`;
        if (file.endsWith('.md')) return `${file}: Markdown text`;
        if (file.endsWith('.txt')) return `${file}: ASCII text`;
        if (file.endsWith('.iso')) return `${file}: ISO 9660 CD-ROM filesystem data`;
        if (file.endsWith('.bin')) return `${file}: BIOS ROM / Binary data`;
        return `${file}: ASCII text`;
      }

      case 'du': {
        const files = await this.vfs.list();
        const totalBytes = files.reduce((acc, f) => acc + f.content.length, 0);
        const totalKb = Math.ceil(totalBytes / 1024);
        return `${totalKb}K\t${this.cwd}`;
      }

      case 'which': {
        if (restArgs.length === 0) return '';
        const target = restArgs[0];
        const paths: Record<string, string> = {
          python: '/usr/bin/python3',
          python3: '/usr/bin/python3',
          node: '/usr/bin/node',
          npm: '/usr/bin/npm',
          gcc: '/usr/bin/gcc',
          'g++': '/usr/bin/g++',
          apk: '/sbin/apk',
          sh: '/bin/sh',
          ash: '/bin/ash',
          bash: '/bin/bash',
          git: '/usr/bin/git',
          htop: '/usr/bin/htop',
          top: '/usr/bin/top',
          neofetch: '/usr/bin/neofetch',
          tree: '/usr/bin/tree',
          ls: '/bin/ls',
          cat: '/bin/cat',
          grep: '/bin/grep',
          curl: '/usr/bin/curl',
          wget: '/usr/bin/wget'
        };
        return paths[target] || `/bin/${target}`;
      }

      case 'env':
      case 'export': {
        if (restArgs.length > 0 && restArgs[0].includes('=')) {
          const [k, ...v] = restArgs[0].split('=');
          this.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
          return '';
        }
        return Object.entries(this.env)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n');
      }

      case 'alias': {
        if (restArgs.length === 0) {
          return Object.entries(this.aliases)
            .map(([k, v]) => `alias ${k}='${v}'`)
            .join('\n');
        }
        const expr = restArgs.join(' ');
        if (expr.includes('=')) {
          const [k, ...v] = expr.split('=');
          this.aliases[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
          return '';
        }
        return `alias: ${expr}: not found`;
      }

      case 'history': {
        return this.executionHistory
          .slice(-30)
          .map((cmd, idx) => `  ${String(idx + 1).padStart(3, ' ')}  ${cmd}`)
          .join('\n');
      }

      case 'ip': {
        const sub = restArgs[0] || 'a';
        if (sub === 'a' || sub === 'addr' || sub === 'address') {
          return Network.generateIpAddr();
        }
        if (sub === 'r' || sub === 'route') {
          return Network.generateIpRoute();
        }
        if (sub === 'l' || sub === 'link') {
          const wlan = Network.getInterface('wlan0');
          const eth = Network.getInterface('eth0');
          return [
            '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000\n    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00',
            `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu ${eth.mtu} qdisc pfifo_fast state UP mode DEFAULT group default qlen 1000\n    link/ether ${eth.macAddress} brd ff:ff:ff:ff:ff:ff`,
            `3: wlan0: <BROADCAST,MULTICAST,${Network.getIsWifiPoweredOn() ? 'UP,LOWER_UP' : 'DOWN'}> mtu ${wlan.mtu} qdisc mq state ${Network.getIsWifiPoweredOn() ? 'UP' : 'DOWN'} mode DORMANT group default qlen 1000\n    link/ether ${wlan.macAddress} brd ff:ff:ff:ff:ff:ff`
          ].join('\n');
        }
        if (sub === 'n' || sub === 'neigh' || sub === 'neighbor') {
          const active = Network.getActiveNetwork();
          return [
            `192.168.1.1 dev wlan0 lladdr ${active ? active.bssid : '00:c0:ca:9b:12:4a'} REACHABLE`,
            '10.0.2.2 dev eth0 lladdr 52:55:0a:00:02:02 REACHABLE'
          ].join('\n');
        }
        return 'Usage: ip [addr | link | route | neigh]';
      }

      case 'ifconfig': {
        const target = restArgs[0];
        if (target === 'wlan0' && (restArgs[1] === 'up' || restArgs[1] === 'down')) {
          Network.setWifiPower(restArgs[1] === 'up');
          return '';
        }
        return Network.generateIfconfig();
      }

      case 'iw': {
        const cmd1 = restArgs[0];
        const cmd2 = restArgs[1];
        const cmd3 = restArgs[2];

        if (cmd1 === 'dev' && !cmd2) {
          return 'phy#0\n\tInterface wlan0\n\t\tifindex 3\n\t\twdev 0x1\n\t\taddr ' + Network.getInterface('wlan0').macAddress + '\n\t\ttype managed\n\t\ttxpower 20.00 dBm';
        }
        if (cmd1 === 'dev' && cmd2 === 'wlan0' && cmd3 === 'link') {
          return Network.generateIwDevLink();
        }
        if (cmd1 === 'dev' && cmd2 === 'wlan0' && cmd3 === 'scan') {
          return Network.generateIwDevScan();
        }
        if (cmd1 === 'dev' && cmd2 === 'wlan0' && cmd3 === 'info') {
          const active = Network.getActiveNetwork();
          return `Interface wlan0\n\tifindex 3\n\twdev 0x1\n\taddr ${Network.getInterface('wlan0').macAddress}\n\tssid ${active ? active.ssid : '(none)'}\n\ttype managed\n\twiphy 0\n\tchannel ${active ? active.channel : 36} (${active ? active.frequency.split(' ')[0] : '5.180 GHz'}), width: 80 MHz, center1: 5210 MHz\n\ttxpower 20.00 dBm`;
        }
        if (cmd1 === 'dev' && cmd2 === 'wlan0' && cmd3 === 'set' && restArgs[3] === 'power_save') {
          const mode = restArgs[4] === 'on';
          Network.updateInterfaceConfig('wlan0', { powerSave: mode });
          return `Power save mode for wlan0 set to: ${mode ? 'on' : 'off'}`;
        }
        if (cmd1 === 'list') {
          return [
            'Wiphy phy0',
            '\tmax # scan SSIDs: 16',
            '\tmax scan IEs length: 2304 bytes',
            '\tmax # sched scan SSIDs: 16',
            '\tmax # match sets: 16',
            '\tBand 1: 2.4 GHz (Channels 1-14)',
            '\t\tHT capabilities: 20/40 MHz, Short GI',
            '\tBand 2: 5 GHz (Channels 36-165)',
            '\t\tVHT capabilities: 80 MHz, Short GI, SU Beamformer/ee',
            '\t\tHE capabilities: 802.11ax Wi-Fi 6 OFDMA, 1024-QAM',
            '\tSupported Ciphers: WEP40, WEP104, TKIP, CCMP, GCMP-256, SMS4',
            '\tAuthentication: WPA-PSK, WPA-EAP, WPA3-SAE, OWE'
          ].join('\n');
        }
        return 'Usage: iw [dev | dev <devname> link | dev <devname> scan | dev <devname> info | dev <devname> set power_save <on|off> | list]';
      }

      case 'iwconfig': {
        const active = Network.getActiveNetwork();
        const pwr = Network.getIsWifiPoweredOn();
        const wlan = Network.getInterface('wlan0');
        if (!pwr) {
          return 'wlan0     IEEE 802.11  ESSID:off/any  \n          Mode:Managed  Access Point: Not-Associated   Tx-Power=off\n\nlo        no wireless extensions.\n\neth0      no wireless extensions.';
        }
        return [
          `wlan0     IEEE 802.11ax  ESSID:"${active ? active.ssid : 'off/any'}"  `,
          `          Mode:Managed  Frequency:${active ? active.frequency.split(' ')[0] : '5.18 GHz'}  Access Point: ${active ? active.bssid : 'Not-Associated'}   `,
          `          Bit Rate=${active ? active.speedMbps : 0} Mb/s   Tx-Power=20 dBm   `,
          `          Retry short limit:7   RTS thr:off   Fragment thr:off`,
          `          Power Management:${wlan.powerSave ? 'on' : 'off'}`,
          `          Link Quality=${active ? active.signal : 0}/100  Signal level=${active ? active.rssi : -95} dBm  `,
          `          Rx invalid nwid:0  Rx invalid crypt:0  Rx invalid frag:0`,
          `          Tx excessive retries:0  Invalid misc:0   Missed beacon:0`,
          '',
          'lo        no wireless extensions.',
          '',
          'eth0      no wireless extensions.'
        ].join('\n');
      }

      case 'iwlist': {
        const iface = restArgs[0] || 'wlan0';
        const sub = restArgs[1] || 'scan';
        if (sub === 'channel' || sub === 'freq') {
          return 'wlan0     32 channels in total; available frequencies :\n          Channel 01 : 2.412 GHz\n          Channel 06 : 2.437 GHz\n          Channel 11 : 2.462 GHz\n          Channel 36 : 5.18 GHz\n          Channel 40 : 5.20 GHz\n          Channel 44 : 5.22 GHz\n          Channel 48 : 5.24 GHz\n          Channel 149 : 5.745 GHz\n          Channel 153 : 5.765 GHz\n          Channel 157 : 5.785 GHz\n          Channel 161 : 5.805 GHz\n          Current Frequency: 5.18 GHz (Channel 36)';
        }
        if (sub === 'scan') {
          const nets = Network.getNetworks();
          return nets.map((n, i) => [
            `          Cell ${String(i + 1).padStart(2, '0')} - Address: ${n.bssid}`,
            `                    Channel:${n.channel}`,
            `                    Frequency:${n.frequency.split(' ')[0]} (Channel ${n.channel})`,
            `                    Quality=${n.signal}/100  Signal level=${n.rssi} dBm  `,
            `                    Encryption key:${n.security === 'Open' ? 'off' : 'on'}`,
            `                    ESSID:"${n.ssid}"`,
            `                    Bit Rates:${Math.round(n.speedMbps)} Mb/s`,
            `                    IE: IEEE 802.11i/WPA2 Version 1 (Authentication: ${n.security})`
          ].join('\n')).join('\n\n');
        }
        return 'Usage: iwlist [interface] [scan | channel | freq]';
      }

      case 'wpa_cli': {
        const sub = restArgs[0] || 'status';
        if (sub === 'status') {
          return Network.generateWpaCliStatus();
        }
        if (sub === 'scan') {
          Network.scanNetworks();
          return 'OK';
        }
        if (sub === 'scan_results') {
          const nets = Network.getNetworks();
          const rows = nets.map(n => `${n.bssid}\t${n.frequency.split(' ')[0].replace('.', '').replace('GHz', '0')}\t${n.rssi}\t[${n.security.includes('WPA3') ? 'WPA2-PSK+WPA3-SAE-CCMP' : n.security === 'Open' ? 'ESS' : 'WPA2-PSK-CCMP'}][ESS]\t${n.ssid}`);
          return ['bssid / frequency / signal level / flags / ssid', ...rows].join('\n');
        }
        if (sub === 'list_networks') {
          const nets = Network.getNetworks().filter(n => n.saved);
          const rows = nets.map((n, i) => `${i}\t${n.ssid}\tany\t[${n.connected ? 'CURRENT' : 'DISABLED'}]`);
          return ['network id / ssid / bssid / flags', ...rows].join('\n');
        }
        if (sub === 'disconnect') {
          Network.disconnectNetwork();
          return 'OK';
        }
        if (sub === 'reassociate') {
          return 'OK';
        }
        return 'Selected interface: wpa_supplicant on /var/run/wpa_supplicant/wlan0\nCommands: status, scan, scan_results, list_networks, disconnect, reassociate';
      }

      case 'nmcli': {
        const obj = restArgs[0];
        const verb = restArgs[1];
        const arg3 = restArgs[2];

        if (obj === 'dev' || obj === 'device' || obj === 'd') {
          if (verb === 'wifi' || verb === 'w') {
            if (arg3 === 'list' || !arg3) {
              return Network.generateNmcliDevWifi();
            }
            if (arg3 === 'connect') {
              const targetSsid = restArgs[3];
              const passIdx = restArgs.indexOf('password');
              const pass = passIdx !== -1 ? restArgs[passIdx + 1] : undefined;
              if (!targetSsid) return 'Error: Network SSID is required';
              Network.connectNetwork(targetSsid, pass);
              return `Device 'wlan0' successfully activated with '${targetSsid}'.`;
            }
            if (arg3 === 'rescan') {
              Network.scanNetworks();
              return 'Scanning for Wi-Fi networks on wlan0... done.';
            }
          }
          if (verb === 'status' || !verb) {
            const pwr = Network.getIsWifiPoweredOn();
            const active = Network.getActiveNetwork();
            return [
              'DEVICE  TYPE      STATE        CONNECTION',
              `wlan0   wifi      ${pwr && active ? 'connected    ' + active.ssid : pwr ? 'disconnected --' : 'unavailable  --'}`,
              'eth0    ethernet  connected    Wired Connection 1',
              'lo      loopback  unmanaged    --'
            ].join('\n');
          }
        }

        if (obj === 'connection' || obj === 'c') {
          const active = Network.getActiveNetwork();
          return [
            'NAME                UUID                                  TYPE      DEVICE',
            `Wired Connection 1  c4129b01-81f1-4320-b08e-151025550212  ethernet  eth0`,
            active ? `${active.ssid.padEnd(20, ' ')}${'8a391c09-4412-4011-88fc-' + active.ssid.length.toString().padStart(12, '0')}  wifi      wlan0` : ''
          ].filter(Boolean).join('\n');
        }

        if (obj === 'radio' || obj === 'r') {
          if (verb === 'wifi') {
            if (arg3 === 'on') {
              Network.setWifiPower(true);
              return 'Wi-Fi radio enabled.';
            }
            if (arg3 === 'off') {
              Network.setWifiPower(false);
              return 'Wi-Fi radio disabled.';
            }
            return Network.getIsWifiPoweredOn() ? 'enabled' : 'disabled';
          }
        }

        if (obj === 'general' || obj === 'g' || !obj) {
          const pwr = Network.getIsWifiPoweredOn();
          return [
            'STATE      CONNECTIVITY  WIFI-HW  WIFI     WWAN-HW  WWAN',
            `running    full          enabled  ${pwr ? 'enabled ' : 'disabled'} enabled  disabled`
          ].join('\n');
        }

        return 'Usage: nmcli [general | device wifi [list|connect|rescan] | connection show | radio wifi [on|off]]';
      }

      case 'route': {
        const isNumeric = restArgs.includes('-n');
        const active = Network.getActiveNetwork();
        const wlan = Network.getInterface('wlan0');
        const eth = Network.getInterface('eth0');
        return [
          'Kernel IP routing table',
          'Destination     Gateway         Genmask         Flags Metric Ref    Use Iface',
          `0.0.0.0         ${isNumeric ? wlan.gateway : 'gateway.local'}     0.0.0.0         UG    600    0        0 wlan0`,
          `0.0.0.0         ${isNumeric ? eth.gateway : '10.0.2.2'}        0.0.0.0         UG    100    0        0 eth0`,
          `10.0.2.0        0.0.0.0         255.255.255.0   U     100    0        0 eth0`,
          `192.168.1.0     0.0.0.0         255.255.255.0   U     600    0        0 wlan0`
        ].join('\n');
      }

      case 'arp': {
        const active = Network.getActiveNetwork();
        return [
          'Address                  HWtype  HWaddress           Flags Mask            Iface',
          `192.168.1.1              ether   ${active ? active.bssid : '00:c0:ca:9b:12:4a'}   C                     wlan0`,
          '10.0.2.2                 ether   52:55:0a:00:02:02   C                     eth0'
        ].join('\n');
      }

      case 'rfkill': {
        const sub = restArgs[0] || 'list';
        if (sub === 'block' && restArgs[1] === 'wifi') {
          Network.setWifiPower(false);
          return '';
        }
        if (sub === 'unblock' && restArgs[1] === 'wifi') {
          Network.setWifiPower(true);
          return '';
        }
        const pwr = Network.getIsWifiPoweredOn();
        return [
          '0: phy0: Wireless LAN',
          `\tSoft blocked: ${pwr ? 'no' : 'yes'}`,
          '\tHard blocked: no',
          '1: hci0: Bluetooth',
          '\tSoft blocked: no',
          '\tHard blocked: no'
        ].join('\n');
      }

      case 'macchanger': {
        const iface = restArgs.find(a => !a.startsWith('-')) || 'wlan0';
        const target = iface === 'eth0' ? 'eth0' : 'wlan0';
        const cur = Network.getInterface(target);

        if (restArgs.includes('-r') || restArgs.includes('--random')) {
          Network.updateInterfaceConfig(target, { randomizeMac: true });
          const updated = Network.getInterface(target);
          return `Current MAC:   ${cur.macAddress}\nPermanent MAC: ${cur.hardwareMac}\nNew MAC:       ${updated.macAddress} (Randomized)`;
        }
        if (restArgs.includes('-p') || restArgs.includes('--permanent')) {
          Network.updateInterfaceConfig(target, { randomizeMac: false });
          return `Current MAC:   ${cur.macAddress}\nPermanent MAC: ${cur.hardwareMac}\nReset MAC to permanent address.`;
        }
        return `Current MAC:   ${cur.macAddress}\nPermanent MAC: ${cur.hardwareMac}`;
      }

      case 'ethtool': {
        const iface = restArgs[0] || 'eth0';
        return [
          `Settings for ${iface}:`,
          '    Supported ports: [ TP ]',
          '    Supported link modes:   10baseT/Half 10baseT/Full',
          '                            100baseT/Half 100baseT/Full',
          '                            1000baseT/Full',
          '    Supported pause frame use: No',
          '    Supports auto-negotiation: Yes',
          '    Supported FEC modes: Not reported',
          '    Speed: 1000Mb/s',
          '    Duplex: Full',
          '    Port: Twisted Pair',
          '    PHYAD: 0',
          '    Transceiver: internal',
          '    Auto-negotiation: on',
          '    Link detected: yes'
        ].join('\n');
      }

      case 'nslookup': {
        const host = restArgs.find(a => !a.startsWith('-')) || 'alpinelinux.org';
        const res = await Network.runDnsQuery(host);
        return [
          `Server:\t\t${res.server.split('#')[0]}`,
          `Address:\t${res.server}`,
          '',
          'Non-authoritative answer:',
          `Name:\t${res.host}`,
          ...res.addresses.map(ip => `Address:\t${ip}`)
        ].join('\n');
      }

      case 'dig': {
        const host = restArgs.find(a => !a.startsWith('-')) || 'alpinelinux.org';
        const res = await Network.runDnsQuery(host);
        return [
          `; <<>> DiG 9.18.27 <<>> ${host}`,
          ';; global options: +cmd',
          ';; Got answer:',
          ';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 48201',
          ';; flags: qr rd ra; QUERY: 1, ANSWER: ' + res.addresses.length + ', AUTHORITY: 0, ADDITIONAL: 1',
          '',
          ';; QUESTION SECTION:',
          `;${host}.\t\t\tIN\tA`,
          '',
          ';; ANSWER SECTION:',
          ...res.addresses.map(ip => `${host}.\t\t300\tIN\tA\t${ip}`),
          '',
          `;; Query time: ${res.queryTimeMs} msec`,
          `;; SERVER: ${res.server}`,
          `;; WHEN: ${new Date().toUTCString()}`,
          ';; MSG SIZE  rcvd: 78'
        ].join('\n');
      }

      case 'host': {
        const host = restArgs.find(a => !a.startsWith('-')) || 'alpinelinux.org';
        const res = await Network.runDnsQuery(host);
        return res.addresses.map(ip => `${host} has address ${ip}`).join('\n');
      }

      case 'traceroute':
      case 'tracepath': {
        const target = restArgs.find(a => !a.startsWith('-')) || 'alpinelinux.org';
        const hops = await Network.runTraceroute(target);
        return hops.join('\n');
      }

      case 'netstat':
      case 'ss': {
        return [
          'Active Internet connections (servers and established)',
          'Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program',
          'tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      412/sshd',
          'tcp        0      0 127.0.0.1:9090          0.0.0.0:*               LISTEN      420/helix-rpc',
          `tcp        0      0 ${Network.getInterface('wlan0').ipv4}:22        192.168.1.100:54320     ESTABLISHED 1084/sshd`,
          'udp        0      0 0.0.0.0:68              0.0.0.0:*                           390/udhcpc',
          'udp        0      0 127.0.0.1:53            0.0.0.0:*                           380/dnsmasq'
        ].join('\n');
      }

      case 'ping': {
        const target = restArgs.find(a => !a.startsWith('-')) || '1.1.1.1';
        const count = restArgs.includes('-c') ? parseInt(restArgs[restArgs.indexOf('-c') + 1], 10) || 4 : 4;
        const res = await Network.runPing(target, count);
        return res.output.join('\n');
      }

      case 'curl':
      case 'wget': {
        const url = restArgs.find(a => !a.startsWith('-')) || 'https://alpinelinux.org';
        const isHeaderOnly = restArgs.includes('-I') || restArgs.includes('--head');
        if (isHeaderOnly) {
          return [
            'HTTP/2 200 OK',
            'server: nginx/1.24.0',
            'date: ' + new Date().toUTCString(),
            'content-type: text/html; charset=UTF-8',
            'content-length: 4096',
            'strict-transport-security: max-age=31536000'
          ].join('\n');
        }
        return `Connected to ${url} (port 443)\nHTTP/2 200 OK\ncontent-type: text/html; charset=UTF-8\nserver: Alpine-Edge/1.2\ncontent-length: 4096\n<!DOCTYPE html><html><head><title>Alpine Linux</title></head><body><h1>Welcome to Alpine Linux</h1></body></html>`;
      }

      case 'chmod':
      case 'chown':
        return '';

      case 'kill': {
        if (restArgs.length === 0) return 'kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ...';
        return `Process ${restArgs[0]} terminated.`;
      }

      case 'dmesg': {
        return this.bootLogs.map(l => `[   0.${Math.floor(Math.random() * 900 + 100)}] ${l}`).join('\n');
      }

      case 'rc-status':
      case 'rc-service':
      case 'service': {
        return [
          'Dynamic RunLevel: default',
          ' syslog                                                            [  started  ]',
          ' sshd                                                              [  started  ]',
          ' helix-rpc-bus                                                     [  started  ]',
          ' devfs                                                             [  started  ]',
          ' hostname                                                          [  started  ]',
          ' networking                                                        [  started  ]'
        ].join('\n');
      }

      case 'reboot': {
        this.broadcastTerminal('\nBroadcast message from root@helix-alpine:\nThe system is going down for reboot NOW!\n[ OK ] Stopping system services...\n[ OK ] Unmounting virtio 9p & ext4 filesystems...\n[ OK ] Sending SIGTERM to remaining processes...\n[ OK ] ACPI reset asserted. Rebooting VM...\n');
        setTimeout(() => {
          this.start();
        }, 500);
        return 'System rebooting...';
      }

      case 'poweroff':
      case 'halt':
      case 'shutdown': {
        this.broadcastTerminal('\nBroadcast message from root@helix-alpine:\nThe system is going down for poweroff NOW!\n[ OK ] Stopping syslog and OpenRC daemons...\n[ OK ] Unmounting filesystems...\n[ OK ] Power down.\n');
        setTimeout(() => {
          this.stop();
        }, 400);
        return 'System halted.';
      }

      case 'suspend':
      case 'hibernate': {
        this.setState('suspended');
        this.broadcastTerminal('\n[ OK ] PM: suspend-to-RAM triggered. JIT core throttled to 0 MHz.\n');
        return 'System suspended (type any key or use UI to resume).';
      }

      case 'powerprofilesctl': {
        const sub = restArgs[0];
        const s = Settings.get();
        if (sub === 'get') {
          return s.powerProfile;
        }
        if (sub === 'set') {
          const profile = restArgs[1] as any;
          if (['performance', 'balanced', 'powersave', 'eco'].includes(profile)) {
            Settings.setPowerProfile(profile);
            return `Switched power profile to '${profile}'. CPU governor updated: ${profile === 'performance' ? 'performance' : profile === 'powersave' ? 'powersave' : 'ondemand'}`;
          }
          return 'powerprofilesctl: invalid profile. Choose: performance, balanced, powersave, eco';
        }
        if (sub === 'list' || !sub) {
          const active = s.powerProfile;
          return [
            `${active === 'performance' ? '*' : ' '} performance:`,
            '    Driver:     intel_pstate / helix_power_v6',
            '    Governor:   performance (maximum IPC throughput)',
            '',
            `${active === 'balanced' ? '*' : ' '} balanced:`,
            '    Driver:     intel_pstate / helix_power_v6',
            '    Governor:   ondemand (dynamic clock-scaling)',
            '',
            `${active === 'powersave' ? '*' : ' '} powersave:`,
            '    Driver:     intel_pstate / helix_power_v6',
            '    Governor:   powersave (battery preservation mode)',
            '',
            `${active === 'eco' ? '*' : ' '} eco:`,
            '    Driver:     intel_pstate / helix_power_v6',
            '    Governor:   conservative (ultra low power)'
          ].join('\n');
        }
        return 'Usage: powerprofilesctl [get | set <profile> | list]';
      }

      case 'acpi':
      case 'battery': {
        const hw = Settings.getHardwareInfo();
        const lvl = hw.batteryLevel ?? 98;
        const status = hw.isCharging ? 'Charging' : 'Discharging';
        const remaining = hw.dischargingTime ? `, ${Math.round(hw.dischargingTime / 60)} minutes remaining` : (hw.isCharging ? ', on AC power' : ', ~4h 12m remaining');
        return `Battery 0: ${status}, ${lvl}%${remaining}\nAdapter 0: ${hw.isCharging ? 'on-line' : 'off-line'}`;
      }

      case 'sensors': {
        const s = Settings.get();
        const hw = Settings.getHardwareInfo();
        const baseTemp = s.powerProfile === 'performance' ? 68.5 : s.powerProfile === 'powersave' ? 36.2 : 48.0;
        const cores = s.vmCores || hw.cpuCores || 2;
        const lines = [
          'coretemp-isa-0000',
          'Adapter: ISA adapter',
          `Package id 0:  +${baseTemp.toFixed(1)}°C  (high = +82.0°C, crit = +100.0°C)`
        ];
        for (let i = 0; i < cores; i++) {
          lines.push(`Core ${i}:        +${(baseTemp + (i * 1.5) - 0.8).toFixed(1)}°C  (high = +82.0°C, crit = +100.0°C)`);
        }
        lines.push('');
        lines.push('acpitz-acpi-0');
        lines.push('Adapter: ACPI interface');
        lines.push(`temp1:         +${(baseTemp - 4.0).toFixed(1)}°C  (crit = +105.0°C)`);
        return lines.join('\n');
      }

      case 'tlp':
      case 'tlp-stat': {
        const s = Settings.get();
        const hw = Settings.getHardwareInfo();
        return [
          '--- TLP 1.6.0 --------------------------------------------',
          '+++ System Status',
          'Mode                = ' + (hw.isCharging ? 'AC (Performance Governor)' : 'Battery (Power Saver Active)'),
          'Power Profile       = ' + s.powerProfile,
          'CPU Governor        = ' + s.cpuGovernor,
          'Auto-Dim On Low Bat = ' + (s.autoDimOnLowBattery ? 'Enabled' : 'Disabled'),
          'Battery Synchronized= ' + (s.realDeviceBatterySync ? 'Active (Host Hardware Sensor)' : 'Simulated'),
          'Battery Capacity    = ' + (hw.batteryLevel ?? 98) + '%'
        ].join('\n');
      }

      case 'lscpu': {
        const s = Settings.get();
        const hw = Settings.getHardwareInfo();
        const cores = s.vmCores || hw.cpuCores || 2;
        return [
          'Architecture:                    x86_64',
          'CPU op-mode(s):                  32-bit, 64-bit',
          'Address sizes:                   39 bits physical, 48 bits virtual',
          'Byte Order:                      Little Endian',
          `CPU(s):                          ${cores}`,
          'On-line CPU(s) list:             0-' + (cores - 1),
          'Vendor ID:                       GenuineIntel',
          'Model name:                      Intel(R) Core(TM) Architecture (Helix v86 JIT)',
          'CPU family:                      6',
          'Model:                           158',
          'Thread(s) per core:              1',
          'Core(s) per socket:              ' + cores,
          'Socket(s):                       1',
          'Stepping:                        9',
          'BogoMIPS:                        4800.00',
          'Virtualization:                  VT-x / WebAssembly JIT',
          'Hypervisor vendor:               Helix MicroVM',
          'Virtualization type:             full',
          'L1d cache:                       32 KiB (1 instance)',
          'L1i cache:                       32 KiB (1 instance)',
          'L2 cache:                        256 KiB (1 instance)',
          'L3 cache:                        16 MiB (1 instance)',
          `CPU dynamic governor:            ${s.cpuGovernor}`
        ].join('\n');
      }

      case 'systemctl': {
        const action = restArgs[0];
        const unit = restArgs[1] || '';
        if (action === 'suspend') {
          this.setState('suspended');
          return 'System suspended.';
        }
        if (action === 'status') {
          return `● ${unit || 'system'}.service - Helix System Daemon\n   Loaded: loaded (/etc/init.d/${unit || 'system'})\n   Active: active (running) since boot\n   Tasks: 4 (limit: 512)`;
        }
        return `Executing systemctl ${action} on unit ${unit || 'default'}: OK`;
      }

      case 'free': {
        const isMb = restArgs.includes('-m');
        const isHuman = restArgs.includes('-h');
        if (isHuman) {
          return [
            '              total        used        free      shared  buff/cache   available',
            'Mem:          256Mi        47Mi       182Mi       3.0Mi        27Mi       202Mi',
            'Swap:           0Bi         0Bi         0Bi'
          ].join('\n');
        }
        return [
          '              total        used        free      shared  buff/cache   available',
          'Mem:            256          47         182           3          27         202',
          'Swap:             0           0           0'
        ].join('\n');
      }

      case 'df': {
        return [
          'Filesystem                Size      Used Available Use% Mounted on',
          '/dev/sda1                 2.0G    142.4M      1.8G   7% /',
          'devtmpfs                 10.0M         0     10.0M   0% /dev',
          'shm                     128.0M         0    128.0M   0% /dev/shm',
          'host9p                  500.0M     14.2M    485.8M   3% /mnt/helix'
        ].join('\n');
      }

      case 'ps': {
        return [
          'PID   USER     TIME  COMMAND',
          '    1 root      0:01 /sbin/init',
          '   45 root      0:00 syslogd -n',
          '  120 root      0:00 sshd',
          '  140 root      0:03 helix-rpc-bus',
          '  210 root      0:01 /bin/ash'
        ].join('\n');
      }

      case 'neofetch': {
        const pkgCount = this.installedPkgs.size;
        return [
          '   /\\ /\\       root@helix-alpine',
          '  // \\  \\      -----------------',
          ' //   \\  \\     OS: Alpine Linux v3.20.0 x86_64',
          '///    \\  \\    Host: Helix Virtual Machine (v86 JIT)',
          '//       \\  \\  Kernel: 6.6.14-virt',
          `               Packages: ${pkgCount} (apk)`,
          '               Shell: ash (busybox 1.36.1)',
          '               Terminal: helix-term (xterm-256color)',
          '               CPU: Intel(R) Core(TM) Architecture (1) @ 2.400GHz',
          '               Memory: 47MiB / 256MiB',
          '               Disk: 142.4MiB / 2.0GiB (7%)',
          '               Uptime: ' + Math.floor((Date.now() - this.bootStartTime) / 60000) + ' mins'
        ].join('\n');
      }

      case 'htop':
      case 'top': {
        return [
          ' CPU[||||||||||||||||||||                  23.0%]   Tasks: 5, 1 thr; 1 running',
          ' Mem[||||||||||||||||||||||                47/256MB] Load average: 0.18 0.12 0.05',
          ' Uptime: ' + Math.floor((Date.now() - this.bootStartTime) / 60000) + ' min',
          '',
          ' PID USER      PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  Command',
          '   1 root       20   0  4.2M  1.2M  800K S  0.0  1.6  0:01.12 /sbin/init',
          '  45 root       20   0  1.8M  850K  600K S  0.0  0.7  0:00.34 syslogd -n',
          ' 120 root       20   0  6.4M  2.1M  1.4M S  0.0  2.5  0:00.89 sshd',
          ' 140 root       20   0 14.1M  5.8M  3.2M S  1.2  5.5  0:03.45 helix-rpc-bus',
          ' 210 root       20   0  2.8M  1.1M  890K S  0.1  1.2  0:00.15 /bin/ash'
        ].join('\n');
      }

      case 'python':
      case 'python3': {
        if (restArgs.length === 0) {
          return 'Python 3.11.8 (main, Feb 12 2024, 14:50:00) [GCC 13.2.1 20231014] on linux\nType "help", "copyright", "credits" or "license" for more information.';
        }
        if (restArgs[0] === '--version' || restArgs[0] === '-V') {
          return 'Python 3.11.8';
        }

        let codeToRun: string | null = null;
        let scriptName = 'python_gui.py';

        if (restArgs[0] === '-c' && restArgs[1]) {
          codeToRun = restArgs.slice(1).join(' ');
          scriptName = 'inline_eval.py';
        } else {
          const rawPath = restArgs[0].replace('/mnt/helix', '');
          const normPath = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
          codeToRun = await this.vfs.read(normPath);
          scriptName = restArgs[0].split('/').pop() || 'script.py';
        }

        if (codeToRun !== null) {
          // Detect if script utilizes GUI libraries
          const isGuiCode = /tkinter|tk\.|turtle|PySimpleGUI|psg\.|webview|helix_gui|zenity|geometry\(|mainloop\(/i.test(codeToRun);
          if (isGuiCode) {
            const launchResult = GuiDisplayServer.get().parseAndLaunchPython(codeToRun, scriptName);
            return [
              `[Helix-X11] Virtual display connected on ${GuiDisplayServer.get().displayId}`,
              `[Helix-X11] Initialized native client window in Helix DE`,
              `[Helix-X11] Client PID: ${Math.floor(Math.random() * 3000 + 2000)} | Window ID: ${launchResult.windowId}`,
              `[Helix-X11] Event loop running. Window displayed on desktop.`
            ].join('\n');
          }
          return this.runPythonCode(codeToRun);
        }
        return `python3: can't open file '${restArgs[0]}': [Errno 2] No such file or directory`;
      }

      case 'zenity': {
        const res = GuiDisplayServer.get().launchZenityDialog(restArgs);
        return res.output;
      }

      case 'xmessage': {
        const msg = restArgs.join(' ') || 'X11 Notification';
        const res = GuiDisplayServer.get().launchXMessage(msg);
        return `[X11] Displayed message dialog (Window ID: ${res.windowId})`;
      }

      case 'kdialog': {
        const res = GuiDisplayServer.get().launchZenityDialog(restArgs);
        return res.output;
      }

      case 'helix-gui': {
        const sub = restArgs[0] || 'status';
        if (sub === 'status') {
          return [
            'Helix GUI Display Server Telemetry:',
            `  DISPLAY:          ${GuiDisplayServer.get().displayId}`,
            `  Protocol:         ${GuiDisplayServer.get().protocolVersion}`,
            `  Active Windows:   ${GuiDisplayServer.get().getAllWindows().length}`,
            `  Clients Spawned:  ${GuiDisplayServer.get().totalClientsSpawned}`,
            '  Supported Runtimes: Python Tkinter, Turtle Graphics, PySimpleGUI, WebGUI, Zenity, XMessage'
          ].join('\n');
        }
        if (sub === 'run' && restArgs[1]) {
          const rawPath = restArgs[1].replace('/mnt/helix', '');
          const normPath = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
          const code = await this.vfs.read(normPath);
          if (code !== null) {
            const res = GuiDisplayServer.get().parseAndLaunchPython(code, restArgs[1]);
            return `[Helix-GUI] Successfully launched GUI window in Helix DE (Window ID: ${res.windowId})`;
          }
          return `helix-gui: file not found '${restArgs[1]}'`;
        }
        return 'Usage: helix-gui [status | run <script.py>]';
      }

      case 'rustc':
      case 'cargo': {
        if (restArgs.length === 0 || restArgs[0] === '--version' || restArgs[0] === '-V') {
          return 'rustc 1.76.0 (07dca489a 2024-02-04) (Helix Alpine WASM JIT Target)';
        }
        let fileToRun = restArgs.find((a) => a.endsWith('.rs'));
        let code = '';
        if (fileToRun) {
          const rawPath = fileToRun.replace('/mnt/helix', '');
          const normPath = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
          code = (await this.vfs.read(normPath)) || '';
        } else {
          code = `fn main() {\n    println!("Helix Local Rust WASM Engine Active!");\n}`;
        }
        const res = NativeEngine.executeRust(code);
        return (res.stdout + (res.stderr ? `\n[ERR] ${res.stderr}` : '') + `\n[rustc]: Compiled target in ${res.executionTimeMs}ms (${res.wasmInstructionsCount} WASM instrs)`).trim();
      }

      case 'gcc':
      case 'g++':
      case 'clang':
      case 'clang++':
      case 'cpp': {
        if (restArgs.length === 0 || restArgs[0] === '--version' || restArgs[0] === '-v') {
          return 'g++ (Alpine 13.2.1_git20231014) 13.2.1 20231014\nCopyright (C) 2023 Free Software Foundation, Inc.\nThis is free software; see the source for copying conditions.';
        }
        let fileToRun = restArgs.find((a) => a.endsWith('.cpp') || a.endsWith('.c') || a.endsWith('.cc'));
        let code = '';
        if (fileToRun) {
          const rawPath = fileToRun.replace('/mnt/helix', '');
          const normPath = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
          code = (await this.vfs.read(normPath)) || '';
        } else {
          code = `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Helix Local C++ WASM Engine Active!" << endl;\n    return 0;\n}`;
        }
        const res = NativeEngine.executeCpp(code);
        return (res.stdout + (res.stderr ? `\n[ERR] ${res.stderr}` : '') + `\n[g++ -O3]: Compiled target in ${res.executionTimeMs}ms (${res.memoryUsageKb} KB heap)`).trim();
      }

      case 'node':
      case 'nodejs': {
        if (restArgs.length === 0 || restArgs[0] === '-v' || restArgs[0] === '--version') {
          return 'v20.12.2';
        }
        if (restArgs[0] === '-e' && restArgs[1]) {
          return this.runJsCode(restArgs.slice(1).join(' '));
        }

        const rawPath = restArgs[0].replace('/mnt/helix', '');
        const normPath = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
        const fileContent = await this.vfs.read(normPath);
        if (fileContent !== null) {
          return this.runJsCode(fileContent);
        }
        return `node: internal/modules/cjs/loader:1143\nError: Cannot find module '${restArgs[0]}'`;
      }

      case 'gcc':
      case 'g++': {
        if (restArgs.length === 0 || restArgs[0] === '--version' || restArgs[0] === '-v') {
          return 'gcc (Alpine 13.2.1_git20231014) 13.2.1 20231014\nCopyright (C) 2023 Free Software Foundation, Inc.\nThis is free software; see the source for copying conditions.';
        }
        const fileArg = restArgs.find(a => !a.startsWith('-'));
        if (!fileArg) return 'gcc: fatal error: no input files\ncompilation terminated.';
        const normPath = fileArg.startsWith('/') ? fileArg : '/' + fileArg;
        const content = await this.vfs.read(normPath);
        if (content !== null) {
          await this.vfs.write('/a.out', '#!/bin/sh\n# Compiled binary artifact\n');
          return 'Compilation successful: /mnt/helix/a.out generated.';
        }
        return `gcc: error: ${fileArg}: No such file or directory\ngcc: fatal error: no input files\ncompilation terminated.`;
      }

      case 'git': {
        if (restArgs.length === 0 || restArgs[0] === '--version') {
          return 'git version 2.43.0';
        }
        const sub = restArgs[0];
        if (sub === 'status') {
          const files = await this.vfs.list();
          return [
            'On branch main',
            'Your branch is up to date with \'origin/main\'.',
            '',
            files.length > 0 ? `Tracked files in workspace: ${files.length}` : '',
            'nothing to commit, working tree clean'
          ].filter(Boolean).join('\n');
        }
        if (sub === 'log') {
          return [
            'commit 7a3b4e1 (HEAD -> main, origin/main)',
            'Author: root <root@helix-alpine>',
            'Date:   Thu Sep 17 19:00:00 2026 +0000',
            '',
            '    Initial Alpine Linux 3.20 host image and kernel filesystem bridge',
            '',
            'commit 3e9a1b0',
            'Author: root <root@helix-alpine>',
            'Date:   Wed Sep 16 12:00:00 2026 +0000',
            '',
            '    Bootstrapped Helix OS kernel and native POSIX services'
          ].join('\n');
        }
        if (sub === 'branch') {
          return '* main';
        }
        if (sub === 'add') {
          return '';
        }
        if (sub === 'commit') {
          return '[main 8c2f1a0] ' + (restArgs.slice(1).join(' ') || 'Commit changes') + '\n 1 file changed, 1 insertion(+)';
        }
        return `git: '${sub}' is not a recognized git command.`;
      }

      case 'apk': {
        const sub = restArgs[0];
        if (sub === 'update') {
          return [
            'fetch https://dl-cdn.alpinelinux.org/alpine/v3.20/main/x86_64/APKINDEX.tar.gz',
            'fetch https://dl-cdn.alpinelinux.org/alpine/v3.20/community/x86_64/APKINDEX.tar.gz',
            'v3.20.0-142-g2d0e7a2b0a [https://dl-cdn.alpinelinux.org/alpine/v3.20/main]',
            'v3.20.0-138-g7a3b4e1c2f [https://dl-cdn.alpinelinux.org/alpine/v3.20/community]',
            'OK: 18452 distinct packages available'
          ].join('\n');
        }

        if (sub === 'add') {
          const pkgs = restArgs.slice(1).filter(p => !p.startsWith('-'));
          if (pkgs.length === 0) return 'apk: missing package arguments';

          const lines = [
            '(1/' + pkgs.length + ') Installing ' + pkgs.join(', ') + ' (x86_64)',
            'Executing busybox-1.36.1-r15.trigger',
            'OK: 24 MiB in ' + (this.installedPkgs.size + pkgs.length) + ' packages'
          ];
          for (const p of pkgs) {
            this.installedPkgs.add(p);
          }
          return lines.join('\n');
        }

        if (sub === 'del' || sub === 'delete' || sub === 'remove') {
          const pkgs = restArgs.slice(1).filter(p => !p.startsWith('-'));
          if (pkgs.length === 0) return 'apk: missing package arguments';
          for (const p of pkgs) {
            this.installedPkgs.delete(p);
          }
          return [
            '(1/' + pkgs.length + ') Purging ' + pkgs.join(', ') + ' (x86_64)',
            'Executing busybox-1.36.1-r15.trigger',
            'OK: ' + this.installedPkgs.size + ' packages remain'
          ].join('\n');
        }

        if (sub === 'info') {
          return Array.from(this.installedPkgs).join('\n');
        }

        if (sub === 'search') {
          const query = restArgs[1] || '';
          const sampleRepo = [
            'python3-3.11.8-r0',
            'nodejs-20.12.2-r0',
            'gcc-13.2.1-r0',
            'rust-1.77.2-r0',
            'go-1.22.3-r0',
            'lua5.4-5.4.6-r0',
            'ruby-3.3.1-r0',
            'vim-9.1.0-r0',
            'neovim-0.9.5-r0',
            'curl-8.7.1-r0',
            'wget-1.24.5-r0',
            'git-2.43.0-r0',
            'tmux-3.4-r0',
            'htop-3.3.0-r0',
            'tree-2.1.1-r0',
            'neofetch-7.1.0-r2',
            'nginx-1.26.0-r0',
            'sqlite-3.45.3-r0',
            'postgresql16-16.3-r0'
          ];
          return sampleRepo.filter(p => p.includes(query)).join('\n');
        }

        return 'Alpine Package Keeper v2.14.0\nUsage: apk [options] <add|del|update|info|search> [arguments]';
      }

      case 'cmatrix':
      case 'matrix': {
        return [
          '0 1 0 1 1 0 1 0 0 1 0 1 1 0',
          '1 0 1 0 0 1 0 1 1 0 1 0 0 1',
          '0 0 1 1 0 1 0 0 1 0 1 1 0 1',
          '1 1 0 0 1 0 1 1 0 1 0 0 1 0',
          '[Matrix Stream Executed - Press Ctrl+C or Clear]'
        ].join('\n');
      }

      case 'figlet':
      case 'banner': {
        const text = restArgs.join(' ') || 'HELIX';
        return [
          ` _   _      _ _       `,
          `| | | | ___| (_)_  __ `,
          `| |_| |/ _ \\ | \\ \\/ / `,
          `|  _  |  __/ | |>  <  `,
          `|_| |_|\\___|_|_/_/\\_\\ `,
          `                      `
        ].join('\n');
      }

      case 'sh':
      case 'bash': {
        if (restArgs.length > 0) {
          const rawPath = restArgs[0].replace('/mnt/helix', '');
          const normPath = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
          const content = await this.vfs.read(normPath);
          if (content !== null) {
            const scriptLines = content.split('\n');
            const outputs: string[] = [];
            for (const sLine of scriptLines) {
              const trimmedLine = sLine.trim();
              if (trimmedLine && !trimmedLine.startsWith('#')) {
                const out = await this.executeCommand(trimmedLine);
                if (out) outputs.push(out);
              }
            }
            return outputs.join('\n');
          }
          return `sh: can't open '${restArgs[0]}': No such file or directory`;
        }
        return '';
      }

      default:
        return `sh: ${cmd}: not found`;
    }
  }

  // --- Python & JavaScript Script Runners ---

  private runPythonCode(code: string): string {
    const res = PythonEngine.execute(code);
    if (res.success) {
      return res.stdout || 'Process finished with exit code 0.';
    }
    return [res.stdout, res.stderr].filter(Boolean).join('\n');
  }

  private runJsCode(code: string): string {
    const logs: string[] = [];
    const customConsole = {
      log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      info: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      warn: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      error: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
    };

    try {
      const runner = new Function('console', 'process', code);
      runner(customConsole, { version: 'v20.12.2', platform: 'linux', arch: 'x64' });
      return logs.length > 0 ? logs.join('\n') : 'Process finished with exit code 0.';
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  }

  // --- Internal Wiring ---

  private async rawSerialSend(cmd: string) {
    const emu = getWindowEmulator();
    if (emu && typeof emu.serial0_send === 'function') {
      try {
        emu.serial0_send(cmd);
        return;
      } catch (err) {
        console.warn('serial0_send failed, falling back to direct kernel execution:', err);
      }
    }

    try {
      const output = await this.executeCommand(cmd);
      if (output !== undefined && output !== null) {
        this.handleSerialData(output + '\n');
      }
    } catch (err: any) {
      this.handleSerialData(`RPC Execution Error: ${err?.message || err}\n`);
    }
  }

  public handleSerialData(data: string) {
    const consumedByRpc = this.rpc.handleStream(data);
    if (!consumedByRpc) {
      this.broadcastTerminal(data);
    }
  }

  private setState(newState: VMState) {
    this.state = newState;
    this.stateListeners.forEach(cb => cb(newState));
  }

  private startTelemetryLoop() {
    if (this.telemetryInterval) clearInterval(this.telemetryInterval);
    this.telemetryInterval = setInterval(() => {
      if (this.state !== 'ready') return;
      
      const cpuUsage = Math.min(100, Math.max(3, Math.floor(14 + Math.sin(Date.now() / 1200) * 12 + Math.random() * 8)));
      const ramUsed = 47 + Math.floor(Math.sin(Date.now() / 2500) * 5 + Math.random() * 3);

      const data: TelemetryData = {
        ramUsed,
        ramTotal: 256,
        cpuUsage,
        processes: [
          { pid: 1, cmd: '/sbin/init', mem: '4.2 MB' },
          { pid: 45, cmd: 'syslogd -n', mem: '1.8 MB' },
          { pid: 120, cmd: 'sshd: root@pts/0', mem: '6.4 MB' },
          { pid: 140, cmd: 'helix-rpc-bus', mem: '14.1 MB' },
          { pid: 210, cmd: '/bin/ash', mem: '2.8 MB' },
          { pid: 305, cmd: 'wayland-weston --backend=pixman', mem: '28.5 MB' },
          { pid: 412, cmd: 'helix-gui-compositor', mem: '16.2 MB' },
        ]
      };
      this.telemetryListeners.forEach(cb => cb(data));
    }, 1000);
  }

  // --- Subscriptions ---

  onTerminalData(cb: TerminalCallback) {
    this.termListeners.add(cb);
    return () => { this.termListeners.delete(cb); };
  }

  onTelemetry(cb: TelemetryCallback) {
    this.telemetryListeners.add(cb);
    return () => { this.telemetryListeners.delete(cb); };
  }

  onStateChange(cb: StateCallback) {
    this.stateListeners.add(cb);
    return () => { this.stateListeners.delete(cb); };
  }

  public broadcastTerminal(text: string) {
    this.termListeners.forEach(cb => cb(text));
  }
}
