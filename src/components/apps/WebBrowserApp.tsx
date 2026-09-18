import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  Shield, 
  Lock, 
  Bookmark, 
  ExternalLink, 
  Code2, 
  Search, 
  BookOpen, 
  Terminal, 
  Sparkles, 
  PanelLeftClose, 
  PanelLeft, 
  History, 
  Clock, 
  Server, 
  Activity, 
  Check, 
  X,
  Wifi,
  ChevronDown,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { Toast } from '../../kernel/Toast';
import { Kernel } from '../../kernel';

interface BookmarkItem {
  title: string;
  url: string;
  icon: string;
}

const BOOKMARKS: BookmarkItem[] = [
  { title: 'Alpine Wiki', url: 'https://wiki.alpinelinux.org', icon: '🏔️' },
  { title: 'Wikipedia Portal', url: 'https://en.wikipedia.org/wiki/Portal:Contents', icon: '📖' },
  { title: 'Hacker News Live', url: 'https://news.ycombinator.com', icon: '⚡' },
  { title: 'Python Docs', url: 'https://docs.python.org/3', icon: '🐍' },
  { title: 'Linux Man Pages', url: 'https://man.alpinelinux.org', icon: '📚' },
  { title: 'Local welcome', url: 'http://localhost/welcome.html', icon: '🖥️' },
];

interface VpnServer {
  id: string;
  name: string;
  flag: string;
  ip: string;
  latency: number;
  location: string;
  load: number;
}

const VPN_SERVERS: VpnServer[] = [
  { id: 'ch', name: 'Switzerland (Zurich) - Secure Core', flag: '🇨🇭', ip: '10.84.112.9', latency: 18, location: 'Zurich', load: 12 },
  { id: 'is', name: 'Iceland (Reykjavik) - Ultra Privacy', flag: '🇮🇸', ip: '10.84.140.22', latency: 24, location: 'Reykjavik', load: 8 },
  { id: 'us', name: 'United States (New York) - High Speed', flag: '🇺🇸', ip: '10.84.9.41', latency: 68, location: 'New York', load: 45 },
  { id: 'jp', name: 'Japan (Tokyo) - Asia Hub', flag: '🇯🇵', ip: '10.84.220.15', latency: 110, location: 'Tokyo', load: 31 },
  { id: 'de', name: 'Germany (Frankfurt) - Core Routing', flag: '🇩🇪', ip: '10.84.50.88', latency: 32, location: 'Frankfurt', load: 22 },
];

