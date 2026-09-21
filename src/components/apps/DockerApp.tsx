import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Layers,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Terminal,
  Activity,
  HardDrive,
  Network,
  Plus,
  Copy,
  Check,
  Search,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  FileCode,
  Flame,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { SoundManager } from '../../kernel/SoundManager';
import { Toast } from '../../kernel/Toast';
import { Kernel } from '../../kernel';

interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused';
  ports: string;
  cpu: number;
  memory: string;
  uptime: string;
  command: string;
}

interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
  layers: number;
}

export const DockerApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'containers' | 'images' | 'dockerfile' | 'stats' | 'exec'>('containers');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Containers list
  const [containers, setContainers] = useState<Container[]>([
    {
      id: 'c7a8b1f2',
      name: 'alpine-core',
      image: 'alpine:3.19',
      status: 'running',
      ports: '8080:80',
      cpu: 1.4,
      memory: '28.4 MB / 512 MB',
      uptime: 'Up 3 hours',
      command: '/bin/sh -c "while true; do sleep 1000; done"'
    },
    {
      id: 'f901c23a',
      name: 'redis-cache',
      image: 'redis:7.2-alpine',
      status: 'running',
      ports: '6379:6379',
      cpu: 0.8,
      memory: '14.2 MB / 256 MB',
      uptime: 'Up 3 hours',
      command: 'docker-entrypoint.sh redis-server --save 60 1'
    },
    {
      id: 'd45e6789',
      name: 'nginx-ingress',
      image: 'nginx:alpine',
      status: 'running',
      ports: '80:80, 443:443',
      cpu: 2.1,
      memory: '32.1 MB / 512 MB',
      uptime: 'Up 1 hour',
      command: 'nginx -g "daemon off;"'
    },
    {
      id: 'a12b34cd',
      name: 'node-backend',
      image: 'node:20-alpine',
      status: 'stopped',
      ports: '3000:3000',
      cpu: 0.0,
      memory: '0 MB / 1024 MB',
      uptime: 'Exited (0) 45 mins ago',
      command: 'node /app/server.js'
    },
    {
      id: 'b56c78de',
      name: 'postgres-db',
      image: 'postgres:16-alpine',
      status: 'stopped',
      ports: '5432:5432',
      cpu: 0.0,
      memory: '0 MB / 2048 MB',
      uptime: 'Exited (0) 2 hours ago',
      command: 'postgres'
    }
  ]);

  // Images list
  const [images, setImages] = useState<DockerImage[]>([
    { id: 'sha256:4a2b', repository: 'alpine', tag: '3.19', size: '7.38 MB', created: '2 weeks ago', layers: 1 },
    { id: 'sha256:8f1c', repository: 'redis', tag: '7.2-alpine', size: '36.4 MB', created: '1 month ago', layers: 6 },
    { id: 'sha256:9d3e', repository: 'nginx', tag: 'alpine', size: '42.8 MB', created: '3 weeks ago', layers: 4 },
    { id: 'sha256:1a5f', repository: 'node', tag: '20-alpine', size: '184.2 MB', created: '5 days ago', layers: 7 },
    { id: 'sha256:7e9b', repository: 'postgres', tag: '16-alpine', size: '248.5 MB', created: '1 month ago', layers: 11 },
    { id: 'sha256:3c4d', repository: 'rust', tag: '1.77-alpine', size: '612.0 MB', created: '2 weeks ago', layers: 9 }
  ]);

  // Dockerfile Builder State
  const [dockerfileContent, setDockerfileContent] = useState<string>(
`# Multi-Stage Production Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]`
  );

  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);

  // Exec Terminal State
  const [selectedContainerId, setSelectedContainerId] = useState<string>('c7a8b1f2');
  const [execHistory, setExecHistory] = useState<string[]>([
    '/ # uname -a',
    'Linux c7a8b1f2 6.6.21-alpine #1 SMP PREEMPT_DYNAMIC x86_64 Linux',
    '/ # ps aux',
    'PID   USER     TIME  COMMAND',
    '    1 root      0:00 /bin/sh -c while true; do sleep 1000; done',
    '   14 root      0:00 sleep 1000',
    '   22 root      0:00 /bin/sh',
    '/ # '
  ]);
  const [execInput, setExecInput] = useState('');

  // Pull image modal state
  const [pullImageName, setPullImageName] = useState('');
  const [isPulling, setIsPulling] = useState(false);

  const toggleContainer = (id: string) => {
    SoundManager.play('click');
    setContainers(prev =>
      prev.map(c => {
        if (c.id === id) {
          const nextStatus = c.status === 'running' ? 'stopped' : 'running';
          Toast.show(`Container '${c.name}' ${nextStatus}`, nextStatus === 'running' ? '▶️' : '⏹️');
          return {
            ...c,
            status: nextStatus,
            cpu: nextStatus === 'running' ? Number((0.5 + Math.random() * 2).toFixed(1)) : 0,
            uptime: nextStatus === 'running' ? 'Just started' : 'Exited (0) Just now'
          };
        }
        return c;
      })
    );
  };

  const removeContainer = (id: string) => {
    SoundManager.play('toast');
    setContainers(prev => prev.filter(c => c.id !== id));
    Toast.show('Container removed from storage', '🗑️');
  };

  const handleBuildDockerfile = () => {
    setIsBuilding(true);
    SoundManager.play('open');
    setBuildLogs([
      '[DOCKER BUILD] Step 1/9 : FROM node:20-alpine AS builder',
      '[DOCKER BUILD] ---> Pulling from library/node:20-alpine',
      '[DOCKER BUILD] Step 2/9 : WORKDIR /app',
      '[DOCKER BUILD] ---> Using cache 4f82a9bc',
      '[DOCKER BUILD] Step 3/9 : COPY package*.json ./'
    ]);

    setTimeout(() => {
      setBuildLogs(prev => [
        ...prev,
        '[DOCKER BUILD] Step 4/9 : RUN npm ci --only=production',
        '[DOCKER BUILD] ---> Running in 7a8b9c0d (added 142 packages in 1.4s)',
        '[DOCKER BUILD] Step 5/9 : COPY . .',
        '[DOCKER BUILD] Step 6/9 : RUN npm run build',
        '[DOCKER BUILD] ---> Vite production bundle built in dist/',
        '[DOCKER BUILD] Step 7/9 : FROM nginx:alpine AS runner',
        '[DOCKER BUILD] Step 8/9 : COPY --from=builder /app/dist /usr/share/nginx/html',
        '[DOCKER BUILD] Step 9/9 : EXPOSE 80',
        '[DOCKER BUILD] Successfully built image sha256:d82e71a (tagged app:latest)',
        '[DOCKER BUILD] Total image size: 24.8 MB (Optimized multi-stage)'
      ]);
      setIsBuilding(false);
      SoundManager.play('success');
      Toast.show('Docker image built and registered in local daemon!', '✓');

      // Add to images
      setImages(prev => [
        {
          id: `sha256:${Math.random().toString(36).substring(2, 6)}`,
          repository: 'app',
          tag: 'latest',
          size: '24.8 MB',
          created: 'Just now',
          layers: 4
        },
        ...prev
      ]);
    }, 1200);
  };

  const handlePullImage = () => {
    if (!pullImageName.trim()) return;
    setIsPulling(true);
    SoundManager.play('click');
    Toast.show(`Pulling OCI image '${pullImageName}' from Docker Hub...`, '📥');

    setTimeout(() => {
      setIsPulling(false);
      const newImg: DockerImage = {
        id: `sha256:${Math.random().toString(36).substring(2, 6)}`,
        repository: pullImageName.includes(':') ? pullImageName.split(':')[0] : pullImageName,
        tag: pullImageName.includes(':') ? pullImageName.split(':')[1] : 'latest',
        size: `${Math.floor(20 + Math.random() * 80)} MB`,
        created: 'Just now',
        layers: 5
      };
      setImages(prev => [newImg, ...prev]);
      setPullImageName('');
      SoundManager.play('success');
      Toast.show(`Pulled '${newImg.repository}:${newImg.tag}' successfully!`, '✓');
    }, 1000);
  };

  const handleExecSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!execInput.trim()) return;
    const input = execInput.trim();
    let output = '';

    if (input === 'ls' || input === 'ls -la') {
      output = 'total 64\ndrwxr-xr-x    1 root     root          4096 Sep 20 05:22 .\ndrwxr-xr-x    1 root     root          4096 Sep 20 05:22 ..\ndrwxr-xr-x    2 root     root          4096 Jan 26 00:00 bin\ndrwxr-xr-x    5 root     root           360 Sep 20 05:22 dev\ndrwxr-xr-x   14 root     root          4096 Sep 20 05:22 etc\ndrwxr-xr-x    2 root     root          4096 Jan 26 00:00 home\ndr-xr-xr-x  140 root     root             0 Sep 20 05:22 proc';
    } else if (input === 'date') {
      output = new Date().toUTCString();
    } else if (input === 'free -m' || input === 'free') {
      output = '              total        used        free      shared  buff/cache   available\nMem:            512          28         442           4          41         480\nSwap:             0           0           0';
    } else if (input === 'clear') {
      setExecHistory([]);
      setExecInput('');
      return;
    } else {
      output = `c7a8b1f2: executing: ${input}`;
    }

    setExecHistory(prev => [...prev, `/ # ${input}`, output]);
    setExecInput('');
  };

  const filteredContainers = containers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.image.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-gray-100 select-none font-sans overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-[#131622] border-b border-white/10 flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xs font-mono flex items-center gap-1.5">
              <span>Docker Engine & OCI Container Studio</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                Daemon v26.0 (containerd 1.7)
              </span>
            </h2>
            <p className="text-[10px] text-gray-400">Manage container lifecycles, build multi-stage images, inspect network bridges, and exec shell.</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('containers')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'containers' ? 'bg-blue-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> <span>Containers ({containers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'images' ? 'bg-blue-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" /> <span>Images ({images.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('dockerfile')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dockerfile' ? 'bg-blue-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" /> <span>Dockerfile Builder</span>
          </button>
          <button
            onClick={() => setActiveTab('exec')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'exec' ? 'bg-blue-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> <span>Container Exec</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {/* TAB 1: Containers */}
        {activeTab === 'containers' && (
          <div className="space-y-3 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter containers by name, image, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121520] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newContainer: Container = {
                      id: Math.random().toString(36).substring(2, 10),
                      name: `custom-svc-${Math.floor(Math.random() * 100)}`,
                      image: 'alpine:3.19',
                      status: 'running',
                      ports: '9000:9000',
                      cpu: 0.5,
                      memory: '12.0 MB / 512 MB',
                      uptime: 'Just started',
                      command: '/bin/sh'
                    };
                    setContainers(prev => [newContainer, ...prev]);
                    Toast.show(`Launched container '${newContainer.name}'`, '🚀');
                  }}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Run New Container</span>
                </button>
              </div>
            </div>

            {/* Container Cards */}
            <div className="space-y-2">
              {filteredContainers.map((c) => (
                <div key={c.id} className="p-3.5 bg-[#121520] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3 hover:border-blue-500/40 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      c.status === 'running' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-500 border border-white/10'
                    }`}>
                      <Box className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs truncate">{c.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono">({c.id})</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          c.status === 'running' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-gray-400'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 flex flex-wrap items-center gap-3">
                        <span className="text-blue-300">{c.image}</span>
                        <span>•</span>
                        <span>Ports: {c.ports}</span>
                        <span>•</span>
                        <span>{c.uptime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Resource Stats & Actions */}
                  <div className="flex items-center gap-4 shrink-0">
                    {c.status === 'running' && (
                      <div className="text-right text-[10px] text-gray-400 hidden sm:block">
                        <div>CPU: <span className="text-white font-bold">{c.cpu}%</span></div>
                        <div>RAM: <span className="text-white">{c.memory}</span></div>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleContainer(c.id)}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          c.status === 'running'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                        title={c.status === 'running' ? 'Stop Container' : 'Start Container'}
                      >
                        {c.status === 'running' ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedContainerId(c.id);
                          setActiveTab('exec');
                          Toast.show(`Connected terminal to container '${c.name}'`, '💻');
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer"
                        title="Exec Interactive Terminal"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => removeContainer(c.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                        title="Delete Container"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Images */}
        {activeTab === 'images' && (
          <div className="space-y-3 font-mono">
            {/* Pull Bar */}
            <div className="p-3.5 bg-[#121520] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex-1 max-w-md flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Pull image (e.g. python:3.12-alpine, debian:latest)..."
                  value={pullImageName}
                  onChange={(e) => setPullImageName(e.target.value)}
                  className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={handlePullImage}
                  disabled={isPulling}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPulling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                  <span>{isPulling ? 'Pulling...' : 'Pull Image'}</span>
                </button>
              </div>
            </div>

            {/* Images Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {images.map((img) => (
                <div key={img.id} className="p-3.5 bg-[#121520] border border-white/10 rounded-2xl flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{img.repository}:{img.tag}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                        {img.size}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">ID: {img.id} • {img.layers} OCI Layers</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Created {img.created}</div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => {
                        const newContainer: Container = {
                          id: Math.random().toString(36).substring(2, 10),
                          name: `${img.repository}-instance`,
                          image: `${img.repository}:${img.tag}`,
                          status: 'running',
                          ports: '8080:80',
                          cpu: 1.0,
                          memory: '16.0 MB / 512 MB',
                          uptime: 'Just started',
                          command: '/bin/sh'
                        };
                        setContainers(prev => [newContainer, ...prev]);
                        setActiveTab('containers');
                        Toast.show(`Spawned container from ${img.repository}:${img.tag}`, '🚀');
                      }}
                      className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition"
                    >
                      ▶ Launch Container
                    </button>

                    <button
                      onClick={() => {
                        setImages(prev => prev.filter(i => i.id !== img.id));
                        Toast.show(`Removed image ${img.repository}`, '🗑️');
                      }}
                      className="text-rose-400 hover:text-rose-300 text-[10px] cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Dockerfile Builder */}
        {activeTab === 'dockerfile' && (
          <div className="h-full flex flex-col gap-3 font-mono">
            <div className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-white text-xs">Multi-Stage OCI Container Image Builder</span>
              </div>
              <button
                onClick={handleBuildDockerfile}
                disabled={isBuilding}
                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow disabled:opacity-50"
              >
                {isBuilding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Flame className="w-3.5 h-3.5" />}
                <span>{isBuilding ? 'Building OCI Image...' : 'docker build -t app .'}</span>
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[260px]">
              <div className="flex flex-col bg-[#121520] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-3 py-1.5 bg-black/40 border-b border-white/10 text-gray-400 text-[11px] font-bold">
                  Dockerfile Editor
                </div>
                <textarea
                  value={dockerfileContent}
                  onChange={(e) => setDockerfileContent(e.target.value)}
                  className="flex-1 p-3 bg-transparent text-emerald-300 font-mono text-xs focus:outline-none resize-none select-text leading-relaxed"
                />
              </div>

              <div className="flex flex-col bg-[#0c0d14] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-3 py-1.5 bg-black/40 border-b border-white/10 text-gray-400 text-[11px] font-bold">
                  Build Daemon Output (/var/log/dockerd)
                </div>
                <div className="flex-1 p-3 overflow-y-auto space-y-1 text-[11px] text-gray-300">
                  {buildLogs.length === 0 ? (
                    <div className="text-gray-500">Click &quot;docker build&quot; to execute multi-stage compilation.</div>
                  ) : (
                    buildLogs.map((l, i) => (
                      <div key={i} className={l.includes('Successfully') ? 'text-emerald-400 font-bold' : 'text-gray-300'}>
                        {l}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Container Exec Terminal */}
        {activeTab === 'exec' && (
          <div className="h-full flex flex-col bg-[#0c0d14] border border-white/10 rounded-2xl overflow-hidden font-mono text-xs">
            <div className="px-3 py-2 bg-[#131622] border-b border-white/10 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-white font-bold">docker exec -it {selectedContainerId} /bin/sh</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span>TTY: /dev/pts/1</span>
                <span>•</span>
                <span className="text-emerald-400">Connected</span>
              </div>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-1 select-text">
              {execHistory.map((line, idx) => (
                <div key={idx} className={line.startsWith('/ #') ? 'text-cyan-300 font-bold' : 'text-gray-300 whitespace-pre-wrap'}>
                  {line}
                </div>
              ))}
            </div>

            <form onSubmit={handleExecSubmit} className="p-2.5 bg-black/60 border-t border-white/10 flex items-center gap-2">
              <span className="text-cyan-300 font-bold">/ #</span>
              <input
                type="text"
                value={execInput}
                onChange={(e) => setExecInput(e.target.value)}
                placeholder="Execute command inside container namespace (e.g. ls, date, free -m, top)..."
                className="flex-1 bg-transparent text-emerald-400 focus:outline-none font-mono text-xs"
                autoFocus
              />
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
