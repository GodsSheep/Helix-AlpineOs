import React, { useState, useEffect } from 'react';
import { Kernel, TelemetryData } from '../../kernel';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Layers, 
  Trash2, 
  RefreshCw, 
  Search, 
  Clock, 
  Server, 
  Wifi, 
  ShieldAlert,
  ArrowDown,
  ArrowUp,
  X,
  Play,
  CheckCircle2
} from 'lucide-react';

interface ProcessItem {
  pid: number;
  user: string;
  cmd: string;
  mem: string;
  cpu: number;
  status: 'running' | 'sleeping' | 'idle';
}

export const MonitorApp: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    ramUsed: 47,
    ramTotal: 256,
    cpuUsage: 14,
    processes: [
      { pid: 1, cmd: '/sbin/init', mem: '4.2 MB' },
      { pid: 45, cmd: 'syslogd -n', mem: '1.8 MB' },
      { pid: 120, cmd: 'sshd: root@pts/0', mem: '6.4 MB' },
      { pid: 140, cmd: 'helix-rpc-bus daemon', mem: '14.1 MB' },
      { pid: 210, cmd: '/bin/ash interactive', mem: '2.8 MB' },
      { pid: 340, cmd: 'v86-jit-accelerator', mem: '18.5 MB' },
    ],
  });

  const [activeProcesses, setActiveProcesses] = useState<ProcessItem[]>([
    { pid: 1, user: 'root', cmd: '/sbin/init', mem: '4.2 MB', cpu: 0.1, status: 'sleeping' },
    { pid: 45, user: 'root', cmd: 'syslogd -n', mem: '1.8 MB', cpu: 0.2, status: 'running' },
    { pid: 120, user: 'root', cmd: 'sshd: root@pts/0', mem: '6.4 MB', cpu: 0.4, status: 'sleeping' },
    { pid: 140, user: 'root', cmd: 'helix-rpc-bus daemon', mem: '14.1 MB', cpu: 1.8, status: 'running' },
    { pid: 210, user: 'root', cmd: '/bin/ash interactive', mem: '2.8 MB', cpu: 0.1, status: 'sleeping' },
    { pid: 340, user: 'root', cmd: 'v86-jit-accelerator', mem: '18.5 MB', cpu: 3.4, status: 'running' },
    { pid: 412, user: 'root', cmd: 'alpine-sync-worker', mem: '3.1 MB', cpu: 0.5, status: 'sleeping' },
  ]);

  const [cpuHistory, setCpuHistory] = useState<number[]>([12, 18, 14, 22, 16, 28, 14, 19, 15, 23, 18, 14]);
  const [activeTab, setActiveTab] = useState<'overview' | 'processes' | 'storage' | 'network'>('overview');
  const [processSearch, setProcessSearch] = useState('');
  const [sortBy, setSortBy] = useState<'cpu' | 'mem' | 'pid'>('cpu');
  const [notice, setNotice] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  useEffect(() => {
    const unsub = Kernel.vm.onTelemetry((data) => {
      setTelemetry(data);
      setCpuHistory((prev) => [...prev.slice(-19), data.cpuUsage]);
    });
    return () => unsub();
  }, []);

  const handleKillProcess = async (pid: number, cmd: string) => {
    await Kernel.vm.executeCommand(`kill ${pid}`);
    setActiveProcesses((prev) => prev.filter((p) => p.pid !== pid));
    notify(`Process ${pid} (${cmd}) terminated.`);
  };

  const handleSpawnStress = () => {
    const newPid = Math.floor(Math.random() * 800 + 500);
    const stressProc: ProcessItem = {
      pid: newPid,
      user: 'root',
      cmd: `worker-task-${newPid} (stress-ng)`,
      mem: `${Math.floor(Math.random() * 8 + 4)}.${Math.floor(Math.random() * 9)} MB`,
      cpu: Math.floor(Math.random() * 15 + 10),
      status: 'running',
    };
    setActiveProcesses((prev) => [...prev, stressProc]);
    notify(`Spawned background worker task (PID ${newPid})`);
  };

  const filteredProcesses = activeProcesses
    .filter((p) => p.cmd.toLowerCase().includes(processSearch.toLowerCase()) || String(p.pid).includes(processSearch))
    .sort((a, b) => {
      if (sortBy === 'cpu') return b.cpu - a.cpu;
      if (sortBy === 'mem') return parseFloat(b.mem) - parseFloat(a.mem);
      return a.pid - b.pid;
    });

  const ramPercent = Math.round((telemetry.ramUsed / telemetry.ramTotal) * 100);

  return (
    <div className="h-full flex flex-col bg-[#0b0d14] text-[#edf1f7] text-xs select-none overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-[#11131c] border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>Alpine Linux Task & System Monitor</span>
            </h2>
            <span className="text-[11px] text-gray-400 font-mono">Kernel 6.6.14-virt (x86_64 SMP)</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'overview' ? 'bg-[#6ee7b7] text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('processes')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'processes' ? 'bg-[#6ee7b7] text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Processes ({activeProcesses.length})
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'storage' ? 'bg-[#6ee7b7] text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Disks & Mounts
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'network' ? 'bg-[#6ee7b7] text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Network
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* CPU Card */}
              <div className="p-4 bg-[#121522] border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#6ee7b7]" />
                    <span className="font-semibold text-white">CPU Utilization</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-[#6ee7b7]">{telemetry.cpuUsage}%</span>
                </div>

                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#6ee7b7] to-emerald-400 transition-all duration-500"
                    style={{ width: `${telemetry.cpuUsage}%` }}
                  />
                </div>

                {/* Mini Area Graph */}
                <div className="h-12 flex items-end gap-1 pt-2">
                  {cpuHistory.map((val, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-[#6ee7b7]/30 hover:bg-[#6ee7b7] rounded-t transition-all"
                      style={{ height: `${Math.max(10, val * 1.8)}%` }}
                      title={`CPU: ${val}%`}
                    />
                  ))}
                </div>
              </div>

              {/* Memory Card */}
              <div className="p-4 bg-[#121522] border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-white">RAM Allocation</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-cyan-400">
                    {telemetry.ramUsed} / {telemetry.ramTotal} MB
                  </span>
                </div>

                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-500"
                    style={{ width: `${ramPercent}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-gray-400 pt-1 font-mono">
                  <span>Free: {telemetry.ramTotal - telemetry.ramUsed} MB</span>
                  <span>Cache: 27 MB</span>
                  <span>Swap: 0 MB</span>
                </div>
              </div>

              {/* System State Card */}
              <div className="p-4 bg-[#121522] border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-white">Alpine Host</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                    ONLINE
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-300 font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Architecture:</span>
                    <span>x86_64 Emulated</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Threads:</span>
                    <span>1 Core / 1 Thread</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">VirtIO Bridge:</span>
                    <span className="text-emerald-400">9P Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Processes Snapshot */}
            <div className="p-4 bg-[#121522] border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#6ee7b7]" />
                  Active System Processes
                </h3>
                <button
                  onClick={handleSpawnStress}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition cursor-pointer text-xs"
                >
                  + Spawn Worker
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-[11px]">
                      <th className="pb-2">PID</th>
                      <th className="pb-2">USER</th>
                      <th className="pb-2">COMMAND</th>
                      <th className="pb-2">CPU%</th>
                      <th className="pb-2">MEM</th>
                      <th className="pb-2 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {activeProcesses.slice(0, 5).map((p) => (
                      <tr key={p.pid} className="hover:bg-white/[0.02]">
                        <td className="py-2 text-[#6ee7b7] font-semibold">{p.pid}</td>
                        <td className="py-2 text-gray-400">{p.user}</td>
                        <td className="py-2 text-white font-medium">{p.cmd}</td>
                        <td className="py-2 text-amber-400">{p.cpu}%</td>
                        <td className="py-2 text-gray-300">{p.mem}</td>
                        <td className="py-2 text-right">
                          {p.pid !== 1 && (
                            <button
                              onClick={() => handleKillProcess(p.pid, p.cmd)}
                              className="px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[11px] transition cursor-pointer"
                            >
                              Kill
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Full Interactive Process Manager */}
        {activeTab === 'processes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by name or PID..."
                  value={processSearch}
                  onChange={(e) => setProcessSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white outline-none w-48 sm:w-64 focus:border-[#6ee7b7]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 text-xs">Sort:</span>
                <button
                  onClick={() => setSortBy('cpu')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                    sortBy === 'cpu' ? 'bg-[#6ee7b7] text-black font-bold' : 'bg-white/5 text-gray-300'
                  }`}
                >
                  CPU
                </button>
                <button
                  onClick={() => setSortBy('mem')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                    sortBy === 'mem' ? 'bg-[#6ee7b7] text-black font-bold' : 'bg-white/5 text-gray-300'
                  }`}
                >
                  Memory
                </button>
                <button
                  onClick={() => setSortBy('pid')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                    sortBy === 'pid' ? 'bg-[#6ee7b7] text-black font-bold' : 'bg-white/5 text-gray-300'
                  }`}
                >
                  PID
                </button>
              </div>
            </div>

            <div className="p-3 bg-[#121522] border border-white/10 rounded-2xl overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-[11px]">
                    <th className="pb-2">PID</th>
                    <th className="pb-2">USER</th>
                    <th className="pb-2">COMMAND</th>
                    <th className="pb-2">STATUS</th>
                    <th className="pb-2">CPU%</th>
                    <th className="pb-2">MEMORY</th>
                    <th className="pb-2 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProcesses.map((p) => (
                    <tr key={p.pid} className="hover:bg-white/[0.02]">
                      <td className="py-2 text-[#6ee7b7] font-semibold">{p.pid}</td>
                      <td className="py-2 text-gray-400">{p.user}</td>
                      <td className="py-2 text-white font-medium">{p.cmd}</td>
                      <td className="py-2">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300 text-[10px]">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2 text-amber-400">{p.cpu}%</td>
                      <td className="py-2 text-gray-300">{p.mem}</td>
                      <td className="py-2 text-right">
                        {p.pid !== 1 ? (
                          <button
                            onClick={() => handleKillProcess(p.pid, p.cmd)}
                            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition cursor-pointer"
                          >
                            Terminate
                          </button>
                        ) : (
                          <span className="text-gray-500 text-[10px]">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Disks & Mounts */}
        {activeTab === 'storage' && (
          <div className="space-y-3">
            <div className="p-4 bg-[#121522] border border-white/10 rounded-2xl space-y-4">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                Mounted Filesystems & Partitions
              </h3>

              <div className="space-y-4 font-mono text-xs">
                {/* /dev/sda1 */}
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">/dev/sda1 (ext4)</span>
                      <span className="text-gray-400 text-[11px] block">Root Partition (/)</span>
                    </div>
                    <span className="text-gray-300 font-bold">142.4 MB / 2.0 GB (7%)</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 w-[7%]" />
                  </div>
                </div>

                {/* host9p */}
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">host9p (9P2000.L)</span>
                      <span className="text-gray-400 text-[11px] block">VirtIO Host Mount (/mnt/helix)</span>
                    </div>
                    <span className="text-[#6ee7b7] font-bold">14.2 MB / 500 MB (3%)</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#6ee7b7] w-[3%]" />
                  </div>
                </div>

                {/* devtmpfs */}
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">devtmpfs</span>
                      <span className="text-gray-400 text-[11px] block">Device Nodes (/dev)</span>
                    </div>
                    <span className="text-gray-400">0 MB / 10.0 MB</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-500 w-[1%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Network */}
        {activeTab === 'network' && (
          <div className="space-y-3">
            <div className="p-4 bg-[#121522] border border-white/10 rounded-2xl space-y-4">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                Network Interfaces & Traffic
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                {/* eth0 */}
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">eth0 (VirtIO Net)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">UP</span>
                  </div>
                  <div className="space-y-1 text-gray-300 text-[11px]">
                    <div>IP: 192.168.1.105 / 24</div>
                    <div>MAC: 52:54:00:12:34:56</div>
                    <div className="flex justify-between pt-1 text-gray-400 border-t border-white/5">
                      <span>RX: 17.4 MiB (24,810 pkts)</span>
                      <span>TX: 4.0 MiB (18,942 pkts)</span>
                    </div>
                  </div>
                </div>

                {/* lo */}
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">lo (Loopback)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">UP</span>
                  </div>
                  <div className="space-y-1 text-gray-300 text-[11px]">
                    <div>IP: 127.0.0.1 / 8</div>
                    <div>IPv6: ::1 / 128</div>
                    <div className="flex justify-between pt-1 text-gray-400 border-t border-white/5">
                      <span>RX: 412 pkts</span>
                      <span>TX: 412 pkts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="h-7 px-3 bg-[#0a0c10] border-t border-white/10 flex items-center justify-between text-[11px] text-[#8b93a7] shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <span>Telemetry Polling: 2000ms</span>
          <span>•</span>
          <span>Load Avg: 0.18, 0.12, 0.05</span>
        </div>

        {notice ? (
          <span className="text-[#6ee7b7] font-semibold animate-pulse">{notice}</span>
        ) : (
          <span>System Healthy</span>
        )}
      </div>
    </div>
  );
};
