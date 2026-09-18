import React, { useState, useEffect } from 'react';
import { RefreshCw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

export const Game2048App: React.FC = () => {
  const [board, setBoard] = useState<number[][]>([
    [0, 0, 0, 0],
    [0, 2, 2, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const addNewTile = (currentBoard: number[][]): number[][] => {
    const emptyCells: [number, number][] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) emptyCells.push([r, c]);
      }
    }
    if (emptyCells.length === 0) return currentBoard;
    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = currentBoard.map(rowArr => [...rowArr]);
    newBoard[row][col] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  };

  const resetGame = () => {
    let newBoard = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    newBoard = addNewTile(addNewTile(newBoard));
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  useEffect(() => {
    resetGame();
  }, []);

  const slideRow = (row: number[]) => {
    let arr = row.filter(val => val !== 0);
    let newRow: number[] = [];
    let points = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === arr[i + 1]) {
        newRow.push(arr[i] * 2);
        points += arr[i] * 2;
        if (arr[i] * 2 === 2048) setWon(true);
        i++;
      } else {
        newRow.push(arr[i]);
      }
    }
    while (newRow.length < 4) newRow.push(0);
    return { row: newRow, points };
  };

  const rotateLeft = (matrix: number[][]) => {
    const n = matrix.length;
    const res = Array(n).fill(0).map(() => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        res[n - 1 - c][r] = matrix[r][c];
      }
    }
    return res;
  };

  const rotateRight = (matrix: number[][]) => {
    const n = matrix.length;
    const res = Array(n).fill(0).map(() => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        res[c][n - 1 - r] = matrix[r][c];
      }
    }
    return res;
  };

  const moveLeft = (currentBoard: number[][]) => {
    let totalPoints = 0;
    const newBoard = currentBoard.map(row => {
      const { row: slid, points } = slideRow(row);
      totalPoints += points;
      return slid;
    });
    return { board: newBoard, points: totalPoints };
  };

  const handleMove = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return;
    let rotated = board;
    if (direction === 'right') rotated = board.map(r => [...r].reverse());
    if (direction === 'up') rotated = rotateLeft(board);
    if (direction === 'down') rotated = rotateRight(board);

    const { board: moved, points } = moveLeft(rotated);

    let finalBoard = moved;
    if (direction === 'right') finalBoard = moved.map(r => [...r].reverse());
    if (direction === 'up') finalBoard = rotateRight(moved);
    if (direction === 'down') finalBoard = rotateLeft(moved);

    if (JSON.stringify(board) !== JSON.stringify(finalBoard)) {
      const updated = addNewTile(finalBoard);
      setBoard(updated);
      setScore(s => {
        const nextScore = s + points;
        setBestScore(b => Math.max(b, nextScore));
        return nextScore;
      });

      // Check game over
      let hasMoves = false;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (updated[r][c] === 0) hasMoves = true;
          if (c < 3 && updated[r][c] === updated[r][c + 1]) hasMoves = true;
          if (r < 3 && updated[r][c] === updated[r + 1][c]) hasMoves = true;
        }
      }
      if (!hasMoves) setGameOver(true);
    }
  };

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart || !e.changedTouches[0]) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 20) {
      if (absX > absY) {
        handleMove(dx > 0 ? 'right' : 'left');
      } else {
        handleMove(dy > 0 ? 'down' : 'up');
      }
    }
    setTouchStart(null);
  };

  const getTileColor = (val: number) => {
    switch (val) {
      case 2: return 'bg-white/10 text-white';
      case 4: return 'bg-white/20 text-white';
      case 8: return 'bg-amber-500/30 text-amber-300';
      case 16: return 'bg-amber-500/60 text-white';
      case 32: return 'bg-orange-500/70 text-white';
      case 64: return 'bg-rose-500/70 text-white';
      case 128: return 'bg-purple-500/80 text-white font-bold shadow-[0_0_15px_#a855f7]';
      case 256: return 'bg-[#6ee7b7]/60 text-black font-bold';
      case 512: return 'bg-[#6ee7b7] text-black font-bold shadow-[0_0_20px_#6ee7b7]';
      case 1024: return 'bg-cyan-400 text-black font-extrabold shadow-[0_0_25px_#22d3ee]';
      case 2048: return 'bg-amber-400 text-black font-extrabold shadow-[0_0_30px_#fbbf24] animate-pulse';
      default: return 'bg-white/5 text-transparent';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#12141c] text-[#edf1f7] text-xs select-none items-center justify-center p-4">
      <div className="max-w-xs w-full bg-[#181b26] border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <div>
            <div className="font-bold text-sm text-[#6ee7b7]">Helix 2048</div>
            <div className="text-[10px] font-mono text-gray-400">Join tiles to 2048!</div>
          </div>
          <div className="flex gap-2">
            <div className="font-mono bg-black/40 px-2.5 py-1 rounded-xl border border-white/10 text-center">
              <div className="text-[9px] text-gray-400">SCORE</div>
              <strong className="text-white text-xs">{score}</strong>
            </div>
            <div className="font-mono bg-black/40 px-2.5 py-1 rounded-xl border border-white/10 text-center">
              <div className="text-[9px] text-gray-400">BEST</div>
              <strong className="text-amber-400 text-xs">{bestScore}</strong>
            </div>
          </div>
        </div>

        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative grid grid-cols-4 gap-2 bg-black/60 p-3 rounded-2xl border border-white/15 mb-4 touch-none select-none cursor-grab"
        >
          {board.flat().map((val, idx) => (
            <div
              key={idx}
              className={`w-14 h-14 rounded-xl flex items-center justify-center font-mono font-bold text-sm transition-all duration-100 ${getTileColor(val)}`}
            >
              {val !== 0 ? val : ''}
            </div>
          ))}

          {(gameOver || won) && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center">
              <div className={`font-bold text-base mb-1 ${won ? 'text-[#6ee7b7]' : 'text-red-400'}`}>
                {won ? 'VICTORY! 2048 REACHED!' : 'GAME OVER!'}
              </div>
              <div className="font-mono text-gray-300 text-xs mb-3">Final Score: {score}</div>
              <button
                onClick={resetGame}
                className="px-4 py-2 rounded-xl bg-[#6ee7b7] text-black font-bold hover:bg-[#5cd4a4] transition cursor-pointer font-mono"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Onscreen controls */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[200px] mb-3">
          <div />
          <button onClick={() => handleMove('up')} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer">
            <ArrowUp className="w-4 h-4" />
          </button>
          <div />
          <button onClick={() => handleMove('left')} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button onClick={() => handleMove('down')} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer">
            <ArrowDown className="w-4 h-4" />
          </button>
          <button onClick={() => handleMove('right')} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={resetGame}
          className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 font-mono font-medium transition cursor-pointer flex items-center justify-center gap-2 text-gray-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Game</span>
        </button>
      </div>
    </div>
  );
};
