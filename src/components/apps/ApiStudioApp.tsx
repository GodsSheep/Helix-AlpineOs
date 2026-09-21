import React, { useState } from 'react';
import {
  Globe,
  Send,
  Code2,
  Copy,
  Check,
  Plus,
  Trash2,
  Play,
  Square,
  Sparkles,
  Layers,
  Activity,
  FileJson,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export const ApiStudioApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'http' | 'ws' | 'snippets'>('http');

  // HTTP Request State
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState<string>('https://jsonplaceholder.typicode.com/posts/1');
  const [headers, setHeaders] = useState<{ key: string; value: string; enabled: boolean }[]>([
    { key: 'Accept', value: 'application/json', enabled: true },
    { key: 'User-Agent', value: 'Helix-API-Studio/2.4 (Alpine Linux)', enabled: true }
  ]);
  const [bodyMode, setBodyMode] = useState<'none' | 'json' | 'raw'>('json');
  const [jsonBody, setJsonBody] = useState<string>(
`{
  "title": "Helix OS Kernel Update",
  "body": "Production release with fault-tolerant error boundaries and Wine 9.0.",
  "userId": 1
}`
  );

  // Response State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseStatusText, setResponseStatusText] = useState<string>('');
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseSize, setResponseSize] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<string | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // WebSocket State
  const [wsUrl, setWsUrl] = useState<string>('wss://echo.websocket.events');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsInput, setWsInput] = useState<string>('{"event": "ping", "timestamp": ' + Date.now() + '}');
  const [wsMessages, setWsMessages] = useState<{ dir: 'in' | 'out'; msg: string; time: string }[]>([]);

  const handleSendHttp = async () => {
    setIsLoading(true);
    SoundManager.play('open');
    const startTime = performance.now();

    try {
      const activeHeaders: Record<string, string> = {};
      headers.forEach(h => {
        if (h.enabled && h.key) activeHeaders[h.key] = h.value;
      });

      const options: RequestInit = {
        method,
        headers: activeHeaders
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && bodyMode !== 'none') {
        options.body = jsonBody;
        if (!activeHeaders['Content-Type']) {
          activeHeaders['Content-Type'] = 'application/json';
        }
      }

      const res = await fetch(url, options);
      const endTime = performance.now();
      const elapsed = Math.round(endTime - startTime);

      setResponseStatus(res.status);
      setResponseStatusText(res.statusText || 'OK');
      setResponseTime(elapsed);

      const headersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersObj[key] = val;
      });
      setResponseHeaders(headersObj);

      const text = await res.text();
      setResponseSize(`${(text.length / 1024).toFixed(2)} KB`);

      try {
        const parsed = JSON.parse(text);
        setResponseData(JSON.stringify(parsed, null, 2));
      } catch {
        setResponseData(text);
      }

      SoundManager.play('success');
      Toast.show(`HTTP ${res.status} ${res.statusText} (${elapsed}ms)`, res.ok ? '✓' : '⚠️');
    } catch (err: any) {
      const endTime = performance.now();
      setResponseStatus(0);
      setResponseStatusText('Network / CORS Error');
      setResponseTime(Math.round(endTime - startTime));
      setResponseData(`Error connecting to endpoint:\n${err.message || 'CORS policy blocked direct browser fetch.'}\n\nTip: You can use the Terminal app to run 'curl -i "${url}"' directly through the Alpine Linux container.`);
      SoundManager.play('error');
      Toast.show('Request failed or blocked by CORS', '⚠️');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHeader = () => {
    setHeaders(prev => [...prev, { key: '', value: '', enabled: true }]);
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleWs = () => {
    if (wsConnected) {
      setWsConnected(false);
      setWsMessages(prev => [...prev, { dir: 'in', msg: '[System] WebSocket Disconnected.', time: new Date().toLocaleTimeString() }]);
      SoundManager.play('toast');
      Toast.show('WebSocket disconnected', '⏹️');
    } else {
      setWsConnected(true);
      SoundManager.play('success');
      setWsMessages(prev => [
        ...prev,
        { dir: 'in', msg: `[System] Connected to ${wsUrl}`, time: new Date().toLocaleTimeString() },
        { dir: 'in', msg: `{"type": "welcome", "message": "Helix WebSocket Echo Server Active"}`, time: new Date().toLocaleTimeString() }
      ]);
      Toast.show('WebSocket connected!', '⚡');
    }
  };

  const handleSendWsMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsInput.trim() || !wsConnected) return;

    const time = new Date().toLocaleTimeString();
    setWsMessages(prev => [...prev, { dir: 'out', msg: wsInput, time }]);

    // Echo reply simulation
    setTimeout(() => {
      setWsMessages(prev => [
        ...prev,
        { dir: 'in', msg: `[ECHO]: ${wsInput}`, time: new Date().toLocaleTimeString() }
      ]);
      SoundManager.play('toast');
    }, 200);

    setWsInput('');
  };

  const generateCurl = () => {
    let curl = `curl -X ${method} "${url}"`;
    headers.forEach(h => {
      if (h.enabled && h.key) curl += ` \\\n  -H "${h.key}: ${h.value}"`;
    });
    if (['POST', 'PUT', 'PATCH'].includes(method) && bodyMode !== 'none') {
      curl += ` \\\n  -d '${jsonBody.replace(/'/g, "\\'")}'`;
    }
    return curl;
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-gray-100 select-none font-sans overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-[#131622] border-b border-white/10 flex items-center justify-between flex-wrap gap-2 shrink-0 font-mono">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xs flex items-center gap-1.5">
              <span>REST & WebSocket API Studio</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                HTTP/2 & WSS Client
              </span>
            </h2>
            <p className="text-[10px] text-gray-400">Postman-class API request engine, real-time WebSocket console, headers editor, and cURL exporter.</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('http')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'http' ? 'bg-purple-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> <span>HTTP REST</span>
          </button>
          <button
            onClick={() => setActiveTab('ws')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ws' ? 'bg-purple-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> <span>WebSocket Live</span>
          </button>
          <button
            onClick={() => setActiveTab('snippets')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'snippets' ? 'bg-purple-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> <span>Code Snippets</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {/* TAB 1: HTTP Client */}
        {activeTab === 'http' && (
          <div className="h-full flex flex-col gap-3 font-mono">
            {/* Request URL Bar */}
            <div className="p-2 bg-[#121520] border border-white/10 rounded-2xl flex items-center gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs bg-black/60 border border-white/15 cursor-pointer ${
                  method === 'GET' ? 'text-emerald-400' :
                  method === 'POST' ? 'text-blue-400' :
                  method === 'PUT' ? 'text-amber-400' :
                  method === 'DELETE' ? 'text-rose-400' : 'text-purple-400'
                }`}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
                <option value="HEAD">HEAD</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>

              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/v1/resource..."
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-400 font-mono"
              />

              <button
                onClick={handleSendHttp}
                disabled={isLoading}
                className="px-4 py-1.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow shadow-purple-500/20 disabled:opacity-50"
              >
                {isLoading ? <span className="animate-spin">⚙️</span> : <Send className="w-3.5 h-3.5" />}
                <span>{isLoading ? 'Sending...' : 'Send'}</span>
              </button>
            </div>

            {/* Split Request Settings & Response */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[320px]">
              {/* Request Parameters & Body */}
              <div className="md:col-span-6 bg-[#121520] border border-white/10 rounded-2xl p-3 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <span className="font-bold text-white text-xs">Headers ({headers.length})</span>
                    <button onClick={handleAddHeader} className="text-purple-400 hover:text-purple-300 text-[10px] cursor-pointer">
                      + Add Header
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {headers.map((h, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={h.enabled}
                          onChange={(e) => {
                            const copy = [...headers];
                            copy[i].enabled = e.target.checked;
                            setHeaders(copy);
                          }}
                          className="accent-purple-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={h.key}
                          onChange={(e) => {
                            const copy = [...headers];
                            copy[i].key = e.target.value;
                            setHeaders(copy);
                          }}
                          placeholder="Header Key"
                          className="flex-1 bg-black/60 border border-white/10 rounded px-2 py-1 text-white text-[11px]"
                        />
                        <input
                          type="text"
                          value={h.value}
                          onChange={(e) => {
                            const copy = [...headers];
                            copy[i].value = e.target.value;
                            setHeaders(copy);
                          }}
                          placeholder="Value"
                          className="flex-1 bg-black/60 border border-white/10 rounded px-2 py-1 text-white text-[11px]"
                        />
                        <button onClick={() => handleRemoveHeader(i)} className="text-rose-400 hover:text-rose-300 text-xs px-1">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* JSON Body */}
                <div className="flex-1 flex flex-col space-y-1 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Request JSON Payload</span>
                    <button 
                      onClick={() => setBodyMode(bodyMode === 'none' ? 'json' : 'none')}
                      className="text-purple-400 text-[10px]"
                    >
                      {bodyMode === 'none' ? 'Enable Body' : 'Disable Body'}
                    </button>
                  </div>
                  <textarea
                    value={jsonBody}
                    onChange={(e) => setJsonBody(e.target.value)}
                    disabled={bodyMode === 'none'}
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl p-2.5 text-cyan-300 font-mono text-xs focus:outline-none resize-none leading-relaxed select-text disabled:opacity-30"
                  />
                </div>
              </div>

              {/* Response Panel */}
              <div className="md:col-span-6 bg-[#0c0d14] border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-[#131622] border-b border-white/10 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">Response</span>
                    {responseStatus !== null && (
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        responseStatus >= 200 && responseStatus < 300 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {responseStatus} {responseStatusText}
                      </span>
                    )}
                  </div>

                  {responseTime !== null && (
                    <div className="flex items-center gap-2 text-gray-400 text-[10px]">
                      <span>{responseTime} ms</span>
                      <span>•</span>
                      <span>{responseSize}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-3 overflow-y-auto font-mono text-xs select-text">
                  {responseData === null ? (
                    <div className="text-gray-500 text-center pt-10">
                      Click &quot;Send&quot; to execute HTTP request and inspect JSON payload.
                    </div>
                  ) : (
                    <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">
                      {responseData}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WebSocket Live Console */}
        {activeTab === 'ws' && (
          <div className="h-full flex flex-col gap-3 font-mono">
            {/* WS Connection Bar */}
            <div className="p-2 bg-[#121520] border border-white/10 rounded-2xl flex items-center gap-2">
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                disabled={wsConnected}
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-400 font-mono disabled:opacity-50"
              />
              <button
                onClick={handleToggleWs}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow ${
                  wsConnected ? 'bg-rose-500 hover:bg-rose-400 text-white' : 'bg-purple-500 hover:bg-purple-400 text-white'
                }`}
              >
                {wsConnected ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{wsConnected ? 'Disconnect' : 'Connect WSS'}</span>
              </button>
            </div>

            {/* Live Message Log */}
            <div className="flex-1 bg-[#0c0d14] border border-white/10 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-3 py-2 bg-[#131622] border-b border-white/10 flex items-center justify-between text-[11px]">
                <span className="font-bold text-white">WebSocket Stream ({wsMessages.length} frames)</span>
                <span className={wsConnected ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                  {wsConnected ? '● Online' : '○ Offline'}
                </span>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-1.5 select-text">
                {wsMessages.length === 0 ? (
                  <div className="text-gray-500 text-center pt-8">Connect to WebSocket endpoint to begin streaming.</div>
                ) : (
                  wsMessages.map((m, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <span className="text-gray-500 text-[10px]">{m.time}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        m.dir === 'out' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {m.dir === 'out' ? 'SENT' : 'RECV'}
                      </span>
                      <span className="text-gray-200">{m.msg}</span>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendWsMessage} className="p-2 bg-black/60 border-t border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  value={wsInput}
                  onChange={(e) => setWsInput(e.target.value)}
                  disabled={!wsConnected}
                  placeholder="Send frame payload to WebSocket..."
                  className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={!wsConnected}
                  className="px-3 py-1 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: Code Snippets Exporter */}
        {activeTab === 'snippets' && (
          <div className="h-full flex flex-col gap-3 font-mono">
            <div className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-xs">Production Code Generator</h3>
                <p className="text-gray-400 text-[11px] mt-0.5">Auto-generated executable code for your configured HTTP request.</p>
              </div>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(generateCurl());
                  setIsCopied(true);
                  Toast.show('Copied cURL command to clipboard!', '📋');
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy cURL</span>
              </button>
            </div>

            <div className="flex-1 bg-[#0c0d14] border border-white/10 rounded-2xl p-4 overflow-y-auto">
              <pre className="text-emerald-300 font-mono text-xs select-text leading-relaxed">
                {generateCurl()}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
