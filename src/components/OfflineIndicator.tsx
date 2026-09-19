import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff, ShieldCheck } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[9990] bg-[#1a1d2d]/95 backdrop-blur-md border border-amber-500/40 text-amber-300 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-mono animate-bounce">
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span className="font-semibold text-white">Offline Mode Active</span>
      <span className="text-gray-400 text-[11px] hidden sm:inline">• Cached Helix Kernel & VFS Operational</span>
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
    </div>
  );
};
