import React, { useState, useRef } from 'react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { HelixSDK } from '../../kernel/HelixSDK';
import { 
  Code2, 
  Play, 
  RotateCcw, 
  Terminal, 
  FileCode, 
  Sparkles, 
  Database, 
  Layout, 
  Radio, 
  CheckCircle2, 
  Copy, 
  BookOpen,
  Zap,
  Sliders
} from 'lucide-react';

interface SdkTemplate {
  id: string;
  name: string;
  icon: string;
  desc: string;
  code: string;
}

export const HelixSdkPlaygroundApp: React.FC = () => {
  const templates: SdkTemplate[] = [
    {
      id: 'fs-demo',
      name: 'VFS File System API',
      icon: '📁',
      desc: 'Create, read, and list files on the Helix Virtual File System.',
      code: `// 1. Write a file into VFS
await helix.fs.write('/mnt/helix/demo_note.txt', 'Hello from Helix SDK (Puter/OS.js style)!\\nGenerated at: ' + new Date().toISOString());
console.log('✅ File written to /mnt/helix/demo_note.txt');

// 2. Read the file back
const content = await helix.fs.read('/mnt/helix/demo_note.txt');
console.log('📖 Read content:', content);

// 3. List files in directory
const files = await helix.fs.readdir('/mnt/helix');
console.log('📂 Directory listing /mnt/helix:', files);

// 4. Show a native system toast
helix.ui.toast('VFS File System operation completed!', '📄');`
    },
    {
      id: 'ai-demo',
      name: 'AI Neural Copilot API',
      icon: '🧠',
      desc: 'Query local AI copilot and generate code using `helix.ai`.',
      code: `// Query the Helix Copilot
console.log('🤖 Sending prompt to Helix AI Neural Engine...');
const reply = await helix.ai.chat('Explain how WebOS and microkernel architectures work in 2 sentences.');
console.log('🧠 AI Response:\\n', reply);

// Generate code snippet
const code = await helix.ai.completeCode('function calculateFPS() {', 'typescript');
console.log('⚡ AI Code Generator:\\n', code);

helix.ui.toast('AI Inference executed successfully!', '✨');`
    },
    {
      id: 'kv-demo',
      name: 'Key-Value Database API',
      icon: '🗄️',
      desc: 'Store persistent key-value states with `helix.kv`.',
      code: `// Store structured key-value state
const sessionData = {
  theme: 'dark-cyber',
  lastLogin: Date.now(),
  userPreferences: { soundVolume: 80, crtShader: true }
};

await helix.kv.set('app_preferences', JSON.stringify(sessionData));
console.log('💾 Stored preferences into helix.kv');

// Retrieve stored key
const raw = await helix.kv.get('app_preferences');
console.log('📥 Retrieved from helix.kv:', JSON.parse(raw));

// List all keys
const allKeys = await helix.kv.list();
console.log('🔑 All KV Store keys:', allKeys);`
    },
    {
      id: 'ui-demo',
      name: 'UI & Window API',
      icon: '🖥️',
      desc: 'Trigger native OS toasts, play sound effects, and launch windows.',
      code: `// 1. Play audio effect
helix.ui.playSound('success');

// 2. Display custom toast notification
helix.ui.toast('Launching Developer Tools Studio from SDK...', '🚀');

// 3. Launch an app window programmatically
helix.ui.launchApp('dev-tools-studio');
console.log('🪟 Launched dev-tools-studio window via helix.ui.launchApp()');`
    },
    {
      id: 'ipc-demo',
      name: 'IPC Message Bus API',
      icon: '📡',
      desc: 'Inter-process event broadcasting inspired by OS.js message channels.',
      code: `// Register a message listener
const unsubscribe = helix.ipc.on('telemetry_ping', (data) => {
  console.log('📡 IPC Message Received on [telemetry_ping]:', data);
});

// Broadcast payload across IPC channel
helix.ipc.send('telemetry_ping', {
  source: 'SdkPlayground',
  timestamp: Date.now(),
  message: 'Inter-process heartbeat sync'
});

console.log('✅ Dispatched IPC message. Listener triggered.');`
    }
  ];

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('fs-demo');
  const [code, setCode] = useState<string>(templates[0].code);
  const [logs, setLogs] = useState<Array<{ type: 'log' | 'error' | 'warn'; text: string; time: string }>>([
    { type: 'log', text: 'Helix Developer SDK v11.5.0 initialized. Ready for execution.', time: new Date().toLocaleTimeString() }
  ]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const handleTemplateSelect = (tmpl: SdkTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setCode(tmpl.code);
    SoundManager.play('click');
  };

  const handleRunScript = async () => {
    setIsExecuting(true);
    SoundManager.play('open');
    setLogs((prev) => [
      ...prev,
      { type: 'log', text: `▶ Executing script at ${new Date().toLocaleTimeString()}...`, time: new Date().toLocaleTimeString() }
    ]);

    // Custom console wrapper
    const customConsole = {
      log: (...args: any[]) => {
        const text = args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ');
        setLogs((prev) => [...prev, { type: 'log', text, time: new Date().toLocaleTimeString() }]);
      },
      error: (...args: any[]) => {
        const text = args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ');
        setLogs((prev) => [...prev, { type: 'error', text, time: new Date().toLocaleTimeString() }]);
      },
      warn: (...args: any[]) => {
        const text = args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ');
        setLogs((prev) => [...prev, { type: 'warn', text, time: new Date().toLocaleTimeString() }]);
      }
    };

    try {
      // Create async function wrapper with helix and console injected
      const asyncFn = new Function('helix', 'console', `return (async () => { ${code} })();`);
      await asyncFn((window as any).helix || HelixSDK, customConsole);
      SoundManager.play('success');
      setLogs((prev) => [
        ...prev,
        { type: 'log', text: '✔ Script execution finished cleanly.', time: new Date().toLocaleTimeString() }
      ]);
    } catch (err: any) {
      SoundManager.play('error');
      setLogs((prev) => [
        ...prev,
        { type: 'error', text: `❌ Execution Error: ${err.message || String(err)}`, time: new Date().toLocaleTimeString() }
      ]);
      Toast.show('Script Error: ' + err.message, '⚠️');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    SoundManager.play('click');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    Toast.show('Code copied to clipboard', '📋');
    SoundManager.play('click');
  };

  return (
    <div className="h-full flex flex-col bg-[#070a10] text-gray-200 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="p-3.5 bg-[#0d121c] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-md">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              Helix Developer SDK Studio
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-mono border border-violet-500/30">
                Puter.js & OS.js API Standard
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Interactive JavaScript playground for `helix.fs`, `helix.ai`, `helix.kv`, `helix.ui`, and `helix.ipc`.
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/10"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Code</span>
          </button>
          <button
            onClick={handleRunScript}
            disabled={isExecuting}
            className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-violet-600/20"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{isExecuting ? 'Running...' : 'Run Script'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Template Catalog */}
        <div className="w-full md:w-60 bg-[#0a0e17] border-r border-white/10 p-3 space-y-1.5 overflow-y-auto shrink-0">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">
            SDK Quick Starts
          </div>
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => handleTemplateSelect(tmpl)}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                selectedTemplateId === tmpl.id
                  ? 'bg-violet-500/20 border-violet-500 text-white'
                  : 'bg-black/30 border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{tmpl.icon}</span>
                <span className="font-bold text-xs">{tmpl.name}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">{tmpl.desc}</p>
            </div>
          ))}

          <div className="pt-3 border-t border-white/10 mt-3 space-y-2">
            <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-violet-400" />
              SDK Namespaces
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1.5 text-[11px] font-mono text-gray-300">
              <div><span className="text-violet-400">helix.fs</span> — VFS I/O</div>
              <div><span className="text-pink-400">helix.ai</span> — Neural Chat</div>
              <div><span className="text-cyan-400">helix.kv</span> — Key-Value DB</div>
              <div><span className="text-amber-400">helix.ui</span> — Windows & Toasts</div>
              <div><span className="text-emerald-400">helix.ipc</span> — Event Bus</div>
            </div>
          </div>
        </div>

        {/* Center: Live Editor */}
        <div className="flex-1 flex flex-col border-r border-white/10 overflow-hidden">
          <div className="p-2.5 bg-[#0b0f19] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
              <FileCode className="w-4 h-4 text-violet-400" />
              <span>sdk-script.js</span>
            </div>
            <span className="text-[10px] font-mono text-gray-500">Global context: `window.helix`</span>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 p-4 bg-[#05070c] text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none resize-none overflow-y-auto selection:bg-violet-500/30 selection:text-white"
          />
        </div>

        {/* Right: Interactive Console Output */}
        <div className="w-full md:w-80 flex flex-col bg-[#080c14] overflow-hidden">
          <div className="p-2.5 bg-[#0b0f19] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Console Output</span>
            </div>
            <button
              onClick={handleClearLogs}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-[10px] font-mono transition cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-2 bg-[#05080e]">
            {logs.length === 0 ? (
              <div className="text-gray-600 text-center py-8 text-xs">No output logged yet. Run a script to see results.</div>
            ) : (
              logs.map((l, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg border text-[11px] leading-relaxed break-all ${
                    l.type === 'error'
                      ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                      : l.type === 'warn'
                      ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                      : 'bg-white/5 border-white/5 text-gray-300'
                  }`}
                >
                  <div className="text-[9px] text-gray-500 mb-0.5">{l.time}</div>
                  <pre className="whitespace-pre-wrap font-mono">{l.text}</pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
