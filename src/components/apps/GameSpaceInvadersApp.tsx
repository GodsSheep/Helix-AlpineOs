import React, { useRef, useEffect, useState } from 'react';
import { Toast } from '../../kernel/Toast';
import { RotateCcw, Trophy, Volume2, Shield } from 'lucide-react';

export const GameSpaceInvadersApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const livesRef = useRef(3);
  livesRef.current = lives;
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('helix_invaders_high') || '0', 10);
    } catch {
      return 0;
    }
  });

  const gameStateRef = useRef({
    playerX: 200,
    playerWidth: 32,
    playerSpeed: 5,
    movingLeft: false,
    movingRight: false,
    shooting: false,
    bullets: [] as { x: number; y: number; vy: number }[],
    aliens: [] as { x: number; y: number; alive: boolean; type: number }[],
    alienDirection: 1,
    alienSpeed: 0.8,
    alienDropDistance: 12,
    lastAlienShootTime: 0,
    alienBullets: [] as { x: number; y: number; vy: number }[],
  });

  const initGame = () => {
    const aliens = [];
    const rows = 4;
    const cols = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        aliens.push({
          x: 40 + c * 40,
          y: 35 + r * 28,
          alive: true,
          type: r % 2,
        });
      }
    }
    gameStateRef.current = {
      playerX: 200,
      playerWidth: 32,
      playerSpeed: 5,
      movingLeft: false,
      movingRight: false,
      shooting: false,
      bullets: [],
      aliens,
      alienDirection: 1,
      alienSpeed: 0.8,
      alienDropDistance: 12,
      lastAlienShootTime: 0,
      alienBullets: [],
    };
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setIsVictory(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        gameStateRef.current.movingLeft = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        gameStateRef.current.movingRight = true;
      } else if (e.code === 'Space') {
        // Fire bullet
        const gs = gameStateRef.current;
        if (gs.bullets.length < 3) {
          gs.bullets.push({
            x: gs.playerX + gs.playerWidth / 2,
            y: 340,
            vy: -7,
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        gameStateRef.current.movingLeft = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        gameStateRef.current.movingRight = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Game Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      if (!isGameOver && !isVictory) {
        const gs = gameStateRef.current;

        // Player Movement
        if (gs.movingLeft) gs.playerX = Math.max(10, gs.playerX - gs.playerSpeed);
        if (gs.movingRight) gs.playerX = Math.min(canvas.width - gs.playerWidth - 10, gs.playerX + gs.playerSpeed);

        // Update Player Bullets
        for (let i = gs.bullets.length - 1; i >= 0; i--) {
          const b = gs.bullets[i];
          b.y += b.vy;
          if (b.y < 0) {
            gs.bullets.splice(i, 1);
            continue;
          }

          // Check bullet hit on alien
          for (const alien of gs.aliens) {
            if (alien.alive) {
              if (
                b.x >= alien.x &&
                b.x <= alien.x + 24 &&
                b.y >= alien.y &&
                b.y <= alien.y + 18
              ) {
                alien.alive = false;
                gs.bullets.splice(i, 1);
                setScore((s) => {
                  const next = s + 100;
                  if (next > highScore) {
                    setHighScore(next);
                    localStorage.setItem('helix_invaders_high', next.toString());
                  }
                  return next;
                });
                break;
              }
            }
          }
        }

        // Alien Movement & Wall Bounce
        let hitWall = false;
        let anyAlive = false;
        for (const a of gs.aliens) {
          if (a.alive) {
            anyAlive = true;
            if (
              (gs.alienDirection > 0 && a.x + 24 >= canvas.width - 15) ||
              (gs.alienDirection < 0 && a.x <= 15)
            ) {
              hitWall = true;
            }
            if (a.y >= 330) {
              setIsGameOver(true);
              Toast.show('Invaders reached Earth base!', '💥');
            }
          }
        }

        if (!anyAlive) {
          setIsVictory(true);
          Toast.show('Sector Cleared! Earth is safe!', '🏆');
        }

        if (hitWall) {
          gs.alienDirection *= -1;
          for (const a of gs.aliens) {
            a.y += gs.alienDropDistance;
          }
        } else {
          for (const a of gs.aliens) {
            a.x += gs.alienDirection * gs.alienSpeed;
          }
        }

        // Alien Random Fire
        if (Date.now() - gs.lastAlienShootTime > 1200) {
          gs.lastAlienShootTime = Date.now();
          const aliveAliens = gs.aliens.filter((a) => a.alive);
          if (aliveAliens.length > 0) {
            const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
            gs.alienBullets.push({ x: shooter.x + 12, y: shooter.y + 18, vy: 3.5 });
          }
        }

        // Update Alien Bullets
        for (let i = gs.alienBullets.length - 1; i >= 0; i--) {
          const ab = gs.alienBullets[i];
          ab.y += ab.vy;
          if (ab.y > canvas.height) {
            gs.alienBullets.splice(i, 1);
            continue;
          }

          // Check hit on player
          if (
            ab.x >= gs.playerX &&
            ab.x <= gs.playerX + gs.playerWidth &&
            ab.y >= 340 &&
            ab.y <= 360
          ) {
            gs.alienBullets.splice(i, 1);
            const nextLives = livesRef.current - 1;
            setLives(nextLives);
            if (nextLives <= 0) {
              setIsGameOver(true);
              Toast.show('Player Cannon Destroyed!', '💥');
            }
          }
        }
      }

      // RENDER
      ctx.fillStyle = '#06080e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 37 + Date.now() * 0.02) % canvas.width;
        const sy = (i * 29) % canvas.height;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      const gs = gameStateRef.current;

      // Draw Player Cannon
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(gs.playerX, 350, gs.playerWidth, 10);
      ctx.fillRect(gs.playerX + 12, 342, 8, 8);

      // Draw Player Bullets
      ctx.fillStyle = '#38bdf8';
      for (const b of gs.bullets) {
        ctx.fillRect(b.x - 1.5, b.y, 3, 10);
      }

      // Draw Aliens
      for (const a of gs.aliens) {
        if (!a.alive) continue;
        ctx.fillStyle = a.type === 0 ? '#f43f5e' : '#fbbf24';
        ctx.fillRect(a.x, a.y, 22, 14);
        ctx.fillStyle = '#06080e';
        ctx.fillRect(a.x + 4, a.y + 3, 3, 3);
        ctx.fillRect(a.x + 15, a.y + 3, 3, 3);
      }

      // Draw Alien Bullets
      ctx.fillStyle = '#f43f5e';
      for (const ab of gs.alienBullets) {
        ctx.fillRect(ab.x - 1.5, ab.y, 3, 8);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isGameOver, isVictory, highScore]);

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden items-center justify-between p-3">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-white/10 shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-base">👾</span>
          <span className="font-semibold text-sm">Alpine Galaxy Invaders</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-emerald-400 font-bold">SCORE: {score}</div>
          <div className="text-rose-400 font-bold">LIVES: {'❤️'.repeat(Math.max(0, lives))}</div>
          <div className="text-amber-400 font-bold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>{highScore}</span>
          </div>
        </div>
      </div>

      {/* Screen Canvas */}
      <div className="relative border-2 border-cyan-500/40 rounded-xl bg-[#06080e] p-1 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={420}
          height={380}
          className="rounded-lg bg-[#06080e] block"
        />

        {isGameOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center space-y-2 rounded-lg">
            <span className="text-xl font-bold text-rose-500 tracking-wider">EARTH HAS FALLEN</span>
            <span className="text-sm font-mono text-gray-300">Final Defense Score: {score}</span>
            <button
              onClick={initGame}
              className="px-3 py-1.5 bg-emerald-500 text-black font-bold rounded-lg flex items-center gap-1.5 hover:bg-emerald-400 transition text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Re-engage Fleet
            </button>
          </div>
        )}

        {isVictory && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center space-y-2 rounded-lg">
            <span className="text-xl font-bold text-emerald-400 tracking-wider">SECTOR DEFENDED!</span>
            <span className="text-sm font-mono text-gray-300">Score: {score}</span>
            <button
              onClick={initGame}
              className="px-3 py-1.5 bg-emerald-500 text-black font-bold rounded-lg flex items-center gap-1.5 hover:bg-emerald-400 transition text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Next Wave
            </button>
          </div>
        )}
      </div>

      {/* Touch On-Screen Controls */}
      <div className="flex items-center justify-between w-full max-w-xs my-2">
        <div className="flex gap-2">
          <button
            onTouchStart={() => { gameStateRef.current.movingLeft = true; }}
            onTouchEnd={() => { gameStateRef.current.movingLeft = false; }}
            onMouseDown={() => { gameStateRef.current.movingLeft = true; }}
            onMouseUp={() => { gameStateRef.current.movingLeft = false; }}
            className="w-14 h-12 bg-white/10 active:bg-cyan-500 rounded-xl text-base font-bold flex items-center justify-center cursor-pointer select-none shadow hover:bg-white/20 transition"
          >
            ◀
          </button>
          <button
            onTouchStart={() => { gameStateRef.current.movingRight = true; }}
            onTouchEnd={() => { gameStateRef.current.movingRight = false; }}
            onMouseDown={() => { gameStateRef.current.movingRight = true; }}
            onMouseUp={() => { gameStateRef.current.movingRight = false; }}
            className="w-14 h-12 bg-white/10 active:bg-cyan-500 rounded-xl text-base font-bold flex items-center justify-center cursor-pointer select-none shadow hover:bg-white/20 transition"
          >
            ▶
          </button>
        </div>
        <button
          onClick={() => {
            const gs = gameStateRef.current;
            if (gs.bullets.length < 3) {
              gs.bullets.push({
                x: gs.playerX + gs.playerWidth / 2,
                y: 340,
                vy: -7,
              });
            }
          }}
          className="px-5 h-12 bg-rose-500/30 active:bg-rose-500 text-rose-300 active:text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer select-none border border-rose-500/50 shadow hover:bg-rose-500/40 transition"
        >
          <span>🔥 FIRE</span>
        </button>
      </div>

      {/* Footer controls */}
      <div className="w-full flex items-center justify-between pt-2 border-t border-white/10 shrink-0 text-gray-400 text-[11px]">
        <div>
          <span>Move: <strong className="text-white">A / D / Touch</strong></span>
          <span className="mx-2">•</span>
          <span>Fire: <strong className="text-white">Space / Button</strong></span>
        </div>
        <button
          onClick={initGame}
          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
