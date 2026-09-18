import React, { useState } from 'react';
import { RefreshCw, Bomb, Flag, ShieldCheck } from 'lucide-react';

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  count: number;
}

const ROWS = 8;
const COLS = 8;
const MINES = 10;

export const GameMinesweeperApp: React.FC = () => {
  const createBoard = (): Cell[][] => {
    let board: Cell[][] = Array(ROWS).fill(null).map(() =>
      Array(COLS).fill(null).map(() => ({ mine: false, revealed: false, flagged: false, count: 0 }))
    );

    // Place mines
    let placed = 0;
    while (placed < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (!board[r][c].mine) {
        board[r][c].mine = true;
        placed++;
      }
    }

    // Calculate counts
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!board[r][c].mine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) {
                count++;
              }
            }
          }
          board[r][c].count = count;
        }
      }
    }
    return board;
  };

  const [board, setBoard] = useState<Cell[][]>(createBoard());
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [touchMode, setTouchMode] = useState<'reveal' | 'flag'>('reveal');

  const handleCellClick = (r: number, c: number) => {
    if (status !== 'playing' || board[r][c].revealed) return;

    if (touchMode === 'flag') {
      const newBoard = board.map(row => row.map(cell => ({ ...cell })));
      newBoard[r][c].flagged = !newBoard[r][c].flagged;
      setBoard(newBoard);
      return;
    }

    if (board[r][c].flagged) return;

    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    if (newBoard[r][c].mine) {
      // Game over, reveal all mines
      newBoard.forEach(row => row.forEach(cell => {
        if (cell.mine) cell.revealed = true;
      }));
      setBoard(newBoard);
      setStatus('lost');
      return;
    }

    const revealRecursive = (rowIdx: number, colIdx: number) => {
      if (rowIdx < 0 || rowIdx >= ROWS || colIdx < 0 || colIdx >= COLS) return;
      if (newBoard[rowIdx][colIdx].revealed || newBoard[rowIdx][colIdx].flagged) return;

      newBoard[rowIdx][colIdx].revealed = true;
      if (newBoard[rowIdx][colIdx].count === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            revealRecursive(rowIdx + dr, colIdx + dc);
          }
        }
      }
    };

    revealRecursive(r, c);

    // Check win condition
    let won = true;
    for (let row of newBoard) {
      for (let cell of row) {
        if (!cell.mine && !cell.revealed) won = false;
      }
    }

    setBoard(newBoard);
    if (won) setStatus('won');
  };

  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (status !== 'playing' || board[r][c].revealed) return;
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    newBoard[r][c].flagged = !newBoard[r][c].flagged;
    setBoard(newBoard);
  };

  const resetGame = () => {
    setBoard(createBoard());
    setStatus('playing');
  };

  const getCountColor = (count: number) => {
    switch (count) {
      case 1: return 'text-cyan-400';
      case 2: return 'text-[#6ee7b7]';
      case 3: return 'text-amber-400';
      case 4: return 'text-orange-400';
      default: return 'text-rose-400';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#12141c] text-[#edf1f7] text-xs select-none items-center justify-center p-4">
      <div className="max-w-sm w-full bg-[#181b26] border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Bomb className="w-4 h-4 text-rose-400" />
            <span className="font-bold text-sm text-rose-400">Alpine Minesweeper</span>
          </div>
          <button
            onClick={resetGame}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
            title="Restart"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Touch Mode Controls */}
        <div className="flex gap-2 mb-3 w-full">
          <button
            onClick={() => setTouchMode('reveal')}
            className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
              touchMode === 'reveal'
                ? 'bg-[#6ee7b7] text-black border-[#6ee7b7]'
                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
            }`}
          >
            <span>🔍 Dig Mode</span>
          </button>
          <button
            onClick={() => setTouchMode('flag')}
            className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
              touchMode === 'flag'
                ? 'bg-amber-400 text-black border-amber-400'
                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Flag Mode</span>
          </button>
        </div>

        <div className="grid grid-cols-8 gap-1 bg-black/60 p-3 rounded-2xl border border-white/15 mb-4">
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => handleContextMenu(e, r, c)}
                className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition cursor-pointer ${
                  cell.revealed
                    ? cell.mine ? 'bg-red-500/40 text-red-300' : 'bg-white/10 text-white'
                    : 'bg-white/5 hover:bg-white/15 text-white border border-white/10'
                }`}
              >
                {cell.revealed ? (
                  cell.mine ? '💣' : cell.count > 0 ? <span className={getCountColor(cell.count)}>{cell.count}</span> : ''
                ) : cell.flagged ? (
                  <Flag className="w-3.5 h-3.5 text-amber-400" />
                ) : ''}
              </button>
            ))
          )}
        </div>

        <div className="font-mono text-center">
          {status === 'lost' ? (
            <span className="text-red-400 font-bold">BOOM! Mine detonated. Click reset.</span>
          ) : status === 'won' ? (
            <span className="text-[#6ee7b7] font-bold">VICTORY! All sectors cleared!</span>
          ) : (
            <span className="text-gray-400 text-[11px]">Left click to clear, Right click to flag</span>
          )}
        </div>
      </div>
    </div>
  );
};
