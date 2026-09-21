import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Minus,
  Square,
  Terminal as TermIcon,
  FileText,
  Activity,
  Layers,
  Sparkles,
  Play,
  RotateCcw,
  Settings,
  HardDrive,
  Cpu,
  Monitor,
  Flame,
  Search,
  Save,
  FolderOpen,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Shield,
  Palette,
  Archive,
  Server,
  Maximize2
} from 'lucide-react';
import { Kernel } from '../../kernel';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { WineProcessManager, WineProcess } from '../../kernel/WineProcessManager';

interface WineAppWindowProps {
  windowId?: string;
  args?: Record<string, unknown>;
}

export const WineAppWindow: React.FC<WineAppWindowProps> = ({ windowId = 'wine-win-default', args }) => {
  const appName = (args?.appName as string) || (args?.title as string) || 'notepad.exe';
  const rawType = (args?.type as string) || '';
  
  const detectType = (): WineProcess['type'] => {
    if (rawType) return rawType as WineProcess['type'];
    const lower = appName.toLowerCase();
    if (lower.includes('notepad')) return 'notepad';
    if (lower.includes('cmd')) return 'cmd';
    if (lower.includes('task')) return 'taskmgr';
    if (lower.includes('reg')) return 'regedit';
    if (lower.includes('mine')) return 'winemine';
    if (lower.includes('bench') || lower.includes('dxvk') || lower.includes('3d')) return 'dxvk_bench';
    if (lower.includes('calc')) return 'calc';
    if (lower.includes('winecfg') || lower.includes('cfg')) return 'winecfg';
    if (lower.includes('7z') || lower.includes('zip')) return '7z';
    if (lower.includes('putty') || lower.includes('ssh')) return 'putty';
    if (lower.includes('paint') || lower.includes('draw')) return 'paint';
    return 'generic';
  };

  const appType = detectType();
  const windowsVersion = (args?.windowsVersion as string) || 'Windows 11 Pro (64-bit)';
  const renderer = (args?.renderer as string) || 'DXVK 2.3 (Vulkan)';
  const dllOverrides = (args?.dllOverrides as string) || 'd3d11=n,b; ucrtbase=n; vcruntime140=n';

  // Process Registration
  const [pid, setPid] = useState<number>(() => {
    return (args?.pid as number) || Math.floor(2000 + Math.random() * 8000);
  });

  useEffect(() => {
    const memEstimate = appType === 'dxvk_bench' ? 142 : appType === 'taskmgr' ? 38 : appType === 'cmd' ? 14 : 24;
    const cpuEstimate = appType === 'dxvk_bench' ? 18.5 : 0.8;
    const proc = WineProcessManager.registerProcess({
      pid,
      windowId,
      name: appName,
      exePath: (args?.exePath as string) || `C:\\windows\\system32\\${appName}`,
      type: appType,
      cpuPercent: cpuEstimate,
      memoryMb: memEstimate,
      threads: appType === 'dxvk_bench' ? 8 : 2,
      windowsVersion,
      renderer,
      dllOverrides
    });

    return () => {
      WineProcessManager.unregisterProcess(windowId);
    };
  }, [windowId, appName, appType, pid, windowsVersion, renderer, dllOverrides]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e24] text-gray-100 font-sans select-none overflow-hidden text-xs">
      {/* Wine 9.0 Win32 Emulation Banner / Status Header */}
      <div className="px-2.5 py-1 bg-[#12141c] border-b border-white/10 flex items-center justify-between font-mono text-[10px] shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
            WINE 9.0 PRO
          </span>
          <span className="text-gray-400 truncate max-w-[240px]">
            PID: <strong className="text-white">{pid}</strong> | {windowsVersion} | {renderer}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Win32 PE Subsystem Active
          </span>
          <button
            onClick={() => {
              Toast.show(`Terminated Win32 process ${appName} [PID ${pid}]`, '🛑');
              Kernel.wm.close(windowId);
            }}
            className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition cursor-pointer"
            title="Terminate Process"
          >
            End Process
          </button>
        </div>
      </div>

      {/* Main Subsystem App Body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {appType === 'notepad' && <WineNotepadApp pid={pid} appName={appName} />}
        {appType === 'cmd' && <WineCmdApp pid={pid} />}
        {appType === 'taskmgr' && <WineTaskmgrApp currentPid={pid} />}
        {appType === 'regedit' && <WineRegeditApp />}
        {appType === 'winemine' && <WineMineApp />}
        {appType === 'dxvk_bench' && <WineDxvkBenchmarkApp />}
        {appType === 'calc' && <WineCalcApp />}
        {appType === 'winecfg' && <WineConfigApp windowsVersion={windowsVersion} renderer={renderer} />}
        {appType === '7z' && <Wine7ZipApp />}
        {appType === 'putty' && <WinePuttyApp />}
        {appType === 'paint' && <WinePaintApp />}
        {appType === 'generic' && <WineGenericPeApp appName={appName} pid={pid} />}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 1. WINE NOTEPAD (notepad.exe)
// ---------------------------------------------------------------------------
const WineNotepadApp: React.FC<{ pid: number; appName: string }> = ({ pid, appName }) => {
  const [text, setText] = useState<string>(
    `Helix OS Wine 9.0 Compatibility Subsystem\n==========================================\n\nProcess: ${appName} (PID: ${pid})\nWindows File System Mapping:\n- C:\\ -> /home/alpine/.wine64/drive_c\n- Z:\\ -> / (Helix VFS Root)\n\nYou can edit, format, and save files directly to Helix VFS!`
  );
  const [wordWrap, setWordWrap] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(13);
  const [fontFamily, setFontFamily] = useState<'Consolas' | 'Segoe UI' | 'Courier New'>('Consolas');
  const [savedFilename, setSavedFilename] = useState<string>('/home/alpine/notepad_notes.txt');

  const handleSave = async () => {
    try {
      await Kernel.vfs.write(savedFilename, text);
      SoundManager.play('success');
      Toast.show(`Saved to Z:${savedFilename.replace(/\//g, '\\')}`, '💾');
    } catch {
      Toast.show('Failed to save to VFS', '⚠️');
    }
  };

  const handleOpenFromVfs = async () => {
    try {
      const content = await Kernel.vfs.read(savedFilename);
      if (content !== null) {
        setText(content);
        SoundManager.play('open');
        Toast.show(`Loaded Z:${savedFilename.replace(/\//g, '\\')}`, '📁');
      } else {
        Toast.show(`File ${savedFilename} not found in VFS.`, '⚠️');
      }
    } catch {
      Toast.show('Error reading from VFS', '⚠️');
    }
  };

  const lines = text.split('\n');
  const lineCount = lines.length;
  const charCount = text.length;

  return (
    <div className="flex-1 flex flex-col bg-[#fbfbfb] text-gray-900 font-sans select-none overflow-hidden">
      {/* Classic Windows Notepad Menu Bar */}
      <div className="px-2 py-1 bg-[#f0f0f0] border-b border-[#d4d4d4] flex items-center justify-between text-xs font-sans select-none">
        <div className="flex items-center gap-4 text-gray-800">
          <div className="hover:bg-blue-100 px-1.5 py-0.5 rounded cursor-pointer" onClick={() => setText('')}>
            New
          </div>
          <div className="hover:bg-blue-100 px-1.5 py-0.5 rounded cursor-pointer" onClick={handleOpenFromVfs}>
            Open (Z:\)
          </div>
          <div className="hover:bg-blue-100 px-1.5 py-0.5 rounded cursor-pointer font-semibold text-blue-700" onClick={handleSave}>
            Save
          </div>
          <div
            className="hover:bg-blue-100 px-1.5 py-0.5 rounded cursor-pointer"
            onClick={() => setWordWrap(!wordWrap)}
          >
            Wrap: {wordWrap ? 'ON' : 'OFF'}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
            <span>Font:</span>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value as any)}
              className="bg-white border border-gray-300 rounded px-1 py-0.5 text-[11px]"
            >
              <option value="Consolas">Consolas</option>
              <option value="Segoe UI">Segoe UI</option>
              <option value="Courier New">Courier New</option>
            </select>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="bg-white border border-gray-300 rounded px-1 py-0.5 text-[11px]"
            >
              <option value={11}>11pt</option>
              <option value={13}>13pt</option>
              <option value={16}>16pt</option>
              <option value={20}>20pt</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-gray-500 font-mono">
          VFS: Z:{savedFilename.replace(/\//g, '\\')}
        </div>
      </div>

      {/* Editor Canvas */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className={`flex-1 p-3 bg-white text-gray-900 border-none outline-none resize-none select-text leading-relaxed ${
          wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
        }`}
        style={{ fontFamily, fontSize: `${fontSize}px` }}
      />

      {/* Classic Status Bar */}
      <div className="px-3 py-1 bg-[#f0f0f0] border-t border-[#d4d4d4] flex items-center justify-between text-[11px] text-gray-600 font-sans">
        <div className="flex items-center gap-6">
          <span>Ln {lineCount}, Col 1</span>
          <span>{charCount} characters</span>
          <span>100% Zoom</span>
        </div>
        <div className="flex items-center gap-6 font-mono">
          <span>Windows (CRLF)</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. WINE COMMAND PROMPT (cmd.exe)
// ---------------------------------------------------------------------------
const WineCmdApp: React.FC<{ pid: number }> = ({ pid }) => {
  const [history, setHistory] = useState<string[]>([
    'Microsoft Windows [Version 10.0.22631.3296]',
    '(c) Microsoft Corporation. All rights reserved.',
    `Wine 9.0 Win32 Environment Initialized (PID: ${pid})`,
    '',
    'Z:\\home\\alpine> ver',
    'Microsoft Windows 11 Pro [Wine 9.0 Compatibility Layer]',
    '',
    'Type "help" for a list of supported Win32 commands.',
    ''
  ]);
  const [input, setInput] = useState<string>('');
  const [textColor, setTextColor] = useState<string>('text-gray-200');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const cmdLine = input.trim();
    const parts = cmdLine.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let output = '';

    if (cmd === 'cls') {
      setHistory([]);
      setInput('');
      return;
    } else if (cmd === 'help') {
      output = `Supported Win32 & Helix Bridge Commands:\n  DIR        Displays list of files and subdirectories in Helix VFS\n  VER        Displays Windows and Wine OS version\n  IPCONFIG   Displays full IP stack, gateway, and DNS configuration\n  TASKLIST   Displays list of active Win32 processes\n  TASKKILL   Terminates a process by PID (/PID <pid>)\n  PING       Pings remote host or gateway\n  ECHO       Displays messages or writes to file\n  TYPE       Displays contents of a text file\n  COLOR      Sets console text color (e.g. color 0a, color 0c)\n  START      Launches a new Win32 program in its OWN window\n  EXIT       Closes Command Prompt`;
    } else if (cmd === 'ver') {
      output = 'Microsoft Windows [Version 10.0.22631.3296] (Wine 9.0 emulated)';
    } else if (cmd === 'dir') {
      try {
        const files = await Kernel.vfs.list();
        const rows = files.slice(0, 10).map(f => `09/20/2026  05:30 AM    ${f.content ? f.content.length.toString().padStart(12, ' ') : '           0'} ${f.path.replace(/^\//, '').replace(/\//g, '\\')}`);
        output = ` Volume in drive Z is Helix VFS\n Volume Serial Number is 4A21-88F9\n\n Directory of Z:\\home\\alpine\n\n${rows.join('\n')}\n               ${files.length} File(s)    8,589,934,592 bytes free`;
      } catch {
        output = 'Volume in drive Z: 12 Files, 8,589,934,592 bytes free.';
      }
    } else if (cmd === 'ipconfig') {
      output = `Windows IP Configuration\n\nEthernet adapter eth0:\n   Connection-specific DNS Suffix  . :\n   IPv4 Address. . . . . . . . . . . : 192.168.1.145\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.1.1\n   DNS Servers . . . . . . . . . . . : 1.1.1.1, 8.8.8.8`;
    } else if (cmd === 'tasklist') {
      const procs = WineProcessManager.getProcesses();
      output = `Image Name                     PID Session Name        Session#    Mem Usage\n========================= ======== ================ =========== ============\n` +
        procs.map(p => `${p.name.padEnd(25, ' ')} ${p.pid.toString().padStart(8, ' ')} Console                    1      ${Math.round(p.memoryMb * 1024)} K`).join('\n');
    } else if (cmd === 'ping') {
      const target = args[0] || '8.8.8.8';
      output = `Pinging ${target} with 32 bytes of data:\nReply from ${target}: bytes=32 time=12ms TTL=118\nReply from ${target}: bytes=32 time=11ms TTL=118\nReply from ${target}: bytes=32 time=14ms TTL=118\nReply from ${target}: bytes=32 time=12ms TTL=118\n\nPing statistics for ${target}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`;
    } else if (cmd === 'start') {
      const targetApp = args[0] || 'notepad.exe';
      Kernel.wm.launch('wine-app', { appName: targetApp, title: targetApp, multiInstance: true });
      output = `Spawned new Win32 process for '${targetApp}' in its own Helix Window.`;
      Toast.show(`Launched ${targetApp} in new window`, '🍷');
    } else if (cmd === 'color') {
      const c = args[0]?.toLowerCase();
      if (c === '0a' || c === 'a') setTextColor('text-emerald-400');
      else if (c === '0c' || c === 'c') setTextColor('text-rose-400');
      else if (c === '0e' || c === 'e') setTextColor('text-yellow-300');
      else if (c === '0b' || c === 'b') setTextColor('text-cyan-300');
      else setTextColor('text-gray-200');
      output = `Console color adjusted.`;
    } else if (cmd === 'echo') {
      output = args.join(' ');
    } else {
      output = `'${cmd}' is not recognized as an internal or external command,\noperable program or batch file. Type 'help' for commands.`;
    }

    setHistory(prev => [...prev, `Z:\\home\\alpine> ${cmdLine}`, output, '']);
    setInput('');
  };

  return (
    <div className={`flex-1 bg-black p-3 font-mono text-xs overflow-y-auto ${textColor} select-text leading-relaxed`}>
      <div className="space-y-1">
        {history.map((line, idx) => (
          <div key={idx} className={line.startsWith('Z:\\') ? 'text-amber-300 font-bold' : ''}>
            {line}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 mt-2">
        <span className="text-amber-300 font-bold">Z:\home\alpine&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent text-emerald-400 focus:outline-none font-mono text-xs"
          autoFocus
        />
      </form>
      <div ref={bottomRef} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. WINE TASK MANAGER (taskmgr.exe)
// ---------------------------------------------------------------------------
const WineTaskmgrApp: React.FC<{ currentPid: number }> = ({ currentPid }) => {
  const [tab, setTab] = useState<'processes' | 'performance' | 'services'>('processes');
  const [processes, setProcesses] = useState<WineProcess[]>(() => WineProcessManager.getProcesses());
  const [selectedPid, setSelectedPid] = useState<number | null>(currentPid);
  const [newTaskInput, setNewTaskInput] = useState<string>('');
  const [showNewTaskDialog, setShowNewTaskDialog] = useState<boolean>(false);

  useEffect(() => {
    return WineProcessManager.subscribe((procs) => {
      setProcesses(procs);
    });
  }, []);

  const handleEndTask = () => {
    if (!selectedPid) return;
    WineProcessManager.killProcessByPid(selectedPid);
    Toast.show(`Terminated Win32 process PID ${selectedPid}`, '🛑');
    setSelectedPid(null);
  };

  const handleRunNewTask = () => {
    if (!newTaskInput.trim()) return;
    Kernel.wm.launch('wine-app', { appName: newTaskInput.trim(), title: newTaskInput.trim(), multiInstance: true });
    Toast.show(`Spawned ${newTaskInput.trim()} into dedicated window`, '🚀');
    setNewTaskInput('');
    setShowNewTaskDialog(false);
  };

  const totalMemory = processes.reduce((acc, p) => acc + p.memoryMb, 0);
  const totalCpu = Math.min(99.9, processes.reduce((acc, p) => acc + p.cpuPercent, 0)).toFixed(1);

  return (
    <div className="flex-1 flex flex-col bg-[#1f2430] text-gray-200 font-sans select-none overflow-hidden text-xs">
      {/* Task Manager Tabs */}
      <div className="px-3 pt-2 bg-[#171b24] border-b border-white/10 flex items-center justify-between">
        <div className="flex gap-2">
          {(['processes', 'performance', 'services'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-t-lg font-medium capitalize transition cursor-pointer ${
                tab === t ? 'bg-[#1f2430] text-white border-t-2 border-indigo-400' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pb-1">
          <button
            onClick={() => setShowNewTaskDialog(true)}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-semibold cursor-pointer"
          >
            + Run New Task...
          </button>
          <button
            onClick={handleEndTask}
            disabled={!selectedPid}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold disabled:opacity-40 cursor-pointer"
          >
            End Task
          </button>
        </div>
      </div>

      {showNewTaskDialog && (
        <div className="p-3 bg-black/60 border-b border-white/10 flex items-center gap-2">
          <span className="text-gray-300">Executable Name:</span>
          <input
            type="text"
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            placeholder="e.g. regedit.exe, calc.exe, dxvk_bench.exe"
            className="flex-1 bg-black/80 border border-white/20 rounded px-2 py-1 text-white text-xs font-mono"
            autoFocus
          />
          <button onClick={handleRunNewTask} className="px-3 py-1 bg-indigo-500 text-white rounded font-bold">
            Launch Window
          </button>
          <button onClick={() => setShowNewTaskDialog(false)} className="px-2 py-1 bg-white/10 rounded">
            Cancel
          </button>
        </div>
      )}

      {/* Tab 1: Processes */}
      {tab === 'processes' && (
        <div className="flex-1 overflow-y-auto p-2">
          <table className="w-full text-left font-mono text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="p-2">Name</th>
                <th className="p-2">PID</th>
                <th className="p-2">Status</th>
                <th className="p-2">CPU</th>
                <th className="p-2">Memory</th>
                <th className="p-2">Threads</th>
                <th className="p-2">Renderer</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => (
                <tr
                  key={p.pid}
                  onClick={() => setSelectedPid(p.pid)}
                  className={`border-b border-white/5 cursor-pointer transition ${
                    selectedPid === p.pid ? 'bg-indigo-500/30 text-white font-bold' : 'hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <td className="p-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span>{p.name}</span>
                  </td>
                  <td className="p-2">{p.pid}</td>
                  <td className="p-2 text-emerald-400">● {p.status}</td>
                  <td className="p-2">{p.cpuPercent}%</td>
                  <td className="p-2">{p.memoryMb} MB</td>
                  <td className="p-2">{p.threads}</td>
                  <td className="p-2 text-gray-400">{p.renderer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Performance */}
      {tab === 'performance' && (
        <div className="flex-1 p-4 grid grid-cols-2 gap-4">
          <div className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-indigo-300">CPU Usage</span>
              <span className="font-mono text-lg text-emerald-400 font-bold">{totalCpu}%</span>
            </div>
            <div className="h-24 bg-black/80 rounded border border-white/10 flex items-end p-1 gap-1">
              {[12, 18, 14, 25, 32, 28, 22, 19, 15, 30, 24, 29, 35, 20].map((v, i) => (
                <div key={i} className="flex-1 bg-emerald-500/70 rounded-t" style={{ height: `${v}%` }} />
              ))}
            </div>
            <div className="text-[10px] text-gray-400">64-bit Wine Threads | 8 Cores Allocated</div>
          </div>

          <div className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-indigo-300">Memory Allocation</span>
              <span className="font-mono text-lg text-cyan-400 font-bold">{totalMemory} MB</span>
            </div>
            <div className="h-24 bg-black/80 rounded border border-white/10 flex items-end p-1 gap-1">
              {[40, 42, 45, 48, 50, 52, 52, 55, 58, 60, 60, 62, 65, 64].map((v, i) => (
                <div key={i} className="flex-1 bg-cyan-500/70 rounded-t" style={{ height: `${v}%` }} />
              ))}
            </div>
            <div className="text-[10px] text-gray-400">Pagefile: Dynamic / Virtual Heap</div>
          </div>
        </div>
      )}

      {/* Tab 3: Services */}
      {tab === 'services' && (
        <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] space-y-1">
          {[
            { name: 'wineserver', desc: 'Wine IPC & Process Daemon', status: 'Running' },
            { name: 'services.exe', desc: 'Windows Service Control Manager', status: 'Running' },
            { name: 'plugplay', desc: 'Wine Plug and Play Device Manager', status: 'Running' },
            { name: 'rpcss', desc: 'Remote Procedure Call (RPC) Locator', status: 'Running' },
            { name: 'mountmgr', desc: 'VFS Drive & Volume Mount Manager', status: 'Running' }
          ].map((s, idx) => (
            <div key={idx} className="p-2 bg-black/30 rounded border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">{s.name}</span>
                <span className="text-gray-400 text-[10px] ml-2">{s.desc}</span>
              </div>
              <span className="text-emerald-400 font-bold">● {s.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. WINE REGISTRY EDITOR (regedit.exe)
// ---------------------------------------------------------------------------
const WineRegeditApp: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState<string>('HKEY_CURRENT_USER\\Software\\Wine\\Direct3D');
  const [search, setSearch] = useState<string>('');

  const registryData: Record<string, { name: string; type: string; data: string }[]> = {
    'HKEY_CURRENT_USER\\Software\\Wine\\Direct3D': [
      { name: '(Default)', type: 'REG_SZ', data: '(value not set)' },
      { name: 'csmt', type: 'REG_DWORD', data: '0x00000001 (1)' },
      { name: 'Direct3DVersion', type: 'REG_SZ', data: 'DXVK 2.3 Vulkan' },
      { name: 'MaxVersionGL', type: 'REG_DWORD', data: '0x00040006 (4.6)' },
      { name: 'StrictDrawOrdering', type: 'REG_SZ', data: 'disabled' },
      { name: 'OffscreenRenderingMode', type: 'REG_SZ', data: 'fbo' }
    ],
    'HKEY_CURRENT_USER\\Control Panel\\Desktop': [
      { name: '(Default)', type: 'REG_SZ', data: '(value not set)' },
      { name: 'LogPixels', type: 'REG_DWORD', data: '0x00000060 (96 DPI)' },
      { name: 'FontSmoothing', type: 'REG_SZ', data: '2' },
      { name: 'Wallpaper', type: 'REG_SZ', data: 'C:\\windows\\web\\wallpaper.jpg' }
    ],
    'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion': [
      { name: 'ProductName', type: 'REG_SZ', data: 'Windows 11 Pro 64-bit' },
      { name: 'CurrentBuild', type: 'REG_SZ', data: '22631' },
      { name: 'CurrentVersion', type: 'REG_SZ', data: '6.3' },
      { name: 'RegisteredOwner', type: 'REG_SZ', data: 'Helix User' }
    ]
  };

  const currentValues = registryData[selectedKey] || [
    { name: '(Default)', type: 'REG_SZ', data: '(value not set)' }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#1b1e28] text-gray-200 font-sans select-none overflow-hidden text-xs">
      {/* Menu & Address Bar */}
      <div className="p-2 bg-[#121520] border-b border-white/10 space-y-1.5">
        <div className="flex gap-4 text-gray-300 text-xs font-sans">
          <span className="hover:text-white cursor-pointer">File</span>
          <span className="hover:text-white cursor-pointer">Edit</span>
          <span className="hover:text-white cursor-pointer">View</span>
          <span className="hover:text-white cursor-pointer">Favorites</span>
          <span className="hover:text-white cursor-pointer">Help</span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/60 rounded px-2 py-1 border border-white/10 font-mono text-[11px]">
          <span className="text-gray-400">Computer\</span>
          <span className="text-indigo-300 font-bold flex-1 truncate">{selectedKey}</span>
        </div>
      </div>

      {/* Split Tree & Value View */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* Registry Tree */}
        <div className="col-span-5 border-r border-white/10 p-2 overflow-y-auto font-mono text-[11px] space-y-1 bg-black/30">
          <div className="text-gray-400">Computer</div>
          <div className="pl-3 space-y-1">
            <div className="text-gray-400 hover:text-white cursor-pointer">📁 HKEY_CLASSES_ROOT</div>
            <div className="text-indigo-400 font-bold">📁 HKEY_CURRENT_USER</div>
            <div className="pl-3 space-y-1">
              <div
                onClick={() => setSelectedKey('HKEY_CURRENT_USER\\Control Panel\\Desktop')}
                className={`cursor-pointer px-1 rounded ${selectedKey.includes('Control') ? 'bg-indigo-500/40 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                📂 Control Panel\Desktop
              </div>
              <div
                onClick={() => setSelectedKey('HKEY_CURRENT_USER\\Software\\Wine\\Direct3D')}
                className={`cursor-pointer px-1 rounded ${selectedKey.includes('Direct3D') ? 'bg-indigo-500/40 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                📂 Software\Wine\Direct3D
              </div>
            </div>
            <div className="text-indigo-400 font-bold">📁 HKEY_LOCAL_MACHINE</div>
            <div className="pl-3 space-y-1">
              <div
                onClick={() => setSelectedKey('HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion')}
                className={`cursor-pointer px-1 rounded ${selectedKey.includes('Windows NT') ? 'bg-indigo-500/40 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                📂 SOFTWARE\Windows NT
              </div>
            </div>
            <div className="text-gray-400 hover:text-white cursor-pointer">📁 HKEY_USERS</div>
            <div className="text-gray-400 hover:text-white cursor-pointer">📁 HKEY_CURRENT_CONFIG</div>
          </div>
        </div>

        {/* Value List */}
        <div className="col-span-7 p-2 overflow-y-auto font-mono text-[11px] bg-[#121520]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="p-1.5">Name</th>
                <th className="p-1.5">Type</th>
                <th className="p-1.5">Data</th>
              </tr>
            </thead>
            <tbody>
              {currentValues.map((val, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-1.5 text-white font-bold">{val.name}</td>
                  <td className="p-1.5 text-cyan-300">{val.type}</td>
                  <td className="p-1.5 text-emerald-300 truncate max-w-[180px]">{val.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. WINE MINESWEEPER (winemine.exe)
// ---------------------------------------------------------------------------
const WineMineApp: React.FC = () => {
  const [gridSize, setGridSize] = useState<{ rows: number; cols: number; mines: number }>({ rows: 9, cols: 9, mines: 10 });
  const [board, setBoard] = useState<{ revealed: boolean; mine: boolean; count: number; flagged: boolean }[][]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  const initGame = (rows = 9, cols = 9, mineCount = 10) => {
    const newBoard = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => ({ revealed: false, mine: false, count: 0, flagged: false }))
    );

    // Place mines
    let placed = 0;
    while (placed < mineCount) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!newBoard[r][c].mine) {
        newBoard[r][c].mine = true;
        placed++;
      }
    }

    // Calculate neighboring counts
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newBoard[r][c].mine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].mine) {
                count++;
              }
            }
          }
          newBoard[r][c].count = count;
        }
      }
    }

    setBoard(newBoard);
    setGameOver(false);
    setGameWon(false);
    setTimer(0);
    setTimerActive(false);
  };

  useEffect(() => {
    initGame(gridSize.rows, gridSize.cols, gridSize.mines);
  }, [gridSize]);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && !gameOver && !gameWon) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameOver, gameWon]);

  const handleCellClick = (r: number, c: number) => {
    if (gameOver || gameWon || board[r][c].flagged || board[r][c].revealed) return;
    if (!timerActive) setTimerActive(true);

    if (board[r][c].mine) {
      // Reveal all mines
      const revealed = board.map(row => row.map(cell => ({ ...cell, revealed: cell.mine ? true : cell.revealed })));
      setBoard(revealed);
      setGameOver(true);
      SoundManager.play('error');
      Toast.show('Game Over! Mine triggered.', '💥');
      return;
    }

    // Flood reveal
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    const revealEmpty = (row: number, col: number) => {
      if (row < 0 || row >= gridSize.rows || col < 0 || col >= gridSize.cols) return;
      if (newBoard[row][col].revealed || newBoard[row][col].flagged) return;

      newBoard[row][col].revealed = true;
      if (newBoard[row][col].count === 0 && !newBoard[row][col].mine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            revealEmpty(row + dr, col + dc);
          }
        }
      }
    };

    revealEmpty(r, c);
    setBoard(newBoard);
    SoundManager.play('click');

    // Check win condition
    let unrevealedSafe = 0;
    for (let r = 0; r < gridSize.rows; r++) {
      for (let c = 0; c < gridSize.cols; c++) {
        if (!newBoard[r][c].mine && !newBoard[r][c].revealed) {
          unrevealedSafe++;
        }
      }
    }

    if (unrevealedSafe === 0) {
      setGameWon(true);
      SoundManager.play('success');
      Toast.show('Congratulations! You won Wine Minesweeper!', '🏆');
    }
  };

  const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || gameWon || board[r][c].revealed) return;
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    newBoard[r][c].flagged = !newBoard[r][c].flagged;
    setBoard(newBoard);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#c0c0c0] text-black font-mono select-none overflow-auto">
      {/* 3D Classic Minesweeper Bevel Container */}
      <div className="border-4 border-t-white border-l-white border-r-gray-600 border-b-gray-600 p-3 bg-[#c0c0c0] space-y-3">
        {/* Top Header Controls (Mines remaining, Smiley face, Digital Timer) */}
        <div className="border-4 border-t-gray-600 border-l-gray-600 border-r-white border-b-white p-2 flex items-center justify-between bg-[#c0c0c0]">
          <div className="px-2 py-0.5 bg-black text-red-600 font-bold text-lg rounded border border-gray-700">
            {Math.max(0, gridSize.mines - board.flat().filter(c => c.flagged).length).toString().padStart(3, '0')}
          </div>

          <button
            onClick={() => initGame(gridSize.rows, gridSize.cols, gridSize.mines)}
            className="w-9 h-9 border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 active:border-t-gray-700 active:border-l-gray-700 active:border-r-white active:border-b-white bg-[#c0c0c0] flex items-center justify-center text-xl cursor-pointer"
          >
            {gameOver ? '😵' : gameWon ? '😎' : '🙂'}
          </button>

          <div className="px-2 py-0.5 bg-black text-red-600 font-bold text-lg rounded border border-gray-700">
            {Math.min(999, timer).toString().padStart(3, '0')}
          </div>
        </div>

        {/* Board Grid */}
        <div className="border-4 border-t-gray-600 border-l-gray-600 border-r-white border-b-white p-1 bg-[#c0c0c0]">
          <div
            className="grid gap-0"
            style={{ gridTemplateColumns: `repeat(${gridSize.cols}, 26px)` }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => handleRightClick(e, r, c)}
                  className={`w-[26px] h-[26px] flex items-center justify-center font-bold text-sm cursor-pointer select-none ${
                    cell.revealed
                      ? 'border border-gray-400 bg-[#bdbdbd]'
                      : 'border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-[#c0c0c0] active:border-none'
                  }`}
                >
                  {cell.revealed && cell.mine && '💣'}
                  {cell.revealed && !cell.mine && cell.count > 0 && (
                    <span className={
                      cell.count === 1 ? 'text-blue-700' :
                      cell.count === 2 ? 'text-green-700' :
                      cell.count === 3 ? 'text-red-700' :
                      cell.count === 4 ? 'text-purple-900' : 'text-amber-800'
                    }>
                      {cell.count}
                    </span>
                  )}
                  {!cell.revealed && cell.flagged && '🚩'}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center justify-center gap-2 text-[10px]">
          <button
            onClick={() => setGridSize({ rows: 9, cols: 9, mines: 10 })}
            className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 border border-gray-500 rounded cursor-pointer"
          >
            Beginner (9x9)
          </button>
          <button
            onClick={() => setGridSize({ rows: 12, cols: 12, mines: 20 })}
            className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 border border-gray-500 rounded cursor-pointer"
          >
            Intermediate
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 6. WINE DIRECTX 11 / DXVK 3D BENCHMARK (dxvk_bench.exe)
// ---------------------------------------------------------------------------
const WineDxvkBenchmarkApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fps, setFps] = useState<number>(60);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [shape, setShape] = useState<'cube' | 'pyramid' | 'torus'>('cube');
  const [postFx, setPostFx] = useState<'none' | 'bloom' | 'scanlines'>('bloom');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angleX = 0;
    let angleY = 0;
    let angleZ = 0;
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCounter = 0;

    const render = (time: number) => {
      frameCounter++;
      if (time - lastTime >= 1000) {
        setFps(frameCounter);
        frameCounter = 0;
        lastTime = time;
      }

      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const size = 90;

      angleX += 0.015;
      angleY += 0.02;
      angleZ += 0.008;

      // 3D Cube Rotation
      const nodes = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
      ];

      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];

      const projected = nodes.map(([x, y, z]) => {
        // Rotate around X
        let y1 = y * Math.cos(angleX) - z * Math.sin(angleX);
        let z1 = y * Math.sin(angleX) + z * Math.cos(angleX);

        // Rotate around Y
        let x2 = x * Math.cos(angleY) + z1 * Math.sin(angleY);
        let z2 = -x * Math.sin(angleY) + z1 * Math.cos(angleY);

        // Rotate around Z
        let x3 = x2 * Math.cos(angleZ) - y1 * Math.sin(angleZ);
        let y3 = x2 * Math.sin(angleZ) + y1 * Math.cos(angleZ);

        const distance = 3;
        const fov = 260;
        const scale = fov / (distance + z2);

        return [cx + x3 * size * scale / 150, cy + y3 * size * scale / 150, z2];
      });

      // Draw Edges / Wireframe
      ctx.strokeStyle = wireframe ? '#38bdf8' : '#6366f1';
      ctx.lineWidth = wireframe ? 1.5 : 3;

      edges.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(projected[i][0], projected[i][1]);
        ctx.lineTo(projected[j][0], projected[j][1]);
        ctx.stroke();
      });

      // Draw Vertices
      projected.forEach(([px, py]) => {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Scanlines FX
      if (postFx === 'scanlines') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        for (let y = 0; y < canvas.height; y += 4) {
          ctx.fillRect(0, y, canvas.width, 2);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [wireframe, shape, postFx]);

  return (
    <div className="flex-1 flex flex-col bg-[#0a0d14] text-white font-mono select-none overflow-hidden">
      {/* DirectX 11 HUD */}
      <div className="p-3 bg-[#111420] border-b border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-bold text-white">DXVK 2.3 Vulkan Direct3D 11 Render Target</span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-emerald-400 font-bold">FPS: {fps}</span>
          <span className="text-cyan-300">Draw Calls: 248/f</span>
          <span className="text-indigo-300">VRAM: 142 MB</span>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas ref={canvasRef} width={580} height={320} className="rounded-xl border border-indigo-500/30 shadow-2xl bg-black" />

        {/* Floating Settings Overlay */}
        <div className="absolute top-4 left-4 bg-black/70 p-2.5 rounded-xl border border-white/10 space-y-2 text-[11px] backdrop-blur-sm">
          <div className="text-indigo-300 font-bold">Direct3D 11 Engine Settings</div>
          <div className="flex items-center gap-2">
            <span>Wireframe:</span>
            <button
              onClick={() => setWireframe(!wireframe)}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer ${wireframe ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white'}`}
            >
              {wireframe ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span>Post-FX:</span>
            <select
              value={postFx}
              onChange={(e) => setPostFx(e.target.value as any)}
              className="bg-black border border-white/20 rounded px-1 py-0.5 text-[10px] text-white"
            >
              <option value="none">None</option>
              <option value="bloom">Bloom HDR</option>
              <option value="scanlines">CRT Scanlines</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 7. WINE CALCULATOR (calc.exe)
// ---------------------------------------------------------------------------
const WineCalcApp: React.FC = () => {
  const [display, setDisplay] = useState<string>('0');
  const [memory, setMemory] = useState<number>(0);
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);

  const handleNum = (num: string) => {
    setDisplay(prev => prev === '0' ? num : prev + num);
  };

  const handleOp = (operator: string) => {
    setPrevVal(parseFloat(display));
    setOp(operator);
    setDisplay('0');
  };

  const handleEquals = () => {
    if (prevVal === null || op === null) return;
    const current = parseFloat(display);
    let res = 0;
    if (op === '+') res = prevVal + current;
    else if (op === '-') res = prevVal - current;
    else if (op === '*') res = prevVal * current;
    else if (op === '/') res = current !== 0 ? prevVal / current : 0;

    setDisplay(res.toString());
    setPrevVal(null);
    setOp(null);
    SoundManager.play('click');
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevVal(null);
    setOp(null);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#232733] text-white font-mono select-none">
      <div className="w-full max-w-[280px] bg-[#161922] p-4 rounded-2xl border border-white/10 shadow-2xl space-y-3">
        {/* LCD Screen */}
        <div className="bg-black/70 p-3 rounded-xl border border-white/15 text-right font-mono text-2xl text-emerald-400 font-bold overflow-hidden truncate">
          {display}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2 text-sm font-bold">
          <button onClick={handleClear} className="p-2.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30">C</button>
          <button onClick={() => setDisplay(Math.sqrt(parseFloat(display)).toString())} className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10">√</button>
          <button onClick={() => setDisplay((parseFloat(display) / 100).toString())} className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10">%</button>
          <button onClick={() => handleOp('/')} className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30">÷</button>

          {['7', '8', '9'].map(n => <button key={n} onClick={() => handleNum(n)} className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20">{n}</button>)}
          <button onClick={() => handleOp('*')} className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30">×</button>

          {['4', '5', '6'].map(n => <button key={n} onClick={() => handleNum(n)} className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20">{n}</button>)}
          <button onClick={() => handleOp('-')} className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30">−</button>

          {['1', '2', '3'].map(n => <button key={n} onClick={() => handleNum(n)} className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20">{n}</button>)}
          <button onClick={() => handleOp('+')} className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30">+</button>

          <button onClick={() => handleNum('0')} className="col-span-2 p-2.5 rounded-lg bg-white/10 hover:bg-white/20">0</button>
          <button onClick={() => handleNum('.')} className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20">.</button>
          <button onClick={handleEquals} className="p-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg">=</button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 8. WINE CONFIGURATION (winecfg.exe)
// ---------------------------------------------------------------------------
const WineConfigApp: React.FC<{ windowsVersion: string; renderer: string }> = ({ windowsVersion: initialWin, renderer: initialRend }) => {
  const [winVer, setWinVer] = useState(initialWin);
  const [rend, setRend] = useState(initialRend);
  const [virtualDesktop, setVirtualDesktop] = useState(true);
  const [dpi, setDpi] = useState(96);

  const handleApply = () => {
    SoundManager.play('success');
    Toast.show('Wine prefix configuration updated successfully in ~/.wine64', '🍷');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1c1f2b] p-4 text-white font-sans select-none overflow-y-auto space-y-4 text-xs">
      <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-3">
        <h3 className="font-bold text-indigo-300 flex items-center gap-1.5 text-sm">
          <Settings className="w-4 h-4" /> <span>Wine Configuration (winecfg)</span>
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-gray-400 block mb-1">Windows Version Emulation:</label>
            <select
              value={winVer}
              onChange={(e) => setWinVer(e.target.value)}
              className="w-full bg-black border border-white/20 rounded-lg p-2 text-white text-xs"
            >
              <option value="Windows 11 Pro (64-bit)">Windows 11 Pro (64-bit)</option>
              <option value="Windows 10 (64-bit)">Windows 10 (64-bit)</option>
              <option value="Windows 7 SP1">Windows 7 SP1</option>
              <option value="Windows XP SP3">Windows XP SP3</option>
            </select>
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Direct3D Graphics Translation Layer:</label>
            <select
              value={rend}
              onChange={(e) => setRend(e.target.value)}
              className="w-full bg-black border border-white/20 rounded-lg p-2 text-white text-xs"
            >
              <option value="DXVK 2.3 (Vulkan)">DXVK 2.3 (Direct3D 9/10/11 to Vulkan API)</option>
              <option value="WineD3D (OpenGL)">WineD3D (OpenGL Core Profile)</option>
              <option value="VKD3D (DirectX 12)">VKD3D (DirectX 12 to Vulkan)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="vdesk"
              checked={virtualDesktop}
              onChange={(e) => setVirtualDesktop(e.target.checked)}
              className="accent-indigo-500 cursor-pointer"
            />
            <label htmlFor="vdesk" className="text-gray-300 cursor-pointer">Emulate Virtual Desktop Container (1280x720)</label>
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Screen DPI Scaling ({dpi} DPI)</label>
            <input
              type="range"
              min={96}
              max={192}
              step={24}
              value={dpi}
              onChange={(e) => setDpi(Number(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={handleApply} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 font-bold rounded-xl text-white cursor-pointer shadow">
          Apply Settings
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 9. 7-ZIP FILE MANAGER (7zFM.exe)
// ---------------------------------------------------------------------------
const Wine7ZipApp: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-[#181b24] text-gray-200 font-sans select-none overflow-hidden text-xs">
      <div className="p-2 bg-black/40 border-b border-white/10 flex items-center gap-3">
        <button onClick={() => Toast.show('Extracting archive to Z:\\home\\alpine...', '📦')} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded font-bold">
          Extract
        </button>
        <button onClick={() => Toast.show('Archive integrity verified 100% OK!', '✓')} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded font-bold">
          Test
        </button>
        <button onClick={() => Toast.show('7-Zip Benchmark: 48,200 MIPS (Multi-threaded)', '⚡')} className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 rounded font-bold">
          Benchmark
        </button>
      </div>

      <div className="flex-1 p-2 overflow-y-auto font-mono text-[11px]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 text-gray-400">
              <th className="p-1">Name</th>
              <th className="p-1">Size</th>
              <th className="p-1">Packed</th>
              <th className="p-1">Modified</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'helix_kernel.dll', size: '2.4 MB', packed: '840 KB', date: '09/20/2026' },
              { name: 'direct3d_dxvk.dll', size: '6.8 MB', packed: '2.1 MB', date: '09/20/2026' },
              { name: 'win32_compat.exe', size: '412 KB', packed: '140 KB', date: '09/20/2026' },
              { name: 'resources.pak', size: '18.4 MB', packed: '6.2 MB', date: '09/20/2026' }
            ].map((f, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-1 text-white flex items-center gap-1.5">
                  <Archive className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{f.name}</span>
                </td>
                <td className="p-1 text-gray-400">{f.size}</td>
                <td className="p-1 text-cyan-300">{f.packed}</td>
                <td className="p-1 text-gray-500">{f.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 10. PUTTY SSH CLIENT (putty.exe)
// ---------------------------------------------------------------------------
const WinePuttyApp: React.FC = () => {
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState('22');
  const [connected, setConnected] = useState(false);

  return (
    <div className="flex-1 flex flex-col bg-[#1a1d28] p-4 text-gray-200 font-sans select-none overflow-y-auto space-y-3 text-xs">
      <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-2.5">
        <div className="font-bold text-indigo-300 text-sm flex items-center gap-1.5">
          <Server className="w-4 h-4" /> <span>PuTTY Configuration (Win32)</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="text-gray-400 block mb-1">Host Name (or IP address):</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="w-full bg-black border border-white/20 rounded p-1.5 text-white font-mono text-xs"
            />
          </div>
          <div>
            <label className="text-gray-400 block mb-1">Port:</label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full bg-black border border-white/20 rounded p-1.5 text-white font-mono text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-gray-300">
          <span>Connection type:</span>
          <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="conn" defaultChecked className="accent-indigo-500" /> SSH</label>
          <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="conn" className="accent-indigo-500" /> Telnet</label>
          <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="conn" className="accent-indigo-500" /> Serial</label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setConnected(true);
            Toast.show(`PuTTY SSH Session connected to ${host}:${port}`, '🖥️');
          }}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl cursor-pointer"
        >
          {connected ? 'Session Connected' : 'Open Connection'}
        </button>
      </div>

      {connected && (
        <div className="p-3 bg-black rounded-xl border border-emerald-500/40 font-mono text-emerald-400 text-xs space-y-1">
          <div>PuTTY Release 0.81 (Win32 / Wine 9.0)</div>
          <div>Using username "alpine".</div>
          <div>Authenticating with public key "imported-openssh-key"...</div>
          <div>Welcome to Alpine Linux 3.19 (x86_64) on Helix OS!</div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 11. WIN32 PAINT (paint32.exe)
// ---------------------------------------------------------------------------
const WinePaintApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState<string>('#6366f1');
  const [brushSize, setBrushSize] = useState<number>(4);
  const isDrawing = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    isDrawing.current = true;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => {
    isDrawing.current = false;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#e5e7eb] text-gray-900 font-sans select-none overflow-hidden text-xs">
      <div className="p-2 bg-[#f3f4f6] border-b border-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette className="w-4 h-4 text-indigo-600" />
          <div className="flex items-center gap-1.5">
            {['#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#ec4899', '#ffffff'].map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border border-gray-400 cursor-pointer ${color === c ? 'ring-2 ring-indigo-500 scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-700">
            <span>Size:</span>
            <input
              type="range"
              min={1}
              max={20}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20 accent-indigo-600"
            />
          </div>
        </div>

        <button
          onClick={() => {
            SoundManager.play('success');
            Toast.show('Saved canvas image to Z:\\home\\alpine\\drawing.png', '💾');
          }}
          className="px-3 py-1 bg-indigo-600 text-white rounded font-bold cursor-pointer hover:bg-indigo-500"
        >
          Save to VFS
        </button>
      </div>

      <div className="flex-1 p-2 flex items-center justify-center bg-[#d1d5db] overflow-auto">
        <canvas
          ref={canvasRef}
          width={540}
          height={320}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          className="bg-white border border-gray-400 shadow-md cursor-crosshair"
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 12. GENERIC PE LOADER & DISASSEMBLER
// ---------------------------------------------------------------------------
const WineGenericPeApp: React.FC<{ appName: string; pid: number }> = ({ appName, pid }) => {
  return (
    <div className="flex-1 p-4 bg-[#12141d] text-gray-200 font-mono select-none overflow-y-auto space-y-3 text-xs">
      <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-1.5">
        <div className="text-indigo-400 font-bold text-sm">Win32 Executable: {appName} (PID: {pid})</div>
        <div className="text-gray-400 text-[11px]">PE32+ 64-bit Binary Loaded | Entry Point: 0x140001000</div>
        <div className="text-emerald-400 text-[11px]">Virtual Win32 Dispatch Loop Running under Wine 9.0</div>
      </div>

      <div className="p-3 bg-[#0a0c12] rounded-xl border border-white/10 space-y-2">
        <div className="text-gray-400 font-bold border-b border-white/10 pb-1">Win32 Disassembly Stream</div>
        <div className="space-y-1 text-[11px]">
          <div className="text-gray-500">0x140001000: <span className="text-indigo-300">sub rsp, 0x28</span></div>
          <div className="text-gray-500">0x140001004: <span className="text-indigo-300">lea rcx, [rip + 0x1ff5]</span> ; "Helix CrossPlatform Subsystem"</div>
          <div className="text-gray-500">0x14000100b: <span className="text-emerald-300">call USER32.MessageBoxW</span></div>
          <div className="text-gray-500">0x140001010: <span className="text-indigo-300">xor eax, eax</span></div>
          <div className="text-gray-500">0x140001012: <span className="text-indigo-300">add rsp, 0x28</span></div>
          <div className="text-gray-500">0x140001016: <span className="text-indigo-300">ret</span></div>
        </div>
      </div>
    </div>
  );
};
