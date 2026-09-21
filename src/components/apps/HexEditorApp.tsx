import React, { useState, useEffect } from 'react';
import { Kernel } from '../../kernel';
import { Binary, Save, FolderOpen, RefreshCw, Copy, Check, FileCode } from 'lucide-react';
import { SoundManager } from '../../kernel/SoundManager';

export const HexEditorApp: React.FC = () => {
  const [filePath, setFilePath] = useState('/etc/hostname');
  const [fileContent, setFileContent] = useState('helix-debian\n');
  const [hexBytes, setHexBytes] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadFile(filePath);
  }, []);

  const loadFile = async (path: string) => {
    try {
      const content = (await Kernel.vfs.read(path)) || 'Sample Hex Binary Content';
      setFileContent(content);
      const encoder = new TextEncoder();
      const bytes = Array.from(encoder.encode(content));
      setHexBytes(bytes);
    } catch {
      setFileContent('Error loading file');
      setHexBytes([]);
    }
  };

  const handleSave = async () => {
    SoundManager.play('success');
    const decoder = new TextDecoder();
    const str = decoder.decode(new Uint8Array(hexBytes));
    await Kernel.vfs.write(filePath, str);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleByteChange = (idx: number, hexVal: string) => {
    const parsed = parseInt(hexVal, 16);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 255) {
      const updated = [...hexBytes];
      updated[idx] = parsed;
      setHexBytes(updated);
    }
  };

  const handleCopyHex = () => {
    SoundManager.play('click');
    const hexString = hexBytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
    navigator.clipboard.writeText(hexString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group bytes into 16-byte rows
  const rows: { offset: string; bytes: number[]; ascii: string }[] = [];
  for (let i = 0; i < hexBytes.length; i += 16) {
    const chunk = hexBytes.slice(i, i + 16);
    const offset = i.toString(16).padStart(8, '0').toUpperCase();
    const ascii = chunk.map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
    rows.push({ offset, bytes: chunk, ascii });
  }

  return (
    <div className="h-full flex flex-col bg-[#0b0d14] text-[#edf1f7] text-xs font-mono select-none overflow-hidden p-4">
      {/* Top Header */}
      <div className="flex justify-between items-center pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Binary className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-sm text-cyan-400">hexedit — Binary & VFS Hex Inspector</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyHex}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#6ee7b7]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Hex' : 'Copy Hex'}</span>
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 text-black font-bold flex items-center gap-1.5 hover:bg-cyan-400 transition cursor-pointer"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saved ? 'Saved!' : 'Save Binary'}</span>
          </button>
        </div>
      </div>

      {/* Path Input */}
      <div className="flex gap-2 my-3">
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="/path/to/file"
          className="flex-1 px-3 py-1.5 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
        />
        <button
          onClick={() => loadFile(filePath)}
          className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl flex items-center gap-1.5 transition cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </button>
      </div>

      {/* Hex Dump Table */}
      <div className="flex-1 overflow-y-auto bg-black/80 border border-white/10 rounded-2xl p-4 space-y-1">
        <div className="flex text-gray-500 text-[10px] pb-2 border-b border-white/10 font-bold">
          <span className="w-24">OFFSET</span>
          <span className="flex-1">BYTES (HEX)</span>
          <span className="w-36 text-right">ASCII DECODE</span>
        </div>

        {rows.length === 0 ? (
          <div className="text-gray-500 py-8 text-center">No file loaded or file is empty</div>
        ) : (
          rows.map((row, rIdx) => (
            <div key={rIdx} className="flex items-center text-[11px] hover:bg-white/5 py-0.5 px-1 rounded transition">
              <span className="w-24 text-cyan-400 font-bold">{row.offset}</span>
              <div className="flex-1 flex gap-2 flex-wrap">
                {row.bytes.map((b, bIdx) => (
                  <input
                    key={bIdx}
                    type="text"
                    maxLength={2}
                    value={b.toString(16).padStart(2, '0').toUpperCase()}
                    onChange={(e) => handleByteChange(rIdx * 16 + bIdx, e.target.value)}
                    className="w-6 text-center bg-transparent border border-white/10 rounded text-emerald-300 font-bold focus:bg-cyan-500/20 focus:outline-none"
                  />
                ))}
              </div>
              <span className="w-36 text-right text-amber-300 font-mono tracking-widest">{row.ascii}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
