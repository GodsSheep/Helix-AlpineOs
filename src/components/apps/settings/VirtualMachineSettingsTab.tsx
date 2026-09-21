import React from 'react';
import { HelixSettings } from '../../../kernel/Settings';
import { Cpu, HardDrive, Zap, Shield, Sliders, CheckCircle2, Play, RefreshCw, Layers } from 'lucide-react';

interface VirtualMachineSettingsTabProps {
  settings: HelixSettings;
  onUpdate: (partial: Partial<HelixSettings>) => void;
  notify: (msg: string) => void;
}

export const VirtualMachineSettingsTab: React.FC<VirtualMachineSettingsTabProps> = ({ settings, onUpdate, notify }) => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/30 border border-cyan-500/20">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          Linux Microkernel, Virtualization & vCPU Engine
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Configure memory virtualization limits, dynamic JIT recompilation, VirtIO bus controllers, and Linux rootfs distro profiles.
        </p>
      </div>

      {/* Section 1: VM Engine & Distro Profile */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          Execution Engine & Linux Distribution Profile
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Virtual Machine Execution Mode</label>
            <select
              value={settings.vmEngineMode || 'jit'}
              onChange={(e) => onUpdate({ vmEngineMode: e.target.value as 'jit' | 'interpreted' | 'microvm' })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="jit">Dynamic JIT Turbo (Wasm Recompiler + Native Speed)</option>
              <option value="interpreted">Interpreted Safe Mode (Deterministic Instruction Step)</option>
              <option value="microvm">Hybrid MicroVM (VFS & Syscall Emulation)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Target Distro Rootfs Profile</label>
            <select
              value={settings.osDistroProfile || 'alpine'}
              onChange={(e) => onUpdate({ osDistroProfile: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="alpine">Alpine Linux v3.20 (musl libc, APK package manager)</option>
              <option value="debian">Debian GNU/Linux 12 Bookworm</option>
              <option value="arch">Arch Linux Rolling Core</option>
              <option value="kali">Kali Linux Cybersecurity & Pentest Tools</option>
              <option value="ubuntu">Ubuntu 24.04 LTS Minimal</option>
              <option value="void">Void Linux (runit init system)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Memory & vCPU Core Allocation */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          Hardware Resource Allocations (RAM, vCPU & Swap)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* RAM */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300 font-medium">Virtual Memory (RAM)</span>
              <span className="font-mono text-cyan-400">{settings.vmMemoryMB || 256} MB</span>
            </div>
            <input
              type="range"
              min="64"
              max="4096"
              step="64"
              value={settings.vmMemoryMB || 256}
              onChange={(e) => onUpdate({ vmMemoryMB: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>64 MB</span>
              <span>1024 MB</span>
              <span>4096 MB</span>
            </div>
          </div>

          {/* vCPU Cores */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300 font-medium">vCPU Core Allocation</span>
              <span className="font-mono text-emerald-400">{settings.vmCores || 2} Cores</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={settings.vmCores || 2}
              onChange={(e) => onUpdate({ vmCores: Number(e.target.value) })}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>1 Core</span>
              <span>4 Cores</span>
              <span>8 Cores</span>
            </div>
          </div>

          {/* Virtual Swap */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300 font-medium">Virtual Swap Space</span>
              <span className="font-mono text-purple-400">{settings.vmSwapMB || 256} MB</span>
            </div>
            <input
              type="range"
              min="0"
              max="1024"
              step="64"
              value={settings.vmSwapMB || 256}
              onChange={(e) => onUpdate({ vmSwapMB: Number(e.target.value) })}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>0 MB (No Swap)</span>
              <span>512 MB</span>
              <span>1024 MB</span>
            </div>
          </div>
        </div>

        {/* VirtIO switches */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">VirtIO Block Device</div>
              <div className="text-[10px] text-gray-400">Direct disk controller</div>
            </div>
            <input
              type="checkbox"
              checked={settings.virtioBlockDevice !== false}
              onChange={(e) => onUpdate({ virtioBlockDevice: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">VirtIO Network Adaptor</div>
              <div className="text-[10px] text-gray-400">Low-latency TCP/UDP</div>
            </div>
            <input
              type="checkbox"
              checked={settings.virtioNetworkDevice !== false}
              onChange={(e) => onUpdate({ virtioNetworkDevice: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Shared 9p VirtIO Mount</div>
              <div className="text-[10px] text-gray-400">Host VFS bridge</div>
            </div>
            <input
              type="checkbox"
              checked={settings.sharedMountEnabled !== false}
              onChange={(e) => onUpdate({ sharedMountEnabled: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
