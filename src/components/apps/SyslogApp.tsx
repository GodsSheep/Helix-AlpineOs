import React, { useState } from 'react';
import { FileText, Search, RefreshCw, Filter, ShieldAlert, Info, AlertTriangle, PanelLeftClose, PanelLeft, Trash2, Pause, Play, CheckCircle2 } from 'lucide-react';
import { Toast } from '../../kernel/Toast';

interface LogEntry {
  id: number;
  timestamp: string;
  source: string;
  facility: 'kern' | 'auth' | 'daemon' | 'syslog' | 'cron';
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export const SyslogApp: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 1, timestamp: '[0.000000]', source: 'kernel', facility: 'kern', level: 'info', message: 'Linux version 6.6.21-alpine-v86 (gcc 13.2.1) #1 SMP PREEMPT_DYNAMIC' },
    { id: 2, timestamp: '[0.142000]', source: 'init', facility: 'syslog', level: 'success', message: 'Mounted root filesystem (vfs) read-write successfully.' },
    { id: 3, timestamp: '[0.420102]', source: 'udevd', facility: 'daemon', level: 'info', message: 'version 3.2.14 started. Device hotplug daemon active.' },
    { id: 4, timestamp: '[1.024500]', source: 'rc-service', facility: 'syslog', level: 'success', message: 'service network started successfully (eth0: 192.168.1.145)' },
    { id: 5, timestamp: '[1.890120]', source: 'sshd', facility: 'auth', level: 'warn', message: 'Server listening on 0.0.0.0 port 22 (RSA key fingerprint verified)' },
    { id: 6, timestamp: '[2.410990]', source: 'kernel', facility: 'kern', level: 'info', message: 'v86 hardware acceleration initialized (WebAssembly JIT active)' },
    { id: 7, timestamp: '[3.124500]', source: 'helix-wm', facility: 'daemon', level: 'success', message: 'Helix DE Wayland compositor launched on display :0' },
    { id: 8, timestamp: '[4.001920]', source: 'crond', facility: 'cron', level: 'info', message: 'crond (busybox 1.36.1) started, log level 5' },
  ]);
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const addTestLog = () => {
    const levels: ('info' | 'warn' | 'error' | 'success')[] = ['info', 'warn', 'error', 'success'];
    const facilities: ('kern' | 'auth' | 'daemon' | 'syslog' | 'cron')[] = ['kern', 'auth', 'daemon', 'syslog', 'cron'];
    const lvl = levels[Math.floor(Math.random() * levels.length)];
    const fac = facilities[Math.floor(Math.random() * facilities.length)];
    const newLog: LogEntry = {
      id: Date.now(),
      timestamp: `[${(performance.now() / 1000).toFixed(3)}]`,
      source: `${fac}-worker`,
      facility: fac,
      level: lvl,
      message: `System diagnostic check (${fac}): memory buffer page sync finished with status code ${Math.floor(Math.random() * 300)}`
    };
    setLogs(prev => [newLog, ...prev]);
    Toast.show(`Simulated ${lvl.toUpperCase()} event generated in ${fac}.log`, '✓');
  };

  const handleClear = () => {
    setLogs([]);
    Toast.show('Kernel ring buffer logs cleared', '🗑️');
  };

  const facilitiesList = [
    { id: 'all', label: 'All Log Facilities', count: logs.length },
    { id: 'kern', label: 'dmesg (Kernel Ring)', count: logs.filter(l => l.facility === 'kern').length },
    { id: 'syslog', label: 'syslog / systemd', count: logs.filter(l => l.facility === 'syslog').length },
    { id: 'auth', label: 'auth.log (Security)', count: logs.filter(l => l.facility === 'auth').length },
    { id: 'daemon', label: 'daemon.log (Services)', count: logs.filter(l => l.facility === 'daemon').length },
    { id: 'cron', label: 'cron.log (Scheduled)', count: logs.filter(l => l.facility === 'cron').length },
  ];

  const filtered = logs.filter(l => {
    if (selectedFacility !== 'all' && l.facility !== selectedFacility) return false;
    if (filterLevel !== 'all' && l.level !== filterLevel) return false;
    if (searchTerm && !l.message.toLowerCase().includes(searchTerm.toLowerCase()) && !l.source.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-[#12141c] text-[#edf1f7] text-xs select-none overflow-hidden font-sans">
      {/* Toolbar */}
      <div className="px-3 py-2 bg-[#181b26] border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showSidebar ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
            }`}
            title={showSidebar ? 'Collapse Facilities Sidebar' : 'Expand Facilities Sidebar'}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white">System Kernel Log Viewer (`dmesg` / `syslog`)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
              isPaused ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
            title={isPaused ? 'Resume live log stream' : 'Pause live log stream'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Paused' : 'Streaming'}</span>
          </button>
          <button
            onClick={addTestLog}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium transition cursor-pointer"
          >
            Simulate Event
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
            title="Clear Buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Facilities Sidebar */}
        {showSidebar && (
          <div className="w-60 bg-[#0f111a] border-r border-white/10 flex flex-col p-2 space-y-1 shrink-0 overflow-y-auto font-mono text-[11px]">
            <div className="text-[10px] uppercase text-gray-500 font-bold px-2 py-1">Log Channels & Facilities</div>
            {facilitiesList.map((fac) => (
              <button
                key={fac.id}
                onClick={() => setSelectedFacility(fac.id)}
                className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                  selectedFacility === fac.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="truncate">{fac.label}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/40 text-gray-400 font-mono">
                  {fac.count}
                </span>
              </button>
            ))}

            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="text-[10px] uppercase text-gray-500 font-bold px-2 py-1">Severity Levels</div>
              {['all', 'info', 'success', 'warn', 'error'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg capitalize transition cursor-pointer flex items-center gap-2 ${
                    filterLevel === lvl
                      ? 'bg-white/10 text-white font-bold'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    lvl === 'success' ? 'bg-[#6ee7b7]' :
                    lvl === 'warn' ? 'bg-amber-400' :
                    lvl === 'error' ? 'bg-rose-400' :
                    lvl === 'info' ? 'bg-cyan-400' : 'bg-gray-400'
                  }`} />
                  <span>{lvl}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black/40">
          {/* Quick facilities bar when sidebar is collapsed */}
          {!showSidebar && (
            <div className="px-3 py-1.5 bg-[#141724] border-b border-white/10 flex items-center gap-1.5 overflow-x-auto shrink-0 font-mono text-[11px]">
              {facilitiesList.map((fac) => (
                <button
                  key={fac.id}
                  onClick={() => setSelectedFacility(fac.id)}
                  className={`px-2 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    selectedFacility === fac.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {fac.label} ({fac.count})
                </button>
              ))}
            </div>
          )}

          {/* Search Bar */}
          <div className="px-3 py-2 bg-black/20 border-b border-white/10 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search kernel logs, syslog events, daemon messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/50 border border-white/15 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          {/* Log Output Stream */}
          <div className="flex-1 p-3 font-mono text-[11px] overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No log entries match the selected filters</div>
            ) : (
              filtered.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed p-1.5 rounded hover:bg-white/5 transition">
                  <span className="text-gray-500 shrink-0 select-text">{log.timestamp}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 uppercase ${
                    log.level === 'success' ? 'bg-[#6ee7b7]/20 text-[#6ee7b7]' :
                    log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' :
                    log.level === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-300'
                  }`}>
                    {log.source}
                  </span>
                  <span className={`flex-1 select-text ${
                    log.level === 'error' ? 'text-red-300 font-bold' :
                    log.level === 'warn' ? 'text-amber-200' :
                    log.level === 'success' ? 'text-emerald-200' : 'text-gray-200'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
