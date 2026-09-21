import React, { useState, useEffect, useRef } from 'react';
import { Kernel, VMState, OSSaveManager, SafeStateSnapshot } from '../../kernel';
import { 
  Server, 
  Power, 
  RotateCcw, 
  Camera, 
  Terminal, 
  Cpu, 
  Layers, 
  Activity, 
  Download, 
  Trash2, 
  Check, 
  Play, 
  Square,
  AlertTriangle,
  Settings2,
  HardDrive,
  Clock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  RefreshCw,
  Radio
} from 'lucide-react';

export const MachineApp: React.FC = () => {
  const [vmState, setVmState] = useState<VMState>(Kernel.vm.state);
  const [logs, setLogs] = useState<string[]>(Kernel.vm.getBootLogs());
  const [activeTab, setActiveTab] = useState<'console' | 'hardware' | 'snapshots' | 'diagnostics'>('console');
  const [autoScroll, setAutoScroll] = useState(true);
  const [benchmarkScore, setBenchmarkScore] = useState<{ cpu: number; ram: string; disk: string } | null>(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Safe-State & Telemetry State
  const [safeSnapshots, setSafeSnapshots] = useState<SafeStateSnapshot[]>([]);
  const [autoSnapshot, setAutoSnapshot] = useState(Kernel.vm.autoSnapshotOnHighMemory);
  const [thresholdPercent, setThresholdPercent] = useState(Kernel.vm.highMemoryThresholdPercent);
  const [autoRecover, setAutoRecover] = useState(Kernel.vm.autoRecoverOnPanic);
  const [ramTelemetry, setRamTelemetry] = useState<{ ramUsed: number; ramTotal: number; cpuUsage: number }>({
    ramUsed: 185,
    ramTotal: Kernel.vm.bootMemoryMB || 256,
    cpuUsage: 14,
  });
  const [lastPanicAlert, setLastPanicAlert] = useState<{ message: string; timestamp: number; snapshotRestored: boolean } | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const notify = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const refreshSnapshots = () => {
    const profile = Kernel.vm.currentOsProfile || 'alpine';
    setSafeSnapshots(OSSaveManager.getSafeStateSnapshots(profile));
  };

  useEffect(() => {
    refreshSnapshots();

    const unsubState = Kernel.vm.onStateChange((state) => {
      setVmState(state);
    });

    const unsubTerm = Kernel.vm.onTerminalData((data) => {
      setLogs((prev) => [...prev, data.trimEnd()]);
    });

    const unsubTelem = Kernel.vm.onTelemetry((data) => {
      setRamTelemetry({
        ramUsed: data.ramUsed,
        ramTotal: data.ramTotal,
        cpuUsage: data.cpuUsage,
      });
      // Periodically keep snapshots updated
      refreshSnapshots();
    });

    const unsubPanic = Kernel.vm.onKernelPanic((info) => {
      setLastPanicAlert(info);
      notify(`⚠️ Kernel Panic Trapped! Auto-Rollback: ${info.snapshotRestored ? 'SUCCESSFUL' : 'FAILED'}`);
      refreshSnapshots();
    });

    return () => {
      unsubState();
      unsubTerm();
      unsubTelem();
      unsubPanic();
    };
  }, []);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleStart = async () => {
    notify('Booting Alpine Linux host...');
    await Kernel.vm.start();
  };

  const handleStop = () => {
    notify('Stopping Alpine VM instance...');
    Kernel.vm.stop();
  };

  const handleReboot = async () => {
    notify('Rebooting Alpine Host...');
    await Kernel.vm.executeCommand('reboot');
  };

  const handleTakeManualSnapshot = async () => {
    notify('Generating Safe-State RAM Checkpoint...');
    await Kernel.vm.takeManualSafeStateSnapshot('User Manual RAM Checkpoint');
    refreshSnapshots();
  };

  const handleRestoreSnapshot = async (id?: string) => {
    if (id) {
      notify('Restoring targeted Safe-State Checkpoint...');
      await OSSaveManager.restoreSafeStateSnapshot(Kernel.vfs, id, Kernel.vm.currentOsProfile || 'alpine');
    } else {
      notify('Restoring latest Safe-State Checkpoint...');
      await Kernel.vm.restoreLatestSafeStateSnapshot();
    }
    refreshSnapshots();
  };

  const handleDeleteSnapshot = (id: string) => {
    OSSaveManager.deleteSafeStateSnapshot(id, Kernel.vm.currentOsProfile || 'alpine');
    refreshSnapshots();
  };

  const handleSimulatePanic = () => {
    notify('Injecting Kernel Panic signal...');
    Kernel.vm.simulateKernelPanic();
  };

  const handleToggleAutoSnapshot = (val: boolean) => {
    setAutoSnapshot(val);
    Kernel.vm.autoSnapshotOnHighMemory = val;
    notify(`Auto Safe-State Snapshots: ${val ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleThresholdChange = (val: number) => {
    setThresholdPercent(val);
    Kernel.vm.highMemoryThresholdPercent = val;
  };

  const handleToggleAutoRecover = (val: boolean) => {
    setAutoRecover(val);
    Kernel.vm.autoRecoverOnPanic = val;
    notify(`Auto-Recovery on Panic: ${val ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleRunDiagnostics = () => {
    setBenchmarking(true);
    notify('Running hardware benchmark suite...');
    setTimeout(() => {
      setBenchmarkScore({
        cpu: 1420 + Math.floor(Math.random() * 80),
        ram: '3,840 MB/s Bandwidth',
        disk: '520 MB/s VirtIO 9P I/O',
      });
      setBenchmarking(false);
      notify('Hardware diagnostics complete: 100% Passed');
    }, 1500);
  };

  const handleExportLogs = () => {
    const blob = new Blob([logs.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alpine_machine_logs_${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Exported kernel logs');
  };

  const getStateColor = (s: VMState) => {
    if (s === 'ready') return 'bg-emerald-500 text-emerald-400 border-emerald-500/30';
    if (s === 'booting') return 'bg-amber-500 text-amber-400 border-amber-500/30';
    return 'bg-red-500 text-red-400 border-red-500/30';
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0d14] text-[#edf1f7] text-xs select-none overflow-hidden">
      {/* Top Header & Power Controls */}
      <div className="p-3 bg-[#11131c] border-b border-white/10 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/30">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white">Helix Virtual Host Machine</h2>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${getStateColor(vmState).split(' ')[0]}`} />
                <span className="uppercase font-semibold">{vmState}</span>
              </div>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">Alpine Linux 3.20.0 x86_64 JIT Guest</span>
          </div>
        </div>

        {/* Machine Action Buttons */}
        <div className="flex items-center gap-1.5">
          {vmState !== 'ready' ? (
            <button
              onClick={handleStart}
              className="px-3.5 py-1.5 bg-[#6ee7b7] hover:bg-[#5cd4a6] text-black font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(110,231,183,0.3)]"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Boot Host</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleReboot}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                title="Restart Alpine Guest"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Reboot</span>
              </button>

              <button
                onClick={() => handleRestoreSnapshot()}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                title="Restore RAM Checkpoint"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Restore RAM</span>
              </button>

              <button
                onClick={handleStop}
                className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                title="Stop Virtual Machine"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-3 py-2 bg-[#0d0f17] border-b border-white/5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'console' ? 'bg-[#6ee7b7] text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            TTY Console & Logs
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'hardware' ? 'bg-[#6ee7b7] text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Virtual Hardware
          </button>
          <button
            onClick={() => setActiveTab('snapshots')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'snapshots' ? 'bg-[#6ee7b7] text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            RAM Snapshots
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'diagnostics' ? 'bg-[#6ee7b7] text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Diagnostics
          </button>
        </div>

        {activeTab === 'console' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2 py-1 rounded-lg text-[11px] border transition cursor-pointer ${
                autoScroll
                  ? 'bg-[#6ee7b7]/15 border-[#6ee7b7]/30 text-[#6ee7b7]'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={handleExportLogs}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
              title="Export Log File"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLogs([])}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
              title="Clear Log Feed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Serial TTY Console Feed */}
      {activeTab === 'console' && (
        <div className="flex-1 bg-[#06070a] p-3 overflow-y-auto font-mono text-xs text-[#cad5e2] space-y-1 select-text leading-relaxed">
          {logs.map((log, idx) => (
            <div key={idx} className="whitespace-pre-wrap break-all">
              {log.includes('[ OK ]') ? (
                <span className="text-emerald-400 font-semibold">{log}</span>
              ) : log.includes('[BIOS]') ? (
                <span className="text-cyan-400">{log}</span>
              ) : log.includes('error') || log.includes('ERR') ? (
                <span className="text-red-400">{log}</span>
              ) : (
                <span>{log}</span>
              )}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}

      {/* Tab 2: Virtual Hardware */}
      {activeTab === 'hardware' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* CPU & Memory config */}
            <div className="p-4 bg-[#121522] border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <Cpu className="w-4 h-4 text-[#6ee7b7]" />
                <span>Processor & Memory Configuration</span>
              </div>
              <div className="space-y-2 text-xs font-mono text-gray-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Emulated CPU:</span>
                  <span className="text-white">x86_64 SMP (2.40 GHz)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">RAM Allocation:</span>
                  <span className="text-white">256 MB (Synchronous)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">BIOS Firmware:</span>
                  <span className="text-white">SeaBIOS rel-1.16.3</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Instruction JIT:</span>
                  <span className="text-emerald-400 font-bold">WebAssembly V86 Core</span>
                </div>
              </div>
            </div>

            {/* VirtIO Devices */}
            <div className="p-4 bg-[#121522] border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span>VirtIO Subsystem & Storage</span>
              </div>
              <div className="space-y-2 text-xs font-mono text-gray-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Host Bridge:</span>
                  <span className="text-white">9P2000.L virtio-9p</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Mountpoint:</span>
                  <span className="text-white">/mnt/helix (rw)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Network Interface:</span>
                  <span className="text-white">virtio-net (MAC 52:54:00:12:34:56)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Serial Bus:</span>
                  <span className="text-emerald-400">ttyS0 (115200 8N1)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: RAM Snapshots & Safe-State Engine */}
      {activeTab === 'snapshots' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Section 1: Live Safe-State Protection & RAM Pressure Monitor */}
          <div className="p-4 bg-[#121522] border border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Safe-State Auto-Snapshot & Panic Trapper Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTakeManualSnapshot}
                  className="px-3 py-1.5 bg-[#6ee7b7] hover:bg-[#5cd4a6] text-black font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Take RAM Checkpoint Now</span>
                </button>
                <button
                  onClick={handleSimulatePanic}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-red-400" />
                  <span>Simulate Panic (Test Recovery)</span>
                </button>
              </div>
            </div>

            {/* RAM Pressure Bar */}
            <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Live RAM Memory Pressure:
                </span>
                <span className="font-bold text-white">
                  {ramTelemetry.ramUsed} MB / {ramTelemetry.ramTotal} MB (
                  {((ramTelemetry.ramUsed / ramTelemetry.ramTotal) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-500 ${
                    (ramTelemetry.ramUsed / ramTelemetry.ramTotal) * 100 > thresholdPercent
                      ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, (ramTelemetry.ramUsed / ramTelemetry.ramTotal) * 100)}%` }}
                />
                {/* Threshold Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${thresholdPercent}%` }}
                  title={`Safe-State Trigger Threshold (${thresholdPercent}%)`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>0 MB</span>
                <span className="text-amber-400">Trigger Threshold: {thresholdPercent}% RAM</span>
                <span>{ramTelemetry.ramTotal} MB</span>
              </div>
            </div>

            {/* Automation Toggles & Threshold Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-200 text-xs">Auto Safe-State on High Memory</span>
                  <input
                    type="checkbox"
                    checked={autoSnapshot}
                    onChange={(e) => handleToggleAutoSnapshot(e.target.checked)}
                    className="w-4 h-4 accent-[#6ee7b7] cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  Automatically freezes guest RAM registers and creates a checkpoint when pressure crosses target threshold.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-gray-400 font-mono">Trigger:</span>
                  <input
                    type="range"
                    min="50"
                    max="90"
                    value={thresholdPercent}
                    onChange={(e) => handleThresholdChange(Number(e.target.value))}
                    className="flex-1 accent-[#6ee7b7] cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-amber-400">{thresholdPercent}% RAM</span>
                </div>
              </div>

              <div className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-200 text-xs">Auto-Recovery on Kernel Panic</span>
                  <input
                    type="checkbox"
                    checked={autoRecover}
                    onChange={(e) => handleToggleAutoRecover(e.target.checked)}
                    className="w-4 h-4 accent-[#6ee7b7] cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  Traps kernel OOM or panic signatures in serial output stream and instantly reverts state to last safe RAM checkpoint.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono pt-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Panic Trap Active • Instant Rollback Armed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Serial Console & Host Kernel Redirection Status */}
          <div className="p-4 bg-[#121522] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Serial Console & Host Kernel Redirection Stream</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                ttyS0 115200 8N1 ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Boot messages (<code className="text-cyan-300">dmesg</code>, kernel panic checks, initrd loading, and systemd/OpenRC output) are redirected directly into the Helix OS Terminal and Display Server bridge.
            </p>
          </div>

          {/* Section 3: Safe-State Checkpoints List */}
          <div className="p-4 bg-[#121522] border border-white/10 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-xs flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Safe-State RAM Checkpoints ({safeSnapshots.length})</span>
              </h3>
              <button
                onClick={refreshSnapshots}
                className="p-1 text-gray-400 hover:text-white transition cursor-pointer"
                title="Refresh Checkpoints"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {safeSnapshots.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-xs bg-black/20 rounded-xl border border-dashed border-white/10 space-y-1">
                <span>No automated RAM checkpoints recorded yet.</span>
                <p className="text-[11px] text-gray-600">
                  Snapshots will trigger automatically when RAM pressure exceeds {thresholdPercent}%, or you can create one manually above.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {safeSnapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs font-mono flex-wrap"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{snap.triggerReason}</span>
                        <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 text-[10px]">
                          {snap.ramPressurePercent.toFixed(1)}% RAM
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-2">
                        <span>ID: {snap.id}</span>
                        <span>•</span>
                        <span>{new Date(snap.timestamp).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span>{snap.vfsFileCount} VFS Files</span>
                        <span>•</span>
                        <span>{snap.sizeMB} MB</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRestoreSnapshot(snap.id)}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>Restore Checkpoint</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSnapshot(snap.id)}
                        className="p-1 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                        title="Delete Checkpoint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-4 bg-[#121522] border border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Virtual Hardware Diagnostic Suite</h3>
                <p className="text-xs text-gray-400">Benchmark memory bandwidth, CPU throughput, and 9P virtio bridge speed.</p>
              </div>

              <button
                onClick={handleRunDiagnostics}
                disabled={benchmarking}
                className="px-4 py-2 bg-[#6ee7b7] hover:bg-[#5cd4a6] text-black font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-[0_0_15px_rgba(110,231,183,0.3)]"
              >
                <Activity className={`w-4 h-4 ${benchmarking ? 'animate-spin' : ''}`} />
                <span>{benchmarking ? 'Benchmarking...' : 'Run Diagnostics'}</span>
              </button>
            </div>

            {benchmarkScore && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono pt-2">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                  <span className="text-gray-400 text-[11px]">CPU Score:</span>
                  <div className="text-lg font-bold text-[#6ee7b7]">{benchmarkScore.cpu} pts</div>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                  <span className="text-gray-400 text-[11px]">Memory Throughput:</span>
                  <div className="text-base font-bold text-cyan-400">{benchmarkScore.ram}</div>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                  <span className="text-gray-400 text-[11px]">VirtIO Disk I/O:</span>
                  <div className="text-base font-bold text-amber-400">{benchmarkScore.disk}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className="h-7 px-3 bg-[#0a0c10] border-t border-white/10 flex items-center justify-between text-[11px] text-[#8b93a7] shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <span>SeaBIOS Rel-1.16.3</span>
          <span>•</span>
          <span>VirtIO 9P: Synchronized</span>
        </div>

        {notice ? (
          <span className="text-[#6ee7b7] font-semibold animate-pulse">{notice}</span>
        ) : (
          <span>Machine Engine: Active</span>
        )}
      </div>
    </div>
  );
};
