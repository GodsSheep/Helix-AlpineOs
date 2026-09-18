import React, { useState } from 'react';
import { Toast } from '../../kernel/Toast';
import { Terminal as TermIcon, Key, Server, Plus, Play, Shield, Copy, Check, Trash2, PanelLeftClose, PanelLeft } from 'lucide-react';

interface SshHost {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  keyType: 'ed25519' | 'rsa' | 'password';
  lastConnected?: string;
}

const DEFAULT_HOSTS: SshHost[] = [
  { id: '1', name: 'Home OpenWrt Gateway', host: '192.168.1.1', port: 22, user: 'root', keyType: 'ed25519', lastConnected: '1 hour ago' },
  { id: '2', name: 'Alpine Production VPS', host: '45.76.120.88', port: 2222, user: 'alpine', keyType: 'ed25519', lastConnected: 'Yesterday' },
  { id: '3', name: 'Local Docker Host', host: '127.0.0.1', port: 22, user: 'root', keyType: 'password', lastConnected: 'Just now' },
];

export const SshClientApp: React.FC = () => {
  const [hosts, setHosts] = useState<SshHost[]>(DEFAULT_HOSTS);
  const [selectedHost, setSelectedHost] = useState<SshHost | null>(DEFAULT_HOSTS[0]);
  const [activeSession, setActiveSession] = useState<{ host: SshHost; logs: string[] } | null>(null);
  const [cmdInput, setCmdInput] = useState('');
  const [pubKey, setPubKey] = useState('ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIn5hWp9xZ2Jk60hBf2qL7K1P3mV6uYzAlpineHelix01 root@helix-alpine');
  const [copiedKey, setCopiedKey] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const handleGenerateKey = (type: 'ed25519' | 'rsa') => {
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKey = `ssh-${type} AAAAB3NzaC1yc2EA${randomHex.toUpperCase()} root@helix-alpine-${Date.now().toString().slice(-4)}`;
    setPubKey(newKey);
    Toast.show(`Generated new OpenSSH ${type.toUpperCase()} keypair`, '🔑');
  };

  const handleCopyKey = () => {
    navigator.clipboard?.writeText(pubKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    Toast.show('Public key copied to clipboard', '✓');
  };

  const handleConnect = (host: SshHost) => {
    setActiveSession({
      host,
      logs: [
        `OpenSSH_9.7p1, LibreSSL 3.8.2`,
        `Connecting to ${host.host} [${host.host}] port ${host.port}...`,
        `Connection established.`,
        `Authenticated to ${host.host} ([${host.host}]:${host.port}) using "${host.keyType}".`,
        `Linux alpine-remote 6.6.14-virt #1-Alpine SMP`,
        `Welcome to ${host.name}! Type 'help' or commands to execute remotely.`,
        `----------------------------------------------------------------`,
      ],
    });
    Toast.show(`Connected to ${host.user}@${host.host}`, '⚡');
  };

  const handleSendRemoteCmd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim() || !activeSession) return;
    const cmd = cmdInput.trim();
    setCmdInput('');

    let reply = `[${activeSession.host.user}@remote ~]$ ${cmd}\n`;
    if (cmd === 'uname -a') reply += 'Linux remote-vps 6.6.14-virt x86_64 Linux';
    else if (cmd === 'uptime') reply += ' 14:22:01 up 12 days,  3:14,  1 user,  load average: 0.08, 0.04, 0.01';
    else if (cmd === 'whoami') reply += activeSession.host.user;
    else if (cmd === 'exit') {
      setActiveSession(null);
      Toast.show('SSH session closed cleanly', '✓');
      return;
    } else {
      reply += `Executed: "${cmd}" [status: 0]`;
    }

    setActiveSession({
      ...activeSession,
      logs: [...activeSession.logs, reply],
    });
  };

  const handleAddHost = () => {
    const hostName = prompt('Enter Server Label (e.g. My VPS):', 'New Host');
    if (!hostName) return;
    const newHost: SshHost = {
      id: Date.now().toString(),
      name: hostName,
      host: '192.168.1.150',
      port: 22,
      user: 'root',
      keyType: 'ed25519',
    };
    setHosts([...hosts, newHost]);
    setSelectedHost(newHost);
    Toast.show('Added SSH host configuration', '✓');
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141724] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showSidebar ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
            }`}
            title={showSidebar ? 'Collapse Server List' : 'Expand Server List'}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <Key className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-sm">OpenSSH Client</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400 hidden sm:inline">
            OpenSSH 9.7p1
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerateKey('ed25519')}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-mono transition cursor-pointer border border-white/10"
          >
            ssh-keygen ed25519
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Host Book */}
        {showSidebar && (
          <div className="w-64 border-r border-white/10 bg-[#10121d] flex flex-col shrink-0">
            <div className="p-2 border-b border-white/10 flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span>SAVED SERVERS ({hosts.length})</span>
              <button
                onClick={handleAddHost}
                className="p-1 hover:text-emerald-300 transition cursor-pointer"
                title="Add Host"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {hosts.map((h) => (
                <div
                  key={h.id}
                  onClick={() => setSelectedHost(h)}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    selectedHost?.id === h.id
                      ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-sm'
                      : 'bg-white/5 border-white/5 hover:border-white/15 text-gray-300'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center justify-between">
                    <span className="truncate">{h.name}</span>
                    <span className="text-[9px] font-mono text-amber-400">{h.keyType}</span>
                  </div>
                  <div className="font-mono text-[10px] text-gray-400 truncate mt-0.5">
                    {h.user}@{h.host}:{h.port}
                  </div>
                </div>
              ))}
            </div>

            {/* Keypair Inspector in Sidebar bottom */}
            <div className="p-2.5 border-t border-white/10 bg-black/40 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span className="font-mono text-amber-400 font-bold">~/.ssh/id_ed25519.pub</span>
                <button onClick={handleCopyKey} className="hover:text-white flex items-center gap-1 cursor-pointer">
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-[9px] text-gray-400 truncate bg-black/60 p-1.5 rounded-lg border border-white/5 select-all">
                {pubKey}
              </div>
            </div>
          </div>
        )}

        {/* Right Session / Terminal Pane */}
        <div className="flex-1 flex flex-col bg-[#07080b] overflow-hidden">
          {/* Quick host switcher bar when sidebar is collapsed */}
          {!showSidebar && (
            <div className="px-3 py-1.5 bg-[#141724] border-b border-white/10 flex items-center justify-between gap-2 shrink-0 font-mono text-[11px] overflow-x-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 text-[10px] uppercase">Host:</span>
                {hosts.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHost(h)}
                    className={`px-2 py-0.5 rounded-lg transition cursor-pointer truncate max-w-[140px] ${
                      selectedHost?.id === h.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddHost}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-emerald-300 text-[10px] transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Host</span>
              </button>
            </div>
          )}

          {activeSession ? (
            <div className="flex-1 flex flex-col p-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Connected: {activeSession.host.user}@{activeSession.host.host}:{activeSession.host.port}
                </span>
                <button
                  onClick={() => setActiveSession(null)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-medium transition cursor-pointer border border-rose-500/30"
                >
                  Disconnect (exit)
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 text-gray-300 pb-2">
                {activeSession.logs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendRemoteCmd} className="flex items-center gap-2 pt-2 border-t border-white/10">
                <span className="text-emerald-400 font-bold">ssh&gt;</span>
                <input
                  type="text"
                  value={cmdInput}
                  onChange={(e) => setCmdInput(e.target.value)}
                  placeholder="Type remote command or 'exit'..."
                  className="flex-1 bg-transparent border-0 text-white font-mono focus:outline-none text-xs"
                  autoFocus
                />
              </form>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Server className="w-12 h-12 text-gray-600" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {selectedHost ? `Ready to connect to "${selectedHost.name}"` : 'Select a Server'}
                </h3>
                <p className="text-gray-400 text-xs mt-1 max-w-sm">
                  {selectedHost
                    ? `Remote target: ${selectedHost.user}@${selectedHost.host} over port ${selectedHost.port} using ${selectedHost.keyType} encryption.`
                    : 'Choose an entry from the saved servers list to open an encrypted remote shell.'}
                </p>
              </div>
              {selectedHost && (
                <button
                  onClick={() => handleConnect(selectedHost)}
                  className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl flex items-center gap-2 font-semibold transition cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Initiate SSH Connection</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
