import React, { useState } from 'react';
import { Globe, ArrowLeft, ArrowRight, RefreshCw, Shield, Lock, Bookmark, ExternalLink, Code2, Search, BookOpen, Terminal, Sparkles, PanelLeftClose, PanelLeft, History, Clock } from 'lucide-react';
import { Toast } from '../../kernel/Toast';
import { Kernel } from '../../kernel';

interface BookmarkItem {
  title: string;
  url: string;
  icon: string;
}

const BOOKMARKS: BookmarkItem[] = [
  { title: 'Alpine Wiki', url: 'https://wiki.alpinelinux.org', icon: '🏔️' },
  { title: 'Python Docs', url: 'https://docs.python.org/3', icon: '🐍' },
  { title: 'Linux Man Pages', url: 'https://man.alpinelinux.org', icon: '📖' },
  { title: 'Hacker News', url: 'https://news.ycombinator.com', icon: '⚡' },
  { title: 'Local VFS Host', url: 'http://localhost/welcome.html', icon: '🖥️' },
];

export const WebBrowserApp: React.FC = () => {
  const [url, setUrl] = useState('https://wiki.alpinelinux.org');
  const [inputUrl, setInputUrl] = useState('https://wiki.alpinelinux.org');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(['https://wiki.alpinelinux.org']);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'bookmarks' | 'history'>('bookmarks');

  const navigateTo = (newUrl: string) => {
    setIsLoading(true);
    setInputUrl(newUrl);
    setUrl(newUrl);
    setHistory((prev) => [...prev.slice(0, historyIdx + 1), newUrl]);
    setHistoryIdx((prev) => prev + 1);
    setTimeout(() => setIsLoading(false), 400);
  };

  const handleBack = () => {
    if (historyIdx > 0) {
      const prevUrl = history[historyIdx - 1];
      setHistoryIdx((prev) => prev - 1);
      setUrl(prevUrl);
      setInputUrl(prevUrl);
    }
  };

  const handleForward = () => {
    if (historyIdx < history.length - 1) {
      const nextUrl = history[historyIdx + 1];
      setHistoryIdx((prev) => prev + 1);
      setUrl(nextUrl);
      setInputUrl(nextUrl);
    }
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let target = inputUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    navigateTo(target);
  };

  return (
    <div className="h-full flex flex-col bg-[#12141c] text-[#edf1f7] text-xs select-none">
      {/* Browser Bar */}
      <div className="px-3 py-2 bg-[#181b26] border-b border-white/10 flex items-center gap-2 shrink-0">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className={`p-1.5 rounded-lg border transition cursor-pointer ${
            showSidebar ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
          }`}
          title={showSidebar ? 'Collapse Side Panel' : 'Open Bookmarks & History'}
        >
          {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-1 text-gray-400">
          <button
            onClick={handleBack}
            disabled={historyIdx <= 0}
            className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer disabled:opacity-30 transition"
            title="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIdx >= history.length - 1}
            className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer disabled:opacity-30 transition"
            title="Forward"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 400);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer text-gray-400 hover:text-white transition"
            title="Reload"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

        <form onSubmit={handleNavigate} className="flex-1 flex items-center bg-black/40 border border-white/15 rounded-xl px-3 py-1 gap-2">
          <Lock className="w-3 h-3 text-[#6ee7b7]" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full bg-transparent font-mono text-xs text-white focus:outline-none"
            placeholder="Search or enter web URL..."
          />
        </form>

        <button
          onClick={() => {
            Toast.show(`Saved bookmark for ${url}`, '⭐');
          }}
          className="p-1.5 text-amber-400 hover:bg-white/10 rounded-lg cursor-pointer transition"
          title="Bookmark this page"
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bookmarks Quick Toolbar */}
      <div className="px-3 py-1 bg-[#141620] border-b border-white/5 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[10px] text-gray-500 font-mono">Favorites:</span>
        {BOOKMARKS.map((b) => (
          <button
            key={b.title}
            onClick={() => navigateTo(b.url)}
            className={`px-2 py-0.5 rounded-lg text-[11px] flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              url === b.url ? 'bg-white/15 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{b.icon}</span>
            <span>{b.title}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        {showSidebar && (
          <div className="w-60 bg-[#141724] border-r border-white/10 flex flex-col shrink-0 overflow-hidden">
            <div className="p-2 border-b border-white/10 flex items-center gap-1">
              <button
                onClick={() => setActiveSidebarTab('bookmarks')}
                className={`flex-1 py-1 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeSidebarTab === 'bookmarks' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Bookmark className="w-3 h-3" />
                <span>Bookmarks</span>
              </button>
              <button
                onClick={() => setActiveSidebarTab('history')}
                className={`flex-1 py-1 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeSidebarTab === 'history' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                <History className="w-3 h-3" />
                <span>History</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {activeSidebarTab === 'bookmarks' ? (
                BOOKMARKS.map((b) => (
                  <div
                    key={b.title}
                    onClick={() => navigateTo(b.url)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white transition cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-base">{b.icon}</span>
                    <div className="overflow-hidden">
                      <div className="font-semibold text-xs truncate">{b.title}</div>
                      <div className="font-mono text-[10px] text-gray-500 truncate">{b.url}</div>
                    </div>
                  </div>
                ))
              ) : (
                history.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => navigateTo(h)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white transition cursor-pointer flex items-center gap-2 font-mono text-[11px]"
                  >
                    <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">{h}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Viewport Content */}
        <div className="flex-1 bg-[#0a0c12] flex flex-col p-4 sm:p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 font-mono text-gray-400">
              <RefreshCw className="w-7 h-7 animate-spin text-[#6ee7b7]" />
              <span className="text-sm">Connecting & Rendering {url}...</span>
            </div>
          ) : url.includes('wiki.alpinelinux.org') ? (
            <div className="max-w-3xl mx-auto w-full space-y-4">
              <div className="bg-[#141724] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl">🏔️</div>
                    <div>
                      <h1 className="text-base font-bold text-white">Alpine Linux Documentation Wiki</h1>
                      <p className="text-gray-400 text-xs">Small. Simple. Secure. Alpine v3.20 Official Handbook</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">VERIFIED TLS 1.3</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 hover:border-emerald-400/40 transition cursor-pointer" onClick={() => Toast.show('Package manager APK guide loaded', '📦')}>
                    <h3 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                      <span>📦</span> APK Package Management
                    </h3>
                    <p className="text-gray-400 text-[11px]">Install, update, and manage lightweight musl binaries with <code>apk add</code> and <code>apk update</code>.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 hover:border-emerald-400/40 transition cursor-pointer" onClick={() => Toast.show('OpenRC init guide loaded', '⚙️')}>
                    <h3 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                      <span>⚙️</span> OpenRC Init Daemons
                    </h3>
                    <p className="text-gray-400 text-[11px]">Manage system services, runlevels (boot, default), and background daemons via <code>rc-service</code>.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 hover:border-emerald-400/40 transition cursor-pointer" onClick={() => Toast.show('Netfilter firewall guide loaded', '🛡️')}>
                    <h3 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                      <span>🛡️</span> Security & Iptables
                    </h3>
                    <p className="text-gray-400 text-[11px]">Kernel-level packet filtering with iptables, nftables, and grsecurity hardening.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 hover:border-emerald-400/40 transition cursor-pointer" onClick={() => Toast.show('Virtual X11 display server documentation loaded', '🖥️')}>
                    <h3 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                      <span>🖥️</span> Display Server & GUI Runner
                    </h3>
                    <p className="text-gray-400 text-[11px]">Launch native Tkinter, Turtle, PySimpleGUI, and Zenity desktop client windows on <code>:0.0</code>.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : url.includes('docs.python.org') ? (
            <div className="max-w-3xl mx-auto w-full space-y-4">
              <div className="bg-[#141724] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">🐍</div>
                    <div>
                      <h1 className="text-base font-bold text-white">Python 3.12 Runtime Documentation</h1>
                      <p className="text-gray-400 text-xs">Standard Library Reference & GUI Frameworks</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-[10px]">CPython 3.12</span>
                </div>
                <div className="p-4 bg-black/40 rounded-xl border border-white/10 font-mono text-xs space-y-2">
                  <div className="text-cyan-300 font-semibold"># Built-in GUI Capabilities in Helix OS:</div>
                  <div className="text-gray-300"><code>import tkinter as tk  # Native Tkinter Widgets</code></div>
                  <div className="text-gray-300"><code>import turtle        # Real-time 2D Vector Drawing</code></div>
                  <div className="text-gray-300"><code>import PySimpleGUI   # Rapid UI Layouts</code></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto w-full my-auto bg-[#181b26] border border-white/15 rounded-2xl p-8 space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#6ee7b7]/20 border border-[#6ee7b7]/30 flex items-center justify-center mx-auto text-[#6ee7b7]">
                <Globe className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white tracking-wide">Alpine Web Sandbox Client</h2>
                <p className="text-gray-400 text-xs font-mono">Connected to sandbox URL: <span className="text-[#6ee7b7]">{url}</span></p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-left font-mono text-[11px] text-gray-300 space-y-2">
                <div>HTTP Status: <span className="text-emerald-400">200 OK (Secure TLS 1.3)</span></div>
                <div>Content-Type: <span className="text-cyan-300">text/html; charset=utf-8</span></div>
                <div>Host Engine: <span className="text-purple-300">Alpine Linux musl x86_64</span></div>
              </div>
              <button
                onClick={() => navigateTo('https://wiki.alpinelinux.org')}
                className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl font-medium transition cursor-pointer"
              >
                Return to Alpine Linux Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
