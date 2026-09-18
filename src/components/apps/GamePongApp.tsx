import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw, Trophy, Cpu } from 'lucide-react';
import { Toast } from '../../kernel/Toast';

export const GamePongApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [rallyCount, setRallyCount] = useState(0);

  const stateRef = useRef({
    ballX: 200,
    ballY: 150,
    ballSpeedX: 4,
    ballSpeedY: 2,
    playerY: 110,
    aiY: 110,
    paddleHeight: 60,
    paddleWidth: 8,
    upPressed: false,
    downPressed: false,
  });

  const resetBall = (direction: number) => {
    stateRef.current.ballX = 200;
    stateRef.current.ballY = 150;
    const speed = difficulty === 'hard' ? 5.5 : difficulty === 'medium' ? 4.5 : 3.5;
    stateRef.current.ballSpeedX = direction * speed;
    stateRef.current.ballSpeedY = (Math.random() - 0.5) * 4;
    setRallyCount(0);
  };

  const handleResetScores = () => {
    setPlayerScore(0);
    setAiScore(0);
    resetBall(1);
    Toast.show('Scores reset to 0-0', '🔄');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') stateRef.current.upPressed = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') stateRef.current.downPressed = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') stateRef.current.upPressed = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') stateRef.current.downPressed = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;

      // Player Movement
      if (s.upPressed) s.playerY = Math.max(5, s.playerY - 6);
      if (s.downPressed) s.playerY = Math.min(canvas.height - s.paddleHeight - 5, s.playerY + 6);

      // AI Movement
      const aiSpeed = difficulty === 'hard' ? 5.0 : difficulty === 'medium' ? 3.6 : 2.5;
      const aiCenter = s.aiY + s.paddleHeight / 2;
      if (aiCenter < s.ballY - 6) s.aiY = Math.min(canvas.height - s.paddleHeight - 5, s.aiY + aiSpeed);
      else if (aiCenter > s.ballY + 6) s.aiY = Math.max(5, s.aiY - aiSpeed);

      // Ball Movement
      s.ballX += s.ballSpeedX;
      s.ballY += s.ballSpeedY;

      // Top/Bottom bounce
      if (s.ballY <= 4 || s.ballY >= canvas.height - 4) {
        s.ballSpeedY *= -1;
      }

      // Player Paddle Collision (Left side)
      if (
        s.ballX <= 20 + s.paddleWidth &&
        s.ballX >= 16 &&
        s.ballY >= s.playerY &&
        s.ballY <= s.playerY + s.paddleHeight
      ) {
        s.ballSpeedX = Math.abs(s.ballSpeedX) * 1.05; // speed up slightly
        const delta = s.ballY - (s.playerY + s.paddleHeight / 2);
        s.ballSpeedY = delta * 0.25;
        setRallyCount((c) => c + 1);
      }

      // AI Paddle Collision (Right side)
      if (
        s.ballX >= canvas.width - 20 - s.paddleWidth &&
        s.ballX <= canvas.width - 16 &&
        s.ballY >= s.aiY &&
        s.ballY <= s.aiY + s.paddleHeight
      ) {
        s.ballSpeedX = -Math.abs(s.ballSpeedX) * 1.05;
        const delta = s.ballY - (s.aiY + s.paddleHeight / 2);
        s.ballSpeedY = delta * 0.25;
        setRallyCount((c) => c + 1);
      }

      // Goal Scored
      if (s.ballX < 0) {
        setAiScore((prev) => prev + 1);
        resetBall(1);
      } else if (s.ballX > canvas.width) {
        setPlayerScore((prev) => prev + 1);
        resetBall(-1);
      }

      // RENDER
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center net
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Player Paddle
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(20, s.playerY, s.paddleWidth, s.paddleHeight);

      // Draw AI Paddle
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(canvas.width - 20 - s.paddleWidth, s.aiY, s.paddleWidth, s.paddleHeight);

      // Draw Ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, 5, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [difficulty]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    stateRef.current.playerY = Math.max(5, Math.min(canvas.height - stateRef.current.paddleHeight - 5, mouseY - stateRef.current.paddleHeight / 2));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return;
    const rect = canvas.getBoundingClientRect();
    const touchY = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
    stateRef.current.playerY = Math.max(5, Math.min(canvas.height - stateRef.current.paddleHeight - 5, touchY - stateRef.current.paddleHeight / 2));
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden items-center justify-between p-3">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-white/10 shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-base">🏓</span>
          <span className="font-semibold text-sm">Cyber Pong vs Alpine AI</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded border border-white/10">
            <span className="text-gray-400 text-[10px]">AI DIFFICULTY:</span>
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-1.5 py-0.5 rounded text-[10px] uppercase cursor-pointer ${
                  difficulty === d ? 'bg-emerald-500 text-black font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="w-full flex items-center justify-around font-mono text-2xl font-bold py-1">
        <div className="text-emerald-400 flex items-center gap-2">
          <span className="text-xs text-gray-400">PLAYER</span>
          <span>{playerScore}</span>
        </div>
        <div className="text-gray-600 text-sm">Rally: {rallyCount}</div>
        <div className="text-rose-400 flex items-center gap-2">
          <span>{aiScore}</span>
          <span className="text-xs text-gray-400">ALPINE AI</span>
        </div>
      </div>

      {/* Table Canvas */}
      <div className="border-2 border-emerald-500/40 rounded-xl bg-[#06080d] p-1 shadow-2xl touch-none">
        <canvas
          ref={canvasRef}
          width={440}
          height={280}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="rounded-lg bg-[#06080d] block cursor-pointer max-w-full"
        />
      </div>

      {/* Onscreen Touch Controls */}
      <div className="flex gap-4 my-1">
        <button
          onClick={() => { stateRef.current.playerY = Math.max(5, stateRef.current.playerY - 25); }}
          className="px-5 py-2 rounded-xl bg-white/10 active:bg-emerald-500 hover:bg-white/20 text-white font-bold transition cursor-pointer select-none"
        >
          ▲ UP
        </button>
        <button
          onClick={() => { stateRef.current.playerY = Math.min(280 - stateRef.current.paddleHeight - 5, stateRef.current.playerY + 25); }}
          className="px-5 py-2 rounded-xl bg-white/10 active:bg-emerald-500 hover:bg-white/20 text-white font-bold transition cursor-pointer select-none"
        >
          ▼ DOWN
        </button>
      </div>

      {/* Footer */}
      <div className="w-full flex items-center justify-between pt-2 border-t border-white/10 shrink-0 text-gray-400 text-[11px]">
        <div>
          <span>Controls: <strong className="text-white">Mouse / Touch</strong> or <strong className="text-white">W / S / Arrows</strong></span>
        </div>
        <button
          onClick={handleResetScores}
          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Scores</span>
        </button>
      </div>
    </div>
  );
};
