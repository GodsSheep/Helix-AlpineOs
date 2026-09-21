import React, { useState, useEffect } from 'react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Terminal, 
  FileText, 
  Key, 
  Lock, 
  Unlock, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Copy, 
  Download, 
  Filter, 
  Layers, 
  Activity, 
  Cpu, 
  Server, 
  Globe, 
  Eye, 
  Sliders, 
  Code,
  Check,
  Zap,
  Info
} from 'lucide-react';

type SecurityTab = 
  | 'lynis' 
  | 'apparmor' 
  | 'firewall' 
  | 'auditd' 
  | 'fail2ban' 
  | 'openssl' 
  | 'integrity' 
  | 'docs';

interface AuditItem {
  id: string;
  category: string;
  test: string;
  status: 'passed' | 'warning' | 'critical';
  details: string;
  remediation: string;
}

export const LinuxSecurityApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SecurityTab>('lynis');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [hardeningScore, setHardeningScore] = useState(84);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // AppArmor State
  const [profiles, setProfiles] = useState([
    { name: 'usr.bin.nginx', mode: 'enforce', active: true, events: 0 },
    { name: 'usr.sbin.sshd', mode: 'enforce', active: true, events: 12 },
    { name: 'com.helix.browser', mode: 'enforce', active: true, events: 4 },
    { name: 'usr.bin.python3', mode: 'complain', active: true, events: 38 },
    { name: 'usr.bin.docker', mode: 'enforce', active: true, events: 2 },
  ]);

  // Firewall State
  const [firewallRules, setFirewallRules] = useState([
    { id: 'r1', port: '22/tcp', proto: 'TCP', action: 'LIMIT', comment: 'Rate limit SSH attempts (3/min)' },
    { id: 'r2', port: '80,443/tcp', proto: 'TCP', action: 'ALLOW', comment: 'Standard HTTP & HTTPS ingress' },
    { id: 'r3', port: 'ICMP', proto: 'ICMP', action: 'DROP', comment: 'Prevent ICMP echo flood (ping)' },
    { id: 'r4', port: 'All', proto: 'ANY', action: 'DROP', comment: 'Default ingress drop policy' },
  ]);
  const [newPort, setNewPort] = useState('');
  const [newAction, setNewAction] = useState('ALLOW');

  // Fail2ban State
  const [bannedIps, setBannedIps] = useState([
    { ip: '198.51.100.42', jail: 'sshd', failures: 6, banTime: '24h', timestamp: '10 mins ago' },
    { ip: '203.0.113.88', jail: 'nginx-http-auth', failures: 14, banTime: '12h', timestamp: '35 mins ago' },
    { ip: '192.0.2.190', jail: 'recidive', failures: 22, banTime: '7d', timestamp: '1 hour ago' },
  ]);

  // OpenSSL Workbench State
  const [cryptoMode, setCryptoMode] = useState<'cert' | 'hash' | 'keygen'>('hash');
  const [hashInput, setHashInput] = useState('HelixOS Linux Security Integrity Hash 2026');
  const [hashSha256, setHashSha256] = useState('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const [hashSha512, setHashSha512] = useState('');
  const [keyType, setKeyType] = useState('RSA 4096');
  const [generatedKey, setGeneratedKey] = useState('-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0v9kZ...\n-----END RSA PRIVATE KEY-----');

  // Audit items
  const auditResults: AuditItem[] = [
    {
      id: 'KRNL-5677',
      category: 'Kernel Hardening',
      test: 'sysctl: fs.protected_hardlinks & fs.protected_symlinks',
      status: 'passed',
      details: 'Hardlink and symlink TOCTOU protections are enabled in kernel sysctl.',
      remediation: 'sysctl -w fs.protected_hardlinks=1 fs.protected_symlinks=1'
    },
    {
      id: 'KRNL-5820',
      category: 'Kernel Hardening',
      test: 'sysctl: kernel.kptr_restrict & kernel.dmesg_restrict',
      status: 'passed',
      details: 'Kernel pointer exposure to unprivileged users is restricted.',
      remediation: 'sysctl -w kernel.kptr_restrict=2 kernel.dmesg_restrict=1'
    },
    {
      id: 'NETW-3012',
      category: 'Network Stack',
      test: 'sysctl: net.ipv4.conf.all.rp_filter (Reverse Path Filtering)',
      status: 'passed',
      details: 'Strict anti-spoofing reverse path filtering is active on all interfaces.',
      remediation: 'sysctl -w net.ipv4.conf.all.rp_filter=1'
    },
    {
      id: 'FILE-7524',
      category: 'File Permissions',
      test: 'SUID & SGID Binary Audit (/sbin, /usr/bin)',
      status: 'warning',
      details: 'Found 14 SUID binaries. Recommended removing SUID bit from non-essential utilities.',
      remediation: 'chmod u-s /usr/bin/traceroute6.iputils'
    },
    {
      id: 'AUTH-9204',
      category: 'Authentication',
      test: 'SSH Hardening: PermitRootLogin & PasswordAuthentication',
      status: 'passed',
      details: 'Root SSH direct login is disabled. Ed25519 PKI authentication strictly enforced.',
      remediation: 'Set PermitRootLogin no in /etc/ssh/sshd_config'
    },
    {
      id: 'MAC-1102',
      category: 'Access Control',
      test: 'Linux Security Module (LSM): AppArmor / SELinux',
      status: 'passed',
      details: 'AppArmor is active with 5 profiles in enforce mode and 1 in complain mode.',
      remediation: 'aa-enforce /etc/apparmor.d/*'
    }
  ];

  // Dynamic hash calculation
  useEffect(() => {
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      hash = (hash << 5) - hash + hashInput.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    setHashSha256(`${hex}a8b7f6e5d4c3b2a1${hex}99887766554433221100fedcba9876543210`);
    setHashSha512(`${hex}9f8e7d6c5b4a3928172635445362718293847561a0b1c2d3e4f5a6b7c8d9e0f123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01`);
  }, [hashInput]);

  const runLynisScan = async () => {
    setIsScanning(true);
    setScanProgress(10);
    SoundManager.play('click');
    Toast.show('Initiating Lynis 3.1 System Security Audit...', '🛡️');

    for (let p = 20; p <= 100; p += 20) {
      await new Promise((r) => setTimeout(r, 220));
      setScanProgress(p);
    }
    setIsScanning(false);
    setHardeningScore(88);
    SoundManager.play('success');
    Toast.show('Lynis Audit Completed: Hardening Index 88/100', '✅');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    Toast.show('Command copied to clipboard', '📋');
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const toggleProfileMode = (index: number) => {
    setProfiles(prev => {
      const copy = [...prev];
      copy[index].mode = copy[index].mode === 'enforce' ? 'complain' : 'enforce';
      return copy;
    });
    SoundManager.play('toggle');
    Toast.show(`Updated ${profiles[index].name} mode to ${profiles[index].mode === 'enforce' ? 'complain' : 'enforce'}`, '🛡️');
  };

  const addFirewallRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPort.trim()) return;
    const rule = {
      id: `r-${Date.now()}`,
      port: newPort.trim(),
      proto: 'TCP',
      action: newAction,
      comment: `User defined custom rule for ${newPort.trim()}`
    };
    setFirewallRules(prev => [...prev, rule]);
    setNewPort('');
    SoundManager.play('click');
    Toast.show(`Added Firewall Rule: ${rule.action} ${rule.port}`, '🔥');
  };

  const deleteRule = (id: string) => {
    setFirewallRules(prev => prev.filter(r => r.id !== id));
    SoundManager.play('trash');
    Toast.show('Removed firewall rule', '🗑️');
  };

  const unbanIp = (ip: string) => {
    setBannedIps(prev => prev.filter(b => b.ip !== ip));
    SoundManager.play('click');
    Toast.show(`Unbanned IP address: ${ip}`, '🔓');
  };

  return (
    <div className="h-full flex flex-col bg-[#080b11] text-gray-200 font-sans select-none overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-[#0d111a] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              Linux Security & Hardening Suite
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                CIS Benchmarks v3.1
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Open-source Linux defensive security, access control, firewall hardening & compliance auditor.
            </p>
          </div>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={runLynisScan}
            disabled={isScanning}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-600/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? `Auditing (${scanProgress}%)...` : 'Run Lynis Audit'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 px-4 pt-2 bg-[#0b0f17] border-b border-white/10 overflow-x-auto shrink-0">
        {[
          { id: 'lynis', label: 'Lynis Auditing', icon: <Activity className="w-3.5 h-3.5" /> },
          { id: 'apparmor', label: 'AppArmor / MAC', icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'firewall', label: 'UFW & nftables', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
          { id: 'auditd', label: 'Auditd Syscalls', icon: <Eye className="w-3.5 h-3.5" /> },
          { id: 'fail2ban', label: 'Fail2ban IPS', icon: <Lock className="w-3.5 h-3.5" /> },
          { id: 'openssl', label: 'OpenSSL Crypto', icon: <Key className="w-3.5 h-3.5" /> },
          { id: 'integrity', label: 'Tripwire & ClamAV', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
          { id: 'docs', label: 'Security Docs', icon: <FileText className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as SecurityTab);
              SoundManager.play('click');
            }}
            className={`px-3 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#121824] text-white border-t-2 border-emerald-500 border-x border-white/10 shadow'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#080b11]">
        {/* 1. Lynis Auditing Tab */}
        {activeTab === 'lynis' && (
          <div className="space-y-4 animate-fade-in">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 font-mono block">Hardening Index</span>
                  <span className="text-2xl font-bold text-emerald-400 font-mono">{hardeningScore} / 100</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 font-mono block">Tests Performed</span>
                  <span className="text-2xl font-bold text-cyan-400 font-mono">248 Tests</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Zap className="w-6 h-6" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 font-mono block">Compliance Level</span>
                  <span className="text-2xl font-bold text-purple-400 font-mono">CIS Tier 1</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Audit Results Table */}
            <div className="rounded-2xl bg-[#101522] border border-white/10 overflow-hidden">
              <div className="p-3 bg-[#151c2d] border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Lynis System Scan Findings & Recommendations
                </span>
                <span className="text-[11px] text-gray-400 font-mono">Updated in real-time</span>
              </div>

              <div className="divide-y divide-white/5">
                {auditResults.map((item) => (
                  <div key={item.id} className="p-3.5 hover:bg-white/[0.02] transition space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          item.status === 'passed' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                        <span className="font-bold text-xs text-white">{item.test}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">{item.id}</span>
                    </div>

                    <p className="text-xs text-gray-400">{item.details}</p>

                    <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5 font-mono text-[11px]">
                      <span className="text-emerald-400 truncate pr-2">$ {item.remediation}</span>
                      <button
                        onClick={() => copyToClipboard(item.remediation, item.id)}
                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition cursor-pointer shrink-0"
                        title="Copy command"
                      >
                        {copiedIndex === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. AppArmor / MAC Profiles Tab */}
        {activeTab === 'apparmor' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-cyan-950/20 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">AppArmor Mandatory Access Control (MAC)</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Restrict program capabilities with name-based profiles in enforce or complain mode.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                LSM: Active
              </span>
            </div>

            <div className="rounded-2xl bg-[#101522] border border-white/10 overflow-hidden">
              <div className="p-3 bg-[#151c2d] border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">Loaded Security Profiles (/etc/apparmor.d/)</span>
                <span className="text-[11px] text-gray-400 font-mono">{profiles.length} Profiles</span>
              </div>

              <div className="divide-y divide-white/5">
                {profiles.map((p, idx) => (
                  <div key={p.name} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-mono text-xs font-bold text-white block">{p.name}</span>
                      <span className="text-[11px] text-gray-400 font-mono">Security violations logged: {p.events}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                        p.mode === 'enforce'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {p.mode.toUpperCase()}
                      </span>
                      <button
                        onClick={() => toggleProfileMode(idx)}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-mono transition cursor-pointer border border-white/10"
                      >
                        Toggle Mode
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. UFW & Firewall Tab */}
        {activeTab === 'firewall' && (
          <div className="space-y-4 animate-fade-in">
            {/* Add Rule Form */}
            <form onSubmit={addFirewallRule} className="p-4 rounded-2xl bg-[#101522] border border-white/10 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <label className="text-[11px] text-gray-400 block mb-1 font-mono">Port / Protocol</label>
                <input
                  type="text"
                  value={newPort}
                  onChange={(e) => setNewPort(e.target.value)}
                  placeholder="e.g. 8080/tcp, 53/udp"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="w-full sm:w-36">
                <label className="text-[11px] text-gray-400 block mb-1 font-mono">Action</label>
                <select
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="ALLOW">ALLOW</option>
                  <option value="DROP">DROP</option>
                  <option value="REJECT">REJECT</option>
                  <option value="LIMIT">LIMIT</option>
                </select>
              </div>

              <div className="w-full sm:w-auto self-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow"
                >
                  Add Rule
                </button>
              </div>
            </form>

            {/* Rules List */}
            <div className="rounded-2xl bg-[#101522] border border-white/10 overflow-hidden">
              <div className="p-3 bg-[#151c2d] border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">Active Stateful Packet Filtering Rules</span>
                <span className="text-[11px] text-emerald-400 font-mono">Default Ingress: DROP</span>
              </div>

              <div className="divide-y divide-white/5">
                {firewallRules.map((r) => (
                  <div key={r.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          r.action === 'ALLOW' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          r.action === 'LIMIT' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {r.action}
                        </span>
                        <span className="font-mono text-xs font-bold text-white">{r.port}</span>
                      </div>
                      <p className="text-xs text-gray-400">{r.comment}</p>
                    </div>

                    <button
                      onClick={() => deleteRule(r.id)}
                      className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-xs font-mono transition cursor-pointer border border-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. Auditd Kernel Syscalls Tab */}
        {activeTab === 'auditd' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                Auditd Kernel Subsystem Telemetry & Syscall Rules
              </h3>
              <p className="text-xs text-gray-400">
                Monitors raw syscalls, execution triggers, file integrity changes, and privilege escalations.
              </p>

              <div className="p-3 bg-black/60 rounded-xl border border-white/10 font-mono text-xs text-gray-300 space-y-1.5">
                <div className="text-cyan-400 font-bold">[AUDITD EVENT LOG STREAM]</div>
                <div>type=SYSCALL arch=c000003e syscall=59 success=yes exit=0 ppid=1204 pid=1892 comm="bash"</div>
                <div>type=EXECVE argc=3 a0="sudo" a1="systemctl" a2="status"</div>
                <div>type=CONFIG_CHANGE audit_enabled=1 old=1 auid=1000 ses=1 res=1</div>
                <div>type=ANOM_PROMISCUOUS dev=eth0 prom=0 old_prom=0 auid=4294967295</div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Fail2ban IPS Tab */}
        {activeTab === 'fail2ban' && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-2xl bg-[#101522] border border-white/10 overflow-hidden">
              <div className="p-3 bg-[#151c2d] border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">Banned Host Addresses (Intrusion Prevention)</span>
                <span className="text-[11px] text-gray-400 font-mono">{bannedIps.length} Active Bans</span>
              </div>

              <div className="divide-y divide-white/5">
                {bannedIps.map((b) => (
                  <div key={b.ip} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-400">{b.ip}</span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-mono">
                          jail: {b.jail}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono">
                        Failed attempts: {b.failures} • Ban Duration: {b.banTime} ({b.timestamp})
                      </span>
                    </div>

                    <button
                      onClick={() => unbanIp(b.ip)}
                      className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-mono transition cursor-pointer border border-emerald-500/20"
                    >
                      Unban IP
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. OpenSSL Crypto Workbench */}
        {activeTab === 'openssl' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              {['hash', 'keygen'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCryptoMode(mode as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                    cryptoMode === mode ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>

            {cryptoMode === 'hash' ? (
              <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-3 font-mono text-xs">
                <div>
                  <label className="text-gray-400 block mb-1">Input Text / Payload</label>
                  <input
                    type="text"
                    value={hashInput}
                    onChange={(e) => setHashInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <div>
                    <span className="text-emerald-400 font-bold block mb-0.5">SHA-256 Digest:</span>
                    <div className="p-2.5 bg-black/60 rounded-xl border border-white/5 text-gray-300 break-all text-[11px]">
                      {hashSha256}
                    </div>
                  </div>

                  <div>
                    <span className="text-cyan-400 font-bold block mb-0.5">SHA-512 Digest:</span>
                    <div className="p-2.5 bg-black/60 rounded-xl border border-white/5 text-gray-300 break-all text-[11px]">
                      {hashSha512}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">Generated Asymmetric Key Pair ({keyType})</span>
                  <button
                    onClick={() => {
                      setGeneratedKey(`-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}...\n-----END RSA PRIVATE KEY-----`);
                      SoundManager.play('click');
                      Toast.show('Generated new key pair', '🔑');
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Regenerate
                  </button>
                </div>
                <pre className="p-3 bg-black/60 rounded-xl border border-white/5 text-emerald-400 text-[11px] overflow-x-auto">
                  {generatedKey}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 7. Integrity Tab */}
        {activeTab === 'integrity' && (
          <div className="space-y-4 animate-fade-in font-mono text-xs">
            <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Tripwire & ClamAV System Integrity Status
              </h3>
              <p className="text-xs text-gray-400 font-sans">
                Real-time cryptographic database hashes of system binaries in /bin, /usr/bin, /sbin.
              </p>

              <div className="divide-y divide-white/5 bg-black/40 rounded-xl border border-white/5 p-3 space-y-2">
                <div className="flex items-center justify-between text-gray-300">
                  <span>/bin/busybox</span>
                  <span className="text-emerald-400">OK (SHA256 Match)</span>
                </div>
                <div className="flex items-center justify-between text-gray-300 pt-2">
                  <span>/usr/bin/sudo</span>
                  <span className="text-emerald-400">OK (SHA256 Match)</span>
                </div>
                <div className="flex items-center justify-between text-gray-300 pt-2">
                  <span>/etc/shadow</span>
                  <span className="text-emerald-400">OK (Permissions 0640 Verified)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. Docs Tab */}
        {activeTab === 'docs' && (
          <div className="space-y-4 animate-fade-in text-xs text-gray-300">
            <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Defensive Linux Security Reference & Hardening Guide
              </h3>

              <div className="space-y-3 leading-relaxed">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                  <span className="font-bold text-emerald-400 block font-mono">1. Lynis Auditing</span>
                  <p className="text-gray-400">
                    Run comprehensive system security scans with <code>lynis audit system</code>. Checks CIS benchmarks, outdated packages, kernel parameters, and open ports.
                  </p>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                  <span className="font-bold text-cyan-400 block font-mono">2. AppArmor Mandatory Access Control</span>
                  <p className="text-gray-400">
                    Enforce profiles with <code>aa-enforce /etc/apparmor.d/*</code> or inspect status with <code>aa-status</code>. Restricts programs from accessing unauthorized files even if compromised.
                  </p>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                  <span className="font-bold text-purple-400 block font-mono">3. UFW & Stateful Packet Filtering</span>
                  <p className="text-gray-400">
                    Enable strict default deny rules with <code>ufw default deny incoming</code> and allow only required services like <code>ufw allow ssh</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
