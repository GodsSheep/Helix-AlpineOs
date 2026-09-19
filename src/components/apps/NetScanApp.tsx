import React, { useState } from 'react';
import { Wifi, Globe, Server, RefreshCw, Shield, CheckCircle2, AlertCircle, PanelLeftClose, PanelLeft, Play, Briefcase, Database, Cpu, Activity } from 'lucide-react';

interface TargetItem {
  host: string;
  ip: string;
  status: 'online' | 'warning' | 'offline';
  latency: string;
  ports: number[];
  type: 'server' | 'endpoint' | 'node' | 'gateway';
}

export const NetScanApp: React.FC = () => {
  const [targets, setTargets] = useState<TargetItem[]>([
    { host: 'alpine.linux.local', ip: '127.0.0.1', status: 'online', latency: '0.4ms', ports: [22, 80, 443, 3000], type: 'node' },
    { host: 'kernel.gateway', ip: '192.168.1.1', status: 'online', latency: '1.2ms', ports: [53, 80, 443], type: 'gateway' },
    { host: 'dns.upstream.net', ip: '8.8.8.8', status: 'online', latency: '14.8ms', ports: [53], type: 'endpoint' },
    { host: 'cloud.storage.node', ip: '10.0.4.15', status: 'warning', latency: '42.1ms', ports: [8080, 9000], type: 'server' },
    { host: 'api.helix.os', ip: '192.168.1.200', status: 'online', latency: '2.5ms', ports: [80, 443, 8000, 9090], type: 'endpoint' },
    { host: 'auth.service.v6', ip: '192.168.1.210', status: 'online', latency: '1.9ms', ports: [443, 6379], type: 'endpoint' },
    { host: 'db.cluster.primary', ip: '192.168.2.10', status: 'online', latency: '3.1ms', ports: [5432, 3306], type: 'server' },
    { host: 'legacy.archive.org', ip: '172.16.254.1', status: 'offline', latency: 'Timeout', ports: [], type: 'server' },
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<TargetItem | null>(targets[0]);
  const [customHost, setCustomHost] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [logOutput, setLogOutput] = useState<string[]>([
    'Initializing net-tools v2.4 (iproute2 / tcpdump enabled)',
    'Loaded interface eth0 (192.168.1.145/24)',
    'Ready for subnet probing...'
  ]);

  const handleScan = () => {
    setIsScanning(true);
    setLogOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] Starting full subnet TCP SYN scan...`]);
    setTimeout(() => {
      setTargets(prev => prev.map(t => ({
        ...t,
        latency: (Math.random() * 20 + 0.5).toFixed(1) + 'ms',
        status: Math.random() > 0.1 ? 'online' : 'warning'
      })));
      setIsScanning(false);
      setLogOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] Scan complete. 4 hosts responsive.`]);
    }, 1200);
  };

  const handlePing = (host: string) => {
    setLogOutput(prev => [...prev, `PING ${host} (64 bytes): icmp_seq=1 ttl=118 time=1.42ms`]);
  };

  return (
    <div className="h-full flex flex-col bg-[#12141c] text-[#edf1f7] text-xs select-none overflow-hidden">
      {/* Toolbar */}
      <div className="px-3 py-2 bg-[#181b26] border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showSidebar ? 'bg-[#6ee7b7]/20 text-[#6ee7b7] border-[#6ee7b7]/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
            }`}
            title={showSidebar ? 'Collapse Hosts List' : 'Expand Hosts List'}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <Globe className="w-4 h-4 text-[#6ee7b7]" />
          <span className="font-semibold tracking-wide text-white">Alpine Network Diagnostics & Port Scanner</span>
        </div>
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="px-3 py-1.5 rounded-lg bg-[#6ee7b7] hover:bg-[#5eead4] text-black font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning Subnet...' : 'Run Subnet Scan'}</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Target List */}
        {showSidebar && (
          <div className="w-full md:w-72 border-r border-white/10 flex flex-col p-3 overflow-y-auto space-y-2 shrink-0 bg-[#0f111a]">
            <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">Discovered Hosts ({targets.length})</div>
            {targets.map((t, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedTarget(t)}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  selectedTarget?.host === t.host
                    ? 'bg-[#6ee7b7]/15 border-[#6ee7b7]/50 shadow-lg text-white'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    t.status === 'online' ? 'bg-[#6ee7b7] shadow-[0_0_6px_#6ee7b7]' :
                    t.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <div className="font-mono font-medium text-white">{t.host}</div>
                    <div className="text-[11px] font-mono text-gray-400">{t.ip}</div>
                  </div>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <div className="text-cyan-300">{t.latency}</div>
                  <div className="text-gray-400">{t.ports.length} ports</div>
                </div>
              </div>
            ))}

            <div className="mt-auto pt-3 border-t border-white/10">
              <div className="text-[11px] font-mono text-gray-400 mb-1">Custom Host Ping / Probe</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 1.1.1.1 or api.local"
                  value={customHost}
                  onChange={(e) => setCustomHost(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/15 rounded-lg px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-[#6ee7b7]"
                />
                <button
                  onClick={() => { if (customHost) handlePing(customHost); }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium transition cursor-pointer"
                >
                  Ping
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details & Console */}
        <div className="flex-1 flex flex-col p-4 bg-black/20 overflow-hidden">
          {/* Quick Target switcher when sidebar is collapsed */}
          {!showSidebar && (
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 shrink-0">
              {targets.map((t) => (
                <button
                  key={t.host}
                  onClick={() => setSelectedTarget(t)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition ${
                    selectedTarget?.host === t.host
                      ? 'bg-[#6ee7b7]/20 text-[#6ee7b7] border border-[#6ee7b7]/40'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${t.status === 'online' ? 'bg-[#6ee7b7]' : 'bg-amber-400'}`} />
                  <span>{t.host}</span>
                </button>
              ))}
            </div>
          )}

          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-2">Host Inspection & Port Map</div>
          {selectedTarget ? (
            <div className="space-y-3 mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-white text-sm">{selectedTarget.host}</span>
                <span className="font-mono px-2 py-0.5 rounded bg-white/10 text-[#6ee7b7]">{selectedTarget.ip}</span>
              </div>
              <div className="flex items-center gap-4 text-gray-300 font-mono text-[11px]">
                <div>Status: <span className="text-[#6ee7b7] uppercase font-bold">{selectedTarget.status}</span></div>
                <div>Latency: <span className="text-cyan-300">{selectedTarget.latency}</span></div>
              </div>
              <div>
                <div className="text-[11px] font-mono text-gray-400 mb-1">Active TCP Listen Ports:</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTarget.ports.length > 0 ? selectedTarget.ports.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[11px] border border-cyan-500/30">
                      port {p} (open)
                    </span>
                  )) : (
                    <span className="text-red-400 font-mono">No open ports detected</span>
                  )}
                </div>
              </div>
              
              <div className="pt-2 border-t border-white/10 flex justify-end">
                <button 
                  onClick={() => {
                    const data = JSON.stringify(selectedTarget, null, 2);
                    (window as any).Kernel?.backpack.addItem('snippet', `Host: ${selectedTarget.host}`, data);
                    setLogOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] Saved host info to backpack.`]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Save to Backpack</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-gray-500 font-mono text-center">Select a host to view inspection details</div>
          )}

          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">Packet Terminal Output</div>
          <div className="flex-1 bg-black/60 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-[#6ee7b7] overflow-y-auto space-y-1">
            {logOutput.map((l, i) => (
              <div key={i} className="leading-relaxed">&gt; {l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
