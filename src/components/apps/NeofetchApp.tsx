import React, { useState, useEffect } from 'react';
import { Kernel } from '../../kernel';
import { Terminal, Cpu, HardDrive, Monitor, Shield, Zap, RefreshCw, Copy, Check } from 'lucide-react';
import { SoundManager } from '../../kernel/SoundManager';

export const NeofetchApp: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [hwInfo, setHwInfo] = useState(Kernel.settings.getHardwareInfo());
  const [uptime, setUptime] = useState('0 mins');

  const osMeta = Kernel.vm.getOsMetadata();
  const hostname = Kernel.vm.getHostname();

  useEffect(() => {
    const updateStats = () => {
      setHwInfo(Kernel.settings.getHardwareInfo());
      const secs = Math.floor((Date.now() - (performance.timeOrigin || Date.now())) / 1000);
      const mins = Math.floor(secs / 60);
      const hrs = Math.floor(mins / 60);
      if (hrs > 0) {
        setUptime(`${hrs} hours, ${mins % 60} mins`);
      } else {
        setUptime(`${mins} mins, ${secs % 60} secs`);
      }
    };
    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const asciiLogo = [
    '       /\\',
    '      /  \\',
    '     / /\\ \\',
    '    / /  \\ \\',
    '   / /    \\ \\',
    '  / /      \\ \\',
    ' / /________\\ \\',
    '/_/__________\\_\\'
  ];

  const sysInfo = [
    { label: 'OS', value: `Helix OS 4.5 (${osMeta.name} ${osMeta.version} x86_64)` },
    { label: 'Kernel', value: 'Linux 6.6.14-virt-helix (SMP x86_64 JIT)' },
    { label: 'Hostname', value: hostname },
    { label: 'Tagline', value: osMeta.tagline },
    { label: 'Uptime', value: uptime },
    { label: 'Packages', value: '18,452 (package manager active)' },
    { label: 'Shell', value: 'busybox ash 1.36.1 with RPC bus' },
    { label: 'Resolution', value: `${window.innerWidth}x${window.innerHeight} viewport` },
    { label: 'DE / WM', value: 'Helix Compositor (WebAssembly / Canvas / 9P)' },
    { label: 'Terminal', value: 'vt100 / xterm-256color emulator' },
    { label: 'CPU', value: `Emulated x86_64 @ ${hwInfo.cpuCores || 4} Virtual Cores` },
    { label: 'Memory', value: `${(hwInfo.deviceMemoryGB || 4) * 512} MB / ${(hwInfo.deviceMemoryGB || 4) * 1024} MB` },
    { label: 'Storage', value: 'IndexedDB VFS + 9P2000 virtio host drive' },
    { label: 'Power', value: `Battery ${hwInfo.batteryLevel ?? 98}% (${hwInfo.isCharging ? 'AC Adapter' : 'Battery'})` },
  ];

  const handleCopy = () => {
    SoundManager.play('click');
    const fullText = sysInfo.map(i => `${i.label}: ${i.value}`).join('\n');
    navigator.clipboard.writeText(`--- Helix OS Neofetch System Info ---\n${fullText}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0d14] text-[#edf1f7] text-xs font-mono select-none overflow-hidden p-4">
      <div className="flex justify-between items-center pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#6ee7b7]" />
          <span className="font-bold text-sm text-[#6ee7b7]">neofetch — Helix System Profiler ({osMeta.name})</span>
        </div>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1.5 transition cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#6ee7b7]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied System Specs' : 'Copy Specs'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 my-2 bg-black/60 border border-white/10 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Logo */}
        <div className="text-[#6ee7b7] font-bold text-base leading-tight select-none pt-2">
          {asciiLogo.map((line, idx) => (
            <pre key={idx} className="font-mono">{line}</pre>
          ))}
          <div className="text-center font-bold text-xs text-cyan-400 mt-2 uppercase">{osMeta.name}</div>
        </div>

        {/* Specs Table */}
        <div className="flex-1 space-y-1.5 w-full">
          <div className="text-sm font-bold text-emerald-400 border-b border-white/10 pb-1 mb-2">
            root@{hostname} ~
          </div>

          {sysInfo.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] hover:bg-white/5 p-1 rounded transition">
              <span className="text-[#6ee7b7] font-bold min-w-[100px]">{item.label}:</span>
              <span className="text-gray-200">{item.value}</span>
            </div>
          ))}

          {/* Color Blocks */}
          <div className="pt-4 flex gap-1.5 justify-center sm:justify-start">
            {['bg-black', 'bg-red-500', 'bg-emerald-500', 'bg-amber-400', 'bg-blue-500', 'bg-purple-500', 'bg-cyan-400', 'bg-white'].map((c, i) => (
              <div key={i} className={`w-5 h-5 rounded-md ${c} border border-white/20`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
