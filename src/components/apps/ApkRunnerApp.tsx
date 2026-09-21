import React, { useState, useEffect } from 'react';
import { AndroidBridge, InstalledApk } from '../../kernel/AndroidBridge';
import { 
  Smartphone, 
  Upload, 
  Play, 
  Square, 
  RotateCcw, 
  ShieldAlert, 
  Layers, 
  Cpu, 
  Wifi, 
  Battery, 
  ChevronLeft, 
  Home, 
  Menu,
  Sparkles
} from 'lucide-react';

interface ApkRunnerAppProps {
  notify?: (msg: string) => void;
}

export const ApkRunnerApp: React.FC<ApkRunnerAppProps> = ({ notify }) => {
  const [apks, setApks] = useState<InstalledApk[]>(AndroidBridge.getInstalledApks());
  const [activeApk, setActiveApk] = useState<InstalledApk | null>(null);

  useEffect(() => {
    const unsub = AndroidBridge.subscribe((updated) => {
      setApks(updated);
      if (activeApk) {
        const match = updated.find((a) => a.id === activeApk.id);
        if (match) setActiveApk(match);
      }
    });
    return unsub;
  }, [activeApk]);

  const handleInstallFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const installed = await AndroidBridge.installApkFile(file);
      if (notify) notify(`Installed ${installed.appName}`);
    }
  };

  const handleLaunch = (apk: InstalledApk) => {
    AndroidBridge.launchApk(apk.id);
    setActiveApk(apk);
  };

  const handleStop = () => {
    if (activeApk) {
      AndroidBridge.stopApk(activeApk.id);
      setActiveApk(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0e14] text-gray-200 animate-fade-in p-4 overflow-y-auto space-y-5">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-indigo-950/30 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-400" />
            Android APK Compatibility Layer (Wayland/WASM)
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Run Android APKs alongside Linux binaries and Wine 9.0 Windows apps in resizable desktop windows.
          </p>
        </div>
        <label className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto">
          <Upload className="w-4 h-4" />
          <span>Install .APK File</span>
          <input type="file" accept=".apk" onChange={handleInstallFile} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* APK Package Library */}
        <div className="lg:col-span-2 space-y-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block font-mono">
            Installed Android Packages ({apks.length})
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {apks.map((apk) => (
              <div
                key={apk.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  activeApk?.id === apk.id
                    ? 'bg-purple-950/30 border-purple-500/50 shadow-lg'
                    : 'bg-[#121622] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{apk.iconSymbol}</span>
                    <div>
                      <span className="font-bold text-white text-xs block">{apk.appName}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{apk.packageName}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    v{apk.versionName}
                  </span>
                </div>

                <div className="text-[10px] text-gray-400 font-mono flex items-center justify-between pt-2 border-t border-white/5">
                  <span>Size: {(apk.apkSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                  <span>Min SDK: {apk.minSdkVersion}</span>
                </div>

                <div className="flex items-center gap-2">
                  {apk.status === 'running' ? (
                    <button
                      onClick={handleStop}
                      className="w-full py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Stop Runtime</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLaunch(apk)}
                      className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Launch in Wayland</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Android Frame Screen Simulator */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-xs bg-black rounded-[36px] p-3 border-4 border-gray-800 shadow-2xl space-y-3 relative overflow-hidden">
            {/* Camera Notch */}
            <div className="w-24 h-4 bg-gray-900 rounded-b-xl mx-auto flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-800" />
            </div>

            {/* Android Status Bar */}
            <div className="flex items-center justify-between px-3 text-[10px] font-mono text-gray-400 pt-1">
              <span>10:42 AM</span>
              <div className="flex items-center gap-2">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <Battery className="w-3 h-3 text-cyan-400" />
              </div>
            </div>

            {/* Android Display Screen */}
            <div className="h-96 rounded-2xl bg-[#0f121d] border border-white/10 p-3 flex flex-col justify-between font-mono text-xs">
              {activeApk ? (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <span className="text-xl">{activeApk.iconSymbol}</span>
                    <div>
                      <span className="font-bold text-white text-xs block">{activeApk.appName}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">ART WASM RUNNING</span>
                    </div>
                  </div>
                  <div className="p-3 bg-black/50 rounded-xl border border-white/5 space-y-2 text-[11px] text-gray-300">
                    <p>[Dalvik/ART WASM] Executing DEX bytecode via Wayland compositor bridge.</p>
                    <p>Screen Resolution: 1080x2400 (DPI 420)</p>
                    <p>Touch Events: Mapped to Mouse/Pointer</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 text-gray-500">
                  <Smartphone className="w-8 h-8 text-gray-600" />
                  <p className="text-xs">Select an Android package from the library to launch the ART runtime environment.</p>
                </div>
              )}

              {/* Android Bottom Navigation Bar */}
              <div className="flex items-center justify-around py-2 border-t border-white/10 text-gray-400">
                <ChevronLeft className="w-4 h-4 hover:text-white cursor-pointer" />
                <Home className="w-4 h-4 hover:text-white cursor-pointer" onClick={() => setActiveApk(null)} />
                <Menu className="w-4 h-4 hover:text-white cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
