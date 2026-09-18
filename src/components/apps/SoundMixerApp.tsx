import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Music, Radio, Sliders, Play, Square, Activity, Sparkles, Bell } from 'lucide-react';
import { Toast } from '../../kernel/Toast';
import { SoundManager, SoundEffect } from '../../kernel/SoundManager';

export const SoundMixerApp: React.FC = () => {
  const [masterVol, setMasterVol] = useState(80);
  const [pcmVol, setPcmVol] = useState(90);
  const [synthVol, setSynthVol] = useState(65);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayingTestTone, setIsPlayingTestTone] = useState(false);
  const [waveform, setWaveform] = useState<OscillatorType>('sine');
  const [frequency, setFrequency] = useState(440);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup any dangling audio contexts on unmount
      if (activeOscRef.current) {
        try { activeOscRef.current.stop(); } catch {}
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try { audioCtxRef.current.close(); } catch {}
      }
    };
  }, []);

  const getAudioContext = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTone = (freq: number = frequency, durationMs: number = 400, noteName?: string) => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = waveform;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const effectiveVolume = (masterVol / 100) * (synthVol / 100) * 0.15;
      gain.gain.setValueAtTime(effectiveVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      setIsPlayingTestTone(true);
      if (noteName) setActiveNote(noteName);

      setTimeout(() => {
        try {
          osc.stop();
          osc.disconnect();
          gain.disconnect();
        } catch {}
        setIsPlayingTestTone(false);
        if (noteName) setActiveNote(null);
      }, durationMs);
    } catch {
      setIsPlayingTestTone(false);
      setActiveNote(null);
    }
  };

  const NOTES = [
    { name: 'C4', freq: 261.63 },
    { name: 'D4', freq: 293.66 },
    { name: 'E4', freq: 329.63 },
    { name: 'F4', freq: 349.23 },
    { name: 'G4', freq: 392.00 },
    { name: 'A4', freq: 440.00 },
    { name: 'B4', freq: 493.88 },
    { name: 'C5', freq: 523.25 },
  ];

  return (
    <div className="h-full flex flex-col bg-[#12141c] text-[#edf1f7] text-xs select-none overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 bg-[#181b26] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-sm">ALSA Sound Mixer & Audio Synthesizer</span>
        </div>
        <button
          onClick={() => {
            setIsMuted(!isMuted);
            Toast.show(isMuted ? 'Audio Unmuted' : 'Audio Muted', isMuted ? '🔊' : '🔇');
          }}
          className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
            isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span>{isMuted ? 'Muted' : 'Active (ALSA)'}</span>
        </button>
      </div>

      <div className="flex-1 p-5 max-w-xl mx-auto w-full space-y-4">
        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Master Slider */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="font-semibold text-white">Master Output</span>
              <span className="text-[#6ee7b7]">{isMuted ? '0%' : `${masterVol}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : masterVol}
              onChange={(e) => setMasterVol(Number(e.target.value))}
              className="w-full accent-[#6ee7b7] cursor-pointer"
            />
          </div>

          {/* PCM Slider */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="font-semibold text-white">PCM Stream</span>
              <span className="text-cyan-300">{pcmVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={pcmVol}
              onChange={(e) => setPcmVol(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Synthesizer Slider */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="font-semibold text-white">Software Synth</span>
              <span className="text-purple-300">{synthVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={synthVol}
              onChange={(e) => setSynthVol(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Synthesizer Controls Panel */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-xs">Waveform Generator</span>
            </div>
            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
              {(['sine', 'square', 'sawtooth', 'triangle'] as OscillatorType[]).map((w) => (
                <button
                  key={w}
                  onClick={() => setWaveform(w)}
                  className={`px-2 py-1 rounded text-[10px] font-mono capitalize transition ${
                    waveform === w ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-gray-300">Base Pitch Frequency</span>
              <span className="text-amber-400 font-bold">{frequency} Hz</span>
            </div>
            <input
              type="range"
              min="110"
              max="1760"
              step="5"
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Interactive 8-Key Chiptune Piano Keyboard */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>Interactive Virtual Keyboard:</span>
              <span className="font-mono text-cyan-300">{activeNote ? `Playing: ${activeNote}` : 'Click any key to test'}</span>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {NOTES.map((n) => (
                <button
                  key={n.name}
                  onClick={() => playTone(n.freq, 350, n.name)}
                  className={`py-3 rounded-lg border text-center font-mono font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    activeNote === n.name
                      ? 'bg-amber-400 text-black border-amber-300 scale-95 shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                  }`}
                >
                  <span className="text-xs">{n.name}</span>
                  <span className="text-[9px] opacity-70 font-normal">{Math.round(n.freq)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* System Sound Effects Soundboard */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#6ee7b7]" />
              <span className="font-bold text-white text-xs">System Sound Effects Tester</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">Web Audio API</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'boot', label: 'Startup Chime', icon: '✨' },
              { id: 'snap', label: 'Window Snap', icon: '📐' },
              { id: 'shade', label: 'Window Shade', icon: '↕️' },
              { id: 'toast', label: 'Notification', icon: '🔔' },
              { id: 'open', label: 'App Launch', icon: '🚀' },
              { id: 'close', label: 'App Close', icon: '✕' },
              { id: 'dock', label: 'Dock Pop', icon: '🎯' },
              { id: 'error', label: 'System Alert', icon: '⚠️' },
            ].map((snd) => (
              <button
                key={snd.id}
                onClick={() => SoundManager.play(snd.id as SoundEffect)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-[#6ee7b7]/20 border border-white/10 hover:border-[#6ee7b7]/40 text-white text-left transition flex items-center gap-2 cursor-pointer group active:scale-95"
              >
                <span className="text-base group-hover:scale-110 transition">{snd.icon}</span>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-gray-200 group-hover:text-white truncate">{snd.label}</div>
                  <div className="text-[9px] font-mono text-gray-400 truncate">{snd.id}()</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Master Test Button */}
        <button
          onClick={() => playTone(frequency, 500)}
          disabled={isPlayingTestTone || isMuted}
          className="w-full py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono font-medium border border-amber-500/30 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{isPlayingTestTone ? `Synthesizing ${frequency}Hz (${waveform})...` : `Trigger Tone (${frequency}Hz ${waveform})`}</span>
        </button>
      </div>
    </div>
  );
};
