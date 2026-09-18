import React, { useState } from 'react';
import { Toast } from '../../kernel/Toast';
import { Kernel } from '../../kernel';
import { GitCompare, FileText, ArrowRight, Download, Save, RefreshCw, Copy, Check } from 'lucide-react';

export const DiffViewerApp: React.FC = () => {
  const [leftText, setLeftText] = useState(`#!/bin/sh
# System initialization script v1.0
echo "Starting network..."
ifconfig eth0 192.168.1.100 netmask 255.255.255.0 up
route add default gw 192.168.1.1
echo "Network started."
exit 0`);

  const [rightText, setRightText] = useState(`#!/bin/sh
# System initialization script v2.0
echo "Starting network with DHCP..."
udhcpc -i eth0 -b -p /var/run/udhcpc.eth0.pid
echo "Resolving DNS nameservers..."
echo "nameserver 1.1.1.1" > /etc/resolv.conf
echo "Network configured successfully."
exit 0`);

  const [leftFilename, setLeftFilename] = useState('init-v1.sh');
  const [rightFilename, setRightFilename] = useState('init-v2.sh');
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  // Compute line diff
  const leftLines = leftText.split('\n');
  const rightLines = rightText.split('\n');
  const maxLines = Math.max(leftLines.length, rightLines.length);

  const unifiedDiffLines: { text: string; type: 'add' | 'del' | 'same' }[] = [];
  unifiedDiffLines.push({ text: `--- a/${leftFilename}`, type: 'same' });
  unifiedDiffLines.push({ text: `+++ b/${rightFilename}`, type: 'same' });
  unifiedDiffLines.push({ text: `@@ -1,${leftLines.length} +1,${rightLines.length} @@`, type: 'same' });

  for (let i = 0; i < maxLines; i++) {
    const l = leftLines[i];
    const r = rightLines[i];
    if (l === r) {
      if (l !== undefined) unifiedDiffLines.push({ text: ` ${l}`, type: 'same' });
    } else {
      if (l !== undefined) unifiedDiffLines.push({ text: `-${l}`, type: 'del' });
      if (r !== undefined) unifiedDiffLines.push({ text: `+${r}`, type: 'add' });
    }
  }

  const handleSavePatchToVFS = async () => {
    try {
      const patchContent = unifiedDiffLines.map((l) => l.text).join('\n') + '\n';
      await Kernel.vfs.write('/root/script_diff.patch', patchContent);
      Toast.show('Saved patch to /root/script_diff.patch', '💾');
    } catch {
      Toast.show('Failed saving patch to VFS', '⚠️');
    }
  };

  const handleCopyPatch = () => {
    const patchContent = unifiedDiffLines.map((l) => l.text).join('\n');
    navigator.clipboard?.writeText(patchContent);
    Toast.show('Unified diff patch copied to clipboard', '✓');
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141724] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm">Visual Diff & Patch Studio</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400">
            diff -u / Meld
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'split' ? 'unified' : 'split')}
            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-mono transition"
          >
            Mode: {viewMode.toUpperCase()}
          </button>
          <button
            onClick={handleCopyPatch}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
            title="Copy Patch"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSavePatchToVFS}
            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded flex items-center gap-1.5 font-medium transition"
          >
            <Save className="w-3 h-3" />
            <span>Save .patch</span>
          </button>
        </div>
      </div>

      {viewMode === 'split' ? (
        <div className="flex-1 flex overflow-hidden font-mono text-xs">
          {/* Left File Pane */}
          <div className="flex-1 flex flex-col border-r border-white/10 overflow-hidden">
            <div className="px-3 py-1.5 bg-[#10121d] border-b border-white/10 flex items-center justify-between text-gray-400 text-[11px]">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <input
                  type="text"
                  value={leftFilename}
                  onChange={(e) => setLeftFilename(e.target.value)}
                  className="bg-transparent border-b border-transparent hover:border-white/20 text-white focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-gray-500">Original (Old)</span>
            </div>
            <textarea
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              className="flex-1 w-full bg-[#090a10] p-3 text-gray-300 focus:outline-none resize-none leading-relaxed overflow-y-auto"
            />
          </div>

          {/* Right File Pane */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-1.5 bg-[#10121d] border-b border-white/10 flex items-center justify-between text-gray-400 text-[11px]">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <input
                  type="text"
                  value={rightFilename}
                  onChange={(e) => setRightFilename(e.target.value)}
                  className="bg-transparent border-b border-transparent hover:border-white/20 text-white focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-gray-500">Modified (New)</span>
            </div>
            <textarea
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              className="flex-1 w-full bg-[#090a10] p-3 text-gray-300 focus:outline-none resize-none leading-relaxed overflow-y-auto"
            />
          </div>
        </div>
      ) : (
        /* Unified Diff View */
        <div className="flex-1 flex flex-col overflow-y-auto p-4 bg-[#090a10] font-mono text-xs space-y-0.5">
          {unifiedDiffLines.map((line, idx) => (
            <div
              key={idx}
              className={`px-2 py-0.5 rounded ${
                line.type === 'add'
                  ? 'bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-400'
                  : line.type === 'del'
                  ? 'bg-rose-500/15 text-rose-300 border-l-2 border-rose-400'
                  : 'text-gray-400'
              }`}
            >
              {line.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
