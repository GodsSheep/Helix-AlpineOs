import React, { useState, useEffect } from 'react';
import { P2PMeshSync, P2PNode, P2PFileTransferItem } from '../../kernel/P2PMeshSync';
import { 
  Wifi, 
  Share2, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Copy, 
  Check, 
  Upload, 
  Download, 
  ArrowRightLeft, 
  Plus, 
  Terminal, 
  Zap, 
  ShieldCheck, 
  Activity 
} from 'lucide-react';

interface P2PMeshAppProps {
  notify?: (msg: string) => void;
}

export const P2PMeshApp: React.FC<P2PMeshAppProps> = ({ notify }) => {
  const [nodes, setNodes] = useState<P2PNode[]>(P2PMeshSync.getNodes());
  const [transfers, setTransfers] = useState<P2PFileTransferItem[]>(P2PMeshSync.getTransfers());
  const [clipboardInput, setClipboardInput] = useState(P2PMeshSync.getSharedClipboard());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = P2PMeshSync.subscribe((newNodes, newTransfers) => {
      setNodes(newNodes);
      setTransfers(newTransfers);
    });
    return unsub;
  }, []);

  const handleSyncClipboard = () => {
    if (!clipboardInput.trim()) return;
    P2PMeshSync.syncClipboard(clipboardInput);
    if (notify) notify('Shared clipboard synced across all mesh nodes');
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(clipboardInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (nodeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      P2PMeshSync.sendFileToNode(nodeId, file);
      if (notify) notify(`Streaming file [${file.name}] via WebRTC P2P...`);
    }
  };

  const renderDeviceIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Smartphone className="w-5 h-5 text-purple-400" />;
      case 'tablet': return <Tablet className="w-5 h-5 text-cyan-400" />;
      default: return <Monitor className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0e14] text-gray-200 animate-fade-in p-4 overflow-y-auto space-y-5">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-purple-950/30 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Wifi className="w-5 h-5 text-cyan-400" />
            P2P Decentralized Mesh Sync Studio
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Connect phones, tablets, and laptops via WebRTC. Sync shared clipboards, stream files, and remote control terminal sessions.
          </p>
        </div>
        <button
          onClick={() => P2PMeshSync.connectNewNode('New Tablet Node', 'tablet')}
          className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Pair Device</span>
        </button>
      </div>

      {/* Shared Clipboard Card */}
      <div className="p-4 rounded-2xl bg-[#121622] border border-white/10 space-y-3">
        <span className="text-xs font-semibold text-white flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-purple-400" />
          Real-Time Cross-Device Mesh Clipboard
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type or paste text to broadcast instantly across all connected nodes..."
            value={clipboardInput}
            onChange={(e) => setClipboardInput(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={handleSyncClipboard}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Broadcast
          </button>
          <button
            onClick={handleCopyClipboard}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-300 transition cursor-pointer"
            title="Copy Current Clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Connected Nodes Grid */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block font-mono">
          Connected Mesh Peer Nodes ({nodes.length})
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="p-4 rounded-2xl bg-[#121622] border border-white/10 space-y-3 hover:border-cyan-500/30 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                    {renderDeviceIcon(node.deviceType)}
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">{node.deviceName}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{node.ipAddress}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  node.status === 'connected' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {node.status.toUpperCase()}
                </span>
              </div>

              {/* Metrics */}
              <div className="p-2 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono flex items-center justify-between text-gray-400">
                <span>Latency: <strong className="text-cyan-300">{node.latencyMs}ms</strong></span>
                <span>WebRTC Mesh</span>
              </div>

              {/* Direct File Stream Button */}
              <label className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-gray-300 flex items-center justify-center gap-1.5 transition cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Stream File via P2P</span>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(node.id, e)}
                  className="hidden"
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Active File Transfers Progress */}
      {transfers.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#121622] border border-white/10 space-y-3">
          <span className="text-xs font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Active WebRTC File Transfers
          </span>
          <div className="space-y-2">
            {transfers.map((t) => (
              <div key={t.id} className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-gray-200">
                  <span>{t.fileName}</span>
                  <span className="text-cyan-300">{t.progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${t.progressPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
