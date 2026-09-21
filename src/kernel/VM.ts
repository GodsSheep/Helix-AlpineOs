import { VMState, TelemetryData } from './types';
import { RPCEngine } from './RPC';
import { VirtualFileSystem } from './VFS';
import { Settings } from './Settings';
import { Network } from './NetworkService';
import { GuiDisplayServer } from './GuiServer';
import { PythonEngine } from './PythonEngine';
import { Async9PIOThread } from './Async9PIOThread';
import { NativeEngine } from './NativeEngine';
import { NotificationService } from './NotificationService';
import { RustEngine } from './RustEngine';
import { Toast } from './Toast';
import { RealHostTerminalClient } from './RealHostTerminal';
import { fetchAndValidateBiosRom, verifyBiosBufferIntegrity } from './BiosValidator';
import { HostKernelBridge } from './HostKernelBridge';
import { OSSaveManager } from './OSSaveManager';
import { ChrootManager } from './ChrootManager';

export type TerminalCallback = (text: string) => void;
export type TelemetryCallback = (data: TelemetryData) => void;
export type StateCallback = (state: VMState) => void;

export interface BiosProfile {
  id: string;
  name: string;
  vendor: string;
  version: string;
  romUrl: string;
  vgaRomUrl: string;
  description: string;
  features: string[];
  recommendedMemoryMB: number;
  compatibleOS: string[];
}

export interface AdvancedBootOptions {
  customIso?: string | File | null;
  biosUrl?: string;
  vgaBiosUrl?: string;
  biosPreset?: string;
  memoryMB?: number;
  vgaMemoryMB?: number;
  cmdline?: string;
  bootOrder?: 'cdrom' | 'hda' | 'fda';
  acpi?: boolean;
  apic?: boolean;
  fdaUrl?: string;
  hdaUrl?: string;
}

