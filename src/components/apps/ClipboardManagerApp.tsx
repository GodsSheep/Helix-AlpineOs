import React, { useState, useEffect } from 'react';
import { Toast } from '../../kernel/Toast';
import { Kernel } from '../../kernel';
import { Clipboard, Pin, Trash2, Copy, Search, Check, Save, FileText, Code } from 'lucide-react';

interface ClipboardSnippet {
  id: string;
  text: string;
  timestamp: string;
  isPinned: boolean;
  type: 'code' | 'url' | 'json' | 'text';
}

const DEFAULT_SNIPPETS: ClipboardSnippet[] = [
  {
    id: '1',
    text: 'apk add --no-cache curl wget git bash htop neofetch',
    timestamp: '5m ago',
    isPinned: true,
    type: 'code',
  },
  {
    id: '2',
    text: 'https://dl-cdn.alpinelinux.org/alpine/v3.20/main',
    timestamp: '15m ago',
    isPinned: true,
    type: 'url',
  },
  {
    id: '3',
    text: '{"hostname": "helix-alpine", "architecture": "x86_64", "kernel": "6.6.14-virt"}',
    timestamp: '42m ago',
    isPinned: false,
    type: 'json',
  },
  {
    id: '4',
    text: 'root@helix-alpine:~# rc-service sshd restart',
    timestamp: '1h ago',
    isPinned: false,
    type: 'code',
  },
];

export const ClipboardManagerApp: React.FC = () => {
  const [snippets, setSnippets] = useState<ClipboardSnippet[]>(() => {
    try {
      const saved = localStorage.getItem('helix_clipboard_history');
      return saved ? JSON.parse(saved) : DEFAULT_SNIPPETS;
    } catch {
      return DEFAULT_SNIPPETS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('helix_clipboard_history', JSON.stringify(snippets));
    } catch {}
  }, [snippets]);

  const handleCopy = (item: ClipboardSnippet) => {
    navigator.clipboard?.writeText(item.text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
    Toast.show('Copied to system clipboard', '📋');
  };

  const handleTogglePin = (id: string) => {
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  const handleDelete = (id: string) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
    Toast.show('Snippet deleted', '🗑️');
  };

  const handleClearUnpinned = () => {
    setSnippets((prev) => prev.filter((s) => s.isPinned));
    Toast.show('Cleared unpinned history', '🧹');
  };

  const handleSaveToVFS = async () => {
    try {
      const content = snippets.map((s) => `[${s.timestamp}] ${s.isPinned ? '[PINNED] ' : ''}${s.text}`).join('\n\n');
      await Kernel.vfs.write('/root/clipboard_export.txt', content);
      Toast.show('Exported clipboard history to /root/clipboard_export.txt', '💾');
    } catch {
      Toast.show('Failed saving clipboard to VFS', '⚠️');
    }
  };

  const filtered = snippets.filter((s) =>
    s.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141724] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Clipboard className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm">Clipboard History Daemon</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400">
            CopyQ / GPaste
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearUnpinned}
            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[11px] transition"
          >
            Clear Unpinned
          </button>
          <button
            onClick={handleSaveToVFS}
            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded flex items-center gap-1.5 font-medium transition"
          >
            <Save className="w-3 h-3" />
            <span>Export to VFS</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-2 bg-[#10121d] border-b border-white/10 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search clipboard snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 bg-black/40 border border-white/15 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Snippet List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-xl border transition ${
              item.isPinned
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-[#12141f] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/5 text-[10px] text-gray-500 font-mono">
              <div className="flex items-center gap-2">
                <span className="uppercase text-emerald-400 font-bold">{item.type}</span>
                <span>•</span>
                <span>{item.timestamp}</span>
                <span>•</span>
                <span>{item.text.length} chars</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTogglePin(item.id)}
                  className={`p-1 rounded hover:bg-white/10 transition ${item.isPinned ? 'text-amber-400' : 'text-gray-500 hover:text-white'}`}
                  title={item.isPinned ? 'Unpin' : 'Pin to top'}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleCopy(item)}
                  className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-emerald-300 transition"
                  title="Copy to Clipboard"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <pre className="font-mono text-xs text-gray-200 whitespace-pre-wrap select-text leading-relaxed">
              {item.text}
            </pre>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="h-48 flex items-center justify-center text-gray-500 text-xs">
            No clipboard entries match your query
          </div>
        )}
      </div>
    </div>
  );
};
