import React, { useState } from 'react';
import { NativeEngine, NativeExecResult } from '../../kernel/NativeEngine';
import { SoundManager } from '../../kernel/SoundManager';
import { Toast } from '../../kernel/Toast';
import { Kernel } from '../../kernel';
import { 
  Cpu, 
  Play, 
  Code2, 
  Terminal, 
  Zap, 
  Activity, 
  Box, 
  Copy, 
  Check, 
  Download, 
  HardDrive, 
  RefreshCw, 
  Layers, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  Database,
  BarChart3
} from 'lucide-react';

interface NativePreset {
  id: string;
  lang: 'rust' | 'cpp';
  title: string;
  description: string;
  code: string;
}

const RUST_CPP_PRESETS: NativePreset[] = [
  {
    id: 'rust-prime-sieve',
    lang: 'rust',
    title: 'Rust Parallel Prime Sieve',
    description: 'High-speed prime calculation with zero-cost abstractions & vector memory',
    code: `fn main() {
    println!("=== Helix Alpine Native Rust Engine ===");
    let limit = 1000;
    let mut primes = vec![];
    
    for n in 2..limit {
        let mut is_prime = true;
        for p in &primes {
            if p * p > n { break; }
            if n % p == 0 {
                is_prime = false;
                break;
            }
        }
        if is_prime {
            primes.push(n);
        }
    }
    
    println!("Found {} primes under {}.", primes.len(), limit);
    println!("First 10 primes: {:?}", primes);
}`
  },
  {
    id: 'rust-memory-alloc',
    lang: 'rust',
    title: 'Rust Memory & Vector Benchmark',
    description: 'Dynamic vector allocation with memory safety guarantees',
    code: `fn main() {
    println!("=== Rust Vector & Memory Benchmark ===");
    let mut data = vec![];
    
    for i in 0..10 {
        let val = i * 42 + 7;
        data.push(val);
        println!("Allocated slot {}: value {}", i, val);
    }
    
    println!("Final Vector Capacity & Length: {}", data.len());
}`
  },
  {
    id: 'cpp-quicksort',
    lang: 'cpp',
    title: 'C++23 Fast QuickSort & Vectors',
    description: 'Direct memory array manipulation with GCC -O3 compiler optimization',
    code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    cout << "=== C++23 High-Performance Direct Compute ===" << endl;
    vector<int> numbers = {64, 34, 25, 12, 22, 11, 90, 42, 88, 19};
    
    cout << "Unsorted array: ";
    for (int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    // Sort vector
    for (int i = 0; i < 10; i++) {
        for (int j = 0; j < 9; j++) {
            if (numbers[j] > numbers[j+1]) {
                int temp = numbers[j];
                numbers[j] = numbers[j+1];
                numbers[j+1] = temp;
            }
        }
    }
    
    cout << "Sorted result: ";
    for (int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    return 0;
}`
  },
  {
    id: 'cpp-system-engine',
    lang: 'cpp',
    title: 'C++ Hardware Memory Inspector',
    description: 'Simulated pointer arithmetic & heap structure allocation',
    code: `#include <iostream>
using namespace std;

int main() {
    cout << "=== C++ Memory Stack & Pointer Profiler ===" << endl;
    int cache_size = 4096;
    double bus_speed = 3200.0;
    
    cout << "L1 Cache Size: " << cache_size << " KB" << endl;
    cout << "VirtIO Bus Frequency: " << bus_speed << " MHz" << endl;
    
    for (int i = 0; i < 5; i++) {
        cout << "Core #" << i << " thread synchronized successfully." << endl;
    }
    return 0;
}`
  }
];

export const RustCppStudioApp: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<'rust' | 'cpp'>('rust');
  const [selectedPreset, setSelectedPreset] = useState<NativePreset>(RUST_CPP_PRESETS[0]);
  const [code, setCode] = useState<string>(RUST_CPP_PRESETS[0].code);
  const [execResult, setExecResult] = useState<NativeExecResult | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectPreset = (preset: NativePreset) => {
    SoundManager.play('click');
    setSelectedPreset(preset);
    setSelectedLang(preset.lang);
    setCode(preset.code);
    setExecResult(null);
  };

  const handleRunCode = () => {
    SoundManager.play('open');
    setIsCompiling(true);

    setTimeout(() => {
      let res: NativeExecResult;
      if (selectedLang === 'rust') {
        res = NativeEngine.executeRust(code);
      } else {
        res = NativeEngine.executeCpp(code);
      }
      setExecResult(res);
      setIsCompiling(false);

      if (res.exitCode === 0) {
        Toast.show(`Executed ${selectedLang.toUpperCase()} target in ${res.executionTimeMs}ms`, 'success');
      } else {
        Toast.show(`Compilation/Execution failed with exit code ${res.exitCode}`, 'error');
      }
    }, 150);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    SoundManager.play('click');
    setCopied(true);
    Toast.show('Source code copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToVfs = () => {
    SoundManager.play('click');
    const ext = selectedLang === 'rust' ? 'rs' : 'cpp';
    const fname = `/src/main.${ext}`;
    Kernel.vfs.write(fname, code);
    Toast.show(`Saved source file to VFS ${fname}`, 'success');
  };

  const handleDownload = () => {
    SoundManager.play('click');
    const ext = selectedLang === 'rust' ? 'rs' : 'cpp';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show(`Downloaded main.${ext}`, 'info');
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0d12] text-gray-100 font-sans select-none overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-2.5 bg-[#121520] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-black font-black shadow-lg">
            ⚡
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide font-mono flex items-center gap-2">
              <span>Helix Local Rust & C++ WASM Studio</span>
              <span className="px-2 py-0.5 text-[9px] rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-extrabold">
                ZERO-LATENCY WASM
              </span>
            </h1>
            <p className="text-[10px] text-gray-400 font-mono">
              Rust 1.76 • C++23 GCC 13.2 • Local Execution Engine • Hardware Memory Inspector
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 p-1 bg-black/40 border border-white/10 rounded-xl">
          <button
            onClick={() => {
              SoundManager.play('click');
              setSelectedLang('rust');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              selectedLang === 'rust'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Rust WASM</span>
          </button>

          <button
            onClick={() => {
              SoundManager.play('click');
              setSelectedLang('cpp');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              selectedLang === 'cpp'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>C++23 Engine</span>
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 p-3 flex flex-col md:flex-row gap-3 overflow-hidden">
        {/* Sidebar Presets */}
        <div className="w-full md:w-64 bg-[#121520] border border-white/10 rounded-2xl p-3 flex flex-col shrink-0 overflow-y-auto">
          <h2 className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-amber-400" />
            <span>Native Code Presets</span>
          </h2>

          <div className="space-y-1.5 flex-1">
            {RUST_CPP_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  selectedPreset.id === p.id
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg'
                    : 'bg-black/30 border-white/5 text-gray-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs truncate">{p.title}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/10 text-amber-300 uppercase">
                    {p.lang}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 truncate">{p.description}</p>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10 mt-3 space-y-1.5">
            <button
              onClick={handleSaveToVfs}
              className="w-full py-1.5 px-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-200 flex items-center gap-2 transition cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Save File to VFS</span>
            </button>

            <button
              onClick={handleDownload}
              className="w-full py-1.5 px-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-200 flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Source Code</span>
            </button>
          </div>
        </div>

        {/* Code Editor & Execution Panel */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* Top Code Editor */}
          <div className="flex-1 bg-[#121520] border border-white/10 rounded-2xl p-3 flex flex-col shadow-xl overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
              <span className="font-mono text-xs text-amber-400 font-bold flex items-center gap-1.5">
                <Code2 className="w-4 h-4" />
                <span>Source Editor ({selectedLang === 'rust' ? 'main.rs' : 'main.cpp'})</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-gray-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleRunCode}
                  disabled={isCompiling}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-rose-500 text-black font-extrabold rounded-xl flex items-center gap-1.5 hover:brightness-110 shadow-lg shadow-amber-500/20 transition cursor-pointer text-xs disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isCompiling ? 'Compiling WASM...' : 'Compile & Run'}</span>
                </button>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 w-full p-3 bg-black/80 border border-white/10 rounded-xl font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-400 transition resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Bottom Execution Console & Metrics */}
          <div className="h-44 bg-[#121520] border border-white/10 rounded-2xl p-3 flex flex-col md:flex-row gap-3 shadow-xl overflow-hidden">
            {/* Stdout Console */}
            <div className="flex-1 flex flex-col min-w-0">
              <span className="text-[10px] text-gray-400 font-mono uppercase font-bold mb-1 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>Execution Console (stdout / stderr)</span>
              </span>
              <div className="flex-1 bg-black/80 border border-white/10 rounded-xl p-2.5 font-mono text-xs text-emerald-300 overflow-y-auto whitespace-pre-wrap">
                {execResult ? (
                  execResult.stdout + (execResult.stderr ? `\n[ERR] ${execResult.stderr}` : '')
                ) : (
                  <span className="text-gray-500 italic">Click "Compile & Run" to execute native code...</span>
                )}
              </div>
            </div>

            {/* Performance Stats Cards */}
            <div className="w-full md:w-56 bg-black/40 border border-white/10 rounded-xl p-2.5 flex flex-col justify-between shrink-0 font-mono text-[11px]">
              <div className="space-y-1.5">
                <div className="text-gray-400 font-bold border-b border-white/10 pb-1 flex items-center justify-between">
                  <span>WASM METRICS</span>
                  <Activity className="w-3 h-3 text-amber-400" />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Execution Time:</span>
                  <span className="text-emerald-400 font-bold">{execResult ? `${execResult.executionTimeMs} ms` : '0 ms'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Memory Usage:</span>
                  <span className="text-cyan-400 font-bold">{execResult ? `${execResult.memoryUsageKb} KB` : '0 KB'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Allocations:</span>
                  <span className="text-purple-400 font-bold">{execResult ? execResult.allocationsCount : 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Exit Code:</span>
                  <span className={execResult?.exitCode === 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {execResult ? execResult.exitCode : 0}
                  </span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-white/10 text-[9px] text-gray-500 text-center">
                ● Hardware VirtIO 64-bit Memory Alignment
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
