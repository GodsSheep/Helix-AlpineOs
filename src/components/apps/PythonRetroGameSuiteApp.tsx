import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Play, RotateCcw, Trophy, Code, Zap, Volume2, Sparkles } from 'lucide-react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';

type GameMode = 'snake' | 'racer' | 'defense';

export const PythonRetroGameSuiteApp: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>('snake');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(120);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isGameRunning, setIsGameRunning] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Snake state refs
  const snakeRef = useRef<{ x: number; y: number }[]>([{ x: 10, y: 10 }]);
  const foodRef = useRef<{ x: number; y: number }>({ x: 5, y: 5 });
  const dirRef = useRef<{ x: number; y: number }>({ x: 1, y: 0 });

  // Racer state refs
  const playerXRef = useRef<number>(200);
  const obstaclesRef = useRef<{ x: number; y: number; speed: number }[]>([]);

  // Defense state refs
  const defenderXRef = useRef<number>(200);
  const bulletsRef = useRef<{ x: number; y: number }[]>([]);
  const aliensRef = useRef<{ x: number; y: number; alive: boolean }[]>([]);

  const startCurrentGame = () => {
    setIsGameOver(false);
    setIsGameRunning(true);
    setScore(0);
    SoundManager.play('open');

    if (gameMode === 'snake') {
      snakeRef.current = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
      ];
      foodRef.current = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
      dirRef.current = { x: 1, y: 0 };
    } else if (gameMode === 'racer') {
      playerXRef.current = 200;
      obstaclesRef.current = [
        { x: 100, y: -50, speed: 4 },
        { x: 250, y: -180, speed: 5 },
      ];
    } else if (gameMode === 'defense') {
      defenderXRef.current = 200;
      bulletsRef.current = [];
      const aliens = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 6; col++) {
          aliens.push({ x: 50 + col * 50, y: 30 + row * 30, alive: true });
        }
      }
      aliensRef.current = aliens;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGameRunning || isGameOver) return;

      if (gameMode === 'snake') {
        if (e.key === 'ArrowUp' && dirRef.current.y !== 1) dirRef.current = { x: 0, y: -1 };
        if (e.key === 'ArrowDown' && dirRef.current.y !== -1) dirRef.current = { x: 0, y: 1 };
        if (e.key === 'ArrowLeft' && dirRef.current.x !== 1) dirRef.current = { x: -1, y: 0 };
        if (e.key === 'ArrowRight' && dirRef.current.x !== -1) dirRef.current = { x: 1, y: 0 };
      } else if (gameMode === 'racer') {
        if (e.key === 'ArrowLeft') playerXRef.current = Math.max(40, playerXRef.current - 20);
        if (e.key === 'ArrowRight') playerXRef.current = Math.min(360, playerXRef.current + 20);
      } else if (gameMode === 'defense') {
        if (e.key === 'ArrowLeft') defenderXRef.current = Math.max(20, defenderXRef.current - 15);
        if (e.key === 'ArrowRight') defenderXRef.current = Math.min(380, defenderXRef.current + 15);
        if (e.key === ' ' || e.key === 'Spacebar') {
          bulletsRef.current.push({ x: defenderXRef.current, y: 260 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning, isGameOver, gameMode]);

  useEffect(() => {
    let animId: number;
    let lastTime = 0;

    const gameLoop = (timestamp: number) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      if (timestamp - lastTime > 80 && isGameRunning && !isGameOver) {
        lastTime = timestamp;

        // Clear Canvas
        ctx.fillStyle = '#0a0c14';
        ctx.fillRect(0, 0, 400, 300);

        if (gameMode === 'snake') {
          // Snake Logic
          const head = {
            x: snakeRef.current[0].x + dirRef.current.x,
            y: snakeRef.current[0].y + dirRef.current.y,
          };

          // Collision check
          if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 15) {
            setIsGameOver(true);
            SoundManager.play('error');
            return;
          }

          snakeRef.current.unshift(head);

          // Eat food
          if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
            setScore((s) => {
              const ns = s + 10;
              if (ns > highScore) setHighScore(ns);
              return ns;
            });
            foodRef.current = {
              x: Math.floor(Math.random() * 20),
              y: Math.floor(Math.random() * 15),
            };
            SoundManager.play('success');
          } else {
            snakeRef.current.pop();
          }

          // Draw Food
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(foodRef.current.x * 20 + 2, foodRef.current.y * 20 + 2, 16, 16);

          // Draw Snake
          ctx.fillStyle = '#10b981';
          snakeRef.current.forEach((seg) => {
            ctx.fillRect(seg.x * 20 + 1, seg.y * 20 + 1, 18, 18);
          });
        } else if (gameMode === 'racer') {
          // Draw Highway
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(30, 0, 340, 300);

          // Obstacles
          ctx.fillStyle = '#ef4444';
          obstaclesRef.current.forEach((obs) => {
            obs.y += obs.speed;
            if (obs.y > 300) {
              obs.y = -40;
              obs.x = 40 + Math.random() * 300;
              setScore((s) => s + 5);
            }
            ctx.fillRect(obs.x, obs.y, 30, 40);

            // Crash Check
            if (
              Math.abs(obs.x - playerXRef.current) < 25 &&
              obs.y > 230 &&
              obs.y < 290
            ) {
              setIsGameOver(true);
              SoundManager.play('error');
            }
          });

          // Player Car
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(playerXRef.current - 15, 250, 30, 40);
        } else if (gameMode === 'defense') {
          // Defense Player
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(defenderXRef.current - 15, 270, 30, 15);

          // Bullets
          ctx.fillStyle = '#f43f5e';
          bulletsRef.current.forEach((b, idx) => {
            b.y -= 8;
            ctx.fillRect(b.x - 2, b.y, 4, 10);

            // Hit Alien Check
            aliensRef.current.forEach((alien) => {
              if (
                alien.alive &&
                Math.abs(alien.x - b.x) < 20 &&
                Math.abs(alien.y - b.y) < 15
              ) {
                alien.alive = false;
                setScore((s) => s + 20);
                SoundManager.play('success');
              }
            });
          });

          // Draw Aliens
          ctx.fillStyle = '#22c55e';
          aliensRef.current.forEach((alien) => {
            if (alien.alive) {
              ctx.fillRect(alien.x - 12, alien.y - 10, 24, 20);
            }
          });
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [isGameRunning, isGameOver, gameMode, highScore]);

  return (
    <div className="h-full flex flex-col bg-[#0f111a] text-gray-100 select-none font-sans overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-[#151824] border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Helix Python Arcade Games</h2>
            <p className="text-[11px] text-gray-400">Canvas retro games driven by Python execution loops</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => {
                setGameMode('snake');
                setIsGameRunning(false);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                gameMode === 'snake' ? 'bg-[#6ee7b7] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Python Cyber Serpent
            </button>
            <button
              onClick={() => {
                setGameMode('racer');
                setIsGameRunning(false);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                gameMode === 'racer' ? 'bg-[#6ee7b7] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Synth Racer
            </button>
            <button
              onClick={() => {
                setGameMode('defense');
                setIsGameRunning(false);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                gameMode === 'defense' ? 'bg-[#6ee7b7] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Space Defense
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Stage */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative bg-[#0b0d14]">
        <div className="mb-2 flex items-center justify-between w-full max-w-[400px] text-xs font-mono">
          <span className="text-emerald-400 font-bold">SCORE: {score}</span>
          <span className="text-amber-400 font-bold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> HIGH SCORE: {highScore}
          </span>
        </div>

        <div className="relative border-2 border-white/20 rounded-2xl overflow-hidden shadow-2xl">
          <canvas ref={canvasRef} width={400} height={300} className="bg-black block" />

          {(!isGameRunning || isGameOver) && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 p-4 text-center">
              <h3 className="font-extrabold text-white text-lg font-mono">
                {isGameOver ? 'GAME OVER' : 'PYTHON ARCADE'}
              </h3>
              <p className="text-xs text-gray-300 max-w-[280px]">
                {gameMode === 'snake' && 'Use Arrow Keys to navigate Cyber Serpent.'}
                {gameMode === 'racer' && 'Use Left/Right Arrow Keys to dodge obstacles.'}
                {gameMode === 'defense' && 'Use Left/Right Arrow Keys to move, Spacebar to shoot.'}
              </p>
              <button
                onClick={startCurrentGame}
                className="px-5 py-2 rounded-xl bg-[#6ee7b7] hover:bg-[#5eead4] text-black font-extrabold text-xs transition cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isGameOver ? 'Play Again' : 'Start Game'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
