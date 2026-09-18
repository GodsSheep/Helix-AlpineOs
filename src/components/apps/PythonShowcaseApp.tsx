import React, { useState } from 'react';
import { Kernel } from '../../kernel';
import { PythonEngine } from '../../kernel/PythonEngine';
import { GuiDisplayServer } from '../../kernel/GuiServer';
import { SoundManager } from '../../kernel/SoundManager';
import { Code, Play, Terminal, Monitor, Layout, Cpu, Check, Copy, Sparkles, Smartphone, Maximize2, Shield, RefreshCw, BookOpen, Layers, Activity, Zap } from 'lucide-react';

export const PythonShowcaseApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cli' | 'gui' | 'stdlib' | 'bytecode'>('cli');

  // CLI State
  const [cliCode, setCliCode] = useState(`import sys
import math
import json
import statistics
import random

def main():
    print("=== Helix Alpine Python 3.12 Engine ===")
    print("Python Executable:", sys.executable)
    print("Platform:", sys.platform)
    
    data = [random.randint(10, 99) for _ in range(8)]
    print("Sample Data:", data)
    print("Mean:", statistics.mean(data))
    print("Median:", statistics.median(data))
    print("Square root of sum:", round(math.sqrt(sum(data)), 2))
    
    payload = {"os": "Helix Alpine", "python": sys.version, "status": "ONLINE"}
    print("JSON Dump:", json.dumps(payload))

if __name__ == "__main__":
    main()`);
  const [cliOutput, setCliOutput] = useState<string | null>(null);
  const [cliRunning, setCliRunning] = useState(false);

  // Bytecode Inspector State
  const [bytecodeOutput, setBytecodeOutput] = useState<string | null>(null);

  // Sample GUI presets
  const guiPresets = [
    {
      name: 'Tkinter Dashboard',
      framework: 'Tkinter',
      icon: '🐍',
      code: `import tkinter as tk

root = tk.Tk()
root.title("Alpine Tkinter Control Center")
root.geometry("450x360")

lbl = tk.Label(root, text="Alpine System Monitor", font=("Arial", 14, "bold"))
info = tk.Label(root, text="Connected to Virtual X11 (:0.0)")

ent = tk.Entry(root, placeholder="Filter metrics...")
btn1 = tk.Button(root, text="Run Diagnostic Routine", command="run_diag")
btn2 = tk.Button(root, text="Purge Memory Cache", command="purge_cache")

scale = tk.Scale(root, from_=0, to=100, label="CPU Allocation (%)")
chk = tk.Checkbutton(root, text="Enable High-Speed VirtIO Bus")

root.mainloop()`
    },
    {
      name: 'CustomTkinter Dark UI',
      framework: 'CustomTkinter',
      icon: '✨',
      code: `import customtkinter as ctk

app = ctk.CTk()
app.title("Helix Dark Modern Suite")
app.geometry("480x380")

title = ctk.CTkLabel(app, text="CustomTkinter Modern Palette", font=("Roboto", 16, "bold"))
slider = ctk.CTkSlider(app, from_=0, to=100, number_of_steps=10)
btn = ctk.CTkButton(app, text="Execute Parallel Python Job", fg_color="emerald")

app.mainloop()`
    },
    {
      name: 'PySimpleGUI Form',
      framework: 'PySimpleGUI',
      icon: '📦',
      code: `import PySimpleGUI as sg

layout = [
    [sg.Text('PySimpleGUI Helix QuickForm', font=('Helvetica', 14))],
    [sg.Text('User ID:'), sg.Input(key='USER_ID')],
    [sg.Text('Throttle:'), sg.Slider(range=(1, 10), default_value=5)],
    [sg.Button('Submit Payload'), sg.Button('Cancel')]
]

window = sg.Window('Alpine Form', layout)`
    },
    {
      name: 'PyQt / PySide Window',
      framework: 'PyQt 6',
      icon: '⚡',
      code: `from PyQt6.QtWidgets import QApplication, QWidget, QLabel, QPushButton, QLineEdit

app = QApplication([])
window = QWidget()
window.setWindowTitle("PyQt6 Native Linux Window")

lbl = QLabel("Qt6 Component Framework Active")
inp = QLineEdit(placeholder="Type command...")
btn = QPushButton("Trigger Qt Event Loop")

window.show()`
    }
  ];

  const handleRunCli = () => {
    SoundManager.play('click');
    setCliRunning(true);
    setTimeout(() => {
      const res = PythonEngine.execute(cliCode);
      if (res.success) {
        setCliOutput(res.stdout || 'Process finished with exit code 0.');
      } else {
        setCliOutput([res.stdout, res.stderr].filter(Boolean).join('\n'));
      }
      setCliRunning(false);
      SoundManager.play('success');
    }, 100);
  };

  const handleDisassemble = () => {
    SoundManager.play('click');
    setBytecodeOutput(`Disassembly of CPython Bytecode:
  1           0 LOAD_CONST               0 (<code object main at 0x7f9a, file "<script>", line 7>)
              2 LOAD_CONST               1 ('main')
              4 MAKE_FUNCTION            0
              6 STORE_NAME               0 (main)

  8           8 LOAD_NAME                1 (__name__)
             10 LOAD_CONST               2 ('__main__')
             12 COMPARE_OP               2 (==)
             14 POP_JUMP_IF_FALSE       22
             16 LOAD_NAME                0 (main)
             18 CALL_FUNCTION            0
             20 POP_TOP
        >>   22 LOAD_CONST               3 (None)
             24 RETURN_VALUE

Main Function OpCodes:
  LOAD_GLOBAL (sys) -> sys.executable
  CALL_FUNCTION (print)
  BUILD_LIST (random ints) -> [42, 88, 19, 73, 56, 91]
  STATISTICS_MEAN -> 61.5
  JSON_DUMPS -> {"os": "Helix Alpine", "status": "ONLINE"}`);
  };

  const handleLaunchGui = (code: string, name: string) => {
    SoundManager.play('open');
    GuiDisplayServer.get().parseAndLaunchPython(code, `${name.toLowerCase().replace(/\s+/g, '_')}.py`);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0d14] text-[#edf1f7] text-xs font-sans select-none overflow-hidden p-4">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-white/10 shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-amber-400 flex items-center gap-2">
              <span>Python 3.12 Script & Data Science Studio</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/30">
                CPython Active
              </span>
            </h1>
            <p className="text-[11px] text-gray-400">Data Analytics, Stdlib Inspector, CPython Bytecode Disassembler & Execution Console</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 gap-1 font-mono text-[11px]">
          <button
            onClick={() => { SoundManager.play('click'); setActiveTab('cli'); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cli' ? 'bg-amber-400 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>CLI Console</span>
          </button>

          <button
            onClick={() => { SoundManager.play('click'); setActiveTab('stdlib'); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stdlib' ? 'bg-sky-400 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Stdlib Inspector</span>
          </button>

          <button
            onClick={() => { SoundManager.play('click'); setActiveTab('bytecode'); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bytecode' ? 'bg-purple-400 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Bytecode Profiler</span>
          </button>

          <button
            onClick={() => { SoundManager.play('click'); setActiveTab('gui'); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gui' ? 'bg-emerald-400 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>GUI Launcher</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto my-3">
        {/* TAB 1: CLI Console */}
        {activeTab === 'cli' && (
          <div className="h-full flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col bg-[#121520] border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex justify-between items-center mb-2 font-mono text-xs">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  <span>Python 3 Script Editor</span>
                </span>
                <button
                  onClick={handleRunCli}
                  disabled={cliRunning}
                  className="px-4 py-1.5 bg-amber-400 text-black font-bold rounded-xl flex items-center gap-1.5 hover:bg-amber-300 transition cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{cliRunning ? 'Executing...' : 'Run Python Code'}</span>
                </button>
              </div>

              <textarea
                value={cliCode}
                onChange={(e) => setCliCode(e.target.value)}
                className="flex-1 w-full min-h-[220px] p-3 bg-black/70 border border-white/10 rounded-xl font-mono text-xs text-emerald-300 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            {/* Output Panel */}
            <div className="w-full md:w-80 flex flex-col bg-[#121520] border border-white/10 rounded-2xl p-4 shadow-xl">
              <span className="text-emerald-400 font-bold font-mono text-xs mb-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Standard Console Output (stdout)</span>
              </span>
              <div className="flex-1 bg-black/80 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-gray-200 overflow-y-auto whitespace-pre-wrap min-h-[160px]">
                {cliOutput !== null ? cliOutput : <span className="text-gray-500 italic">Click "Run Python Code" to see console execution output...</span>}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Standard Library Inspector */}
        {activeTab === 'stdlib' && (
          <div className="space-y-3">
            <div className="p-4 bg-[#121520] border border-white/10 rounded-2xl">
              <h2 className="font-bold text-sm text-sky-400 mb-1 font-mono flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>Python Standard Library Module Explorer</span>
              </h2>
              <p className="text-xs text-gray-300">
                Explore pre-built standard modules available locally in Python 3.12:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono">
              {[
                { name: 'sys & os', desc: 'System arguments, platform inspection, path resolution', sample: 'import sys, os\nprint(sys.platform, os.getcwd())' },
                { name: 'math & cmath', desc: 'Floating-point and complex math functions', sample: 'import math\nprint(math.factorial(10))' },
                { name: 'json & csv', desc: 'Data parsing, serialization, and structure export', sample: 'import json\nprint(json.dumps({"a": 1}))' },
                { name: 'statistics & random', desc: 'Mathematical statistics and pseudo-random generators', sample: 'import statistics, random\nprint(statistics.mean([1,2,3]))' },
                { name: 'datetime & time', desc: 'Date arithmetic, timestamps, and delay timers', sample: 'import datetime\nprint(datetime.datetime.now())' },
                { name: 'collections & itertools', desc: 'High-performance container datatypes & iterators', sample: 'from collections import Counter\nprint(Counter("helix"))' }
              ].map((m) => (
                <div key={m.name} className="p-3 bg-[#121520] border border-white/10 rounded-xl space-y-2">
                  <span className="font-bold text-xs text-sky-300">{m.name}</span>
                  <p className="text-[10px] text-gray-400">{m.desc}</p>
                  <pre className="p-2 bg-black/60 rounded text-[10px] text-emerald-300">{m.sample}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Bytecode Profiler */}
        {activeTab === 'bytecode' && (
          <div className="space-y-3">
            <div className="p-4 bg-[#121520] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-purple-400 mb-1 font-mono flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span>CPython Bytecode Disassembler (dis module)</span>
                </h2>
                <p className="text-xs text-gray-300">Inspect compiled opcode sequences, instruction stack & memory locations</p>
              </div>

              <button
                onClick={handleDisassemble}
                className="px-4 py-2 bg-purple-400 text-black font-extrabold rounded-xl text-xs hover:bg-purple-300 transition cursor-pointer"
              >
                Disassemble Current Script
              </button>
            </div>

            <div className="p-4 bg-black/80 border border-white/10 rounded-2xl font-mono text-xs text-purple-300 overflow-y-auto whitespace-pre-wrap min-h-[240px]">
              {bytecodeOutput !== null ? bytecodeOutput : <span className="text-gray-500 italic">Click "Disassemble Current Script" to analyze CPython opcodes...</span>}
            </div>
          </div>
        )}

        {/* TAB 4: GUI Launcher */}
        {activeTab === 'gui' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#121520] border border-white/10 rounded-2xl">
              <h2 className="font-bold text-sm text-emerald-400 mb-1 flex items-center gap-2 font-mono">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Supported Python Desktop GUI Runtimes</span>
              </h2>
              <p className="text-xs text-gray-300">
                Helix OS automatically parses, compiles, and routes Python GUI applications to the Virtual X11 Server (:0.0). Launch any framework instantly:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {guiPresets.map((preset) => (
                <div key={preset.name} className="p-4 bg-[#121520] border border-white/10 rounded-2xl flex flex-col justify-between hover:border-emerald-400/50 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white flex items-center gap-2 font-mono">
                        <span>{preset.icon}</span>
                        <span>{preset.name}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                        {preset.framework}
                      </span>
                    </div>
                    <pre className="p-2.5 bg-black/60 border border-white/5 rounded-xl font-mono text-[10px] text-emerald-300/90 overflow-x-auto max-h-28 mb-3">
                      {preset.code}
                    </pre>
                  </div>

                  <button
                    onClick={() => handleLaunchGui(preset.code, preset.name)}
                    className="w-full py-2 bg-emerald-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition cursor-pointer font-mono text-xs shadow-lg shadow-emerald-500/10"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Launch {preset.framework} Window (:0.0)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
