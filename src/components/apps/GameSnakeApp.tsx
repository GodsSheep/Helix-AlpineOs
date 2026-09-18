import React, { useState, useEffect, useRef } from 'react';
import { Toast } from '../../kernel/Toast';
import { Play, RotateCcw, Trophy, Volume2, Pause } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 18;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export const GameSnakeApp: React.FC = () => {
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('UP');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('helix_snake_high_score') || '0', 10);
    } catch {
      return 0;
    }
  });

  const directionRef = useRef(direction);
  directionRef.current = direction;

  const snakeRef = useRef(snake);
  snakeRef.current = snake;
  const foodRef = useRef(food);
  foodRef.current = food;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const highScoreRef = useRef(highScore);
  highScoreRef.current = highScore;

  const generateFood = (currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some((s) => s.x === newFood.x && s.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  };

  const restartGame = () => {
    const initialSnake: Point[] = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('UP');
    setIsGameOver(false);
    setIsPaused(false);
    setScore(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code) && directionRef.current !== 'DOWN') {
        setDirection('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code) && directionRef.current !== 'UP') {
        setDirection('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code) && directionRef.current !== 'RIGHT') {
        setDirection('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code) && directionRef.current !== 'LEFT') {
        setDirection('RIGHT');
      } else if (e.code === 'Space') {
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isGameOver || isPaused) return;

    const interval = setInterval(() => {
      const prevSnake = snakeRef.current;
      const head = prevSnake[0];
      const newHead = { ...head };

      if (directionRef.current === 'UP') newHead.y -= 1;
      else if (directionRef.current === 'DOWN') newHead.y += 1;
      else if (directionRef.current === 'LEFT') newHead.x -= 1;
      else if (directionRef.current === 'RIGHT') newHead.x += 1;

      // Collision with walls
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setIsGameOver(true);
        Toast.show('Game Over! Snake hit the boundary', '💥');
        return;
      }

      // Collision with self
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        Toast.show('Game Over! Self collision', '💥');
        return;
      }

      const newSnake = [newHead, ...prevSnake];

      // Ate food
      const currentFood = foodRef.current;
      if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
        const nextScore = scoreRef.current + 10;
        setScore(nextScore);
        if (nextScore > highScoreRef.current) {
          setHighScore(nextScore);
          localStorage.setItem('helix_snake_high_score', nextScore.toString());
        }
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    }, 110);

    return () => clearInterval(interval);
  }, [isGameOver, isPaused]);

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden items-center justify-between p-3">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">🐍</span>
          <span className="font-semibold text-sm">Alpine Retro Snake</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <span>SCORE:</span>
            <span>{score}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>{highScore}</span>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative border-2 border-emerald-500/40 rounded-xl bg-[#080a10] p-1.5 shadow-2xl">
        <div
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
          }}
          className="relative bg-[#06080d] rounded-lg overflow-hidden"
        >
          {/* Grid lines background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(to right, #6ee7b7 1px, transparent 1px), linear-gradient(to bottom, #6ee7b7 1px, transparent 1px)`,
              backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
            }}
          />

          {/* Snake Segments */}
          {snake.map((seg, idx) => (
            <div
              key={idx}
              style={{
                left: seg.x * CELL_SIZE,
                top: seg.y * CELL_SIZE,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
              }}
              className={`absolute rounded-sm transition-all ${
                idx === 0
                  ? 'bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]'
                  : 'bg-emerald-500/90'
              }`}
            />
          ))}

          {/* Food */}
          <div
            style={{
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
            className="absolute rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-pulse"
          />

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center space-y-2">
              <span className="text-xl font-bold text-rose-400">GAME OVER</span>
              <span className="text-sm font-mono text-gray-300">Final Score: {score}</span>
              <button
                onClick={restartGame}
                className="px-3 py-1.5 bg-emerald-500 text-black font-bold rounded-lg flex items-center gap-1.5 hover:bg-emerald-400 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Play Again
              </button>
            </div>
          )}

          {/* Paused Overlay */}
          {isPaused && !isGameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <span className="text-lg font-bold text-amber-400 tracking-wider">PAUSED (Space)</span>
            </div>
          )}
        </div>
      </div>

      {/* Touch D-Pad for Mobile & Desktop Touchscreens */}
      <div className="grid grid-cols-3 gap-1.5 w-36 mx-auto my-1.5">
        <div />
        <button
          onClick={() => { if (directionRef.current !== 'DOWN') setDirection('UP'); }}
          className="p-3 bg-white/10 active:bg-emerald-500 rounded-xl text-center text-sm font-bold shadow hover:bg-white/20 transition cursor-pointer select-none"
        >
          ▲
        </button>
        <div />
        <button
          onClick={() => { if (directionRef.current !== 'RIGHT') setDirection('LEFT'); }}
          className="p-3 bg-white/10 active:bg-emerald-500 rounded-xl text-center text-sm font-bold shadow hover:bg-white/20 transition cursor-pointer select-none"
        >
          ◀
        </button>
        <button
          onClick={() => setIsPaused((p) => !p)}
          className="p-3 bg-white/5 active:bg-amber-500 rounded-xl text-center text-xs font-mono text-gray-300 shadow hover:bg-white/10 transition cursor-pointer select-none"
        >
          {isPaused ? '▶' : '⏸'}
        </button>
        <button
          onClick={() => { if (directionRef.current !== 'LEFT') setDirection('RIGHT'); }}
          className="p-3 bg-white/10 active:bg-emerald-500 rounded-xl text-center text-sm font-bold shadow hover:bg-white/20 transition cursor-pointer select-none"
        >
          ▶
        </button>
        <div />
        <button
          onClick={() => { if (directionRef.current !== 'UP') setDirection('DOWN'); }}
          className="p-3 bg-white/10 active:bg-emerald-500 rounded-xl text-center text-sm font-bold shadow hover:bg-white/20 transition cursor-pointer select-none"
        >
          ▼
        </button>
        <div />
      </div>

      {/* Controls Footer */}
      <div className="w-full flex items-center justify-between pt-2 border-t border-white/10 shrink-0 text-gray-400 text-[11px]">
        <div className="flex items-center gap-2">
          <span>Move: <strong className="text-white">WASD / Arrows / D-pad</strong></span>
          <span>•</span>
          <span>Pause: <strong className="text-white">Space</strong></span>
        </div>
        <button
          onClick={restartGame}
          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restart</span>
        </button>
      </div>
    </div>
  );
};
