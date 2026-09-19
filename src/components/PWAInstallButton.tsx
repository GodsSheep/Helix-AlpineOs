import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, Smartphone, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string; compact?: boolean }> = ({
  className = '',
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  // If already running as standalone PWA, don't show prompt
  if (isInstalled) {
    return null;
  }

  // Desktop / Android / Chrome install flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-xl bg-[#6ee7b7] text-black font-bold hover:bg-[#5eead4] transition cursor-pointer shadow-md ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-xs'
        } ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install PWA</span>
      </button>
    );
  }

  // iPhone / iOS Safari install flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40 transition cursor-pointer ${
            compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
          } ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Install for iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-[#121522] border border-cyan-500/40 p-6 shadow-2xl space-y-5 text-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Install Helix OS on iPhone</h3>
                    <p className="text-xs text-gray-400">Offline & Online PWA Native Launch</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-black font-extrabold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-white block">Tap Safari Share Button</span>
                    <span className="text-gray-400 flex items-center gap-1 mt-0.5">
                      In the bottom Safari toolbar, tap <Share2 className="w-3.5 h-3.5 text-cyan-400 inline" /> (Share icon).
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-black font-extrabold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-white block">Select "Add to Home Screen"</span>
                    <span className="text-gray-400">
                      Scroll down the options list and tap <strong>Add to Home Screen</strong>.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-black font-extrabold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-white block">Launch Helix OS Offline</span>
                    <span className="text-gray-400">
                      Open Helix OS from your home screen as a full-screen native iOS app with full offline VFS caching.
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#6ee7b7] text-black font-bold text-xs hover:bg-[#5eead4] transition cursor-pointer shadow-lg shadow-[#6ee7b7]/20 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Got It!</span>
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // General fallback button
  return (
    <button
      onClick={() => setShowIOSGuide(true)}
      className={`flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer ${
        compact ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-xs'
      } ${className}`}
    >
      <Download className="w-3.5 h-3.5" />
      <span>Install PWA</span>
    </button>
  );
};
