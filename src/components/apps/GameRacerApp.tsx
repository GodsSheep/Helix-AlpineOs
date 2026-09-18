import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Play, RotateCcw, ArrowLeft, ArrowRight, Shield } from 'lucide-react';

export const GameRacerApp: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const carLaneRef = useRef(1); // 0: left, 1: center, 2: right
  const [lane, setLane] = useState(1);
  const [obstacles, setObstacles] = useState<{ id: number; lane: number; y: number }[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        carLaneRef.current = Math.max(0, carLaneRef.current - 1);
        setLane(carLaneRef.current);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        carLaneRef.current = Math.min(2, carLaneRef.current + 1);
        setLane(carLaneRef.current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const interval = setInterval(() => {
      setScore(s => s + 15);
      setObstacles(prev => {
        const moved = prev.map(o => ({ ...o, y: o.y + 8 }));
        const filtered = moved.filter(o => o.y < 420);
        // Spawn obstacle
        if (Math.random() < 0.4 && (filtered.length === 0 || filtered[filtered.length - 1].y > 110)) {
          filtered.push({ id: Date.now(), lane: Math.floor(Math.random() * 3), y: -50 });
        }
        // Collision check
        for (const o of filtered) {
          if (o.y >= 300 && o.y <= 360 && o.lane === carLaneRef.current) {
            setGameOver(true);
            setIsPlaying(false);
            setHighScore(h => Math.max(h, score));
          }
        }
        return filtered;
      });
    }, 45);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, score]);

  const startGame = () => {
    setScore(0);
    setObstacles([]);
    setGameOver(false);
    carLaneRef.current = 1;
    setLane(1);
    setIsPlaying(true);
  };

  return (
    <div className="h-full flex flex-col bg-[#12141c] text-[#edf1f7] text-xs select-none items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#181b26] border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4 font-mono">
          <div className="text-sm font-bold text-[#6ee7b7]">🏎️ Alpine Highway Racer</div>
          <div className="flex gap-4">
            <div>Score: <strong className="text-white">{score}</strong></div>
            <div>Best: <strong className="text-amber-400">{highScore}</strong></div>
          </div>
        </div>

        {/* Game Stage */}
        <div 
          onClick={(e) => {
            if (!isPlaying) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            if (clickX < rect.width / 2) {
              carLaneRef.current = Math.max(0, carLaneRef.current - 1);
            } else {
              carLaneRef.current = Math.min(2, carLaneRef.current + 1);
            }
            setLane(carLaneRef.current);
          }}
          className="relative w-64 h-96 bg-black/75 border-2 border-white/25 rounded-xl overflow-hidden flex justify-between px-10 shadow-inner cursor-pointer select-none"
        >
          <div className="w-0.5 h-full bg-white/20 border-r border-dashed border-white/40" />
          <div className="w-0.5 h-full bg-white/20 border-r border-dashed border-white/40" />

          {/* Obstacles */}
          {obstacles.map(o => (
            <div
              key={o.id}
              style={{
                top: `${o.y}px`,
                left: o.lane === 0 ? '20px' : o.lane === 1 ? '100px' : '180px'
              }}
              className="absolute w-14 h-18 bg-red-600 rounded-xl border border-red-300 shadow-[0_0_12px_#ef4444] flex items-center justify-center text-white font-mono font-bold text-[10px]"
            >
              TRUCK
            </div>
          ))}

          {/* Player Car */}
          <div
            style={{
              bottom: '24px',
              left: lane === 0 ? '20px' : lane === 1 ? '100px' : '180px'
            }}
            className="absolute w-14 h-18 bg-[#6ee7b7] rounded-xl border-2 border-white shadow-[0_0_18px_#6ee7b7] flex items-center justify-center text-black font-mono font-bold text-[11px]"
          >
            ALPINE
          </div>

          {!isPlaying && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
              {gameOver ? (
                <div className="space-y-2 mb-4">
                  <div className="text-red-400 font-bold text-base">CRASH! COLLISION DETECTED</div>
                  <div className="font-mono text-gray-300">Final Score: {score}</div>
                </div>
              ) : (
                <div className="text-gray-300 font-mono mb-4 text-xs">Use A/D or Left/Right arrows to steer</div>
              )}
              <button
                onClick={startGame}
                className="px-6 py-2.5 rounded-xl bg-[#6ee7b7] text-black font-bold hover:bg-[#5cd4a4] transition cursor-pointer flex items-center gap-2 font-mono"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{gameOver ? 'Play Again' : 'Start Engine'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex gap-4 mt-4 w-full">
          <button
            onClick={() => { carLaneRef.current = Math.max(0, carLaneRef.current - 1); setLane(carLaneRef.current); }}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-white transition cursor-pointer flex items-center justify-center gap-1 font-mono"
          >
            <ArrowLeft className="w-4 h-4" /> Steer Left
          </button>
          <button
            onClick={() => { carLaneRef.current = Math.min(2, carLaneRef.current + 1); setLane(carLaneRef.current); }}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-white transition cursor-pointer flex items-center justify-center gap-1 font-mono"
          >
            Steer Right <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
