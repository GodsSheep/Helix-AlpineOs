import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, Cpu, Zap, Shield, CheckCircle2, AlertTriangle, 
  RefreshCw, Play, Sliders, HardDrive, Terminal, Layers, ArrowRight,
  Sparkles, Check, Info, Monitor, Wrench
} from 'lucide-react';
import { Kernel } from '../../kernel';
import { BIOS_PROFILES } from '../../kernel/VM';

export const MultiBootAssistantApp: React.FC = () => {
  const [deviceMem, setDeviceMem] = useState<number>(4);
  const [cores, setCores] = useState<number>(4);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [storageQuota, setStorageQuota] = useState<{ usage: string; quota: string }>({ usage: '0 MB', quota: 'Unlimited' });
  const [selectedTopic, setSelectedTopic] = useState<string>('optimizer');
  const [tuningStatus, setTuningStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      if ('deviceMemory' in navigator) {
        setDeviceMem((navigator as any).deviceMemory || 4);
      }
      if ('hardwareConcurrency' in navigator) {
        setCores(navigator.hardwareConcurrency || 4);
      }
      setIsOnline(navigator.onLine);
      
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then((est) => {
          if (est.usage !== undefined && est.quota !== undefined) {
            setStorageQuota({
              usage: `${Math.round(est.usage / (1024 * 1024))} MB`,
              quota: `${Math.round(est.quota / (1024 * 1024))} MB`
            });
          }
        }).catch(() => {});
      }
    }
  }, []);

  const handleAutoTune = (profileId: string) => {
    let optimalMem = 256;
    let optimalBios = 'seabios-std';
    let optimalVram = 16;
    let optimalCmdline = 'console=ttyS0 root=/dev/sr0 ro quiet init=/sbin/init';

    if (deviceMem <= 2) {
      optimalMem = profileId === 'tinycore' ? 128 : (profileId === 'freedos' ? 64 : 256);
    } else if (deviceMem >= 8) {
      optimalMem = (profileId === 'kali' || profileId === 'debian' || profileId === 'ubuntu' || profileId === 'arch' || profileId === 'fedora') ? 512 : 256;
    }

    if (profileId === 'kali' || profileId === 'arch') {
      optimalBios = 'seabios-acpi';
    } else if (profileId === 'debian' || profileId === 'ubuntu' || profileId === 'fedora') {
      optimalBios = 'bios-csm';
    } else if (profileId === 'microkernel') {
      optimalBios = 'bios-rt';
    } else if (profileId === 'freedos') {
      optimalBios = 'bios-retro';
    } else if (profileId === 'kolibri') {
      optimalBios = 'vgabios-vesa';
      optimalVram = 32;
    }

    Kernel.vm.setBootOptions({
      memoryMB: optimalMem,
      biosPreset: optimalBios,
      vgaMemoryMB: optimalVram,
      cmdline: optimalCmdline,
      acpi: true,
      apic: true
    });

    setTuningStatus(`Configured ${profileId.toUpperCase()}: ${optimalMem}MB RAM, ${optimalBios} ROM, ${optimalVram}MB VRAM`);
    setTimeout(() => setTuningStatus(null), 4000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] text-white select-none overflow-y-auto p-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>Multi-Boot Assistant & Diagnostics</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                Active Helper
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Intelligent optimization, hardware recommendations, and troubleshooting for multi-OS boot environments.
            </p>
          </div>
        </div>

        {/* Navigation pills */}
        <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setSelectedTopic('optimizer')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              selectedTopic === 'optimizer' ? 'bg-[var(--accent)] text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Optimizer</span>
          </button>
          <button
            onClick={() => setSelectedTopic('firmware')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              selectedTopic === 'firmware' ? 'bg-[var(--accent)] text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>BIOS Matrix</span>
          </button>
          <button
            onClick={() => setSelectedTopic('troubleshoot')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              selectedTopic === 'troubleshoot' ? 'bg-[var(--accent)] text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Troubleshooter</span>
          </button>
        </div>
      </div>

      {/* Device Capabilities Snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-2xl bg-black/30 border border-white/10 flex items-center gap-3">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="text-[10px] text-gray-400 block uppercase font-mono">Host Concurrency</span>
            <span className="text-xs font-bold text-white font-mono">{cores} vCPU Threads</span>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-black/30 border border-white/10 flex items-center gap-3">
          <Layers className="w-5 h-5 text-emerald-400" />
          <div>
            <span className="text-[10px] text-gray-400 block uppercase font-mono">Device Memory</span>
            <span className="text-xs font-bold text-white font-mono">~{deviceMem} GB RAM</span>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-black/30 border border-white/10 flex items-center gap-3">
          <HardDrive className="w-5 h-5 text-purple-400" />
          <div>
            <span className="text-[10px] text-gray-400 block uppercase font-mono">VFS Cache Quota</span>
            <span className="text-xs font-bold text-white font-mono">{storageQuota.usage} / {storageQuota.quota}</span>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-black/30 border border-white/10 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <div>
            <span className="text-[10px] text-gray-400 block uppercase font-mono">PWA Offline Mode</span>
            <span className="text-xs font-bold text-white font-mono">{isOnline ? 'Online / Sync Ready' : 'Offline Cached'}</span>
          </div>
        </div>
      </div>

      {tuningStatus && (
        <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{tuningStatus}</span>
        </div>
      )}

      {/* Tab 1: Auto-Optimizer */}
      {selectedTopic === 'optimizer' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#12192c] to-[#0d1322] border border-cyan-500/20">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <span>Smart OS Hardware Tuning Engine</span>
            </h2>
            <p className="text-xs text-gray-300 mb-3">
              Click any distribution below to automatically compute and apply the optimal BIOS firmware, RAM buffer, and kernel boot flags for your device.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[
                { id: 'alpine', name: 'Helix Alpine 3.20', badge: 'Ultra-Fast Baseline', ram: '256 MB', bios: 'SeaBIOS Std', tag: 'Fastest' },
                { id: 'kali', name: 'Helix Kali Rolling', badge: 'Security Audit Suite', ram: '512 MB', bios: 'ACPI 2.0 PAE', tag: 'Security' },
                { id: 'debian', name: 'Helix Debian 12', badge: 'Maximum Stability', ram: '512 MB', bios: 'CSM Firmware', tag: 'Stable' },
                { id: 'ubuntu', name: 'Helix Ubuntu 24.04', badge: 'Cloud & Modern Tools', ram: '512 MB', bios: 'CSM Firmware', tag: 'Cloud' },
                { id: 'arch', name: 'Helix Arch Rolling', badge: 'Bleeding Edge Stack', ram: '512 MB', bios: 'ACPI 2.0 PAE', tag: 'Bleeding' },
                { id: 'fedora', name: 'Helix Fedora 40', badge: 'Enterprise DNF5', ram: '512 MB', bios: 'CSM Firmware', tag: 'Enterprise' },
                { id: 'void', name: 'Helix Void Musl', badge: 'Minimal Runit Engine', ram: '256 MB', bios: 'SeaBIOS Std', tag: 'Lightweight' },
                { id: 'tinycore', name: 'Helix Tiny Core', badge: '100% In-Memory RAM', ram: '128 MB', bios: 'SeaBIOS Std', tag: 'RAM Only' },
                { id: 'microkernel', name: 'Helix MicroKernel', badge: 'RT-Preempt Sandbox', ram: '256 MB', bios: 'RT MicroFirmware', tag: 'Realtime' },
                { id: 'freedos', name: 'Helix FreeDOS 1.3', badge: '16-bit DOS Real-Mode', ram: '64 MB', bios: 'Retro PC-AT', tag: 'Vintage' },
                { id: 'kolibri', name: 'Helix KolibriOS', badge: '100% Assembly GUI', ram: '64 MB', bios: 'SVGA VESA 3.0', tag: 'Instant' },
              ].map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-2 hover:border-white/20 transition">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{item.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300 font-mono">{item.tag}</span>
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">RAM: {item.ram} | BIOS: {item.bios}</p>
                  </div>
                  <button
                    onClick={() => handleAutoTune(item.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-90 text-black text-[10px] font-bold shrink-0 flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Apply</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: BIOS Firmware Matrix */}
      {selectedTopic === 'firmware' && (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-black/30 border border-white/10 mb-2">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
              BIOS Firmware ROM Specifications & Compatibility Matrix
            </h2>
            <p className="text-[11px] text-gray-400">
              Each ROM provides distinct low-level hardware interrupt handlers, ACPI table descriptors, and memory paging strategies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BIOS_PROFILES.map((bp) => (
              <div key={bp.id} className="p-4 rounded-2xl bg-[#111625]/80 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{bp.name}</span>
                  </h3>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                    {bp.vendor}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{bp.description}</p>
                <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1">
                  {bp.features.map((f, i) => (
                    <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Troubleshooter */}
      {selectedTopic === 'troubleshoot' && (
        <div className="space-y-3">
          {[
            {
              q: 'Kernel Panic / VFS: Unable to mount root fs on unknown-block',
              a: 'This occurs when the kernel command line lacks root=/dev/sr0 or the BIOS ROM is missing ACPI tables. Switch BIOS to "SeaBIOS High-Memory & ACPI" and ensure RAM is set to ≥256 MB.',
              severity: 'High'
            },
            {
              q: 'Low Memory Device Slowdown / Tab Crashing',
              a: 'On mobile or low-memory hardware (≤2GB RAM), avoid 512MB allocations. Switch to Helix Alpine (256MB) or Helix Tiny Core (128MB). PWA service worker caching ensures instant reboot without re-downloading images.',
              severity: 'Medium'
            },
            {
              q: 'Custom ISO URL fails with CORS error',
              a: 'Web browsers enforce Cross-Origin Resource Sharing on fetch requests. If hosting your own ISO, enable Access-Control-Allow-Origin: * on your server, or use the drag-and-drop file upload button to mount the ISO directly from your local disk.',
              severity: 'Tip'
            },
            {
              q: 'Black Screen or Distorted Resolution in Graphical Mode',
              a: 'Select the High-Color SVGA Extended VESA 3.0 Linear Framebuffer BIOS (vgabios-vesa) and allocate at least 16 MB or 32 MB of Video Graphics RAM.',
              severity: 'Low'
            }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-[#111625]/80 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <AlertTriangle className={`w-3.5 h-3.5 ${item.severity === 'High' ? 'text-rose-400' : 'text-yellow-400'}`} />
                  <span>{item.q}</span>
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">
                  {item.severity}
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
