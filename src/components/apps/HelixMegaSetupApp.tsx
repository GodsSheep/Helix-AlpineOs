import React, { useState } from 'react';
import { 
  Cpu, 
  Download, 
  CheckCircle2, 
  Settings, 
  Terminal, 
  Shield, 
  Zap, 
  HardDrive, 
  Smartphone, 
  Layers, 
  RefreshCcw,
  Sparkles,
  Server,
  Globe,
  Lock
} from 'lucide-react';
import { Toast } from '../../kernel/Toast';
import { Kernel } from '../../kernel';

interface SetupModule {
  id: string;
  name: string;
  category: 'Kernel & VFS' | 'AI Models' | 'Android ART' | 'Wine Win32' | 'Networking';
  description: string;
  size: string;
  version: string;
  installed: boolean;
  downloading: boolean;
  progress: number;
}

export const HelixMegaSetupApp: React.FC<{ notify: (msg: string) => void }> = ({ notify }) => {
  const [modules, setModules] = useState<SetupModule[]>([
    {
      id: 'alpine_v86',
      name: 'Alpine Linux 6.6 Host Kernel (v86 x86)',
      category: 'Kernel & VFS',
      description: 'Production Alpine Linux image with full BIOS, disk controller, and 9P virtio filesystem support.',
      size: '34.2 MB',
      version: '6.6.14-lts',
      installed: true,
      downloading: false,
      progress: 100
    },
    {
      id: 'llama3_8b',
      name: 'Meta Llama 3 8B Instruct (WebGPU / WASM)',
      category: 'AI Models',
      description: 'High-intelligence quantized local LLM for code generation, autonomous agent workflows, and system reasoning.',
      size: '4.7 GB',
      version: '3.0-Instruct',
      installed: false,
      downloading: false,
      progress: 0
    },
    {
      id: 'phi3_mini',
      name: 'Microsoft Phi-3 Mini (3.8B Lightweight)',
      category: 'AI Models',
      description: 'Fast, lightweight local AI model optimized for low-latency code completion and chat assistance.',
      size: '2.2 GB',
      version: '3.8-mini',
      installed: true,
      downloading: false,
      progress: 100
    },
    {
      id: 'mistral_7b',
      name: 'Mistral 7B v0.3 GGUF',
      category: 'AI Models',
      description: 'Powerful general-purpose open weights model for complex logic and system command generation.',
      size: '4.1 GB',
      version: '0.3-Instruct',
      installed: false,
      downloading: false,
      progress: 0
    },
    {
      id: 'android_art',
      name: 'Android ART Runtime & Wayland Compositor',
      category: 'Android ART',
      description: 'Full Android application and game container supporting APK execution, JIT compilation, and touch mapping.',
      size: '148 MB',
      version: '14.0-sdk34',
      installed: true,
      downloading: false,
      progress: 100
    },
    {
      id: 'wine_v9',
      name: 'Wine v9.0 Win32 PE Compatibility Layer',
      category: 'Wine Win32',
      description: 'Run Windows .exe apps and DirectX games directly in Helix OS with VFS home persistence.',
      size: '215 MB',
      version: '9.0-staging',
      installed: true,
      downloading: false,
      progress: 100
    },
    {
      id: 'chroot_rootfs',
      name: 'Debian/Ubuntu Chroot Rootfs Base',
      category: 'Kernel & VFS',
      description: 'Complete chroot container root filesystem with apt, dpkg, gcc, and full POSIX development tools.',
      size: '185 MB',
      version: '24.04-lts',
      installed: false,
      downloading: false,
      progress: 0
    },
    {
      id: 'devtools_studio_pack',
      name: 'Developer Tools Studio Toolchain Pack',
      category: 'Kernel & VFS',
      description: 'Open-source formatters, ESTree AST tokenizer, regex testing engine, REST/HTTP console, and TypeScript schema generators.',
      size: '42.8 MB',
      version: '2.4.0',
      installed: true,
      downloading: false,
      progress: 100
    },
    {
      id: 'game_engine_runtime',
      name: 'Visual Game Engine 2D Physics & Sprite Assets',
      category: 'Kernel & VFS',
      description: 'No-code visual scripting engine, 60fps canvas physics solver, particle generator, and audio sound synthesizers.',
      size: '56.1 MB',
      version: '3.0.1',
      installed: true,
      downloading: false,
      progress: 100
    },
    {
      id: 'universal_utils_pack',
      name: 'Universal Utilities & Cryptographic Toolset',
      category: 'Kernel & VFS',
      description: 'Multi-format file & data converters, text transformations, collision-resistant checksum calculators, and epoch utilities.',
      size: '18.4 MB',
      version: '1.8.0',
      installed: true,
      downloading: false,
      progress: 100
    }
  ]);

  const [hostBridgeConfig, setHostBridgeConfig] = useState({
    kernelBaudRate: 115200,
    syncIntervalMs: 1000,
    enableChrootIsolation: true,
    autoMountVfs9p: true,
    telemetryBroadcast: true,
    networkProxyMode: 'nat'
  });

  const handleDownloadModule = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, downloading: true, progress: 0 } : m));
    
    let currentProg = 0;
    const interval = setInterval(() => {
      currentProg += Math.floor(Math.random() * 25) + 15;
      if (currentProg >= 100) {
        currentProg = 100;
        clearInterval(interval);
        setModules(prev => prev.map(m => m.id === id ? { ...m, downloading: false, installed: true, progress: 100 } : m));
        Toast.show(`Successfully downloaded & installed module!`, '🚀');
        notify(`Module installed successfully.`);
      } else {
        setModules(prev => prev.map(m => m.id === id ? { ...m, progress: currentProg } : m));
      }
    }, 300);
  };

  const handleInstallAll = () => {
    modules.filter(m => !m.installed).forEach(m => handleDownloadModule(m.id));
  };

  return (
    <div className="h-full flex flex-col bg-[#080a0f] text-gray-200 font-sans p-6 overflow-y-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Zap className="w-5 h-5" />
            </span>
            Helix OS Master Setup & Kernel Hub
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            One-click installer for system kernels, AI model weights, Android ART runtimes, Wine win32 layers, and host chroot bridges.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleInstallAll}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Install All Recommended Modules</span>
          </button>
        </div>
      </div>

      {/* Grid of Modules */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#6ee7b7]" />
          System Components & Downloadable Runtimes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod) => (
            <div 
              key={mod.id} 
              className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                mod.installed 
                  ? 'bg-[#121622]/80 border-emerald-500/30 shadow-lg shadow-emerald-500/5' 
                  : 'bg-[#121622] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-cyan-300 border border-white/10 uppercase">
                      {mod.category}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-1">{mod.name}</h3>
                  </div>
                  <span className="text-xs font-mono text-gray-400">{mod.size}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{mod.description}</p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-gray-500">v{mod.version}</span>
                  {mod.installed && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Installed & Active
                    </span>
                  )}
                </div>

                {mod.downloading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 transition-all duration-200" style={{ width: `${mod.progress}%` }} />
                    </div>
                    <span className="text-[11px] font-mono text-cyan-300">{mod.progress}%</span>
                  </div>
                ) : mod.installed ? (
                  <button
                    onClick={() => handleDownloadModule(mod.id)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition cursor-pointer font-medium"
                  >
                    Reinstall / Update
                  </button>
                ) : (
                  <button
                    onClick={() => handleDownloadModule(mod.id)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download & Install</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Host Kernel & Bridge Customization */}
      <div className="p-5 rounded-2xl bg-[#121622] border border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-purple-400" />
          Host Kernel & Helix Bridge Customization
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-2">
            <label className="text-xs text-gray-300 font-semibold block">Serial Baud Rate</label>
            <select
              value={hostBridgeConfig.kernelBaudRate}
              onChange={(e) => setHostBridgeConfig({ ...hostBridgeConfig, kernelBaudRate: Number(e.target.value) })}
              className="w-full bg-[#0d0f18] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
            >
              <option value={9600}>9600 baud</option>
              <option value={38400}>38400 baud</option>
              <option value={115200}>115200 baud (Recommended)</option>
              <option value={921600}>921600 baud (High-Speed)</option>
            </select>
            <span className="text-[10px] text-gray-500 block">Host-guest serial communication rate</span>
          </div>

          <div className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-2">
            <label className="text-xs text-gray-300 font-semibold block">VFS 9P Sync Frequency</label>
            <select
              value={hostBridgeConfig.syncIntervalMs}
              onChange={(e) => setHostBridgeConfig({ ...hostBridgeConfig, syncIntervalMs: Number(e.target.value) })}
              className="w-full bg-[#0d0f18] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
            >
              <option value={500}>500ms (Real-time)</option>
              <option value={1000}>1000ms (Balanced)</option>
              <option value={5000}>5000ms (Low-Power)</option>
            </select>
            <span className="text-[10px] text-gray-500 block">Host disk synchronization heartbeat</span>
          </div>

          <div className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-2">
            <label className="text-xs text-gray-300 font-semibold block">Network Proxy Mode</label>
            <select
              value={hostBridgeConfig.networkProxyMode}
              onChange={(e) => setHostBridgeConfig({ ...hostBridgeConfig, networkProxyMode: e.target.value })}
              className="w-full bg-[#0d0f18] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
            >
              <option value="nat">NAT / Masquerade (Default)</option>
              <option value="bridge">Direct Bridge Interface</option>
              <option value="isolated">Air-Gapped / Isolated</option>
            </select>
            <span className="text-[10px] text-gray-500 block">Guest networking routing architecture</span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hostBridgeConfig.enableChrootIsolation}
              onChange={(e) => setHostBridgeConfig({ ...hostBridgeConfig, enableChrootIsolation: e.target.checked })}
              className="w-4 h-4 accent-[#6ee7b7] rounded"
            />
            <span className="text-xs text-gray-300">Enable Chroot Rootfs Isolation & Security Sandbox</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hostBridgeConfig.telemetryBroadcast}
              onChange={(e) => setHostBridgeConfig({ ...hostBridgeConfig, telemetryBroadcast: e.target.checked })}
              className="w-4 h-4 accent-[#6ee7b7] rounded"
            />
            <span className="text-xs text-gray-300">Broadcast Host Kernel Uptime & Telemetry to Status Bar</span>
          </label>
        </div>
      </div>
    </div>
  );
};
