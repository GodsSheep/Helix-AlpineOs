import React, { useState, useRef, useEffect } from 'react';
import { Kernel } from '../../kernel';
import { SoundManager } from '../../kernel/SoundManager';
import { Terminal, Trash2, Copy, Check, ZoomIn, ZoomOut, Sparkles, ChevronRight, Play } from 'lucide-react';

interface HistoryItem {
  id: string;
  type: 'in' | 'out' | 'system';
  text: string;
}

export const TerminalApp: React.FC = () => {
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState<string>(Kernel.vm.getCwd() || '/mnt/helix');
  const [fontSize, setFontSize] = useState<number>(12);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: 'init-1',
      type: 'system',
      text: 'Alpine Linux v3.20 (x86_64-pc-linux-musl) - Helix Virtual Host Engine\nType "help" for a list of available Linux commands or "apk info" for packages.\n',
    },
  ]);
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

  const getPromptSymbol = (currentDir: string) => {
    if (currentDir === '/mnt/helix') return '~';
    return currentDir;
  };

  useEffect(() => {
    setCwd(Kernel.vm.getCwd());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

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

  const handleRunCommand = async (commandToRun: string) => {
    const command = commandToRun.trim();
    if (!command) return;

    SoundManager.play('key');
    const activePrompt = `${getPromptSymbol(cwd)}$`;
    
    setCmdHistory((prev) => {
      const updated = [...prev.slice(-49), command];
      try {
        localStorage.setItem('helix_term_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setHistory((prev) => [
      ...prev,
      { id: Math.random().toString(), type: 'in', text: `${activePrompt} ${command}` },
    ]);

    if (command.toLowerCase() === 'clear' || command.toLowerCase() === 'cls') {
      SoundManager.play('click');
      setHistory([]);
      return;
    }

    try {
      const output = await Kernel.vm.executeCommand(command);
      setCwd(Kernel.vm.getCwd());
      if (output) {
        setHistory((prev) => [
          ...prev,
          { id: Math.random().toString(), type: 'out', text: output.endsWith('\n') ? output : output + '\n' },
        ]);
      }
    } catch (err: unknown) {
      SoundManager.play('error');
      setCwd(Kernel.vm.getCwd());
      setHistory((prev) => [
        ...prev,
        { id: Math.random().toString(), type: 'out', text: `Error: ${(err as Error).message}\n` },
      ]);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const activePrompt = `${getPromptSymbol(cwd)}$`;

    // Ctrl+C: Cancel current line
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      setHistory((prev) => [
        ...prev,
        { id: Math.random().toString(), type: 'in', text: `${activePrompt} ${input}^C` },
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
          'help', 'cd', 'ls', 'cat', 'pwd', 'whoami', 'hostname', 'date', 'uptime', 
          'neofetch', 'htop', 'top', 'free', 'df', 'ps', 'apk', 'python3', 'node', 'gcc', 
          'git', 'clear', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'sh', 'bash', 'reboot', 'halt',
          'tree', 'grep', 'wc', 'head', 'tail', 'find', 'diff', 'curl', 'wget', 'ping',
          'ifconfig', 'ip', 'dmesg', 'rc-status', 'cal', 'cmatrix', 'figlet', 'alias', 'history'
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
          { id: Math.random().toString(), type: 'in', text: `${activePrompt} ` },
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
    'neofetch',
    'htop',
    'tree',
    'free -h',
    'df -h',
    'cat /etc/os-release',
    'ip a',
    'apk info',
    'dmesg',
    'uname -a'
  ];

  return (
    <div
      className="h-full flex flex-col bg-[#07080b] font-mono text-[#edf1f7] select-text overflow-hidden"
      onClick={handleContainerClick}
    >
      {/* Top Terminal Action Bar */}
      <div className="h-9 px-3 bg-[#0d0f17] border-b border-white/10 flex items-center justify-between gap-2 shrink-0 select-none text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#6ee7b7]/10 text-[#6ee7b7] border border-[#6ee7b7]/30 text-[11px] font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            <span>ash / busybox</span>
          </div>
          <span className="text-white/20 text-xs hidden sm:inline">|</span>
          <span className="text-[11px] text-[#8b93a7] hidden md:inline truncate max-w-[180px]">
            root@helix-alpine:{getPromptSymbol(cwd)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setFontSize((f) => Math.max(10, f - 1))}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition"
            title="Decrease font size"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-gray-500 font-mono w-5 text-center">{fontSize}</span>
          <button
            onClick={() => setFontSize((f) => Math.min(18, f + 1))}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition"
            title="Increase font size"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          <button
            onClick={handleCopyBuffer}
            className="px-2 py-1 rounded hover:bg-white/10 text-gray-300 hover:text-[#6ee7b7] transition flex items-center gap-1 text-[11px]"
            title="Copy entire terminal buffer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => setHistory([])}
            className="px-2 py-1 rounded hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition flex items-center gap-1 text-[11px]"
            title="Clear terminal screen (Ctrl+L)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Quick Linux Command Chips Carousel */}
      <div className="px-3 py-1.5 bg-[#090b10] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto shrink-0 select-none no-scrollbar">
        <span className="text-[10px] uppercase font-bold text-[#8b93a7] shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#6ee7b7]" /> Quick:
        </span>
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleRunCommand(cmd)}
            className="px-2 py-0.5 bg-white/5 hover:bg-[#6ee7b7]/15 hover:text-[#6ee7b7] border border-white/10 hover:border-[#6ee7b7]/30 rounded text-[11px] text-gray-300 transition whitespace-nowrap cursor-pointer flex items-center gap-1"
          >
            <Play className="w-2.5 h-2.5 opacity-70" />
            <span>{cmd}</span>
          </button>
        ))}
      </div>

      {/* Output Stream */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-1"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
      >
        {history.map((item) => (
          <div key={item.id} className="whitespace-pre-wrap leading-relaxed break-all">
            {item.type === 'in' && (
              <span className="text-[#6ee7b7] font-semibold">{item.text}</span>
            )}
            {item.type === 'out' && (
              <span className="text-[#d8e2dc]">{item.text}</span>
            )}
            {item.type === 'system' && (
              <span className="text-[#8b93a7] italic">{item.text}</span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Prompt Row */}
      <div className="border-t border-white/10 py-1.5 px-3 flex items-center gap-2 bg-[#0a0c12] shrink-0">
        <span className="text-[#6ee7b7] font-bold tracking-tight whitespace-nowrap select-none flex items-center gap-1">
          <span>{getPromptSymbol(cwd)}$</span>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent border-0 text-[#6ee7b7] outline-none font-mono"
          style={{ fontSize: `${fontSize}px`, touchAction: 'manipulation' }}
          placeholder="Type a command (or press Tab for completion)..."
        />
      </div>
    </div>
  );
};
