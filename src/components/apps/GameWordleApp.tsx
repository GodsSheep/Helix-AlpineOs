import React, { useState, useEffect } from 'react';
import { Toast } from '../../kernel/Toast';
import { RotateCcw, Trophy, Check, Delete } from 'lucide-react';

const WORDS_LIST = [
  'LINUX', 'SHELL', 'PIPES', 'BYTES', 'DEBUG', 'ASYNC', 'STACK', 'BUILD',
  'REACT', 'ARRAY', 'TOKEN', 'LOGIC', 'PANIC', 'CROND', 'ROUTE', 'PORTS',
  'CACHE', 'PROXY', 'CLONE', 'MUTEX', 'YIELD', 'FETCH', 'PARSE', 'PATCH',
];

export const GameWordleApp: React.FC = () => {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [streak, setStreak] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('helix_wordle_streak') || '0', 10);
    } catch {
      return 0;
    }
  });

  const pickNewWord = () => {
    const word = WORDS_LIST[Math.floor(Math.random() * WORDS_LIST.length)];
    setTargetWord(word);
    setGuesses([]);
    setCurrentGuess('');
    setIsGameOver(false);
    setIsWon(false);
  };

  useEffect(() => {
    pickNewWord();
  }, []);

  const handleKeyPress = (key: string) => {
    if (isGameOver) return;

    if (key === 'ENTER') {
      if (currentGuess.length !== 5) {
        Toast.show('Word must be 5 letters!', '⚠️');
        return;
      }
      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      setCurrentGuess('');

      if (currentGuess === targetWord) {
        setIsWon(true);
        setIsGameOver(true);
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        localStorage.setItem('helix_wordle_streak', nextStreak.toString());
        Toast.show('Excellent! Word Decrypted!', '🏆');
      } else if (newGuesses.length >= 6) {
        setIsGameOver(true);
        setStreak(0);
        localStorage.setItem('helix_wordle_streak', '0');
        Toast.show(`Word was: ${targetWord}`, '💥');
      }
    } else if (key === 'BACKSPACE') {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key)) {
      if (currentGuess.length < 5) {
        setCurrentGuess((prev) => prev + key);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (k === 'ENTER') handleKeyPress('ENTER');
      else if (k === 'BACKSPACE') handleKeyPress('BACKSPACE');
      else if (/^[A-Z]$/.test(k)) handleKeyPress(k);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, isGameOver, guesses, targetWord]);

  const getTileStatus = (rowIndex: number, colIndex: number) => {
    if (rowIndex >= guesses.length) return 'empty';
    const guessWord = guesses[rowIndex];
    const letter = guessWord[colIndex];
    if (targetWord[colIndex] === letter) return 'correct';
    if (targetWord.includes(letter)) return 'present';
    return 'absent';
  };

  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
  ];

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden items-center justify-between p-3">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-white/10 shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-base">🔤</span>
          <span className="font-semibold text-sm">Terminal CodeBreaker (Wordle)</span>
        </div>
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <Trophy className="w-3.5 h-3.5" />
          <span>STREAK: {streak}</span>
        </div>
      </div>

      {/* Word Grid */}
      <div className="flex flex-col gap-1.5 p-2">
        {Array.from({ length: 6 }).map((_, rIdx) => {
          const isCurrentRow = rIdx === guesses.length;
          const guessForThisRow = isCurrentRow ? currentGuess : guesses[rIdx] || '';

          return (
            <div key={rIdx} className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, cIdx) => {
                const letter = guessForThisRow[cIdx] || '';
                const status = getTileStatus(rIdx, cIdx);

                let bgClass = 'bg-[#10121d] border-white/10 text-white';
                if (status === 'correct') bgClass = 'bg-emerald-600 border-emerald-500 text-white';
                else if (status === 'present') bgClass = 'bg-amber-600 border-amber-500 text-white';
                else if (status === 'absent') bgClass = 'bg-gray-800 border-gray-700 text-gray-400';

                return (
                  <div
                    key={cIdx}
                    className={`w-11 h-11 border-2 rounded-lg flex items-center justify-center font-mono text-lg font-bold transition-all ${bgClass}`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* On-screen Keyboard */}
      <div className="flex flex-col gap-1 w-full max-w-sm">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1">
            {row.map((k) => (
              <button
                key={k}
                onClick={() => handleKeyPress(k)}
                className={`h-9 rounded px-2 font-mono text-xs font-bold transition flex items-center justify-center ${
                  k === 'ENTER' || k === 'BACKSPACE'
                    ? 'bg-white/10 hover:bg-white/20 text-emerald-400'
                    : 'bg-white/5 hover:bg-white/15 text-gray-200'
                }`}
              >
                {k === 'BACKSPACE' ? <Delete className="w-4 h-4" /> : k}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="w-full flex items-center justify-between pt-2 border-t border-white/10 shrink-0 text-gray-400 text-[11px]">
        <span>{isGameOver ? `Target word was: ${targetWord}` : 'Guess the 5-letter Linux term'}</span>
        <button
          onClick={pickNewWord}
          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-200 flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>New Word</span>
        </button>
      </div>
    </div>
  );
};
