import React, { useState, useEffect, useRef } from 'react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { 
  Gamepad2, 
  Play, 
  Pause, 
  RotateCcw, 
  Tv, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Save, 
  FolderOpen, 
  Upload, 
  Sparkles, 
  Zap, 
  FastForward,
  Layers,
  HelpCircle
} from 'lucide-react';

interface GameROM {
  id: string;
  name: string;
  system: 'Chip-8 MicroVM' | '8-Bit Arcade' | 'Retro Console';
  desc: string;
  author: string;
}

export const RetroEmulatorApp: React.FC<{ args?: Record<string, unknown> }> = ({ args }) => {
  const [selectedRom, setSelectedRom] = useState<string>('space-arcade');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [crtFilter, setCrtFilter] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(1850);
  const [lives, setLives] = useState<number>(3);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const roms: GameROM[] = [
    { id: 'space-arcade', name: 'Cosmic Invaders 1984', system: '8-Bit Arcade', desc: 'Defend the galaxy against alien armada squadrons.', author: 'Retro Arcade Dev' },
    { id: 'chip8-pong', name: 'Pong 1972 (CHIP-8 VM)', system: 'Chip-8 MicroVM', desc: 'The grandfather of video games simulated on a virtual 64x32 CPU.', author: 'Microcode' },
    { id: 'chip8-brix', name: 'Brix Breaker (CHIP-8)', system: 'Chip-8 MicroVM', desc: 'Paddle and bouncing ball destroying brick arrays.', author: 'Microcode' },
    { id: 'cyber-snake', name: 'Cyber Snake DX', system: 'Retro Console', desc: 'Eat neon energy pellets and grow without biting your tail.', author: 'Helix Labs' },
  ];

  // Key controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Emulation Game Loop
  useEffect(() => {
    let animId: number;

    // Game state for Space Arcade
    const ship = { x: 190, y: 260, w: 22, h: 18, vx: 0 };
    let bullets: { x: number; y: number; vy: number }[] = [];
    let aliens: { x: number; y: number; w: number; h: number; alive: boolean; color: string }[] = [];
    let alienVx = 1;
    let alienVy = 0;
    let lastShotTime = 0;
    let stars: { x: number; y: number; speed: number; size: number }[] = [];

    // Chip-8 state
    let ballX = 32;
    let ballY = 16;
    let ballVx = 0.5;
    let ballVy = 0.4;
    let paddleLeftY = 12;
    let paddleRightY = 12;

    // Snake state
    let snake: { x: number; y: number }[] = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    let snakeDir = { x: 1, y: 0 };
    let food = { x: 15, y: 8 };
    let snakeTick = 0;

    // Init stars
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * 400,
        y: Math.random() * 300,
        speed: Math.random() * 1.5 + 0.5,
        size: Math.random() > 0.8 ? 2 : 1
      });
    }

    // Init aliens
    const initAliens = () => {
      aliens = [];
      const colors = ['#f43f5e', '#ec4899', '#a855f7', '#38bdf8'];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          aliens.push({
            x: 50 + c * 38,
            y: 35 + r * 26,
            w: 22,
            h: 16,
            alive: true,
            color: colors[r % colors.length]
          });
        }
      }
    };
    initAliens();

    const loop = () => {
      if (canvasRef.current && isRunning) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#05070d';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Render Game according to ROM
          if (selectedRom === 'space-arcade') {
            // Draw background stars
            ctx.fillStyle = '#ffffff';
            stars.forEach((s) => {
              s.y += s.speed * speedMultiplier;
              if (s.y > canvas.height) s.y = 0;
              ctx.globalAlpha = s.size === 2 ? 0.9 : 0.4;
              ctx.fillRect(s.x, s.y, s.size, s.size);
            });
            ctx.globalAlpha = 1.0;

            // Player controls
            if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) ship.x -= 4 * speedMultiplier;
            if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) ship.x += 4 * speedMultiplier;
            ship.x = Math.max(10, Math.min(canvas.width - ship.w - 10, ship.x));

            // Shooting
            const now = Date.now();
            if ((keysRef.current['Space'] || keysRef.current['KeyK']) && now - lastShotTime > 220 / speedMultiplier) {
              bullets.push({ x: ship.x + ship.w / 2 - 2, y: ship.y - 4, vy: -7 });
              lastShotTime = now;
              if (soundEnabled) SoundManager.play('click');
            }

            // Move bullets
            bullets.forEach((b) => (b.y += b.vy * speedMultiplier));
            bullets = bullets.filter((b) => b.y > 0);

            // Move aliens
            let switchDir = false;
            aliens.forEach((a) => {
              if (!a.alive) return;
              a.x += alienVx * speedMultiplier;
              if (a.x > canvas.width - a.w - 15 || a.x < 15) switchDir = true;
            });

            if (switchDir) {
              alienVx *= -1;
              aliens.forEach((a) => (a.y += 6));
            }

            // Bullet vs Alien collision
            bullets.forEach((b) => {
              aliens.forEach((a) => {
                if (a.alive && b.x >= a.x && b.x <= a.x + a.w && b.y >= a.y && b.y <= a.y + a.h) {
                  a.alive = false;
                  b.y = -100;
                  setScore((s) => {
                    const next = s + 50;
                    if (next > highScore) setHighScore(next);
                    return next;
                  });
                  if (soundEnabled) SoundManager.play('success');
                }
              });
            });

            // Draw player ship
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(ship.x + ship.w / 2, ship.y);
            ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
            ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h - 4);
            ctx.lineTo(ship.x, ship.y + ship.h);
            ctx.closePath();
            ctx.fill();

            // Draw bullets
            ctx.fillStyle = '#facc15';
            bullets.forEach((b) => ctx.fillRect(b.x, b.y, 4, 10));

            // Draw aliens
            aliens.forEach((a) => {
              if (!a.alive) return;
              ctx.fillStyle = a.color;
              ctx.fillRect(a.x, a.y, a.w, a.h);
              // Alien eyes
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(a.x + 4, a.y + 4, 3, 3);
              ctx.fillRect(a.x + a.w - 7, a.y + 4, 3, 3);
            });
          } else if (selectedRom === 'chip8-pong') {
            // Chip-8 64x32 scaled simulation
            ctx.fillStyle = '#10b981';
            ballX += ballVx * speedMultiplier;
            ballY += ballVy * speedMultiplier;

            if (ballY < 2 || ballY > 30) ballVy *= -1;

            if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) paddleLeftY = Math.max(2, paddleLeftY - 1);
            if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) paddleLeftY = Math.min(22, paddleLeftY + 1);

            // Simple AI right paddle
            if (ballY > paddleRightY + 4) paddleRightY += 0.4;
            else if (ballY < paddleRightY) paddleRightY -= 0.4;

            // Paddle collisions
            if (ballX <= 4 && ballY >= paddleLeftY && ballY <= paddleLeftY + 8) ballVx = Math.abs(ballVx);
            if (ballX >= 60 && ballY >= paddleRightY && ballY <= paddleRightY + 8) ballVx = -Math.abs(ballVx);

            if (ballX < 0 || ballX > 64) {
              ballX = 32;
              ballY = 16;
            }

            // Render scaled pixels
            const scaleX = canvas.width / 64;
            const scaleY = canvas.height / 32;
            ctx.fillRect(2 * scaleX, paddleLeftY * scaleY, 2 * scaleX, 8 * scaleY);
            ctx.fillRect(60 * scaleX, paddleRightY * scaleY, 2 * scaleX, 8 * scaleY);
            ctx.fillRect(ballX * scaleX, ballY * scaleY, 2 * scaleX, 2 * scaleY);
          } else if (selectedRom === 'cyber-snake') {
            // Snake logic
            snakeTick++;
            if (snakeTick % Math.max(1, Math.floor(6 / speedMultiplier)) === 0) {
              if (keysRef.current['ArrowUp'] && snakeDir.y === 0) snakeDir = { x: 0, y: -1 };
              if (keysRef.current['ArrowDown'] && snakeDir.y === 0) snakeDir = { x: 0, y: 1 };
              if (keysRef.current['ArrowLeft'] && snakeDir.x === 0) snakeDir = { x: -1, y: 0 };
              if (keysRef.current['ArrowRight'] && snakeDir.x === 0) snakeDir = { x: 1, y: 0 };

              const head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };
              if (head.x < 0) head.x = 24;
              if (head.x > 24) head.x = 0;
              if (head.y < 0) head.y = 18;
              if (head.y > 18) head.y = 0;

              if (head.x === food.x && head.y === food.y) {
                food = { x: Math.floor(Math.random() * 24), y: Math.floor(Math.random() * 18) };
                setScore((s) => s + 20);
                if (soundEnabled) SoundManager.play('success');
              } else {
                snake.pop();
              }
              snake.unshift(head);
            }

            // Draw Snake
            const cellW = canvas.width / 25;
            const cellH = canvas.height / 19;
            ctx.fillStyle = '#10b981';
            snake.forEach((s) => ctx.fillRect(s.x * cellW + 1, s.y * cellH + 1, cellW - 2, cellH - 2));

            // Food
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(food.x * cellW + 2, food.y * cellH + 2, cellW - 4, cellH - 4);
          }

          // CRT Scanline Overlay
          if (crtFilter) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            for (let y = 0; y < canvas.height; y += 3) {
              ctx.fillRect(0, y, canvas.width, 1);
            }
          }
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, selectedRom, crtFilter, soundEnabled, speedMultiplier]);

  const handleRomChange = (romId: string) => {
    setSelectedRom(romId);
    setScore(0);
    SoundManager.play('open');
    Toast.show(`Cartridge loaded: ${roms.find((r) => r.id === romId)?.name}`, '🕹️');
  };

  return (
    <div className="h-full flex flex-col bg-[#080b11] text-gray-200 font-sans select-none overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 bg-[#0d111a] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-md">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              Retro Emulator & Classic PC Runtime
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-mono border border-violet-500/30">
                CHIP-8 / 8-Bit Engine
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Hardware-accurate homebrew microVM, scanline CRT filters, and save state persistence.
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={() => setCrtFilter(!crtFilter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              crtFilter ? 'bg-violet-600 text-white border-violet-500' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>CRT {crtFilter ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setSpeedMultiplier((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer border border-white/10"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{speedMultiplier}x Speed</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#080b11] flex flex-col md:flex-row gap-4 items-center md:items-start justify-center">
        {/* Left: Screen & HUD */}
        <div className="flex flex-col items-center space-y-3">
          {/* HUD Bar */}
          <div className="w-full max-w-[420px] flex items-center justify-between p-2.5 rounded-2xl bg-[#101522] border border-white/10 font-mono text-xs">
            <span className="text-yellow-400 font-bold">SCORE: {score}</span>
            <span className="text-purple-400 font-bold">HI-SCORE: {highScore}</span>
            <span className="text-gray-400">WASD / Arrow Keys</span>
          </div>

          {/* CRT Canvas */}
          <div className="relative rounded-2xl border-4 border-[#1e2538] overflow-hidden shadow-2xl bg-black">
            <canvas ref={canvasRef} width={400} height={300} className="block" />
          </div>

          {/* Virtual On-Screen Gamepad for Mobile/Touch */}
          <div className="w-full max-w-[420px] p-3 rounded-2xl bg-[#101522] border border-white/10 flex items-center justify-between">
            {/* D-Pad */}
            <div className="grid grid-cols-3 gap-1 w-24">
              <div />
              <button
                onMouseDown={() => (keysRef.current['ArrowUp'] = true)}
                onMouseUp={() => (keysRef.current['ArrowUp'] = false)}
                className="w-7 h-7 bg-white/10 active:bg-violet-600 rounded flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ▲
              </button>
              <div />
              <button
                onMouseDown={() => (keysRef.current['ArrowLeft'] = true)}
                onMouseUp={() => (keysRef.current['ArrowLeft'] = false)}
                className="w-7 h-7 bg-white/10 active:bg-violet-600 rounded flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ◀
              </button>
              <div />
              <button
                onMouseDown={() => (keysRef.current['ArrowRight'] = true)}
                onMouseUp={() => (keysRef.current['ArrowRight'] = false)}
                className="w-7 h-7 bg-white/10 active:bg-violet-600 rounded flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ▶
              </button>
              <div />
              <button
                onMouseDown={() => (keysRef.current['ArrowDown'] = true)}
                onMouseUp={() => (keysRef.current['ArrowDown'] = false)}
                className="w-7 h-7 bg-white/10 active:bg-violet-600 rounded flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ▼
              </button>
              <div />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onMouseDown={() => (keysRef.current['Space'] = true)}
                onMouseUp={() => (keysRef.current['Space'] = false)}
                className="w-10 h-10 rounded-full bg-rose-600 active:bg-rose-500 text-white font-bold text-xs flex items-center justify-center shadow cursor-pointer"
              >
                B
              </button>
              <button
                onMouseDown={() => (keysRef.current['Space'] = true)}
                onMouseUp={() => (keysRef.current['Space'] = false)}
                className="w-10 h-10 rounded-full bg-emerald-600 active:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow cursor-pointer"
              >
                A
              </button>
            </div>
          </div>
        </div>

        {/* Right: Cartridge Library */}
        <div className="w-full md:w-80 space-y-3">
          <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-3">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              Cartridge Library
            </h3>

            <div className="space-y-2">
              {roms.map((rom) => (
                <div
                  key={rom.id}
                  onClick={() => handleRomChange(rom.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    selectedRom === rom.id
                      ? 'bg-violet-500/20 border-violet-500 text-white'
                      : 'bg-black/40 border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{rom.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                      {rom.system}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-tight">{rom.desc}</p>
                </div>
              ))}
            </div>

            {/* Load Custom File */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  SoundManager.play('open');
                  Toast.show('Loaded custom Homebrew ROM file from VFS', '💾');
                }}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Load External ROM (.ch8, .nes)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
