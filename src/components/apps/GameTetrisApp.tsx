import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Play, ArrowLeft, ArrowRight, ArrowDown, RotateCw, Trophy, Zap, Pause } from 'lucide-react';
import { SoundManager } from '../../kernel/SoundManager';
import { Toast } from '../../kernel/Toast';

const ROWS = 18;
const COLS = 10;

const SHAPES = [
  [[1, 1, 1, 1]], // I (cyan)
  [[1, 1], [1, 1]], // O (yellow)
  [[0, 1, 0], [1, 1, 1]], // T (purple)
  [[1, 0, 0], [1, 1, 1]], // L (orange)
  [[0, 0, 1], [1, 1, 1]], // J (blue)
  [[0, 1, 1], [1, 1, 0]], // S (emerald)
  [[1, 1, 0], [0, 1, 1]], // Z (rose)
];

const COLORS = [
  'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]',
  'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
  'bg-purple-500 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]',
  'bg-orange-500 border-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.5)]',
  'bg-blue-500 border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]',
  'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  'bg-rose-500 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
];

export const GameTetrisApp: React.FC = () => {
  const [grid, setGrid] = useState<number[][]>(() => Array(ROWS).fill(0).map(() => Array(COLS).fill(0)));
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('helix_tetris_highscore') || '0', 10);
  });
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [holdPiece, setHoldPiece] = useState<number | null>(null);
  const [hasHeldThisTurn, setHasHeldThisTurn] = useState(false);

  const currentPieceRef = useRef<{ shape: number[][]; x: number; y: number; colorIndex: number }>({
    shape: [[1, 1, 1, 1]],
    x: 3,
    y: 0,
    colorIndex: 0
  });

  const [, setRenderTrigger] = useState(0);

  const checkCollision = (shape: number[][], px: number, py: number, board: number[][]) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newX = px + c;
          const newY = py + r;
          if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
          if (newY >= 0 && board[newY][newX]) return true;
        }
      }
    }
    return false;
  };

  const spawnPiece = (givenIdx?: number) => {
    const idx = givenIdx !== undefined ? givenIdx : Math.floor(Math.random() * SHAPES.length);
    const newPiece = {
      shape: SHAPES[idx],
      x: Math.floor(COLS / 2) - Math.floor(SHAPES[idx][0].length / 2),
      y: 0,
      colorIndex: idx + 1
    };

    if (checkCollision(newPiece.shape, newPiece.x, newPiece.y, grid)) {
      setGameOver(true);
      setIsPlaying(false);
      SoundManager.play('error');
      setHighScore(h => {
        const best = Math.max(h, score);
        localStorage.setItem('helix_tetris_highscore', best.toString());
        return best;
      });
      return;
    }

    currentPieceRef.current = newPiece;
    setHasHeldThisTurn(false);
    setRenderTrigger(t => t + 1);
  };

  const mergePiece = () => {
    const { shape, x, y, colorIndex } = currentPieceRef.current;
    const newGrid = grid.map(row => [...row]);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] && y + r >= 0) {
          newGrid[y + r][x + c] = colorIndex;
        }
      }
    }

    // Clear full rows
    let cleared = 0;
    const filteredGrid = newGrid.filter(row => {
      const isFull = row.every(cell => cell !== 0);
      if (isFull) cleared++;
      return !isFull;
    });

    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(0));
    }

    setGrid(filteredGrid);
    if (cleared > 0) {
      SoundManager.play('success');
      const pointMultiplier = [0, 100, 300, 500, 800][cleared] || 1000;
      setScore(s => s + pointMultiplier * level);
      setLines(l => {
        const total = l + cleared;
        const newLvl = Math.floor(total / 10) + 1;
        setLevel(newLvl);
        return total;
      });
      Toast.show(cleared === 4 ? '🔥 TETRIS 4-LINE CLEAR!' : `Cleared ${cleared} lines!`, '⚡');
    } else {
      SoundManager.play('click');
    }

    spawnPiece();
  };

  const moveLeft = () => {
    if (!isPlaying || gameOver) return;
    const { shape, x, y } = currentPieceRef.current;
    if (!checkCollision(shape, x - 1, y, grid)) {
      currentPieceRef.current.x -= 1;
      setRenderTrigger(t => t + 1);
      SoundManager.play('click');
    }
  };

  const moveRight = () => {
    if (!isPlaying || gameOver) return;
    const { shape, x, y } = currentPieceRef.current;
    if (!checkCollision(shape, x + 1, y, grid)) {
      currentPieceRef.current.x += 1;
      setRenderTrigger(t => t + 1);
      SoundManager.play('click');
    }
  };

  const moveDown = () => {
    if (!isPlaying || gameOver) return;
    const { shape, x, y } = currentPieceRef.current;
    if (!checkCollision(shape, x, y + 1, grid)) {
      currentPieceRef.current.y += 1;
      setScore(s => s + 1);
      setRenderTrigger(t => t + 1);
    } else {
      mergePiece();
    }
  };

  const hardDrop = () => {
    if (!isPlaying || gameOver) return;
    const { shape, x } = currentPieceRef.current;
    let newY = currentPieceRef.current.y;
    while (!checkCollision(shape, x, newY + 1, grid)) {
      newY += 1;
    }
    currentPieceRef.current.y = newY;
    setScore(s => s + (newY * 2));
    SoundManager.play('launch');
    mergePiece();
  };

  const rotate = () => {
    if (!isPlaying || gameOver) return;
    const { shape, x, y } = currentPieceRef.current;
    const rotated = shape[0].map((_, index) => shape.map(row => row[index]).reverse());
    if (!checkCollision(rotated, x, y, grid)) {
      currentPieceRef.current.shape = rotated;
      setRenderTrigger(t => t + 1);
      SoundManager.play('click');
    }
  };

  const holdCurrentPiece = () => {
    if (!isPlaying || gameOver || hasHeldThisTurn) return;
    const currentIdx = currentPieceRef.current.colorIndex - 1;
    if (holdPiece === null) {
      setHoldPiece(currentIdx);
      spawnPiece();
    } else {
      const nextIdx = holdPiece;
      setHoldPiece(currentIdx);
      spawnPiece(nextIdx);
    }
    setHasHeldThisTurn(true);
    SoundManager.play('toast');
    Toast.show('Piece held', '📦');
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft();
      else if (e.key === 'ArrowRight' || e.key === 'd') moveRight();
      else if (e.key === 'ArrowDown' || e.key === 's') moveDown();
      else if (e.key === 'ArrowUp' || e.key === 'w') rotate();
      else if (e.key === ' ') {
        e.preventDefault();
        hardDrop();
      } else if (e.key === 'c' || e.key === 'Shift') {
        holdCurrentPiece();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, grid, holdPiece, hasHeldThisTurn]);

  // Gravity timer loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const speed = Math.max(120, 600 - (level - 1) * 50);
    const interval = setInterval(moveDown, speed);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, level, grid]);

  const startGame = () => {
    setGrid(Array(ROWS).fill(0).map(() => Array(COLS).fill(0)));
    setScore(0);
    setLines(0);
    setLevel(1);
    setHoldPiece(null);
    setGameOver(false);
    setIsPlaying(true);
    spawnPiece();
    SoundManager.play('open');
  };

  // Compute ghost piece position
  const getGhostY = () => {
    const { shape, x, y } = currentPieceRef.current;
    let gy = y;
    while (!checkCollision(shape, x, gy + 1, grid)) {
      gy += 1;
    }
    return gy;
  };

  const ghostY = isPlaying ? getGhostY() : 0;

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs select-none items-center justify-center p-3 font-mono">
      <div className="max-w-xl w-full bg-[#131622] border border-white/15 rounded-3xl p-4 shadow-2xl flex flex-col items-center">
        {/* Top HUD */}
        <div className="w-full flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-cyan-400">🧱 Alpine Matrix Tetris</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Lvl {level}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>Lines: <strong className="text-emerald-400">{lines}</strong></div>
            <div>Score: <strong className="text-white">{score}</strong></div>
            <div>Best: <strong className="text-amber-400">{highScore}</strong></div>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          {/* Left Side: Hold Box */}
          <div className="w-20 bg-[#0a0c12] border border-white/10 rounded-2xl p-2.5 flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-bold mb-2">HOLD (C)</span>
            <div className="w-14 h-14 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center">
              {holdPiece !== null ? (
                <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${SHAPES[holdPiece][0].length}, minmax(0, 1fr))` }}>
                  {SHAPES[holdPiece].map((row, r) =>
                    row.map((cell, c) => (
                      <div
                        key={`${r}-${c}`}
                        className={`w-2.5 h-2.5 rounded-sm ${cell ? COLORS[holdPiece] : 'bg-transparent'}`}
                      />
                    ))
                  )}
                </div>
              ) : (
                <span className="text-gray-600 text-[10px]">-</span>
              )}
            </div>
          </div>

          {/* Center Stage: Tetris Grid */}
          <div className="relative bg-[#0a0c12] border-2 border-white/20 rounded-2xl p-2 shadow-inner">
            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${COLS}, 18px)`,
                gridTemplateRows: `repeat(${ROWS}, 18px)`
              }}
            >
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  let cellColor = 'bg-black/50 border border-white/5';
                  let isGhost = false;

                  if (cell !== 0) {
                    cellColor = COLORS[cell - 1];
                  } else if (isPlaying) {
                    const { shape, x, y, colorIndex } = currentPieceRef.current;
                    const pr = r - y;
                    const pc = c - x;
                    if (pr >= 0 && pr < shape.length && pc >= 0 && pc < shape[pr].length && shape[pr][pc]) {
                      cellColor = COLORS[colorIndex - 1];
                    } else {
                      // Ghost piece check
                      const gpr = r - ghostY;
                      if (gpr >= 0 && gpr < shape.length && pc >= 0 && pc < shape[gpr].length && shape[gpr][pc]) {
                        isGhost = true;
                      }
                    }
                  }

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`w-[18px] h-[18px] rounded-[3px] transition-all ${
                        isGhost ? 'border border-dashed border-white/30 bg-white/5' : cellColor
                      }`}
                    />
                  );
                })
              )}
            </div>

            {/* Game Over Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-3 text-center">
                <div className="text-lg font-bold text-rose-400 mb-1">GAME OVER</div>
                <div className="text-gray-300 text-xs mb-3">Score: {score}</div>
                <button
                  onClick={startGame}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> <span>Play Again</span>
                </button>
              </div>
            )}

            {!isPlaying && !gameOver && (
              <div className="absolute inset-0 bg-black/75 rounded-2xl flex flex-col items-center justify-center p-3 text-center">
                <div className="text-sm font-bold text-cyan-300 mb-1">Matrix Tetris</div>
                <p className="text-[10px] text-gray-400 mb-3">Space for Hard Drop</p>
                <button
                  onClick={startGame}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow shadow-cyan-500/30"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> <span>Start Game</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Side: Keymap Guide */}
          <div className="w-28 bg-[#0a0c12] border border-white/10 rounded-2xl p-2.5 text-[10px] space-y-1.5 text-gray-400">
            <span className="font-bold text-white block pb-1 border-b border-white/10">Controls</span>
            <div><strong className="text-cyan-300">← / →</strong>: Move</div>
            <div><strong className="text-cyan-300">↑ / W</strong>: Rotate</div>
            <div><strong className="text-cyan-300">↓ / S</strong>: Soft Drop</div>
            <div><strong className="text-amber-300">Space</strong>: Hard Drop</div>
            <div><strong className="text-purple-300">C</strong>: Hold Piece</div>
          </div>
        </div>

        {/* Mobile On-Screen Controls */}
        <div className="flex gap-2 mt-3 w-full max-w-sm justify-between">
          <button onClick={moveLeft} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button onClick={rotate} className="p-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl cursor-pointer">
            <RotateCw className="w-4 h-4" />
          </button>
          <button onClick={moveDown} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white cursor-pointer">
            <ArrowDown className="w-4 h-4" />
          </button>
          <button onClick={hardDrop} className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs cursor-pointer">
            Drop
          </button>
        </div>
      </div>
    </div>
  );
};
