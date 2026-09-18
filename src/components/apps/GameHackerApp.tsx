import React, { useState, useEffect } from 'react';
import { Terminal, Shield, CheckCircle2, RefreshCw, Key } from 'lucide-react';

export const GameHackerApp: React.FC = () => {
  const [targetCode, setTargetCode] = useState('0x4F9B');
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(4);
  const [logs, setLogs] = useState<string[]>([
    'CONNECTED TO SECURE MAINFRAME [192.168.4.99:22]',
    'BYPASSING KERNEL FIREWALL... CIPHER DECRYPTION REQUIRED',
    'Guess the 4-character hex code (e.g. 0xA1B2)'
  ]);
  const [isWon, setIsWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (isWon || isGameOver) return;
    const g = guess.toUpperCase().trim();
    if (g === targetCode) {
      setIsWon(true);
      setLogs(prev => [...prev, `> ${g} --> ACCESS GRANTED! SYSTEM ROOT UNLOCKED.`]);
    } else {
      const rem = attempts - 1;
      setAttempts(rem);
      setLogs(prev => [...prev, `> ${g} --> ACCESS DENIED. ${rem} attempts remaining.`]);
      if (rem <= 0) {
        setIsGameOver(true);
        setLogs(prev => [...prev, `SECURITY LOCKOUT TRIGGERED. Target was ${targetCode}`]);
      }
    }
    setGuess('');
  };

  const resetGame = () => {
    const codes = ['0x3F8A', '0x9B2C', '0x1E4F', '0x7C3D', '0x8F21'];
    setTargetCode(codes[Math.floor(Math.random() * codes.length)]);
    setAttempts(4);
    setIsWon(false);
    setIsGameOver(false);
    setLogs(['NEW SESSION INITIALIZED. Guess the hex passcode.']);
  };

  return (
    <div className="h-full flex flex-col bg-[#12141c] text-[#edf1f7] text-xs select-none items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#181b26] border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 font-bold text-[#6ee7b7]">
            <Terminal className="w-4 h-4" />
            <span>Cyber Terminal Hacker</span>
          </div>
          <div className="font-mono text-gray-400">Attempts: <strong className="text-amber-400">{attempts}</strong></div>
        </div>

        <div className="h-48 bg-black/75 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-[#6ee7b7] overflow-y-auto space-y-1">
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>

        {!isWon && !isGameOver ? (
          <form onSubmit={handleGuess} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 0x3F8A"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-[#6ee7b7]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#6ee7b7]/20 hover:bg-[#6ee7b7]/30 text-[#6ee7b7] font-mono font-medium transition cursor-pointer"
            >
              Inject
            </button>
          </form>
        ) : (
          <button
            onClick={resetGame}
            className="w-full py-2.5 rounded-xl bg-[#6ee7b7] text-black font-bold hover:bg-[#5cd4a4] transition cursor-pointer flex items-center justify-center gap-2 font-mono"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Hacking Session</span>
          </button>
        )}
      </div>
    </div>
  );
};
