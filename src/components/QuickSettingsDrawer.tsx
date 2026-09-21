import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Battery, 
  BatteryCharging, 
  BatteryMedium, 
  BatteryFull, 
  BatteryLow, 
  Bluetooth, 
  Zap, 
  Eye, 
  Settings as SettingsIcon, 
  ChevronUp, 
  Sliders, 
  Check, 
  Signal,
  Laptop,
  Radio
} from 'lucide-react';
import { Settings, HelixSettings } from '../kernel/Settings';
import { Kernel } from '../kernel';
import { SoundManager } from '../kernel/SoundManager';
import { PWAInstallButton } from './PWAInstallButton';

interface QuickSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const QuickSettingsDrawer: React.FC<QuickSettingsDrawerProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const [settings, setSettings] = useState<HelixSettings>(Settings.get());
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [performanceMode, setPerformanceMode] = useState<'turbo' | 'eco'>('turbo');
  const [nightLight, setNightLight] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = Settings.subscribe((s) => setSettings(s));
    const unsubHw = Settings.subscribeHardware((info) => {
      setBatteryLevel(info.batteryLevel !== null ? info.batteryLevel : 100);
      setIsCharging(info.isCharging);
    });
    return () => {
      unsub();
      unsubHw();
    };
  }, []);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Audio synthesizer feedback for volume slider changes
  const playVolumeTick = (vol: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260 + vol * 3.5, ctx.currentTime);
      gain.gain.setValueAtTime((vol / 100) * 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {}
  };

  const handleVolumeChange = (newVol: number) => {
    Settings.setVolume(newVol);
    playVolumeTick(newVol);
  };

  const handleToggleMute = () => {
    SoundManager.play('toggle');
    Settings.toggleMute();
    if (settings.isMuted) {
      playVolumeTick(settings.volume || 80);
    }
  };

  const handleToggleWifi = () => {
    SoundManager.play('toggle');
    const nextState = !settings.networkInterfaceEnabled;
    Settings.update({ networkInterfaceEnabled: nextState });
    Kernel.state.update({ network: nextState ? 'online' : 'offline' });
  };

  const handleToggleDarkMode = () => {
    SoundManager.play('click');
    Settings.toggleDarkMode();
  };

  // Pointer drag gestures for closing drawer via upward swipe
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartYRef.current = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartYRef.current !== null) {
      const dy = e.clientY - dragStartYRef.current;
      if (dy < -40) {
        onClose();
      }
      dragStartYRef.current = null;
    }
  };

  if (!isOpen) return null;

  const activeVol = settings.isMuted ? 0 : settings.volume ?? 80;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-black/50 backdrop-blur-sm select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Slide-out Drawer Panel */}
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="w-[94vw] max-w-md bg-[#12141c]/95 border border-white/15 rounded-b-3xl shadow-2xl overflow-hidden p-4 space-y-4 backdrop-blur-2xl text-xs text-[#edf1f7] animate-in slide-in-from-top-full duration-200"
      >
        {/* Drawer Header with Title & Host Device Info */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#6ee7b7]" />
            <span className="font-bold text-sm tracking-wide text-white">Quick Settings</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-[#8b93a7]">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              {isCharging ? (
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ) : batteryLevel && batteryLevel <= 20 ? (
                <BatteryLow className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <BatteryFull className="w-3.5 h-3.5 text-[#6ee7b7]" />
              )}
              <span className="font-semibold text-white">{batteryLevel ?? 100}%</span>
              {isCharging && <span className="text-[10px] text-emerald-400 font-sans">Charging</span>}
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
              title="Close drawer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2x2 Primary Toggles Grid: WiFi & Dark Mode */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. WiFi Toggle Card */}
          <button
            onClick={handleToggleWifi}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between h-24 cursor-pointer relative overflow-hidden ${
              settings.networkInterfaceEnabled
                ? 'bg-[#6ee7b7]/15 border-[#6ee7b7]/40 shadow-[0_0_15px_rgba(110,231,183,0.15)] text-white'
                : 'bg-black/30 border-white/10 text-[#8b93a7] hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  settings.networkInterfaceEnabled
                    ? 'bg-[#6ee7b7] text-black shadow-[0_0_10px_#6ee7b7]'
                    : 'bg-white/10 text-gray-400'
                }`}
              >
                {settings.networkInterfaceEnabled ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  settings.networkInterfaceEnabled
                    ? 'bg-[#6ee7b7]/20 text-[#6ee7b7]'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                {settings.networkInterfaceEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
            <div>
              <div className="font-semibold text-xs text-white">Wi-Fi</div>
              <div className="text-[10px] text-[#8b93a7] truncate font-mono">
                {settings.networkInterfaceEnabled ? 'Helix-VirtNet-5G' : 'Disconnected'}
              </div>
            </div>
          </button>

          {/* 2. Dark Mode Toggle Card */}
          <button
            onClick={handleToggleDarkMode}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between h-24 cursor-pointer relative overflow-hidden ${
              settings.darkMode
                ? 'bg-indigo-500/15 border-indigo-400/40 shadow-[0_0_15px_rgba(99,102,241,0.15)] text-white'
                : 'bg-amber-400/20 border-amber-400/50 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  settings.darkMode
                    ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                    : 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                }`}
              >
                {settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10">
                {settings.darkMode ? 'Dark' : 'Light'}
              </span>
            </div>
            <div>
              <div className="font-semibold text-xs text-white">Theme Mode</div>
              <div className="text-[10px] text-[#8b93a7] truncate">
                {settings.darkMode ? 'Obsidian / Contrast' : 'Alpine Daylight'}
              </div>
            </div>
          </button>
        </div>

        {/* 3. Volume Control Card */}
        <div className="p-3 bg-black/30 border border-white/10 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                  settings.isMuted
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-[#6ee7b7]/20 text-[#6ee7b7] hover:bg-[#6ee7b7]/30'
                }`}
                title={settings.isMuted ? 'Unmute' : 'Mute'}
              >
                {settings.isMuted || activeVol === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : activeVol < 50 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <span className="font-semibold text-xs text-white">System Volume</span>
            </div>
            <span className="font-mono text-xs font-semibold text-[#6ee7b7]">
              {settings.isMuted ? 'MUTED' : `${settings.volume ?? 80}%`}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <VolumeX className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <input
              type="range"
              min="0"
              max="100"
              value={activeVol}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="flex-1 accent-[#6ee7b7] h-2 bg-white/10 rounded-lg cursor-pointer appearance-none"
            />
            <Volume2 className="w-3.5 h-3.5 text-[#6ee7b7] shrink-0" />
          </div>
        </div>

        {/* Secondary Quick Toggles: Bluetooth, Performance, Eye Shield */}
        <div className="grid grid-cols-3 gap-2 text-center font-medium">
          <button
            onClick={() => setBluetoothEnabled((prev) => !prev)}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
              bluetoothEnabled
                ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
                : 'bg-black/20 border-white/5 text-gray-500'
            }`}
          >
            <Bluetooth className="w-4 h-4" />
            <span className="text-[10px]">VirtIO BT</span>
          </button>

          <button
            onClick={() => setPerformanceMode((prev) => (prev === 'turbo' ? 'eco' : 'turbo'))}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
              performanceMode === 'turbo'
                ? 'bg-amber-400/15 border-amber-400/40 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="text-[10px] capitalize">{performanceMode}</span>
          </button>

          <button
            onClick={() => setNightLight((prev) => !prev)}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
              nightLight
                ? 'bg-orange-500/15 border-orange-400/40 text-orange-300'
                : 'bg-black/20 border-white/5 text-gray-500'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="text-[10px]">Eye Shield</span>
          </button>
        </div>

        {/* Drawer Footer Actions */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="text-[#6ee7b7] hover:text-[#5cd4a5] font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => {
                onClose();
                Kernel.wm.launch('autodetect');
              }}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Auto-Detect</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton compact={true} />
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-gray-300 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

        {/* Dismiss Drag Handle Bar */}
        <div className="flex justify-center pt-1">
          <div className="w-12 h-1 rounded-full bg-white/20 hover:bg-white/40 transition cursor-pointer" onClick={onClose} />
        </div>
      </div>
    </div>
  );
};
