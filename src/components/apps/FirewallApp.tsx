import React, { useState, useEffect } from 'react';
import { Toast } from '../../kernel/Toast';
import { Shield, ShieldAlert, ShieldCheck, Plus, Trash2, Zap, RefreshCw, Activity, Lock, AlertTriangle, PanelLeftClose, PanelLeft } from 'lucide-react';

interface FirewallRule {
  id: string;
  chain: 'INPUT' | 'OUTPUT' | 'FORWARD';
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ALL';
  port: string;
  source: string;
  action: 'ACCEPT' | 'DROP' | 'REJECT';
  comment: string;
  packetsMatched: number;
}

export const FirewallApp: React.FC = () => {
  const [firewallEnabled, setFirewallEnabled] = useState(true);
  const [panicKillswitch, setPanicKillswitch] = useState(false);
  const [activeProfile, setActiveProfile] = useState<'workstation' | 'hardened' | 'public_wifi' | 'custom'>('workstation');
  const [showSidebar, setShowSidebar] = useState(true);
  const [rules, setRules] = useState<FirewallRule[]>([
    {
      id: '1',
      chain: 'INPUT',
      protocol: 'TCP',
      port: '22',
      source: '0.0.0.0/0',
      action: 'ACCEPT',
      comment: 'OpenSSH Remote Shell',
      packetsMatched: 1420,
    },
    {
      id: '2',
      chain: 'INPUT',
      protocol: 'TCP',
      port: '80, 443',
      source: '0.0.0.0/0',
      action: 'ACCEPT',
      comment: 'Web HTTP / HTTPS Servers',
      packetsMatched: 8492,
    },
    {
      id: '3',
      chain: 'INPUT',
      protocol: 'ICMP',
      port: 'ALL',
      source: '0.0.0.0/0',
      action: 'ACCEPT',
      comment: 'Ping & Echo Requests',
      packetsMatched: 312,
    },
    {
      id: '4',
      chain: 'INPUT',
      protocol: 'TCP',
      port: '3306, 5432',
      source: '192.168.1.0/24',
      action: 'ACCEPT',
      comment: 'Internal Database Ports (LAN Only)',
      packetsMatched: 64,
    },
    {
      id: '5',
      chain: 'INPUT',
      protocol: 'ALL',
      port: 'ALL',
      source: '0.0.0.0/0',
      action: 'DROP',
      comment: 'Default Inbound Drop Policy',
      packetsMatched: 3950,
    },
  ]);

  const [chainFilter, setChainFilter] = useState<'ALL' | 'INPUT' | 'OUTPUT' | 'FORWARD'>('ALL');
  const [stats, setStats] = useState({
    totalInspected: 14238,
    droppedCount: 3950,
    activeConnections: 18,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        totalInspected: prev.totalInspected + Math.floor(Math.random() * 8) + 1,
        droppedCount: prev.droppedCount + (Math.random() > 0.6 ? 1 : 0),
        activeConnections: Math.max(12, Math.min(32, prev.activeConnections + Math.floor(Math.random() * 3) - 1)),
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleToggleFirewall = () => {
    const next = !firewallEnabled;
    setFirewallEnabled(next);
    Toast.show(`Alpine Netfilter firewall ${next ? 'ACTIVATED' : 'DEACTIVATED'}`, next ? '🛡️' : '⚠️');
  };

  const handlePanicKillswitch = () => {
    const next = !panicKillswitch;
    setPanicKillswitch(next);
    if (next) {
      Toast.show('PANIC KILLSWITCH ENGAGED: Inbound traffic severed!', '🛑');
    } else {
      Toast.show('Panic killswitch disengaged. Normal rule routing restored.', '✓');
    }
  };

  const handleApplyProfile = (profile: 'workstation' | 'hardened' | 'public_wifi') => {
    setActiveProfile(profile);
    if (profile === 'workstation') {
      setRules([
        { id: '1', chain: 'INPUT', protocol: 'TCP', port: '22', source: '0.0.0.0/0', action: 'ACCEPT', comment: 'OpenSSH Shell', packetsMatched: 120 },
        { id: '2', chain: 'INPUT', protocol: 'TCP', port: '80, 443', source: '0.0.0.0/0', action: 'ACCEPT', comment: 'Web Servers', packetsMatched: 450 },
        { id: '3', chain: 'INPUT', protocol: 'ICMP', port: 'ALL', source: '0.0.0.0/0', action: 'ACCEPT', comment: 'ICMP Echo', packetsMatched: 80 },
        { id: '4', chain: 'INPUT', protocol: 'ALL', port: 'ALL', source: '0.0.0.0/0', action: 'DROP', comment: 'Default Drop Policy', packetsMatched: 210 },
      ]);
      Toast.show('Applied Standard Workstation Firewall profile', '🛡️');
    } else if (profile === 'hardened') {
      setRules([
        { id: '1', chain: 'INPUT', protocol: 'TCP', port: '22', source: '192.168.1.0/24', action: 'ACCEPT', comment: 'OpenSSH (LAN Only)', packetsMatched: 45 },
        { id: '2', chain: 'INPUT', protocol: 'ALL', port: 'ALL', source: '0.0.0.0/0', action: 'DROP', comment: 'Stealth Drop All Unsolicited', packetsMatched: 840 },
      ]);
      Toast.show('Applied Server Hardened profile (Zero open WAN ports)', '🔒');
    } else if (profile === 'public_wifi') {
      setRules([
        { id: '1', chain: 'INPUT', protocol: 'ALL', port: 'ALL', source: '0.0.0.0/0', action: 'DROP', comment: 'Public Hotspot Shield: Block All Inbound', packetsMatched: 1950 },
      ]);
      Toast.show('Public Wi-Fi Shield Active: 100% Inbound Blocked', '🛡️');
    }
  };

  const handleAddRule = () => {
    const port = prompt('Enter Port number (e.g. 8080, 21, 5000):', '8080');
    if (!port) return;
    const newRule: FirewallRule = {
      id: Date.now().toString(),
      chain: 'INPUT',
      protocol: 'TCP',
      port,
      source: '0.0.0.0/0',
      action: 'ACCEPT',
      comment: `Custom Port ${port} Rule`,
      packetsMatched: 0,
    };
    setRules([newRule, ...rules]);
    Toast.show(`Added rule for port ${port}`, '✓');
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
    Toast.show('Firewall rule removed', '🗑️');
  };

  const filteredRules = rules.filter((r) => chainFilter === 'ALL' || r.chain === chainFilter);

  const profiles = [
    { id: 'workstation' as const, label: 'Workstation', desc: 'Standard desktop security' },
    { id: 'hardened' as const, label: 'Server Hardened', desc: 'Zero WAN inbound ports' },
    { id: 'public_wifi' as const, label: 'Public Wi-Fi Shield', desc: 'Block 100% incoming packets' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141724] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showSidebar ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
            }`}
            title={showSidebar ? 'Collapse Profiles & Chains' : 'Expand Profiles & Chains'}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <Shield className={`w-4 h-4 ${firewallEnabled ? 'text-emerald-400' : 'text-rose-400'}`} />
          <span className="font-semibold text-sm">Alpine Netfilter & iptables</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400 hidden sm:inline">
            Kernel Packet Filter
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePanicKillswitch}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
              panicKillswitch
                ? 'bg-rose-600 text-white animate-pulse border border-rose-400'
                : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{panicKillswitch ? 'PANIC ACTIVE: CUT' : 'Panic Killswitch'}</span>
          </button>
          <button
            onClick={handleToggleFirewall}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer ${
              firewallEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-gray-700 text-gray-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${firewallEnabled ? 'bg-emerald-400' : 'bg-gray-400'}`} />
            <span>{firewallEnabled ? 'ENABLED' : 'DISABLED'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-4 gap-2 p-2.5 bg-[#10121d] border-b border-white/10 shrink-0 text-center font-mono text-xs">
        <div className="bg-black/30 p-2 rounded-xl border border-white/5">
          <span className="text-[10px] text-gray-400 block">INSPECTED</span>
          <span className="text-sm font-bold text-emerald-400">{stats.totalInspected.toLocaleString()}</span>
        </div>
        <div className="bg-black/30 p-2 rounded-xl border border-white/5">
          <span className="text-[10px] text-gray-400 block">DROPPED</span>
          <span className="text-sm font-bold text-rose-400">{stats.droppedCount.toLocaleString()}</span>
        </div>
        <div className="bg-black/30 p-2 rounded-xl border border-white/5">
          <span className="text-[10px] text-gray-400 block">FLOWS</span>
          <span className="text-sm font-bold text-cyan-400">{stats.activeConnections} conn</span>
        </div>
        <div className="bg-black/30 p-2 rounded-xl border border-white/5">
          <span className="text-[10px] text-gray-400 block">PROFILE</span>
          <span className="text-sm font-bold text-amber-300 uppercase truncate block">{activeProfile}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-56 bg-[#0f111a] border-r border-white/10 flex flex-col p-2.5 space-y-3 shrink-0 overflow-y-auto font-sans">
            <div>
              <div className="text-[10px] uppercase text-gray-500 font-bold px-1.5 py-1 font-mono">Security Profiles</div>
              <div className="space-y-1 mt-1">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleApplyProfile(p.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl transition cursor-pointer ${
                      activeProfile === p.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="text-[11px] font-medium">{p.label}</div>
                    <div className="text-[10px] text-gray-500">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] uppercase text-gray-500 font-bold px-1.5 py-1 font-mono">Filter Chains</div>
              <div className="space-y-1 mt-1">
                {(['ALL', 'INPUT', 'OUTPUT', 'FORWARD'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setChainFilter(c)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-mono text-[11px] transition cursor-pointer ${
                      chainFilter === c
                        ? 'bg-white/15 text-white font-bold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{c}</span>
                    <span className="text-[10px] text-gray-500">
                      {c === 'ALL' ? rules.length : rules.filter((r) => r.chain === c).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
          {/* Quick bar when collapsed */}
          {!showSidebar && (
            <div className="px-3 py-1.5 bg-[#141724] border-b border-white/10 flex items-center justify-between gap-2 overflow-x-auto shrink-0 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 text-[10px] uppercase">Chain:</span>
                {(['ALL', 'INPUT', 'OUTPUT', 'FORWARD'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setChainFilter(c)}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      chainFilter === c
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {profiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleApplyProfile(p.id)}
                    className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                      activeProfile === p.id ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="px-3 py-2 bg-[#12141f] border-b border-white/10 flex items-center justify-between shrink-0">
            <span className="text-gray-400 text-[11px] font-mono">
              Active rules: <strong className="text-white">{filteredRules.length}</strong> (evaluated top-down)
            </span>
            <button
              onClick={handleAddRule}
              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 transition text-[11px] font-medium cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Port Rule</span>
            </button>
          </div>

          {/* Rules Table */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="border border-white/10 rounded-xl overflow-hidden bg-[#10121d]">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-white/5 text-gray-400 text-[10px] border-b border-white/10 uppercase">
                  <tr>
                    <th className="p-2.5">Chain</th>
                    <th className="p-2.5">Proto</th>
                    <th className="p-2.5">Port(s)</th>
                    <th className="p-2.5">Source</th>
                    <th className="p-2.5">Action</th>
                    <th className="p-2.5">Comment</th>
                    <th className="p-2.5 text-right">Packets</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-white/5 transition">
                      <td className="p-2.5 font-bold text-gray-300">{rule.chain}</td>
                      <td className="p-2.5 text-emerald-400">{rule.protocol}</td>
                      <td className="p-2.5 text-cyan-300 font-bold">{rule.port}</td>
                      <td className="p-2.5 text-gray-400">{rule.source}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            rule.action === 'ACCEPT'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : rule.action === 'DROP'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {rule.action}
                        </span>
                      </td>
                      <td className="p-2.5 text-gray-300 max-w-[180px] truncate">{rule.comment}</td>
                      <td className="p-2.5 text-right text-gray-400">{rule.packetsMatched.toLocaleString()}</td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 hover:bg-rose-500/20 text-gray-500 hover:text-rose-300 rounded-lg transition cursor-pointer"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