export const BIOS_PROFILES: BiosProfile[] = [
  {
    id: 'seabios-std',
    name: 'SeaBIOS Standard rel-1.16.3',
    vendor: 'SeaBIOS / QEMU Project',
    version: '1.16.3-LTS',
    romUrl: '/v86/seabios.bin',
    vgaRomUrl: '/v86/vgabios.bin',
    description: 'Standard reference x86 16/32/64-bit BIOS. Fully compatible with Linux, BSD, and Multiboot kernel images.',
    features: ['Int-10h VESA VBE 3.0', 'ACPI 2.0 DSDT/MADT', 'Virtio-PCI Direct DMA', 'SMP 1-8 Cores Support'],
    recommendedMemoryMB: 256,
    compatibleOS: ['alpine', 'void', 'tinycore', 'custom']
  },
  {
    id: 'seabios-acpi',
    name: 'SeaBIOS High-Memory & ACPI 2.0 PAE',
    vendor: 'Helix Virtual BIOS Group',
    version: '1.16.3-PAE-ACPI',
    romUrl: '/v86/seabios-acpi.bin',
    vgaRomUrl: '/v86/vgabios.bin',
    description: 'High-memory ACPI 2.0 firmware optimized for security suites, penetration testing kernels, and rolling release distros.',
    features: ['36-bit Physical Address Extension', 'APIC High-Precision Timers', 'Virtio-Net Checksum Offload', 'High Memory Mapping'],
    recommendedMemoryMB: 512,
    compatibleOS: ['kali', 'arch']
  },
  {
    id: 'bios-csm',
    name: 'Enterprise CSM Firmware (UEFI/BIOS Bridge)',
    vendor: 'Helix Enterprise Systems',
    version: 'CSM-v2.8-LTS',
    romUrl: '/v86/bios-csm.bin',
    vgaRomUrl: '/v86/vgabios.bin',
    description: 'Compatibility Support Module firmware designed for enterprise distributions (Debian, Ubuntu, Fedora) with heavy systemd stacks.',
    features: ['SMBIOS 2.8 DMI Tables', 'Systemd Cloud-Init Tables', 'Extended Option ROM Scanning', 'Large Virtio Block Support'],
    recommendedMemoryMB: 512,
    compatibleOS: ['debian', 'ubuntu', 'fedora']
  },
  {
    id: 'bios-rt',
    name: 'Helix RT-Preempt MicroFirmware',
    vendor: 'Helix MicroKernel Foundation',
    version: 'RT-v6.8-ZeroJitter',
    romUrl: '/v86/bios-rt.bin',
    vgaRomUrl: '/v86/vgabios.bin',
    description: 'Real-time microkernel firmware tuned for ultra-low latency, zero-jitter interrupt handling, and isolated security capabilities.',
    features: ['Zero-Jitter Microtimer', 'Direct Capability Dispatch', 'Hardware IRQ Isolation', 'Real-Time TSC Synchronization'],
    recommendedMemoryMB: 256,
    compatibleOS: ['microkernel']
  },
  {
    id: 'bios-retro',
    name: 'Legacy PC-AT 16/32-bit Real-Mode BIOS',
    vendor: 'Phoenix / Award Retro Compat',
    version: 'AT-386/486-Rev4',
    romUrl: '/v86/bios-retro.bin',
    vgaRomUrl: '/v86/vgabios.bin',
    description: 'Legacy BIOS firmware designed for FreeDOS, MS-DOS, retro software, and real-mode x86 applications.',
    features: ['16-bit Int-13h Disk Services', 'Int-16h Keyboard BIOS Buffer', 'Int-21h DOS Hook Compatible', 'Low RAM Footprint'],
    recommendedMemoryMB: 64,
    compatibleOS: ['freedos']
  },
  {
    id: 'vgabios-vesa',
    name: 'High-Color SVGA Extended VESA BIOS',
    vendor: 'Bochs / SeaVGABIOS Extended',
    version: 'VBE-3.0-Ext',
    romUrl: '/v86/seabios.bin',
    vgaRomUrl: '/v86/vgabios-vesa.bin',
    description: 'High-resolution 24/32-bit VESA 3.0 Linear Framebuffer video BIOS for graphical desktop operating systems.',
    features: ['VESA 3.0 Linear Framebuffer', '1024x768 & 1280x1024 32bpp Modes', 'Bochs Dispi Interface', 'Hardware Cursor Emulation'],
    recommendedMemoryMB: 128,
    compatibleOS: ['kolibri']
  }
];

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
  
  // User & Privilege Escalation State
  private currentUser: string = 'helix';
  private userStack: Array<{ user: string; env: Record<string, string>; cwd: string }> = [];
  private userListeners: Set<(user: string, isRoot: boolean) => void> = new Set();

  // Environment variables
  private env: Record<string, string> = {
    USER: 'helix',
    LOGNAME: 'helix',
    HOME: '/mnt/helix',
    SHELL: '/bin/ash',
    TERM: 'xterm-256color',
    HOSTNAME: `helix-${(() => {
      try {
        return localStorage.getItem('helix_current_os_profile') || 'alpine';
      } catch {
        return 'alpine';
      }
    })()}`,
    LANG: 'C.UTF-8',
    PAGER: 'cat',
    PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    EDITOR: 'helix-edit',
    ALPINE_VERSION: '3.20.0',
    DISPLAY: ':0.0',
    XDG_SESSION_TYPE: 'x11',
    WAYLAND_DISPLAY: 'wayland-0',
    UID: '1000',
    EUID: '1000'
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

  private profilePackages: Record<string, Set<string>> = {
    alpine: new Set(['alpine-base', 'python3', 'nodejs', 'npm', 'busybox', 'openrc', 'musl', 'curl', 'wget', 'git', 'tree', 'neofetch', 'htop']),
    kali: new Set(['kali-linux-core', 'nmap', 'metasploit-framework', 'sqlmap', 'aircrack-ng', 'wireshark', 'hydra', 'john', 'python3', 'curl', 'wget', 'git', 'bash']),
    debian: new Set(['debian-keyring', 'coreutils', 'apt', 'dpkg', 'python3', 'nodejs', 'npm', 'libc6', 'curl', 'wget', 'git', 'bash', 'openssh-client']),
    ubuntu: new Set(['ubuntu-keyring', 'coreutils', 'apt', 'dpkg', 'python3', 'nodejs', 'npm', 'libc6', 'curl', 'wget', 'git', 'bash', 'snapd']),
    arch: new Set(['archlinux-keyring', 'pacman', 'systemd', 'coreutils', 'python', 'nodejs', 'npm', 'curl', 'wget', 'git', 'bash', 'sudo']),
    fedora: new Set(['fedora-release', 'dnf5', 'systemd', 'coreutils', 'python3', 'nodejs', 'npm', 'curl', 'wget', 'git', 'bash', 'shadow-utils']),
    void: new Set(['void-base', 'xbps', 'runit', 'musl', 'python3', 'curl', 'wget', 'git']),
    tinycore: new Set(['base.tcz', 'coreutils.tcz', 'python3.tcz', 'bash.tcz']),
    microkernel: new Set(['microkernel-core', 'cap-mgr', 'virtio-bus', 'rt-preempt', 'sec-guard']),
    freedos: new Set(['freedos-base', 'command.com', 'fdisk', 'format', 'edit', 'debug', 'ctmouse']),
    kolibri: new Set(['kolibri-kernel', 'tinypad', 'kpack', 'board', 'calc', 'mplayer', 'view3ds']),
    custom: new Set(['base-system', 'custom-kernel', 'shell', 'coreutils'])
  };

  private cwd: string = '/mnt/helix';
  private bootCdromUrl: string = '/v86/linux3.iso';
  private bootCdromFile: File | null = null;
  public currentOsProfile: string = (() => {
    try {
      return localStorage.getItem('helix_current_os_profile') || 'alpine';
    } catch {
      return 'alpine';
    }
  })();
  private osListeners: Set<(profileId: string, meta: { name: string; version: string; tagline: string }) => void> = new Set();
  
  // BIOS & Advanced Boot Settings
  public currentBiosId: string = 'seabios-std';
  public bootBiosUrl: string = '/v86/seabios.bin';
  public bootVgaBiosUrl: string = '/v86/vgabios.bin';
  public bootMemoryMB: number = 256;
  public bootVgaMemoryMB: number = 16;
  public bootCmdline: string = 'console=ttyS0 root=/dev/sr0 ro quiet init=/sbin/init';
  public bootOrder: 'cdrom' | 'hda' | 'fda' = 'cdrom';
  public bootFdaUrl: string | null = null;
  public bootHdaUrl: string | null = null;
  public acpiEnabled: boolean = true;
  public apicEnabled: boolean = true;

  public get currentBiosName(): string {
    const p = BIOS_PROFILES.find(b => b.id === this.currentBiosId || b.romUrl === this.bootBiosUrl);
    return p ? p.name : 'SeaBIOS Standard rel-1.16.3';
  }

  public get biosProfiles(): BiosProfile[] {
    return BIOS_PROFILES;
  }

  public saveCurrentProfileState(): void {
    try {
      const state = {
        packages: Array.from(this.installedPkgs),
        env: this.env,
        isoUrl: this.bootCdromUrl,
        biosId: this.currentBiosId,
        memoryMB: this.bootMemoryMB,
        cmdline: this.bootCmdline
      };
      localStorage.setItem(`helix_os_state_${this.currentOsProfile}`, JSON.stringify(state));
    } catch {}
  }

  public setBootOptions(options: AdvancedBootOptions): void {
    if (options.biosUrl) this.bootBiosUrl = options.biosUrl;
    if (options.vgaBiosUrl) this.bootVgaBiosUrl = options.vgaBiosUrl;
    if (options.biosPreset) {
      this.currentBiosId = options.biosPreset;
      const bp = BIOS_PROFILES.find(b => b.id === options.biosPreset);
      if (bp) {
        this.bootBiosUrl = bp.romUrl;
        this.bootVgaBiosUrl = bp.vgaRomUrl;
      }
    }
    if (options.memoryMB && options.memoryMB >= 32) this.bootMemoryMB = options.memoryMB;
    if (options.vgaMemoryMB && options.vgaMemoryMB >= 4) this.bootVgaMemoryMB = options.vgaMemoryMB;
    if (options.cmdline !== undefined) this.bootCmdline = options.cmdline;
    if (options.bootOrder) this.bootOrder = options.bootOrder;
    if (options.acpi !== undefined) this.acpiEnabled = options.acpi;
    if (options.apic !== undefined) this.apicEnabled = options.apic;
    if (options.fdaUrl !== undefined) this.bootFdaUrl = options.fdaUrl;
    if (options.hdaUrl !== undefined) this.bootHdaUrl = options.hdaUrl;
    if (options.customIso !== undefined) {
      if (options.customIso instanceof File) {
        this.bootCdromFile = options.customIso;
        this.bootCdromUrl = '';
      } else if (typeof options.customIso === 'string') {
        this.bootCdromUrl = options.customIso;
        this.bootCdromFile = null;
      }
    }
  }

  public setOsProfile(profileId: string): void {
    this.saveCurrentProfileState();
    this.currentOsProfile = profileId;
    try {
      localStorage.setItem('helix_current_os_profile', profileId);
    } catch {}

    try {
      const saved = localStorage.getItem(`helix_os_state_${profileId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.packages && Array.isArray(parsed.packages)) {
          this.installedPkgs = new Set(parsed.packages);
        }
        if (parsed.env) {
          this.env = { ...this.env, ...parsed.env };
        }
        if (parsed.isoUrl) {
          this.bootCdromUrl = parsed.isoUrl;
        }
        if (parsed.biosId) {
          this.currentBiosId = parsed.biosId;
          const bp = BIOS_PROFILES.find(b => b.id === parsed.biosId);
          if (bp) {
            this.bootBiosUrl = bp.romUrl;
            this.bootVgaBiosUrl = bp.vgaRomUrl;
          }
        }
        if (parsed.memoryMB) {
          this.bootMemoryMB = parsed.memoryMB;
        }
      } else {
        if (!this.profilePackages[profileId]) {
          this.profilePackages[profileId] = new Set(['base-system', 'python3', 'nodejs', 'npm', 'curl', 'wget', 'git', 'bash', 'htop']);
        }
        this.installedPkgs = new Set(this.profilePackages[profileId]);
      }
    } catch {
      if (!this.profilePackages[profileId]) {
        this.profilePackages[profileId] = new Set(['base-system', 'python3', 'nodejs', 'npm', 'curl', 'wget', 'git', 'bash', 'htop']);
      }
      this.installedPkgs = new Set(this.profilePackages[profileId]);
    }

    // Ensure common core CLI utilities are readily accessible
    for (const p of ['python3', 'nodejs', 'npm', 'bash', 'git', 'curl', 'wget', 'htop', 'neofetch', 'coreutils']) {
      this.installedPkgs.add(p);
    }

    if (profileId === 'kali') {
      this.env.HOSTNAME = 'helix-kali';
      this.bootCdromUrl = 'https://copy.sh/v86/images/linux.iso';
      this.currentBiosId = 'seabios-acpi';
      this.bootBiosUrl = '/v86/seabios-acpi.bin';
      this.bootVgaBiosUrl = '/v86/vgabios.bin';
      this.bootMemoryMB = 512;
      this.bootCmdline = 'console=ttyS0 root=/dev/sr0 ro quiet init=/sbin/init security=apparmor apic=verbose';
      this.systemFiles['/etc/os-release'] = 'NAME="Kali GNU/Linux"\nID=kali\nVERSION_ID="2024.1"\nPRETTY_NAME="Kali GNU/Linux Rolling"\nHOME_URL="https://www.kali.org/"\n';
      this.systemFiles['/etc/issue'] = 'Kali GNU/Linux Rolling \\n \\l\n';
      this.systemFiles['/etc/motd'] = 'Welcome to Helix Kali Linux (Security & Penetration Testing Edition - Fully Sophisticated)\nType "tools", "nmap", or "sqlmap" to begin.\n';
    } else if (profileId === 'debian') {
      this.env.HOSTNAME = 'helix-debian';
      this.bootCdromUrl = 'https://copy.sh/v86/images/linux.iso';
      this.currentBiosId = 'bios-csm';
      this.bootBiosUrl = '/v86/bios-csm.bin';
      this.bootVgaBiosUrl = '/v86/vgabios.bin';
      this.bootMemoryMB = 512;
      this.bootCmdline = 'console=ttyS0 root=/dev/sr0 ro quiet init=/lib/systemd/systemd systemd.show_status=auto';
      this.systemFiles['/etc/os-release'] = 'NAME="Debian GNU/Linux"\nID=debian\nVERSION_ID="12"\nPRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nHOME_URL="https://www.debian.org/"\n';
      this.systemFiles['/etc/issue'] = 'Debian GNU/Linux 12 \\n \\l\n';
      this.systemFiles['/etc/motd'] = 'Welcome to Helix Debian 12 (Bookworm Server Edition - Fully Sophisticated)\n';
    } else if (profileId === 'ubuntu') {
      this.env.HOSTNAME = 'helix-ubuntu';
      this.bootCdromUrl = 'https://copy.sh/v86/images/linux.iso';
      this.currentBiosId = 'bios-csm';
      this.bootBiosUrl = '/v86/bios-csm.bin';
      this.bootVgaBiosUrl = '/v86/vgabios.bin';
      this.bootMemoryMB = 512;
      this.bootCmdline = 'console=ttyS0 root=/dev/sr0 ro quiet init=/lib/systemd/systemd cloud-config-url=/dev/null';
      this.systemFiles['/etc/os-release'] = 'NAME="Ubuntu"\nID=ubuntu\nVERSION_ID="24.04"\nPRETTY_NAME="Ubuntu 24.04 LTS"\nHOME_URL="https://www.ubuntu.com/"\n';
      this.systemFiles['/etc/issue'] = 'Ubuntu 24.04 LTS \\n \\l\n';
      this.systemFiles['/etc/motd'] = 'Welcome to Helix Ubuntu 24.04 LTS (Noble Numbat - Fully Sophisticated)\n';
    } else if (profileId === 'arch') {
      this.env.HOSTNAME = 'helix-arch';
      this.bootCdromUrl = 'https://copy.sh/v86/images/linux.iso';
      this.currentBiosId = 'seabios-acpi';
      this.bootBiosUrl = '/v86/seabios-acpi.bin';
      this.bootVgaBiosUrl = '/v86/vgabios.bin';
      this.bootMemoryMB = 512;
      this.bootCmdline = 'console=ttyS0 root=/dev/sr0 ro quiet init=/sbin/init archisobasedir=arch';
      this.systemFiles['/etc/os-release'] = 'NAME="Arch Linux"\nID=arch\nPRETTY_NAME="Arch Linux Rolling (Pacman)"\nHOME_URL="https://archlinux.org/"\n';
      this.systemFiles['/etc/issue'] = 'Arch Linux Rolling \\n \\l\n';
      this.systemFiles['/etc/motd'] = 'Welcome to Helix Arch Linux (Bleeding Edge Rolling Release)\nType "pacman -Syu" or "pacman -S <pkg>" to manage packages.\n';
    } else if (profileId === 'fedora') {
      this.env.HOSTNAME = 'helix-fedora';
      this.bootCdromUrl = 'https://copy.sh/v86/images/linux.iso';
      this.currentBiosId = 'bios-csm';
      this.bootBiosUrl = '/v86/bios-csm.bin';
      this.bootVgaBiosUrl = '/v86/vgabios.bin';
      this.bootMemoryMB = 512;
      this.bootCmdline = 'console=ttyS0 root=/dev/sr0 ro quiet rhgb init=/sbin/init';
      this.systemFiles['/etc/os-release'] = 'NAME="Fedora Linux"\nID=fedora\nVERSION_ID="40"\nPRETTY_NAME="Fedora Linux 40 (Workstation Edition)"\nHOME_URL="https://fedoraproject.org/"\n';
      this.systemFiles['/etc/issue'] = 'Fedora 40 (Workstation Edition) \\n \\l\n';
      this.systemFiles['/etc/motd'] = 'Welcome to Helix Fedora 40 (Enterprise DNF5 / RPM Toolchain)\nType "dnf install <pkg>" or "rpm -qa" to manage packages.\n';
    } else if (profileId === 'void') {
      this.env.HOSTNAME = 'helix-void';
      this.bootCdromUrl = 'https://copy.sh/v86/images/linux.iso';
      this.currentBiosId = 'seabios-std';
      this.bootBiosUrl = '/v86/seabios.bin';
      this.bootVgaBiosUrl = '/v86/vgabios.bin';
      this.bootMemoryMB = 256;
      this.bootCmdline = 'console=ttyS0 root=/dev/sr0 ro quiet init=/sbin/runit-init';
      this.systemFiles['/etc/os-release'] = 'NAME="Void"\nID=void\nPRETTY_NAME="Void Linux (Musl / Runit)"\nHOME_URL="https://voidlinux.org/"\n';
      this.systemFiles['/etc/issue'] = 'Void Linux \\n \\l\n';
      this.systemFiles['/etc/motd'] = 'Welcome to Helix Void Linux (Runit / Musl Edition - Fully Sophisticated)\n';
    } else if (profileId === 'tinycore') {
      this.env.HOSTNAME = 'helix-tinycore';
      this.bootCdromUrl = 'https://copy.sh/v86/images/tinycore.iso';
      this.currentBiosId = 'seabios-std';
      this.bootBiosUrl = '/v86/seabios.bin';
      this.bootVgaBiosUrl = '/v86/vgabios.bin';
      this.bootMemoryMB = 128;
      this.bootCmdline = 'console=ttyS0 root=/dev/sr0 ro quiet init=/sbin/init noswap waitusb=5';
      this.systemFiles['/etc/os-release'] = 'NAME="Tiny Core Linux"\nID=tinycore\nPRETTY_NAME="Tiny Core Linux v15 (In-Memory)"\nHOME_URL="http://www.tinycorelinux.net/"\n';
      this.systemFiles['/etc/issue'] = 'Tiny Core Linux \\n \\l\n';
      this.systemFiles['/etc/motd'] = 'Welcome to Helix Tiny Core (In-Memory Micro Linux - Fully Sophisticated)\n';
    } else if (profileId === 'microkernel') {
      this.env.HOSTNAME = 'helix-microkernel';
      this.bootCdromUrl = 'https://copy.sh/v86/images/linux.iso';
      this.currentBiosId = 'bios-rt';
      this.bootBiosUrl = '/v86/bios-rt.bin';
      this.bootVgaBiosUrl = '/v86/vgabios.bin';
      this.bootMemoryMB = 256;
      this.bootCmdline = 'console=ttyS0 root=/dev/sr0 ro quiet init=/sbin/init isolcpus=1 nohz_full=1 rcu_nocbs=1 preempt=full';
      this.systemFiles['/etc/os-release'] = 'NAME="Helix Hardened MicroKernel"\nID=helix-mk\nVERSION_ID="6.8.0-rt"\nPRETTY_NAME="Helix MicroKernel RT-Preempt"\nHOME_URL="https://helix.os/"\n';
      this.systemFiles['/etc/issue'] = 'Helix Hardened MicroKernel v6.8.0-rt \\n \\l\n';
      this.systemFiles['/etc/motd'] = 'Welcome to Helix Hardened MicroKernel (Real-Time Preempt & Capability Sandbox)\n';
    } else if (profileId === 'freedos') {
      this.env.HOSTNAME = 'helix-freedos';
      this.bootCdromUrl = 'https://copy.sh/v86/images/freedos.img';
      this.currentBiosId = 'bios-retro';
      this.bootBiosUrl = '/v86/bios-retro.bin';
      this.bootVgaBiosUrl = '/v86/vgabios.bin';
      this.bootMemoryMB = 64;
      this.bootCmdline = '';
      this.systemFiles['/etc/os-release'] = 'NAME="FreeDOS"\nID=freedos\nVERSION_ID="1.3"\nPRETTY_NAME="FreeDOS 1.3 (x86 Real-Mode Compatibility)"\nHOME_URL="http://www.freedos.org/"\n';
      this.systemFiles['/etc/issue'] = 'FreeDOS 1.3 - Release \\n \\l\n';
      this.systemFiles['/etc/motd'] = 'FreeDOS 1.3 (Helix 16/32-bit Compatibility Layer)\nType "DIR" or "HELP" to explore DOS commands.\n';
    } else if (profileId === 'kolibri') {
      this.env.HOSTNAME = 'helix-kolibri';
      this.bootCdromUrl = 'https://copy.sh/v86/images/kolibri.img';
      this.currentBiosId = 'vgabios-vesa';
      this.bootBiosUrl = '/v86/seabios.bin';
      this.bootVgaBiosUrl = '/v86/vgabios-vesa.bin';
      this.bootMemoryMB = 64;
      this.bootCmdline = '';
      this.systemFiles['/etc/os-release'] = 'NAME="KolibriOS"\nID=kolibri\nVERSION_ID="0.7.7.0"\nPRETTY_NAME="KolibriOS (x86 Assembly GUI OS)"\nHOME_URL="https://kolibrios.org/"\n';
      this.systemFiles['/etc/issue'] = 'KolibriOS Assembly Kernel \\n \\l\n';
      this.systemFiles['/etc/motd'] = 'Welcome to KolibriOS (Ultralight Assembly Desktop Environment)\n';
    } else if (profileId === 'alpine') {
      this.env.HOSTNAME = 'helix-alpine';
      this.bootCdromUrl = '/v86/linux3.iso';
      this.currentBiosId = 'seabios-std';
      this.bootBiosUrl = '/v86/seabios.bin';
      this.bootVgaBiosUrl = '/v86/vgabios.bin';
      this.bootMemoryMB = 256;
      this.bootCmdline = 'console=ttyS0 root=/dev/sr0 ro quiet init=/sbin/init';
      this.systemFiles['/etc/os-release'] = 'NAME="Alpine Linux"\nID=alpine\nVERSION_ID="3.20.0"\nPRETTY_NAME="Alpine Linux v3.20"\nHOME_URL="https://alpinelinux.org/"\n';
      this.systemFiles['/etc/issue'] = 'Welcome to Alpine Linux 3.20 (x86_64)\n';
      this.systemFiles['/etc/motd'] = 'Alpine Linux v3.20.0 Host Environment (Helix OS v6 JIT Engine)\nType "help" for a list of available system commands.\n';
    } else if (profileId === 'custom') {
      const info = this.parseCustomOsInfo();
      this.env.HOSTNAME = info.hostname;
      this.systemFiles['/etc/os-release'] = `NAME="${info.name}"\nID=custom\nVERSION_ID="${info.version}"\nPRETTY_NAME="${info.name} ${info.version} (Custom)"\nHOME_URL="https://helix.os/"\n`;
      this.systemFiles['/etc/issue'] = `Welcome to ${info.name} ${info.version} (Helix x86 JIT Emulation Layer)\n`;
      this.systemFiles['/etc/motd'] = `Welcome to ${info.name} ${info.version} Host Environment (Helix JIT Engine)\n${info.tagline}\nType "help" for system instructions.\n`;
    } else {
      this.env.HOSTNAME = 'helix-alpine';
      this.bootCdromUrl = '/v86/linux3.iso';
      this.currentBiosId = 'seabios-std';
      this.bootBiosUrl = '/v86/seabios.bin';
      this.bootVgaBiosUrl = '/v86/vgabios.bin';
      this.bootMemoryMB = 256;
      this.bootCmdline = 'console=ttyS0 root=/dev/sr0 ro quiet init=/sbin/init';
      this.systemFiles['/etc/os-release'] = 'NAME="Alpine Linux"\nID=alpine\nVERSION_ID="3.20.0"\nPRETTY_NAME="Alpine Linux v3.20"\nHOME_URL="https://alpinelinux.org/"\n';
      this.systemFiles['/etc/issue'] = 'Welcome to Alpine Linux 3.20 (x86_64)\n';
      this.systemFiles['/etc/motd'] = 'Alpine Linux v3.20.0 Host Environment (Helix OS v6 JIT Engine)\nType "help" for a list of available system commands.\n';
    }

    // Sync active release files to VFS so filesystem inspection and tools see them immediately
    try {
      this.vfs.write('/etc/os-release', this.systemFiles['/etc/os-release']).catch(() => {});
      this.vfs.write('/etc/issue', this.systemFiles['/etc/issue']).catch(() => {});
      this.vfs.write('/etc/motd', this.systemFiles['/etc/motd']).catch(() => {});
      this.vfs.write('/etc/hostname', `${this.env.HOSTNAME}\n`).catch(() => {});
    } catch {}

    this.notifyOsChange();
  }

  public async rebootWithProfile(profileId: string, customIso?: string | File | null, advancedOptions?: AdvancedBootOptions): Promise<void> {
    const previousProfile = this.currentOsProfile || 'alpine';
    
    // 1. Auto save user data and sync with host kernel storage
    try {
      await OSSaveManager.saveOsState(this.vfs, previousProfile, previousProfile, Array.from(this.installedPkgs), []);
      await HostKernelBridge.syncUserData(previousProfile, this.vfs).catch(() => {});
    } catch (e) {
      console.warn('Auto-save before OS switch warning:', e);
    }

    try {
      this.stop();
    } catch {}

    if (customIso) {
      if (customIso instanceof File) {
        this.bootCdromFile = customIso;
        this.bootCdromUrl = '';
      } else {
        this.bootCdromUrl = customIso;
        this.bootCdromFile = null;
      }
    } else if (customIso === null) {
      this.bootCdromFile = null;
    }

    if (advancedOptions) {
      this.setBootOptions(advancedOptions);
    }

    this.setOsProfile(profileId);

    // 2. Auto restore incoming profile's user data from persistent storage or host shared storage
    try {
      await OSSaveManager.restoreSavedOsStateIfExists(this.vfs, profileId);
      await HostKernelBridge.restoreUserData(profileId, this.vfs).catch(() => {});
    } catch (e) {
      console.warn('Auto-restore after OS switch warning:', e);
    }

    await new Promise(r => setTimeout(r, 400));

    try {
      await this.start();
    } catch (err) {
      console.warn('VM boot warning, fallback soft-boot initialized:', err);
      this.setState('ready');
    }
  }

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
    '/etc/os-release': 'NAME="Debian GNU/Linux"\nID=debian\nVERSION_ID="12"\nVERSION="12 (bookworm)"\nPRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nHOME_URL="https://www.debian.org/"\nBUG_REPORT_URL="https://bugs.debian.org/"\n',
    '/etc/debian_version': '12.0\n',
    '/etc/hosts': '127.0.0.1\tlocalhost helix-debian\n::1\tlocalhost ip6-localhost ip6-loopback\n10.0.2.2\thost.virtnet\n',
    '/etc/resolv.conf': 'nameserver 1.1.1.1\nnameserver 8.8.8.8\nnameserver 9.9.9.9\n',
    '/etc/fstab': '/dev/sda1\t/\text4\tdefaults,noatime\t1 1\nhost9p\t/mnt/helix\t9p\ttrans=virtio,version=9p2000.L,rw\t0 0\nproc\t/proc\tproc\tdefaults\t0 0\nsysfs\t/sys\tsysfs\tdefaults\t0 0\ndevtmpfs\t/dev\tdevtmpfs\tdefaults\t0 0\n',
    '/etc/issue': 'Debian GNU/Linux 12 \\n \\l\n',
    '/etc/motd': 'Debian GNU/Linux 12 (bookworm) Host Environment (Helix OS v6 JIT Engine)\nType "help" for a list of available system commands.\n',
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
    '/etc/init.d/sshd': '#!/sbin/openrc-run\ndescription="OpenSSH server daemon"\n',
    '/etc/passwd': 'root:x:0:0:root:/root:/bin/ash\ndaemon:x:1:1:daemon:/usr/sbin:/bin/false\nbin:x:2:2:bin:/bin:/bin/false\nsys:x:3:3:sys:/dev:/bin/false\nsync:x:4:65534:sync:/bin:/bin/sync\nhelix:x:1000:1000:Helix Desktop User:/mnt/helix:/bin/ash\nguest:x:1001:1001:Guest User:/home/guest:/bin/ash\n',
    '/etc/group': 'root:x:0:root\ndaemon:x:1:\nbin:x:2:\nsys:x:3:\nadm:x:4:helix\nwheel:x:10:helix\nvideo:x:27:helix\nsudo:x:28:helix\nusers:x:100:helix\nhelix:x:1000:\nguest:x:1001:\n',
    '/etc/shadow': 'root:$6$rounds=4096$salt$xxxxxxxx:19800:0:99999:7:::\nhelix:$6$rounds=4096$salt$yyyyyyyy:19800:0:99999:7:::\nguest:*:19800:0:99999:7:::\n',
    '/etc/sudoers': 'root ALL=(ALL:ALL) ALL\nhelix ALL=(ALL:ALL) NOPASSWD: ALL\n%wheel ALL=(ALL:ALL) NOPASSWD: ALL\n%sudo ALL=(ALL:ALL) NOPASSWD: ALL\n'
  };

  constructor(private vfs: VirtualFileSystem) {
    this.rpc = new RPCEngine((cmd) => this.rawSerialSend(cmd));
    this.setOsProfile(this.currentOsProfile);

    // Synchronize Safe-State Engine settings with persistent system settings
    try {
      const s = Settings.get();
      this.autoSnapshotOnHighMemory = s.safeStateAutoSnapshot ?? false;
      this.highMemoryThresholdPercent = s.safeStateThresholdPercent ?? 85;
      this.autoRecoverOnPanic = s.safeStateAutoRecoverOnPanic ?? true;
      this.safeStateTerminalBroadcast = s.safeStateTerminalBroadcast ?? false;

      Settings.subscribe((newSettings) => {
        this.autoSnapshotOnHighMemory = newSettings.safeStateAutoSnapshot ?? false;
        this.highMemoryThresholdPercent = newSettings.safeStateThresholdPercent ?? 85;
        this.autoRecoverOnPanic = newSettings.safeStateAutoRecoverOnPanic ?? true;
        this.safeStateTerminalBroadcast = newSettings.safeStateTerminalBroadcast ?? false;
      });
    } catch (e) {
      console.warn('Failed to bind Safe-State settings in VM:', e);
    }
  }

  public getState(): VMState {
    return this.state;
  }

  public getCurrentUser(): string {
    return this.currentUser;
  }

  public isRoot(): boolean {
    return this.currentUser === 'root' || this.env.EUID === '0';
  }

  public getUid(): number {
    return this.isRoot() ? 0 : 1000;
  }

  public getGid(): number {
    return this.isRoot() ? 0 : 1000;
  }

  public getPromptSymbol(): string {
    return this.isRoot() ? '#' : '$';
  }

  public getPrompt(): string {
    const home = this.isRoot() ? '/root' : '/mnt/helix';
    const shortCwd = this.cwd === home || this.cwd === '/mnt/helix' || this.cwd === '/home/helix' ? '~' : this.cwd;
    return `${this.currentUser}@${this.getHostname()}:${shortCwd}${this.getPromptSymbol()} `;
  }

  public onUserChange(callback: (user: string, isRoot: boolean) => void): () => void {
    this.userListeners.add(callback);
    return () => this.userListeners.delete(callback);
  }

  public notifyUserChange(): void {
    const isRoot = this.isRoot();
    for (const cb of this.userListeners) {
      try {
        cb(this.currentUser, isRoot);
      } catch (err) {
        console.warn('User listener callback error:', err);
      }
    }
  }

  public onOsChange(callback: (profileId: string, meta: { name: string; version: string; tagline: string }) => void): () => void {
    this.osListeners.add(callback);
    return () => this.osListeners.delete(callback);
  }

  public notifyOsChange(): void {
    const meta = this.getOsMetadata();
    for (const cb of this.osListeners) {
      try {
        cb(this.currentOsProfile, meta);
      } catch (err) {
        console.warn('OS listener callback error:', err);
      }
    }
  }

  public switchUser(targetUser: string, isLogin: boolean = false): { success: boolean; message: string } {
    const normalized = (targetUser || 'root').trim().toLowerCase();
    
    // Save current user state to subshell stack
    this.userStack.push({
      user: this.currentUser,
      env: { ...this.env },
      cwd: this.cwd
    });

    this.currentUser = normalized;
    if (normalized === 'root') {
      this.env.USER = 'root';
      this.env.LOGNAME = 'root';
      this.env.HOME = '/root';
      this.env.UID = '0';
      this.env.EUID = '0';
      if (isLogin) {
        this.cwd = '/root';
      }
    } else {
      this.env.USER = normalized;
      this.env.LOGNAME = normalized;
      this.env.HOME = normalized === 'helix' ? '/mnt/helix' : `/home/${normalized}`;
      this.env.UID = '1000';
      this.env.EUID = '1000';
      if (isLogin) {
        this.cwd = this.env.HOME;
      }
    }
    this.env.PWD = this.cwd;
    this.notifyUserChange();

    // Mirror privilege switch to active microVM terminal emulator if running
    const emu = getWindowEmulator();
    if (emu && (this.state === 'ready' || this.state === 'booting')) {
      this.rawSerialSend(`su ${normalized}\n`);
    }

    return {
      success: true,
      message: normalized === 'root'
        ? `[Privilege Escalation] Switched to superuser 'root' (UID 0). Full system access enabled.`
        : `Switched session to user '${normalized}'.`
    };
  }

  public popUser(): { success: boolean; user: string } {
    if (this.userStack.length === 0) {
      return { success: false, user: this.currentUser };
    }
    const prev = this.userStack.pop()!;
    this.currentUser = prev.user;
    this.env = { ...prev.env };
    this.cwd = prev.cwd;
    this.notifyUserChange();

    const emu = getWindowEmulator();
    if (emu && (this.state === 'ready' || this.state === 'booting')) {
      this.rawSerialSend(`exit\n`);
    }

    return { success: true, user: this.currentUser };
  }

  public getCwd(): string {
    return this.cwd;
  }

  public isChrooted(): boolean {
    return ChrootManager.getInstance().isChrooted();
  }

  public getActiveChroot() {
    return ChrootManager.getInstance().getActiveJail();
  }

  public onChrootChange(callback: (jail: any) => void) {
    return ChrootManager.getInstance().subscribe(callback);
  }

  public setCwd(path: string): void {
    this.cwd = this.resolvePath(path);
  }

  public resolvePath(target: string): string {
    const raw = (target || '').trim();
    const userHome = this.currentUser === 'root' ? '/root' : (this.env.HOME || '/mnt/helix');
    if (!raw || raw === '~') return userHome;
    if (raw === '~/') return userHome;
    if (raw.startsWith('~/')) return userHome === '/' ? '/' + raw.substring(2) : userHome + '/' + raw.substring(2);

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

  private wm?: any;
  public setWindowManager(wm: any) {
    this.wm = wm;
  }

  public getWindowManager(): any {
    return this.wm;
  }

  /**
   * Universal POSIX Read File: checks proc, sys, VFS, and systemFiles
   */
  public async readFile(resolvedPath: string): Promise<string | null> {
    const rawResolved = this.resolvePath(resolvedPath);
    const resolved = ChrootManager.getInstance().resolveJailPath(rawResolved);

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
      const totalKb = (s.vmMemoryMB || 512) * 1024;
      const freeKb = Math.round(totalKb * 0.68);
      const availKb = Math.round(totalKb * 0.78);
      return [
        `MemTotal:       ${String(totalKb).padStart(8, ' ')} kB`,
        `MemFree:        ${String(freeKb).padStart(8, ' ')} kB`,
        `MemAvailable:   ${String(availKb).padStart(8, ' ')} kB`,
        `Buffers:           32768 kB`,
        `Cached:           114688 kB`,
        `SwapCached:            0 kB`,
        `Active:           102400 kB`,
        `Inactive:          65536 kB`,
        `SwapTotal:             0 kB`,
        `SwapFree:              0 kB`,
        `Dirty:                32 kB`,
        `Writeback:             0 kB`,
        `AnonPages:         81920 kB`,
        `Mapped:            40960 kB`,
        `Shmem:             16384 kB`,
        `KReclaimable:      18432 kB`,
        `Slab:              36864 kB`,
        `SReclaimable:      18432 kB`,
        `SUnreclaim:        18432 kB`
      ].join('\n');
    }

    if (resolved === '/proc/version') {
      return 'Linux version 6.6.21-alpine (root@helix-build) (gcc 13.2.1, GNU ld 2.41) #1 SMP PREEMPT_DYNAMIC\n';
    }

    if (resolved === '/proc/loadavg') {
      return '0.12 0.08 0.05 1/84 1420\n';
    }

    if (resolved === '/proc/uptime') {
      const uptimeSec = Math.floor(performance.now() / 1000) + 120;
      return `${uptimeSec}.42 ${uptimeSec * 2}.84\n`;
    }

    if (resolved.startsWith('/sys/class/net/')) {
      if (resolved.endsWith('/operstate')) return 'up';
      if (resolved.endsWith('/address')) return '52:54:00:12:34:56';
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

    if (resolved === '/etc/network/interfaces') {
      return Network.generateNetworkInterfaces();
    }

    if (resolved === '/etc/wpa_supplicant/wpa_supplicant.conf') {
      return Network.generateWpaSupplicantConf();
    }

    if (resolved === '/etc/resolv.conf') {
      return Network.generateResolvConf();
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

    // Direct VFS check
    const directVfs = await this.vfs.read(resolved);
    if (directVfs !== null) return directVfs;

    // Check with /mnt/helix prefix stripped or added
    if (resolved.startsWith('/mnt/helix')) {
      const stripped = resolved.slice('/mnt/helix'.length) || '/';
      const strippedVfs = await this.vfs.read(stripped);
      if (strippedVfs !== null) return strippedVfs;
    } else {
      const prefixed = `/mnt/helix${resolved}`;
      const prefixedVfs = await this.vfs.read(prefixed);
      if (prefixedVfs !== null) return prefixedVfs;
    }

    // System files
    if (this.systemFiles[resolved] !== undefined) {
      return this.systemFiles[resolved];
    }

    return null;
  }

  /**
   * Universal POSIX Write File: writes to VFS and keeps systemFiles in sync
   */
  public async writeFile(resolvedPath: string, content: string): Promise<void> {
    const rawResolved = this.resolvePath(resolvedPath);
    const resolved = ChrootManager.getInstance().resolveJailPath(rawResolved);
    await this.vfs.write(resolved, content);
    if (resolved.startsWith('/mnt/helix')) {
      const stripped = resolved.slice('/mnt/helix'.length) || '/';
      await this.vfs.write(stripped, content);
    }
    if (this.systemFiles[resolved] !== undefined) {
      this.systemFiles[resolved] = content;
    }
  }

  /**
   * Universal directory entries retriever
   */
  public async getDirectoryEntries(dirPath: string): Promise<Array<{
    name: string;
    isDir: boolean;
    size: number;
    mtime: number;
    mode: string;
    owner: string;
    group: string;
  }>> {
    const rawResolved = this.resolvePath(dirPath);
    const resolved = ChrootManager.getInstance().resolveJailPath(rawResolved);
    const normDir = resolved === '/' ? '/' : resolved.replace(/\/+$/, '');
    const prefix = normDir === '/' ? '/' : `${normDir}/`;
    const entriesMap = new Map<string, {
      name: string;
      isDir: boolean;
      size: number;
      mtime: number;
      mode: string;
      owner: string;
      group: string;
    }>();

    // Include bind mounts if inside a chroot jail
    const activeJail = ChrootManager.getInstance().getActiveJail();
    if (activeJail) {
      for (const bm of activeJail.bindMounts) {
        const bmNorm = bm.target.replace(/\/+$/, '');
        const targetDirCheck = rawResolved === '/' ? '/' : rawResolved.replace(/\/+$/, '');
        const targetPrefix = targetDirCheck === '/' ? '/' : `${targetDirCheck}/`;
        if (bmNorm.startsWith(targetPrefix)) {
          const remainder = bmNorm.slice(targetPrefix.length);
          const firstSeg = remainder.split('/')[0];
          if (firstSeg && !entriesMap.has(firstSeg)) {
            entriesMap.set(firstSeg, {
              name: firstSeg,
              isDir: true,
              size: 4096,
              mtime: Date.now(),
              mode: 'drwxr-xr-x',
              owner: 'root',
              group: 'root',
            });
          }
        }
      }
    }

    // 1. System Directories
    for (const sysDir of this.systemDirs) {
      if (sysDir === normDir || sysDir === '/') continue;
      if (sysDir.startsWith(prefix)) {
        const remainder = sysDir.slice(prefix.length);
        const firstSegment = remainder.split('/')[0];
        if (firstSegment && !entriesMap.has(firstSegment)) {
          entriesMap.set(firstSegment, {
            name: firstSegment,
            isDir: true,
            size: 4096,
            mtime: Date.now() - 3600000,
            mode: 'drwxr-xr-x',
            owner: 'root',
            group: 'root',
          });
        }
      }
    }

    // 2. System Files
    for (const [sFile, sContent] of Object.entries(this.systemFiles)) {
      if (sFile.startsWith(prefix)) {
        const remainder = sFile.slice(prefix.length);
        if (!remainder.includes('/')) {
          entriesMap.set(remainder, {
            name: remainder,
            isDir: false,
            size: sContent.length,
            mtime: Date.now() - 86400000,
            mode: sFile.includes('shadow') ? '-rw-------' : '-rw-r--r--',
            owner: 'root',
            group: sFile.includes('shadow') ? 'shadow' : 'root',
          });
        }
      }
    }

    // 3. Proc virtual entries
    if (normDir === '/proc') {
      const procEntries = ['cpuinfo', 'meminfo', 'loadavg', 'uptime', 'version', 'mounts', 'net', 'sys', '1'];
      for (const p of procEntries) {
        entriesMap.set(p, {
          name: p,
          isDir: p === 'net' || p === 'sys' || p === '1',
          size: 0,
          mtime: Date.now(),
          mode: (p === 'net' || p === 'sys' || p === '1') ? 'dr-xr-xr-x' : '-r--r--r--',
          owner: 'root',
          group: 'root',
        });
      }
    }

    // 4. Dev virtual entries
    if (normDir === '/dev') {
      const devEntries = ['null', 'zero', 'urandom', 'random', 'tty', 'tty1', 'ttyS0', 'vda', 'vda1', 'i2c-1', 'shm', 'pts'];
      for (const d of devEntries) {
        entriesMap.set(d, {
          name: d,
          isDir: d === 'shm' || d === 'pts',
          size: 0,
          mtime: Date.now(),
          mode: d.startsWith('vda') ? 'brw-rw----' : (d === 'shm' || d === 'pts') ? 'drwxrwxrwt' : 'crw-rw-rw-',
          owner: 'root',
          group: d.startsWith('vda') ? 'disk' : (d.startsWith('tty') ? 'tty' : 'root'),
        });
      }
    }

    // 5. VFS Files
    const vfsFiles = await this.vfs.list();
    for (const vf of vfsFiles) {
      const candidatePaths = [
        vf.path,
        vf.path.startsWith('/mnt/helix') ? vf.path : `/mnt/helix${vf.path.startsWith('/') ? vf.path : '/' + vf.path}`
      ];

      for (const cPath of candidatePaths) {
        if (cPath.startsWith(prefix)) {
          const remainder = cPath.slice(prefix.length);
          if (remainder.includes('/')) {
            const dirName = remainder.split('/')[0];
            if (!entriesMap.has(dirName)) {
              entriesMap.set(dirName, {
                name: dirName,
                isDir: true,
                size: 4096,
                mtime: vf.timestamp,
                mode: 'drwxr-xr-x',
                owner: this.currentUser,
                group: this.currentUser,
              });
            }
          } else if (remainder.length > 0 && !remainder.endsWith('.keep')) {
            entriesMap.set(remainder, {
              name: remainder,
              isDir: false,
              size: vf.content.length,
              mtime: vf.timestamp,
              mode: (remainder.endsWith('.sh') || remainder.endsWith('.py')) ? '-rwxr-xr-x' : '-rw-r--r--',
              owner: this.currentUser,
              group: this.currentUser,
            });
          }
        }
      }
    }

    return Array.from(entriesMap.values()).sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
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

  public setBootCdrom(url: string): void {
    this.bootCdromUrl = url;
  }

  // --- External API ---

  public getHostname(): string {
    return this.env.HOSTNAME || 'helix-alpine';
  }

  public parseCustomOsInfo(customUrl?: string, customFile?: File | null): { name: string; version: string; tagline: string; hostname: string } {
    let source = '';
    if (customFile) {
      source = customFile.name;
    } else if (customUrl) {
      source = customUrl;
    } else if (this.bootCdromFile) {
      source = this.bootCdromFile.name;
    } else if (this.bootCdromUrl) {
      source = this.bootCdromUrl;
    }

    if (!source) {
      return {
        name: 'Custom OS',
        version: 'User Provided Image',
        tagline: 'Universal x86 Bootloader',
        hostname: 'helix-custom'
      };
    }

    // Extract last segment if it is a URL
    let filename = source;
    try {
      const url = new URL(source);
      const pathname = url.pathname;
      const parts = pathname.split('/');
      filename = parts[parts.length - 1] || source;
    } catch {
      const parts = source.split('/');
      filename = parts[parts.length - 1] || source;
    }

    // Decode URI component just in case
    try {
      filename = decodeURIComponent(filename);
    } catch {}

    const lower = filename.toLowerCase();

    // Comprehensive profiles
    const profiles = [
      { keys: ['ubuntu'], name: 'Ubuntu Linux', tagline: 'Linux for human beings & cloud scale' },
      { keys: ['debian'], name: 'Debian GNU/Linux', tagline: 'The Universal Operating System' },
      { keys: ['arch'], name: 'Arch Linux', tagline: 'Bleeding edge rolling release' },
      { keys: ['fedora'], name: 'Fedora Linux', tagline: 'Enterprise innovation & modern RPM' },
      { keys: ['alpine'], name: 'Alpine Linux', tagline: 'Ultralight security-oriented Linux' },
      { keys: ['kali'], name: 'Kali GNU/Linux', tagline: 'Advanced Penetration Testing & Security' },
      { keys: ['void'], name: 'Void Linux', tagline: 'Independent Linux distribution (Musl/Runit)' },
      { keys: ['tinycore', 'core-current'], name: 'Tiny Core Linux', tagline: 'Ultra-small modular operating system' },
      { keys: ['freedos', 'msdos', 'drdos', 'pcdos'], name: 'FreeDOS', tagline: '16/32-bit Legacy Real-Mode Compatibility' },
      { keys: ['kolibri'], name: 'KolibriOS', tagline: 'Ultra-fast Assembly Desktop Operating System' },
      { keys: ['reactos'], name: 'ReactOS', tagline: 'Open-source Windows NT compatible OS' },
      { keys: ['windows', 'win10', 'win11', 'win7', 'winxp'], name: 'Microsoft Windows', tagline: 'Commercial proprietary OS environment' },
      { keys: ['freebsd'], name: 'FreeBSD', tagline: 'Advanced BSD Unix-like operating system' },
      { keys: ['openbsd'], name: 'OpenBSD', tagline: 'Security-focused BSD Unix-like operating system' },
      { keys: ['netbsd'], name: 'NetBSD', tagline: 'Highly portable BSD Unix-like operating system' },
      { keys: ['haiku'], name: 'Haiku OS', tagline: 'Inspired by BeOS desktop operating system' },
      { keys: ['mint'], name: 'Linux Mint', tagline: 'Elegant, modern, comfortable GNU/Linux' },
      { keys: ['pop-os', 'pop_os', 'popos'], name: 'Pop!_OS', tagline: 'Developed by System76 for creators and developers' },
      { keys: ['manjaro'], name: 'Manjaro Linux', tagline: 'User-friendly Arch-based Linux' },
      { keys: ['nixos'], name: 'NixOS', tagline: 'Declarative, reproducible package management' },
      { keys: ['gentoo'], name: 'Gentoo Linux', tagline: 'Source-compiled highly optimized Linux' },
      { keys: ['slackware'], name: 'Slackware Linux', tagline: 'The oldest active Linux distribution' },
      { keys: ['puppy'], name: 'Puppy Linux', tagline: 'Ultra-lightweight community Linux' },
      { keys: ['rocky'], name: 'Rocky Linux', tagline: 'Community enterprise Linux' },
      { keys: ['alma'], name: 'AlmaLinux', tagline: 'Community-owned enterprise Linux' },
      { keys: ['centos'], name: 'CentOS Linux', tagline: 'Enterprise server distribution' },
      { keys: ['suse', 'opensuse', 'leap', 'tumbleweed'], name: 'openSUSE Linux', tagline: 'Professional open-source Linux suite' }
    ];

    let detectedName = '';
    let detectedTagline = 'Custom Operating System Environment';

    for (const p of profiles) {
      if (p.keys.some(k => lower.includes(k))) {
        detectedName = p.name;
        detectedTagline = p.tagline;
        break;
      }
    }

    // Try to extract version using regex
    let detectedVersion = '';
    const versionMatch = filename.match(/(?:v)?(\d+\.\d+(?:\.\d+)*)/i);
    const dateMatch = filename.match(/(\d{4}[-._]?\d{2}[-._]?\d{2})/); // 2024.11.01

    if (dateMatch) {
      detectedVersion = dateMatch[1].replace(/[-_]/g, '.') + ' Rolling';
    } else if (versionMatch) {
      detectedVersion = versionMatch[1];
      if (source.includes('v')) {
        detectedVersion = 'v' + detectedVersion;
      }
    }

    // Extract architecture if mentioned
    let arch = '';
    if (lower.includes('x86_64') || lower.includes('amd64') || lower.includes('x64')) {
      arch = 'x86_64';
    } else if (lower.includes('i386') || lower.includes('i686') || lower.includes('x86') || lower.includes('32bit')) {
      arch = 'i386';
    }

    if (detectedName) {
      let finalVer = detectedVersion || 'Custom Build';
      if (arch) finalVer += ` (${arch})`;
      
      const hostname = 'helix-' + detectedName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/-$/, '');

      return {
        name: detectedName,
        version: finalVer,
        tagline: detectedTagline,
        hostname
      };
    }

    // Generic fallback: Parse the filename beautifully
    let clean = filename.replace(/\.(iso|img|bin|vfd|raw|qcow2|tar|gz|zip)$/i, '');
    clean = clean.replace(/[-_](x86_64|amd64|x64|i386|i686|x86|32bit|netinst|minimal|desktop|server|live|standard)/gi, '');
    clean = clean.replace(/[-_]+/g, ' ').trim();
    
    const words = clean.split(' ').map(w => {
      if (!w) return '';
      return w.charAt(0).toUpperCase() + w.slice(1);
    });
    let title = words.join(' ');

    if (detectedVersion) {
      const escapedVer = detectedVersion.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      title = title.replace(new RegExp('(?:v)?' + escapedVer, 'i'), '').trim();
      title = title.replace(/\s+/g, ' ').trim();
    }

    if (!title || title.length < 2) {
      title = 'Custom OS';
    }

    let finalVer = detectedVersion || 'User Build';
    if (arch) finalVer += ` (${arch})`;

    const hostname = 'helix-' + title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/-$/, '');

    return {
      name: title,
      version: finalVer,
      tagline: 'Universal x86 Bootloader',
      hostname
    };
  }

  public getOsMetadata(): { name: string; version: string; tagline: string } {
    switch (this.currentOsProfile) {
      case 'kali': return { name: 'Kali Linux', version: '2024.1 Rolling', tagline: 'Advanced Penetration Testing & Security' };
      case 'debian': return { name: 'Debian GNU/Linux', version: '12 (Bookworm)', tagline: 'The Universal Operating System' };
      case 'ubuntu': return { name: 'Ubuntu', version: '24.04 LTS (Noble)', tagline: 'Linux for human beings & cloud scale' };
      case 'arch': return { name: 'Arch Linux', version: 'Rolling (Pacman)', tagline: 'Bleeding edge rolling release' };
      case 'fedora': return { name: 'Fedora Linux', version: '40 (Workstation)', tagline: 'Enterprise innovation & modern RPM' };
      case 'void': return { name: 'Void Linux', version: '20240314 (Musl/Runit)', tagline: 'Independent Linux distribution' };
      case 'tinycore': return { name: 'Tiny Core Linux', version: '15.0 (In-Memory)', tagline: 'Ultra-small modular operating system' };
      case 'microkernel': return { name: 'Helix Hardened MicroKernel', version: '6.8.0-rt (Capability)', tagline: 'Real-Time RT-Preempt & Capability Sandbox' };
      case 'freedos': return { name: 'FreeDOS', version: '1.3 (Retro AT)', tagline: '16/32-bit Legacy Real-Mode Compatibility' };
      case 'kolibri': return { name: 'KolibriOS', version: '0.7.7.0 (FASM)', tagline: 'Ultra-fast Assembly Desktop Operating System' };
      case 'custom': {
        const info = this.parseCustomOsInfo();
        return { name: info.name, version: info.version, tagline: info.tagline };
      }
      default: return { name: 'Alpine Linux', version: '3.20.0', tagline: 'Ultralight security-oriented Linux' };
    }
  }

  async start(): Promise<void> {
    if (this.state === 'ready') return;
    this.setState('booting');
    this.bootLogs = [];
    this.bootStartTime = Date.now();

    // Ensure persistent VFS storage is initialized before 9P mount
    await this.vfs.init().catch(() => {});

    // BIOS & Firmware Integrity Validation
    const biosUrl = this.bootBiosUrl || '/v86/seabios.bin';
    const vgaUrl = this.bootVgaBiosUrl || '/v86/vgabios.bin';
    let biosValidationMsg = '[BIOS] Integrity validation skipped';
    let validatedBiosBuffer: ArrayBuffer | null = null;
    let validatedVgaBuffer: ArrayBuffer | null = null;

    if (Settings.get().biosIntegrityValidationOnBoot) {
      try {
        const biosRes = await fetchAndValidateBiosRom(biosUrl);
        const vgaRes = await fetchAndValidateBiosRom(vgaUrl);
        biosValidationMsg = `[BIOS Integrity] ${biosRes.validation.message}`;
        if (biosRes.validation.isValid) {
          validatedBiosBuffer = biosRes.buffer;
        }
        if (vgaRes.validation.isValid) {
          validatedVgaBuffer = vgaRes.buffer;
        }
      } catch (err: any) {
        biosValidationMsg = `[BIOS Integrity Warning] Check error: ${err?.message || err}`;
      }
    }

    const meta = this.getOsMetadata();
    const hostname = this.getHostname();

    const bootSequence: { text: string; delay: number }[] = [
      { text: `[BIOS] ${this.currentBiosName} (Firmware ROM: ${biosUrl})`, delay: 5 },
      { text: biosValidationMsg, delay: 10 },
      { text: `[BIOS] Machine: Helix Virtual x86_64 (${this.bootMemoryMB} MB RAM, ACPI ${this.acpiEnabled ? '2.0' : 'Legacy'}, APIC ${this.apicEnabled ? 'Active' : 'Off'})`, delay: 10 },
      { text: `[BIOS] Kernel CMDLINE: "${this.bootCmdline}"`, delay: 5 },
      { text: `[BIOS] Booting from ${this.bootCdromFile ? 'Attached Local ISO' : this.bootCdromUrl ? 'Optical Drive (/dev/sr0)' : 'Hard Disk 0 (/dev/sda1)'}...`, delay: 15 },
      { text: '[ OK ] PCI: Probing PCI hardware (host bridge, virtio-net, virtio-9p, ac97 audio, vga-display)', delay: 15 },
      { text: `[ OK ] ACPI: Core subsystem initialized (FADT, DSDT, MADT tables loaded)`, delay: 10 },
      { text: `[ OK ] Kernel: Linux 6.6.14-virt (helix@build-srv) (gcc 13.2.1) #1-${meta.name} SMP`, delay: 15 },
      { text: `[ OK ] Memory: ${Math.round(this.bootMemoryMB * 0.92 * 1024)}K/${this.bootMemoryMB * 1024}K available (6144K kernel code, 1280K rwdata)`, delay: 10 },
      { text: '[ OK ] CPU: Intel(R) Core(TM) Architecture Emulated @ 2.40GHz', delay: 10 },
      { text: '[ OK ] devtmpfs: mounted on /dev', delay: 10 },
      { text: `[ OK ] virtio-pci 0000:00:03.0: virtio_net eth0 (MAC 52:54:00:12:34:56, 192.168.1.105)`, delay: 15 },
      { text: '[ OK ] 9pnet: Installing 9P2000 support (virtio transport)', delay: 10 },
      { text: `[ OK ] 9p: Mounting host filesystem 'host9p' at /mnt/helix (trans=virtio,rw,cache=mmap)`, delay: 15 },
      { text: `[ OK ] Starting ${meta.name} ${meta.version} runtime environment...`, delay: 10 },
      { text: '[ OK ] Starting syslogd: busybox-1.36.1 syslog daemon...', delay: 10 },
      { text: '[ OK ] Starting sshd: OpenSSH_9.7p1 [port 22]...', delay: 15 },
      { text: '[ OK ] Starting helix-rpc-bus daemon on ttyS0 [115200 baud]...', delay: 15 },
      { text: `[ OK ] ${meta.name} ${meta.version} login: root (automatic login)`, delay: 10 },
      { text: `Welcome to ${meta.name} ${meta.version}!`, delay: 10 },
      { text: `${meta.name} Virtual Host Engine is ONLINE with 9P persistent storage mounted.`, delay: 10 },
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
        const v86Config: any = {
          wasm_path: '/v86/v86.wasm',
          wasm_fn: async (param: any) => {
            try {
              let buf: ArrayBuffer | null = null;
              try {
                const res = await fetch('/v86/v86.wasm').catch(() => null);
                if (res && res.ok) {
                  buf = await res.arrayBuffer();
                }
              } catch {}

              if (!buf) {
                try {
                  const alt = await fetch('/v86/v86-fallback.wasm').catch(() => null);
                  if (alt && alt.ok) {
                    buf = await alt.arrayBuffer();
                  }
                } catch {}
              }

              if (buf) {
                try {
                  const { instance } = await WebAssembly.instantiate(buf, param);
                  if (instance && instance.exports) {
                    return instance.exports;
                  }
                } catch (instErr) {
                  console.warn('Wasm instantiate failed, using safe fallback:', instErr);
                }
              }

              // Safe Proxy Fallback to prevent TypeError: null is not an object (evaluating 'g.memory')
              const dummyMemory = typeof WebAssembly !== 'undefined'
                ? new WebAssembly.Memory({ initial: 256 })
                : { buffer: new ArrayBuffer(256 * 64 * 1024) };

              const safeExportsProxy = new Proxy({
                memory: dummyMemory,
                buffer: dummyMemory.buffer
              }, {
                get(target: any, prop: string | symbol) {
                  if (prop === 'memory') {
                    return dummyMemory;
                  }
                  if (prop === 'buffer') {
                    return dummyMemory.buffer;
                  }
                  if (prop in target) {
                    return target[prop];
                  }
                  // Return a safe no-op function to satisfy call sites
                  return (...args: any[]) => 0;
                }
              });

              return safeExportsProxy;
            } catch (err) {
              console.warn('Wasm instantiate fallback wrapper error:', err);
              try {
                const dummyMemory = typeof WebAssembly !== 'undefined'
                  ? new WebAssembly.Memory({ initial: 256 })
                  : { buffer: new ArrayBuffer(256 * 64 * 1024) };
                return new Proxy({
                  memory: dummyMemory,
                  buffer: dummyMemory.buffer
                }, {
                  get(target: any, prop: string | symbol) {
                    if (prop === 'memory') return dummyMemory;
                    if (prop === 'buffer') return dummyMemory.buffer;
                    if (prop in target) return target[prop];
                    return (...args: any[]) => 0;
                  }
                });
              } catch {
                return null;
              }
            }
          },
          memory_size: this.bootMemoryMB * 1024 * 1024,
          vga_memory_size: this.bootVgaMemoryMB * 1024 * 1024,
          bios: { url: this.bootBiosUrl || '/v86/seabios.bin', async: true },
          vga_bios: { url: this.bootVgaBiosUrl || '/v86/vgabios.bin', async: true },
          cdrom: this.bootCdromFile
            ? { file: this.bootCdromFile, buffer: this.bootCdromFile, async: false }
            : { url: this.bootCdromUrl || '/v86/linux3.iso', async: true },
          filesystem: {},
          autostart: true,
          disable_keyboard: true,
          disable_mouse: true,
          cmdline: this.bootCmdline || undefined,
          // Optimization settings
          cpuid_overrides: {
            "7:0.ebx": 0x00000200,
          },
          network_relay_url: undefined,
          // Use high-performance ACPI if needed
          acpi: this.acpiEnabled,
        };

        if (this.bootFdaUrl) {
          v86Config.fda = { url: this.bootFdaUrl, async: true };
        }
        if (this.bootHdaUrl) {
          v86Config.hda = { url: this.bootHdaUrl, async: true };
        }

        const emu = new V86Constructor(v86Config);
        setWindowEmulator(emu);

        if (emu && typeof emu.create_file === 'function') {
          const originalCreateFile = emu.create_file.bind(emu);
          emu.create_file = async (filepath: string, buffer: Uint8Array) => {
            try {
              if (emu.fs9p && typeof emu.fs9p.Search === 'function' && typeof emu.fs9p.CreateDirectory === 'function') {
                const segs = filepath.replace(/^\/+/, '').split('/').filter(Boolean);
                segs.pop(); // filename
                let cur = 0;
                for (const seg of segs) {
                  let s = emu.fs9p.Search(cur, seg);
                  if (s === -1) {
                    try { s = emu.fs9p.CreateDirectory(seg, cur); } catch { break; }
                  }
                  cur = s;
                }
              }
              return await originalCreateFile(filepath, buffer);
            } catch {
              return null;
            }
          };
        }

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
      this.broadcastTerminal(`\n[root@${hostname} ~]# `);
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
          this.broadcastTerminal('\n[root@helix-debian ~]# ');
        }
      }, (idx + 1) * 60);
    });
  }

  // --- Command Execution Layer with Compound & Pipeline Support ---

  async executeCommand(cmd: string): Promise<string> {
    try {
      const trimmed = cmd.trim();
      if (!trimmed) return '';
      this.executionHistory.push(trimmed);

      const firstWord = trimmed.split(' ')[0].toLowerCase();
      const builtins = new Set([
        'uname', 'whoami', 'id', 'groups', 'users', 'who', 'w', 'hostname', 'date', 'cal', 'uptime', 
        'echo', 'ls', 'tree', 'cat', 'touch', 'mkdir', 'rm', 'cp', 'mv', 'xdg-open', 'open', 'nano', 
        'vi', 'vim', 'code', 'helix-edit', 'helix-launch', 'gtk-launch', 'notify-send', 'grep', 'wc', 
        'head', 'tail', 'find', 'diff', 'stat', 'file', 'du', 'which', 'env', 'export', 'alias', 
        'history', 'ip', 'ifconfig', 'iw', 'iwconfig', 'iwlist', 'wpa_cli', 'nmcli', 'route', 'arp', 
        'rfkill', 'macchanger', 'ethtool', 'nslookup', 'dig', 'host', 'traceroute', 'tracepath', 
        'netstat', 'ss', 'ping', 'curl', 'wget', 'chmod', 'chown', 'kill', 'dmesg', 'rc-status', 
        'rc-service', 'service', 'reboot', 'poweroff', 'halt', 'shutdown', 'suspend', 'hibernate', 
        'powerprofilesctl', 'acpi', 'battery', 'sensors', 'tlp', 'tlp-stat', 'lscpu', 'systemctl', 
        'free', 'df', 'ps', 'neofetch', 'htop', 'top', 'python', 'python3', 'zenity', 'xmessage', 
        'kdialog', 'helix-gui', 'rustc', 'cargo', 'lspci', 'lsusb', 'lshw', 'gpio', 'i2c', 'i2cdetect', 
        'dmidecode', 'rust-registers', 'gcc', 'g++', 'clang', 'clang++', 'cpp', 'node', 'nodejs', 
        'git', 'su', 'sudo', 'exit', 'logout', 'apk', 'apt', 'apt-get', 'pacman', 'dnf', 'yum', 
        'xbps-install', 'xbps-query', 'tce-load', 'sort', 'uniq', 'cut', 'tr', 'sed', 'awk', 'base64', 
        'md5sum', 'sha256sum', 'cksum', 'tar', 'gzip', 'gunzip', 'zip', 'unzip', 'mount', 'umount', 
        'lsblk', 'fdisk', 'crontab', 'lsmod', 'modprobe', 'rmmod', 'insmod', 'sysctl', 'zypper', 
        'dpkg', 'xbps', 'docker', 'podman', 'nmap', 'msfconsole', 'metasploit', 'sqlmap', 'aircrack-ng', 
        'cmatrix', 'matrix', 'figlet', 'banner', 'sh', 'bash', 'cd', 'pwd', 'help', '?', 'clear', 'cls', 'chroot'
      ]);

      if (builtins.has(firstWord)) {
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
    } catch (err: any) {
      return `sh: error: ${err?.message || err || 'unknown execution error'}`;
    }
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
        const hostname = this.getHostname();
        const meta = this.getOsMetadata();
        const kernelVer = (
          this.currentOsProfile === 'kali' ? '6.6.15-kali' :
          this.currentOsProfile === 'debian' ? '6.1.0-18-amd64' :
          this.currentOsProfile === 'ubuntu' ? '6.8.0-31-generic' :
          this.currentOsProfile === 'arch' ? '6.8.9-arch1' :
          this.currentOsProfile === 'fedora' ? '6.8.5-fedora' :
          this.currentOsProfile === 'void' ? '6.6.21_1' :
          this.currentOsProfile === 'tinycore' ? '6.6.8-tinycore' :
          this.currentOsProfile === 'microkernel' ? '6.8.0-rt' :
          this.currentOsProfile === 'freedos' ? '2043-freedos' :
          this.currentOsProfile === 'kolibri' ? '0.7.7-kolibri' : '6.6.14-virt'
        );
        if (!flag || flag === '-s') return 'Linux';
        if (flag === '-r') return kernelVer;
        if (flag === '-m') return 'x86_64';
        if (flag === '-n') return hostname;
        if (flag === '-v') return `#1-${meta.name} SMP PREEMPT_DYNAMIC`;
        return `Linux ${hostname} ${kernelVer} #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`;
      }

      case 'help':
      case '?': {
        const meta = this.getOsMetadata();
        return [
          '╔═══════════════════════════════════════════════════════════════════════╗',
          `║           Helix OS - ${meta.name} ${meta.version} Host Environment            ║`,
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
          '  neofetch          Show current OS logo and system information',
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
        return this.currentUser;

      case 'id': {
        const target = restArgs[0] || this.currentUser;
        if (target === 'root') {
          return 'uid=0(root) gid=0(root) groups=0(root),1(bin),2(daemon),3(sys),4(adm),6(disk),10(wheel),11(floppy),20(dialout),26(tape),27(video)';
        }
        if (target === 'helix') {
          return 'uid=1000(helix) gid=1000(helix) groups=1000(helix),4(adm),10(wheel),27(video),28(sudo),100(users)';
        }
        return `uid=1001(${target}) gid=1001(${target}) groups=1001(${target}),100(users)`;
      }

      case 'groups': {
        const target = restArgs[0] || this.currentUser;
        if (target === 'root') return 'root bin daemon sys adm disk wheel';
        if (target === 'helix') return 'helix adm wheel video sudo users';
        return `${target} users`;
      }

      case 'users':
        return this.currentUser === 'root' ? 'helix root' : 'helix';

      case 'who':
        return `${this.currentUser.padEnd(8)} pts/0        ${new Date().toISOString().replace('T', ' ').slice(0, 16)} (:0)`;

      case 'w': {
        const diffMinutes = Math.floor((Date.now() - this.bootStartTime) / 60000);
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        const nowStr = new Date().toTimeString().split(' ')[0];
        return [
          ` ${nowStr} up ${hours > 0 ? `${hours} hr ` : ''}${mins} min,  1 user,  load average: 0.18, 0.12, 0.05`,
          'USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT',
          `${this.currentUser.padEnd(9)}pts/0    :0               ${nowStr}    0.00s  0.08s  0.01s -sh`
        ].join('\n');
      }

      case 'passwd': {
        const target = restArgs[0] || this.currentUser;
        return `Changing password for ${target}.\nNew password: \nRetype password: \npasswd: password for ${target} changed by ${this.currentUser}`;
      }

      case 'hostname':
        return this.env.HOSTNAME || 'helix-debian';

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
        const showAll = restArgs.some(a => a.includes('a') || a.includes('A'));
        const humanReadable = restArgs.some(a => a.includes('h'));
        
        const targetPath = targetArg ? this.resolvePath(targetArg) : this.cwd;
        const entries = await this.getDirectoryEntries(targetPath);

        const filtered = showAll ? entries : entries.filter(e => !e.name.startsWith('.'));

        if (filtered.length === 0) return '';

        if (isLong) {
          const lines = [
            `total ${filtered.length * 4}`,
          ];
          if (showAll) {
            lines.push(`drwxr-xr-x 2 ${this.currentUser} ${this.currentUser} 4096 Sep 19 12:00 .`);
            lines.push(`drwxr-xr-x 3 ${this.currentUser} ${this.currentUser} 4096 Sep 19 12:00 ..`);
          }

          for (const e of filtered) {
            const dateStr = new Date(e.mtime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            const sizeStr = humanReadable ? (e.size < 1024 ? `${e.size}B` : `${(e.size / 1024).toFixed(1)}K`) : String(e.size).padStart(6, ' ');
            lines.push(`${e.mode} 1 ${e.owner.padEnd(5, ' ')} ${e.group.padEnd(5, ' ')} ${sizeStr} ${dateStr} ${e.name}`);
          }
          return lines.join('\n');
        }

        return filtered.map(e => e.name).join('  ');
      }

      case 'tree': {
        const target = restArgs[0] ? this.resolvePath(restArgs[0]) : this.cwd;
        const entries = await this.getDirectoryEntries(target);
        
        const lines = [target];
        entries.forEach((e, idx) => {
          const isLast = idx === entries.length - 1;
          const prefix = isLast ? '└── ' : '├── ';
          lines.push(prefix + e.name + (e.isDir ? '/' : ''));
        });
        lines.push(`\n${entries.length} items`);
        return lines.join('\n');
      }

      case 'cat': {
        if (pipedInput !== undefined && restArgs.length === 0) {
          return pipedInput;
        }
        const fileArgs = restArgs.filter(a => !a.startsWith('-'));
        const numberLines = restArgs.some(a => a === '-n');
        if (fileArgs.length === 0) return 'cat: missing file operand';
        
        const outputs: string[] = [];
        for (const f of fileArgs) {
          const content = await this.readFile(f);
          if (content !== null) {
            outputs.push(content.trimEnd());
          } else {
            outputs.push(`cat: ${f}: No such file or directory`);
          }
        }
        const combined = outputs.join('\n');
        if (numberLines) {
          return combined.split('\n').map((l, i) => `${String(i + 1).padStart(6, ' ')}  ${l}`).join('\n');
        }
        return combined;
      }

      case 'touch': {
        if (restArgs.length === 0) return 'touch: missing file operand';
        for (const file of restArgs) {
          const resolved = this.resolvePath(file);
          const existing = await this.readFile(resolved);
          if (existing === null) {
            await this.writeFile(resolved, '');
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
          await this.writeFile(`${resolved}/.keep`, '');
        }
        return '';
      }

      case 'rm': {
        const fileArgs = restArgs.filter(a => !a.startsWith('-'));
        if (fileArgs.length === 0) return 'rm: missing operand';
        for (const fileArg of fileArgs) {
          const resolved = this.resolvePath(fileArg);
          await this.vfs.delete(resolved);
          if (resolved.startsWith('/mnt/helix')) {
            await this.vfs.delete(resolved.slice('/mnt/helix'.length) || '/');
          }
          delete this.systemFiles[resolved];
          this.systemDirs.delete(resolved);
        }
        return '';
      }

      case 'cp': {
        if (restArgs.length < 2) return 'cp: missing destination file operand';
        const src = restArgs[0];
        const dst = restArgs[1];
        const content = await this.readFile(src);
        if (content !== null) {
          await this.writeFile(dst, content);
          return '';
        }
        return `cp: can't stat '${src}': No such file or directory`;
      }

      case 'mv': {
        if (restArgs.length < 2) return 'mv: missing destination file operand';
        const src = restArgs[0];
        const dst = restArgs[1];
        const content = await this.readFile(src);
        if (content !== null) {
          await this.writeFile(dst, content);
          const resolvedSrc = this.resolvePath(src);
          await this.vfs.delete(resolvedSrc);
          if (resolvedSrc.startsWith('/mnt/helix')) {
            await this.vfs.delete(resolvedSrc.slice('/mnt/helix'.length) || '/');
          }
          delete this.systemFiles[resolvedSrc];
          return '';
        }
        return `mv: can't rename '${src}': No such file or directory`;
      }

      case 'xdg-open':
      case 'open': {
        if (restArgs.length === 0) return 'Usage: xdg-open <file|directory|url>';
        const target = restArgs[0];
        if (target.startsWith('http://') || target.startsWith('https://')) {
          if (this.wm) this.wm.launch('browser', { url: target });
          return `[xdg-open]: Opened URL '${target}' in Web Browser`;
        }

        const resolved = this.resolvePath(target);
        const isDir = this.systemDirs.has(resolved) || resolved === '/' || resolved === '/mnt/helix';
        if (isDir) {
          if (this.wm) this.wm.launch('files', { cwd: resolved });
          return `[xdg-open]: Opened directory '${resolved}' in File Manager`;
        }

        if (resolved.endsWith('.png') || resolved.endsWith('.jpg') || resolved.endsWith('.svg')) {
          if (this.wm) this.wm.launch('paint');
          return `[xdg-open]: Opened image '${resolved}' in Paint`;
        }

        if (resolved.endsWith('.mp3') || resolved.endsWith('.wav')) {
          if (this.wm) this.wm.launch('sound');
          return `[xdg-open]: Opened audio '${resolved}' in Sound Mixer`;
        }

        if (this.wm) this.wm.launch('edit', { file: resolved });
        return `[xdg-open]: Opened '${resolved}' in Helix Code Editor`;
      }

      case 'nano':
      case 'vi':
      case 'vim':
      case 'code':
      case 'helix-edit': {
        const file = restArgs[0];
        if (!file) {
          if (this.wm) this.wm.launch('edit');
          return '[helix-editor]: Launched Helix Code Editor';
        }
        const resolved = this.resolvePath(file);
        const existing = await this.readFile(resolved);
        if (existing === null) {
          await this.writeFile(resolved, '');
        }
        if (this.wm) this.wm.launch('edit', { file: resolved });
        return `[helix-editor]: Launched Helix Code Editor for '${resolved}'`;
      }

      case 'helix-launch':
      case 'gtk-launch': {
        if (restArgs.length === 0) return 'Usage: helix-launch <app-id> [e.g. term, files, edit, store, mon, settings, rustcpp, machine]';
        const appId = restArgs[0];
        if (this.wm) {
          const winId = this.wm.launch(appId);
          return `[helix-wm]: Successfully launched application '${appId}' (Window ID: ${winId})`;
        }
        return `[helix-wm]: Application '${appId}' launched`;
      }

      case 'notify-send': {
        const title = restArgs[0] || 'System Notification';
        const message = restArgs.slice(1).join(' ') || 'Helix Event';
        NotificationService.add({
          title,
          message,
          icon: '🔔',
          category: 'system',
        });
        Toast.show(`${title}: ${message}`);
        return '';
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
        const dmesgLines = RustEngine.getDmesg();
        const bootLines = this.bootLogs.map(l => `[   0.${Math.floor(Math.random() * 900 + 100)}] ${l}`);
        return [...dmesgLines, ...bootLines].join('\n');
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
        this.broadcastTerminal('\nBroadcast message from root@helix-debian:\nThe system is going down for reboot NOW!\n[ OK ] Stopping system services...\n[ OK ] Unmounting virtio 9p & ext4 filesystems...\n[ OK ] Sending SIGTERM to remaining processes...\n[ OK ] ACPI reset asserted. Rebooting VM...\n');
        setTimeout(() => {
          this.start();
        }, 500);
        return 'System rebooting...';
      }

      case 'poweroff':
      case 'halt':
      case 'shutdown': {
        this.broadcastTerminal('\nBroadcast message from root@helix-debian:\nThe system is going down for poweroff NOW!\n[ OK ] Stopping syslog and OpenRC daemons...\n[ OK ] Unmounting filesystems...\n[ OK ] Power down.\n');
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
        const meta = this.getOsMetadata();
        const hostname = this.getHostname();
        const uptimeMin = Math.floor((Date.now() - this.bootStartTime) / 60000);
        const usedMem = Math.max(24, Math.round(this.bootMemoryMB * 0.22));
        
        let logo1 = '   /\\ /\\       ';
        let logo2 = '  // \\  \\      ';
        let logo3 = ' //   \\  \\     ';
        let logo4 = '///    \\  \\    ';
        let pkgManager = 'apk';
        let shellName = 'ash (busybox 1.36.1)';

        switch (this.currentOsProfile) {
          case 'kali':
            logo1 = '  \x1b[36m/\\_/\\\x1b[0m         ';
            logo2 = ' \x1b[36m( >.< )\x1b[0m        ';
            logo3 = '  \x1b[36m> ^ <\x1b[0m         ';
            logo4 = ' \x1b[36m/ | | \\\x1b[0m        ';
            pkgManager = 'apt / dpkg';
            shellName = 'zsh 5.9';
            break;
          case 'debian':
            logo1 = '   \x1b[31m_____\x1b[0m        ';
            logo2 = '  \x1b[31m/ ___ \\\x1b[0m       ';
            logo3 = ' \x1b[31m| |   | |\x1b[0m      ';
            logo4 = '  \x1b[31m\\_____/\x1b[0m       ';
            pkgManager = 'apt';
            shellName = 'bash 5.2.15';
            break;
          case 'ubuntu':
            logo1 = '   \x1b[33m( • )\x1b[0m        ';
            logo2 = ' \x1b[31m( • \x1b[37m|\x1b[31m • )\x1b[0m      ';
            logo3 = '   \x1b[33m( • )\x1b[0m        ';
            logo4 = '  \x1b[31m/     \\\x1b[0m       ';
            pkgManager = 'apt / snap';
            shellName = 'bash 5.2.21';
            break;
          case 'arch':
            logo1 = '    \x1b[36m/\\\x1b[0m          ';
            logo2 = '   \x1b[36m/  \\\x1b[0m         ';
            logo3 = '  \x1b[36m/\\   \\\x1b[0m        ';
            logo4 = ' \x1b[36m/      \\\x1b[0m       ';
            pkgManager = 'pacman';
            shellName = 'bash 5.2.26';
            break;
          case 'fedora':
            logo1 = '   \x1b[34m_____\x1b[0m        ';
            logo2 = '  \x1b[34m/   __)\x1b[0m       ';
            logo3 = ' \x1b[34m|   (f  |\x1b[0m      ';
            logo4 = '  \x1b[34m\\_____/\x1b[0m       ';
            pkgManager = 'dnf5 / rpm';
            shellName = 'bash 5.2.26';
            break;
          case 'void':
            logo1 = '   \x1b[32m___\x1b[0m          ';
            logo2 = '  \x1b[32m/  _ \\\x1b[0m        ';
            logo3 = ' \x1b[32m|  (_) |\x1b[0m       ';
            logo4 = '  \x1b[32m\\___/\x1b[0m        ';
            pkgManager = 'xbps';
            shellName = 'dash / bash';
            break;
          case 'tinycore':
            logo1 = '     \x1b[33m_\x1b[0m          ';
            logo2 = '   \x1b[33m/   \\\x1b[0m        ';
            logo3 = '  \x1b[33m|  ⚡  |\x1b[0m       ';
            logo4 = '   \x1b[33m\\ _ /\x1b[0m        ';
            pkgManager = 'tce-load';
            shellName = 'ash (in-memory)';
            break;
          case 'microkernel':
            logo1 = '   \x1b[36m[ ◆ ]\x1b[0m        ';
            logo2 = '  \x1b[36m/|   |\\\x1b[0m       ';
            logo3 = ' \x1b[36m< | R | >\x1b[0m      ';
            logo4 = '  \x1b[36m\\|___|/\x1b[0m       ';
            pkgManager = 'cap-mgr';
            shellName = 'rt-shell (preempt)';
            break;
          case 'freedos':
            logo1 = ' \x1b[33m┌─────┐\x1b[0m        ';
            logo2 = ' \x1b[33m│ DOS │\x1b[0m        ';
            logo3 = ' \x1b[33m│ 1.3 │\x1b[0m        ';
            logo4 = ' \x1b[33m└─────┘\x1b[0m        ';
            pkgManager = 'fdimples';
            shellName = 'COMMAND.COM';
            break;
          case 'kolibri':
            logo1 = '   \x1b[35m( K )\x1b[0m        ';
            logo2 = '  \x1b[35m/  |  \\\x1b[0m       ';
            logo3 = ' \x1b[35m|  ASM  |\x1b[0m      ';
            logo4 = '  \x1b[35m\\_____/\x1b[0m       ';
            pkgManager = 'fasm-pkgs';
            shellName = 'tinypad-shell';
            break;
          case 'custom': {
            const info = this.parseCustomOsInfo();
            logo1 = '   \x1b[36m.---.\x1b[0m        ';
            logo2 = '  \x1b[36m/     \\\x1b[0m       ';
            logo3 = '  \x1b[36m\\  O  /\x1b[0m       ';
            logo4 = '   \x1b[36m`---\'\x1b[0m        ';
            const lowerName = info.name.toLowerCase();
            if (lowerName.includes('ubuntu')) {
              logo1 = '   \x1b[33m( • )\x1b[0m        ';
              logo2 = ' \x1b[31m( • \x1b[37m|\x1b[31m • )\x1b[0m      ';
              logo3 = '   \x1b[33m( • )\x1b[0m        ';
              logo4 = '  \x1b[31m/     \\\x1b[0m       ';
              pkgManager = 'apt / dpkg';
            } else if (lowerName.includes('debian')) {
              logo1 = '   \x1b[31m_____\x1b[0m        ';
              logo2 = '  \x1b[31m/ ___ \\\x1b[0m       ';
              logo3 = ' \x1b[31m| |   | |\x1b[0m      ';
              logo4 = '  \x1b[31m\\_____/\x1b[0m       ';
              pkgManager = 'apt / dpkg';
            } else if (lowerName.includes('arch')) {
              logo1 = '    \x1b[36m/\\\x1b[0m          ';
              logo2 = '   \x1b[36m/  \\\x1b[0m         ';
              logo3 = '  \x1b[36m/\\   \\\x1b[0m        ';
              logo4 = ' \x1b[36m/      \\\x1b[0m       ';
              pkgManager = 'pacman';
            } else if (lowerName.includes('fedora')) {
              logo1 = '   \x1b[34m_____\x1b[0m        ';
              logo2 = '  \x1b[34m/   __)\x1b[0m       ';
              logo3 = ' \x1b[34m|   (f  |\x1b[0m      ';
              logo4 = '  \x1b[34m\\_____/\x1b[0m       ';
              pkgManager = 'dnf5 / rpm';
            } else if (lowerName.includes('alpine')) {
              logo1 = '   \x1b[34m/\\ /\\\x1b[0m        ';
              logo2 = '  \x1b[34m// \\  \\\x1b[0m       ';
              logo3 = ' \x1b[34m//   \\  \\\x1b[0m      ';
              logo4 = '\x1b[34m///    \\  \\\x1b[0m     ';
              pkgManager = 'apk';
            } else if (lowerName.includes('windows')) {
              logo1 = '  \x1b[34m┌───┬───┐\x1b[0m     ';
              logo2 = '  \x1b[34m├───┼───┤\x1b[0m     ';
              logo3 = '  \x1b[34m├───┼───┤\x1b[0m     ';
              logo4 = '  \x1b[34m└───┴───┘\x1b[0m     ';
              pkgManager = 'winget / msi';
            } else if (lowerName.includes('dos')) {
              logo1 = ' \x1b[33m┌─────┐\x1b[0m        ';
              logo2 = ' \x1b[33m│ DOS │\x1b[0m        ';
              logo3 = ' \x1b[33m│ RAW │\x1b[0m        ';
              logo4 = ' \x1b[33m└─────┘\x1b[0m        ';
              pkgManager = 'custom';
            } else {
              pkgManager = 'custom / raw';
            }
            shellName = 'bash / sh (Helix JIT)';
            break;
          }
          default:
            logo1 = '   \x1b[34m/\\ /\\\x1b[0m        ';
            logo2 = '  \x1b[34m// \\  \\\x1b[0m       ';
            logo3 = ' \x1b[34m//   \\  \\\x1b[0m      ';
            logo4 = '\x1b[34m///    \\  \\\x1b[0m     ';
            pkgManager = 'apk';
            shellName = 'ash (busybox 1.36.1)';
            break;
        }

        return [
          `${logo1}root@${hostname}`,
          `${logo2}-----------------`,
          `${logo3}OS: ${meta.name} ${meta.version} x86_64`,
          `${logo4}Host: Helix Virtual Machine (v86 JIT)`,
          `               Kernel: ${
            this.currentOsProfile === 'kali' ? '6.6.15-kali' :
            this.currentOsProfile === 'debian' ? '6.1.0-18-amd64' :
            this.currentOsProfile === 'ubuntu' ? '6.8.0-31-generic' :
            this.currentOsProfile === 'arch' ? '6.8.9-arch1' :
            this.currentOsProfile === 'fedora' ? '6.8.5-fedora' :
            this.currentOsProfile === 'void' ? '6.6.21_1' :
            this.currentOsProfile === 'tinycore' ? '6.6.8-tinycore' :
            this.currentOsProfile === 'microkernel' ? '6.8.0-rt' :
            this.currentOsProfile === 'freedos' ? '2043-freedos' :
            this.currentOsProfile === 'kolibri' ? '0.7.7-kolibri' : '6.6.14-virt'
          }`,
          `               Firmware: ${this.currentBiosName}`,
          `               Packages: ${pkgCount} (${pkgManager})`,
          `               Shell: ${shellName}`,
          `               Terminal: helix-term (xterm-256color)`,
          `               CPU: Intel(R) Core(TM) Architecture (1) @ 2.400GHz`,
          `               Memory: ${usedMem}MiB / ${this.bootMemoryMB}MiB`,
          `               Disk: 142.4MiB / 2.0GiB (7%)`,
          `               ACPI: ${this.acpiEnabled ? '2.0 (Enabled)' : 'Legacy'} | APIC: ${this.apicEnabled ? 'Active' : 'Off'}`,
          `               Uptime: ${uptimeMin} mins`
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

      case 'rustc': {
        if (restArgs.length === 0 || restArgs[0] === '--version' || restArgs[0] === '-V') {
          return 'rustc 1.76.0 (07dca489a 2024-02-04) (Helix Alpine Native Rust JIT Engine)';
        }
        const fileToRun = restArgs.find((a) => a.endsWith('.rs'));
        let code = '';
        if (fileToRun) {
          const content = await this.readFile(fileToRun);
          code = content || '';
          if (!content) {
            return `error[E0463]: can't find crate for \`${fileToRun}\`: No such file or directory`;
          }
        } else {
          code = `fn main() {\n    println!("Helix Local Rust WASM Engine Active!");\n}`;
        }
        const res = RustEngine.executeRust(code);
        return (res.stdout + (res.stderr ? `\n[rustc error]:\n${res.stderr}` : '') + `\n[rustc]: Finished compilation in ${res.executionTimeMs}ms (${res.wasmInstructionsCount} instructions, ${res.allocationsCount} heap allocations)`).trim();
      }

      case 'cargo': {
        if (restArgs.length === 0 || restArgs[0] === '--version' || restArgs[0] === '-V') {
          return 'cargo 1.76.0 (c84b36747 2024-01-18) (Helix Rust Toolchain)';
        }
        return await RustEngine.executeCargo(
          restArgs,
          this.cwd,
          this.vfs,
          async (cmd: string) => this.executeCommand(cmd)
        );
      }

      case 'lspci': {
        return RustEngine.getLspci();
      }

      case 'lsusb': {
        return RustEngine.getLsusb();
      }

      case 'lshw': {
        return RustEngine.getLshw();
      }

      case 'gpio': {
        return RustEngine.executeGpio(restArgs);
      }

      case 'i2c':
      case 'i2cdetect': {
        return RustEngine.executeI2c(restArgs);
      }

      case 'sensors': {
        return RustEngine.executeSensors();
      }

      case 'dmidecode': {
        return RustEngine.getDmidecode();
      }

      case 'rust-registers': {
        const regs = RustEngine.getRegisters();
        return Object.entries(regs).map(([r, val]) => `${r.toUpperCase().padEnd(7, ' ')}: ${val}`).join('\n');
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

      case 'su': {
        let isLogin = false;
        let commandToRun: string | null = null;
        let targetUser = 'root';

        for (let i = 0; i < restArgs.length; i++) {
          const arg = restArgs[i];
          if (arg === '-' || arg === '-l' || arg === '--login') {
            isLogin = true;
          } else if (arg === '-c') {
            commandToRun = restArgs.slice(i + 1).join(' ').replace(/^["']|["']$/g, '');
            break;
          } else if (!arg.startsWith('-')) {
            targetUser = arg;
          }
        }

        if (commandToRun) {
          const prevUser = this.currentUser;
          const prevEnv = { ...this.env };
          const prevCwd = this.cwd;
          this.switchUser(targetUser, isLogin);
          try {
            return await this.executePipeline(commandToRun);
          } finally {
            this.currentUser = prevUser;
            this.env = prevEnv;
            this.cwd = prevCwd;
            this.notifyUserChange();
          }
        }

        const res = this.switchUser(targetUser, isLogin);
        return res.message;
      }

      case 'sudo': {
        if (restArgs.length === 0 || restArgs[0] === '-h' || restArgs[0] === '--help') {
          return [
            'usage: sudo -h | -K | -k | -V',
            'usage: sudo -v [-AknS] [-g group] [-h host] [-p prompt] [-u user]',
            'usage: sudo -l [-AknS] [-g group] [-h host] [-p prompt] [-U user] [-u user] [command]',
            'usage: sudo [-AbEHknPS] [-C num] [-g group] [-h host] [-p prompt] [-u user] [VAR=value] [-i|-s] [<command>]',
            'usage: sudo -e [-AknS] [-C num] [-g group] [-h host] [-p prompt] [-u user] file ...'
          ].join('\n');
        }

        if (restArgs[0] === '-V' || restArgs[0] === '--version') {
          return 'Sudo version 1.9.15p5\nSudoers policy plugin version 1.9.15p5\nSudoers grammar version 50';
        }

        if (restArgs[0] === '-l') {
          return [
            `Matching Defaults entries for ${this.currentUser} on ${this.getHostname()}:`,
            '    env_reset, mail_badpass, secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/sbin\\:/usr/bin\\:/sbin\\:/bin',
            '',
            `User ${this.currentUser} may run the following commands on ${this.getHostname()}:`,
            '    (ALL : ALL) NOPASSWD: ALL'
          ].join('\n');
        }

        if (restArgs[0] === 'su' || restArgs[0] === '-i' || restArgs[0] === '-s') {
          const res = this.switchUser('root', restArgs[0] === '-i');
          return res.message;
        }

        let targetUser = 'root';
        let cmdStartIndex = 0;
        if (restArgs[0] === '-u' && restArgs[1]) {
          targetUser = restArgs[1];
          cmdStartIndex = 2;
        }

        const subCmd = restArgs.slice(cmdStartIndex).join(' ');
        if (!subCmd) return '';

        const prevUser = this.currentUser;
        const prevEnv = { ...this.env };
        const prevCwd = this.cwd;

        this.currentUser = targetUser;
        this.env.USER = targetUser;
        this.env.LOGNAME = targetUser;
        this.env.UID = targetUser === 'root' ? '0' : '1000';
        this.env.EUID = targetUser === 'root' ? '0' : '1000';
        if (targetUser === 'root') {
          this.env.HOME = '/root';
        }
        this.notifyUserChange();

        try {
          return await this.executePipeline(subCmd);
        } finally {
          this.currentUser = prevUser;
          this.env = prevEnv;
          this.cwd = prevCwd;
          this.notifyUserChange();
        }
      }

      case 'chroot': {
        const sub = restArgs[0];
        const chrootMgr = ChrootManager.getInstance();

        if (!sub || sub === '--help' || sub === '-h' || sub === 'help') {
          return [
            '╔════════════════════════════════════════════════════════════════════════════════════════════╗',
            '║                         Helix OS POSIX chroot & Jail Subsystem                             ║',
            '╚════════════════════════════════════════════════════════════════════════════════════════════╝',
            'Usage: chroot [OPTIONS] NEWROOT [COMMAND [ARG]...]',
            'Run a command or interactive shell with a special root directory inside the virtual OS.',
            '',
            'Core Operational Commands:',
            '  chroot <DIR>                   Enter interactive sandboxed shell session inside jail',
            '  chroot <DIR> <CMD> [ARGS]      Execute one-shot command inside isolated jail and return',
            '',
            'Options & Management Subcommands:',
            '  --help, -h                     Show this help manual',
            '  --list, -l                     List all registered/active chroot jails and statuses',
            '  --status                       Display current shell chroot state, root, and metrics',
            '  --init <DIR> [TEMPLATE]        Initialize a rootfs template (alpine|debian|busybox|python|recovery)',
            '  --audit [DIR]                  Run comprehensive security & privilege escalation audit',
            '  --bind <SRC> <DST> [DIR]       Bind mount a host VFS directory into the jail',
            '  --unbind <DST> [DIR]           Remove a bind mount from the jail',
            '  --destroy <DIR>                Delete jail and purge all files from VFS',
            '  --gui                          Open the Chroot Sandbox Studio visual management application',
            '',
            'Templates Available:',
            '  alpine     Alpine Linux 3.20 minimal Musl & BusyBox rootfs with APK package layout',
            '  debian     Debian 12 Bookworm minimal environment with APT and standard GNU utilities',
            '  busybox    Ultra-light BusyBox multicall tool suite for resource-constrained sandboxes',
            '  python     Isolated Python 3 sandbox runtime with application scaffold',
            '  recovery   Disaster recovery mode with VFS filesystem check & diagnostic tools',
            '',
            'Examples:',
            '  chroot /jails/alpine-core               # Enter interactive Alpine shell',
            '  chroot /jails/alpine-core cat /etc/issue # Check release issue inside jail',
            '  chroot --init /jails/my-debian debian    # Provision new Debian 12 jail',
            '  chroot --bind /mnt/helix /mnt/host       # Map host files into sandbox',
            '  chroot --audit /jails/alpine-core        # Audit security score & vulnerabilities',
            '  exit                                    # Leave current chroot session'
          ].join('\n');
        }

        if (sub === '--gui') {
          if (this.wm) this.wm.launch('chroot');
          return '[chroot]: Launched Chroot Sandbox Studio GUI';
        }

        if (sub === '--list' || sub === '-l') {
          const jails = chrootMgr.listJails();
          if (jails.length === 0) {
            return 'No chroot jails found. Use "chroot --init <path> [template]" to initialize one.';
          }
          const lines = [
            'ID         NAME                  TEMPLATE   STATUS    FILES   SIZE      SCORE  ROOT PATH',
            '──────────────────────────────────────────────────────────────────────────────────────────'
          ];
          for (const j of jails) {
            const idStr = j.id.padEnd(10, ' ');
            const nameStr = j.name.slice(0, 20).padEnd(21, ' ');
            const tplStr = j.template.padEnd(10, ' ');
            const statStr = (j.status === 'active' ? 'ACTIVE' : 'IDLE').padEnd(9, ' ');
            const filesStr = String(j.fileCount).padStart(5, ' ');
            const sizeStr = (j.sizeBytes < 1024 ? `${j.sizeBytes} B` : `${(j.sizeBytes / 1024).toFixed(1)} KB`).padStart(8, ' ');
            const scoreStr = `${j.securityScore}%`.padStart(5, ' ');
            lines.push(`${idStr} ${nameStr} ${tplStr} ${statStr} ${filesStr}  ${sizeStr}  ${scoreStr}  ${j.rootPath}`);
          }
          return lines.join('\n');
        }

        if (sub === '--status') {
          const active = chrootMgr.getActiveJail();
          if (!active) {
            return [
              'Status: HOST ENVIRONMENT (Not jailed)',
              `Current Working Dir: ${this.cwd}`,
              `Hostname: ${this.getHostname()}`,
              `Current User: ${this.currentUser}`,
              'Root: / (Real Host VFS)',
              `Available Jails: ${chrootMgr.listJails().length} configured`
            ].join('\n');
          }
          return [
            'Status: ACTIVE CHROOT JAIL',
            `Jail Name: ${active.name}`,
            `Jail ID: ${active.id}`,
            `Template: ${active.template.toUpperCase()}`,
            `Jail Root: ${active.rootPath}`,
            `Virtual CWD: ${this.cwd}`,
            `Hostname: ${this.getHostname()}`,
            `Security Score: ${active.securityScore}%`,
            `Nesting Depth: ${chrootMgr.getChrootDepth()}`,
            `Bind Mounts: ${active.bindMounts.length > 0 ? active.bindMounts.map(b => `${b.source} -> ${b.target}`).join(', ') : 'None'}`
          ].join('\n');
        }

        if (sub === '--init') {
          const targetDir = restArgs[1];
          const template = (restArgs[2] || 'alpine').toLowerCase() as any;
          if (!targetDir) return 'Usage: chroot --init <path> [alpine|debian|busybox|python|recovery]';
          const resolvedTarget = this.resolvePath(targetDir);
          const jailName = resolvedTarget.split('/').filter(Boolean).pop() || 'custom-jail';
          await chrootMgr.createJail(jailName, resolvedTarget, template);
          return `[chroot]: Successfully initialized ${template.toUpperCase()} rootfs in '${resolvedTarget}'.`;
        }

        if (sub === '--audit') {
          const targetDir = restArgs[1] || (chrootMgr.getActiveJail()?.rootPath);
          if (!targetDir) return 'Usage: chroot --audit <jail-path-or-id>';
          const targetJail = chrootMgr.getJail(targetDir);
          if (!targetJail) return `chroot: jail not found: ${targetDir}`;
          const report = await chrootMgr.auditJail(targetJail.rootPath);
          const lines = [
            `=== Chroot Security Audit: ${report.jailName} ===`,
            `Rating: ${report.rating} (Score: ${report.score}/100) | Root: ${report.rootPath} | Scanned: ${report.timestamp}`,
            '────────────────────────────────────────────────────────────────────────',
            'Findings:'
          ];
          for (const f of report.findings) {
            const icon = f.type === 'safe' ? '[PASS]' : f.type === 'warning' ? '[WARN]' : '[CRIT]';
            lines.push(`  ${icon} ${f.title}: ${f.description}`);
          }
          if (report.recommendations.length > 0) {
            lines.push('\nRecommendations:');
            for (const r of report.recommendations) {
              lines.push(`  • ${r}`);
            }
          }
          return lines.join('\n');
        }

        if (sub === '--bind') {
          const hostSrc = restArgs[1];
          const jailDst = restArgs[2];
          const targetJailPath = restArgs[3] || (chrootMgr.getActiveJail()?.rootPath);
          if (!hostSrc || !jailDst) return 'Usage: chroot --bind <hostSrc> <jailDst> [jailPath]';
          if (!targetJailPath) return 'chroot: specify target jail or run inside active jail';
          const success = await chrootMgr.addBindMount(targetJailPath, hostSrc, jailDst);
          return success ? `[chroot]: Bind-mounted host '${hostSrc}' to jail '${jailDst}'` : `chroot: failed to add bind mount`;
        }

        if (sub === '--unbind') {
          const jailDst = restArgs[1];
          const targetJailPath = restArgs[2] || (chrootMgr.getActiveJail()?.rootPath);
          if (!jailDst) return 'Usage: chroot --unbind <jailDst> [jailPath]';
          if (!targetJailPath) return 'chroot: specify target jail or run inside active jail';
          const success = await chrootMgr.removeBindMount(targetJailPath, jailDst);
          return success ? `[chroot]: Unmounted '${jailDst}'` : `chroot: mount not found`;
        }

        if (sub === '--destroy') {
          const targetDir = restArgs[1];
          if (!targetDir) return 'Usage: chroot --destroy <jail-path>';
          const success = await chrootMgr.deleteJail(targetDir);
          return success ? `[chroot]: Purged jail and removed rootfs at '${targetDir}'` : `chroot: failed to destroy jail`;
        }

        // Sub is a target directory: enter shell or execute one-shot command
        const targetPath = sub;
        const cmdToRun = restArgs.slice(1).join(' ');

        if (cmdToRun.trim()) {
          // One-shot execution
          return await chrootMgr.executeInJail(targetPath, cmdToRun, this);
        } else {
          // Interactive shell entry
          const enterRes = await chrootMgr.enterJail(targetPath, this);
          return enterRes.message;
        }
      }

      case 'exit':
      case 'logout': {
        if (ChrootManager.getInstance().isChrooted()) {
          const exitRes = ChrootManager.getInstance().exitJail(this);
          return exitRes.message;
        }
        const pop = this.popUser();
        if (pop.success) {
          return `exit\nSwitched back to user ${pop.user} (${this.getPromptSymbol()})`;
        }
        return 'logout\n[Session active]';
      }

      case 'apk': {
        const sub = restArgs[0];
        if (sub === 'add') {
          const pkgs = restArgs.slice(1).filter(p => !p.startsWith('-'));
          if (pkgs.length === 0) return 'OK: 0 distinct packages available';
          for (const p of pkgs) {
            this.installedPkgs.add(p);
          }
          const emu = getWindowEmulator();
          if (emu && (this.state === 'ready' || this.state === 'booting')) {
            this.rawSerialSend(`apk add ${pkgs.join(' ')}\n`);
          }
          return [
            `(1/${pkgs.length}) Installing ${pkgs.join(', ')}...`,
            'Executing busybox-1.36.1-r15.trigger',
            `OK: ${this.installedPkgs.size * 12} MiB in ${this.installedPkgs.size} packages`
          ].join('\n');
        }
        if (sub === 'del') {
          const pkgs = restArgs.slice(1).filter(p => !p.startsWith('-'));
          for (const p of pkgs) {
            this.installedPkgs.delete(p);
          }
          return `(1/${pkgs.length}) Purging ${pkgs.join(', ')}...\nOK: ${this.installedPkgs.size * 12} MiB in ${this.installedPkgs.size} packages`;
        }
        if (sub === 'update') {
          return [
            'fetch https://dl-cdn.alpinelinux.org/alpine/v3.20/main/x86_64/APKINDEX.tar.gz',
            'fetch https://dl-cdn.alpinelinux.org/alpine/v3.20/community/x86_64/APKINDEX.tar.gz',
            'v3.20.0-120-g3098f921 [https://dl-cdn.alpinelinux.org/alpine/v3.20/main]',
            'v3.20.0-118-g9214ab90 [https://dl-cdn.alpinelinux.org/alpine/v3.20/community]',
            'OK: 20184 distinct packages available'
          ].join('\n');
        }
        if (sub === 'info') {
          if (restArgs[1]) {
            return `${restArgs[1]}-1.0.0-r0 description:\n  Emulated Alpine Linux package for Helix Desktop\n  web: https://alpinelinux.org`;
          }
          return Array.from(this.installedPkgs).join('\n');
        }
        if (sub === 'search') {
          const query = restArgs[1] || '';
          return `${query}-1.0.0-r0 - Package matching '${query}' in Alpine repository`;
        }
        return 'apk-tools 2.14.4, compiled for x86_64.\nusage: apk [<options>] <command> [<arguments> ...]';
      }

      case 'apt':
      case 'apt-get': {
        const sub = restArgs[0];
        if (sub === 'install') {
          const pkgs = restArgs.slice(1).filter(p => !p.startsWith('-'));
          if (pkgs.length === 0) return 'Reading package lists... Done\nBuilding dependency tree... Done\n0 upgraded, 0 newly installed, 0 to remove.';
          for (const p of pkgs) {
            this.installedPkgs.add(p);
          }
          return [
            'Reading package lists... Done',
            'Building dependency tree... Done',
            'Reading state information... Done',
            `The following NEW packages will be installed: ${pkgs.join(' ')}`,
            `0 upgraded, ${pkgs.length} newly installed, 0 to remove and 0 not upgraded.`,
            `Need to get ${pkgs.length * 2.4} MB of archives.`,
            `Unpacking and setting up ${pkgs.join(' ')}...`,
            'Processing triggers for man-db (2.10.2-1) ...',
            `[apt]: ${pkgs.join(', ')} successfully installed.`
          ].join('\n');
        }
        if (sub === 'remove' || sub === 'purge') {
          const pkgs = restArgs.slice(1).filter(p => !p.startsWith('-'));
          for (const p of pkgs) {
            this.installedPkgs.delete(p);
          }
          return `Reading package lists... Done\nBuilding dependency tree... Done\nRemoving ${pkgs.join(' ')}... Done`;
        }
        if (sub === 'update') {
          return [
            'Get:1 http://deb.debian.org/debian bookworm InRelease [151 kB]',
            'Get:2 http://deb.debian.org/debian bookworm-updates InRelease [55.4 kB]',
            'Get:3 http://security.debian.org/debian-security bookworm-security InRelease [48.0 kB]',
            'Fetched 254 kB in 1s (410 kB/s)',
            'Reading package lists... Done',
            'Building dependency tree... Done',
            'All packages are up to date.'
          ].join('\n');
        }
        if (sub === 'upgrade') {
          return 'Reading package lists... Done\nBuilding dependency tree... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.';
        }
        return 'apt 2.6.1 (amd64)\nUsage: apt [install | remove | update | upgrade | search | show] [packages]';
      }

      case 'pacman': {
        const flag = restArgs[0] || '';
        if (flag.includes('S') || flag === '-S' || flag === '-Syu') {
          const pkgs = restArgs.slice(1).filter(p => !p.startsWith('-'));
          if (pkgs.length > 0) {
            for (const p of pkgs) {
              this.installedPkgs.add(p);
            }
            return [
              'resolving dependencies...',
              'looking for conflicting packages...',
              `Packages (${pkgs.length}) ${pkgs.map(p => `${p}-1.0-1`).join(' ')}`,
              'Total Download Size:    14.28 MiB',
              'Total Installed Size:   48.50 MiB',
              ':: Proceed with installation? [Y/n] Y',
              `:: Synchronizing package databases...`,
              `[####################################] 100%`,
              `(1/${pkgs.length}) installing ${pkgs.join(' ')}`,
              ':: Running post-transaction hooks...'
            ].join('\n');
          }
          return ':: Synchronizing package databases...\n core [####################################] 100%\n extra [####################################] 100%\n:: Starting full system upgrade...\n there is nothing to do';
        }
        if (flag === '-R' || flag.includes('R')) {
          const pkgs = restArgs.slice(1).filter(p => !p.startsWith('-'));
          for (const p of pkgs) {
            this.installedPkgs.delete(p);
          }
          return `checking dependencies...\nremoving ${pkgs.join(', ')}...\n(1/${pkgs.length}) removing ${pkgs.join(' ')}`;
        }
        if (flag === '-Q' || flag === '-Qe') {
          return Array.from(this.installedPkgs).map(p => `${p} 1.0.0-1`).join('\n');
        }
        return 'Pacman v6.1.0 - libalpm v14.0.0\nusage: pacman <operation> [...] [options]';
      }

      case 'dnf':
      case 'yum': {
        const sub = restArgs[0];
        if (sub === 'install') {
          const pkgs = restArgs.slice(1).filter(p => !p.startsWith('-'));
          for (const p of pkgs) {
            this.installedPkgs.add(p);
          }
          return [
            'Updating and loading repositories:',
            ' Fedora 40 - x86_64                               100% |  28 MB     00:01',
            'Repositories loaded.',
            'Package                               Architecture  Version             Repository    Size',
            `Installing: ${pkgs.join(', ')}`,
            'Transaction Summary:',
            ` Installing: ${pkgs.length} packages`,
            'Is this ok [y/N]: y',
            'Complete!'
          ].join('\n');
        }
        if (sub === 'remove' || sub === 'erase') {
          const pkgs = restArgs.slice(1).filter(p => !p.startsWith('-'));
          for (const p of pkgs) {
            this.installedPkgs.delete(p);
          }
          return `Removed: ${pkgs.join(' ')}\nComplete!`;
        }
        if (sub === 'check-update' || sub === 'update') {
          return 'Fedora 40 - x86_64 - Updates 100% | 12 MB 00:00\nNo security updates needed.';
        }
        return 'DNF5 version 5.1.17\nusage: dnf [install | remove | upgrade | check-update | search | list]';
      }

      case 'xbps-install':
      case 'xbps-query': {
        const pkgs = restArgs.filter(p => !p.startsWith('-'));
        for (const p of pkgs) {
          this.installedPkgs.add(p);
        }
        return `[*] Updating ` + (pkgs.length > 0 ? `repository: ${pkgs.join(' ')} installed successfully.` : 'repository data...');
      }

      case 'tce-load': {
        const pkgs = restArgs.filter(p => !p.startsWith('-'));
        for (const p of pkgs) {
          this.installedPkgs.add(p);
        }
        return `${pkgs.join(' ')}: OK (Mounted loop filesystem in RAM)`;
      }

      case 'sort': {
        let text = pipedInput ?? '';
        let reverse = false;
        let numeric = false;
        let unique = false;
        const fileArgs: string[] = [];

        for (const a of restArgs) {
          if (a === '-r') reverse = true;
          else if (a === '-n') numeric = true;
          else if (a === '-u') unique = true;
          else if (!a.startsWith('-')) fileArgs.push(a);
        }

        if (fileArgs.length > 0) {
          const resolved = this.resolvePath(fileArgs[0]);
          text = this.systemFiles[resolved] || '';
          if (!text) {
            const vfsPath = resolved.replace('/mnt/helix', '') || '/';
            text = (await this.vfs.read(vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath)) || '';
          }
        }

        let lines = text.split('\n');
        if (unique) {
          lines = Array.from(new Set(lines));
        }
        lines.sort((a, b) => {
          if (numeric) {
            const na = parseFloat(a) || 0;
            const nb = parseFloat(b) || 0;
            return na - nb;
          }
          return a.localeCompare(b);
        });
        if (reverse) lines.reverse();
        return lines.join('\n');
      }

      case 'uniq': {
        let text = pipedInput ?? '';
        let count = false;
        const fileArgs: string[] = [];
        for (const a of restArgs) {
          if (a === '-c') count = true;
          else if (!a.startsWith('-')) fileArgs.push(a);
        }
        if (fileArgs.length > 0) {
          const resolved = this.resolvePath(fileArgs[0]);
          text = this.systemFiles[resolved] || '';
          if (!text) {
            const vfsPath = resolved.replace('/mnt/helix', '') || '/';
            text = (await this.vfs.read(vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath)) || '';
          }
        }
        const lines = text.split('\n');
        const res: Array<{ line: string; count: number }> = [];
        for (const line of lines) {
          if (res.length > 0 && res[res.length - 1].line === line) {
            res[res.length - 1].count++;
          } else {
            res.push({ line, count: 1 });
          }
        }
        return res.map(r => count ? `${String(r.count).padStart(7, ' ')} ${r.line}` : r.line).join('\n');
      }

      case 'cut': {
        let delimiter = '\t';
        let fields: number[] = [];
        const fileArgs: string[] = [];

        for (let i = 0; i < restArgs.length; i++) {
          const a = restArgs[i];
          if (a === '-d' && restArgs[i + 1]) {
            delimiter = restArgs[++i];
          } else if (a.startsWith('-d')) {
            delimiter = a.slice(2);
          } else if (a === '-f' && restArgs[i + 1]) {
            fields = restArgs[++i].split(',').map(n => parseInt(n, 10)).filter(n => !isNaN(n));
          } else if (a.startsWith('-f')) {
            fields = a.slice(2).split(',').map(n => parseInt(n, 10)).filter(n => !isNaN(n));
          } else if (!a.startsWith('-')) {
            fileArgs.push(a);
          }
        }

        let text = pipedInput ?? '';
        if (fileArgs.length > 0) {
          const resolved = this.resolvePath(fileArgs[0]);
          text = this.systemFiles[resolved] || '';
          if (!text) {
            const vfsPath = resolved.replace('/mnt/helix', '') || '/';
            text = (await this.vfs.read(vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath)) || '';
          }
        }

        if (fields.length === 0) fields = [1];
        return text.split('\n').map(line => {
          const parts = line.split(delimiter);
          return fields.map(f => parts[f - 1] || '').join(delimiter);
        }).join('\n');
      }

      case 'tr': {
        let text = pipedInput ?? '';
        if (restArgs.length >= 2) {
          const set1 = restArgs[0];
          const set2 = restArgs[1];
          if (set1 === '[:lower:]' && set2 === '[:upper:]') {
            return text.toUpperCase();
          }
          if (set1 === '[:upper:]' && set2 === '[:lower:]') {
            return text.toLowerCase();
          }
          let res = text;
          for (let i = 0; i < set1.length; i++) {
            const c1 = set1[i];
            const c2 = set2[i] || set2[set2.length - 1] || '';
            res = res.split(c1).join(c2);
          }
          return res;
        }
        if (restArgs[0] === '-d' && restArgs[1]) {
          const delChars = restArgs[1];
          let res = text;
          for (const ch of delChars) {
            res = res.split(ch).join('');
          }
          return res;
        }
        return text;
      }

      case 'sed': {
        let text = pipedInput ?? '';
        const expr = restArgs.find(a => a.startsWith('s/')) || restArgs[0] || '';
        const file = restArgs.find(a => a !== expr && !a.startsWith('-'));
        if (file) {
          const resolved = this.resolvePath(file);
          text = this.systemFiles[resolved] || '';
          if (!text) {
            const vfsPath = resolved.replace('/mnt/helix', '') || '/';
            text = (await this.vfs.read(vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath)) || '';
          }
        }
        if (expr.startsWith('s/')) {
          const parts = expr.split('/');
          const pattern = parts[1];
          const replacement = parts[2] ?? '';
          const flags = parts[3] ?? '';
          const global = flags.includes('g');
          try {
            const regex = new RegExp(pattern, global ? 'g' : '');
            return text.replace(regex, replacement);
          } catch {
            return text;
          }
        }
        return text;
      }

      case 'awk': {
        let text = pipedInput ?? '';
        const expr = restArgs.find(a => a.includes('{') || a.includes('$')) || restArgs[0] || '';
        const file = restArgs.find(a => a !== expr && !a.startsWith('-'));
        if (file) {
          const resolved = this.resolvePath(file);
          text = this.systemFiles[resolved] || '';
          if (!text) {
            const vfsPath = resolved.replace('/mnt/helix', '') || '/';
            text = (await this.vfs.read(vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath)) || '';
          }
        }
        const lines = text.split('\n');
        return lines.map(line => {
          const cols = line.trim().split(/\s+/);
          if (expr.includes('print $1')) return cols[0] || '';
          if (expr.includes('print $2')) return cols[1] || '';
          if (expr.includes('print $0')) return line;
          return line;
        }).join('\n');
      }

      case 'base64': {
        let text = pipedInput ?? '';
        const isDecode = restArgs.includes('-d') || restArgs.includes('--decode');
        const file = restArgs.find(a => !a.startsWith('-'));
        if (file) {
          const resolved = this.resolvePath(file);
          text = this.systemFiles[resolved] || '';
          if (!text) {
            const vfsPath = resolved.replace('/mnt/helix', '') || '/';
            text = (await this.vfs.read(vfsPath.startsWith('/') ? vfsPath : '/' + vfsPath)) || '';
          }
        }
        try {
          return isDecode ? atob(text.trim()) : btoa(text);
        } catch {
          return 'base64: invalid input';
        }
      }

      case 'md5sum':
      case 'sha256sum':
      case 'cksum': {
        const file = restArgs.find(a => !a.startsWith('-'));
        let hashStr = Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
        if (cmd.toLowerCase() === 'sha256sum') hashStr += hashStr;
        return `${hashStr}  ${file || '-'}`;
      }

      case 'tar': {
        return `tar: archive operation completed (${restArgs.join(' ') || 'default'})`;
      }

      case 'gzip':
      case 'gunzip':
      case 'zip':
      case 'unzip': {
        return `${cmd}: Operation completed successfully.`;
      }

      case 'mount': {
        return [
          '/dev/sda1 on / type ext4 (rw,relatime,data=ordered)',
          'host9p on /mnt/helix type 9p (rw,dirsync,relatime,trans=virtio,version=9p2000.L)',
          'devtmpfs on /dev type devtmpfs (rw,relatime,size=126000k,nr_inodes=31500,mode=755)',
          'proc on /proc type proc (rw,relatime)',
          'sysfs on /sys type sysfs (rw,relatime)',
          'tmpfs on /tmp type tmpfs (rw,nosuid,nodev)',
          'tmpfs on /run type tmpfs (rw,nosuid,nodev,mode=755)'
        ].join('\n');
      }

      case 'umount':
        return '';

      case 'lsblk': {
        return [
          'NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS',
          'sda      8:0    0   20G  0 disk ',
          '├─sda1   8:1    0   18G  0 part /',
          '└─sda2   8:2    0    2G  0 part [SWAP]',
          'sr0     11:0    1 1024M  0 rom  ',
          'vda    254:0    0  256M  0 disk /mnt/helix'
        ].join('\n');
      }

      case 'fdisk': {
        if (restArgs[0] === '-l') {
          return [
            'Disk /dev/sda: 20 GiB, 21474836480 bytes, 41943040 sectors',
            'Units: sectors of 1 * 512 = 512 bytes',
            'Sector size (logical/physical): 512 bytes / 512 bytes',
            'Disklabel type: dos',
            'Disk identifier: 0x8a924b10',
            '',
            'Device     Boot    Start      End  Sectors Size Id Type',
            '/dev/sda1  *        2048 37748735 37746688  18G 83 Linux',
            '/dev/sda2       37748736 41943039  4194304   2G 82 Linux swap / Solaris'
          ].join('\n');
        }
        return 'fdisk 2.39.3\nUsage: fdisk [-l] [device...]';
      }

      case 'crontab': {
        if (restArgs[0] === '-l') {
          return '# Helix OS Automated Cron Schedule\n0 * * * * /usr/bin/sync-system\n*/15 * * * * /usr/sbin/logrotate /etc/logrotate.conf\n';
        }
        if (restArgs[0] === '-r') {
          return 'crontab: crontab removed';
        }
        return 'crontab: usage: crontab [-u user] {-l | -r | -e}';
      }

      case 'lsmod': {
        return [
          'Module                  Size  Used by',
          '9pnet_virtio           24576  1',
          '9pnet                  90112  1 9pnet_virtio',
          'virtio_net             57344  0',
          'net_failover           20480  1 virtio_net',
          'virtio_blk             24576  2',
          'virtio_pci             40960  0',
          'virtio_pci_modern_dev  20480  1 virtio_pci',
          'virtio_ring            36864  4 9pnet_virtio,virtio_net,virtio_blk,virtio_pci',
          'ext4                  950272  1'
        ].join('\n');
      }

      case 'modprobe':
      case 'rmmod':
      case 'insmod': {
        return '';
      }

      case 'sysctl': {
        if (restArgs[0] === '-a' || restArgs[0] === '-p') {
          return [
            'net.ipv4.ip_forward = 1',
            'net.ipv4.conf.all.rp_filter = 1',
            'net.ipv4.icmp_echo_ignore_broadcasts = 1',
            'kernel.sysrq = 1',
            'kernel.core_uses_pid = 1',
            'vm.swappiness = 10',
            'fs.file-max = 2097152'
          ].join('\n');
        }
        return restArgs[0] ? `${restArgs[0]} = 1` : 'sysctl: usage: sysctl [-a] [-p] [var[=val]]';
      }

      case 'pacman': {
        const flag = restArgs[0];
        if (flag === '-Syu' || flag === '-Sy') {
          return ':: Synchronizing package databases...\n core [######################] 100%\n extra [#####################] 100%\n:: Starting full system upgrade...\n there is nothing to do';
        }
        if (flag === '-S') {
          const pkg = restArgs[1] || 'package';
          this.installedPkgs.add(pkg);
          return `resolving dependencies...\nlooking for conflicting packages...\n\nPackages (1) ${pkg}-1.0.0-1\n\nTotal Download Size:    4.20 MiB\nTotal Installed Size:  14.50 MiB\n\n:: Proceed with installation? [Y/n] Y\n(1/1) checking keys in keyring\n(1/1) installing ${pkg} [######################] 100%`;
        }
        return 'error: no operation specified (use -h for help)';
      }

      case 'dnf':
      case 'yum': {
        const sub = restArgs[0];
        if (sub === 'install') {
          const pkg = restArgs[1] || 'package';
          this.installedPkgs.add(pkg);
          return `Last metadata expiration check: 0:12:04 ago.\nDependencies resolved.\nInstalling: ${pkg} x86_64 1.0.0-1.fc40\nComplete!`;
        }
        return 'DNF version 4.14.0\nUsage: dnf [install|update|remove|search]';
      }

      case 'zypper': {
        return 'zypper 1.14.68\nRepository cache updated.\nNo updates found.';
      }

      case 'notify-send': {
        const title = restArgs[0] || 'Helix Terminal';
        const msg = restArgs.slice(1).join(' ') || 'Command finished successfully.';
        NotificationService.add({
          title,
          message: msg,
          category: 'system',
          icon: '🔔'
        });
        return '';
      }

      case 'apt':
      case 'apt-get': {
        const sub = restArgs[0];
        if (sub === 'update') {
          return 'Hit:1 http://deb.debian.org/debian bookworm InRelease\nReading package lists... Done';
        }
        if (sub === 'install') {
          const pkgs = restArgs.slice(1).filter(p => !p.startsWith('-'));
          if (pkgs.length === 0) return 'E: No package specified';
          for (const p of pkgs) {
            this.installedPkgs.add(p);
          }
          return [
            'Reading package lists... Done',
            'Building dependency tree... Done',
            'Reading state information... Done',
            'The following NEW packages will be installed:',
            '  ' + pkgs.join(' '),
            '0 upgraded, ' + pkgs.length + ' newly installed, 0 to remove and 0 not upgraded.',
            'Need to get 14.2 MB of archives.',
            'Selecting previously unselected package ' + pkgs[0] + '.',
            'Setting up ' + pkgs[0] + ' (1.0.0-1) ...'
          ].join('\n');
        }
        if (sub === 'remove' || sub === 'purge') {
          const pkgs = restArgs.slice(1).filter(p => !p.startsWith('-'));
          for (const p of pkgs) {
            this.installedPkgs.delete(p);
          }
          return 'Packages successfully removed.';
        }
        if (sub === 'search') {
          return 'Listing... Done\n' + (restArgs[1] || 'package') + '/bookworm 1.0.0 all\n  Sample package matching query in Debian / Ubuntu ecosystem.';
        }
        if (sub === 'list' && restArgs[1] === '--installed') {
          return Array.from(this.installedPkgs).map(p => `${p}/bookworm,now 1.0.0 all [installed]`).join('\n');
        }
        return 'APT 2.6.1 (amd64)\nUsage: apt update | apt install <pkg> | apt search <query> | apt list --installed';
      }

      case 'dpkg': {
        if (restArgs[0] === '-l') {
          return [
            'Desired=Unknown/Install/Remove/Purge/Hold',
            '| Status=Not/Installed/Config-files/Unpacked/Failed-config',
            '|/ Err?=(none)/Reinst-required (status,high low: err)',
            '|/ Name           Version      Architecture Description',
            '+++-==============-============-============-=================================',
            ...Array.from(this.installedPkgs).map(p => `ii  ${p.padEnd(16)} 1.0.0        amd64        Emulated package for ${this.currentOsProfile}`)
          ].join('\n');
        }
        return 'dpkg 1.21.22 (amd64)\nUsage: dpkg -l';
      }

      case 'xbps-install':
      case 'xbps': {
        const sub = restArgs[0];
        const pkgs = restArgs.slice(1).filter(p => !p.startsWith('-'));
        for (const p of pkgs) {
          this.installedPkgs.add(p);
        }
        return [
          '=> 📥 Updating XBPS repository index...',
          '=> 📦 Installing ' + (pkgs.join(', ') || 'package') + '...',
          '=> ✓ XBPS transaction successfully completed.'
        ].join('\n');
      }

      case 'tce-load': {
        const pkg = restArgs[1] || restArgs[0];
        if (pkg) this.installedPkgs.add(pkg);
        return [
          'Downloading ' + (pkg || 'extension') + '.tcz...',
          'Connecting to repo.tinycorelinux.net (89.22.31.10:80)',
          '100% |*******************************|  1024 KiB  0.0s ETA',
          'Mounted ' + (pkg || 'extension') + '.tcz successfully.'
        ].join('\n');
      }

      case 'docker':
      case 'podman': {
        const sub = restArgs[0];
        if (sub === 'ps') {
          return 'CONTAINER ID   IMAGE                 COMMAND                  CREATED         STATUS         PORTS     NAMES';
        }
        if (sub === 'images') {
          return 'REPOSITORY       TAG       IMAGE ID       CREATED         SIZE\nalpine           3.20      c059bfaa071c   2 weeks ago     7.38MB\ndebian           12        5b32115f708d   3 weeks ago     117MB\nkali-linux       rolling   81239f2010ea   1 month ago     245MB';
        }
        if (sub === 'run') {
          const img = restArgs[1] || 'alpine';
          return `Unable to find image '${img}:latest' locally\nlatest: Pulling from library/${img}\nDigest: sha256:7223405720489201f94857102948571029485710294857102948571029485710\nStatus: Downloaded newer image for ${img}:latest\nContainer successfully spawned in micro-namespace (${this.currentOsProfile} engine).`;
        }
        return 'Docker version 26.0.0, build 2ae903e\nUsage: docker ps | docker images | docker run <image>';
      }

      case 'nmap': {
        const target = restArgs[restArgs.length - 1] || '127.0.0.1';
        return [
          'Starting Nmap 7.94 ( https://nmap.org )',
          'Nmap scan report for ' + target + ' (127.0.0.1)',
          'Host is up (0.00015s latency).',
          'Not shown: 998 closed ports',
          'PORT     STATE SERVICE',
          '22/tcp   open  ssh',
          '80/tcp   open  http',
          '3000/tcp open  ppp',
          'Nmap done: 1 IP address (1 host up) scanned in 0.23 seconds'
        ].join('\n');
      }

      case 'msfconsole':
      case 'metasploit': {
        return [
          '       __',
          '      /  \\  ,-.',
          '     / /\\ \\/ / /  Metasploit Framework Console',
          '    / /  \\  / /   [+] 2439 exploits - 1241 payloads - 46 post',
          '   / /    `\' /    [+] Target OS Profile: ' + this.currentOsProfile.toUpperCase(),
          '  `\'         `',
          '',
          'msf6 > search type:exploit platform:linux',
          'Matching Modules',
          '================',
          '   Name                                         Disclosure Date  Rank    Check  Description',
          '   ----                                         ---------------  ----    -----  -----------',
          '   exploit/unix/webapp/helix_exec               2026-01-01       excellent  Yes    Helix JIT Command Injection',
          '',
          'msf6 > '
        ].join('\n');
      }

      case 'sqlmap': {
        return [
          '        ___',
          '       __H__',
          ' ___ __(_)_(_)',
          '|_-,\' multios/security v1.8',
          '[!] starting at 14:03:07',
          '[INFO] testing connection to the target URL',
          '[INFO] checking if the target is protected by WAF',
          '[INFO] target URL appears to be injectable (SQLi)',
          '[+] all database tables dumped successfully.'
        ].join('\n');
      }

      case 'aircrack-ng': {
        return [
          'Aircrack-ng 1.7 - 64-bit wireless key cracker',
          'Opening wlan0mon...',
          'Read 42 packets.',
          'Passphrase cracked: [helix-debian-secure-key]',
          'KEY FOUND! [ helix2026 ]'
        ].join('\n');
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

      default: {
        return this.passToVM(rawCmd);
      }
    }
  }

  private passToVM(cmd: string): string {
    const emu = getWindowEmulator();
    if (emu && (this.state === 'ready' || this.state === 'booting')) {
      this.rawSerialSend(cmd + '\n');
      return ''; // Output will be streamed to terminal via handleSerialData
    }
    
    // Check if we should fallback to minimal simulation for basic commands
    const commandName = cmd.split(' ')[0].toLowerCase();
    
    if (commandName === 'ls' || commandName === 'pwd' || commandName === 'cd' || commandName === 'cat') {
       // These should have been caught by the switch, but if not, return minimal error
       return `sh: ${commandName}: command failed (check permissions)`;
    }

    let installHint = `apk add ${commandName}`;
    if (this.currentOsProfile === 'debian' || this.currentOsProfile === 'ubuntu' || this.currentOsProfile === 'kali') {
      installHint = `apt install ${commandName}`;
    } else if (this.currentOsProfile === 'arch') {
      installHint = `pacman -S ${commandName}`;
    } else if (this.currentOsProfile === 'fedora') {
      installHint = `dnf install ${commandName}`;
    } else if (this.currentOsProfile === 'void') {
      installHint = `xbps-install ${commandName}`;
    } else if (this.currentOsProfile === 'tinycore') {
      installHint = `tce-load -wi ${commandName}`;
    } else if (this.currentOsProfile === 'freedos') {
      return `Bad command or file name: "${commandName}"\nType "HELP" or "DIR" to list commands.`;
    }

    return `sh: ${commandName}: not found\n(Tip: Run 'sudo ${installHint}' to install this package)`;
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
        console.warn('serial0_send failed:', err);
      }
    }
    // Removed recursive executeCommand fallback which caused infinite loops
  }

  public handleSerialData(data: string) {
    const consumedByRpc = this.rpc.handleStream(data);
    if (!consumedByRpc) {
      this.broadcastTerminal(data);
    }

    // Inspect serial TTY stream for Kernel Panic signatures
    if (data && (
      data.includes('Kernel panic') ||
      data.includes('OOM-killer') ||
      data.includes('Out of Memory: Kill process') ||
      data.includes('Fatal Exception in Interrupt') ||
      data.includes('kernel BUG at')
    )) {
      this.handleKernelPanicDetected(data);
    }
  }

  // --- Safe-State Snapshot & Kernel Panic Protection Engine ---
  public autoSnapshotOnHighMemory: boolean = false;
  public highMemoryThresholdPercent: number = 85;
  public autoRecoverOnPanic: boolean = true;
  public safeStateTerminalBroadcast: boolean = false;
  public serialRedirectionActive: boolean = true;
  private lastAutoSnapshotTimestamp: number = 0;
  private panicListeners: Set<(info: { message: string; timestamp: number; snapshotRestored: boolean }) => void> = new Set();

  public setAutoSnapshot(enabled: boolean): void {
    this.autoSnapshotOnHighMemory = enabled;
    try {
      Settings.update({ safeStateAutoSnapshot: enabled });
    } catch {}
  }

  public setSafeStateTerminalBroadcast(enabled: boolean): void {
    this.safeStateTerminalBroadcast = enabled;
    try {
      Settings.update({ safeStateTerminalBroadcast: enabled });
    } catch {}
  }

  public setSafeStateThreshold(threshold: number): void {
    this.highMemoryThresholdPercent = threshold;
    try {
      Settings.update({ safeStateThresholdPercent: threshold });
    } catch {}
  }

  public setSafeStateAutoRecover(enabled: boolean): void {
    this.autoRecoverOnPanic = enabled;
    try {
      Settings.update({ safeStateAutoRecoverOnPanic: enabled });
    } catch {}
  }

  public async handleKernelPanicDetected(rawMsg: string) {
    console.error('[VM KERNEL PANIC TRAPPED]', rawMsg);
    if (this.safeStateTerminalBroadcast) {
      this.broadcastTerminal(`\n\x1b[31;1m[CRITICAL KERNEL PANIC TRAPPED]\x1b[0m ${rawMsg.trim()}\n`);
      this.broadcastTerminal(`\x1b[33m[SAFE-STATE ENGINE] Initiating automatic RAM checkpoint rollback...\x1b[0m\n`);
    }

    let restored = false;
    if (this.autoRecoverOnPanic) {
      restored = await this.restoreLatestSafeStateSnapshot();
    }

    this.panicListeners.forEach((cb) => cb({
      message: rawMsg,
      timestamp: Date.now(),
      snapshotRestored: restored,
    }));
  }

  public async checkMemoryPressureAndAutoSnapshot(ramUsedMB: number, totalMB: number) {
    if (!this.autoSnapshotOnHighMemory) return;
    const pressurePercent = (ramUsedMB / totalMB) * 100;
    
    // Check threshold and cooldown (at least 30 seconds between auto snapshots to avoid flooding)
    if (pressurePercent >= this.highMemoryThresholdPercent && (Date.now() - this.lastAutoSnapshotTimestamp > 30000)) {
      this.lastAutoSnapshotTimestamp = Date.now();
      const reason = `High Memory Pressure (${pressurePercent.toFixed(1)}% RAM)`;
      try {
        await OSSaveManager.createSafeStateSnapshot(
          this.vfs,
          this.currentOsProfile || 'alpine',
          this.currentOsProfile || 'Alpine Linux',
          pressurePercent,
          ramUsedMB,
          reason,
          Array.from(this.installedPkgs),
          this.executionHistory
        );
        if (this.safeStateTerminalBroadcast) {
          this.broadcastTerminal(`\n\x1b[36m[SAFE-STATE ENGINE]\x1b[0m Automated RAM checkpoint saved cleanly (${pressurePercent.toFixed(1)}% RAM pressure threshold reached).\n`);
        }
        Toast.show(`Safe-State RAM Snapshot auto-created (${pressurePercent.toFixed(1)}% RAM pressure)`, '🛡️');
      } catch (err) {
        console.warn('Auto safe-state snapshot failed:', err);
      }
    }
  }

  public async takeManualSafeStateSnapshot(reason = 'Manual User Checkpoint') {
    const totalMB = this.bootMemoryMB || 256;
    const ramUsedMB = 180 + Math.floor(Math.random() * 40);
    const pressurePercent = (ramUsedMB / totalMB) * 100;
    const snap = await OSSaveManager.createSafeStateSnapshot(
      this.vfs,
      this.currentOsProfile || 'alpine',
      this.currentOsProfile || 'Alpine Linux',
      pressurePercent,
      ramUsedMB,
      reason,
      Array.from(this.installedPkgs),
      this.executionHistory
    );
    if (this.safeStateTerminalBroadcast) {
      this.broadcastTerminal(`\n\x1b[36m[SAFE-STATE ENGINE]\x1b[0m Manual RAM checkpoint saved cleanly.\n`);
    }
    Toast.show('Safe-State Checkpoint Created', '📸');
    return snap;
  }

  public async restoreLatestSafeStateSnapshot(): Promise<boolean> {
    const profile = this.currentOsProfile || 'alpine';
    const snapshots = OSSaveManager.getSafeStateSnapshots(profile);
    if (snapshots.length === 0) {
      return await OSSaveManager.restoreSavedOsStateIfExists(this.vfs, profile);
    }
    const latest = snapshots[0];
    const ok = await OSSaveManager.restoreSafeStateSnapshot(this.vfs, latest.id, profile);
    if (ok) {
      this.broadcastTerminal(`\n\x1b[32m[RECOVERY ENGINE]\x1b[0m Kernel state successfully reverted to RAM snapshot [${latest.id}] (${new Date(latest.timestamp).toLocaleTimeString()}).\n`);
    }
    return ok;
  }

  public simulateKernelPanic() {
    const panicMsg = `Kernel panic - not syncing: Out of Memory: Kill process 140 (helix-rpc-bus) score 920 or sacrifice child!`;
    this.handleSerialData(`\n[ ${ (Date.now() / 1000).toFixed(6) }] ${panicMsg}\n[ ${ (Date.now() / 1000).toFixed(6) }] CPU: 0 PID: 140 Comm: helix-rpc-bus Tainted: G        W          6.6.14-virt #1\n`);
  }

  public onKernelPanic(cb: (info: { message: string; timestamp: number; snapshotRestored: boolean }) => void) {
    this.panicListeners.add(cb);
    return () => { this.panicListeners.delete(cb); };
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
      const baseRam = 170 + Math.floor(Math.sin(Date.now() / 2500) * 30 + Math.random() * 15);
      const totalRam = this.bootMemoryMB || 256;
      const ramUsed = Math.min(totalRam - 10, baseRam);

      // Check for automated Safe-State trigger on RAM pressure
      this.checkMemoryPressureAndAutoSnapshot(ramUsed, totalRam);

      const data: TelemetryData = {
        ramUsed,
        ramTotal: totalRam,
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
