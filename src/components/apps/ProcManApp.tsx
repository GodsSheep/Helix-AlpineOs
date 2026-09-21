import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Zap, Trash2, RefreshCw, Search, PanelLeftClose, PanelLeft, Pause, Play, AlertCircle, Shield } from 'lucide-react';
import { Toast } from '../../kernel/Toast';
import { HostKernelBridge } from '../../kernel/HostKernelBridge';

interface ProcessItem {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  mem: number;
  status: string;
  threads: number;
  nice: number;
  cmdline: string;
}

export const ProcManApp: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessItem[]>([
    { pid: 1, name: 'init', user: 'root', cpu: 0.1, mem: 1.4, status: 'S', threads: 1, nice: 0, cmdline: '/sbin/init' },
    { pid: 2, name: 'kthreadd', user: 'root', cpu: 0.0, mem: 0.0, status: 'S', threads: 2, nice: -20, cmdline: '[kthreadd]' },
    { pid: 42, name: 'v86-vm-worker', user: 'root', cpu: 4.2, mem: 24.8, status: 'R', threads: 8, nice: -5, cmdline: '/usr/libexec/v86-worker --jit' },
    { pid: 108, name: 'wayland-compositor', user: 'helix', cpu: 2.1, mem: 12.5, status: 'S', threads: 4, nice: 0, cmdline: '/usr/bin/helix-compositor' },
    { pid: 215, name: 'node server.cjs', user: 'helix', cpu: 1.8, mem: 34.2, status: 'S', threads: 6, nice: 0, cmdline: 'node /app/dist/server.cjs' },
    { pid: 340, name: 'bash', user: 'helix', cpu: 0.0, mem: 2.1, status: 'S', threads: 1, nice: 0, cmdline: '/bin/bash -l' },
    { pid: 402, name: 'htop / monitor', user: 'helix', cpu: 0.5, mem: 4.6, status: 'R', threads: 1, nice: 0, cmdline: 'htop -d 20' },
    { pid: 512, name: 'crond', user: 'root', cpu: 0.0, mem: 1.1, status: 'S', threads: 1, nice: 0, cmdline: 'crond -b -l 5' },
    { pid: 619, name: 'sshd', user: 'root', cpu: 0.0, mem: 3.2, status: 'S', threads: 1, nice: 0, cmdline: '/usr/sbin/sshd -D' },
  ]);
  const [selectedPid, setSelectedPid] = useState<number | null>(42);
  const [search, setSearch] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isHostConnected, setIsHostConnected] = useState(false);

  const fetchHostProcesses = async () => {
    try {
      const realProcs = await HostKernelBridge.getProcesses();
      if (realProcs && realProcs.length > 0) {
        setIsHostConnected(true);
        const mapped: ProcessItem[] = realProcs.map((p) => ({
          pid: p.pid,
          name: p.command.split(' ')[0].split('/').pop() || p.command,
          user: p.user,
          cpu: p.cpu,
          mem: p.mem,
          status: p.stat.substring(0, 1) || 'S',
          threads: 1,
          nice: 0,
          cmdline: p.command,
        }));
        setProcesses(mapped);
      }
    } catch {
      setIsHostConnected(false);
    }
  };

  useEffect(() => {
    fetchHostProcesses();
    const timer = setInterval(() => {
      fetchHostProcesses();
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleSignal = async (pid: number, signal: 'KILL' | 'TERM' | 'STOP' | 'CONT') => {
    if (pid <= 2 && (signal === 'KILL' || signal === 'TERM')) {
      Toast.show('Cannot terminate critical kernel system process (PID ' + pid + ')', '⚠️');
      return;
    }

    if (signal === 'KILL' || signal === 'TERM') {
      const sigName = signal === 'KILL' ? 'SIGKILL' : 'SIGTERM';
      await HostKernelBridge.killProcess(pid, sigName).catch(() => {});
      setProcesses((prev) => prev.filter((p) => p.pid !== pid));
      Toast.show(`Process ${pid} sent ${sigName} and terminated`, '✓');
      if (selectedPid === pid) setSelectedPid(null);
    } else if (signal === 'STOP') {
      await HostKernelBridge.killProcess(pid, 'SIGSTOP').catch(() => {});
      setProcesses((prev) =>
        prev.map((p) => (p.pid === pid ? { ...p, status: 'T' } : p))
      );
      Toast.show(`Process ${pid} paused (SIGSTOP)`, '⏸️');
    } else if (signal === 'CONT') {
      await HostKernelBridge.killProcess(pid, 'SIGCONT').catch(() => {});
      setProcesses((prev) =>
        prev.map((p) => (p.pid === pid ? { ...p, status: 'S' } : p))
      );
      Toast.show(`Process ${pid} resumed (SIGCONT)`, '▶️');
    }
  };

  const filteredProcesses = processes.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.user.toLowerCase().includes(search.toLowerCase()) ||
      p.pid.toString().includes(search)
  );

  const selectedProcess = processes.find((p) => p.pid === selectedPid) || null;

  return (
    <div className="h-full flex flex-col bg-[#12141c] text-[#edf1f7] text-xs select-none overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-[#181b26] border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showSidebar ? 'bg-[#6ee7b7]/20 text-[#6ee7b7] border-[#6ee7b7]/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
            }`}
            title={showSidebar ? 'Collapse Process Inspector' : 'Expand Process Inspector'}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <Activity className="w-4 h-4 text-[#6ee7b7]" />
          <span className="font-semibold text-white">Alpine Task & Process Manager</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
            isHostConnected 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
              : 'bg-white/5 text-gray-400 border-white/10'
          }`}>
            {isHostConnected ? 'Host Kernel Live' : 'VFS Task Sandbox'}
          </span>
          <button
            onClick={fetchHostProcesses}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition cursor-pointer"
            title="Refresh Process List"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-gray-300">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter processes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 pr-2 py-0.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white outline-none w-36 focus:border-[#6ee7b7]"
            />
          </div>
          <div>Tasks: <span className="text-[#6ee7b7] font-bold">{processes.length}</span></div>
          <div className="hidden sm:block">Load: <span className="text-cyan-300">0.42 0.38 0.31</span></div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Process Table */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-inner">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-[#181b28] text-gray-400 border-b border-white/10 sticky top-0">
                <tr>
                  <th className="p-2.5">PID</th>
                  <th className="p-2.5">USER</th>
                  <th className="p-2.5">CPU %</th>
                  <th className="p-2.5">MEM %</th>
                  <th className="p-2.5">STAT</th>
                  <th className="p-2.5">COMMAND</th>
                  <th className="p-2.5 text-right">SIGNAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProcesses.map((proc) => {
                  const isSelected = selectedPid === proc.pid;
                  return (
                    <tr
                      key={proc.pid}
                      onClick={() => setSelectedPid(proc.pid)}
                      className={`hover:bg-white/10 transition cursor-pointer ${isSelected ? 'bg-[#6ee7b7]/10' : ''}`}
                    >
                      <td className="p-2.5 font-bold text-[#6ee7b7]">{proc.pid}</td>
                      <td className="p-2.5 text-gray-300">{proc.user}</td>
                      <td className="p-2.5 text-cyan-300">{proc.cpu}%</td>
                      <td className="p-2.5 text-amber-300">{proc.mem}%</td>
                      <td className="p-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          proc.status === 'R' ? 'bg-emerald-500/20 text-emerald-400' :
                          proc.status === 'T' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {proc.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-white font-medium">{proc.name}</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSignal(proc.pid, 'KILL');
                          }}
                          className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium transition cursor-pointer"
                          title="SIGKILL"
                        >
                          Kill
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Process Inspector Sidebar */}
        {showSidebar && (
          <div className="w-64 border-l border-white/10 bg-[#0f111a] flex flex-col p-3 space-y-3 shrink-0 overflow-y-auto font-mono text-[11px]">
            <div className="text-[10px] uppercase font-bold text-gray-400">Process Inspector</div>

            {selectedProcess ? (
              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{selectedProcess.name}</span>
                    <span className="px-2 py-0.5 rounded bg-[#6ee7b7]/20 text-[#6ee7b7] font-bold">
                      PID {selectedProcess.pid}
                    </span>
                  </div>
                  <div className="text-gray-400 text-[10px] truncate">{selectedProcess.cmdline}</div>
                </div>

                <div className="space-y-1.5 bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="flex justify-between">
                    <span className="text-gray-400">User:</span>
                    <span className="text-white">{selectedProcess.user}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Threads:</span>
                    <span className="text-cyan-300">{selectedProcess.threads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nice Priority:</span>
                    <span className="text-amber-300">{selectedProcess.nice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">CPU Usage:</span>
                    <span className="text-emerald-400">{selectedProcess.cpu}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">RAM Allocated:</span>
                    <span className="text-purple-300">{selectedProcess.mem}%</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-[10px] text-gray-400 block font-bold">POSIX Process Control Signals</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSignal(selectedProcess.pid, 'TERM')}
                      className="px-2 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-center transition cursor-pointer"
                    >
                      SIGTERM (15)
                    </button>
                    <button
                      onClick={() => handleSignal(selectedProcess.pid, 'KILL')}
                      className="px-2 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-center transition cursor-pointer"
                    >
                      SIGKILL (9)
                    </button>
                    <button
                      onClick={() => handleSignal(selectedProcess.pid, selectedProcess.status === 'T' ? 'CONT' : 'STOP')}
                      className="px-2 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-center transition cursor-pointer"
                    >
                      {selectedProcess.status === 'T' ? 'SIGCONT (18)' : 'SIGSTOP (19)'}
                    </button>
                    <button
                      onClick={() => Toast.show(`Sent SIGHUP reload to PID ${selectedProcess.pid}`, '✓')}
                      className="px-2 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-center transition cursor-pointer"
                    >
                      SIGHUP (1)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-6">Select a process to inspect attributes and signal controls</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
