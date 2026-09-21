import React, { useState, useEffect, useCallback } from 'react';
import { 
  AutoDetectionEngine, 
  HardwareDetectionResult, 
  SubsystemStatus, 
  SystemUpdateItem 
} from '../../kernel/AutoDetectionEngine';
import { SelfHealingEngine, SelfHealingReport } from '../../kernel/SelfHealingEngine';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Radio, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Layers, 
  Volume2, 
  Gamepad2, 
  Monitor, 
  Sliders, 
  Server, 
  Terminal, 
  Box, 
  Code2, 
  Check, 
  Wrench, 
  Clock, 
  ChevronRight,
  BatteryCharging,
  Battery
} from 'lucide-react';

export const AutoDetectionCenterApp: React.FC = () => {
  const engine = AutoDetectionEngine.get();
  const [activeTab, setActiveTab] = useState<'mesh' | 'hardware' | 'updates' | 'diagnostics'>('mesh');
  const [hardware, setHardware] = useState<HardwareDetectionResult | null>(engine.getHardwareInfo());
  const [subsystems, setSubsystems] = useState<SubsystemStatus[]>(engine.getSubsystems());
  const [updates, setUpdates] = useState<SystemUpdateItem[]>(engine.getAvailableUpdates());
  const [isScanning, setIsScanning] = useState(engine.getIsScanning());
  const [isUpdatingAll, setIsUpdatingAll] = useState(engine.getIsUpdatingAll());
  const [healthScore, setHealthScore] = useState(engine.getOverallHealthScore());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedSubsystem, setSelectedSubsystem] = useState<SubsystemStatus | null>(null);
  const [diagnosticReport, setDiagnosticReport] = useState<SelfHealingReport | null>(null);
  const [isHealing, setIsHealing] = useState(false);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);

  const refreshState = useCallback(() => {
    setHardware(engine.getHardwareInfo());
    setSubsystems([...engine.getSubsystems()]);
    setUpdates([...engine.getAvailableUpdates()]);
    setIsScanning(engine.getIsScanning());
    setIsUpdatingAll(engine.getIsUpdatingAll());
    setHealthScore(engine.getOverallHealthScore());
  }, [engine]);

  useEffect(() => {
    const unsub = engine.subscribe(refreshState);
    if (!hardware) {
      engine.scanHardwareAndConnectivity();
    }
    return unsub;
  }, [engine, hardware, refreshState]);

  const handleScanAll = async () => {
    await engine.scanHardwareAndConnectivity();
  };

  const handleSyncAndUpdateAll = async () => {
    await engine.syncAndUpdateAll();
  };

  const handleApplySingleUpdate = async (id: string) => {
    await engine.applyUpdate(id);
  };

  const handleReconnect = async (id: string) => {
    await engine.reconnectSubsystem(id);
  };

  const handleRunSelfHealing = async () => {
    setIsHealing(true);
    try {
      const report = await SelfHealingEngine.runFullSystemSelfRepair();
      setDiagnosticReport(report);
      await engine.scanHardwareAndConnectivity();
    } finally {
      setIsHealing(false);
    }
  };

  const filteredSubsystems = categoryFilter === 'all'
    ? subsystems
    : subsystems.filter((s) => s.category.toLowerCase() === categoryFilter.toLowerCase());

  return (
    <div className="flex flex-col h-full bg-[#0d0f14] text-gray-200 select-none font-sans overflow-hidden">
      {/* Top Banner & Quick Metrics */}
      <div className="p-3 sm:p-4 bg-[#13161f] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Auto-Detection & System Sync
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Mesh
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Real-time hardware discovery, subsystem interconnects, and package update monitor
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleScanAll}
            disabled={isScanning}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Re-probe all hardware, storage quotas, and connection metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Auto-Scan'}</span>
          </button>

          <button
            onClick={handleSyncAndUpdateAll}
            disabled={isUpdatingAll}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Synchronize all repositories, VFS journal, and pending updates"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isUpdatingAll ? 'animate-spin' : ''}`} />
            <span>{isUpdatingAll ? 'Syncing...' : 'Sync & Update All'}</span>
          </button>
        </div>
      </div>

      {/* Global Health Indicator Bar */}
      <div className="px-4 py-2 bg-[#090b0e] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Health Index:</span>
            <span className="font-mono font-bold text-emerald-400">{healthScore}%</span>
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500" 
                style={{ width: `${healthScore}%` }} 
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 text-gray-400 border-l border-white/10 pl-4">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>{hardware?.cpu.cores || 4} Cores ({hardware?.cpu.architecture || 'x86_64'})</span>
            </span>
            <span className="flex items-center gap-1">
              <Monitor className="w-3 h-3 text-purple-400" />
              <span>{hardware?.gpu.refreshRateHz || 60}Hz ({hardware?.gpu.colorGamut || 'sRGB'})</span>
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-amber-400" />
              <span>{hardware?.storage.vfsFileCount || 0} VFS Files</span>
            </span>
            <span className="flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>{hardware?.network.effectiveType.toUpperCase() || 'ONLINE'}</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab('mesh')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mesh' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Connection Mesh</span>
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'hardware' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Hardware & Devices</span>
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'updates' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Updates & Sync</span>
            {updates.some((u) => u.status === 'idle') && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'diagnostics' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Self-Healing</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
        {/* TAB 1: CONNECTION MESH */}
        {activeTab === 'mesh' && (
          <div className="space-y-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['all', 'core', 'runtime', 'networking', 'storage', 'development'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-white/15 text-white font-bold border border-white/20'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Subsystems Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSubsystems.map((sub) => {
                const isConnected = sub.status === 'connected';
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubsystem(sub)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isConnected
                        ? 'bg-[#12151e]/80 hover:bg-[#151924] border-white/10 hover:border-cyan-500/30'
                        : 'bg-red-950/10 hover:bg-red-950/20 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          isConnected 
                            ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' 
                            : sub.status === 'checking'
                            ? 'bg-amber-400 animate-spin'
                            : 'bg-red-400'
                        }`} />
                        <h3 className="text-xs font-bold text-white truncate max-w-[160px]">{sub.name}</h3>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 font-mono">
                        v{sub.version}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 line-clamp-2 mb-3 min-h-[32px]">
                      {sub.details}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-white/5 pt-2">
                      <span className="font-mono text-cyan-400">
                        {sub.latencyMs !== undefined ? `~${sub.latencyMs}ms` : 'Local'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{sub.lastChecked}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReconnect(sub.id);
                          }}
                          className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-gray-200 transition"
                        >
                          Probe
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Subsystem Detail Drawer / Modal */}
            {selectedSubsystem && (
              <div className="p-4 rounded-xl bg-[#161a26] border border-cyan-500/30 mt-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <h3 className="text-sm font-bold text-white">{selectedSubsystem.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                      {selectedSubsystem.category}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedSubsystem(null)}
                    className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5"
                  >
                    Close
                  </button>
                </div>
                <p className="text-xs text-gray-300 mb-3">{selectedSubsystem.details}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-white/5 border border-white/5">
                    <div className="text-gray-500 text-[10px]">Installed Version</div>
                    <div className="text-cyan-300">{selectedSubsystem.installedVersion}</div>
                  </div>
                  <div className="p-2 rounded bg-white/5 border border-white/5">
                    <div className="text-gray-500 text-[10px]">Latest Version</div>
                    <div className="text-emerald-300">{selectedSubsystem.latestVersion}</div>
                  </div>
                  <div className="p-2 rounded bg-white/5 border border-white/5">
                    <div className="text-gray-500 text-[10px]">Round-Trip Latency</div>
                    <div className="text-amber-300">{selectedSubsystem.latencyMs || 0.1} ms</div>
                  </div>
                  <div className="p-2 rounded bg-white/5 border border-white/5">
                    <div className="text-gray-500 text-[10px]">Auto-Sync State</div>
                    <div className="text-green-400">ACTIVE</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HARDWARE & PERIPHERALS AUTO-DETECTION */}
        {activeTab === 'hardware' && hardware && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* CPU Card */}
            <div className="p-4 rounded-xl bg-[#131620] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <Cpu className="w-4 h-4" />
                <span>CPU & Virtual Compute</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Cores / Threads:</span>
                  <span className="font-mono text-white font-bold">{hardware.cpu.cores} Logical Cores</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Architecture:</span>
                  <span className="font-mono text-cyan-300">{hardware.cpu.architecture}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wasm SIMD 128:</span>
                  <span className="font-mono text-emerald-400 font-bold">{hardware.cpu.wasmSimd ? 'ENABLED' : 'DISABLED'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shared Threads:</span>
                  <span className="font-mono text-emerald-400 font-bold">{hardware.cpu.wasmThreads ? 'ACTIVE' : 'STANDBY'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Compute Concurrency:</span>
                  <span className="font-mono text-amber-300 font-bold">{hardware.cpu.concurrencyScore} pts</span>
                </div>
              </div>
            </div>

            {/* GPU & Display Card */}
            <div className="p-4 rounded-xl bg-[#131620] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <Monitor className="w-4 h-4" />
                <span>GPU & Display Subsystem</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Raster Engine:</span>
                  <span className="font-mono text-purple-300 truncate max-w-[140px]">{hardware.gpu.renderer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Refresh Rate:</span>
                  <span className="font-mono text-emerald-400 font-bold">{hardware.gpu.refreshRateHz} Hz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Color Gamut:</span>
                  <span className="font-mono text-cyan-300">{hardware.gpu.colorGamut}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Resolution & DPI:</span>
                  <span className="font-mono text-white">{hardware.gpu.screenWidth}x{hardware.gpu.screenHeight} @ {hardware.gpu.pixelRatio}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Texture Size:</span>
                  <span className="font-mono text-white">{hardware.gpu.maxTextureSize}px</span>
                </div>
              </div>
            </div>

            {/* Storage Quota Card */}
            <div className="p-4 rounded-xl bg-[#131620] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <HardDrive className="w-4 h-4" />
                <span>VFS & Storage Partitions</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Storage Quota:</span>
                  <span className="font-mono text-white">{Math.round(hardware.storage.estimatedQuotaBytes / 1024 / 1024 / 1024)} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Used Storage:</span>
                  <span className="font-mono text-amber-300">{Math.round(hardware.storage.estimatedUsageBytes / 1024 / 1024)} MB ({hardware.storage.percentUsed}%)</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${Math.max(4, hardware.storage.percentUsed)}%` }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">IndexedDB VFS Files:</span>
                  <span className="font-mono text-cyan-300 font-bold">{hardware.storage.vfsFileCount} files ({Math.round(hardware.storage.vfsTotalSizeBytes / 1024)} KB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">OPFS (Private FS):</span>
                  <span className="font-mono text-emerald-400">{hardware.storage.opfsAvailable ? 'SUPPORTED' : 'EMULATED'}</span>
                </div>
              </div>
            </div>

            {/* Audio Hardware Card */}
            <div className="p-4 rounded-xl bg-[#131620] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Volume2 className="w-4 h-4" />
                <span>Web Audio & DAC Engine</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">DAC Sample Rate:</span>
                  <span className="font-mono text-emerald-400 font-bold">{hardware.audio.sampleRate} Hz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Output Channels:</span>
                  <span className="font-mono text-white">{hardware.audio.outputChannels} Channel Stereo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">DAC Base Latency:</span>
                  <span className="font-mono text-cyan-300 font-bold">{hardware.audio.baseLatencyMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Web Audio State:</span>
                  <span className="font-mono text-green-400 uppercase">{hardware.audio.state}</span>
                </div>
              </div>
            </div>

            {/* Peripherals & Inputs Card */}
            <div className="p-4 rounded-xl bg-[#131620] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-pink-400 font-bold text-xs">
                <Gamepad2 className="w-4 h-4" />
                <span>Peripherals & Controllers</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Connected Gamepads:</span>
                  <span className="font-mono text-pink-300 font-bold">{hardware.peripherals.gamepadsCount} Controllers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Multi-Touch Support:</span>
                  <span className="font-mono text-white">{hardware.peripherals.touchSupport ? `YES (${hardware.peripherals.maxTouchPoints} pts)` : 'NO (Pointer)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Audio/Video Capture:</span>
                  <span className="font-mono text-cyan-300">{hardware.peripherals.mediaInputCount} Inputs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Keyboard Layout:</span>
                  <span className="font-mono text-white">{hardware.peripherals.keyboardLayout}</span>
                </div>
              </div>
            </div>

            {/* Battery & Power Card */}
            <div className="p-4 rounded-xl bg-[#131620] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                {hardware.peripherals.battery.charging ? <BatteryCharging className="w-4 h-4" /> : <Battery className="w-4 h-4" />}
                <span>Power & Energy Management</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Power Source:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {hardware.peripherals.battery.charging ? 'AC Connected / Charging' : 'Battery Discharging'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Battery Level:</span>
                  <span className="font-mono text-white font-bold">{Math.round(hardware.peripherals.battery.level * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${Math.round(hardware.peripherals.battery.level * 100)}%` }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Battery API:</span>
                  <span className="font-mono text-gray-300">{hardware.peripherals.battery.supported ? 'Supported' : 'Virtual AC Bridge'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUTO-UPDATER & REPOSITORY SYNC */}
        {activeTab === 'updates' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#131620] border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Automated System Package Updates</h3>
                <p className="text-xs text-gray-400">
                  Keep your Alpine repository indices, security heuristics, and shader caches current.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCheckEnabled}
                    onChange={(e) => setAutoCheckEnabled(e.target.checked)}
                    className="rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-0"
                  />
                  <span>Auto-Check on Connect</span>
                </label>

                <button
                  onClick={handleSyncAndUpdateAll}
                  disabled={isUpdatingAll}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Update All ({updates.filter((u) => u.status !== 'completed').length})</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {updates.map((item) => {
                const isCompleted = item.status === 'completed';
                const isWorking = item.status === 'downloading' || item.status === 'verifying' || item.status === 'installing';

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#12151e] border border-white/10 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{item.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-cyan-300 font-mono">
                          {item.currentVersion} → {item.newVersion}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">({item.size})</span>
                      </div>
                      <p className="text-[11px] text-gray-400">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isWorking && (
                        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{item.status}... {item.progress}%</span>
                        </div>
                      )}

                      {isCompleted ? (
                        <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Up to Date
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApplySingleUpdate(item.id)}
                          disabled={isWorking}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                        >
                          Install Update
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: SELF-HEALING & DIAGNOSTICS */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#131620] border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Self-Healing & System Integrity Daemon</h3>
                <p className="text-xs text-gray-400">
                  Scans VFS directory mounts, cleans corrupted descriptors, verifies audio context, and tests host bridge.
                </p>
              </div>

              <button
                onClick={handleRunSelfHealing}
                disabled={isHealing}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-cyan-950/50"
              >
                <Wrench className={`w-3.5 h-3.5 ${isHealing ? 'animate-spin' : ''}`} />
                <span>{isHealing ? 'Running Audit...' : 'Run Full Integrity Audit'}</span>
              </button>
            </div>

            {diagnosticReport ? (
              <div className="p-4 rounded-xl bg-[#12151e] border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Audit Completed at {diagnosticReport.timestamp}</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {diagnosticReport.passedChecks} / {diagnosticReport.totalChecks} Checks Passed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-gray-500 text-[10px]">Status</div>
                    <div className="text-emerald-400 font-bold">{diagnosticReport.status}</div>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-gray-500 text-[10px]">Issues Repaired</div>
                    <div className="text-cyan-400 font-bold">{diagnosticReport.repairedIssues}</div>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-gray-500 text-[10px]">Warnings</div>
                    <div className="text-amber-400 font-bold">{diagnosticReport.warnings.length}</div>
                  </div>
                </div>

                {diagnosticReport.repairs.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-cyan-300">Repaired Items:</div>
                    {diagnosticReport.repairs.map((r, i) => (
                      <div key={i} className="text-xs text-gray-300 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-[#12151e] border border-white/5 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-cyan-400 mx-auto opacity-70" />
                <p className="text-xs text-gray-400">
                  Click "Run Full Integrity Audit" to perform a deep diagnostics routine.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
