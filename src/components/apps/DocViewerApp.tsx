import React, { useState } from 'react';
import { BookOpen, FileText, Search, PanelLeftClose, PanelLeft, Terminal, Shield, Cpu, HardDrive, Globe } from 'lucide-react';

interface DocItem {
  id: string;
  title: string;
  category: string;
  icon: any;
  content: string;
}

export const DocViewerApp: React.FC = () => {
  const docs: DocItem[] = [
    {
      id: 'alpine-basics',
      title: 'Alpine Linux & OpenRC Guide',
      category: 'System',
      icon: Cpu,
      content: `# Alpine Linux System Reference

Alpine Linux is a security-oriented, lightweight Linux distribution based on musl libc and busybox.

## Key Architecture
- **Musl libc**: Minimal footprint standard C library providing fast POSIX calls and thread synchronization.
- **OpenRC Init System**: Dependency-based init system with full runlevel management (\`sysinit\`, \`boot\`, \`default\`, \`shutdown\`).
- **Package Management (\`apk\`)**: Ultra-fast atomic package operations with \`apk add\`, \`apk del\`, and \`apk update\`.

## Common Commands
\`\`\`sh
apk update && apk add curl git htop
rc-service sshd start
rc-update add sshd default
cat /etc/alpine-release
\`\`\``
    },
    {
      id: 'helix-de',
      title: 'Helix Desktop Environment & Window Manager',
      category: 'Desktop',
      icon: BookOpen,
      content: `# Helix Desktop Environment Manual

Helix DE provides a native Wayland-style composited desktop for Alpine Linux with low-latency windowing and gesture support.

## Window Management
- **Window Shade / Roll-Up**: Double click any window titlebar or click the shade button to roll up into an ultra-compact 38px titlebar pill.
- **Zen Mode / Screen Maximize**: Press \`Alt+Z\` or \`F11\` to auto-hide dock and menubar for distraction-free full-screen workspace.
- **Collapsible App Sidebars**: Every utility app includes a dedicated panel collapse toggle to maximize document and editor area on small screens.
- **Snap Window Tiling**: Drag window edges to screen boundaries to snap left, right, top-left, or top-right.

## Global Shortcuts
- \`Super + T\`: Open Terminal
- \`Super + Space\` / \`Alt + F1\`: Open App Launcher
- \`Super + Left / Right\`: Half-Screen Window Tile
- \`Alt + Tab\`: Switch between active applications`
    },
    {
      id: 'vfs-storage',
      title: 'Virtual File System (VFS) & 9P VirtIO',
      category: 'Storage',
      icon: HardDrive,
      content: `# Virtual Storage Engine (VFS)

Helix OS provides a persistent high-performance IndexedDB-backed Virtual File System integrated with 9P VirtIO file sharing.

## Mount Points
- \`/mnt/helix\`: Persistent user storage (documents, scripts, downloads).
- \`/etc\`: System configuration files (crontabs, network interfaces, apk repositories).
- \`/var/log\`: System kernel, authentication, and service log ringbuffers.
- \`/root\`: Superuser home folder and SSH public/private keys.

## Programmatic Access
All files can be accessed synchronously or asynchronously via Kernel VFS APIs, bash scripts, Python scripts, or SQLite databases.`
    },
    {
      id: 'networking-guide',
      title: 'Network Stack, DNS & Netfilter Firewall',
      category: 'Network',
      icon: Globe,
      content: `# Linux Networking & Security

Comprehensive guide to network configuration, port scanning, and netfilter rules in Helix OS.

## Interface Configuration
- Network interfaces are managed via \`/etc/network/interfaces\` with DHCP and static IPv4/IPv6 support.
- Built-in DNS resolver routes requests through local caching resolver with fallback to 1.1.1.1.

## Netfilter / iptables
- Default policy drops unrequested inbound connections.
- Configurable firewall rules support TCP, UDP, ICMP with port forwarding and connection tracking.`
    },
    {
      id: 'bash-scripting',
      title: 'POSIX Shell & Bash Scripting Guide',
      category: 'Development',
      icon: Terminal,
      content: `# Shell Scripting Guide

Helix OS includes Ash and GNU Bash with full POSIX standard script execution.

## Useful Shell One-Liners
\`\`\`sh
# Monitor system memory and CPU
while true; do uptime; free -m; sleep 2; done

# Scan local open ports
nc -zv 127.0.0.1 20-100 2>&1 | grep open

# Search file content recursively
grep -rn "config" /etc/
\`\`\``
    },
  ];

  const [selectedDoc, setSelectedDoc] = useState<DocItem>(docs[0]);
  const [search, setSearch] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);

  const filtered = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.content.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#12141c] text-[#edf1f7] text-xs select-none overflow-hidden">
      {/* Top Header */}
      <div className="px-3 py-2 bg-[#181b26] border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showSidebar ? 'bg-[#6ee7b7]/15 text-[#6ee7b7] border-[#6ee7b7]/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
            }`}
            title={showSidebar ? 'Collapse Table of Contents' : 'Expand Table of Contents'}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <BookOpen className="w-4 h-4 text-[#6ee7b7]" />
          <span className="font-semibold text-white">Helix OS & Linux Documentation Library</span>
        </div>
        <div className="text-[11px] font-mono text-gray-400">
          Showing <span className="text-[#6ee7b7] font-bold">{selectedDoc.title}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-64 border-r border-white/10 flex flex-col bg-[#10121d] shrink-0">
            <div className="p-2.5 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#6ee7b7] font-mono"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filtered.map((doc) => {
                const Icon = doc.icon;
                const isSelected = selectedDoc.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex flex-col gap-1 border ${
                      isSelected
                        ? 'bg-[#6ee7b7]/15 border-[#6ee7b7]/40 text-white font-medium'
                        : 'bg-white/5 border-transparent hover:border-white/10 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#6ee7b7]' : 'text-gray-400'}`} />
                      <span className="truncate">{doc.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{doc.category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-black/20">
          <div className="max-w-3xl mx-auto w-full space-y-4">
            <div className="border-b border-white/10 pb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#6ee7b7] uppercase tracking-wider mb-1">
                  {selectedDoc.category} Reference Manual
                </div>
                <h1 className="text-xl font-bold text-white tracking-wide">{selectedDoc.title}</h1>
              </div>
            </div>
            <div className="font-mono text-xs text-gray-200 leading-relaxed whitespace-pre-wrap bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg">
              {selectedDoc.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
