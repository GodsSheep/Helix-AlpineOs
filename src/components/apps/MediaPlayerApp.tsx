import React, { useState, useEffect, useRef } from 'react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { 
  Music, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Shuffle, 
  FolderOpen, 
  ListMusic, 
  Radio, 
  Sparkles, 
  Activity, 
  Sliders, 
  Upload,
  Plus
} from 'lucide-react';

interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  genre: string;
  bpm: number;
}

export const MediaPlayerApp: React.FC<{ args?: Record<string, unknown> }> = ({ args }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [volume, setVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(35);
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'wave' | 'circles'>('bars');
  const [equalizerPreset, setEqualizerPreset] = useState<'bass' | 'vocal' | 'electro' | 'flat'>('electro');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [playlist, setPlaylist] = useState<AudioTrack[]>([
    { id: 't1', title: 'Neon Highway (Synthwave)', artist: 'Helix Soundworks', duration: '3:45', genre: 'Retrowave', bpm: 124 },
    { id: 't2', title: 'Midnight Kernel Debugging', artist: 'Lo-Fi Alpine', duration: '2:50', genre: 'Lo-Fi Chill', bpm: 85 },
    { id: 't3', title: 'Cyberpunk Skyline 2077', artist: 'NeuroNet Audio', duration: '4:12', genre: 'Electro Dark', bpm: 130 },
    { id: 't4', title: '8-Bit Microprocessor Melody', artist: 'Chiptune Maestro', duration: '1:58', genre: 'Chiptune', bpm: 140 },
  ]);

  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  // Visualizer Animation Loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const numBars = 36;
          const barWidth = (canvas.width - 20) / numBars;
          const time = Date.now() * 0.003;

          if (visualizerMode === 'bars') {
            for (let i = 0; i < numBars; i++) {
              const frequencyFactor = isPlaying ? Math.sin(time * 2 + i * 0.3) * 0.5 + 0.5 : 0.05;
              const eqBoost = equalizerPreset === 'bass' && i < 10 ? 1.4 : equalizerPreset === 'electro' ? 1.2 : 1.0;
              const barHeight = Math.max(4, frequencyFactor * (canvas.height - 40) * (volume / 100) * eqBoost);

              const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
              gradient.addColorStop(0, '#38bdf8');
              gradient.addColorStop(0.6, '#a855f7');
              gradient.addColorStop(1, '#f43f5e');

              ctx.fillStyle = gradient;
              ctx.fillRect(10 + i * barWidth, canvas.height - barHeight - 10, barWidth - 3, barHeight);
            }
          } else if (visualizerMode === 'wave') {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let x = 0; x < canvas.width; x += 4) {
              const amp = isPlaying ? (canvas.height / 3) * (volume / 100) : 4;
              const y = canvas.height / 2 + Math.sin(x * 0.05 + time * 3) * amp * Math.cos(time * 2);
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          } else if (visualizerMode === 'circles') {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const baseRadius = isPlaying ? 35 + Math.sin(time * 4) * 12 * (volume / 100) : 30;

            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius * 1.5, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, visualizerMode, equalizerPreset, volume]);

  const handleNext = () => {
    setCurrentTrackIndex((idx) => (idx + 1) % playlist.length);
    SoundManager.play('open');
    Toast.show('Track switched', '🎵');
  };

  const handlePrev = () => {
    setCurrentTrackIndex((idx) => (idx - 1 + playlist.length) % playlist.length);
    SoundManager.play('open');
    Toast.show('Track switched', '🎵');
  };

  return (
    <div className="h-full flex flex-col bg-[#080b11] text-gray-200 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#0d111a] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              Media Player & Audio Visualizer
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                Hi-Fi Spectrum DSP
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Web Audio API frequency visualizer, custom playlists, and equalizer presets.
            </p>
          </div>
        </div>

        {/* Visualizer Modes */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
          {(['bars', 'wave', 'circles'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setVisualizerMode(mode)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                visualizerMode === mode ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#080b11] flex flex-col md:flex-row gap-4 items-center md:items-start justify-center">
        {/* Left: Player Stage & Visualizer */}
        <div className="flex-1 max-w-xl w-full flex flex-col items-center space-y-4">
          {/* Visualizer Canvas */}
          <div className="w-full h-44 rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-black relative">
            <canvas ref={canvasRef} width={500} height={176} className="w-full h-full block" />
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-cyan-400 flex items-center gap-1.5">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>{currentTrack.bpm} BPM • {currentTrack.genre}</span>
            </div>
          </div>

          {/* Track Info */}
          <div className="w-full p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">{currentTrack.title}</h3>
                <p className="text-xs text-cyan-400">{currentTrack.artist}</p>
              </div>
              <span className="text-xs font-mono text-gray-400">{currentTrack.duration}</span>
            </div>

            {/* Scrubber Progress Bar */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isLooping ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isShuffle ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrev}
                  className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center justify-center transition shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={handleNext}
                  className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-gray-400 hover:text-white transition cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-18 accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Playlist & Equalizer */}
        <div className="w-full md:w-80 space-y-3">
          {/* Equalizer */}
          <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-2.5">
            <h4 className="font-bold text-xs text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Equalizer Presets
            </h4>

            <div className="grid grid-cols-2 gap-2">
              {(['bass', 'vocal', 'electro', 'flat'] as const).map((eq) => (
                <button
                  key={eq}
                  onClick={() => setEqualizerPreset(eq)}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                    equalizerPreset === eq
                      ? 'bg-cyan-600 text-white shadow'
                      : 'bg-black/40 border border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {eq} Boost
                </button>
              ))}
            </div>
          </div>

          {/* Playlist */}
          <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-cyan-400" />
                Track Queue
              </h4>
              <button
                onClick={() => {
                  SoundManager.play('open');
                  Toast.show('Loaded audio from VFS library', '📂');
                }}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {playlist.map((track, idx) => (
                <div
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                    SoundManager.play('click');
                  }}
                  className={`p-2.5 rounded-xl flex items-center justify-between transition cursor-pointer ${
                    currentTrackIndex === idx
                      ? 'bg-cyan-500/20 border border-cyan-500 text-white'
                      : 'bg-black/40 border border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] text-gray-500">{idx + 1}</span>
                    <div>
                      <div className="font-bold text-xs">{track.title}</div>
                      <div className="text-[10px] text-gray-400">{track.artist}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">{track.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
