import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Square,
  Filter,
  Search,
  Download,
  Upload,
  RefreshCw,
  Layers,
  Code2,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Wifi,
  Radio,
  FileText
} from 'lucide-react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';

interface Packet {
  id: number;
  time: string;
  source: string;
  destination: string;
  protocol: 'TCP' | 'UDP' | 'HTTP' | 'DNS' | 'TLS' | 'ICMP' | 'SSH' | '9P';
  length: number;
  info: string;
  hex: string;
  ascii: string;
  layers: {
    frame: string;
    ethernet: string;
    ip: string;
    transport: string;
    application?: string;
  };
}

export const PacketAnalyzerApp: React.FC = () => {
  const [isCapturing, setIsCapturing] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);

  const [packets, setPackets] = useState<Packet[]>([
    {
      id: 1,
      time: '0.000000',
      source: '192.168.1.145',
      destination: '1.1.1.1',
      protocol: 'DNS',
      length: 74,
      info: 'Standard query 0x3a4f A api.github.com',
      hex: '00 1a 2b 3c 4d 5e 08 00 27 c5 42 a8 08 00 45 00 00 3c a1 b2 40 00 40 11 f4 a1 c0 a8 01 91 01 01 01 01 d5 e1 00 35 00 28 89 2c 3a 4f 01 00 00 01 00 00 00 00 00 00 03 61 70 69 06 67 69 74 68 75 62 03 63 6f 6d 00 00 01 00 01',
      ascii: '..+<M^..\'EB...E..<..@.@.......5.(.,:O...........api.github.com...',
      layers: {
        frame: 'Frame 1: 74 bytes on wire (592 bits), 74 bytes captured on interface eth0',
        ethernet: 'Ethernet II, Src: Realtek_c5:42:a8 (08:00:27:c5:42:a8), Dst: Gateway_3c:4d:5e (00:1a:2b:3c:4d:5e)',
        ip: 'Internet Protocol Version 4, Src: 192.168.1.145, Dst: 1.1.1.1, TTL: 64, Protocol: UDP (17)',
        transport: 'User Datagram Protocol, Src Port: 54753, Dst Port: 53, Length: 40, Checksum: 0x892c',
        application: 'Domain Name System (query): Transaction ID: 0x3a4f, Flags: 0x0100 Standard query, Queries: api.github.com: type A, class IN'
      }
    },
    {
      id: 2,
      time: '0.012480',
      source: '1.1.1.1',
      destination: '192.168.1.145',
      protocol: 'DNS',
      length: 90,
      info: 'Standard query response 0x3a4f A api.github.com A 140.82.121.6',
      hex: '08 00 27 c5 42 a8 00 1a 2b 3c 4d 5e 08 00 45 00 00 4c 12 34 00 00 39 11 b8 e1 01 01 01 01 c0 a8 01 91 00 35 d5 e1 00 38 1e f2 3a 4f 81 80 00 01 00 01 00 00 00 00 03 61 70 69 06 67 69 74 68 75 62 03 63 6f 6d 00 00 01 00 01 c0 0c 00 01 00 01 00 00 00 3c 00 04 8c 52 79 06',
      ascii: '..\'EB...+<M^..E..L.4..9........5...8..:O...........api.github.com.............<...Ry.',
      layers: {
        frame: 'Frame 2: 90 bytes on wire, interface eth0',
        ethernet: 'Ethernet II, Src: Gateway_3c:4d:5e, Dst: Realtek_c5:42:a8',
        ip: 'Internet Protocol Version 4, Src: 1.1.1.1, Dst: 192.168.1.145, TTL: 57',
        transport: 'User Datagram Protocol, Src Port: 53, Dst Port: 54753, Length: 56',
        application: 'Domain Name System (response): api.github.com: type A, class IN, addr 140.82.121.6, TTL 60s'
      }
    },
    {
      id: 3,
      time: '0.018240',
      source: '192.168.1.145',
      destination: '140.82.121.6',
      protocol: 'TLS',
      length: 517,
      info: 'Client Hello (TLS 1.3), SNI: api.github.com, ALPN: h2,http/1.1',
      hex: '00 1a 2b 3c 4d 5e 08 00 27 c5 42 a8 08 00 45 00 01 f7 b1 c4 40 00 40 06 d2 e9 c0 a8 01 91 8c 52 79 06 e4 12 01 bb 4a 1f 8c 92 00 00 00 00 80 18 01 f5 b4 a2 00 00 01 01 08 0a 12 34 56 78 00 00 00 00 16 03 01 01 c8 01 00 01 c4 03 03',
      ascii: '..+<M^..\'EB...E.....@.@......Ry.....J...........4Vx.........',
      layers: {
        frame: 'Frame 3: 517 bytes captured on interface eth0',
        ethernet: 'Ethernet II, Src: 08:00:27:c5:42:a8, Dst: 00:1a:2b:3c:4d:5e',
        ip: 'Internet Protocol Version 4, Src: 192.168.1.145, Dst: 140.82.121.6',
        transport: 'Transmission Control Protocol, Src Port: 58386, Dst Port: 443 [SYN, ACK], Seq=1, Ack=1',
        application: 'Transport Layer Security: TLSv1.3 Handshake Protocol: Client Hello (0x01), Cipher Suites (17 suites), Extensions: server_name, supported_versions'
      }
    },
    {
      id: 4,
      time: '0.034110',
      source: '140.82.121.6',
      destination: '192.168.1.145',
      protocol: 'TLS',
      length: 1420,
      info: 'Server Hello, Change Cipher Spec, Application Data',
      hex: '08 00 27 c5 42 a8 00 1a 2b 3c 4d 5e 08 00 45 00 05 8c 88 12 40 00 35 06 f4 81 8c 52 79 06 c0 a8 01 91 01 bb e4 12 8f 2a 11 04 4a 1f 8d 97 80 18 00 e2 7a 99 00 00 01 01 08 0a a1 b2 c3 d4 12 34 56 78 16 03 03 00 7a 02 00 00 76 03 03',
      ascii: '..\'EB...+<M^..E.....@.5.....Ry..........J...z.........4Vx...z..v..',
      layers: {
        frame: 'Frame 4: 1420 bytes on wire',
        ethernet: 'Ethernet II, Src: 00:1a:2b:3c:4d:5e, Dst: 08:00:27:c5:42:a8',
        ip: 'Internet Protocol Version 4, Src: 140.82.121.6, Dst: 192.168.1.145',
        transport: 'Transmission Control Protocol, Src Port: 443, Dst Port: 58386, Seq=1, Ack=464',
        application: 'Transport Layer Security: TLSv1.3 Server Hello, Key Exchange (x25519), Encrypted Extensions'
      }
    },
    {
      id: 5,
      time: '0.048900',
      source: '192.168.1.145',
      destination: '127.0.0.1',
      protocol: '9P',
      length: 128,
      info: '9P2000.L: Tgetattr tag 1 fid 4 request_mask 0x1fff',
      hex: '80 00 00 00 18 00 01 00 00 00 04 00 00 00 ff 1f 00 00 00 00 00 00',
      ascii: '......................',
      layers: {
        frame: 'Frame 5: 128 bytes (Virtio-9P Local Bus)',
        ethernet: 'VirtIO Loopback Bus (v86 9P Channel)',
        ip: 'Localhost IPC Channel',
        transport: 'Asynchronous 9P Virtual I/O Thread Channel',
        application: '9P2000.L Plan 9 Filesystem Protocol: Tgetattr on /home/alpine'
      }
    }
  ]);

  // Periodic simulated packet capture
  useEffect(() => {
    if (!isCapturing) return;

    const interval = setInterval(() => {
      setPackets(prev => {
        const id = prev.length + 1;
        const time = (0.05 + id * 0.015).toFixed(6);
        const protocols: Array<'TCP' | 'UDP' | 'HTTP' | 'DNS' | 'TLS' | 'ICMP' | '9P'> = ['TCP', 'UDP', 'HTTP', 'TLS', '9P'];
        const proto = protocols[Math.floor(Math.random() * protocols.length)];

        const newPacket: Packet = {
          id,
          time,
          source: proto === '9P' ? '127.0.0.1' : '192.168.1.145',
          destination: proto === '9P' ? '127.0.0.1' : proto === 'DNS' ? '1.1.1.1' : '140.82.121.6',
          protocol: proto,
          length: Math.floor(64 + Math.random() * 1200),
          info: proto === 'TCP' ? `TCP Port 443 [ACK] Seq=${id * 100} Ack=${id * 200}` : proto === '9P' ? `9P2000.L: Rgetattr tag ${id} fid 4` : `Application Data (${proto})`,
          hex: '00 1a 2b 3c 4d 5e 08 00 27 c5 42 a8 08 00 45 00 00 3c ' + Math.random().toString(16).substring(2, 10),
          ascii: '..+<M^..\'EB...E..<..' + Math.random().toString(36).substring(2, 6),
          layers: {
            frame: `Frame ${id}: Captured on eth0 (${new Date().toLocaleTimeString()})`,
            ethernet: 'Ethernet II (08:00:27:c5:42:a8 -> 00:1a:2b:3c:4d:5e)',
            ip: 'IPv4 Src: 192.168.1.145, Dst: 140.82.121.6',
            transport: `${proto} Transport Layer`,
            application: `Protocol: ${proto}`
          }
        };

        if (prev.length > 80) return [...prev.slice(1), newPacket];
        return [...prev, newPacket];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isCapturing]);

  const filteredPackets = packets.filter(p => {
    if (!filterText) return true;
    const q = filterText.toLowerCase();
    return (
      p.protocol.toLowerCase().includes(q) ||
      p.source.toLowerCase().includes(q) ||
      p.destination.toLowerCase().includes(q) ||
      p.info.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-gray-100 select-none font-sans overflow-hidden">
      {/* Top Bar */}
      <div className="p-3 bg-[#131622] border-b border-white/10 flex items-center justify-between flex-wrap gap-2 shrink-0 font-mono">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xs flex items-center gap-1.5">
              <span>Wireshark Network & Packet Protocol Dissector</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                eth0 (Promiscuous Mode)
              </span>
            </h2>
            <p className="text-[10px] text-gray-400">Live packet sniffer, BPF filter syntax, OSI layer breakdown, and synchronized hex/ASCII inspector.</p>
          </div>
        </div>

        {/* Capture Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsCapturing(!isCapturing);
              SoundManager.play('click');
              Toast.show(isCapturing ? 'Capture paused' : 'Capture streaming resumed', isCapturing ? '⏹️' : '▶️');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow ${
              isCapturing ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30' : 'bg-emerald-500 hover:bg-emerald-400 text-white'
            }`}
          >
            {isCapturing ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isCapturing ? 'Stop Capture' : 'Start Capture'}</span>
          </button>

          <button
            onClick={() => {
              setPackets([]);
              setSelectedPacket(null);
              SoundManager.play('toast');
            }}
            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl text-xs font-bold cursor-pointer transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* BPF Filter Bar */}
      <div className="px-3 py-2 bg-[#0c0d14] border-b border-white/10 flex items-center gap-2 font-mono text-xs shrink-0">
        <Filter className="w-3.5 h-3.5 text-cyan-400" />
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Apply display filter (e.g. tcp, udp, dns, tls, http, 9p, 192.168.1.1)..."
          className="flex-1 bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-emerald-300 focus:outline-none focus:border-cyan-400 text-xs"
        />
        {filterText && (
          <button onClick={() => setFilterText('')} className="text-gray-400 hover:text-white text-xs cursor-pointer">
            ✕
          </button>
        )}
      </div>

      {/* Main Split: Packet List (Top) & Inspector (Bottom) */}
      <div className="flex-1 flex flex-col overflow-hidden font-mono text-xs">
        {/* Packet Table */}
        <div className="flex-1 overflow-y-auto bg-[#0d0f17] select-text">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead className="sticky top-0 bg-[#151824] border-b border-white/10 text-gray-400 font-bold z-10">
              <tr>
                <th className="p-2 w-12">No.</th>
                <th className="p-2 w-24">Time</th>
                <th className="p-2 w-32">Source</th>
                <th className="p-2 w-32">Destination</th>
                <th className="p-2 w-16">Protocol</th>
                <th className="p-2 w-16">Length</th>
                <th className="p-2">Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPackets.map((p) => {
                const isSelected = selectedPacket?.id === p.id;
                let protoColor = 'text-gray-300';
                if (p.protocol === 'DNS') protoColor = 'text-cyan-300 bg-cyan-500/10';
                else if (p.protocol === 'TLS') protoColor = 'text-purple-300 bg-purple-500/10';
                else if (p.protocol === 'HTTP') protoColor = 'text-emerald-300 bg-emerald-500/10';
                else if (p.protocol === 'TCP') protoColor = 'text-blue-300 bg-blue-500/10';
                else if (p.protocol === '9P') protoColor = 'text-amber-300 bg-amber-500/10';

                return (
                  <tr
                    key={p.id}
                    onClick={() => {
                      setSelectedPacket(p);
                      SoundManager.play('click');
                    }}
                    className={`cursor-pointer transition hover:bg-white/10 ${
                      isSelected ? 'bg-cyan-500/20 text-white font-bold' : ''
                    }`}
                  >
                    <td className="p-2 text-gray-500">{p.id}</td>
                    <td className="p-2 text-gray-400">{p.time}</td>
                    <td className="p-2 text-emerald-300">{p.source}</td>
                    <td className="p-2 text-indigo-300">{p.destination}</td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${protoColor}`}>{p.protocol}</span>
                    </td>
                    <td className="p-2 text-gray-400">{p.length}</td>
                    <td className="p-2 text-gray-200 truncate max-w-xs sm:max-w-md">{p.info}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Dissector Panel */}
        {selectedPacket ? (
          <div className="h-56 bg-[#121520] border-t border-white/10 flex flex-col md:flex-row overflow-hidden shrink-0">
            {/* OSI Layers Tree */}
            <div className="w-full md:w-1/2 p-3 border-r border-white/10 overflow-y-auto space-y-1.5 text-[11px] select-text">
              <div className="font-bold text-white text-xs pb-1 border-b border-white/10 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Packet #{selectedPacket.id} Protocol Layers</span>
              </div>
              <div className="p-1.5 bg-black/40 rounded border border-white/5 text-gray-300">
                <span className="font-bold text-cyan-300">▶ </span>{selectedPacket.layers.frame}
              </div>
              <div className="p-1.5 bg-black/40 rounded border border-white/5 text-gray-300">
                <span className="font-bold text-cyan-300">▶ </span>{selectedPacket.layers.ethernet}
              </div>
              <div className="p-1.5 bg-black/40 rounded border border-white/5 text-gray-300">
                <span className="font-bold text-cyan-300">▶ </span>{selectedPacket.layers.ip}
              </div>
              <div className="p-1.5 bg-black/40 rounded border border-white/5 text-gray-300">
                <span className="font-bold text-cyan-300">▶ </span>{selectedPacket.layers.transport}
              </div>
              {selectedPacket.layers.application && (
                <div className="p-1.5 bg-black/40 rounded border border-white/5 text-emerald-300 font-bold">
                  <span className="text-cyan-300">▶ </span>{selectedPacket.layers.application}
                </div>
              )}
            </div>

            {/* Hex & ASCII Dump */}
            <div className="w-full md:w-1/2 p-3 bg-[#0c0d14] overflow-y-auto font-mono text-[10px] space-y-1 select-text">
              <div className="font-bold text-white text-xs pb-1 border-b border-white/10 flex items-center justify-between">
                <span>Hex Raw Payload</span>
                <span className="text-gray-500">{selectedPacket.length} bytes</span>
              </div>
              <div className="text-cyan-300 leading-relaxed break-all">
                {selectedPacket.hex}
              </div>
              <div className="pt-2 border-t border-white/5 text-emerald-400 leading-relaxed select-text">
                ASCII: {selectedPacket.ascii}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[#121520] border-t border-white/10 text-center text-gray-500 text-xs">
            Select any packet in the table above to view deep OSI protocol dissection and raw byte payload.
          </div>
        )}
      </div>
    </div>
  );
};
