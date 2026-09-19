import React, { useState, useEffect, useRef } from 'react';
import { SoundManager } from '../kernel/SoundManager';

interface BootScreenProps {
  onBootComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onBootComplete }) => {
  const [logs, setLogs] = useState<Array<{ text: string; ok?: boolean }>>([]);
  const [progress, setProgress] = useState(10);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Reset state on effect start to ensure fresh boot sequence
    setLogs([]);
    setProgress(10);
    setIsDone(false);

    const steps = [
      { text: 'Mounting Virtual Filesystem (IndexedDB)', progress: 35, delay: 200 },
      { text: 'Registering Service Worker (Offline PWA Ready)', progress: 60, delay: 450 },
      { text: 'Configuring Host9P Communication Layer', progress: 80, delay: 700 },
      { text: 'Initializing HelixOS System Bus (RPC)', progress: 95, delay: 950 },
      { text: 'Desktop Environment Active', progress: 100, delay: 1200 },
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
          SoundManager.play('boot');
        }
      }, delay);
      timers.push(t);
    });

    const completionTimer = setTimeout(() => {
      setIsDone(true);
      const doneT = setTimeout(() => {
        onBootComplete();
      }, 500);
      timers.push(doneT);
    }, 1500);
    timers.push(completionTimer);

    return () => {
      timers.forEach(t => clearTimeout(t as any));
    };
  }, [onBootComplete]);

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-[#07080b] transition-opacity duration-700 ${
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
            className="h-full bg-[#6ee7b7] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
