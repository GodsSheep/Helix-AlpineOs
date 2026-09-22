export interface EmulatorConfig {
  id: string;
  name: string;
  engine: 'v86' | 'cheerpx' | 'pce' | 'pcjs' | 'jslinux';
  osName: string;
  clockSpeed: string;
  ram: string;
  icon: string;
  prompt: string;
  description: string;
}

export const EmulatorRegistry: EmulatorConfig[] = [
  {
    id: 'x86-alpine',
    name: 'Intel x86 (IA-32)',
    engine: 'jslinux',
    osName: 'Alpine Linux 3.20 (JSLinux)',
    clockSpeed: '800 MHz',
    ram: '128 MB',
    icon: '⚙️',
    prompt: 'localhost:~# ',
    description: 'Fabrice Bellard original WASM-based Linux runtime.'
  },
  {
    id: 'riscv64',
    name: 'RISC-V 64-bit',
    engine: 'jslinux',
    osName: 'Buildroot Linux 6.1.0',
    clockSpeed: '1.2 GHz',
    ram: '256 MB',
    icon: '🔬',
    prompt: 'buildroot# ',
    description: '64-bit RISC-V OpenSBI environment.'
  },
  {
    id: 'freedos',
    name: 'FreeDOS 1.3',
    engine: 'v86',
    osName: 'FreeDOS Kernel v2043',
    clockSpeed: '33 MHz',
    ram: '16 MB',
    icon: '💾',
    prompt: 'C:\\> ',
    description: 'Classic 16-bit DOS environment.'
  },
  {
    id: 'webvm-linux',
    name: 'WebVM Linux',
    engine: 'cheerpx',
    osName: 'Debian 12 (CheerpX)',
    clockSpeed: '2.5 GHz',
    ram: '512 MB',
    icon: '🌐',
    prompt: 'user@webvm:~$ ',
    description: 'Full Linux Debian environment via CheerpX hypervisor.'
  },
  {
    id: 'pce-mac',
    name: 'PCE.js Mac',
    engine: 'pce',
    osName: 'System 6.0.8',
    clockSpeed: '8 MHz',
    ram: '4 MB',
    icon: '🍎',
    prompt: 'Finder',
    description: '1980s Macintosh emulation.'
  }
];
