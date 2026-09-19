import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, MemoryStick, CircuitBoard, Gauge, Layers, RefreshCw, Zap, PanelLeftClose, PanelLeft, Terminal } from 'lucide-react';
import { Settings } from '../../kernel/Settings';
import { Kernel } from '../../kernel';
import { Toast } from '../../kernel/Toast';

export const HardwareInfoApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cpu' | 'memory' | 'pci' | 'storage' | 'sensors'>('cpu');
  const [hwInfo, setHwInfo] = useState(Settings.getHardwareInfo());
  const [osMeta, setOsMeta] = useState(Kernel.vm.getOsMetadata());
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    const unsub = Settings.subscribeHardware((info) => setHwInfo(info));
    const unsubOs = Kernel.vm.onOsChange((_id, meta) => setOsMeta(meta));
    return () => {
      unsub();
      unsubOs();
    };
  }, []);

  const handleRefresh = () => {
    setHwInfo(Settings.getHardwareInfo());
    setOsMeta(Kernel.vm.getOsMetadata());
    Toast.show('Rescanned hardware bus and device sensors', '✓');
  };

  const navItems = [
    { id: 'cpu' as const, label: 'CPU Processor', desc: 'x86_64 Cores & Cache', icon: Cpu },
    { id: 'memory' as const, label: 'Memory (RAM)', desc: 'Physical & Swap', icon: MemoryStick },
    { id: 'pci' as const, label: 'PCI & USB Devices', desc: 'Bus Controllers', icon: CircuitBoard },
    { id: 'storage' as const, label: 'Storage & Block Devices', desc: 'Disks & Mounts', icon: HardDrive },
    { id: 'sensors' as const, label: 'Thermal & Power Sensors', desc: 'Sensors & ACPI', icon: Gauge },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141724] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showSidebar ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
            }`}
            title={showSidebar ? 'Collapse Device Sidebar' : 'Expand Device Sidebar'}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <CircuitBoard className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-sm">Linux Hardware & Device Tree</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400 hidden sm:inline">
            lshw / lspci / lscpu / lsblk
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition cursor-pointer"
          title="Rescan Hardware"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        {showSidebar && (
          <div className="w-56 bg-[#10121d] border-r border-white/10 flex flex-col p-2 space-y-1 shrink-0 overflow-y-auto">
            <div className="text-[10px] font-mono uppercase text-gray-500 font-bold px-2 py-1">Hardware Subsystems</div>
            {navItems.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-[11px] font-medium flex items-center gap-2.5 transition cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="flex-1 truncate">
                    <div className="truncate font-semibold">{t.label}</div>
                    <div className="text-[10px] text-gray-500 truncate">{t.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0c14]">
          {/* Fallback horizontal chips when sidebar is collapsed */}
          {!showSidebar && (
            <div className="px-3 py-1.5 bg-[#10121d] border-b border-white/10 flex items-center gap-1.5 overflow-x-auto shrink-0">
              {navItems.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono">
        {activeTab === 'cpu' && (
          <div className="space-y-4">
            <div className="bg-[#12141f] border border-white/10 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Processor Architecture (/proc/cpuinfo)
              </h3>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">Model Name:</span>
                  <span className="text-white font-semibold">Helix Virtual x86_64 SMP Core</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">Architecture:</span>
                  <span className="text-cyan-300">x86_64 (64-bit Little Endian)</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">CPU Cores / Threads:</span>
                  <span className="text-emerald-400">{hwInfo.cpuCores} Physical / {hwInfo.cpuCores} Logical</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">Base Clock Speed:</span>
                  <span className="text-white">2.40 GHz (Turbo 3.80 GHz)</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">L1d / L1i Cache:</span>
                  <span className="text-white">32 KB / 32 KB per core</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">L2 / L3 Cache:</span>
                  <span className="text-white">512 KB per core / 16 MB Shared</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">Virtualization Support:</span>
                  <span className="text-emerald-400">VT-x / AMD-V (KVM / QEMU v86)</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">BogoMIPS:</span>
                  <span className="text-white">4800.00</span>
                </div>
              </div>
            </div>

            <div className="bg-[#12141f] border border-white/10 rounded-xl p-4">
              <span className="text-gray-400 text-xs block mb-2 font-bold">Instruction Set Flags:</span>
              <div className="flex flex-wrap gap-1 text-[10px]">
                {['fpu', 'vme', 'de', 'pse', 'tsc', 'msr', 'pae', 'mce', 'cx8', 'apic', 'sep', 'mtrr', 'pge', 'mca', 'cmov', 'pat', 'clflush', 'mmx', 'fxsr', 'sse', 'sse2', 'ss', 'ht', 'syscall', 'nx', 'lm', 'constant_tsc', 'rep_good', 'nopl', 'pni', 'pclmulqdq', 'vmx', 'ssse3', 'fma', 'cx16', 'sse4_1', 'sse4_2', 'x2apic', 'movbe', 'popcnt', 'aes', 'xsave', 'avx', 'f16c', 'rdrand', 'hypervisor'].map((f) => (
                  <span key={f} className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="bg-[#12141f] border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MemoryStick className="w-4 h-4 text-emerald-400" />
              Memory Hierarchy & Physical RAM (/proc/meminfo)
            </h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Host Physical RAM:</span>
                <span className="text-white font-bold">{hwInfo.deviceMemoryGB} GB</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">{osMeta.name} VM Allocation:</span>
                <span className="text-emerald-400 font-bold">{Kernel.vm.bootMemoryMB} MB (Configurable)</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">BIOS Firmware ROM:</span>
                <span className="text-cyan-300 font-semibold">{Kernel.vm.currentBiosName}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Memory Type:</span>
                <span className="text-cyan-300">DDR4 / DDR5 Synchronous</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Speed / Bandwidth:</span>
                <span className="text-white">3200 MT/s Dual Channel</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Swap Total:</span>
                <span className="text-amber-400">512 MB (zram compressed)</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Page Size:</span>
                <span className="text-white">4096 bytes (4 KB)</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pci' && (
          <div className="bg-[#12141f] border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CircuitBoard className="w-4 h-4 text-amber-400" />
              PCI Bus & Peripheral Devices (lspci -nn)
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { slot: '00:00.0', desc: 'Host bridge: Intel Corporation 440FX - 82441FX PMC [Natoma] (rev 02)', driver: 'agpgart-intel' },
                { slot: '00:01.0', desc: 'ISA bridge: Intel Corporation 82371SB PIIX3 ISA [Natoma/Triton II]', driver: 'piix4_smbus' },
                { slot: '00:01.1', desc: 'IDE interface: Intel Corporation 82371SB PIIX3 IDE [Natoma/Triton II]', driver: 'ata_piix' },
                { slot: '00:02.0', desc: 'VGA compatible controller: Cirrus Logic GD 5446 (rev 00)', driver: 'cirrus / fbcon' },
                { slot: '00:03.0', desc: 'Ethernet controller: Red Hat, Inc. Virtio network device (rev 00)', driver: 'virtio_net' },
                { slot: '00:04.0', desc: 'Multimedia audio controller: Intel Corporation 82801AA AC\'97 Audio Controller', driver: 'snd_intel8x0' },
                { slot: '00:05.0', desc: 'Communication controller: Red Hat, Inc. Virtio 9P transport filesystem (rev 00)', driver: '9pnet_virtio' },
              ].map((dev) => (
                <div key={dev.slot} className="p-2 rounded bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between text-cyan-400 font-bold">
                    <span>{dev.slot}</span>
                    <span className="text-gray-500 font-mono text-[10px]">driver: {dev.driver}</span>
                  </div>
                  <div className="text-gray-300 mt-0.5">{dev.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="bg-[#12141f] border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-rose-400" />
              Block Devices & Partition Layout (lsblk -f)
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { name: 'sda', size: '20.0G', type: 'disk', fstype: '', mount: '' },
                { name: '├─sda1', size: '512M', type: 'part', fstype: 'vfat', mount: '/boot/efi' },
                { name: '├─sda2', size: '18.5G', type: 'part', fstype: 'ext4', mount: '/' },
                { name: '└─sda3', size: '1.0G', type: 'part', fstype: 'swap', mount: '[SWAP]' },
                { name: 'sr0', size: '130M', type: 'rom', fstype: 'iso9660', mount: '/media/cdrom' },
                { name: 'host9p', size: '100.0G', type: 'virtio', fstype: '9p2000', mount: '/mnt/helix' },
              ].map((blk) => (
                <div key={blk.name} className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5">
                  <span className="font-bold text-white">{blk.name}</span>
                  <span className="text-gray-400">{blk.size}</span>
                  <span className="text-cyan-400">{blk.type}</span>
                  <span className="text-amber-400">{blk.fstype || '-'}</span>
                  <span className="text-emerald-400 font-bold">{blk.mount || '-'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sensors' && (
          <div className="bg-[#12141f] border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              Thermal Zones & ACPI Sensors
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <span className="text-gray-400 text-[10px] block">CPU PACKAGE TEMPERATURE</span>
                <span className="text-lg font-bold text-emerald-400">41.5°C</span>
                <span className="text-[10px] text-gray-500 block">Thermal trip point: 100°C</span>
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <span className="text-gray-400 text-[10px] block">SYSTEM CHASSIS FAN</span>
                <span className="text-lg font-bold text-cyan-400">1,820 RPM</span>
                <span className="text-[10px] text-gray-500 block">PWM automatic dynamic curve</span>
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <span className="text-gray-400 text-[10px] block">ACPI BATTERY CHARGE</span>
                <span className="text-lg font-bold text-white">
                  {hwInfo.batteryLevel !== null ? `${Math.round(hwInfo.batteryLevel * 100)}%` : 'AC Line Connected'}
                </span>
                <span className="text-[10px] text-gray-500 block">{hwInfo.isCharging ? 'Status: Charging' : 'Status: Discharging'}</span>
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <span className="text-gray-400 text-[10px] block">POWER VOLTAGE RAIL</span>
                <span className="text-lg font-bold text-amber-300">12.14 V</span>
                <span className="text-[10px] text-gray-500 block">ATX 12V Tolerances: ±0.8%</span>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};
