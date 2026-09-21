import React from 'react';
import { HelixSettings, SoundTheme } from '../../../kernel/Settings';
import { SoundManager } from '../../../kernel/SoundManager';
import { 
  Volume2, 
  VolumeX, 
  Radio, 
  Smartphone, 
  Play, 
  Sparkles,
  Bell,
  Trash2,
  Minimize2,
  Maximize2,
  AlertTriangle,
  Terminal,
  Columns2
} from 'lucide-react';

interface AudioSettingsTabProps {
  settings: HelixSettings;
  onUpdate: (partial: Partial<HelixSettings>) => void;
  notify: (msg: string) => void;
}

export const AudioSettingsTab: React.FC<AudioSettingsTabProps> = ({ settings, onUpdate, notify }) => {
  const playPreview = (type: 'click' | 'open' | 'close' | 'minimize' | 'snap' | 'trash' | 'error' | 'success') => {
    SoundManager.play(type);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-blue-950/30 border border-violet-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-violet-400" />
            Sound Engine, Audio Themes & Haptics
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Synthesized Web Audio API sound effects, theme acoustic profiles, and tactile vibration feedback.
          </p>
        </div>
        <button
          onClick={() => {
            const newMute = !settings.isMuted;
            onUpdate({ isMuted: newMute });
            notify(newMute ? 'System audio muted' : 'System audio unmuted');
          }}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
            settings.isMuted
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-violet-500/20 text-violet-300 border-violet-500/40 hover:bg-violet-500/30'
          }`}
        >
          {settings.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{settings.isMuted ? 'Unmute Audio' : 'Mute System'}</span>
        </button>
      </div>

      {/* Section 1: Master Volume & Audio Theme */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Radio className="w-4 h-4 text-violet-400" />
          Master Volume & Acoustic Sound Theme
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Volume Slider */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300 font-medium">Master Synthesizer Output</span>
              <span className="font-mono text-violet-400">{settings.isMuted ? 'MUTED' : `${settings.volume}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              disabled={settings.isMuted}
              value={settings.volume}
              onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
              className="w-full accent-violet-400 cursor-pointer disabled:opacity-40"
            />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>0% (Whisper)</span>
              <span>50% (Comfortable)</span>
              <span>100% (High Output)</span>
            </div>
          </div>

          {/* Sound Theme Selector */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Acoustic Audio Theme</label>
            <select
              value={settings.soundTheme || 'modern'}
              onChange={(e) => {
                onUpdate({ soundTheme: e.target.value as SoundTheme });
                SoundManager.play('open');
                notify(`Sound Theme changed to ${e.target.value}`);
              }}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="modern">Modern Clean Synth (Sine & Soft Triangle)</option>
              <option value="cyber">Retro Cyberpunk (80s FM Beeps & Saw Waves)</option>
              <option value="mech">Mechanical Tactile Keyboard Clicks</option>
              <option value="scifi">Sci-Fi Ambient Resonances</option>
              <option value="silent">Complete Silence (Muted Synthesizer)</option>
            </select>
            <div className="text-[10px] text-gray-400 mt-1">
              All sound cues are generated natively on client using Web Audio API oscillators without external asset lag.
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Granular Event Cues */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Granular OS Event Sound Cues
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'soundEventWindowOpen', label: 'Window Open Chime', icon: Maximize2, val: settings.soundEventWindowOpen },
            { id: 'soundEventWindowClose', label: 'Window Close Whir', icon: Minimize2, val: settings.soundEventWindowClose },
            { id: 'soundEventWindowSnap', label: 'Window Snap & Fit', icon: Columns2, val: settings.soundEventWindowSnap },
            { id: 'soundEventTrash', label: 'Trash Bin Flush', icon: Trash2, val: settings.soundEventTrash },
            { id: 'soundEventTerminalBell', label: 'Terminal Bell & Alert', icon: Terminal, val: settings.soundEventTerminalBell },
            { id: 'soundEventError', label: 'Error Dialog Chime', icon: AlertTriangle, val: settings.soundEventError },
          ].map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-200">{item.label}</span>
              </div>
              <input
                type="checkbox"
                checked={item.val !== false}
                onChange={(e) => onUpdate({ [item.id]: e.target.checked })}
                className="w-4 h-4 accent-violet-400 rounded cursor-pointer"
              />
            </div>
          ))}
        </div>

        {/* Haptic feedback toggle */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between mt-2">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-xs font-medium text-white">Haptic Vibration on Touch / Gestures</div>
              <div className="text-[11px] text-gray-400">Triggers physical vibration motor on supported mobile / tablet devices</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.hapticFeedbackEnabled}
            onChange={(e) => onUpdate({ hapticFeedbackEnabled: e.target.checked })}
            className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Section 3: Interactive Live Soundboard */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Play className="w-4 h-4 text-cyan-400" />
          Interactive Audio Soundboard (Live Test)
        </h4>
        <p className="text-xs text-gray-400">
          Click any event below to preview the active sound theme synthesizer curve in real time.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <button
            onClick={() => playPreview('open')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white flex items-center justify-between cursor-pointer transition"
          >
            <span>Window Open</span>
            <Play className="w-3 h-3 text-emerald-400" />
          </button>
          <button
            onClick={() => playPreview('close')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white flex items-center justify-between cursor-pointer transition"
          >
            <span>Window Close</span>
            <Play className="w-3 h-3 text-rose-400" />
          </button>
          <button
            onClick={() => playPreview('snap')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white flex items-center justify-between cursor-pointer transition"
          >
            <span>Window Snap</span>
            <Play className="w-3 h-3 text-cyan-400" />
          </button>
          <button
            onClick={() => playPreview('trash')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white flex items-center justify-between cursor-pointer transition"
          >
            <span>Trash Empty</span>
            <Play className="w-3 h-3 text-amber-400" />
          </button>
          <button
            onClick={() => playPreview('click')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white flex items-center justify-between cursor-pointer transition"
          >
            <span>UI Click / Button</span>
            <Play className="w-3 h-3 text-purple-400" />
          </button>
          <button
            onClick={() => playPreview('error')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white flex items-center justify-between cursor-pointer transition"
          >
            <span>System Error Alert</span>
            <Play className="w-3 h-3 text-red-400" />
          </button>
          <button
            onClick={() => playPreview('success')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white flex items-center justify-between cursor-pointer transition"
          >
            <span>Success Chime</span>
            <Play className="w-3 h-3 text-green-400" />
          </button>
          <button
            onClick={() => playPreview('minimize')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white flex items-center justify-between cursor-pointer transition"
          >
            <span>Minimize Window</span>
            <Play className="w-3 h-3 text-yellow-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
