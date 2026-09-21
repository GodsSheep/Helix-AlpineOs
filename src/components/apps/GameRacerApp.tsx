import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Play, RotateCcw, ArrowLeft, ArrowRight, Shield, Zap, Sparkles, Flame, Gauge } from 'lucide-react';
import { SoundManager } from '../../kernel/SoundManager';
import { Toast } from '../../kernel/Toast';

interface Obstacle {
  id: number;
  lane: number;
  y: number;
  type: 'truck' | 'police' | 'oil' | 'nitro' | 'shield';
}

export const GameRacerApp: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('helix_racer_highscore') || '0', 10);
  });
  const [gameOver, setGameOver] = useState(false);
  const [lane, setLane] = useState(1);
  const [turboActive, setTurboActive] = useState(false);
  const [hasShield, setHasShield] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [speed, setSpeed] = useState(140);

  const carLaneRef = useRef(1);
  const turboRef = useRef(false);
  const shieldRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        carLaneRef.current = Math.max(0, carLaneRef.current - 1);
        setLane(carLaneRef.current);
        SoundManager.play('click');
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        carLaneRef.current = Math.min(2, carLaneRef.current + 1);
        setLane(carLaneRef.current);
        SoundManager.play('click');
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        // Trigger Turbo Nitro
        turboRef.current = true;
        setTurboActive(true);
        setSpeed(240);
        SoundManager.play('launch');
        setTimeout(() => {
          turboRef.current = false;
          setTurboActive(false);
          setSpeed(140);
        }, 3000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const interval = setInterval(() => {
      const pointStep = turboRef.current ? 35 : 15;
      setScore(s => s + pointStep);

      const moveStep = turboRef.current ? 14 : 9;

      setObstacles(prev => {
        const moved = prev.map(o => ({ ...o, y: o.y + moveStep }));
        const filtered = moved.filter(o => o.y < 440);

        // Spawn obstacle or powerup
        if (Math.random() < 0.35 && (filtered.length === 0 || filtered[filtered.length - 1].y > 110)) {
          const randType = Math.random();
          let type: Obstacle['type'] = 'truck';
          if (randType < 0.15) type = 'nitro';
          else if (randType < 0.30) type = 'shield';
          else if (randType < 0.60) type = 'police';
          else if (randType < 0.80) type = 'oil';

          filtered.push({
            id: Date.now() + Math.random(),
            lane: Math.floor(Math.random() * 3),
            y: -60,
            type
          });
        }

        // Collision check
        const remaining: Obstacle[] = [];
        for (const o of filtered) {
          if (o.y >= 290 && o.y <= 360 && o.lane === carLaneRef.current) {
            if (o.type === 'nitro') {
              turboRef.current = true;
              setTurboActive(true);
              setSpeed(260);
              SoundManager.play('success');
              Toast.show('NITRO TURBO BOOST ENGAGED!', '🔥');
              setTimeout(() => {
                turboRef.current = false;
                setTurboActive(false);
                setSpeed(140);
              }, 4000);
              continue;
            } else if (o.type === 'shield') {
              shieldRef.current = true;
              setHasShield(true);
              SoundManager.play('success');
              Toast.show('DEFLECTOR SHIELD ONLINE!', '🛡️');
              continue;
            } else {
              // Enemy or hazard
              if (shieldRef.current) {
                shieldRef.current = false;
                setHasShield(false);
                SoundManager.play('toast');
                Toast.show('Shield absorbed impact!', '🛡️');
                continue;
              } else {
                setGameOver(true);
                setIsPlaying(false);
                SoundManager.play('error');
                setHighScore(h => {
                  const newBest = Math.max(h, score);
                  localStorage.setItem('helix_racer_highscore', newBest.toString());
                  return newBest;
                });
                return [];
              }
            }
          }
          remaining.push(o);
        }
        return remaining;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, score]);

  const startGame = () => {
    setScore(0);
    setObstacles([]);
    setGameOver(false);
    carLaneRef.current = 1;
    setLane(1);
    turboRef.current = false;
    shieldRef.current = false;
    setTurboActive(false);
    setHasShield(false);
    setSpeed(140);
    setIsPlaying(true);
    SoundManager.play('open');
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs select-none items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#131622] border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col items-center">
        {/* Header HUD */}
        <div className="w-full flex justify-between items-center mb-3 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <span>🏎️ Turbo Highway Racer</span>
              {turboActive && (
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                  <Flame className="w-2.5 h-2.5" /> TURBO
                </span>
              )}
              {hasShield && (
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" /> SHIELD
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div>Score: <strong className="text-white">{score}</strong></div>
            <div>Best: <strong className="text-amber-400">{highScore}</strong></div>
          </div>
        </div>

        {/* Speedometer telemetry */}
        <div className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1 mb-2.5 flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span>Speed: <strong className="text-emerald-300">{speed} km/h</strong></span>
          </div>
          <div className="text-gray-400">
            Space: <strong className="text-amber-300">Boost Nitro</strong>
          </div>
        </div>

        {/* Game Stage Track */}
        <div
          onClick={(e) => {
            if (!isPlaying) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            if (clickX < rect.width / 3) {
              carLaneRef.current = 0;
            } else if (clickX < (rect.width * 2) / 3) {
              carLaneRef.current = 1;
            } else {
              carLaneRef.current = 2;
            }
            setLane(carLaneRef.current);
            SoundManager.play('click');
          }}
          className={`relative w-72 h-96 bg-[#0a0c12] border-2 rounded-2xl overflow-hidden shadow-inner cursor-pointer select-none transition ${
            turboActive ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'border-white/20'
          }`}
        >
          {/* Lane Dividers */}
          <div className="absolute left-[33.3%] top-0 w-0.5 h-full bg-white/15 border-r border-dashed border-white/30" />
          <div className="absolute left-[66.6%] top-0 w-0.5 h-full bg-white/15 border-r border-dashed border-white/30" />

          {/* Road Asphalt lines motion animation */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] animate-pulse pointer-events-none" />

          {/* Obstacles & Powerups */}
          {obstacles.map(o => (
            <div
              key={o.id}
              style={{
                top: `${o.y}px`,
                left: o.lane === 0 ? '16px' : o.lane === 1 ? '112px' : '208px'
              }}
              className={`absolute w-16 h-20 rounded-xl border flex flex-col items-center justify-center font-mono font-bold text-[10px] shadow-lg transition-transform ${
                o.type === 'nitro' ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_12px_#f59e0b]' :
                o.type === 'shield' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_#06b6d4]' :
                o.type === 'police' ? 'bg-blue-600 text-white border-blue-300 shadow-[0_0_12px_#3b82f6]' :
                o.type === 'oil' ? 'bg-zinc-800 text-yellow-400 border-yellow-500' :
                'bg-rose-600 text-white border-rose-300 shadow-[0_0_12px_#ef4444]'
              }`}
            >
              {o.type === 'nitro' && <Flame className="w-5 h-5 text-amber-400 animate-bounce" />}
              {o.type === 'shield' && <Shield className="w-5 h-5 text-cyan-400 animate-bounce" />}
              {o.type === 'police' && <span>🚓 POLICE</span>}
              {o.type === 'oil' && <span>🛢️ OIL</span>}
              {o.type === 'truck' && <span>🚛 TRUCK</span>}
            </div>
          ))}

          {/* Player Vehicle */}
          {isPlaying && (
            <div
              style={{
                bottom: '24px',
                left: lane === 0 ? '16px' : lane === 1 ? '112px' : '208px'
              }}
              className={`absolute w-16 h-20 rounded-xl border-2 flex flex-col items-center justify-center text-white font-mono font-bold text-[10px] transition-all duration-100 ${
                turboActive ? 'bg-emerald-500 border-amber-300 shadow-[0_0_20px_#10b981]' :
                hasShield ? 'bg-emerald-600 border-cyan-400 shadow-[0_0_15px_#06b6d4]' :
                'bg-emerald-600 border-emerald-300 shadow-[0_0_12px_#10b981]'
              }`}
            >
              <span>🏎️ HELIX</span>
              {turboActive && <div className="text-[8px] text-amber-200">MAX SPEED</div>}
            </div>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
              <div className="text-xl font-bold text-rose-500 font-mono mb-1">💥 CRASHED!</div>
              <div className="text-gray-300 text-xs mb-3 font-mono">Final Score: <strong className="text-white">{score}</strong></div>
              <button
                onClick={startGame}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow cursor-pointer font-mono"
              >
                <RotateCcw className="w-4 h-4" /> <span>Race Again</span>
              </button>
            </div>
          )}

          {/* Not playing idle screen */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-center">
              <div className="text-lg font-bold text-emerald-400 font-mono mb-1">Alpine Highway Racer</div>
              <p className="text-[11px] text-gray-300 mb-4 max-w-xs font-mono">
                Dodge traffic, collect Nitro & Shields, and reach maximum speed!
              </p>
              <button
                onClick={startGame}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/30 cursor-pointer font-mono"
              >
                <Play className="w-4 h-4 fill-current" /> <span>Start Highway Race</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile / Screen Controls */}
        <div className="w-full flex items-center justify-between mt-3 font-mono">
          <button
            onClick={() => {
              if (!isPlaying) return;
              carLaneRef.current = Math.max(0, carLaneRef.current - 1);
              setLane(carLaneRef.current);
              SoundManager.play('click');
            }}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> <span>Left (A)</span>
          </button>

          <button
            onClick={() => {
              if (!isPlaying) return;
              turboRef.current = true;
              setTurboActive(true);
              setSpeed(240);
              SoundManager.play('launch');
              setTimeout(() => {
                turboRef.current = false;
                setTurboActive(false);
                setSpeed(140);
              }, 3000);
            }}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <Flame className="w-4 h-4" /> <span>Nitro (Space)</span>
          </button>

          <button
            onClick={() => {
              if (!isPlaying) return;
              carLaneRef.current = Math.min(2, carLaneRef.current + 1);
              setLane(carLaneRef.current);
              SoundManager.play('click');
            }}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <span>Right (D)</span> <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
