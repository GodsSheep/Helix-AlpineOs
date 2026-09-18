import React, { useState, useEffect } from 'react';
import { Toast } from '../../kernel/Toast';
import { RotateCcw, Trophy, Clock, Zap, CheckCircle2 } from 'lucide-react';

interface CardItem {
  id: number;
  icon: string;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICONS = [
  { icon: '🐧', name: 'Linux Kernel' },
  { icon: '⚡', name: 'OpenRC' },
  { icon: '🔒', name: 'OpenSSH' },
  { icon: '📦', name: 'APK Repo' },
  { icon: '💻', name: 'Terminal' },
  { icon: '🛡️', name: 'Netfilter' },
  { icon: '🗄️', name: 'SQLite' },
  { icon: '🌐', name: 'Network' },
];

export const GameMemoryApp: React.FC = () => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [bestTime, setBestTime] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('helix_memory_best_time') || '999', 10);
    } catch {
      return 999;
    }
  });

  const setupDeck = () => {
    const deck: CardItem[] = [];
    let idCounter = 0;
    ICONS.forEach((item) => {
      deck.push({ id: idCounter++, icon: item.icon, name: item.name, isFlipped: false, isMatched: false });
      deck.push({ id: idCounter++, icon: item.icon, name: item.name, isFlipped: false, isMatched: false });
    });
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setTimeSeconds(0);
    setIsWon(false);
  };

  useEffect(() => {
    setupDeck();
  }, []);

  // Timer
  useEffect(() => {
    if (isWon) return;
    const interval = setInterval(() => {
      setTimeSeconds((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWon]);

  const handleCardClick = (index: number) => {
    if (flippedIndices.length >= 2 || cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = nextFlipped;
      if (cards[firstIdx].name === cards[secondIdx].name) {
        // Match!
        setTimeout(() => {
          const matchedDeck = cards.map((c, idx) =>
            idx === firstIdx || idx === secondIdx ? { ...c, isMatched: true, isFlipped: true } : c
          );
          setCards(matchedDeck);
          if (matchedDeck.every((c) => c.isMatched)) {
            setIsWon(true);
            Toast.show('Congratulations! Matrix Memory cleared!', '🏆');
            if (timeSeconds < bestTime) {
              setBestTime(timeSeconds);
              localStorage.setItem('helix_memory_best_time', timeSeconds.toString());
            }
          }
          setFlippedIndices([]);
        }, 500);
      } else {
        // No match - flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden items-center justify-between p-3">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-white/10 shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-base">🧠</span>
          <span className="font-semibold text-sm">Matrix Memory Challenge</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeSeconds}s</span>
          </div>
          <div className="text-cyan-400 font-bold">MOVES: {moves}</div>
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>{bestTime === 999 ? '-' : `${bestTime}s`}</span>
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-4 gap-2.5 p-2 max-w-sm w-full">
        {cards.map((card, idx) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(idx)}
            className={`h-20 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform ${
              card.isFlipped || card.isMatched
                ? 'bg-[#181c2e] border-emerald-500/50 shadow-lg scale-100'
                : 'bg-[#10121d] border-white/10 hover:border-white/30 hover:scale-105'
            }`}
          >
            {card.isFlipped || card.isMatched ? (
              <div className="flex flex-col items-center">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-[9px] font-mono text-gray-400 mt-1 truncate max-w-[60px]">
                  {card.name}
                </span>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 font-mono text-xs">
                ?
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Win Banner */}
      {isWon && (
        <div className="w-full bg-emerald-500/20 border border-emerald-500/40 rounded-lg p-2.5 flex items-center justify-between text-emerald-300 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Solved in {moves} moves ({timeSeconds} seconds)!</span>
          </div>
          <button
            onClick={setupDeck}
            className="px-2.5 py-1 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-400 transition text-xs"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="w-full flex items-center justify-between pt-2 border-t border-white/10 shrink-0 text-gray-400 text-[11px]">
        <span>Match all 8 pairs of Alpine Linux components</span>
        <button
          onClick={setupDeck}
          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-200 flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Deck</span>
        </button>
      </div>
    </div>
  );
};
