import React, { useState, useEffect } from 'react';
import { AndroidBridge, InstalledApk } from '../../kernel/AndroidBridge';
import { Toast } from '../../kernel/Toast';
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
  Sparkles,
  Minus,
  X,
  Download,
  Terminal,
  Gamepad2,
  Tv,
  Globe,
  RefreshCw,
  Search,
  Volume2,
  VolumeX
} from 'lucide-react';

interface ApkRunnerAppProps {
  notify?: (msg: string) => void;
}

export const ApkRunnerApp: React.FC<ApkRunnerAppProps> = ({ notify }) => {
  const [apks, setApks] = useState<InstalledApk[]>(AndroidBridge.getInstalledApks());
  const [activeApk, setActiveApk] = useState<InstalledApk | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [termuxInput, setTermuxInput] = useState('');
  const [termuxLogs, setTermuxLogs] = useState<string[]>([
    '$ pkg update -y',
    'Hit:1 https://packages.termux.dev/apt/termux-main stable InRelease',
    'All packages are up to date.',
    '$ helix-art-bridge --status',
    '[OK] Wayland compositor connection established on /tmp/wayland-0'
  ]);
  const [isPlayingMedia, setIsPlayingMedia] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [gameScore, setGameScore] = useState(1280);
  const [browserUrl, setBrowserUrl] = useState('https://helix.os/mobile');

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
    setIsFullScreen(true);
  };

  const handleStop = () => {
    if (activeApk) {
      AndroidBridge.stopApk(activeApk.id);
      setActiveApk(null);
      setIsFullScreen(false);
    }
  };

  const handleDownloadAndInstall = async (appId: string) => {
    await AndroidBridge.downloadAndInstallApp(appId);
  };

  const handleTermuxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termuxInput.trim()) return;
    const cmd = termuxInput.trim();
    setTermuxLogs(prev => [...prev, `$ ${cmd}`, `Executed: ${cmd} (ART PID ${Math.floor(Math.random() * 8000) + 1000})`]);
    setTermuxInput('');
  };

  const filteredApks = selectedCategory === 'All' 
    ? apks 
    : apks.filter(a => a.category === selectedCategory);

  if (activeApk && isFullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#07090f] flex flex-col text-white font-sans animate-fade-in">
        {/* Top Window Control Bar (3 Buttons: Minimize, Maximize/Restore, Close) */}
        <div className="h-10 bg-[#121622] border-b border-white/10 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{activeApk.iconSymbol}</span>
            <span className="font-bold text-xs text-white">{activeApk.appName}</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono">
              Android ART (Wayland Fullscreen)
            </span>
          </div>

          {/* 3 Top Window Control Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setIsFullScreen(false);
                Toast.show('Exited Android Fullscreen Mode', '📱');
              }}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition cursor-pointer"
              title="Minimize / Exit Fullscreen"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIsFullScreen(!isFullScreen);
                Toast.show('Toggled Android Display Size', '🖥️');
              }}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition cursor-pointer"
              title="Toggle Window Size"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                handleStop();
                Toast.show(`Closed ${activeApk.appName}`, '🛑');
              }}
              className="w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 flex items-center justify-center transition cursor-pointer"
              title="Close Application"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Immersive Android App View (Nothing but the app and top controls) */}
        <div className="flex-1 bg-[#0b0e14] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
          <div className="w-full max-w-sm sm:max-w-md h-full max-h-[88vh] bg-[#0f121d] rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between p-4 font-mono text-xs overflow-hidden">
            {/* App Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{activeApk.iconSymbol}</span>
                <div>
                  <span className="font-bold text-white text-xs block">{activeApk.appName}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">ART RUNTIME ACTIVE (API {activeApk.minSdkVersion}+)</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                60 FPS Wayland
              </span>
            </div>

            {/* Interactive App Canvas depending on App */}
            <div className="flex-1 overflow-y-auto my-3 p-3 bg-black/60 rounded-xl border border-white/10 text-xs text-gray-300 space-y-3">
              {activeApk.packageName === 'com.termux' ? (
                <div className="h-full flex flex-col justify-between space-y-2 font-mono text-[11px]">
                  <div className="space-y-1 overflow-y-auto flex-1">
                    {termuxLogs.map((log, i) => (
                      <div key={i} className={log.startsWith('$') ? 'text-emerald-400 font-bold' : 'text-gray-300'}>
                        {log}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleTermuxSubmit} className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <span className="text-emerald-400 font-bold">$</span>
                    <input
                      type="text"
                      value={termuxInput}
                      onChange={(e) => setTermuxInput(e.target.value)}
                      placeholder="type command (e.g. ls, apt, neofetch)..."
                      className="flex-1 bg-transparent border-none text-white focus:outline-none text-xs"
                    />
                    <button type="submit" className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer">
                      Run
                    </button>
                  </form>
                </div>
              ) : activeApk.packageName === 'org.videolan.vlc' ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
                  <Tv className="w-12 h-12 text-orange-400 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-white text-sm">VLC Media Stream</h4>
                    <p className="text-[11px] text-gray-400">Helix Audio Engine Direct ALSA/Pulse Bridge</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsPlayingMedia(!isPlayingMedia)}
                      className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg cursor-pointer"
                    >
                      {isPlayingMedia ? 'Pause' : 'Play'}
                    </button>
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
                    </button>
                  </div>
                </div>
              ) : activeApk.packageName === 'com.retroarch' || activeApk.packageName === 'net.minetest.minetest' ? (
                <div className="h-full flex flex-col items-center justify-between text-center space-y-3">
                  <div className="flex items-center justify-between w-full px-2">
                    <span className="text-cyan-400 font-bold">OpenGL ES 3.2</span>
                    <span className="text-yellow-400 font-bold">SCORE: {gameScore}</span>
                  </div>
                  <div className="p-6 bg-gradient-to-b from-purple-900/40 to-blue-900/40 rounded-xl border border-white/10 w-full flex flex-col items-center justify-center space-y-3">
                    <Gamepad2 className="w-12 h-12 text-purple-300 animate-bounce" />
                    <button
                      onClick={() => setGameScore(s => s + 50)}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-lg"
                    >
                      Action / Jump (+50 pts)
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400">Direct Touch & Gamepad Controller input active.</p>
                </div>
              ) : (
                <div className="h-full flex flex-col space-y-3">
                  <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/10">
                    <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <input
                      type="text"
                      value={browserUrl}
                      onChange={(e) => setBrowserUrl(e.target.value)}
                      className="flex-1 bg-transparent text-white text-[11px] focus:outline-none"
                    />
                    <button onClick={() => Toast.show(`Loaded ${browserUrl}`, '🌐')} className="p-1 hover:bg-white/10 rounded cursor-pointer">
                      <RefreshCw className="w-3 h-3 text-gray-300" />
                    </button>
                  </div>
                  <div className="flex-1 p-3 bg-[#121622] rounded-lg text-xs space-y-2 text-gray-300">
                    <p className="text-[#6ee7b7] font-bold">Kiwi Chromium Engine v116</p>
                    <p>Extensions & Adblock: Enabled</p>
                    <p>Rendering pipeline: GPU Hardware Accelerated</p>
                  </div>
                </div>
              )}
            </div>

            {/* Android Navigation Bar */}
            <div className="flex items-center justify-around py-2.5 border-t border-white/10 text-gray-400 shrink-0">
              <button onClick={() => Toast.show('Android Back Navigation', '◀️')} className="p-1 hover:text-white cursor-pointer">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setIsFullScreen(false)} className="p-1 hover:text-white cursor-pointer">
                <Home className="w-5 h-5" />
              </button>
              <button onClick={() => Toast.show('Android Recent Apps Overview', '📱')} className="p-1 hover:text-white cursor-pointer">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            Run Android APKs and real open-source apps & games in resizable or full-screen mobile frames.
          </p>
        </div>
        <label className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto">
          <Upload className="w-4 h-4" />
          <span>Install .APK File</span>
          <input type="file" accept=".apk" onChange={handleInstallFile} className="hidden" />
        </label>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Games', 'Tools', 'Media', 'Browser'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* APK Package Library */}
        <div className="lg:col-span-2 space-y-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block font-mono">
            Installed Packages ({filteredApks.length})
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredApks.map((apk) => (
              <div
                key={apk.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                  activeApk?.id === apk.id
                    ? 'bg-purple-950/30 border-purple-500/50 shadow-lg'
                    : 'bg-[#121622] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-2">
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

                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{apk.description}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="text-[10px] text-gray-400 font-mono flex items-center justify-between">
                    <span>Size: {(apk.apkSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                    <span className="text-cyan-300 font-bold">{apk.category}</span>
                  </div>

                  {apk.status === 'downloading' ? (
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 transition-all duration-200" style={{ width: `${apk.downloadProgress || 0}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-purple-300 block text-right">Downloading: {apk.downloadProgress}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadAndInstall(apk.id)}
                        className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                        title="Re-download or update APK"
                      >
                        <Download className="w-3 h-3" />
                      </button>

                      {apk.status === 'running' ? (
                        <button
                          onClick={handleStop}
                          className="flex-1 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span>Stop Runtime</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLaunch(apk)}
                          className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-purple-600/20"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Launch Fullscreen</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile View Preview */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-xs bg-black rounded-[36px] p-3 border-4 border-gray-800 shadow-2xl space-y-3 relative overflow-hidden">
            {/* Camera Notch */}
            <div className="w-24 h-4 bg-gray-900 rounded-b-xl mx-auto flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-800" />
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-3 text-[10px] font-mono text-gray-400 pt-1">
              <span>10:42 AM</span>
              <div className="flex items-center gap-2">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <Battery className="w-3 h-3 text-cyan-400" />
              </div>
            </div>

            {/* Display Canvas */}
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
                    <p>Touch Events: Active</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 text-gray-500">
                  <Smartphone className="w-8 h-8 text-gray-600" />
                  <p className="text-xs">Select an Android package from the library to launch the ART runtime environment.</p>
                </div>
              )}

              {/* Bottom Navigation */}
              <div className="flex items-center justify-around py-2 border-t border-white/10 text-gray-400">
                <button onClick={() => Toast.show('Android Back', '◀️')} className="p-1 hover:text-white cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setActiveApk(null)} className="p-1 hover:text-white cursor-pointer">
                  <Home className="w-4 h-4" />
                </button>
                <button onClick={() => Toast.show('Android Recents', '📱')} className="p-1 hover:text-white cursor-pointer">
                  <Menu className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
