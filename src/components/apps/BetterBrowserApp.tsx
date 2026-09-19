import React, { useState } from 'react';
import {
  Globe,
  Plus,
  X,
  RotateCcw,
  Shield,
  Bookmark,
  Search,
  Lock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Settings,
  Eye,
  CheckCircle,
  Code
} from 'lucide-react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';

interface WebTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isSecure: boolean;
  history: string[];
  historyIndex: number;
}

const PRESET_BOOKMARKS = [
  { title: 'Helix OS Hub', url: 'https://alpine-linux.org' },
  { title: 'Python Docs', url: 'https://docs.python.org/3/' },
  { title: 'Linux Kernel Archive', url: 'https://kernel.org' },
  { title: 'Rust Language', url: 'https://www.rust-lang.org' },
  { title: 'Web Assembly Org', url: 'https://webassembly.org' },
];

export const BetterBrowserApp: React.FC = () => {
  const [tabs, setTabs] = useState<WebTab[]>([
    {
      id: 'tab-1',
      title: 'Helix OS Home',
      url: 'https://alpine-linux.org',
      isSecure: true,
      history: ['https://alpine-linux.org'],
      historyIndex: 0,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [addressInput, setAddressInput] = useState<string>('https://alpine-linux.org');
  const [showDevConsole, setShowDevConsole] = useState<boolean>(false);
  const [userAgent, setUserAgent] = useState<string>('Mozilla/5.0 (X11; Linux x86_64) HelixOS/6.0');
  const [bookmarks, setBookmarks] = useState(PRESET_BOOKMARKS);
  const [consoleLogs, setConsoleLogs] = useState<{ ts: string; level: string; msg: string }[]>([
    { ts: new Date().toLocaleTimeString(), level: 'INFO', msg: 'Helix Better Browser sandbox engine initialized' },
    { ts: new Date().toLocaleTimeString(), level: 'SECURITY', msg: 'TLS 1.3 certificate inspection active' },
  ]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleNavigate = (targetUrl: string) => {
    let formatted = targetUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      if (formatted.includes('.') && !formatted.includes(' ')) {
        formatted = 'https://' + formatted;
      } else {
        formatted = `https://duckduckgo.com/?q=${encodeURIComponent(formatted)}`;
      }
    }

    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id === activeTabId) {
          const newHistory = tab.history.slice(0, tab.historyIndex + 1);
          newHistory.push(formatted);
          return {
            ...tab,
            url: formatted,
            title: formatted.replace(/^https?:\/\//, '').split('/')[0] || 'Web Page',
            isSecure: formatted.startsWith('https://'),
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }
        return tab;
      })
    );

    setAddressInput(formatted);
    setConsoleLogs((prev) => [
      { ts: new Date().toLocaleTimeString(), level: 'NET', msg: `GET ${formatted} 200 OK (TLS 1.3)` },
      ...prev,
    ]);
  };

  const handleAddNewTab = () => {
    const newId = `tab-${Date.now()}`;
    const defaultUrl = 'https://alpine-linux.org';
    const newTab: WebTab = {
      id: newId,
      title: 'New Tab',
      url: defaultUrl,
      isSecure: true,
      history: [defaultUrl],
      historyIndex: 0,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setAddressInput(defaultUrl);
    SoundManager.play('open');
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const nextTabs = tabs.filter((t) => t.id !== id);
    setTabs(nextTabs);
    if (activeTabId === id) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id);
      setAddressInput(nextTabs[nextTabs.length - 1].url);
    }
  };

  const handleAddBookmark = () => {
    if (!bookmarks.some((b) => b.url === activeTab.url)) {
      setBookmarks((prev) => [...prev, { title: activeTab.title, url: activeTab.url }]);
      Toast.show(`Bookmarked ${activeTab.title}`, '⭐');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0f111a] text-gray-100 font-sans select-none overflow-hidden">
      {/* Top Tab Bar */}
      <div className="bg-[#141724] border-b border-white/10 flex items-center px-2 pt-1.5 gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => {
                setActiveTabId(tab.id);
                setAddressInput(tab.url);
              }}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs font-medium max-w-[180px] min-w-[120px] transition cursor-pointer border-t border-x ${
                isActive
                  ? 'bg-[#1e2336] text-white border-white/15'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border-transparent'
              }`}
            >
              <Globe className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-gray-500'}`} />
              <span className="truncate flex-1">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className="p-0.5 rounded hover:bg-white/20 text-gray-400 hover:text-white transition"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={handleAddNewTab}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
          title="New Tab"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Controls Bar */}
      <div className="p-2 bg-[#1b2030] border-b border-white/10 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleNavigate(activeTab.url)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
            title="Reload Page"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* URL Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNavigate(addressInput);
          }}
          className="flex-1 flex items-center gap-2 bg-[#12141d] border border-white/15 rounded-xl px-3 py-1.5 focus-within:border-cyan-400 transition"
        >
          {activeTab.isSecure ? (
            <span title="Secure TLS Connection">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </span>
          ) : (
            <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}

          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="Search or enter web URL..."
            className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none font-mono"
          />

          <button type="submit" className="text-gray-400 hover:text-white cursor-pointer">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddBookmark}
            className="p-1.5 rounded-lg hover:bg-white/10 text-amber-400 hover:text-amber-300 transition cursor-pointer"
            title="Add Bookmark"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowDevConsole(!showDevConsole)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              showDevConsole ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
            title="Toggle Developer Network Console"
          >
            <Code className="w-4 h-4" />
          </button>

          <a
            href={activeTab.url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
            title="Open in external tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Bookmarks Bar */}
      <div className="bg-[#12141e] border-b border-white/10 px-3 py-1 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs text-gray-300">
        <span className="text-[10px] uppercase font-bold text-gray-500 shrink-0">Bookmarks:</span>
        {bookmarks.map((bm, i) => (
          <button
            key={i}
            onClick={() => handleNavigate(bm.url)}
            className="px-2 py-0.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition truncate max-w-[140px] cursor-pointer"
          >
            {bm.title}
          </button>
        ))}
      </div>

      {/* Main Viewport Frame */}
      <div className="flex-1 relative bg-white">
        <iframe
          src={activeTab.url}
          title={activeTab.title}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>

      {/* Developer Console Drawer */}
      {showDevConsole && (
        <div className="h-44 bg-[#0a0c12] border-t border-white/15 p-2 font-mono text-xs flex flex-col space-y-1">
          <div className="flex items-center justify-between border-b border-white/10 pb-1 text-gray-400">
            <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Terminal className="w-3.5 h-3.5" /> DevTools Network & Security Inspector
            </span>
            <div className="flex items-center gap-2 text-[10px]">
              <span>User Agent: {userAgent.substring(0, 30)}...</span>
              <button
                onClick={() => setConsoleLogs([])}
                className="text-gray-400 hover:text-white underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 p-1 text-[11px]">
            {consoleLogs.map((log, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-gray-500">[{log.ts}]</span>
                <span className="px-1 py-0.2 rounded bg-white/10 text-cyan-300 font-bold">{log.level}</span>
                <span className="text-gray-200">{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
