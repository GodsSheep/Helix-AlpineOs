import React, { useState, useEffect, useRef } from 'react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { Kernel } from '../../kernel';
import { 
  Cpu, 
  Terminal as TerminalIcon, 
  RotateCcw, 
  Play, 
  Pause, 
  Save, 
  HardDrive, 
  Layers, 
  Activity, 
  Sliders, 
  FileCode, 
  CheckCircle2,
  Zap
} from 'lucide-react';
import { EmulatorRegistry } from '../../kernel/EmulatorRegistry';

export const JSLinuxHypervisorApp: React.FC = () => {
  const architectures = EmulatorRegistry;
  const [selectedArchId, setSelectedArchId] = useState<string>('x86-alpine');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [cycles, setCycles] = useState<number>(458190);
  const [mips, setMips] = useState<number>(18.4);
  const [inputVal, setInputVal] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'console' | 'registers' | 'memory'>('console');

  const selectedArch = architectures.find(a => a.id === selectedArchId)!;

  const [history, setHistory] = useState<string[]>([
    'JSLinux Hypervisor v3.8.0 (Fabrice Bellard WebAssembly Engine)',
    'BIOS Revision 2026.09 (c) 1985-2026 Bellard / Helix Virtualization',
    'RAM: 131072 KB dynamic page allocation ok.',
    'ACPI: RSDP 0x000F6A80 000024 (v02 HELIX)',
    'CPU: 0 Intel(R) Pentium(R) Pro stepping 09',
    'Booting Linux kernel 6.6.14-lts-helix...',
    'Mounting root filesystem (ext4) on /dev/vda1: OK',
    'Starting network interfaces: eth0 (VirtIO-Net, DHCP allocated 192.168.1.100)',
    'Helix JSLinux system initialized. Type "help" or standard shell commands.',
    ''
  ]);

  // Simulated CPU Registers
  const [registers, setRegisters] = useState({
    eax: '0x00000000',
    ebx: '0x080496A0',
    ecx: '0x0000002A',
    edx: '0xBFFFF8C0',
    esi: '0x08048200',
    edi: '0x08049000',
    ebp: '0xBFFFF898',
    esp: '0xBFFFF880',
    eip: '0x0804845C',
    eflags: '0x00000246 (IF, PF, ZF)',
    cr0: '0x80050033 (PG, PE, WP)',
    cr3: '0x00105000'
  });

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setCycles(prev => prev + Math.floor(Math.random() * 12000 + 8000));
        setMips(+(15 + Math.random() * 8).toFixed(2));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleSwitchArch = (archId: string) => {
    setSelectedArchId(archId);
    SoundManager.play('boot');
    const newArch = architectures.find(a => a.id === archId)!;
    setHistory([
        `Booting ${newArch.name} (${newArch.osName})...`,
        `Engine: ${newArch.engine}`,
        'Loading firmware...',
        'Hypervisor initialization successful.',
        ''
    ]);
    Toast.show(`Booted ${newArch.name}`, newArch.icon);
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const cmd = inputVal.trim();
    const cmdLine = `${selectedArch.prompt}${cmd}`;
    const lower = cmd.toLowerCase();

    let output = '';

    if (lower === 'help') {
      output = `Available JSLinux Hypervisor commands:
  uname -a     : Display kernel architecture & release
  cat /proc/cpuinfo : Dump virtual CPU topology
  free -m      : Show RAM allocation
  ls -la       : List files in virtual root
  dmesg        : Show kernel boot log
  clear        : Clear terminal display`;
    } else if (lower === 'clear') {
      setHistory([]);
      setInputVal('');
      return;
    } else {
      output = `jslinux: ${cmd}: command executed in ${selectedArch.engine} hypervisor VM`;
    }

    setHistory(prev => [...prev, cmdLine, output, '']);
    setInputVal('');
  };

  const handleSaveSnapshot = () => {
    SoundManager.play('success');
    Toast.show(`Hypervisor memory snapshot saved`, '💾');
  };

  return (
    <div className="h-full flex flex-col bg-[#070a10] text-gray-200 font-sans select-none overflow-hidden">
      <div className="p-3 bg-[#0d121c] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm shadow">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xs flex items-center gap-2">
              JSLinux Multi-Architecture Hypervisor
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                Fabrice Bellard Core
              </span>
            </h2>
            <p className="text-[11px] text-gray-400">{selectedArch.osName} • {selectedArch.clockSpeed} • {selectedArch.ram}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/10"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Pause CPU' : 'Resume CPU'}</span>
          </button>
          <button
            onClick={handleSaveSnapshot}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Snapshot</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-60 bg-[#0a0e17] border-r border-white/10 p-3 space-y-2 overflow-y-auto shrink-0">
          <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">
            Emulator Library
          </div>

          {architectures.map((arch) => (
            <div
              key={arch.id}
              onClick={() => handleSwitchArch(arch.id)}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                selectedArchId === arch.id
                  ? 'bg-cyan-500/20 border-cyan-500 text-white'
                  : 'bg-black/30 border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{arch.icon}</span>
                <span className="font-bold text-xs">{arch.name}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">{arch.osName}</p>
            </div>
          ))}

          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">
              Real-Time Telemetry
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1.5 text-[11px] font-mono text-gray-300">
              <div className="flex justify-between">
                <span>CPU Cycles:</span>
                <span className="text-cyan-400 font-bold">{cycles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Est. MIPS:</span>
                <span className="text-emerald-400 font-bold">{mips} MIPS</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-emerald-400 font-bold">{isRunning ? 'RUNNING' : 'PAUSED'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-[#05080e]">
          <div className="p-2 bg-[#0b0f19] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('console')}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                  activeTab === 'console' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                TTY Console
              </button>
              <button
                onClick={() => setActiveTab('registers')}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                  activeTab === 'registers' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                CPU Registers
              </button>
            </div>
            <span className="text-[10px] font-mono text-gray-500">Virtual UART 115200 8N1</span>
          </div>

          {activeTab === 'console' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div ref={terminalEndRef} className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1 text-emerald-400 selection:bg-cyan-500/30">
                {history.map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap leading-relaxed">{line}</div>
                ))}
              </div>

              <form onSubmit={handleCommand} className="p-2 bg-black/80 border-t border-white/10 flex items-center gap-2">
                <span className="text-cyan-400 font-mono text-xs font-bold">{selectedArch.prompt}</span>
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Type shell command..."
                  className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none"
                  autoFocus
                />
              </form>
            </div>
          ) : (
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
                  IA-32 General Purpose Registers
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  {Object.entries(registers).map(([k, v]) => (
                    <div key={k} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-0.5">
                      <span className="text-[10px] text-gray-500 uppercase">{k}</span>
                      <span className="text-white font-bold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
