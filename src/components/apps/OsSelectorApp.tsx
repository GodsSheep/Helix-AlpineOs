import React, { useState, useEffect } from 'react';
import { 
  Shield, Cpu, CheckCircle2, RotateCw, Server, Flame, Sparkles, 
  ExternalLink, Download, HardDrive, Settings, Zap, Play, Terminal, 
  Sliders, AlertTriangle, FileCode, Check, RefreshCw, Layers, Monitor,
  HelpCircle
} from 'lucide-react';
import { Kernel } from '../../kernel';
import { BIOS_PROFILES, BiosProfile, AdvancedBootOptions } from '../../kernel/VM';
import { MultiBootAssistantApp } from './MultiBootAssistantApp';

export interface OSProfile {
  id: string;
  name: string;
  tagline: string;
  version: string;
  kernel: string;
  icon: string;
  accent: string;
  badgeColor: string;
  description: string;
  features: string[];
  recommendedFor: string;
  recommendedMemoryMB: number;
  recommendedBiosId: string;
  downloadUrl: string;
  defaultIsoUrl?: string;
}

const ALL_OS_PROFILES: OSProfile[] = [
  {
    id: 'alpine',
    name: 'Helix Alpine',
    tagline: 'Ultralight security-oriented Linux',
    version: '3.20.0 (x86_64)',
    kernel: 'Linux 6.6.14-virt',
    icon: '🏔️',
    accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'The native Helix baseline distribution. Optimized for extreme memory efficiency, instant boot times, and robust containerization.',
    features: ['Musl libc / BusyBox', 'OpenRC Init System', 'Apk Package Manager', 'Zero-latency Virtualization'],
    recommendedFor: 'General development, scripts, and ultra-fast container workloads.',
    recommendedMemoryMB: 256,
    recommendedBiosId: 'seabios-std',
    downloadUrl: 'https://alpinelinux.org/downloads/',
    defaultIsoUrl: '/v86/linux3.iso'
  },
  {
    id: 'kali',
    name: 'Helix Kali',
    tagline: 'Advanced Penetration Testing & Security',
    version: '2024.1 Rolling',
    kernel: 'Linux 6.6.15-kali',
    icon: '🐉',
    accent: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    description: 'Security-hardened environment configured with simulated penetration testing toolchains, network analyzers, and audit utilities.',
    features: ['Custom Security Toolchain', 'Nmap & Metasploit Stubs', 'Advanced Packet Analyzers', 'Hardened Network Stack'],
    recommendedFor: 'Security auditing, ethical hacking simulations, and network diagnostics.',
    recommendedMemoryMB: 512,
    recommendedBiosId: 'seabios-acpi',
    downloadUrl: 'https://www.kali.org/get-kali/',
    defaultIsoUrl: 'https://copy.sh/v86/images/linux.iso'
  },
  {
    id: 'debian',
    name: 'Helix Debian',
    tagline: 'The Universal Operating System',
    version: '12 (Bookworm)',
    kernel: 'Linux 6.1.0-18-amd64',
    icon: '🌀',
    accent: 'from-red-500/20 to-rose-500/10 border-red-500/30 text-rose-400',
    badgeColor: 'bg-red-500/20 text-rose-300 border-red-500/30',
    description: 'Rock-solid stable GNU/Linux distribution equipped with comprehensive developer libraries, APT package management, and robust server daemons.',
    features: ['APT Package Manager', 'GNU Coreutils 9.1', 'Enterprise Server Daemons', 'Maximum Stability'],
    recommendedFor: 'Production backend simulations, multi-service deployment, and robust scripting.',
    recommendedMemoryMB: 512,
    recommendedBiosId: 'bios-csm',
    downloadUrl: 'https://www.debian.org/distrib/',
    defaultIsoUrl: 'https://copy.sh/v86/images/linux.iso'
  },
  {
    id: 'ubuntu',
    name: 'Helix Ubuntu',
    tagline: 'Linux for human beings & cloud scale',
    version: '24.04 LTS (Noble)',
    kernel: 'Linux 6.8.0-31-generic',
    icon: '🟠',
    accent: 'from-orange-500/20 to-amber-500/10 border-orange-500/30 text-orange-400',
    badgeColor: 'bg-orange-500/20 text-amber-300 border-orange-500/30',
    description: 'Popular developer ecosystem featuring modern toolchains, extensive PPA compatibility, and seamless cloud-native integrations.',
    features: ['Latest GCC / LLVM Stacks', 'Snap & APT Support', 'Cloud-Init Ready', 'Extended Long-Term Support'],
    recommendedFor: 'Modern full-stack application builds, CI/CD pipelines, and cloud testing.',
    recommendedMemoryMB: 512,
    recommendedBiosId: 'bios-csm',
    downloadUrl: 'https://ubuntu.com/download/server',
    defaultIsoUrl: 'https://copy.sh/v86/images/linux.iso'
  },
  {
    id: 'arch',
    name: 'Helix Arch',
    tagline: 'Bleeding edge rolling release',
    version: 'Rolling (Pacman)',
    kernel: 'Linux 6.8.9-arch1',
    icon: '🏹',
    accent: 'from-sky-500/20 to-blue-500/10 border-sky-500/30 text-sky-400',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    description: 'Simplicity and bleeding edge packages. Equipped with Pacman package manager and customizable rolling stack.',
    features: ['Pacman Package Manager', 'Rolling Release Kernel', 'Arch Build System (ABS)', 'Minimalist Core'],
    recommendedFor: 'Cutting-edge compilation, custom kernel tweaking, and modern software testing.',
    recommendedMemoryMB: 512,
    recommendedBiosId: 'seabios-acpi',
    downloadUrl: 'https://archlinux.org/download/',
    defaultIsoUrl: 'https://copy.sh/v86/images/linux.iso'
  },
  {
    id: 'fedora',
    name: 'Helix Fedora',
    tagline: 'Enterprise innovation & modern RPM',
    version: '40 (Workstation)',
    kernel: 'Linux 6.8.5-fedora',
    icon: '🎩',
    accent: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description: 'Upstream enterprise distribution with DNF5 and modern RPM package management suite.',
    features: ['DNF5 High-Speed Solver', 'Systemd Modern Daemons', 'SELinux Hardening Modules', 'Enterprise Ready'],
    recommendedFor: 'Enterprise server workloads, RPM ecosystem tooling, and Red Hat development.',
    recommendedMemoryMB: 512,
    recommendedBiosId: 'bios-csm',
    downloadUrl: 'https://fedoraproject.org/',
    defaultIsoUrl: 'https://copy.sh/v86/images/linux.iso'
  },
  {
    id: 'void',
    name: 'Helix Void',
    tagline: 'Independent Linux distribution',
    version: '20240314 (Musl/Runit)',
    kernel: 'Linux 6.6.21_1',
    icon: '⚛️',
    accent: 'from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 text-purple-400',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Blazing fast independent distribution using the XBPS package manager and Runit init system. Designed for purists who demand speed.',
    features: ['XBPS Package Manager', 'Runit Init Daemons', 'Native Musl Build', 'Minimalist Footprint'],
    recommendedFor: 'Low-overhead benchmarking and lightning-fast minimalist execution.',
    recommendedMemoryMB: 256,
    recommendedBiosId: 'seabios-std',
    downloadUrl: 'https://voidlinux.org/download/',
    defaultIsoUrl: 'https://copy.sh/v86/images/linux.iso'
  },
  {
    id: 'tinycore',
    name: 'Helix Tiny Core',
    tagline: 'Ultra-small modular operating system',
    version: '15.0 (In-Memory)',
    kernel: 'Linux 6.6.8-tinycore',
    icon: '⚡',
    accent: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-400',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    description: 'Runs entirely in RAM from a tiny compressed image. Boots in under 1 second with near-instantaneous command response.',
    features: ['100% RAM Execution', 'Micro-Kernel Footprint', 'TCE Extension Mounts', 'Instantaneous Reboots'],
    recommendedFor: 'Embedded system emulation and extreme memory constraints.',
    recommendedMemoryMB: 128,
    recommendedBiosId: 'seabios-std',
    downloadUrl: 'http://www.tinycorelinux.net/downloads.html',
    defaultIsoUrl: 'https://copy.sh/v86/images/tinycore.iso'
  },
  {
    id: 'microkernel',
    name: 'Helix MicroKernel',
    tagline: 'Real-Time RT-Preempt & Capability Sandbox',
    version: '6.8.0-rt (Capability)',
    kernel: 'Helix-MK 6.8.0-rt',
    icon: '🛡️',
    accent: 'from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-400',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    description: 'Hardened microkernel architecture with real-time preemption, isolated address spaces, and fine-grained capability tokens.',
    features: ['Capability-Based Security', 'Zero-Jitter Microtimer', 'Hardware IRQ Isolation', 'VirtIO Direct Access'],
    recommendedFor: 'High-security micro-services, real-time audio/processing, and fault isolation.',
    recommendedMemoryMB: 256,
    recommendedBiosId: 'bios-rt',
    downloadUrl: 'https://helix.os/',
    defaultIsoUrl: 'https://copy.sh/v86/images/linux.iso'
  },
  {
    id: 'freedos',
    name: 'Helix FreeDOS',
    tagline: '16/32-bit Legacy Real-Mode Compatibility',
    version: '1.3 (Retro AT)',
    kernel: 'FreeDOS Kernel 2043',
    icon: '💾',
    accent: 'from-lime-500/20 to-green-500/10 border-lime-500/30 text-lime-400',
    badgeColor: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
    description: 'Complete open-source DOS compatible environment for running retro x86 utilities, games, and real-mode assemblies.',
    features: ['Real-Mode 16/32-bit Execution', 'COMMAND.COM Shell', 'Direct Int-21h Calls', 'FAT16/FAT32 Support'],
    recommendedFor: 'Retro computing, vintage software execution, and low-level 16-bit x86 testing.',
    recommendedMemoryMB: 64,
    recommendedBiosId: 'bios-retro',
    downloadUrl: 'https://www.freedos.org/download/',
    defaultIsoUrl: 'https://copy.sh/v86/images/freedos.img'
  },
  {
    id: 'kolibri',
    name: 'Helix KolibriOS',
    tagline: 'Ultra-fast Assembly Desktop Operating System',
    version: '0.7.7.0 (FASM)',
    kernel: 'Kolibri ASM Kernel',
    icon: '🐦',
    accent: 'from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-400',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    description: 'Written entirely in 100% x86 assembly language. Boots in milliseconds and includes a full windowed graphical desktop.',
    features: ['100% Native Assembly', 'Instant Millisecond Boot', 'Built-in GUI Desktop & Apps', 'Minimal RAM Footprint'],
    recommendedFor: 'Assembly experiments, lightweight desktop gaming, and ultra-responsive demos.',
    recommendedMemoryMB: 64,
    recommendedBiosId: 'vgabios-vesa',
    downloadUrl: 'https://kolibrios.org/en/download',
    defaultIsoUrl: 'https://copy.sh/v86/images/kolibri.img'
  },
  {
    id: 'custom',
    name: 'Custom OS / Raw ISO',
    tagline: 'Universal bootloader for any x86 ISO or Disk Image',
    version: 'User Provided Image',
    kernel: 'External / Custom Kernel',
    icon: '💿',
    accent: 'from-slate-500/20 to-zinc-500/10 border-slate-500/30 text-slate-300',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    description: 'Directly boot any x86/x86_64 compatible ISO, IMG, or VFD disk image from local storage or remote URL.',
    features: ['Raw ISO/IMG Buffer Mounting', 'Custom BIOS & RAM Selection', 'Flexible Boot Priority', 'Custom Kernel CMDLINE'],
    recommendedFor: 'Testing custom operating systems, Linux live CDs, and recovery disks.',
    recommendedMemoryMB: 256,
    recommendedBiosId: 'seabios-std',
    downloadUrl: 'https://copy.sh/v86/images/linux.iso',
    defaultIsoUrl: ''
  }
];

