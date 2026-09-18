import React, { useState } from 'react';
import { Key, Plus, Trash2, ShieldCheck, Eye, EyeOff, PanelLeftClose, PanelLeft, Download, Upload, Shield, Terminal, FolderTree } from 'lucide-react';
import { Toast } from '../../kernel/Toast';

interface EnvVar {
  key: string;
  value: string;
  secret: boolean;
  category: 'system' | 'user' | 'secret' | 'gui';
}

export const EnvMgrApp: React.FC = () => {
  const [vars, setVars] = useState<EnvVar[]>([
    { key: 'PATH', value: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', secret: false, category: 'system' },
    { key: 'HOME', value: '/root', secret: false, category: 'user' },
    { key: 'USER', value: 'root', secret: false, category: 'user' },
    { key: 'SHELL', value: '/bin/bash', secret: false, category: 'user' },
    { key: 'TERM', value: 'xterm-256color', secret: false, category: 'system' },
    { key: 'NODE_ENV', value: 'production', secret: false, category: 'system' },
    { key: 'ALPINE_VERSION', value: '3.19.0', secret: false, category: 'system' },
    { key: 'DATABASE_URL', value: 'sqlite:///var/lib/sqlite/helix.db', secret: true, category: 'secret' },
    { key: 'API_SECRET_TOKEN', value: 'sk_live_994820184756201948', secret: true, category: 'secret' },
    { key: 'WAYLAND_DISPLAY', value: 'wayland-0', secret: false, category: 'gui' },
    { key: 'XDG_RUNTIME_DIR', value: '/tmp/helix-wayland', secret: false, category: 'gui' },
  ]);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<'system' | 'user' | 'secret' | 'gui'>('user');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSidebar, setShowSidebar] = useState(true);

  const handleAdd = () => {
    if (newKey && newValue) {
      const isSecret = newCategory === 'secret' || newValue.length > 15;
      setVars(prev => [...prev, {
        key: newKey.toUpperCase(),
        value: newValue,
        secret: isSecret,
        category: newCategory
      }]);
      setNewKey('');
      setNewValue('');
      Toast.show(`Exported ${newKey.toUpperCase()} to environment`, '✓');
    }
  };

  const handleDelete = (key: string) => {
    setVars(prev => prev.filter(v => v.key !== key));
    Toast.show(`Unset variable ${key}`, '🗑️');
  };

  const handleExportEnv = () => {
    const content = vars.map(v => `${v.key}="${v.value}"`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('Exported .env configuration file', '⬇️');
  };

  const categories = [
    { id: 'all', label: 'All Environment Vars', count: vars.length, icon: Key },
    { id: 'system', label: 'System & Core Paths', count: vars.filter(v => v.category === 'system').length, icon: Terminal },
    { id: 'user', label: 'User & Shell Profile', count: vars.filter(v => v.category === 'user').length, icon: FolderTree },
    { id: 'secret', label: 'Secrets & API Keys', count: vars.filter(v => v.category === 'secret').length, icon: Shield },
    { id: 'gui', label: 'Wayland & GUI Runtime', count: vars.filter(v => v.category === 'gui').length, icon: ShieldCheck },
  ];

  const filtered = vars.filter(v => {
    if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-[#12141c] text-[#edf1f7] text-xs select-none overflow-hidden font-sans">
      {/* Header */}
      <div className="px-3 py-2 bg-[#181b26] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showSidebar ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
            }`}
            title={showSidebar ? 'Collapse Categories' : 'Expand Categories'}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <Key className="w-4 h-4 text-rose-400" />
          <span className="font-semibold text-white">Environment Variables & Virtual Secrets</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400 hidden sm:inline">
            /etc/environment
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportEnv}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg flex items-center gap-1.5 font-medium transition cursor-pointer border border-white/10"
            title="Export .env File"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>Export .env</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Categories Sidebar */}
        {showSidebar && (
          <div className="w-56 bg-[#0f111a] border-r border-white/10 flex flex-col p-2 space-y-1 shrink-0 overflow-y-auto font-mono text-[11px]">
            <div className="text-[10px] uppercase text-gray-500 font-bold px-2 py-1">Variable Scopes</div>
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cat.label}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/40 text-gray-400 font-mono">
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
          {/* Quick chips when sidebar is collapsed */}
          {!showSidebar && (
            <div className="px-3 py-1.5 bg-[#141724] border-b border-white/10 flex items-center gap-1.5 overflow-x-auto shrink-0 font-mono text-[11px]">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>
          )}

          {/* Add Form */}
          <div className="p-3 bg-black/40 border-b border-white/10 flex flex-wrap gap-2 shrink-0">
            <input
              type="text"
              placeholder="VARIABLE_NAME"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-44 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-rose-400"
            />
            <input
              type="text"
              placeholder="value or secret token..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="flex-1 min-w-[150px] bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-rose-400"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="bg-black/60 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-rose-400"
            >
              <option value="user">User</option>
              <option value="system">System</option>
              <option value="secret">Secret</option>
              <option value="gui">GUI</option>
            </select>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium flex items-center gap-1.5 transition cursor-pointer border border-rose-500/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.map(v => {
              const isRevealed = showSecrets[v.key];
              return (
                <div key={v.key} className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-4 font-mono hover:bg-white/[0.07] transition">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="font-bold text-rose-300">{v.key}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] uppercase bg-black/40 text-gray-400 border border-white/5">
                      {v.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 max-w-[60%]">
                    <span className="text-gray-300 text-[11px] truncate select-all">
                      {v.secret && !isRevealed ? '••••••••••••••••••••' : v.value}
                    </span>
                    {v.secret && (
                      <button
                        onClick={() => setShowSecrets(prev => ({ ...prev, [v.key]: !prev[v.key] }))}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer shrink-0"
                        title={isRevealed ? 'Mask secret' : 'Reveal secret'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(v.key)}
                      className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition cursor-pointer shrink-0"
                      title="Delete variable"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