export const WebBrowserApp: React.FC = () => {
  const [url, setUrl] = useState('https://wiki.alpinelinux.org');
  const [inputUrl, setInputUrl] = useState('https://wiki.alpinelinux.org');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(['https://wiki.alpinelinux.org']);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'bookmarks' | 'history'>('bookmarks');

  // VPN States
  const [vpnActive, setVpnActive] = useState(false);
  const [selectedServer, setSelectedServer] = useState<VpnServer>(VPN_SERVERS[0]);
  const [showVpnMenu, setShowVpnMenu] = useState(false);
  const [vpnStats, setVpnStats] = useState({ dl: 0, ul: 0 });
  const [vpnLogs, setVpnLogs] = useState<string[]>([]);
  const [showVpnLogs, setShowVpnLogs] = useState(false);

  // Internet Fetching States
  const [hnStories, setHnStories] = useState<any[]>([]);
  const [wikiArticle, setWikiArticle] = useState<any>(null);
  const [wikiSearchResults, setWikiSearchResults] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Stats updater
  useEffect(() => {
    const timer = setInterval(() => {
      if (vpnActive) {
        setVpnStats({
          dl: parseFloat((Math.random() * 8.5 + 1.2).toFixed(2)),
          ul: parseFloat((Math.random() * 2.1 + 0.4).toFixed(2))
        });
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [vpnActive]);

  // Log builder when VPN state toggles
  useEffect(() => {
    if (vpnActive) {
      const serverIp = selectedServer.ip;
      const logs = [
        `[WG0] Initiating WireGuard tunnel link on interface wg0...`,
        `[WG0] Key exchange parameters established (Curve25519)`,
        `[WG0] Sending handshake initiation request to remote gateway [${serverIp}:51820]`,
        `[WG0] Received handshake response from proxy endpoint. Authorized successfully.`,
        `[WG0] Setting secure dynamic DNS resolvers: 1.1.1.1, 9.9.9.9`,
        `[WG0] Tunnel created. MTU: 1420. Routing all IPv4/IPv6 traffic through crypt-relay.`,
        `[WG0] Connection status active! Virtual IP address: ${serverIp.replace('.9', '.10').replace('.22', '.23')}`
      ];
      setVpnLogs(logs);
      Toast.show(`Helix Secure VPN connected to ${selectedServer.name}`, '🛡️');
    } else {
      setVpnLogs([`[WG0] WireGuard connection terminated by user.`, `[WG0] Re-established physical interface eth0 direct routing.`]);
    }
  }, [vpnActive, selectedServer]);

  // Handle URL changes & fetch actual internet content
  useEffect(() => {
    const triggerFetch = async () => {
      setFetchError(null);
      setIsLoading(true);

      try {
        if (url.includes('news.ycombinator.com')) {
          // Fetch real front page articles from Algolia HackerNews API
          const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page');
          if (!res.ok) throw new Error('Hacker News gateway timeout');
          const data = await res.json();
          setHnStories(data.hits || []);
        } else if (url.includes('wikipedia.org/wiki/')) {
          // Extract title/topic from URL
          const parts = url.split('/wiki/');
          const topic = parts[parts.length - 1];
          const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
          if (!res.ok) throw new Error('Wikipedia summary route unresolved');
          const data = await res.json();
          setWikiArticle(data);
        } else if (url.startsWith('https://search?q=')) {
          // Perform real search using Wikipedia API
          const query = decodeURIComponent(url.replace('https://search?q=', ''));
          const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`);
          if (!res.ok) throw new Error('Search network link failed');
          const data = await res.json();
          setWikiSearchResults(data.query?.search || []);
        }
      } catch (err: any) {
        console.error(err);
        setFetchError(err?.message || 'Network unreachable');
      } finally {
        // Subtle loading timeout for UX feeling
        setTimeout(() => setIsLoading(false), 250);
      }
    };

    triggerFetch();
  }, [url]);

  const navigateTo = (newUrl: string) => {
    setIsLoading(true);
    setInputUrl(newUrl);
    setUrl(newUrl);
    setHistory((prev) => [...prev.slice(0, historyIdx + 1), newUrl]);
    setHistoryIdx((prev) => prev + 1);
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
    const target = inputUrl.trim();
    if (!target) return;

    // Detect if search keyword or URL
    const isUrlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(target);
    if (!isUrlPattern || target.includes(' ')) {
      // Navigate to search
      navigateTo(`https://search?q=${encodeURIComponent(target)}`);
    } else {
      let absoluteUrl = target;
      if (!target.startsWith('http://') && !target.startsWith('https://')) {
        absoluteUrl = `https://${target}`;
      }
      navigateTo(absoluteUrl);
    }
  };

  const toggleVpn = () => {
    setVpnActive(!vpnActive);
  };

  const handleSelectServer = (srv: VpnServer) => {
    setSelectedServer(srv);
    setShowVpnMenu(false);
    if (vpnActive) {
      // Reconnect flow
      setVpnActive(false);
      setTimeout(() => setVpnActive(true), 600);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0f111a] text-[#edf1f7] text-xs select-none">
      {/* VPN Status Banner (Subtle and ultra modern) */}
      <div className={`px-4 py-1.5 border-b flex items-center justify-between text-[11px] font-mono transition duration-300 shrink-0 ${
        vpnActive ? 'bg-[#0f241d]/90 border-emerald-500/25 text-emerald-300' : 'bg-[#181216]/90 border-red-500/15 text-red-400'
      }`}>
        <div className="flex items-center gap-2">
          {vpnActive ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-red-400" />
          )}
          <span>SECURITY ROUTE:</span>
          <span className="font-bold">{vpnActive ? `TUNNELED VIA [${selectedServer.name}]` : 'DIRECT INTERNET INTERFACE (UNPROTECTED)'}</span>
        </div>

        <div className="flex items-center gap-3">
          {vpnActive && (
            <div className="hidden sm:flex items-center gap-2.5 text-[10px] text-emerald-400/80">
              <span>DL: {vpnStats.dl} Mb/s</span>
              <span>•</span>
              <span>UL: {vpnStats.ul} Mb/s</span>
              <span>•</span>
              <span>PING: {selectedServer.latency}ms</span>
            </div>
          )}
          <button
            onClick={() => setShowVpnLogs(!showVpnLogs)}
            className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[9px] border border-white/10 transition cursor-pointer"
          >
            {showVpnLogs ? 'Hide Tunnel Logs' : 'Show Tunnel Logs'}
          </button>
        </div>
      </div>

      {/* WireGuard Log Console Overlay */}
      {showVpnLogs && (
        <div className="bg-black/95 border-b border-white/10 p-3 font-mono text-[10px] text-cyan-400 max-h-40 overflow-y-auto shrink-0 flex flex-col gap-0.5 select-text">
          <div className="flex justify-between items-center text-gray-500 border-b border-white/5 pb-1 mb-1">
            <span>[INTERNAL ROUTING COMPS] WireGuard Kernel Core Logs (wg0)</span>
            <button onClick={() => setShowVpnLogs(false)} className="hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
          </div>
          {vpnLogs.map((log, idx) => (
            <div key={idx} className={log.includes('successfully') || log.includes('active') ? 'text-emerald-400' : 'text-gray-400'}>{log}</div>
          ))}
        </div>
      )}

      {/* Browser Bar */}
      <div className="px-3 py-2 bg-[#161822] border-b border-white/10 flex items-center gap-2 shrink-0">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className={`p-1.5 rounded-lg border transition cursor-pointer shrink-0 ${
            showSidebar ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
          }`}
          title={showSidebar ? 'Collapse Side Panel' : 'Open Bookmarks & History'}
        >
          {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-1 text-gray-400 shrink-0">
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
              setTimeout(() => setIsLoading(false), 300);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer text-gray-400 hover:text-white transition"
            title="Reload"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

        {/* Address Input */}
        <form onSubmit={handleNavigate} className="flex-1 flex items-center bg-black/45 border border-white/10 rounded-xl px-3 py-1 gap-2 focus-within:border-emerald-500/40 transition">
          {vpnActive ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full bg-transparent font-mono text-xs text-white focus:outline-none placeholder-gray-500"
            placeholder="Enter web URL or search query..."
          />
        </form>

        {/* Dynamic VPN Button */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowVpnMenu(!showVpnMenu)}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 font-bold font-mono text-[10px] transition cursor-pointer ${
              vpnActive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>VPN: {vpnActive ? 'ON' : 'OFF'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* VPN Servers Selection Menu */}
          {showVpnMenu && (
            <div className="absolute right-0 mt-1.5 w-64 bg-[#141724] border border-white/15 rounded-xl shadow-2xl p-2 z-[999] text-xs font-sans">
              <div className="px-2 py-1.5 text-gray-400 font-semibold border-b border-white/5 mb-1 flex justify-between items-center">
                <span>Select VPN Server Node</span>
                <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">WG Tunnel</span>
              </div>
              <div className="space-y-0.5">
                {VPN_SERVERS.map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => handleSelectServer(srv)}
                    className={`w-full p-2 rounded-lg flex items-center justify-between hover:bg-white/5 transition cursor-pointer text-left ${
                      selectedServer.id === srv.id ? 'bg-white/10 text-emerald-300' : 'text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{srv.flag}</span>
                      <div>
                        <div className="font-bold text-[11px]">{srv.location}</div>
                        <div className="text-[9px] text-gray-500 font-mono">IP: {srv.ip}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-mono text-emerald-400 font-bold">{srv.latency} ms</div>
                      <div className="text-[8px] text-gray-500">Load: {srv.load}%</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="my-1.5 border-t border-white/5" />
              <button
                onClick={toggleVpn}
                className={`w-full py-1.5 rounded-lg text-center font-bold text-[11px] transition cursor-pointer ${
                  vpnActive 
                    ? 'bg-red-500/25 text-red-300 hover:bg-red-500/35 border border-red-500/40' 
                    : 'bg-emerald-500 text-black hover:bg-emerald-400'
                }`}
              >
                {vpnActive ? 'Disconnect VPN Server' : 'Connect VPN Server'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bookmarks Quick Toolbar */}
      <div className="px-3 py-1 bg-[#12141c] border-b border-white/5 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[10px] text-gray-500 font-mono">Favorites:</span>
        {BOOKMARKS.map((b) => (
          <button
            key={b.title}
            onClick={() => navigateTo(b.url)}
            className={`px-2 py-0.5 rounded-lg text-[11px] flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              url === b.url ? 'bg-white/10 text-[#6ee7b7] font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5'
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
            <div className="p-2 border-b border-white/10 flex items-center gap-1 shrink-0">
              <button
                onClick={() => setActiveSidebarTab('bookmarks')}
                className={`flex-1 py-1 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeSidebarTab === 'bookmarks' ? 'bg-[#6ee7b7]/10 text-[#6ee7b7] border border-[#6ee7b7]/25' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Bookmark className="w-3 h-3" />
                <span>Bookmarks</span>
              </button>
              <button
                onClick={() => setActiveSidebarTab('history')}
                className={`flex-1 py-1 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeSidebarTab === 'history' ? 'bg-[#6ee7b7]/10 text-[#6ee7b7] border border-[#6ee7b7]/25' : 'text-gray-400 hover:text-white'
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
                    <span className="text-base shrink-0">{b.icon}</span>
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
        <div className="flex-1 bg-[#08090f] flex flex-col p-4 sm:p-6 overflow-y-auto select-text">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 font-mono text-gray-400">
              <RefreshCw className="w-7 h-7 animate-spin text-[#6ee7b7]" />
              <span className="text-sm">Connecting & Resolving {url}...</span>
              <span className="text-[10px] text-gray-500">{vpnActive ? `Tunnel: wireguard://[${selectedServer.ip}]` : 'Route: direct://WAN'}</span>
            </div>
          ) : fetchError ? (
            <div className="max-w-md mx-auto w-full my-auto bg-[#1a1216] border border-red-500/20 rounded-2xl p-6 text-center space-y-4">
              <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
              <div>
                <h3 className="font-bold text-white text-base">Internet Routing Failure</h3>
                <p className="text-xs text-gray-400 mt-1 font-mono">{fetchError}</p>
              </div>
              <p className="text-[11px] text-gray-500">
                The gateway experienced an active block or CORS preflight rejection. Switch on your Helix Secure VPN Core to resolve direct routing restrictions.
              </p>
              <button
                onClick={() => { setVpnActive(true); navigateTo(url); }}
                className="px-3.5 py-1.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 text-xs font-bold transition cursor-pointer"
              >
                Switch on Secure VPN Tunnel
              </button>
            </div>
          ) : url.includes('news.ycombinator.com') ? (
            /* Live Hacker News Viewport */
            <div className="max-w-3xl mx-auto w-full space-y-4">
              <div className="bg-[#141724] border border-white/10 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-orange-500/30 pb-3 mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded bg-[#ff6600] flex items-center justify-center font-bold text-white text-base font-mono">Y</span>
                    <div>
                      <h1 className="font-bold text-white text-sm">Hacker News</h1>
                      <p className="text-gray-400 text-[10px]">Direct Real-Time Live Feed via Algolia HN API</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">LIVE WAN CONNECT</span>
                </div>

                <div className="space-y-2">
                  {hnStories.map((story: any, idx: number) => {
                    if (!story.title) return null;
                    return (
                      <div key={story.objectID || idx} className="p-2.5 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition flex items-start gap-3">
                        <span className="font-mono text-gray-500 text-[10px] w-5 text-right mt-0.5">{idx + 1}.</span>
                        <div className="flex-1 overflow-hidden space-y-1">
                          <a
                            href={story.url || `https://news.ycombinator.com/item?id=${story.objectID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-gray-200 hover:text-[#ff6600] text-xs leading-snug hover:underline flex items-center gap-1.5"
                          >
                            <span>{story.title}</span>
                            <ExternalLink className="w-3 h-3 text-gray-500 inline shrink-0" />
                          </a>
                          <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-mono">
                            <span>Points: <strong className="text-amber-400">{story.points || 1}</strong></span>
                            <span>•</span>
                            <span>By: {story.author}</span>
                            <span>•</span>
                            <button
                              onClick={() => navigateTo(`https://search?q=${encodeURIComponent(story.title)}`)}
                              className="text-cyan-400 hover:underline cursor-pointer"
                            >
                              Search Wiki
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : url.includes('wikipedia.org/wiki/') && wikiArticle ? (
            /* Wikipedia Reader Viewport */
            <div className="max-w-3xl mx-auto w-full space-y-4">
              <div className="bg-[#141724] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">📖</span>
                    <div>
                      <h1 className="text-lg font-bold text-white leading-tight">{wikiArticle.title}</h1>
                      <p className="text-gray-400 text-xs mt-0.5">{wikiArticle.description || 'Live Wikipedia Resource'}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono text-[10px] border border-blue-500/20">WIKIPEDIA API</span>
                </div>

                <div className="flex flex-col md:flex-row gap-5">
                  {wikiArticle.thumbnail && (
                    <div className="w-full md:w-56 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/30 p-1 flex items-center justify-center max-h-56">
                      <img
                        src={wikiArticle.thumbnail.source}
                        alt={wikiArticle.title}
                        referrerPolicy="no-referrer"
                        className="object-contain rounded-lg max-h-52 w-full"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-3 text-gray-300 leading-relaxed text-xs">
                    <div className="text-gray-100 whitespace-pre-wrap">{wikiArticle.extract}</div>
                    <div className="pt-3 border-t border-white/5 flex gap-3">
                      <a
                        href={wikiArticle.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${wikiArticle.title}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] flex items-center gap-1 transition border border-white/10 cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open on wikipedia.org</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : url.startsWith('https://search?q=') ? (
            /* Search Results Portlet */
            <div className="max-w-2xl mx-auto w-full space-y-4">
              <div className="space-y-1 mb-2">
                <p className="text-[10px] text-gray-400 font-mono">
                  Helix DNS Search results for: <span className="text-emerald-300">"{decodeURIComponent(url.replace('https://search?q=', ''))}"</span>
                </p>
                <p className="text-[9px] text-gray-500">About {wikiSearchResults.length} real indexed pages found from the WAN</p>
              </div>

              <div className="space-y-3.5">
                {wikiSearchResults.length > 0 ? (
                  wikiSearchResults.map((res: any) => (
                    <div
                      key={res.pageid}
                      onClick={() => navigateTo(`https://en.wikipedia.org/wiki/${encodeURIComponent(res.title)}`)}
                      className="p-4 rounded-xl bg-[#141724] hover:bg-white/5 border border-white/5 hover:border-white/15 transition duration-150 cursor-pointer text-left space-y-1"
                    >
                      <h3 className="font-bold text-cyan-300 hover:text-cyan-200 text-sm hover:underline flex items-center gap-1.5">
                        <span>{res.title}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 font-mono">Wikipedia</span>
                      </h3>
                      <p 
                        className="text-gray-400 text-xs leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: res.snippet + '...' }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-[#141724] border border-white/10 rounded-2xl space-y-2">
                    <Search className="w-8 h-8 text-gray-500 mx-auto" />
                    <p className="text-gray-400">No results found on Wikipedia portal.</p>
                    <p className="text-[10px] text-gray-500">Try searching standard concepts like "Kernel", "Linux", "Space", or "Switzerland".</p>
                  </div>
                )}
              </div>
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
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 hover:border-emerald-400/40 transition cursor-pointer" onClick={() => navigateTo('https://en.wikipedia.org/wiki/Alpine_Linux')}>
                    <h3 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                      <span>📦</span> APK Package Management
                    </h3>
                    <p className="text-gray-400 text-[11px]">Install, update, and manage lightweight musl binaries with <code>apk add</code> and <code>apk update</code>.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 hover:border-emerald-400/40 transition cursor-pointer" onClick={() => navigateTo('https://en.wikipedia.org/wiki/OpenRC')}>
                    <h3 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                      <span>⚙️</span> OpenRC Init Daemons
                    </h3>
                    <p className="text-gray-400 text-[11px]">Manage system services, runlevels (boot, default), and background daemons via <code>rc-service</code>.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 hover:border-emerald-400/40 transition cursor-pointer" onClick={() => navigateTo('https://en.wikipedia.org/wiki/Netfilter')}>
                    <h3 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                      <span>🛡️</span> Security & Iptables
                    </h3>
                    <p className="text-gray-400 text-[11px]">Kernel-level packet filtering with iptables, nftables, and grsecurity hardening.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 hover:border-emerald-400/40 transition cursor-pointer" onClick={() => navigateTo('https://en.wikipedia.org/wiki/X_Window_System')}>
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
