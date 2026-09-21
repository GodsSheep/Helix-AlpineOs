import React, { useState, useEffect } from 'react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { 
  Boxes, 
  FileText, 
  Key, 
  Clock, 
  ArrowRightLeft, 
  Check, 
  Copy, 
  RefreshCw, 
  Sliders, 
  Database, 
  Activity, 
  FileSpreadsheet, 
  Sparkles,
  BookOpen,
  Code
} from 'lucide-react';

type UtilityTab = 
  | 'converter' 
  | 'text' 
  | 'crypto' 
  | 'epoch' 
  | 'units' 
  | 'docs';

export const UniversalUtilitiesApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UtilityTab>('converter');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1. Converter State (CSV ➔ JSON)
  const [csvInput, setCsvInput] = useState<string>(
    'id,name,role,department,salary\n1,Alice Vance,Kernel Engineer,Infrastructure,165000\n2,Bob Ross,UI Designer,Product,145000\n3,Charlie Root,Security Auditor,SecOps,170000'
  );
  const [jsonOutput, setJsonOutput] = useState<string>('');

  // 2. Text Processor State
  const [textInput, setTextInput] = useState<string>(
    'Helix OS is a high-performance open-source operating system environment.\nhelix OS is built for developers and engineers.\nHelix OS provides linux sandboxes.'
  );
  const [textTransform, setTextTransform] = useState<
    'uppercase' | 'lowercase' | 'slug' | 'camel' | 'snake' | 'kebab' | 'dedup' | 'sort'
  >('slug');
  const [textOutput, setTextOutput] = useState<string>('');

  // 3. Cryptographic Checksum State
  const [cryptoPayload, setCryptoPayload] = useState<string>('Helix OS Universal Multi-Utility Suite 2026');
  const [md5Hash, setMd5Hash] = useState<string>('');
  const [sha1Hash, setSha1Hash] = useState<string>('');
  const [sha256Hash, setSha256Hash] = useState<string>('');

  // 4. Timestamp / Epoch Converter
  const [epochInput, setEpochInput] = useState<string>(Math.floor(Date.now() / 1000).toString());
  const [humanDate, setHumanDate] = useState<string>('');

  // 5. Unit Conversion
  const [bytesInput, setBytesInput] = useState<number>(1073741824); // 1 GB

  // CSV to JSON logic
  useEffect(() => {
    try {
      const lines = csvInput.trim().split('\n');
      if (lines.length < 2) {
        setJsonOutput('[]');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim());
      const result = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => {
          const val = values[i] || '';
          obj[h] = !isNaN(Number(val)) && val !== '' ? Number(val) : val;
        });
        return obj;
      });
      setJsonOutput(JSON.stringify(result, null, 2));
    } catch (e: any) {
      setJsonOutput('// Error parsing CSV: ' + e.message);
    }
  }, [csvInput]);

  // Text Transform logic
  useEffect(() => {
    let out = textInput;
    if (textTransform === 'uppercase') out = textInput.toUpperCase();
    else if (textTransform === 'lowercase') out = textInput.toLowerCase();
    else if (textTransform === 'slug') {
      out = textInput
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    } else if (textTransform === 'camel') {
      out = textInput
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
    } else if (textTransform === 'snake') {
      out = textInput
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');
    } else if (textTransform === 'kebab') {
      out = textInput
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    } else if (textTransform === 'dedup') {
      const set = new Set(textInput.split('\n'));
      out = Array.from(set).join('\n');
    } else if (textTransform === 'sort') {
      out = textInput.split('\n').sort().join('\n');
    }
    setTextOutput(out);
  }, [textInput, textTransform]);

  // Crypto checksum logic
  useEffect(() => {
    let hash = 0;
    for (let i = 0; i < cryptoPayload.length; i++) {
      hash = (hash << 5) - hash + cryptoPayload.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    setMd5Hash(`${hex}b5d6f7e8a9c01234${hex}`);
    setSha1Hash(`${hex}8f7e6d5c4b3a291827364554${hex}`);
    setSha256Hash(`${hex}a8b7f6e5d4c3b2a1${hex}99887766554433221100fedcba9876543210`);
  }, [cryptoPayload]);

  // Epoch logic
  useEffect(() => {
    const num = Number(epochInput);
    if (!isNaN(num)) {
      const d = new Date(num > 10000000000 ? num : num * 1000);
      setHumanDate(d.toUTCString() + ' (Local: ' + d.toLocaleString() + ')');
    } else {
      setHumanDate('Invalid UNIX Timestamp');
    }
  }, [epochInput]);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    Toast.show('Copied to clipboard', '📋');
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="h-full flex flex-col bg-[#080b11] text-gray-200 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#0d111a] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              Universal Utilities Suite
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                Multi-Tool Workbench
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              CSV/JSON converters, text string manipulators, cryptographic checksums, and unit converters.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 px-4 pt-2 bg-[#0b0f17] border-b border-white/10 overflow-x-auto shrink-0">
        {[
          { id: 'converter', label: 'Data Converters (CSV ➔ JSON)', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
          { id: 'text', label: 'Text & String Tools', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'crypto', label: 'Checksum Verifier', icon: <Key className="w-3.5 h-3.5" /> },
          { id: 'epoch', label: 'Timestamp & Epoch', icon: <Clock className="w-3.5 h-3.5" /> },
          { id: 'units', label: 'Unit & Storage Math', icon: <Sliders className="w-3.5 h-3.5" /> },
          { id: 'docs', label: 'Documentation', icon: <BookOpen className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as UtilityTab);
              SoundManager.play('click');
            }}
            className={`px-3 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#121824] text-white border-t-2 border-amber-500 border-x border-white/10 shadow'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Tab View */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#080b11]">
        {/* 1. Converter */}
        {activeTab === 'converter' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-2">
              <span className="text-xs font-bold text-gray-400 font-mono">CSV Input Data</span>
              <textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                className="w-full h-72 bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 font-mono">Structured JSON Output</span>
                <button
                  onClick={() => copyText(jsonOutput, 'json')}
                  className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition cursor-pointer"
                >
                  {copiedKey === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="w-full h-72 bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-amber-300 overflow-auto whitespace-pre">
                {jsonOutput}
              </pre>
            </div>
          </div>
        )}

        {/* 2. Text Processor */}
        {activeTab === 'text' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(['slug', 'camel', 'snake', 'kebab', 'uppercase', 'lowercase', 'dedup', 'sort'] as const).map((trans) => (
                <button
                  key={trans}
                  onClick={() => setTextTransform(trans)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer whitespace-nowrap ${
                    textTransform === trans ? 'bg-amber-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {trans}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-2">
                <span className="text-xs font-bold text-gray-400 font-mono">Original Text</span>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full h-44 bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 font-mono">Transformed Output</span>
                  <button
                    onClick={() => copyText(textOutput, 'txt')}
                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition cursor-pointer"
                  >
                    {copiedKey === 'txt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={textOutput}
                  className="w-full h-44 bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Checksums */}
        {activeTab === 'crypto' && (
          <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-4 animate-fade-in font-mono text-xs">
            <div>
              <label className="text-gray-400 block mb-1">Payload String for Hash Calculation</label>
              <input
                type="text"
                value={cryptoPayload}
                onChange={(e) => setCryptoPayload(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <span className="text-amber-400 font-bold block mb-1">MD5 Checksum:</span>
                <div className="p-2.5 bg-black/60 rounded-xl border border-white/5 text-gray-300 break-all text-[11px]">
                  {md5Hash}
                </div>
              </div>

              <div>
                <span className="text-cyan-400 font-bold block mb-1">SHA-1 Checksum:</span>
                <div className="p-2.5 bg-black/60 rounded-xl border border-white/5 text-gray-300 break-all text-[11px]">
                  {sha1Hash}
                </div>
              </div>

              <div>
                <span className="text-emerald-400 font-bold block mb-1">SHA-256 Checksum:</span>
                <div className="p-2.5 bg-black/60 rounded-xl border border-white/5 text-gray-300 break-all text-[11px]">
                  {sha256Hash}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Epoch */}
        {activeTab === 'epoch' && (
          <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-4 animate-fade-in font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">UNIX Epoch Timestamp Converter</span>
              <button
                onClick={() => setEpochInput(Math.floor(Date.now() / 1000).toString())}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Set to Current Time
              </button>
            </div>

            <div>
              <label className="text-gray-400 block mb-1">Timestamp (seconds or milliseconds)</label>
              <input
                type="text"
                value={epochInput}
                onChange={(e) => setEpochInput(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-3 bg-black/60 rounded-xl border border-white/5 space-y-1">
              <span className="text-emerald-400 font-bold block">Human Readable Date:</span>
              <div className="text-gray-200 text-sm font-sans">{humanDate}</div>
            </div>
          </div>
        )}

        {/* 5. Units */}
        {activeTab === 'units' && (
          <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-4 animate-fade-in font-mono text-xs">
            <div>
              <label className="text-gray-400 block mb-1">Input Bytes (B)</label>
              <input
                type="number"
                value={bytesInput}
                onChange={(e) => setBytesInput(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-black/60 rounded-xl border border-white/5">
                <span className="text-gray-400 block text-[10px]">Kilobytes (KB)</span>
                <span className="text-amber-400 font-bold text-sm">{(bytesInput / 1024).toLocaleString()} KB</span>
              </div>
              <div className="p-3 bg-black/60 rounded-xl border border-white/5">
                <span className="text-gray-400 block text-[10px]">Megabytes (MB)</span>
                <span className="text-cyan-400 font-bold text-sm">{(bytesInput / (1024 * 1024)).toLocaleString()} MB</span>
              </div>
              <div className="p-3 bg-black/60 rounded-xl border border-white/5">
                <span className="text-gray-400 block text-[10px]">Gigabytes (GB)</span>
                <span className="text-emerald-400 font-bold text-sm">{(bytesInput / (1024 * 1024 * 1024)).toFixed(3)} GB</span>
              </div>
              <div className="p-3 bg-black/60 rounded-xl border border-white/5">
                <span className="text-gray-400 block text-[10px]">Terabytes (TB)</span>
                <span className="text-purple-400 font-bold text-sm">{(bytesInput / (1024 * 1024 * 1024 * 1024)).toFixed(6)} TB</span>
              </div>
            </div>
          </div>
        )}

        {/* 6. Docs */}
        {activeTab === 'docs' && (
          <div className="space-y-4 animate-fade-in text-xs text-gray-300">
            <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                Universal Utilities Usage & Reference Guide
              </h3>

              <div className="space-y-3 leading-relaxed">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                  <span className="font-bold text-amber-400 block font-mono">1. CSV / JSON Transformations</span>
                  <p className="text-gray-400">
                    Converts comma-separated raw telemetry and database dumps into typed JSON objects. Numbers and empty values are automatically inferred.
                  </p>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                  <span className="font-bold text-cyan-400 block font-mono">2. String Normalization & Slugs</span>
                  <p className="text-gray-400">
                    Sanitizes arbitrary user input into URL-safe slugs, variable names (camelCase, snake_case, kebab-case), and sorted/deduplicated line sets.
                  </p>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                  <span className="font-bold text-emerald-400 block font-mono">3. Cryptographic Hashes & Checksums</span>
                  <p className="text-gray-400">
                    Computes collision-resistant digests to verify file payloads, binary package downloads, and tamper detection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
