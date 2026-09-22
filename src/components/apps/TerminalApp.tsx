import React, { useState, useRef, useEffect } from 'react';
import { Kernel } from '../../kernel';
import { SoundManager } from '../../kernel/SoundManager';
import { RealHostTerminalClient } from '../../kernel/RealHostTerminal';
import { HostKernelBridge } from '../../kernel/HostKernelBridge';
import { TerminalThemeEngine, TerminalTheme, TERMINAL_THEMES } from '../../kernel/TerminalThemes';
import { Toast } from '../../kernel/Toast';
import { 
  Terminal, 
  Trash2, 
  Copy, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  Sparkles, 
  Palette, 
  Play, 
  Loader2, 
  X,
  CheckCircle2,
  Cpu,
  Shield
} from 'lucide-react';

interface HistoryItem {
  id: string;
  type: 'in' | 'out' | 'err' | 'system';
  text: string;
}

export const TerminalApp: React.FC = () => {
  const [input, setInput] = useState('');
  const [currentUser, setCurrentUser] = useState<string>(Kernel.vm.getCurrentUser());
  const [isRoot, setIsRoot] = useState<boolean>(Kernel.vm.isRoot());
  const [hostname, setHostname] = useState<string>(Kernel.vm.getHostname());
  const [osMeta, setOsMeta] = useState(Kernel.vm.getOsMetadata());
  const [cwd, setCwd] = useState<string>(Kernel.vm.getCwd() || '/mnt/helix');
  const [fontSize, setFontSize] = useState<number>(12);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isRealConnected, setIsRealConnected] = useState(true);
  const [activeChroot, setActiveChroot] = useState(Kernel.vm.getActiveChroot());
  const [theme, setTheme] = useState<TerminalTheme>(TerminalThemeEngine.getActiveTheme());
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    return [
      {
        id: 'init-1',
        type: 'system',
        text: `Helix OS Emulated Linux Terminal (Real OS Host Process Stream)\nReal-time POSIX execution enabled. Type any Linux command, 'help', 'sudo su', or 'theme <nord|gruvbox|dracula>'.\n`,
      },
    ];
  });
  const [cmdHistory, setCmdHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('helix_term_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubTheme = TerminalThemeEngine.subscribe((t) => {
      setTheme(t);
    });
    return () => unsubTheme();
  }, []);

  const getPromptSymbol = (currentDir: string) => {
    const home = isRoot ? '/root' : '/mnt/helix';
    if (currentDir === home || currentDir === '/mnt/helix') return '~';
    return currentDir;
  };

  const getFullPrompt = (currentDir: string) => {
    const symbol = isRoot ? '#' : '$';
    return `${currentUser}@${hostname}:${getPromptSymbol(currentDir)}${symbol}`;
  };

  useEffect(() => {
    setCwd(Kernel.vm.getCwd());
    setHostname(Kernel.vm.getHostname());
    setOsMeta(Kernel.vm.getOsMetadata());

    const unsubUser = Kernel.vm.onUserChange((user, root) => {
      setCurrentUser(user);
      setIsRoot(root);
      setCwd(Kernel.vm.getCwd());
    });

    const unsubOs = Kernel.vm.onOsChange((_id, meta) => {
      setOsMeta(meta);
      setHostname(Kernel.vm.getHostname());
      setCwd(Kernel.vm.getCwd());
    });

    const unsubChroot = Kernel.vm.onChrootChange((jail: any) => {
      setActiveChroot(jail);
      setCwd(Kernel.vm.getCwd());
      setHostname(Kernel.vm.getHostname());
      setCurrentUser(Kernel.vm.getCurrentUser());
      setIsRoot(Kernel.vm.isRoot());
    });

    RealHostTerminalClient.checkBackend().then((ok) => {
      setIsRealConnected(ok);
    });

    return () => {
      unsubUser();
      unsubOs();
      unsubChroot();
    };
  }, [isRoot]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [history, isRunning]);

  useEffect(() => {
    const unsub = Kernel.vm.onTerminalData((data) => {
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.type === 'out') {
          return [
            ...prev.slice(0, -1),
            { ...last, text: last.text + data },
          ];
        }
        return [
          ...prev,
          { id: Math.random().toString(), type: 'out', text: data },
        ];
      });
      setCwd(Kernel.vm.getCwd());
    });
    return () => unsub();
  }, []);

  // Click outside to close theme selector
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    if (isThemeMenuOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isThemeMenuOpen]);

    const handleRunCommand = async (commandToRun: string) => {
    const command = commandToRun.trim();
    if (!command || isRunning) return;

    SoundManager.play('key');
    const promptStr = getFullPrompt(cwd);
    
    setCmdHistory((prev) => {
      const updated = [...prev.slice(-49), command];
      try {
        localStorage.setItem('helix_term_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setHistory((prev) => [
      ...prev,
      { id: Math.random().toString(), type: 'in', text: `${promptStr} ${command}` },
    ]);

    if (command.toLowerCase() === 'clear' || command.toLowerCase() === 'cls') {
      SoundManager.play('click');
      setHistory([]);
      return;
    }

    // Built-in theme command handler
    if (command.toLowerCase().startsWith('theme') || command.toLowerCase().startsWith('colorscheme')) {
      const parts = command.split(/\s+/);
      if (parts.length === 1 || parts[1] === 'list') {
        const listText = [
          'Available Terminal Themes:',
          ...TerminalThemeEngine.getAllThemes().map(
            (t) => `  * ${t.id.padEnd(12)} - ${t.name} (${t.description})`
          ),
          `\nActive Theme: ${theme.name} (${theme.id})`,
          'Usage: theme <name>  (e.g., theme nord, theme dracula, theme gruvbox)',
        ].join('\n');
        setHistory((prev) => [
          ...prev,
          { id: Math.random().toString(), type: 'out', text: listText + '\n' },
        ]);
        return;
      }

      const targetId = parts[1].toLowerCase();
      const success = TerminalThemeEngine.setTheme(targetId);
      if (success) {
        SoundManager.play('click');
        const active = TerminalThemeEngine.getActiveTheme();
        Toast.show(`Terminal theme switched to ${active.name}`, '🎨');
        setHistory((prev) => [
          ...prev,
          { id: Math.random().toString(), type: 'system', text: `Terminal theme successfully changed to: ${active.name}\n` },
        ]);
      } else {
        SoundManager.play('error');
        setHistory((prev) => [
          ...prev,
          { id: Math.random().toString(), type: 'err', text: `Unknown theme: '${targetId}'. Type 'theme list' to view all available themes.\n` },
        ]);
      }
      return;
    }

    // Upgrade: Map developer commands to Kernel.vm host bridge
    const trimCmd = command.trim();
    let commandToExecute = command; // Redefine for the general case
    if (trimCmd.startsWith('git ') || trimCmd.startsWith('npm ') || trimCmd.startsWith('node ') || trimCmd.startsWith('pip ')) {
      setHistory((prev) => [
        ...prev,
        { id: Math.random().toString(), type: 'system', text: `Proxying '${trimCmd}' to host execution engine...` },
      ]);
      try {
        const output = await Kernel.vm.executeCommand(trimCmd);
        setHistory((prev) => [
          ...prev,
          { id: Math.random().toString(), type: 'out', text: output || `Command '${trimCmd}' completed.` },
        ]);
        return;
      } catch (err: any) {
        SoundManager.play('error');
        setHistory((prev) => [
          ...prev,
          { id: Math.random().toString(), type: 'err', text: `Execution error: ${err.message}` },
        ]);
        return;
      }
    }

    setIsRunning(true);
    
    try {
      // 1. Sync VFS -> Host Backend (if online)
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        await HostKernelBridge.pushVfsToHost(Kernel.vfs).catch(() => {});
      }

      // 2. Execute command via Kernel.vm microVM execution engine
      const output = await Kernel.vm.executeCommand(commandToExecute);
      if (output) {
        setHistory((prev) => [
          ...prev,
          { id: Math.random().toString(), type: 'out', text: output.endsWith('\n') ? output : output + '\n' },
        ]);
      }
      setCwd(Kernel.vm.getCwd());

      // 3. Sync Host Backend -> VFS (if online)
      const vfsFiles = await Kernel.vfs.list();
      const vfsPaths = vfsFiles.map(f => f.path.replace(/^\//, '')).filter(Boolean);
      if (typeof navigator !== 'undefined' && navigator.onLine && vfsPaths.length > 0) {
        await HostKernelBridge.pullHostToVfs(Kernel.vfs, vfsPaths).catch(() => {});
      }
      
    } catch (err: unknown) {
      SoundManager.play('error');
      setHistory((prev) => [
        ...prev,
        { id: Math.random().toString(), type: 'err', text: `Error: ${(err as Error).message}\n` },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const promptStr = getFullPrompt(cwd);

    // Ctrl+C: Cancel current line
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      setHistory((prev) => [
        ...prev,
        { id: Math.random().toString(), type: 'in', text: `${promptStr} ${input}^C` },
      ]);
      setInput('');
      setHistoryIndex(-1);
      return;
    }

    // Ctrl+L: Clear terminal screen
    if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      setHistory([]);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.split(' ');
      if (parts.length <= 1) {
        const trimmed = parts[0].trim().toLowerCase();
        if (!trimmed) return;
        const commonCmds = [
          'help', 'cd', 'ls', 'cat', 'pwd', 'whoami', 'id', 'su', 'sudo', 'groups', 'users', 'who', 'w',
          'hostname', 'date', 'uptime', 'neofetch', 'htop', 'top', 'free', 'df', 'ps', 
          'apk', 'apt', 'apt-get', 'pacman', 'dnf', 'yum', 'zypper',
          'python3', 'node', 'gcc', 'git', 'clear', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'sh', 'bash', 'zsh',
          'reboot', 'halt', 'tree', 'grep', 'wc', 'head', 'tail', 'find', 'diff', 'curl', 'wget', 'ping',
          'ifconfig', 'ip', 'dmesg', 'rc-status', 'cal', 'cmatrix', 'figlet', 'alias', 'history',
          'theme', 'colorscheme', 'sort', 'uniq', 'cut', 'tr', 'sed', 'awk', 'base64', 'md5sum', 'sha256sum', 'lsblk', 'fdisk',
          'vi', 'vim', 'nano', 'emacs', 'tar', 'gzip', 'bzip2', 'zip', 'unzip', 'ssh', 'scp', 'rsync', 'systemctl', 'journalctl'
        ];
        const match = commonCmds.find(c => c.startsWith(trimmed));
        if (match) {
          setInput(match + ' ');
        }
      } else {
        const lastPart = parts[parts.length - 1].trim();
        const files = await Kernel.vfs.list();
        const fileNames = files.map(f => f.path.replace(/^\//, ''));
        const match = fileNames.find(f => 
          f.toLowerCase().startsWith(lastPart.toLowerCase()) || 
          f.toLowerCase().endsWith('/' + lastPart.toLowerCase())
        );
        if (match) {
          parts[parts.length - 1] = match;
          setInput(parts.join(' ') + ' ');
        }
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(cmdHistory[nextIndex] || '');
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= cmdHistory.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(cmdHistory[nextIndex] || '');
      }
      return;
    }

    if (e.key === 'Enter') {
      const command = input.trim();
      setInput('');
      setHistoryIndex(-1);
      if (!command) {
        setHistory((prev) => [
          ...prev,
          { id: Math.random().toString(), type: 'in', text: `${promptStr} ` },
        ]);
        return;
      }
      await handleRunCommand(command);
    }
  };

  const handleCopyBuffer = () => {
    const text = history.map((h) => h.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContainerClick = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    inputRef.current?.focus();
  };

  const quickCommands = [
    'chroot --help',
    'chroot --list',
    'chroot --status',
    'uname -a',
    'whoami',
    'uptime',
    'df -h',
    'free -m',
    'ps aux',
    'neofetch',
    'theme list',
    'node -v',
    'python3 --version',
  ];

  return (
    <div
      className="h-full flex flex-col font-mono select-text overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: theme.bg, color: theme.outputColor }}
      onClick={handleContainerClick}
    >
      {/* Top Terminal Action Bar */}
      <div
        className="h-9 px-3 border-b flex items-center justify-between gap-2 shrink-0 select-none text-xs transition-colors duration-200 relative"
        style={{ backgroundColor: theme.topBarBg, borderColor: theme.borderColor }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => Kernel.wm.launch('osselector')}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-semibold transition hover:bg-white/10 cursor-pointer"
            style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, borderColor: theme.borderColor }}
            title={`Active OS: ${osMeta.name} ${osMeta.version} - Click to switch OS`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">{osMeta.name}</span>
          </button>

          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-semibold transition-colors"
            style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, borderColor: theme.borderColor }}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>real-sh</span>
            {isRealConnected ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Connected to Real OS Host Process" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" title="Fallback MicroVM active" />
            )}
            {isRoot && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded text-[9px] font-mono font-bold tracking-wider">
                ROOT #
              </span>
            )}
          </div>

          {activeChroot ? (
            <button
              onClick={() => Kernel.wm.launch('chroot')}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/20 text-amber-300 text-[11px] font-bold hover:bg-amber-500/30 transition cursor-pointer"
              title={`Inside Chroot Jail: ${activeChroot.name} (${activeChroot.rootPath}). Click to open Chroot Studio.`}
            >
              <Shield className="w-3 h-3 text-amber-400" />
              <span>JAIL: {activeChroot.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={() => Kernel.wm.launch('chroot')}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/10 text-gray-400 hover:text-amber-300 text-[10px] font-medium transition cursor-pointer"
              title="Open Chroot Sandbox Studio"
            >
              <Shield className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Chroot</span>
            </button>
          )}

          <span className="text-white/20 text-xs hidden sm:inline">|</span>
          <span className="text-[11px] hidden md:inline truncate max-w-[240px] font-mono" style={{ color: theme.systemColor }}>
            <span style={{ color: isRoot ? '#f87171' : theme.promptUser, fontWeight: 'bold' }}>{currentUser}</span>
            <span style={{ color: theme.promptHost }}>@{hostname}:</span>
            <span style={{ color: theme.promptPath }}>{getPromptSymbol(cwd)}</span>
            <span style={{ color: isRoot ? '#f87171' : theme.promptSymbol, fontWeight: 'bold', marginLeft: '2px' }}>
              {isRoot ? '#' : '$'}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isRunning && (
            <div className="flex items-center gap-1 text-[11px] text-amber-400 px-2 py-0.5 bg-amber-400/10 rounded border border-amber-400/20 mr-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>executing...</span>
            </div>
          )}

          {/* Theme Switcher Button */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setIsThemeMenuOpen((prev) => !prev)}
              className="px-2 py-1 rounded hover:bg-white/10 transition flex items-center gap-1.5 text-[11px] cursor-pointer"
              style={{ color: theme.accentColor }}
              title={`Active theme: ${theme.name} (Click to switch)`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-sans font-medium">{theme.name.split(' ')[0]}</span>
            </button>

            {/* Theme Selector Popover */}
            {isThemeMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-72 bg-[#121520] border border-white/15 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                    <Palette className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Terminal Themes</span>
                  </span>
                  <button
                    onClick={() => setIsThemeMenuOpen(false)}
                    className="p-1 text-gray-400 hover:text-white rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1 pr-1 font-sans">
                  {TerminalThemeEngine.getAllThemes().map((t) => {
                    const isActive = t.id === theme.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          TerminalThemeEngine.setTheme(t.id);
                          SoundManager.play('click');
                          Toast.show(`Theme: ${t.name}`, '🎨');
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition cursor-pointer border ${
                          isActive
                            ? 'bg-white/15 border-white/25 text-white shadow-sm'
                            : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Color preview swatch dots */}
                          <div className="flex items-center gap-0.5 shrink-0 p-1 rounded-lg border border-white/10" style={{ backgroundColor: t.bg }}>
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.promptUser }} />
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.promptPath }} />
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.promptSymbol }} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-white truncate flex items-center gap-1">
                              <span>{t.name}</span>
                              {isActive && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-gray-400 truncate">{t.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          <button
            onClick={() => setFontSize((f) => Math.max(10, f - 1))}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
            title="Decrease font size"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono w-5 text-center" style={{ color: theme.systemColor }}>
            {fontSize}
          </span>
          <button
            onClick={() => setFontSize((f) => Math.min(18, f + 1))}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
            title="Increase font size"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          <button
            onClick={handleCopyBuffer}
            className="px-2 py-1 rounded hover:bg-white/10 transition flex items-center gap-1 text-[11px] cursor-pointer"
            style={{ color: theme.outputColor }}
            title="Copy entire terminal buffer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => setHistory([])}
            className="px-2 py-1 rounded hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition flex items-center gap-1 text-[11px] cursor-pointer"
            title="Clear terminal screen (Ctrl+L)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Quick Linux Command Chips Carousel */}
      <div
        className="px-3 py-1.5 border-b flex items-center gap-1.5 overflow-x-auto shrink-0 select-none no-scrollbar transition-colors duration-200"
        style={{ backgroundColor: theme.topBarBg, borderColor: theme.borderColor }}
      >
        <span className="text-[10px] uppercase font-bold shrink-0 mr-1 flex items-center gap-1" style={{ color: theme.systemColor }}>
          <Sparkles className="w-3 h-3" style={{ color: theme.accentColor }} /> Quick:
        </span>
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleRunCommand(cmd)}
            disabled={isRunning}
            className="px-2 py-0.5 rounded text-[11px] transition whitespace-nowrap cursor-pointer flex items-center gap-1 disabled:opacity-50 border hover:opacity-80"
            style={{
              backgroundColor: theme.chipBg,
              color: theme.chipText,
              borderColor: theme.chipBorder,
            }}
          >
            <Play className="w-2.5 h-2.5 opacity-70" />
            <span>{cmd}</span>
          </button>
        ))}
      </div>

      {/* Output Stream */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-1"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.5, backgroundColor: theme.bg }}
      >
        {history.map((item) => (
          <div key={item.id} className="whitespace-pre-wrap leading-relaxed break-all">
            {item.type === 'in' && (
              <span style={{ color: theme.promptUser, fontWeight: 600 }}>{item.text}</span>
            )}
            {item.type === 'out' && (
              <span style={{ color: theme.outputColor }}>{item.text}</span>
            )}
            {item.type === 'err' && (
              <span style={{ color: theme.errorColor, fontWeight: 500 }}>{item.text}</span>
            )}
            {item.type === 'system' && (
              <span style={{ color: theme.systemColor, fontStyle: 'italic' }}>{item.text}</span>
            )}
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-2 text-xs py-1" style={{ color: theme.systemColor }}>
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: theme.accentColor }} />
            <span>Executing command on host OS in real-time...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Prompt Row */}
      <div
        className="border-t py-2 px-3 flex items-center gap-2 shrink-0 font-mono transition-colors duration-200"
        style={{ backgroundColor: theme.inputRowBg, borderColor: theme.borderColor }}
      >
        <span className="whitespace-nowrap select-none flex items-center text-xs">
          {activeChroot && (
            <span className="mr-1.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
              jail:{activeChroot.template}
            </span>
          )}
          <span style={{ color: isRoot ? '#f87171' : theme.promptUser, fontWeight: 'bold' }}>
            {currentUser}@{hostname}
          </span>
          <span style={{ color: theme.promptHost }}>:</span>
          <span style={{ color: theme.promptPath, fontWeight: 500 }}>{getPromptSymbol(cwd)}</span>
          <span style={{ color: isRoot ? '#f87171' : theme.promptSymbol, fontWeight: 'bold', marginLeft: '4px' }}>
            {isRoot ? '#' : '$'}
          </span>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          disabled={isRunning}
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent border-0 outline-none font-mono text-xs focus:ring-0 disabled:opacity-50"
          style={{
            fontSize: `${fontSize}px`,
            color: theme.inputColor,
            caretColor: theme.caretColor,
            touchAction: 'manipulation',
          }}
          placeholder={isRoot ? "root shell active - full privilege escalation (#)..." : "Type a Linux command or 'theme <nord|gruvbox|dracula>'..."}
        />
      </div>
    </div>
  );
};
