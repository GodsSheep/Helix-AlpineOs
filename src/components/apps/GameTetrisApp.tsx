import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Play, ArrowLeft, ArrowRight, ArrowDown, RotateCw } from 'lucide-react';

const ROWS = 16;
const COLS = 10;

const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[1, 0, 0], [1, 1, 1]], // L
  [[0, 0, 1], [1, 1, 1]], // J
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
];

const COLORS = [
  'bg-cyan-400 shadow-[0_0_10px_#22d3ee]',
  'bg-amber-400 shadow-[0_0_10px_#fbbf24]',
  'bg-purple-500 shadow-[0_0_10px_#a855f7]',
  'bg-orange-500 shadow-[0_0_10px_#f97316]',
  'bg-blue-500 shadow-[0_0_10px_#3b82f6]',
  'bg-[#6ee7b7] shadow-[0_0_10px_#6ee7b7]',
  'bg-rose-500 shadow-[0_0_10px_#f43f5e]',
];

export const GameTetrisApp: React.FC = () => {
  const [grid, setGrid] = useState<number[][]>(Array(ROWS).fill(0).map(() => Array(COLS).fill(0)));
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const currentPieceRef = useRef<{ shape: number[][]; x: number; y: number; colorIndex: number }>({
    shape: [[1, 1, 1, 1]],
    x: 3,
    y: 0,
    colorIndex: 0
  });

  const [renderTrigger, setRenderTrigger] = useState(0);

  const spawnPiece = () => {
    const idx = Math.floor(Math.random() * SHAPES.length);
    currentPieceRef.current = {
      shape: SHAPES[idx],
      x: Math.floor(COLS / 2) - Math.floor(SHAPES[idx][0].length / 2),
      y: 0,
      colorIndex: idx + 1
    };
    // Check game over
    if (checkCollision(currentPieceRef.current.shape, currentPieceRef.current.x, currentPieceRef.current.y, grid)) {
      setGameOver(true);
      setIsPlaying(false);
    }
  };

  const checkCollision = (shape: number[][], px: number, py: number, board: number[][]) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          let newX = px + c;
          let newY = py + r;
          if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
          if (newY >= 0 && board[newY][newX]) return true;
        }
      }
    }
    return false;
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
      setScore(s => s + cleared * 100 * cleared);
      setLines(l => l + cleared);
    }
    spawnPiece();
  };

  const moveLeft = () => {
    if (!isPlaying || gameOver) return;
    const { shape, x, y } = currentPieceRef.current;
    if (!checkCollision(shape, x - 1, y, grid)) {
      currentPieceRef.current.x--;
      setRenderTrigger(n => n + 1);
    }
  };

  const moveRight = () => {
    if (!isPlaying || gameOver) return;
    const { shape, x, y } = currentPieceRef.current;
    if (!checkCollision(shape, x + 1, y, grid)) {
      currentPieceRef.current.x++;
      setRenderTrigger(n => n + 1);
    }
  };

  const moveDown = () => {
    if (!isPlaying || gameOver) return;
    const { shape, x, y } = currentPieceRef.current;
    if (!checkCollision(shape, x, y + 1, grid)) {
      currentPieceRef.current.y++;
      setRenderTrigger(n => n + 1);
    } else {
      mergePiece();
    }
  };

  const rotate = () => {
    if (!isPlaying || gameOver) return;
    const { shape, x, y } = currentPieceRef.current;
    const rotated = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
    if (!checkCollision(rotated, x, y, grid)) {
      currentPieceRef.current.shape = rotated;
      setRenderTrigger(n => n + 1);
    }
  };

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const interval = setInterval(() => {
      moveDown();
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, grid]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft();
      if (e.key === 'ArrowRight' || e.key === 'd') moveRight();
      if (e.key === 'ArrowDown' || e.key === 's') moveDown();
      if (e.key === 'ArrowUp' || e.key === 'w') rotate();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, grid]);

  const startGame = () => {
    setGrid(Array(ROWS).fill(0).map(() => Array(COLS).fill(0)));
    setScore(0);
    setLines(0);
    setGameOver(false);
    setIsPlaying(true);
    spawnPiece();
  };

  // Build display grid incorporating current falling piece
  const displayGrid = grid.map(row => [...row]);
  if (isPlaying && !gameOver) {
    const { shape, x, y, colorIndex } = currentPieceRef.current;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] && y + r >= 0 && y + r < ROWS && x + c >= 0 && x + c < COLS) {
          displayGrid[y + r][x + c] = colorIndex;
        }
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#12141c] text-[#edf1f7] text-xs select-none items-center justify-center p-4">
      <div className="max-w-xs w-full bg-[#181b26] border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <div>
            <div className="font-bold text-sm text-cyan-400">🧱 Alpine Tetris</div>
            <div className="text-[10px] font-mono text-gray-400">Lines: {lines}</div>
          </div>
          <div className="font-mono bg-black/40 px-3 py-1 rounded-xl border border-white/10 text-center">
            <div className="text-[9px] text-gray-400">SCORE</div>
            <strong className="text-white text-xs">{score}</strong>
          </div>
        </div>

        <div className="relative bg-black/80 border-2 border-white/20 rounded-xl overflow-hidden p-1 mb-4 grid grid-cols-10 gap-0.5">
          {displayGrid.flat().map((cellVal, idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-sm ${
                cellVal === 0 ? 'bg-white/5' : COLORS[cellVal - 1] || 'bg-cyan-400'
              }`}
            />
          ))}

          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
              <div className={`font-bold text-sm mb-2 ${gameOver ? 'text-red-400' : 'text-cyan-400'}`}>
                {gameOver ? 'STACK OVERFLOW!' : 'ALPINE TETRIS'}
              </div>
              {gameOver && <div className="font-mono text-gray-300 text-xs mb-3">Final Score: {score}</div>}
              <button
                onClick={startGame}
                className="px-5 py-2 rounded-xl bg-cyan-400 text-black font-bold hover:bg-cyan-300 transition cursor-pointer flex items-center gap-1.5 font-mono"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{gameOver ? 'Play Again' : 'Start Game'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Onscreen controls */}
        <div className="grid grid-cols-4 gap-2 w-full mb-3">
          <button onClick={moveLeft} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button onClick={rotate} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer">
            <RotateCw className="w-4 h-4" />
          </button>
          <button onClick={moveDown} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer">
            <ArrowDown className="w-4 h-4" />
          </button>
          <button onClick={moveRight} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => { setIsPlaying(false); setScore(0); setGameOver(false); }}
          className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 font-mono transition cursor-pointer flex items-center justify-center gap-2 text-gray-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
