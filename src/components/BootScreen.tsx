import React, { useState, useEffect, useRef } from 'react';
import { SoundManager } from '../kernel/SoundManager';
import { FastForward } from 'lucide-react';

interface BootScreenProps {
  onBootComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onBootComplete }) => {
  const [logs, setLogs] = useState<Array<{ text: string; ok?: boolean }>>([]);
  const [progress, setProgress] = useState(15);
  const [isDone, setIsDone] = useState(false);
  const hasCompletedRef = useRef(false);

  const completeBoot = () => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setIsDone(true);
    setTimeout(() => {
      onBootComplete();
    }, 150);
  };

  useEffect(() => {
    // If in Safe Mode, skip boot screen instantly
    if (typeof localStorage !== 'undefined' && localStorage.getItem('helix_safe_mode') === 'true') {
      completeBoot();
      return;
    }

    // Reset state on effect start to ensure fresh boot sequence
    setLogs([]);
    setProgress(15);
    setIsDone(false);

    const steps = [
      { text: 'Mounting Virtual Filesystem (IndexedDB)', progress: 35, delay: 150 },
      { text: 'Registering Service Worker (Offline PWA Ready)', progress: 60, delay: 350 },
      { text: 'Configuring Host9P Communication Layer', progress: 80, delay: 550 },
      { text: 'Initializing HelixOS System Bus (RPC)', progress: 95, delay: 750 },
      { text: 'Desktop Environment Active', progress: 100, delay: 950 },
    ];

    const timers: (NodeJS.Timeout | number)[] = [];

    steps.forEach(({ text, progress: prog, delay }) => {
      const t = setTimeout(() => {
        setLogs((prev) => {
          if (prev.some(p => p.text === text)) return prev;
          return [...prev, { text, ok: true }];
        });
        setProgress(prog);
        if (prog === 100) {
          try { SoundManager.play('boot'); } catch {}
        }
      }, delay);
      timers.push(t);
    });

    const completionTimer = setTimeout(() => {
      completeBoot();
    }, 1200);
    timers.push(completionTimer);

    // Fail-safe maximum timeout (guarantees boot screen cannot hang)
    const failsafeTimer = setTimeout(() => {
      completeBoot();
    }, 1800);
    timers.push(failsafeTimer);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        completeBoot();
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      timers.forEach(t => clearTimeout(t as any));
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <div
      onClick={completeBoot}
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-[#07080b] transition-opacity duration-500 cursor-pointer ${
        isDone ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center max-w-sm w-full px-6">
        <div className="text-sm font-bold tracking-[0.45em] text-[#8b93a7] mb-7 select-none">
          HELIX OS
        </div>

        <div className="font-mono text-xs text-[#5b6478] min-h-[7.5rem] w-full space-y-1.5 select-none">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[#8b93a7]">[</span>
              <span className="text-[#6ee7b7] font-semibold">OK</span>
              <span className="text-[#8b93a7]">]</span>
              <span className="text-[#edf1f7]">{log.text}</span>
            </div>
          ))}
        </div>

        {/* Boot Progress Bar */}
        <div className="w-52 h-[2px] bg-white/10 rounded-full overflow-hidden mt-6">
          <div
            className="h-full bg-[#6ee7b7] transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Skip Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            completeBoot();
          }}
          className="mt-6 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-gray-400 hover:text-white transition font-mono"
        >
          <FastForward className="w-3 h-3 text-[#6ee7b7]" />
          <span>Click to Skip Boot</span>
        </button>
      </div>
    </div>
  );
};

