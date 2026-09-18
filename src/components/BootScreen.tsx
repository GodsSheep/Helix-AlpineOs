import React, { useState, useEffect } from 'react';
import { SoundManager } from '../kernel/SoundManager';

interface BootScreenProps {
  onBootComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onBootComplete }) => {
  const [logs, setLogs] = useState<Array<{ text: string; ok?: boolean }>>([]);
  const [progress, setProgress] = useState(10);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const steps = [
      { text: 'Mounting Virtual Filesystem (IndexedDB)', progress: 35, delay: 200 },
      { text: 'Registering Service Worker (Offline PWA Ready)', progress: 60, delay: 450 },
      { text: 'Configuring Host9P Communication Layer', progress: 80, delay: 700 },
      { text: 'Initializing HelixOS System Bus (RPC)', progress: 95, delay: 950 },
      { text: 'Desktop Environment Active', progress: 100, delay: 1200 },
    ];

    steps.forEach(({ text, progress: prog, delay }) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, { text, ok: true }]);
        setProgress(prog);
        if (prog === 100) {
          SoundManager.play('boot');
        }
      }, delay);
    });

    const completionTimer = setTimeout(() => {
      setIsDone(true);
      setTimeout(onBootComplete, 500);
    }, 1500);

    return () => clearTimeout(completionTimer);
  }, [onBootComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#07080b] transition-opacity duration-700 ${
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
