import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, Check, X, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  compact?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false, className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If already installed and running standalone, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) setIsSuccess(true);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 rounded-lg font-medium transition cursor-pointer select-none active:scale-95 ${
          compact
            ? 'px-2 py-1 text-[11px] bg-[#6ee7b7]/15 hover:bg-[#6ee7b7]/25 text-[#6ee7b7] border border-[#6ee7b7]/30'
            : 'px-3 py-1.5 text-xs bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/30'
        } ${className}`}
        title="Install Helix OS to your Home Screen / Desktop"
      >
        {isSuccess ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-300" />
            <span>Installed</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 text-[#6ee7b7]" />
            <span>{isIOS ? 'Add to Home' : 'Install PWA'}</span>
          </>
        )}
      </button>

      {/* iOS & Mobile Install Guide Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#12151e] border border-white/15 p-5 shadow-2xl text-white relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#10b981] to-[#06b6d4] flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Install Helix OS</h3>
                <p className="text-[11px] text-[#8b93a7]">Native full-screen iPhone & Desktop mode</p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl p-3.5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-gray-300">
                  Tap the <strong className="text-white inline-flex items-center gap-1 font-semibold"><Share className="w-3.5 h-3.5 text-blue-400 inline" /> Share</strong> button in your browser toolbar (bottom on iPhone Safari).
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-gray-300">
                  Scroll down the share menu and select <strong className="text-white inline-flex items-center gap-1 font-semibold"><PlusSquare className="w-3.5 h-3.5 text-[#6ee7b7] inline" /> Add to Home Screen</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-gray-300">
                  Tap <strong className="text-white font-semibold">Add</strong> in the top right to launch Helix OS as a standalone native app!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
