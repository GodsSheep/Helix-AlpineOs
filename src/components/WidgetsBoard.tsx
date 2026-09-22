import React, { useState, useEffect } from 'react';
import { Kernel } from '../kernel';
import { SoundManager } from '../kernel/SoundManager';
import { 
  CloudSun, 
  TrendingUp, 
  Calendar, 
  Cpu, 
  StickyNote, 
  X, 
  RefreshCw, 
  Sparkles,
  Zap,
  Globe,
  CheckCircle2,
  Terminal,
  ShoppingBag
} from 'lucide-react';

interface WidgetsBoardProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp?: (appId: string) => void;
}

export const WidgetsBoard: React.FC<WidgetsBoardProps> = ({ isOpen, onClose, onOpenApp }) => {
  const [noteText, setNoteText] = useState<string>(() => {
    try {
      return localStorage.getItem('helix_widgets_note') || 'Welcome to Windows 11-style Widgets Board!\n• Drag windows to screen edges to snap\n• Test Node.js WebContainers\n• Run JSLinux multi-arch VMs';
    } catch {
      return '';
    }
  });

  const [cpuUsage, setCpuUsage] = useState<number>(14);
  const [ramUsage, setRamUsage] = useState<number>(38);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(10 + Math.random() * 18));
      setRamUsage(Math.floor(35 + Math.random() * 8));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleNoteChange = (text: string) => {
    setNoteText(text);
    try {
      localStorage.setItem('helix_widgets_note', text);
      Kernel.vfs.write('/mnt/helix/sticky_notes.txt', text);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-9 left-2 bottom-16 w-80 sm:w-96 z-40 bg-[#0d121c]/90 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-gray-200 select-none animate-scale-in">
      {/* Top Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500/30 to-indigo-500/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              Helix Widgets
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                Win11 Mica
              </span>
            </h3>
            <p className="text-[10px] text-gray-400">Real-time Glanceable Dashboard</p>
          </div>
        </div>
        <button
          onClick={() => {
            SoundManager.play('close');
            onClose();
          }}
          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Widgets Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {/* Weather Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-950/40 via-sky-950/20 to-black/40 border border-blue-500/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudSun className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-white">San Francisco, CA</div>
                <div className="text-[10px] text-gray-400">Partly Cloudy • AQI 24 (Good)</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-white font-mono">68°F</div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 pt-2 border-t border-white/5">
            <span>Humidity: 54%</span>
            <span>Wind: 8 mph WNW</span>
            <span>UV Index: 3</span>
          </div>
        </div>

        {/* System Vitals & Performance */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-gray-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Hardware Telemetry
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">OPTIMIZED</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-400">CPU Load (WASM/V8):</span>
                <span className="text-white font-bold">{cpuUsage}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${cpuUsage}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-400">VFS Heap Allocation:</span>
                <span className="text-white font-bold">{ramUsage}% (128 MB)</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${ramUsage}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Crypto & Market Ticker */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold font-mono text-gray-300">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              Markets & Crypto
            </span>
            <span className="text-[10px] text-emerald-400">+3.4% 24h</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="text-[10px] text-gray-400">BTC / USD</div>
              <div className="text-white font-bold">$68,420</div>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="text-[10px] text-gray-400">ETH / USD</div>
              <div className="text-white font-bold">$3,840</div>
            </div>
          </div>
        </div>

        {/* Sticky Notes Widget */}
        <div className="p-3.5 rounded-2xl bg-[#131926] border border-amber-500/30 space-y-2 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5" />
              Quick Sticky Notes
            </span>
            <span className="text-[10px] font-mono text-gray-500">Auto-saved to VFS</span>
          </div>
          <textarea
            value={noteText}
            onChange={(e) => handleNoteChange(e.target.value)}
            rows={4}
            placeholder="Type quick thoughts, snippets, or tasks..."
            className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-amber-100 font-sans focus:outline-none focus:border-amber-400/50 resize-none leading-relaxed"
          />
        </div>

        {/* Quick Launchers */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => {
              Kernel.wm.launch('node-webcontainer');
              onClose();
            }}
            className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition flex items-center gap-2 justify-center cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>WebContainers</span>
          </button>
          <button
            onClick={() => {
              Kernel.wm.launch('jslinux-hypervisor');
              onClose();
            }}
            className="p-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition flex items-center gap-2 justify-center cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>JSLinux VM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
