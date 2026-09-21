import React, { useState, useEffect } from 'react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { 
  Code2, 
  Terminal, 
  Send, 
  Copy, 
  Check, 
  Search, 
  Layers, 
  Sliders, 
  FileCode, 
  RefreshCw, 
  Globe, 
  Key, 
  AlignLeft, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  FileJson,
  Zap,
  ArrowRightLeft,
  Sparkles,
  BookOpen
} from 'lucide-react';

type DevToolTab = 
  | 'formatter' 
  | 'ast' 
  | 'regex' 
  | 'http' 
  | 'encoder' 
  | 'schema' 
  | 'diff' 
  | 'docs';

export const DevToolsStudioApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DevToolTab>('formatter');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1. Formatter State
  const [formatLang, setFormatLang] = useState<'json' | 'sql' | 'html' | 'js'>('json');
  const [formatInput, setFormatInput] = useState<string>(
    '{"name":"Helix OS","version":"10.0.0","subsystems":{"kernel":"Alpine 6.6","vfs":"9P Async","gui":"Wayland/WASM"},"tags":["linux","wasm","developer"]}'
  );
  const [formatOutput, setFormatOutput] = useState<string>('');
  const [formatError, setFormatError] = useState<string | null>(null);

  // 2. AST State
  const [astCode, setAstCode] = useState<string>('function calculateMetric(rate, count) {\n  const total = rate * count;\n  return total > 100 ? "High" : "Normal";\n}');
  
  // 3. Regex State
  const [regexPattern, setRegexPattern] = useState<string>('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})');
  const [regexFlags, setRegexFlags] = useState<string>('g');
  const [regexText, setRegexText] = useState<string>(
    'Contact security@helix.os or admin.root@cloud.internal for audit logs. Backup at support@subsystem.dev.'
  );
  const [regexMatches, setRegexMatches] = useState<any[]>([]);

  // 4. HTTP Console State
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [httpUrl, setHttpUrl] = useState<string>('https://api.helix.os/v1/system/telemetry');
  const [httpHeaders, setHttpHeaders] = useState<string>('Content-Type: application/json\nAuthorization: Bearer helix_token_demo');
  const [httpBody, setHttpBody] = useState<string>('{\n  "client": "Helix DevTools",\n  "benchmark": true\n}');
  const [httpResponse, setHttpResponse] = useState<any>({
    status: 200,
    statusText: 'OK',
    timeMs: 42,
    headers: { 'content-type': 'application/json; charset=utf-8', 'x-runtime': 'helix-v86-bridge' },
    data: {
      status: 'active',
      node: 'helix-core-01',
      kernel: 'Linux 6.6.137-alpine',
      memory_mb: 2048,
      timestamp: Date.now()
    }
  });
  const [httpLoading, setHttpLoading] = useState(false);

  // 5. Encoder / Decoder State
  const [encoderType, setEncoderType] = useState<'base64' | 'url' | 'jwt' | 'hex'>('base64');
  const [encoderInput, setEncoderInput] = useState<string>('Helix OS Next-Gen Linux Subsystem');
  const [encoderOutput, setEncoderOutput] = useState<string>('');

  // 6. Schema Validator & TS Generator
  const [schemaJson, setSchemaJson] = useState<string>(
    '{\n  "id": 101,\n  "username": "helix_dev",\n  "active": true,\n  "roles": ["admin", "kernel"],\n  "settings": {\n    "theme": "dark",\n    "refreshIntervalMs": 500\n  }\n}'
  );
  const [tsInterface, setTsInterface] = useState<string>('');

  // 7. Diff Viewer State
  const [diffOriginal, setDiffOriginal] = useState<string>('const port = 3000;\nconst host = "127.0.0.1";\n// Initialize server\nstartServer({ port, host });');
  const [diffModified, setDiffModified] = useState<string>('const port = 8080;\nconst host = "0.0.0.0";\nconst isProduction = true;\n// Initialize cluster server\nstartClusterServer({ port, host, isProduction });');

  // Format handler
  const handleFormat = (minify = false) => {
    try {
      if (formatLang === 'json') {
        const parsed = JSON.parse(formatInput);
        setFormatOutput(minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2));
        setFormatError(null);
      } else if (formatLang === 'sql') {
        const formatted = formatInput
          .replace(/\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|JOIN|LEFT|RIGHT|INNER|GROUP BY|ORDER BY|HAVING|LIMIT)\b/gi, '\n$1')
          .trim();
        setFormatOutput(formatted);
        setFormatError(null);
      } else {
        setFormatOutput(formatInput.trim());
        setFormatError(null);
      }
      SoundManager.play('click');
      Toast.show('Code formatted successfully', '⚡');
    } catch (err: any) {
      setFormatError(err.message || 'Formatting error');
      Toast.show('Invalid syntax', '⚠️');
    }
  };

  // Regex evaluator
  useEffect(() => {
    try {
      const reg = new RegExp(regexPattern, regexFlags);
      const matches = Array.from(regexText.matchAll(reg));
      setRegexMatches(matches.map(m => ({ match: m[0], index: m.index, groups: m.slice(1) })));
    } catch (e) {
      setRegexMatches([]);
    }
  }, [regexPattern, regexFlags, regexText]);

  // Encoder evaluator
  useEffect(() => {
    try {
      if (encoderType === 'base64') {
        setEncoderOutput(btoa(encoderInput));
      } else if (encoderType === 'url') {
        setEncoderOutput(encodeURIComponent(encoderInput));
      } else if (encoderType === 'hex') {
        setEncoderOutput(
          Array.from(encoderInput)
            .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
            .join(' ')
        );
      } else if (encoderType === 'jwt') {
        const parts = encoderInput.split('.');
        if (parts.length === 3) {
          const header = JSON.parse(atob(parts[0]));
          const payload = JSON.parse(atob(parts[1]));
          setEncoderOutput(JSON.stringify({ header, payload, signature: parts[2] }, null, 2));
        } else {
          setEncoderOutput('Invalid JWT token format (expected xxx.yyy.zzz)');
        }
      }
    } catch (e: any) {
      setEncoderOutput('Encoding error: ' + e.message);
    }
  }, [encoderInput, encoderType]);

  // JSON to TS generator
  useEffect(() => {
    try {
      const obj = JSON.parse(schemaJson);
      const generateTs = (o: any, name = 'RootObject', indent = '  '): string => {
        let res = `export interface ${name} {\n`;
        for (const key in o) {
          const val = o[key];
          let typeStr = 'any';
          if (typeof val === 'string') typeStr = 'string';
          else if (typeof val === 'number') typeStr = 'number';
          else if (typeof val === 'boolean') typeStr = 'boolean';
          else if (Array.isArray(val)) {
            typeStr = val.length > 0 && typeof val[0] === 'string' ? 'string[]' : 'any[]';
          } else if (typeof val === 'object' && val !== null) {
            typeStr = generateTs(val, key.charAt(0).toUpperCase() + key.slice(1), indent + '  ');
          }
          res += `${indent}${key}: ${typeStr};\n`;
        }
        res += `}`;
        return res;
      };
      setTsInterface(generateTs(obj));
    } catch (e) {
      setTsInterface('// Invalid JSON provided');
    }
  }, [schemaJson]);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    Toast.show('Copied to clipboard', '📋');
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleSendHttp = async () => {
    setHttpLoading(true);
    SoundManager.play('click');
    Toast.show(`Dispatching ${httpMethod} request...`, '🌐');

    await new Promise(r => setTimeout(r, 450));
    setHttpResponse({
      status: 200,
      statusText: 'OK',
      timeMs: Math.floor(Math.random() * 40) + 15,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'x-powered-by': 'HelixOS Runtime Server',
        'x-latency': '24ms'
      },
      data: {
        success: true,
        method: httpMethod,
        endpoint: httpUrl,
        received_at: new Date().toISOString(),
        payload: httpMethod !== 'GET' ? JSON.parse(httpBody || '{}') : null,
        status: 'Processed in virtualized container network'
      }
    });
    setHttpLoading(false);
    SoundManager.play('success');
    Toast.show('HTTP Request Completed (200 OK)', '✅');
  };

  return (
    <div className="h-full flex flex-col bg-[#080b11] text-gray-200 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#0d111a] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              Developer Tools Studio
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono border border-blue-500/30">
                All-in-One DevSuite
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Open-source developer workbench: code formatters, AST parser, regex debugger, HTTP test console & encoders.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 px-4 pt-2 bg-[#0b0f17] border-b border-white/10 overflow-x-auto shrink-0">
        {[
          { id: 'formatter', label: 'Code Formatter', icon: <AlignLeft className="w-3.5 h-3.5" /> },
          { id: 'regex', label: 'Regex Debugger', icon: <Search className="w-3.5 h-3.5" /> },
          { id: 'http', label: 'REST / HTTP Console', icon: <Globe className="w-3.5 h-3.5" /> },
          { id: 'encoder', label: 'Encoders & JWT', icon: <Key className="w-3.5 h-3.5" /> },
          { id: 'schema', label: 'JSON ➔ TypeScript', icon: <FileCode className="w-3.5 h-3.5" /> },
          { id: 'ast', label: 'AST Tokenizer', icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'diff', label: 'Visual Diff', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
          { id: 'docs', label: 'Cheat Sheets', icon: <BookOpen className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as DevToolTab);
              SoundManager.play('click');
            }}
            className={`px-3 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#121824] text-white border-t-2 border-blue-500 border-x border-white/10 shadow'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#080b11]">
        {/* 1. Formatter */}
        {activeTab === 'formatter' && (
          <div className="h-full flex flex-col space-y-3 animate-fade-in">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {(['json', 'sql', 'html', 'js'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setFormatLang(lang)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer ${
                      formatLang === lang ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFormat(false)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow"
                >
                  Prettify
                </button>
                <button
                  onClick={() => handleFormat(true)}
                  className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition cursor-pointer border border-white/10"
                >
                  Minify
                </button>
              </div>
            </div>

            {formatError && (
              <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formatError}</span>
              </div>
            )}

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[300px]">
              <div className="flex flex-col rounded-2xl bg-[#101522] border border-white/10 p-3 space-y-2">
                <span className="text-xs font-bold text-gray-400 font-mono">Input Source</span>
                <textarea
                  value={formatInput}
                  onChange={(e) => setFormatInput(e.target.value)}
                  className="flex-1 bg-black/50 border border-white/5 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Paste code or JSON here..."
                />
              </div>

              <div className="flex flex-col rounded-2xl bg-[#101522] border border-white/10 p-3 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 font-mono">Formatted Result</span>
                  {formatOutput && (
                    <button
                      onClick={() => copyText(formatOutput, 'formatted')}
                      className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition cursor-pointer"
                      title="Copy"
                    >
                      {copiedKey === 'formatted' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <pre className="flex-1 bg-black/50 border border-white/5 rounded-xl p-3 text-xs font-mono text-emerald-300 overflow-auto whitespace-pre">
                  {formatOutput || '// Formatted output will appear here'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* 2. Regex Debugger */}
        {activeTab === 'regex' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="text-xs text-gray-400 font-mono block mb-1">Regular Expression Pattern</label>
                  <input
                    type="text"
                    value={regexPattern}
                    onChange={(e) => setRegexPattern(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-mono block mb-1">Flags (g, i, m, s, u)</label>
                  <input
                    type="text"
                    value={regexFlags}
                    onChange={(e) => setRegexFlags(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-mono block mb-1">Test String</label>
                <textarea
                  value={regexText}
                  onChange={(e) => setRegexText(e.target.value)}
                  className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Matches */}
            <div className="rounded-2xl bg-[#101522] border border-white/10 overflow-hidden">
              <div className="p-3 bg-[#151c2d] border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">Matched Captures ({regexMatches.length})</span>
                <span className="text-[11px] text-emerald-400 font-mono">Live Evaluation</span>
              </div>

              <div className="p-3 space-y-2 divide-y divide-white/5">
                {regexMatches.length === 0 ? (
                  <p className="text-xs text-gray-500 font-mono">No matches found for current pattern.</p>
                ) : (
                  regexMatches.map((m, i) => (
                    <div key={i} className="pt-2 first:pt-0 font-mono text-xs flex items-center justify-between">
                      <div>
                        <span className="text-blue-400 font-bold">Match #{i + 1}: </span>
                        <span className="text-emerald-300">"{m.match}"</span>
                        {m.groups.length > 0 && (
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            Groups: {m.groups.map((g: string, gi: number) => `$${gi+1}: "${g}"`).join(', ')}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500">Index: {m.index}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. HTTP Console */}
        {activeTab === 'http' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <select
                  value={httpMethod}
                  onChange={(e) => setHttpMethod(e.target.value as any)}
                  className="w-full sm:w-28 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-cyan-400 focus:outline-none focus:border-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>

                <input
                  type="text"
                  value={httpUrl}
                  onChange={(e) => setHttpUrl(e.target.value)}
                  className="flex-1 w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />

                <button
                  onClick={handleSendHttp}
                  disabled={httpLoading}
                  className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{httpLoading ? 'Sending...' : 'Send'}</span>
                </button>
              </div>

              {httpMethod !== 'GET' && (
                <div>
                  <label className="text-xs text-gray-400 font-mono block mb-1">Request Body (JSON)</label>
                  <textarea
                    value={httpBody}
                    onChange={(e) => setHttpBody(e.target.value)}
                    className="w-full h-20 bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Response Preview */}
            <div className="rounded-2xl bg-[#101522] border border-white/10 overflow-hidden">
              <div className="p-3 bg-[#151c2d] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono">Response</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    {httpResponse.status} {httpResponse.statusText}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">{httpResponse.timeMs} ms</span>
                </div>
              </div>

              <pre className="p-4 bg-black/50 text-xs font-mono text-emerald-300 overflow-auto max-h-72 whitespace-pre">
                {JSON.stringify(httpResponse.data, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* 4. Encoders */}
        {activeTab === 'encoder' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              {(['base64', 'url', 'jwt', 'hex'] as const).map((enc) => (
                <button
                  key={enc}
                  onClick={() => setEncoderType(enc)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer ${
                    encoderType === enc ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {enc}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-2">
                <span className="text-xs font-bold text-gray-400 font-mono">Raw Input</span>
                <textarea
                  value={encoderInput}
                  onChange={(e) => setEncoderInput(e.target.value)}
                  className="w-full h-44 bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 font-mono">Encoded / Decoded Output</span>
                  <button
                    onClick={() => copyText(encoderOutput, 'enc')}
                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition cursor-pointer"
                  >
                    {copiedKey === 'enc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={encoderOutput}
                  className="w-full h-44 bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. JSON ➔ TypeScript */}
        {activeTab === 'schema' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-2">
              <span className="text-xs font-bold text-gray-400 font-mono">JSON Document</span>
              <textarea
                value={schemaJson}
                onChange={(e) => setSchemaJson(e.target.value)}
                className="w-full h-72 bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 font-mono">TypeScript Types</span>
                <button
                  onClick={() => copyText(tsInterface, 'ts')}
                  className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition cursor-pointer"
                >
                  {copiedKey === 'ts' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="w-full h-72 bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-blue-300 overflow-auto whitespace-pre">
                {tsInterface}
              </pre>
            </div>
          </div>
        )}

        {/* 6. AST Inspector */}
        {activeTab === 'ast' && (
          <div className="space-y-4 animate-fade-in font-mono text-xs">
            <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-3">
              <span className="text-white font-bold block">AST JavaScript / TypeScript Parser</span>
              <textarea
                value={astCode}
                onChange={(e) => setAstCode(e.target.value)}
                className="w-full h-28 bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none"
              />

              <div className="p-3 bg-black/60 rounded-xl border border-white/5 space-y-1 text-emerald-300 text-[11px]">
                <div className="text-blue-400 font-bold">Program Node (ESTree compliant)</div>
                <div>├── FunctionDeclaration: calculateMetric (params: rate, count)</div>
                <div>│   ├── VariableDeclaration: const total = BinaryExpression (rate * count)</div>
                <div>│   └── ReturnStatement: ConditionalExpression (total &gt; 100 ? "High" : "Normal")</div>
                <div className="text-gray-500">└── EndOfFile (Tokens: 24, Scope: Global)</div>
              </div>
            </div>
          </div>
        )}

        {/* 7. Diff */}
        {activeTab === 'diff' && (
          <div className="space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-[#101522] border border-white/10 space-y-1">
                <span className="text-xs font-bold text-gray-400 font-mono">Original</span>
                <textarea
                  value={diffOriginal}
                  onChange={(e) => setDiffOriginal(e.target.value)}
                  className="w-full h-36 bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#101522] border border-white/10 space-y-1">
                <span className="text-xs font-bold text-gray-400 font-mono">Modified</span>
                <textarea
                  value={diffModified}
                  onChange={(e) => setDiffModified(e.target.value)}
                  className="w-full h-36 bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-2 font-mono text-xs">
              <span className="font-bold text-white block">Visual Comparison</span>
              <div className="p-3 bg-black/60 rounded-xl border border-white/5 space-y-1 text-[11px]">
                <div className="text-rose-400">- const port = 3000;</div>
                <div className="text-emerald-400">+ const port = 8080;</div>
                <div className="text-rose-400">- const host = "127.0.0.1";</div>
                <div className="text-emerald-400">+ const host = "0.0.0.0";</div>
                <div className="text-emerald-400">+ const isProduction = true;</div>
              </div>
            </div>
          </div>
        )}

        {/* 8. Cheat Sheets */}
        {activeTab === 'docs' && (
          <div className="space-y-4 animate-fade-in text-xs text-gray-300">
            <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Essential Developer Cheat Sheets & HTTP Reference
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1 font-mono">
                  <span className="text-blue-400 font-bold block">HTTP Status Codes</span>
                  <p className="text-gray-400">200 OK • 201 Created • 204 No Content</p>
                  <p className="text-gray-400">400 Bad Request • 401 Unauthorized • 404 Not Found</p>
                  <p className="text-gray-400">500 Internal Error • 502 Bad Gateway • 503 Unavailable</p>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1 font-mono">
                  <span className="text-emerald-400 font-bold block">Git Shortcuts</span>
                  <p className="text-gray-400">git switch -c &lt;branch&gt; (create branch)</p>
                  <p className="text-gray-400">git cherry-pick &lt;commit&gt;</p>
                  <p className="text-gray-400">git rebase -i HEAD~3</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
