import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Settings,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Plus,
  ShieldCheck,
  Zap,
  Activity,
  FolderOpen,
  FileCode,
  HardDrive
} from 'lucide-react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';

interface KernelModule {
  name: string;
  size: string;
  instances: number;
  depends: string[];
  status: 'Live' | 'Loading' | 'Unloading';
  description: string;
}

interface SysctlParam {
  key: string;
  value: string;
  defaultValue: string;
  type: 'toggle' | 'slider' | 'text';
  min?: number;
  max?: number;
  description: string;
}

export const KernelModuleApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'modules' | 'sysctl' | 'procfs'>('modules');
  const [moduleQuery, setModuleQuery] = useState('');

  // Linux kernel modules (lsmod / /proc/modules)
  const [modules, setModules] = useState<KernelModule[]>([
    { name: 'virtio_net', size: '36.8 KB', instances: 2, depends: ['virtio_ring'], status: 'Live', description: 'VirtIO Paravirtualized Network Adapter Driver' },
    { name: 'virtio_pci', size: '28.4 KB', instances: 4, depends: ['virtio'], status: 'Live', description: 'VirtIO PCI bus architecture bridge' },
    { name: '9pnet_virtio', size: '44.0 KB', instances: 1, depends: ['9pnet'], status: 'Live', description: '9P Plan 9 VirtIO Transport Layer for Host VFS Mount' },
    { name: '9p', size: '82.5 KB', instances: 1, depends: ['fscache'], status: 'Live', description: 'Plan 9 Folder & Filesystem Protocol VFS Client' },
    { name: 'tun', size: '52.0 KB', instances: 1, depends: [], status: 'Live', description: 'Universal TUN/TAP device driver for userland VPN networking' },
    { name: 'br_netfilter', size: '32.1 KB', instances: 2, depends: ['bridge'], status: 'Live', description: 'Linux Bridge Netfilter packet filtering hooks for Docker' },
    { name: 'overlay', size: '124.0 KB', instances: 3, depends: [], status: 'Live', description: 'OverlayFS Union Filesystem for OCI container layers' },
    { name: 'wireguard', size: '98.2 KB', instances: 0, depends: ['udp_tunnel'], status: 'Live', description: 'Fast, modern, secure kernel-space VPN crypto tunnel' },
    { name: 'zram', size: '36.0 KB', instances: 1, depends: ['zsmalloc'], status: 'Live', description: 'Compressed RAM block device for high-performance swap' }
  ]);

  // Sysctl kernel parameters
  const [sysctl, setSysctl] = useState<SysctlParam[]>([
    {
      key: 'net.ipv4.ip_forward',
      value: '1',
      defaultValue: '1',
      type: 'toggle',
      description: 'Enable IPv4 packet routing and NAT container bridging'
    },
    {
      key: 'net.ipv4.tcp_congestion_control',
      value: 'bbr',
      defaultValue: 'bbr',
      type: 'text',
      description: 'Bottleneck Bandwidth and RTT (BBR) high-throughput congestion control'
    },
    {
      key: 'vm.swappiness',
      value: '10',
      defaultValue: '60',
      type: 'slider',
      min: 0,
      max: 100,
      description: 'Tendency of the kernel to swap memory pages to ZRAM disk (lower = prioritize RAM)'
    },
    {
      key: 'vm.dirty_ratio',
      value: '15',
      defaultValue: '20',
      type: 'slider',
      min: 5,
      max: 80,
      description: 'Percentage of system memory that can contain dirty filesystem cache before flush'
    },
    {
      key: 'fs.inotify.max_user_watches',
      value: '524288',
      defaultValue: '524288',
      type: 'text',
      description: 'Maximum number of virtual filesystem directories watched simultaneously'
    },
    {
      key: 'fs.file-max',
      value: '2097152',
      defaultValue: '2097152',
      type: 'text',
      description: 'Maximum system-wide open file descriptors ceiling'
    },
    {
      key: 'kernel.pid_max',
      value: '4194304',
      defaultValue: '32768',
      type: 'text',
      description: 'Maximum thread and process PID limit across all namespaces'
    }
  ]);

  const handleModprobe = (name: string) => {
    SoundManager.play('click');
    const existing = modules.find(m => m.name === name);
    if (existing) {
      Toast.show(`Module '${name}' is already loaded in kernel`, '⚠️');
      return;
    }

    const newMod: KernelModule = {
      name,
      size: `${Math.floor(20 + Math.random() * 60)}.0 KB`,
      instances: 1,
      depends: [],
      status: 'Live',
      description: 'Dynamically injected kernel module'
    };

    setModules(prev => [newMod, ...prev]);
    SoundManager.play('success');
    Toast.show(`modprobe: Inserted '${name}' into Linux kernel!`, '✓');
  };

  const handleRmmod = (name: string) => {
    SoundManager.play('toast');
    setModules(prev => prev.filter(m => m.name !== name));
    Toast.show(`rmmod: Unloaded '${name}' from kernel space`, '🗑️');
  };

  const handleUpdateSysctl = (key: string, value: string) => {
    setSysctl(prev =>
      prev.map(p => (p.key === key ? { ...p, value } : p))
    );
  };

  const handleSaveSysctl = () => {
    SoundManager.play('success');
    Toast.show('sysctl -p: Applied kernel parameters to /etc/sysctl.conf', '✓');
  };

  const filteredModules = modules.filter(m =>
    m.name.toLowerCase().includes(moduleQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(moduleQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-gray-100 select-none font-sans overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-[#131622] border-b border-white/10 flex items-center justify-between flex-wrap gap-2 shrink-0 font-mono">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xs flex items-center gap-1.5">
              <span>Linux Kernel Module & Sysctl Tuner</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                Linux 6.6.21-alpine (Ring 0)
              </span>
            </h2>
            <p className="text-[10px] text-gray-400">Inspect loaded kernel modules (lsmod), dynamically load/unload drivers, and tune sysctl kernel flags.</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'modules' ? 'bg-teal-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> <span>Modules ({modules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sysctl')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sysctl' ? 'bg-teal-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> <span>Sysctl Tuner</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-y-auto p-3 text-xs font-mono">
        {/* TAB 1: Modules (lsmod) */}
        {activeTab === 'modules' && (
          <div className="space-y-3">
            <div className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-2">
              <input
                type="text"
                value={moduleQuery}
                onChange={(e) => setModuleQuery(e.target.value)}
                placeholder="Search loaded kernel modules..."
                className="flex-1 max-w-md bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-teal-400"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleModprobe('dm_crypt')}
                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>modprobe dm_crypt</span>
                </button>
              </div>
            </div>

            {/* Modules Table */}
            <div className="space-y-2">
              {filteredModules.map((m) => (
                <div key={m.name} className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3 hover:border-teal-500/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/20">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{m.name}</span>
                        <span className="text-[10px] text-teal-300 bg-teal-500/10 px-1.5 py-0.2 rounded border border-teal-500/20">{m.size}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">● {m.status}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{m.description}</p>
                      {m.depends.length > 0 && (
                        <div className="text-[9px] text-gray-500 mt-0.5">
                          Dependencies: {m.depends.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRmmod(m.name)}
                    className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    rmmod
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Sysctl Kernel Tuner */}
        {activeTab === 'sysctl' && (
          <div className="space-y-3">
            <div className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-teal-400" /> <span>Linux Sysctl Kernel Parameter Table</span>
                </h3>
                <p className="text-gray-400 text-[11px] mt-0.5">Live configuration of kernel virtual memory, TCP/IP networking stack, and VFS file limits.</p>
              </div>

              <button
                onClick={handleSaveSysctl}
                className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> <span>Apply (sysctl -p)</span>
              </button>
            </div>

            <div className="space-y-2">
              {sysctl.map((param) => (
                <div key={param.key} className="p-3.5 bg-[#121520] border border-white/10 rounded-2xl space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-teal-300 text-xs">{param.key}</span>
                      <p className="text-gray-400 text-[10px] mt-0.5">{param.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {param.type === 'toggle' && (
                        <button
                          onClick={() => {
                            const next = param.value === '1' ? '0' : '1';
                            handleUpdateSysctl(param.key, next);
                            SoundManager.play('click');
                          }}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer transition ${
                            param.value === '1' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-400'
                          }`}
                        >
                          {param.value === '1' ? 'ENABLED (1)' : 'DISABLED (0)'}
                        </button>
                      )}

                      {param.type === 'slider' && (
                        <div className="flex items-center gap-3 w-48">
                          <input
                            type="range"
                            min={param.min || 0}
                            max={param.max || 100}
                            value={Number(param.value)}
                            onChange={(e) => handleUpdateSysctl(param.key, e.target.value)}
                            className="flex-1 accent-teal-400 cursor-pointer"
                          />
                          <span className="text-white font-bold text-xs w-8 text-right">{param.value}</span>
                        </div>
                      )}

                      {param.type === 'text' && (
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) => handleUpdateSysctl(param.key, e.target.value)}
                          className="w-32 bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-white text-xs font-mono text-center focus:outline-none focus:border-teal-400"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
