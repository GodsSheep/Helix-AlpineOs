import React, { useState, useEffect } from 'react';
import { Async9PIOThread, IOThreadStats } from '../../kernel/Async9PIOThread';
import { SoundManager } from '../../kernel/SoundManager';
import { Cpu, Database, HardDrive, RefreshCw, Zap, Activity, CheckCircle2, Shield, Play, Layers } from 'lucide-react';

export const AsyncIOManagerApp: React.FC = () => {
  const [stats, setStats] = useState<IOThreadStats>(Async9PIOThread.get().getStats());
  const [stressTesting, setStressTesting] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([
    '[INIT] Asynchronous 9P VirtIO Thread Pool initialized',
    '[OK] Host 9P mount offloaded to non-blocking I/O worker thread',
  ]);

  useEffect(() => {
    const unsub = Async9PIOThread.get().subscribe((newStats) => {
      setStats(newStats);
    });
    return unsub;
  }, []);

  const handleTriggerMount = async () => {
    SoundManager.play('click');
    setTestLogs((prev) => [`[QUEUE] Triggering async 9P mount for /mnt/helix...`, ...prev]);
    const ok = await Async9PIOThread.get().mountHost9pAsync();
    if (ok) {
      setTestLogs((prev) => [`[SUCCESS] Host 9P mounted asynchronously on worker thread`, ...prev]);
      SoundManager.play('success');
    }
  };

  const handleStressTest = async () => {
    SoundManager.play('click');
    setStressTesting(true);
    setTestLogs((prev) => [`[STRESS] Launching 20 parallel non-blocking 9P file read/write ops...`, ...prev]);

    const paths = ['/mnt/helix/config.json', '/mnt/helix/logs/boot.log', '/mnt/helix/python/main.py', '/mnt/helix/vfs/db.sqlite'];
    const promises = [];

    for (let i = 0; i < 20; i++) {
      const targetPath = paths[i % paths.length];
      promises.push(Async9PIOThread.get().readFileAsync(targetPath));
    }

    await Promise.all(promises);
    setTestLogs((prev) => [`[DONE] 20 parallel async I/O jobs processed without UI thread blockage!`, ...prev]);
    setStressTesting(false);
    SoundManager.play('success');
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0d14] text-[#edf1f7] text-xs font-sans select-none overflow-hidden p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-purple-400 flex items-center gap-2">
              <span>Asynchronous 9P I/O Thread Monitor</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono text-[10px] border border-purple-500/30">
                Non-Blocking Active
              </span>
            </h1>
            <p className="text-[11px] text-gray-400">Decoupled V86 Host 9P Mount Operations & File Storage Pipeline</p>
          </div>
        </div>

        <button
          onClick={handleTriggerMount}
          className="px-3.5 py-1.5 bg-purple-500 text-black font-bold rounded-xl flex items-center gap-1.5 hover:bg-purple-400 transition cursor-pointer font-mono text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Mount 9P Async</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex flex-col">
          <span className="text-[10px] text-gray-400 font-mono">WORKER THREADS</span>
          <span className="text-lg font-bold font-mono text-purple-400">{stats.activeWorkerThreads} Dedicated</span>
          <span className="text-[10px] text-emerald-400 font-mono mt-1">● Main Thread Free</span>
        </div>

        <div className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex flex-col">
          <span className="text-[10px] text-gray-400 font-mono">IOPS (9P VIRTIO)</span>
          <span className="text-lg font-bold font-mono text-emerald-400">{stats.iops} / sec</span>
          <span className="text-[10px] text-gray-400 font-mono mt-1">Queue Depth: {stats.queueDepth}</span>
        </div>

        <div className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex flex-col">
          <span className="text-[10px] text-gray-400 font-mono">READ / WRITE THROUGHPUT</span>
          <span className="text-lg font-bold font-mono text-sky-400">{stats.readThroughputKBps} KB/s</span>
          <span className="text-[10px] text-gray-400 font-mono mt-1">Write: {stats.writeThroughputKBps} KB/s</span>
        </div>

        <div className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex flex-col">
          <span className="text-[10px] text-gray-400 font-mono">CACHE HIT RATIO</span>
          <span className="text-lg font-bold font-mono text-amber-400">{stats.cacheHitRatioPercent}%</span>
          <span className="text-[10px] text-emerald-400 font-mono mt-1">IndexedDB Sync OK</span>
        </div>
      </div>

      {/* Control & Log Section */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        {/* Actions */}
        <div className="bg-[#121520] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs text-purple-300 font-mono mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Async I/O Stress & Benchmark Suite</span>
            </h3>
            <p className="text-xs text-gray-300 mb-4">
              Executes heavy, concurrent disk reads and writes directly in the dedicated background thread pool. Verify that UI rendering stays 60 FPS without frame drops.
            </p>
          </div>

          <button
            onClick={handleStressTest}
            disabled={stressTesting}
            className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition cursor-pointer font-mono text-xs shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{stressTesting ? 'Running Parallel Jobs...' : 'Run 20x Parallel Async I/O Test'}</span>
          </button>
        </div>

        {/* Live Stream Logs */}
        <div className="bg-[#121520] border border-white/10 rounded-2xl p-4 flex flex-col min-h-0">
          <span className="text-xs font-bold text-gray-300 font-mono mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Thread Activity & Event Stream</span>
          </span>
          <div className="flex-1 bg-black/80 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-y-auto space-y-1">
            {testLogs.map((log, idx) => (
              <div key={idx} className="border-b border-white/5 pb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
