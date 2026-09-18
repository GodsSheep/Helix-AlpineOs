import React, { useState, useEffect } from 'react';
import { Toast } from '../../kernel/Toast';
import { Server, Play, Square, RotateCw, CheckCircle2, XCircle, Clock, Cpu, FileText, Search, PanelRightClose, PanelRight } from 'lucide-react';

interface ServiceItem {
  name: string;
  description: string;
  runlevel: 'sysinit' | 'boot' | 'default' | 'shutdown';
  status: 'started' | 'stopped' | 'crashed';
  pid: number | null;
  uptime: string;
  memMB: number;
  bootEnabled: boolean;
}

const INITIAL_SERVICES: ServiceItem[] = [
  { name: 'sshd', description: 'OpenSSH Remote Login Protocol Daemon', runlevel: 'default', status: 'started', pid: 142, uptime: '3h 12m', memMB: 6.4, bootEnabled: true },
  { name: 'networking', description: 'Linux Networking stack & lo interface setup', runlevel: 'boot', status: 'started', pid: 58, uptime: '3h 14m', memMB: 2.1, bootEnabled: true },
  { name: 'syslogd', description: 'BusyBox Kernel & System Logger Daemon', runlevel: 'boot', status: 'started', pid: 72, uptime: '3h 14m', memMB: 3.2, bootEnabled: true },
  { name: 'crond', description: 'Vixie / Busybox Cron Task Scheduling Daemon', runlevel: 'default', status: 'started', pid: 168, uptime: '3h 12m', memMB: 4.0, bootEnabled: true },
  { name: 'acpid', description: 'Advanced Configuration and Power Interface daemon', runlevel: 'default', status: 'started', pid: 194, uptime: '3h 12m', memMB: 2.8, bootEnabled: true },
  { name: 'chronyd', description: 'NTP Network Time Synchronization Daemon', runlevel: 'default', status: 'started', pid: 210, uptime: '3h 10m', memMB: 5.1, bootEnabled: true },
  { name: 'dbus', description: 'System Message Bus Interprocess Communication', runlevel: 'default', status: 'started', pid: 245, uptime: '3h 09m', memMB: 7.8, bootEnabled: true },
  { name: 'nginx', description: 'High Performance HTTP Web & Reverse Proxy Server', runlevel: 'default', status: 'stopped', pid: null, uptime: '0m', memMB: 0, bootEnabled: false },
  { name: 'dnsmasq', description: 'Lightweight DHCP and Caching DNS Server', runlevel: 'default', status: 'stopped', pid: null, uptime: '0m', memMB: 0, bootEnabled: false },
  { name: 'dockerd', description: 'Docker Application Container Engine Daemon', runlevel: 'default', status: 'stopped', pid: null, uptime: '0m', memMB: 0, bootEnabled: false },
  { name: 'mariadb', description: 'MariaDB SQL Relational Database Server', runlevel: 'default', status: 'stopped', pid: null, uptime: '0m', memMB: 0, bootEnabled: false },
  { name: 'iptables', description: 'Netfilter Packet Filtering Rules Loader', runlevel: 'boot', status: 'started', pid: 95, uptime: '3h 14m', memMB: 1.5, bootEnabled: true },
];

