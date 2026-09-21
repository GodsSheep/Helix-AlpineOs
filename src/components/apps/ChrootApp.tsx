import React, { useState, useEffect } from 'react';
import { Kernel } from '../../kernel';
import { ChrootManager, ChrootJail, ChrootAuditReport } from '../../kernel/ChrootManager';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Terminal, 
  Play, 
  Plus, 
  Trash2, 
  RefreshCw, 
  FolderTree, 
  HardDrive, 
  FolderPlus, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Layers, 
  Cpu, 
  ArrowRight,
  ExternalLink,
  Code2,
  Lock,
  Unlock,
  Eye,
  Check
} from 'lucide-react';

export const ChrootApp: React.FC = () => {
  const chrootMgr = ChrootManager.getInstance();
  const [jails, setJails] = useState<ChrootJail[]>(chrootMgr.listJails());
  const [selectedJailId, setSelectedJailId] = useState<string>(jails[0]?.id || '');
  const [activeJail, setActiveJail] = useState<ChrootJail | null>(chrootMgr.getActiveJail());
  const [auditReport, setAuditReport] = useState<ChrootAuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  
  // Create Modal / Form
  const [isCreating, setIsCreating] = useState(false);
  const [newJailName, setNewJailName] = useState('');
  const [newJailPath, setNewJailPath] = useState('/jails/my-sandbox');
  const [newJailTemplate, setNewJailTemplate] = useState<'alpine' | 'debian' | 'busybox' | 'python' | 'recovery'>('alpine');
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Command Runner
  const [runCmd, setRunCmd] = useState('cat /etc/issue');
  const [cmdOutput, setCmdOutput] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Bind Mount Form
  const [bindHostSrc, setBindHostSrc] = useState('/mnt/helix');
  const [bindJailDst, setBindJailDst] = useState('/mnt/host');
  const [isBinding, setIsBinding] = useState(false);

  // Quick File Viewer
  const [viewFilePath, setViewFilePath] = useState('/etc/os-release');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const selectedJail = jails.find(j => j.id === selectedJailId) || jails[0] || null;

  const refreshJails = () => {
    const list = chrootMgr.listJails();
    setJails(list);
    setActiveJail(chrootMgr.getActiveJail());
    if (selectedJailId && !list.some(j => j.id === selectedJailId) && list.length > 0) {
      setSelectedJailId(list[0].id);
    }
  };

  useEffect(() => {
    refreshJails();
    const unsub = chrootMgr.subscribe(() => {
      refreshJails();
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedJail) {
      runAudit(selectedJail.rootPath);
      readFileFromJail(selectedJail.rootPath, '/etc/os-release');
    }
  }, [selectedJail?.id]);

  const runAudit = async (rootPath: string) => {
    setIsAuditing(true);
    try {
      const report = await chrootMgr.auditJail(rootPath);
      setAuditReport(report);
    } catch (e) {
      console.error('Audit failed:', e);
    } finally {
      setIsAuditing(false);
    }
  };

  const readFileFromJail = async (jailRoot: string, subPath: string) => {
    setIsLoadingFile(true);
    setViewFilePath(subPath);
    try {
      const fullVfsPath = `${jailRoot}${subPath.startsWith('/') ? subPath : '/' + subPath}`;
      const content = await Kernel.vfs.read(fullVfsPath);
      setFileContent(content !== null ? content : `[File '${subPath}' does not exist in this rootfs]`);
    } catch (err) {
      setFileContent(`[Error reading file: ${err}]`);
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleCreateJail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJailName.trim() || !newJailPath.trim()) return;
    setIsProvisioning(true);
    try {
      const newJail = await chrootMgr.createJail(newJailName.trim(), newJailPath.trim(), newJailTemplate);
      setIsCreating(false);
      setNewJailName('');
      refreshJails();
      setSelectedJailId(newJail.id);
    } catch (err: any) {
      alert(`Failed to create jail: ${err.message}`);
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleDeleteJail = async (jail: ChrootJail) => {
    if (confirm(`Are you sure you want to completely purge '${jail.name}' and delete all files in ${jail.rootPath}?`)) {
      await chrootMgr.deleteJail(jail.id);
      refreshJails();
    }
  };

  const handleEnterJail = async (jail: ChrootJail) => {
    await chrootMgr.enterJail(jail.rootPath, Kernel.vm);
    Kernel.wm.launch('term');
  };

  const handleExitJail = () => {
    chrootMgr.exitJail(Kernel.vm);
    refreshJails();
  };

  const handleExecuteCommand = async () => {
    if (!selectedJail || !runCmd.trim()) return;
    setIsExecuting(true);
    setCmdOutput(null);
    try {
      const output = await chrootMgr.executeInJail(selectedJail.rootPath, runCmd, Kernel.vm);
      setCmdOutput(output);
    } catch (err: any) {
      setCmdOutput(`Execution Error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAddBindMount = async () => {
    if (!selectedJail || !bindHostSrc.trim() || !bindJailDst.trim()) return;
    setIsBinding(true);
    try {
      const ok = await chrootMgr.addBindMount(selectedJail.id, bindHostSrc.trim(), bindJailDst.trim());
      if (ok) {
        refreshJails();
        setBindJailDst('/mnt/data');
      }
    } finally {
      setIsBinding(false);
    }
  };

  const handleRemoveBindMount = async (target: string) => {
    if (!selectedJail) return;
    await chrootMgr.removeBindMount(selectedJail.id, target);
    refreshJails();
  };

  return (
    <div className="h-full flex flex-col bg-[#0f141c] text-gray-200 font-sans select-none overflow-hidden">
      {/* Top Banner & Header */}
      <div className="px-4 py-3 border-b border-gray-800 bg-[#141b26] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide text-white">Chroot Sandbox Studio</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                v2.0 PRO
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              POSIX filesystem isolation, rootfs virtualization, and security sandboxing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeJail ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-200 font-medium">Jailed: <strong className="text-white">{activeJail.name}</strong></span>
              <button
                onClick={handleExitJail}
                className="ml-2 px-2 py-0.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded border border-red-500/40 text-[10px] font-bold transition"
              >
                Exit Jail
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Host Shell Active (Unjailed)</span>
            </div>
          )}

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Jail</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Jails List */}
        <div className="w-72 border-r border-gray-800 bg-[#121822] flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Configured Jails ({jails.length})</span>
            <button onClick={refreshJails} className="hover:text-white transition">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {jails.map((jail) => {
              const isSelected = jail.id === selectedJailId;
              const isActive = activeJail?.id === jail.id;
              return (
                <div
                  key={jail.id}
                  onClick={() => setSelectedJailId(jail.id)}
                  className={`p-2.5 rounded-lg border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : 'bg-gray-800/20 border-gray-800 hover:bg-gray-800/50 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-xs text-white truncate">{jail.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isActive ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {isActive ? 'ACTIVE' : jail.template}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-gray-400 truncate mb-2">
                    {jail.rootPath}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>{jail.fileCount} files</span>
                    <span>{(jail.sizeBytes / 1024).toFixed(1)} KB</span>
                    <span className={`font-semibold ${
                      jail.securityScore >= 90 ? 'text-emerald-400' : jail.securityScore >= 70 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {jail.securityScore}% Score
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Preset Generator Banner */}
          <div className="p-3 border-t border-gray-800 bg-[#0d121a]">
            <div className="text-[11px] text-gray-400 mb-2 font-medium">Quick Template Actions</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={async () => {
                  await chrootMgr.createJail('Debian 12 Sandbox', '/jails/debian-dev', 'debian');
                  refreshJails();
                }}
                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-[10px] rounded text-gray-300 font-medium transition"
              >
                + Debian 12
              </button>
              <button
                onClick={async () => {
                  await chrootMgr.createJail('Python 3 Env', '/jails/python-app', 'python');
                  refreshJails();
                }}
                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-[10px] rounded text-gray-300 font-medium transition"
              >
                + Python 3
              </button>
            </div>
          </div>
        </div>

        {/* Right Content View: Jail Inspector */}
        {selectedJail ? (
          <div className="flex-1 flex flex-col overflow-y-auto bg-[#0d121a]">
            {/* Jail Header Card */}
            <div className="p-4 border-b border-gray-800 bg-[#121822]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-bold text-white">{selectedJail.name}</h2>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-gray-800 border border-gray-700 font-mono text-gray-300">
                      ID: {selectedJail.id}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-bold">
                      {selectedJail.template}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono flex items-center gap-1">
                    <span>Root:</span> <strong className="text-gray-200">{selectedJail.rootPath}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEnterJail(selectedJail)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition"
                    title="Launch interactive Terminal inside this chroot rootfs"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Enter Jail Shell</span>
                  </button>

                  <button
                    onClick={() => handleDeleteJail(selectedJail)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    title="Purge jail"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-3 mt-4 pt-3 border-t border-gray-800/80 text-xs">
                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800">
                  <div className="text-gray-400 text-[10px]">Filesystem Size</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    {(selectedJail.sizeBytes / 1024).toFixed(1)} KB
                  </div>
                </div>
                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800">
                  <div className="text-gray-400 text-[10px]">Total Files</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    {selectedJail.fileCount} items
                  </div>
                </div>
                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800">
                  <div className="text-gray-400 text-[10px]">Bind Mounts</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    {selectedJail.bindMounts.length} mapped
                  </div>
                </div>
                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800">
                  <div className="text-gray-400 text-[10px]">Security Rating</div>
                  <div className={`text-sm font-bold font-mono mt-0.5 ${
                    selectedJail.securityScore >= 90 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {selectedJail.securityScore}/100 ({auditReport?.rating || 'GOOD'})
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs / Sections */}
            <div className="p-4 space-y-6">
              {/* 1. Security Audit Report */}
              <div className="bg-[#121822] rounded-xl border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Security & Privilege Escalation Audit</h3>
                  </div>
                  <button
                    onClick={() => runAudit(selectedJail.rootPath)}
                    disabled={isAuditing}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                    <span>Re-scan</span>
                  </button>
                </div>

                {auditReport && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {auditReport.findings.map((f, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                            f.type === 'safe'
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                              : f.type === 'warning'
                              ? 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                              : 'bg-red-500/5 border-red-500/20 text-red-300'
                          }`}
                        >
                          {f.type === 'safe' ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                          ) : f.type === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                          ) : (
                            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                          )}
                          <div>
                            <div className="font-semibold text-white">{f.title}</div>
                            <div className="text-[11px] opacity-80 mt-0.5">{f.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {auditReport.recommendations.length > 0 && (
                      <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-800 text-xs">
                        <span className="font-semibold text-amber-300 block mb-1">Hardening Recommendations:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-gray-400 text-[11px]">
                          {auditReport.recommendations.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. One-Shot Sandboxed Command Execution */}
              <div className="bg-[#121822] rounded-xl border border-gray-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">One-Shot Sandboxed Execution</h3>
                </div>

                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs font-mono text-gray-500">chroot {selectedJail.rootPath} $</span>
                    <input
                      type="text"
                      value={runCmd}
                      onChange={(e) => setRunCmd(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleExecuteCommand()}
                      placeholder="e.g. cat /etc/issue, uname -a, ls -la /"
                      className="w-full pl-44 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs font-mono text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    onClick={handleExecuteCommand}
                    disabled={isExecuting}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isExecuting ? 'Running...' : 'Run'}</span>
                  </button>
                </div>

                {cmdOutput !== null && (
                  <div className="p-3 bg-black/60 rounded-lg border border-gray-800 text-xs font-mono text-emerald-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {cmdOutput || '[Process completed with 0 output]'}
                  </div>
                )}
              </div>

              {/* 3. Bind Mounts Manager */}
              <div className="bg-[#121822] rounded-xl border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">VFS Bind Mounts</h3>
                  </div>
                  <span className="text-[11px] text-gray-400">Map host directories into the jail</span>
                </div>

                {selectedJail.bindMounts.length > 0 ? (
                  <div className="space-y-1.5 mb-3">
                    {selectedJail.bindMounts.map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-900/60 rounded-lg border border-gray-800 text-xs font-mono">
                        <div className="flex items-center gap-2 text-gray-300">
                          <span className="text-gray-400">Host:</span>
                          <span className="text-white font-semibold">{b.source}</span>
                          <ArrowRight className="w-3 h-3 text-purple-400" />
                          <span className="text-gray-400">Jail:</span>
                          <span className="text-amber-300 font-semibold">{b.target}</span>
                          {b.readOnly && <span className="text-[9px] px-1 bg-red-500/20 text-red-300 rounded">RO</span>}
                        </div>
                        <button
                          onClick={() => handleRemoveBindMount(b.target)}
                          className="text-gray-500 hover:text-red-400 transition"
                          title="Unmount"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic mb-3">No active bind mounts in this jail.</div>
                )}

                <div className="flex gap-2 text-xs">
                  <input
                    type="text"
                    value={bindHostSrc}
                    onChange={(e) => setBindHostSrc(e.target.value)}
                    placeholder="Host source (e.g. /mnt/helix)"
                    className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg font-mono text-white outline-none focus:border-purple-500 text-xs"
                  />
                  <input
                    type="text"
                    value={bindJailDst}
                    onChange={(e) => setBindJailDst(e.target.value)}
                    placeholder="Jail target (e.g. /mnt/host)"
                    className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg font-mono text-white outline-none focus:border-purple-500 text-xs"
                  />
                  <button
                    onClick={handleAddBindMount}
                    disabled={isBinding}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition"
                  >
                    + Bind
                  </button>
                </div>
              </div>

              {/* 4. Quick Rootfs File Inspector */}
              <div className="bg-[#121822] rounded-xl border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Rootfs File Inspector</h3>
                  </div>
                  <div className="flex gap-1">
                    {['/etc/issue', '/etc/os-release', '/etc/passwd', '/etc/resolv.conf'].map((fp) => (
                      <button
                        key={fp}
                        onClick={() => readFileFromJail(selectedJail.rootPath, fp)}
                        className="px-2 py-0.5 text-[10px] font-mono bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition"
                      >
                        {fp.split('/').pop()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-black/50 rounded-lg border border-gray-800 text-xs font-mono text-gray-300 whitespace-pre max-h-48 overflow-y-auto">
                  {isLoadingFile ? 'Reading file...' : fileContent}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-xs">
            Select or initialize a chroot jail to view configuration
          </div>
        )}
      </div>

      {/* Modal: Create Jail */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#161e2a] border border-gray-700 rounded-xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-amber-400" />
              <span>Provision New Chroot Rootfs</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Initializes a minimal directory structure with system binaries and config files.
            </p>

            <form onSubmit={handleCreateJail} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 mb-1 font-medium">Jail Name</label>
                <input
                  type="text"
                  value={newJailName}
                  onChange={(e) => setNewJailName(e.target.value)}
                  placeholder="e.g. Debian Dev Sandbox"
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-sans outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-medium">Root Path in VFS</label>
                <input
                  type="text"
                  value={newJailPath}
                  onChange={(e) => setNewJailPath(e.target.value)}
                  placeholder="/jails/my-env"
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-medium">Distribution Template</label>
                <select
                  value={newJailTemplate}
                  onChange={(e) => setNewJailTemplate(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-amber-500"
                >
                  <option value="alpine">Alpine Linux 3.20 (musl + busybox + apk)</option>
                  <option value="debian">Debian 12 Bookworm (glibc + bash + apt)</option>
                  <option value="busybox">BusyBox Micro-Rootfs (ultra-lightweight)</option>
                  <option value="python">Python 3 Sandbox Runtime (app scaffold)</option>
                  <option value="recovery">Disaster Recovery & Diagnostics Tools</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProvisioning}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition flex items-center gap-1.5"
                >
                  <span>{isProvisioning ? 'Provisioning...' : 'Create Jail'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
