import React, { useState, useEffect, useRef } from 'react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { Kernel } from '../../kernel';
import { 
  Terminal as TerminalIcon, 
  Play, 
  Square, 
  RotateCw, 
  Globe, 
  FileCode, 
  Package, 
  Server, 
  ExternalLink,
  Layers,
  Code2,
  Check,
  Zap,
  Activity
} from 'lucide-react';

interface VirtualFile {
  name: string;
  path: string;
  content: string;
}

export const NodeWebContainerApp: React.FC = () => {
  const defaultFiles: Record<string, string> = {
    'server.js': `// Node.js & Express In-Browser WebContainer Server
const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory database
let todos = [
  { id: 1, text: 'Explore WebContainer Node.js runtime', completed: true },
  { id: 2, text: 'Run live in-browser Express server', completed: true },
  { id: 3, text: 'Build real full-stack web applets', completed: false }
];

// Serve dynamic HTML dashboard
app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Node.js WebContainer Live Output</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen p-6 font-sans">
      <div class="max-w-xl mx-auto space-y-6">
        <div class="p-6 bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-xl space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xl">
              ⚡
            </div>
            <div>
              <h1 class="text-lg font-bold text-white">Live Node.js WebContainer Server</h1>
              <p class="text-xs text-emerald-400 font-mono">Running on port 3000 • In-Memory WASM Sandbox</p>
            </div>
          </div>
          <p class="text-xs text-slate-300">
            This web service is running purely inside your browser sandbox using the StackBlitz WebContainer micro-OS architecture!
          </p>
        </div>

        <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">Server State: Active Tasks</h2>
          <div class="space-y-2">
            \${todos.map(t => \`
              <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <span class="\${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}">\${t.text}</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono \${t.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}">
                  \${t.completed ? 'DONE' : 'PENDING'}
                </span>
              </div>
            \`).join('')}
          </div>
        </div>
      </div>
    </body>
    </html>
  \`);
});

// JSON API endpoint
app.get('/api/todos', (req, res) => {
  res.json({ status: 'ok', count: todos.length, data: todos });
});

app.listen(PORT, () => {
  console.log(\`[Server] Node.js Express server listening at http://localhost:\${PORT}\`);
});`,
    'package.json': `{
  "name": "in-browser-microservice",
  "version": "1.0.0",
  "description": "Full-stack Node.js server running in WebContainer WASM environment",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5"
  }
}`
  };

  const [activeFile, setActiveFile] = useState<string>('server.js');
  const [files, setFiles] = useState<Record<string, string>>(defaultFiles);
  const [isServerRunning, setIsServerRunning] = useState<boolean>(true);
  const [currentUrl, setCurrentUrl] = useState<string>('http://localhost:3000/');
  const [serverLogs, setServerLogs] = useState<Array<{ time: string; text: string; type: 'info' | 'req' | 'err' }>>([
    { time: new Date().toLocaleTimeString(), text: 'WebContainer runtime environment initialized (Node.js v20.14.0)', type: 'info' },
    { time: new Date().toLocaleTimeString(), text: 'Dependencies loaded: express@4.19.2, cors@2.8.5', type: 'info' },
    { time: new Date().toLocaleTimeString(), text: '[Server] Listening on http://localhost:3000', type: 'info' }
  ]);
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal' | 'network'>('editor');

  // Evaluate the simulated Node.js script to produce live HTML / API responses
  const executeServer = () => {
    try {
      const code = files['server.js'];
      // Extract HTML from res.send(`...`)
      const match = code.match(/res\.send\(\s*`([\s\S]*?)`\s*\)/);
      if (match && match[1]) {
        // Simple template literal substitution for ${todos.map(...)}
        let parsed = match[1];
        if (parsed.includes('${todos.map')) {
          parsed = parsed.replace(/\$\{todos\.map[\s\S]*?join\(''\)\}/g, `
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <span class="line-through text-slate-500">Explore WebContainer Node.js runtime</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400">DONE</span>
            </div>
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <span class="line-through text-slate-500">Run live in-browser Express server</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400">DONE</span>
            </div>
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <span class="text-slate-200">Build real full-stack web applets</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-400">PENDING</span>
            </div>
          `);
        }
        setRenderedHtml(parsed);
      } else {
        setRenderedHtml(`
          <div style="background:#090d16;color:#fff;padding:24px;font-family:monospace;">
            <h3>HTTP 200 OK</h3>
            <p>Node.js Server returned active response.</p>
          </div>
        `);
      }

      setServerLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: 'GET / 200 OK - 4ms (Transferred 1.2 KB)', type: 'req' }
      ]);
    } catch (err: any) {
      setServerLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `[Error] ${err.message}`, type: 'err' }
      ]);
    }
  };

  useEffect(() => {
    if (isServerRunning) {
      executeServer();
    }
  }, [files, isServerRunning]);

  const handleStartStop = () => {
    if (isServerRunning) {
      setIsServerRunning(false);
      SoundManager.play('close');
      setServerLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: '[Process] Server terminated by user (SIGTERM)', type: 'info' }
      ]);
      Toast.show('WebContainer Server stopped', '🛑');
    } else {
      setIsServerRunning(true);
      SoundManager.play('success');
      setServerLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: '[Process] node server.js started (PID: 4082)', type: 'info' },
        { time: new Date().toLocaleTimeString(), text: '[Server] Listening on http://localhost:3000', type: 'info' }
      ]);
      Toast.show('WebContainer Server running', '⚡');
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    setServerLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `$ ${cmd}`, type: 'info' }]);

    if (cmd === 'clear') {
      setServerLogs([]);
    } else if (cmd.startsWith('node ')) {
      setServerLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: 'Executing Node.js script...', type: 'info' }
      ]);
      executeServer();
    } else if (cmd.startsWith('npm install') || cmd.startsWith('npm i')) {
      const pkg = cmd.split(' ')[2] || 'package';
      setServerLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `added 1 package [${pkg}], and audited 42 packages in 320ms`, type: 'info' }
      ]);
      Toast.show(`Installed ${pkg} into WebContainer node_modules`, '📦');
    } else if (cmd === 'npm run dev' || cmd === 'npm start') {
      setIsServerRunning(true);
      executeServer();
    } else {
      try {
        // Evaluate JavaScript expression
        const res = eval(cmd);
        setServerLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), text: `< ${typeof res === 'object' ? JSON.stringify(res) : String(res)}`, type: 'info' }
        ]);
      } catch (err: any) {
        setServerLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), text: `Error: ${err.message}`, type: 'err' }
        ]);
      }
    }
    setTerminalInput('');
  };

  return (
    <div className="h-full flex flex-col bg-[#070a10] text-gray-200 font-sans select-none overflow-hidden">
      {/* Header Bar */}
      <div className="p-3 bg-[#0d121c] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm shadow">
            ⚡
          </div>
          <div>
            <h2 className="font-bold text-white text-xs flex items-center gap-2">
              Node.js WebContainer Runtime
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                StackBlitz Architecture
              </span>
            </h2>
            <p className="text-[11px] text-gray-400">In-browser Node.js micro-OS with live HTTP server and live preview.</p>
          </div>
        </div>

        {/* Server Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartStop}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow ${
              isServerRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isServerRunning ? <Square className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{isServerRunning ? 'Stop Server' : 'Run Server'}</span>
          </button>
        </div>
      </div>

      {/* Main Split: Left Code/Terminal, Right Live Web Preview */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: File Explorer, Code Editor, Terminal */}
        <div className="w-full lg:w-1/2 flex flex-col border-r border-white/10 overflow-hidden">
          {/* File Tabs & Views */}
          <div className="p-2 bg-[#0a0e17] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {Object.keys(files).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setActiveFile(f);
                    SoundManager.play('click');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                    activeFile === f
                      ? 'bg-white/10 text-white font-bold border border-white/10'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{f}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                  activeTab === 'editor' ? 'bg-emerald-600 text-white' : 'text-gray-400'
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                  activeTab === 'terminal' ? 'bg-emerald-600 text-white' : 'text-gray-400'
                }`}
              >
                Logs / REPL
              </button>
            </div>
          </div>

          {/* Editor or Terminal Output */}
          {activeTab === 'editor' ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#05070c]">
              <textarea
                value={files[activeFile]}
                onChange={(e) => {
                  const val = e.target.value;
                  setFiles(prev => ({ ...prev, [activeFile]: val }));
                }}
                spellCheck={false}
                className="flex-1 p-4 bg-transparent text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none resize-none overflow-y-auto"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col bg-[#05080e] overflow-hidden">
              <div className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-1">
                {serverLogs.map((l, i) => (
                  <div
                    key={i}
                    className={`text-[11px] leading-tight ${
                      l.type === 'err'
                        ? 'text-rose-400'
                        : l.type === 'req'
                        ? 'text-cyan-300'
                        : 'text-gray-300'
                    }`}
                  >
                    <span className="text-gray-600 mr-2">[{l.time}]</span>
                    <span>{l.text}</span>
                  </div>
                ))}
              </div>

              {/* Terminal REPL Input */}
              <form onSubmit={handleTerminalSubmit} className="p-2 bg-black/60 border-t border-white/10 flex items-center gap-2">
                <span className="text-emerald-400 font-mono text-xs font-bold">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="node -v, npm install, express routes..."
                  className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none"
                />
              </form>
            </div>
          )}
        </div>

        {/* Right Side: Live In-Browser Web Preview */}
        <div className="w-full lg:w-1/2 flex flex-col bg-[#0a0e17] overflow-hidden">
          {/* Browser Address Bar */}
          <div className="p-2.5 bg-[#0d121c] border-b border-white/10 flex items-center gap-2">
            <button
              onClick={() => {
                executeServer();
                SoundManager.play('click');
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              title="Reload Preview"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <div className="flex-1 px-3 py-1 bg-black/50 border border-white/10 rounded-xl flex items-center gap-2 text-xs font-mono text-gray-300">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentUrl}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-[10px] font-mono border border-emerald-500/20">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>200 OK</span>
            </div>
          </div>

          {/* Rendered HTML Container */}
          <div className="flex-1 bg-white overflow-y-auto">
            {isServerRunning ? (
              <iframe
                title="WebContainer Live Preview"
                srcDoc={renderedHtml}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 text-xl font-bold">
                  🛑
                </div>
                <h3 className="font-bold text-white text-sm">Server Stopped</h3>
                <p className="text-xs text-gray-400 max-w-sm">Click "Run Server" to re-launch the Node.js Express process in WebContainer sandbox.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