export const OsSelectorApp: React.FC = () => {
  const currentActive = Kernel.vm.currentOsProfile || 'alpine';
  const [selectedId, setSelectedId] = useState<string>(currentActive);
  const [isBooting, setIsBooting] = useState<boolean>(false);
  const [bootStatus, setBootStatus] = useState<string>('');
  const [bootProgress, setBootProgress] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'profiles' | 'bios' | 'advanced' | 'assistant'>('profiles');

  // Custom Boot & Hardware Parameters
  const [customISOUrl, setCustomISOUrl] = useState<string>('');
  const [customISOFile, setCustomISOFile] = useState<File | null>(null);
  const [selectedBiosId, setSelectedBiosId] = useState<string>(Kernel.vm.currentBiosId || 'seabios-std');
  const [memoryMB, setMemoryMB] = useState<number>(Kernel.vm.bootMemoryMB || 256);
  const [vgaMemoryMB, setVgaMemoryMB] = useState<number>(Kernel.vm.bootVgaMemoryMB || 16);
  const [cmdline, setCmdline] = useState<string>(Kernel.vm.bootCmdline || 'console=ttyS0 root=/dev/sr0 ro quiet init=/sbin/init');
  const [bootOrder, setBootOrder] = useState<'cdrom' | 'hda' | 'fda'>(Kernel.vm.bootOrder || 'cdrom');
  const [acpi, setAcpi] = useState<boolean>(Kernel.vm.acpiEnabled !== false);
  const [apic, setApic] = useState<boolean>(Kernel.vm.apicEnabled !== false);
  const [hardwareWarning, setHardwareWarning] = useState<string | null>(null);

  const activeProfile = ALL_OS_PROFILES.find(p => p.id === selectedId) || ALL_OS_PROFILES[0];
  const activeBios = BIOS_PROFILES.find(b => b.id === selectedBiosId) || BIOS_PROFILES[0];

  // Auto-tune hardware defaults when user picks an OS profile
  useEffect(() => {
    if (activeProfile.recommendedBiosId) {
      setSelectedBiosId(activeProfile.recommendedBiosId);
    }
    if (activeProfile.recommendedMemoryMB && memoryMB < activeProfile.recommendedMemoryMB) {
      setMemoryMB(activeProfile.recommendedMemoryMB);
    }
  }, [selectedId]);

  // Compatibility validator
  useEffect(() => {
    if (activeProfile.recommendedMemoryMB && memoryMB < activeProfile.recommendedMemoryMB) {
      setHardwareWarning(`Target OS recommends at least ${activeProfile.recommendedMemoryMB} MB RAM (Current: ${memoryMB} MB).`);
    } else {
      setHardwareWarning(null);
    }
  }, [selectedId, memoryMB]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomISOFile(file);
      setCustomISOUrl('');
      setSelectedId('custom');
    }
  };

  const handleBoot = async () => {
    setIsBooting(true);
    setBootProgress(15);
    setBootStatus(`1/5 Configuring BIOS firmware: ${activeBios.name}...`);
    await new Promise(r => setTimeout(r, 350));
    
    setBootProgress(35);
    setBootStatus(`2/5 Allocating ${memoryMB} MB RAM & setting up VirtIO devices...`);
    await new Promise(r => setTimeout(r, 350));

    const isoToBoot = customISOFile || (customISOUrl ? customISOUrl : activeProfile.defaultIsoUrl);
    
    setBootProgress(60);
    if (customISOFile) {
      setBootStatus(`3/5 Mounting local image: ${customISOFile.name} (${(customISOFile.size / (1024*1024)).toFixed(1)} MB)...`);
    } else if (customISOUrl) {
      setBootStatus(`3/5 Fetching remote image descriptor: ${customISOUrl}...`);
    } else {
      setBootStatus(`3/5 Mounting ${activeProfile.name} filesystem & kernel image...`);
    }
    await new Promise(r => setTimeout(r, 400));

    setBootProgress(85);
    setBootStatus(`4/5 Booting ${activeProfile.name} (${activeProfile.version})...`);

    const advancedOpts: AdvancedBootOptions = {
      biosPreset: selectedBiosId,
      biosUrl: activeBios.romUrl,
      vgaBiosUrl: activeBios.vgaRomUrl,
      memoryMB,
      vgaMemoryMB,
      cmdline,
      bootOrder,
      acpi,
      apic,
      customIso: isoToBoot
    };

    try {
      await Kernel.vm.rebootWithProfile(selectedId, isoToBoot, advancedOpts);
      setBootProgress(100);
      setBootStatus(`5/5 ${activeProfile.name} is online and ready!`);
      await new Promise(r => setTimeout(r, 600));
    } catch (e: any) {
      setBootStatus(`Boot notice: ${e?.message || 'Boot completed with soft-init fallback'}`);
    } finally {
      setIsBooting(false);
      setBootProgress(0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] text-white select-none overflow-y-auto p-5 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-white/10 gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <span>Multi-OS Boot Hub & BIOS Firmware Manager</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono font-normal">
                  v86 Hybrid x86
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Switch Linux distros, real-time microkernels, retro systems, or boot custom ISO images with dedicated BIOS firmware.
              </p>
            </div>
          </div>
        </div>

        {/* Status Badge & View Mode Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-gray-400 font-mono">Running: <strong className="text-emerald-400 uppercase">{currentActive}</strong></span>
          </div>

          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('profiles')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'profiles' ? 'bg-[var(--accent)] text-black font-bold shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>OS Profiles</span>
            </button>
            <button
              onClick={() => setActiveTab('bios')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'bios' ? 'bg-[var(--accent)] text-black font-bold shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>BIOS Firmware</span>
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'advanced' ? 'bg-[var(--accent)] text-black font-bold shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Boot Parameters</span>
            </button>
            <button
              onClick={() => setActiveTab('assistant')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'assistant' ? 'bg-[var(--accent)] text-black font-bold shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Smart Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab 1: OS Profiles */}
      {activeTab === 'profiles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
             {ALL_OS_PROFILES.map((profile) => {
              const isSelected = selectedId === profile.id;
              const isActiveNow = currentActive === profile.id;

              let name = profile.name;
              let version = profile.version;
              let description = profile.description;
              if (profile.id === 'custom') {
                const info = Kernel.vm.parseCustomOsInfo();
                name = info.name;
                version = info.version;
                description = info.tagline || profile.description;
              }

              return (
                <div
                  key={profile.id}
                  onClick={() => setSelectedId(profile.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                    isSelected
                      ? 'bg-gradient-to-br ' + profile.accent + ' ring-2 ring-[var(--accent)] shadow-xl shadow-black/60'
                      : 'bg-[#111625]/80 border-white/5 hover:bg-[#151c2e] hover:border-white/15'
                  }`}
                >
                  {isActiveNow && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="text-2xl p-2 rounded-xl bg-black/40 border border-white/10">{profile.icon}</span>
                      <div>
                        <h2 className="font-bold text-sm text-white flex items-center gap-1.5">
                          {name}
                        </h2>
                        <span className="text-[10px] font-mono text-gray-400">{version}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 mb-3 line-clamp-2 leading-relaxed">
                      {description}
                    </p>

                    <div className="space-y-1 mb-3">
                      {profile.features.slice(0, 2).map((feat, idx) => (
                        <div key={idx} className="text-[11px] text-gray-400 flex items-center gap-1.5 font-mono">
                          <span className="w-1 h-1 rounded-full bg-[var(--accent)]"></span>
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-gray-400">{profile.kernel}</span>
                    <span className={`font-semibold ${isSelected ? 'text-[var(--accent)]' : 'text-gray-400 group-hover:text-white'}`}>
                      {isSelected ? '✓ Selected' : 'Select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Tab 2: BIOS Firmware */}
      {activeTab === 'bios' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 mb-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Available x86 BIOS & Firmware ROMs</span>
            </h2>
            <p className="text-xs text-gray-400">
              Select or customize the hardware BIOS image loaded into memory at startup. Every ROM is pre-bundled and fully compatible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {BIOS_PROFILES.map((bios) => {
              const isSelected = selectedBiosId === bios.id;
              const isRecommended = activeProfile.recommendedBiosId === bios.id;

              return (
                <div
                  key={bios.id}
                  onClick={() => setSelectedBiosId(bios.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/50 ring-2 ring-cyan-400 shadow-xl shadow-cyan-950/30'
                      : 'bg-[#111625]/80 border-white/5 hover:bg-[#151c2e] hover:border-white/15'
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                      Recommended for {activeProfile.name}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10 text-cyan-400">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{bios.name}</h3>
                        <span className="text-[10px] font-mono text-gray-400">{bios.vendor} ({bios.version})</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                      {bios.description}
                    </p>

                    <div className="space-y-1 mb-3">
                      {bios.features.map((f, idx) => (
                        <div key={idx} className="text-[10px] text-gray-400 flex items-center gap-1.5 font-mono">
                          <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400">ROM: {bios.romUrl}</span>
                    <span className={`font-semibold ${isSelected ? 'text-cyan-400' : 'text-gray-400'}`}>
                      {isSelected ? '✓ Active ROM' : 'Use this BIOS'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Tab 3: Advanced Boot Parameters */}
      {activeTab === 'advanced' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RAM Memory Allocation */}
            <div className="p-4 rounded-2xl bg-[#111625]/90 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Virtual RAM Memory Allocation</span>
                </label>
                <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  {memoryMB} MB
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Adjust the memory mapped to the x86 physical address space. Light distros need 64-128MB; modern distros work best at 512MB+.
              </p>
              <div className="grid grid-cols-5 gap-2 pt-1">
                {[64, 128, 256, 512, 1024].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMemoryMB(m)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition border ${
                      memoryMB === m
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-black/30 border-white/10 text-gray-400 hover:bg-black/50 hover:text-white'
                    }`}
                  >
                    {m} MB
                  </button>
                ))}
              </div>
            </div>

            {/* Video RAM & Graphics BIOS */}
            <div className="p-4 rounded-2xl bg-[#111625]/90 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span>Video Graphics RAM & VESA Buffer</span>
                </label>
                <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                  {vgaMemoryMB} MB
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Sets the frame-buffer memory for VESA 3.0 Linear high-resolution graphics and terminal video refresh.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[8, 16, 32].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVgaMemoryMB(v)}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-bold transition border ${
                      vgaMemoryMB === v
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-black/30 border-white/10 text-gray-400 hover:bg-black/50 hover:text-white'
                    }`}
                  >
                    {v} MB VRAM
                  </button>
                ))}
              </div>
            </div>

            {/* Kernel Command Line Arguments */}
            <div className="p-4 rounded-2xl bg-[#111625]/90 border border-white/10 space-y-2">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-yellow-400" />
                <span>Kernel Command Line Parameters (CMDLINE)</span>
              </label>
              <input
                type="text"
                value={cmdline}
                onChange={(e) => setCmdline(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[var(--accent)] outline-none"
                placeholder="console=ttyS0 root=/dev/sr0 ro quiet init=/sbin/init"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  onClick={() => setCmdline('console=ttyS0 root=/dev/sr0 ro quiet init=/sbin/init')}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-gray-300 border border-white/10"
                >
                  Standard Quiet
                </button>
                <button
                  onClick={() => setCmdline('console=ttyS0 root=/dev/sr0 debug apic=verbose systemd.log_level=debug')}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-gray-300 border border-white/10"
                >
                  Verbose Debug
                </button>
                <button
                  onClick={() => setCmdline('console=ttyS0 root=/dev/sr0 single init=/bin/sh')}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-gray-300 border border-white/10"
                >
                  Single User (/bin/sh)
                </button>
              </div>
            </div>

            {/* Hardware Acceleration & Flags */}
            <div className="p-4 rounded-2xl bg-[#111625]/90 border border-white/10 space-y-3">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span>Hardware Acceleration & ACPI Subsystem</span>
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acpi}
                    onChange={(e) => setAcpi(e.target.checked)}
                    className="rounded bg-black/40 border-white/20 text-[var(--accent)] focus:ring-0"
                  />
                  <span>Enable ACPI 2.0 (FADT, DSDT, MADT Tables)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={apic}
                    onChange={(e) => setApic(e.target.checked)}
                    className="rounded bg-black/40 border-white/20 text-[var(--accent)] focus:ring-0"
                  />
                  <span>Enable Advanced Programmable Interrupt Controller (APIC)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* External ISO & File Upload Section */}
      <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Attach Custom ISO Image or Remote URL
            </span>
          </div>
          {customISOFile && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              Attached: {customISOFile.name} ({(customISOFile.size / (1024*1024)).toFixed(1)} MB)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* File Upload Button */}
          <div className="flex gap-2">
            <label className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl px-4 py-2.5 text-xs text-white cursor-pointer transition flex items-center gap-2 overflow-hidden">
              <Download className="w-4 h-4 shrink-0 text-cyan-400" />
              <span className="truncate">{customISOFile ? customISOFile.name : 'Upload Local .ISO / .IMG / .BIN File...'}</span>
              <input type="file" accept=".iso,.img,.bin,.vfd" onChange={handleFileChange} className="hidden" />
            </label>
            {customISOFile && (
              <button 
                onClick={() => setCustomISOFile(null)}
                className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition text-xs font-bold"
                title="Remove attached file"
              >
                ✕
              </button>
            )}
          </div>

          {/* Remote URL input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://example.com/custom.iso (CORS supported)"
              value={customISOUrl}
              onChange={(e) => {
                setCustomISOUrl(e.target.value);
                if (e.target.value) {
                  setCustomISOFile(null);
                  setSelectedId('custom');
                }
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-[var(--accent)] outline-none"
            />
          </div>
        </div>

        {/* Verified Catalog Quick Boot Links */}
        <div className="pt-2 border-t border-white/5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
            Instant 1-Click Compatible Images
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {[
              { name: 'Tiny Core Linux', url: 'https://copy.sh/v86/images/tinycore.iso', size: '16 MB', profile: 'tinycore' },
              { name: 'Alpine Linux Virt', url: '/v86/linux3.iso', size: '8.6 MB', profile: 'alpine' },
              { name: 'Generic Buildroot', url: 'https://copy.sh/v86/images/linux.iso', size: '32 MB', profile: 'kali' },
              { name: 'FreeDOS 1.3 Disk', url: 'https://copy.sh/v86/images/freedos.img', size: '1.44 MB', profile: 'freedos' },
              { name: 'KolibriOS Desktop', url: 'https://copy.sh/v86/images/kolibri.img', size: '1.44 MB', profile: 'kolibri' }
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCustomISOUrl(item.url);
                  setCustomISOFile(null);
                  setSelectedId(item.profile);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-start gap-0.5 text-left transition group"
              >
                <span className="text-[11px] font-bold text-white group-hover:text-[var(--accent)] truncate w-full">{item.name}</span>
                <span className="text-[9px] font-mono text-gray-400">{item.size}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Tab 4: Smart Assistant */}
      {activeTab === 'assistant' && (
        <div className="rounded-2xl border border-white/10 overflow-hidden min-h-[440px]">
          <MultiBootAssistantApp />
        </div>
      )}

      {/* Selected OS Details & Boot Control Bar */}
      <div className="p-4 rounded-2xl bg-black/60 border border-white/15 flex flex-col gap-3 mt-4">
        {hardwareWarning && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{hardwareWarning}</span>
            </div>
            <button
              onClick={() => setMemoryMB(activeProfile.recommendedMemoryMB)}
              className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-[10px] font-bold text-amber-200 border border-amber-500/40"
            >
              Set to {activeProfile.recommendedMemoryMB} MB
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2.5 rounded-2xl bg-white/5 border border-white/10">{activeProfile.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Target: {activeProfile.name} ({activeProfile.version})</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  BIOS: {activeBios.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {memoryMB} MB RAM
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                <strong>Recommended for:</strong> {activeProfile.recommendedFor}
              </p>
              {bootStatus && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <p className="text-xs font-mono text-emerald-400">{bootStatus}</p>
                  </div>
                  {bootProgress > 0 && (
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-emerald-400 h-full transition-all duration-300 ease-out" 
                        style={{ width: `${bootProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href={activeProfile.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl font-medium text-xs bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Official ISO</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </a>

            <button
              disabled={isBooting}
              onClick={handleBoot}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-lg ${
                isBooting
                  ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                  : 'bg-[var(--accent)] text-black hover:opacity-90 active:scale-95'
              }`}
            >
              {isBooting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Booting {activeProfile.name}...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Boot {activeProfile.name} Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
