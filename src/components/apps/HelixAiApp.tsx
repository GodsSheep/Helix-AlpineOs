import React, { useState, useEffect, useRef } from 'react';
import { HelixAiCopilot, AiMessage, AiCopilotStatus } from '../../kernel/HelixAiCopilot';
import { 
  Bot, 
  Send, 
  Cpu, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Terminal, 
  Code, 
  ShieldCheck, 
  Copy, 
  Check, 
  RotateCcw, 
  Zap 
} from 'lucide-react';

interface HelixAiAppProps {
  notify?: (msg: string) => void;
}

export const HelixAiApp: React.FC<HelixAiAppProps> = ({ notify }) => {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: 'Hello! I am your 100% Client-Side Helix AI Copilot. Operating on local GPU/WASM with zero data leaving your browser.',
      timestamp: Date.now(),
      executionMode: 'GPU (WebGPU)',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<AiCopilotStatus>(HelixAiCopilot.getStatus());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = HelixAiCopilot.subscribe(setStatus);
    return unsub;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputPrompt.trim() || isGenerating) return;

    const userText = inputPrompt.trim();
    setInputPrompt('');

    const userMsg: AiMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };

    const botMsgId = `bot-${Date.now()}`;
    const botMsg: AiMessage = {
      id: botMsgId,
      role: 'assistant',
      content: '...',
      timestamp: Date.now(),
      executionMode: status.backend,
      tokensPerSec: 42,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setIsGenerating(true);

    try {
      await HelixAiCopilot.generateResponse(userText, (chunk) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, content: chunk } : m))
        );
      });
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, content: 'Error processing local model inference.' }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (notify) notify('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0e14] text-gray-200 animate-fade-in">
      {/* Header Bar */}
      <div className="p-3.5 bg-[#121622] border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span>Helix Client-Side AI Copilot</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
                100% LOCAL
              </span>
            </h3>
            <p className="text-[11px] text-gray-400 font-mono">
              Backend: <span className="text-cyan-300 font-bold">{status.backend}</span> • Model: {status.modelName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => HelixAiCopilot.toggleSpeech()}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              status.speechEnabled
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-white/5 text-gray-400 border-white/10'
            }`}
            title="Toggle Offline TTS Voice"
          >
            {status.speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl p-3.5 rounded-2xl border space-y-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-purple-600/30 border-purple-500/40 text-white rounded-br-none'
                  : 'bg-[#141824] border-white/10 text-gray-200 rounded-bl-none shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-[10px] text-gray-400 pb-1 border-b border-white/5">
                <span className="font-bold text-gray-300">
                  {msg.role === 'user' ? 'You' : 'Helix AI Copilot'}
                </span>
                {msg.executionMode && (
                  <span className="font-mono text-cyan-400">{msg.executionMode}</span>
                )}
              </div>

              <div className="whitespace-pre-wrap font-mono">{msg.content}</div>

              {msg.role === 'assistant' && (
                <div className="flex items-center justify-between text-[10px] pt-1">
                  <span className="text-gray-500">Zero-Knowledge Privacy • Client-side</span>
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition cursor-pointer flex items-center gap-1"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Presets */}
      <div className="px-3 py-2 bg-[#0e111a] border-t border-white/5 flex items-center gap-2 overflow-x-auto text-[11px] font-mono scrollbar-none">
        <span className="text-gray-400 text-[10px] uppercase font-bold shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-400" />
          Presets:
        </span>
        <button
          onClick={() => {
            const prompt = 'Write a complete, robust Python data processing script that reads VFS files, parses metrics JSON, computes summary statistics, and saves the output report.';
            setInputPrompt(prompt);
          }}
          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold shrink-0 transition cursor-pointer flex items-center gap-1 shadow-sm"
        >
          🐍 Python Script
        </button>
        <button
          onClick={() => {
            const prompt = 'Write a high-performance Rust module using wasm-bindgen for fast buffer manipulation, SHA-256 hash calculation, and C ABI binding exports.';
            setInputPrompt(prompt);
          }}
          className="px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/40 font-bold shrink-0 transition cursor-pointer flex items-center gap-1 shadow-sm"
        >
          🦀 Rust WASM
        </button>
        <button
          onClick={() => {
            const prompt = 'Write a comprehensive POSIX bash automation script for system health diagnostics, disk usage report, memory pressure check, and VFS backup.';
            setInputPrompt(prompt);
          }}
          className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-bold shrink-0 transition cursor-pointer flex items-center gap-1 shadow-sm"
        >
          ⚡ Bash Script
        </button>
        <button
          onClick={() => {
            const prompt = 'Inspect current Helix OS local client-side execution backends, WebGPU/WASM runtime capabilities, VFS mountpoints, and memory footprints.';
            setInputPrompt(prompt);
          }}
          className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 font-bold shrink-0 transition cursor-pointer flex items-center gap-1 shadow-sm"
        >
          ⚙️ Kernel Specs
        </button>
      </div>

      {/* Input Field */}
      <div className="p-3 bg-[#121622] border-t border-white/10 flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask local AI copilot (e.g. generate bash script, check status, code debug)..."
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
        />
        <button
          onClick={handleSend}
          disabled={!inputPrompt.trim() || isGenerating}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
