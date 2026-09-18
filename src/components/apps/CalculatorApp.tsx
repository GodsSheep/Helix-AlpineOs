import React, { useState } from 'react';
import { Toast } from '../../kernel/Toast';
import { Kernel } from '../../kernel';
import { Calculator as CalcIcon, Delete, History, Save, RotateCcw, Copy, Code, Binary } from 'lucide-react';

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [mode, setMode] = useState<'standard' | 'scientific' | 'programmer'>('programmer');
  const [history, setHistory] = useState<string[]>([]);
  const [bitWordSize, setBitWordSize] = useState<'8' | '16' | '32' | '64'>('32');

  const currentNumber = parseInt(display, 10) || 0;

  const handleDigit = (digit: string) => {
    setDisplay((prev) => {
      if (prev === '0' || prev === 'Error') return digit;
      return prev + digit;
    });
  };

  const handleOp = (op: string) => {
    setExpression(`${display} ${op} `);
    setDisplay('0');
  };

  const handleEqual = () => {
    try {
      const full = expression + display;
      // Sanitize input: allow only numbers and standard math operators
      const sanitized = full.replace(/[^0-9+\-*/().%^]/g, '');
      const calcStr = sanitized.replace(/\^/g, '**');
      // eslint-disable-next-line no-eval
      const result = Function(`"use strict"; return (${calcStr})`)();
      const resStr = String(result);
      setHistory((prev) => [`${full} = ${resStr}`, ...prev.slice(0, 19)]);
      setDisplay(resStr);
      setExpression('');
    } catch {
      setDisplay('Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleBackspace = () => {
    setDisplay((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleBitwise = (op: 'AND' | 'OR' | 'XOR' | 'NOT' | 'SHL' | 'SHR') => {
    if (op === 'NOT') {
      const val = ~currentNumber;
      setDisplay(val.toString());
      setHistory((prev) => [`NOT ${currentNumber} = ${val}`, ...prev]);
    } else {
      setExpression(`${display} ${op} `);
      setDisplay('0');
    }
  };

  const handleProgrammerEqual = () => {
    const parts = expression.trim().split(' ');
    if (parts.length === 2) {
      const left = parseInt(parts[0], 10) || 0;
      const op = parts[1];
      const right = parseInt(display, 10) || 0;
      let res = 0;
      if (op === 'AND') res = left & right;
      else if (op === 'OR') res = left | right;
      else if (op === 'XOR') res = left ^ right;
      else if (op === 'SHL') res = left << right;
      else if (op === 'SHR') res = left >> right;
      setDisplay(res.toString());
      setExpression('');
      setHistory((prev) => [`${left} ${op} ${right} = ${res}`, ...prev]);
    } else {
      handleEqual();
    }
  };

  const handleSciFunc = (fn: string) => {
    const num = parseFloat(display);
    let res = 0;
    if (fn === 'sin') res = Math.sin(num);
    else if (fn === 'cos') res = Math.cos(num);
    else if (fn === 'tan') res = Math.tan(num);
    else if (fn === 'sqrt') res = Math.sqrt(num);
    else if (fn === 'ln') res = Math.log(num);
    else if (fn === 'log10') res = Math.log10(num);
    else if (fn === 'sqr') res = num * num;
    else if (fn === 'inv') res = 1 / num;
    const resStr = Number.isFinite(res) ? res.toFixed(6).replace(/\.?0+$/, '') : 'Error';
    setDisplay(resStr);
    setHistory((prev) => [`${fn}(${num}) = ${resStr}`, ...prev]);
  };

  const handleSaveHistoryToVFS = async () => {
    try {
      const text = `# Helix OS GNU bc Calculator History Tape\n\n` + history.join('\n') + '\n';
      await Kernel.vfs.write('/root/calc_history.txt', text);
      Toast.show('Exported tape to /root/calc_history.txt', '💾');
    } catch {
      Toast.show('Failed to save to VFS', '⚠️');
    }
  };

  // Binary representation formatted with nibble spaces
  const binaryRep = (currentNumber >>> 0).toString(2).padStart(32, '0').match(/.{1,4}/g)?.join(' ') || '';

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141724] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <CalcIcon className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm">GNU bc Calculator</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400">
            Arbitrary Precision Math & Bitwise
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/40 p-0.5 rounded border border-white/10">
          {(['standard', 'scientific', 'programmer'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-medium transition ${
                mode === m ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Calculator Pad */}
        <div className="flex-1 flex flex-col p-4 space-y-3">
          {/* Display LCD Box */}
          <div className="bg-black/60 border border-white/15 rounded-xl p-3.5 flex flex-col justify-end text-right font-mono">
            <div className="h-4 text-gray-400 text-xs truncate mb-1">{expression}</div>
            <div className="text-2xl font-bold text-white tracking-wider truncate">{display}</div>
          </div>

          {/* Programmer Bitwise Strip */}
          {mode === 'programmer' && (
            <div className="bg-[#12141f] border border-white/10 rounded-lg p-2.5 font-mono text-[11px] space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-emerald-400 font-bold">HEX</span>
                <span className="text-white">0x{currentNumber.toString(16).toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-cyan-400 font-bold">DEC</span>
                <span className="text-white">{currentNumber.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-amber-400 font-bold">OCT</span>
                <span className="text-white">0o{currentNumber.toString(8)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400 pt-1 border-t border-white/5">
                <span className="text-rose-400 font-bold">BIN</span>
                <span className="text-emerald-300 text-[10px] tracking-widest">{binaryRep}</span>
              </div>
            </div>
          )}

          {/* Keys Grid */}
          <div className="flex-1 grid grid-cols-4 gap-2 font-mono text-sm">
            {/* Row 1 */}
            <button onClick={handleClear} className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg font-bold transition">AC</button>
            <button onClick={handleBackspace} className="bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg flex items-center justify-center transition"><Delete className="w-4 h-4" /></button>
            <button onClick={() => handleOp('%')} className="bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg font-bold transition">%</button>
            <button onClick={() => handleOp('/')} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-bold transition">÷</button>

            {/* Scientific extras if in scientific mode */}
            {mode === 'scientific' && (
              <>
                <button onClick={() => handleSciFunc('sin')} className="bg-white/5 hover:bg-white/10 text-cyan-300 rounded-lg text-xs transition">sin</button>
                <button onClick={() => handleSciFunc('cos')} className="bg-white/5 hover:bg-white/10 text-cyan-300 rounded-lg text-xs transition">cos</button>
                <button onClick={() => handleSciFunc('tan')} className="bg-white/5 hover:bg-white/10 text-cyan-300 rounded-lg text-xs transition">tan</button>
                <button onClick={() => handleSciFunc('sqrt')} className="bg-white/5 hover:bg-white/10 text-cyan-300 rounded-lg text-xs transition">√x</button>
              </>
            )}

            {/* Programmer extras if in programmer mode */}
            {mode === 'programmer' && (
              <>
                <button onClick={() => handleBitwise('AND')} className="bg-white/5 hover:bg-white/10 text-amber-300 rounded-lg text-xs transition">AND</button>
                <button onClick={() => handleBitwise('OR')} className="bg-white/5 hover:bg-white/10 text-amber-300 rounded-lg text-xs transition">OR</button>
                <button onClick={() => handleBitwise('XOR')} className="bg-white/5 hover:bg-white/10 text-amber-300 rounded-lg text-xs transition">XOR</button>
                <button onClick={() => handleBitwise('NOT')} className="bg-white/5 hover:bg-white/10 text-amber-300 rounded-lg text-xs transition">NOT</button>
              </>
            )}

            {/* Number Rows */}
            {['7', '8', '9'].map((d) => (
              <button key={d} onClick={() => handleDigit(d)} className="bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold text-base transition">{d}</button>
            ))}
            <button onClick={() => handleOp('*')} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-bold transition">×</button>

            {['4', '5', '6'].map((d) => (
              <button key={d} onClick={() => handleDigit(d)} className="bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold text-base transition">{d}</button>
            ))}
            <button onClick={() => handleOp('-')} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-bold transition">−</button>

            {['1', '2', '3'].map((d) => (
              <button key={d} onClick={() => handleDigit(d)} className="bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold text-base transition">{d}</button>
            ))}
            <button onClick={() => handleOp('+')} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-bold transition">+</button>

            <button onClick={() => handleDigit('0')} className="col-span-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold text-base transition">0</button>
            <button onClick={() => handleDigit('.')} className="bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold text-base transition">.</button>
            <button
              onClick={mode === 'programmer' && expression.includes(' ') ? handleProgrammerEqual : handleEqual}
              className="bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg font-bold text-base transition shadow-lg shadow-emerald-500/20"
            >
              =
            </button>
          </div>
        </div>

        {/* History Tape Pane */}
        <div className="w-64 border-l border-white/10 bg-[#10121d] flex flex-col p-3 space-y-2 shrink-0">
          <div className="flex items-center justify-between pb-1 border-b border-white/10 text-gray-400">
            <span className="font-semibold text-[11px] flex items-center gap-1.5 text-white">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              Tape History
            </span>
            <div className="flex items-center gap-1">
              <button onClick={handleSaveHistoryToVFS} title="Export to VFS file" className="p-1 hover:text-emerald-300">
                <Save className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setHistory([])} title="Clear tape" className="p-1 hover:text-rose-300">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px]">
            {history.length > 0 ? (
              history.map((h, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const res = h.split('=').pop()?.trim();
                    if (res) setDisplay(res);
                  }}
                  className="p-1.5 rounded bg-black/40 border border-white/5 hover:border-emerald-500/40 cursor-pointer text-gray-300 hover:text-white transition"
                >
                  {h}
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 text-[10px]">
                No calculations yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