export const ServicesApp: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(INITIAL_SERVICES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [runlevelFilter, setRunlevelFilter] = useState<'ALL' | 'default' | 'boot' | 'sysinit'>('ALL');
  const [showInspector, setShowInspector] = useState(true);

  const handleStart = (name: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.name === name
          ? {
              ...s,
              status: 'started',
              pid: Math.floor(Math.random() * 800) + 300,
              uptime: 'Just started',
              memMB: +(Math.random() * 8 + 3).toFixed(1),
            }
          : s
      )
    );
    Toast.show(`rc-service ${name} start [OK]`, '✓');
  };

  const handleStop = (name: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.name === name ? { ...s, status: 'stopped', pid: null, uptime: 'Stopped', memMB: 0 } : s
      )
    );
    Toast.show(`rc-service ${name} stop [OK]`, '🛑');
  };

  const handleRestart = (name: string) => {
    handleStop(name);
    setTimeout(() => {
      handleStart(name);
      Toast.show(`rc-service ${name} restart [OK]`, '🔄');
    }, 400);
  };

  const handleToggleBoot = (name: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.name === name) {
          const next = !s.bootEnabled;
          Toast.show(`rc-update ${next ? 'add' : 'del'} ${name} default [OK]`, '⚙️');
          return { ...s, bootEnabled: next };
        }
        return s;
      })
    );
  };

  const filtered = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRunlevel = runlevelFilter === 'ALL' || s.runlevel === runlevelFilter;
    return matchesSearch && matchesRunlevel;
  });

  const activeCount = services.filter((s) => s.status === 'started').length;
  const currentSelected = services.find((s) => s.name === selectedService?.name) || selectedService;

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141724] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm">OpenRC Service Manager</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400 hidden sm:inline">
            rc-service & rc-update
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {activeCount} Active Daemons
          </span>
          <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400">
            {services.length - activeCount} Inactive
          </span>
          <div className="h-4 w-px bg-white/10" />
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showInspector ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
            }`}
            title={showInspector ? 'Hide Service Inspector' : 'Show Service Inspector'}
          >
            {showInspector ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-2.5 bg-[#10121d] border-b border-white/10 flex items-center justify-between shrink-0 gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search daemon or service name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 bg-black/40 border border-white/15 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-gray-500">Runlevel:</span>
          {(['ALL', 'default', 'boot', 'sysinit'] as const).map((rl) => (
            <button
              key={rl}
              onClick={() => setRunlevelFilter(rl)}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                runlevelFilter === rl ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              {rl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Services List Table */}
        <div className="flex-1 overflow-y-auto border-r border-white/10">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-white/5 text-gray-400 text-[10px] uppercase border-b border-white/10 sticky top-0 bg-[#141724]">
              <tr>
                <th className="p-2">Service</th>
                <th className="p-2">Status</th>
                <th className="p-2">PID</th>
                <th className="p-2">Runlevel</th>
                <th className="p-2">Boot Autostart</th>
                <th className="p-2">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((svc) => (
                <tr
                  key={svc.name}
                  onClick={() => {
                    setSelectedService(svc);
                    if (!showInspector) setShowInspector(true);
                  }}
                  className={`hover:bg-white/5 transition cursor-pointer ${
                    currentSelected?.name === svc.name ? 'bg-emerald-500/10 text-white' : 'text-gray-300'
                  }`}
                >
                  <td className="p-2 font-bold text-white flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${svc.status === 'started' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                    {svc.name}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        svc.status === 'started' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {svc.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2 text-gray-400">{svc.pid || '-'}</td>
                  <td className="p-2 text-cyan-400">{svc.runlevel}</td>
                  <td className="p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBoot(svc.name);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition ${
                        svc.bootEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {svc.bootEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </td>
                  <td className="p-2 text-gray-400 truncate max-w-xs">{svc.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Service Detail Drawer */}
        {showInspector && currentSelected && (
          <div className="w-80 bg-[#10121d] flex flex-col p-4 space-y-4 overflow-y-auto shrink-0 border-l border-white/10">
            <div className="pb-2 border-b border-white/10 flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  {currentSelected.name}
                </h2>
                <p className="text-gray-400 text-[11px] mt-0.5">{currentSelected.description}</p>
              </div>
              <button
                onClick={() => setShowInspector(false)}
                className="p-1 text-gray-500 hover:text-white rounded transition cursor-pointer"
                title="Collapse Inspector"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lifecycle Control Buttons */}
            <div className="grid grid-cols-3 gap-1.5 font-sans">
              <button
                onClick={() => handleStart(currentSelected.name)}
                disabled={currentSelected.status === 'started'}
                className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl flex flex-col items-center gap-1 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-emerald-500/20"
              >
                <Play className="w-3.5 h-3.5" />
                <span className="font-medium text-[11px]">Start</span>
              </button>
              <button
                onClick={() => handleStop(currentSelected.name)}
                disabled={currentSelected.status === 'stopped'}
                className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl flex flex-col items-center gap-1 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-rose-500/20"
              >
                <Square className="w-3.5 h-3.5" />
                <span className="font-medium text-[11px]">Stop</span>
              </button>
              <button
                onClick={() => handleRestart(currentSelected.name)}
                className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl flex flex-col items-center gap-1 transition cursor-pointer border border-amber-500/20"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="font-medium text-[11px]">Restart</span>
              </button>
            </div>

            {/* Service Inspector Specs */}
            <div className="bg-black/30 p-3 rounded-xl border border-white/10 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={currentSelected.status === 'started' ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
                  {currentSelected.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Process PID:</span>
                <span className="text-white">{currentSelected.pid || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Memory RSS:</span>
                <span className="text-cyan-400">{currentSelected.memMB} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Service Uptime:</span>
                <span className="text-white">{currentSelected.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Init Script:</span>
                <span className="text-gray-300 text-[10px]">/etc/init.d/{currentSelected.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Runlevel:</span>
                <span className="text-emerald-300">{currentSelected.runlevel}</span>
              </div>
            </div>

            {/* Live Daemon Log Snippet */}
            <div className="space-y-1">
              <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1">
                <FileText className="w-3 h-3 text-gray-500" />
                Daemon Log Output (/var/log/{currentSelected.name}.log):
              </span>
              <div className="bg-black/60 p-2.5 rounded-xl border border-white/10 font-mono text-[10px] text-gray-400 max-h-36 overflow-y-auto space-y-1">
                <p>[init] rc-service: starting {currentSelected.name}...</p>
                <p className="text-emerald-400/80">[ok] {currentSelected.name} child spawned with PID {currentSelected.pid || 142}</p>
                <p>[syslog] listener bound on unix /var/run/{currentSelected.name}.sock</p>
                <p className="text-gray-500">[status] ready to accept inbound requests</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
