import React, { useState, useEffect } from 'react';
import { Kernel } from '../../kernel';
import { BackpackItem } from '../../kernel/Backpack';
import { 
  Briefcase, 
  Trash2, 
  FileText, 
  Code, 
  Link as LinkIcon, 
  Terminal, 
  Search, 
  Plus, 
  Copy,
  Clock,
  ExternalLink
} from 'lucide-react';
import { SoundManager } from '../../kernel/SoundManager';

export const BackpackApp: React.FC = () => {
  const [items, setItems] = useState<BackpackItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'file' | 'snippet' | 'url' | 'command'>('all');

  useEffect(() => {
    return Kernel.backpack.subscribe(setItems);
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(search.toLowerCase()) || 
                         item.data.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'file': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'snippet': return <Code className="w-4 h-4 text-purple-400" />;
      case 'url': return <LinkIcon className="w-4 h-4 text-cyan-400" />;
      case 'command': return <Terminal className="w-4 h-4 text-emerald-400" />;
      default: return <Briefcase className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleCopy = (data: string) => {
    navigator.clipboard.writeText(data);
    SoundManager.play('click');
    // Toast notification could be added here
  };

  const handleRemove = (id: string) => {
    Kernel.backpack.removeItem(id);
    SoundManager.play('close');
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] text-gray-200 overflow-hidden">
      {/* Header / Search */}
      <div className="p-4 border-b border-white/5 space-y-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-orange-400" />
          <h2 className="text-sm font-bold tracking-tight uppercase text-white">System Backpack</h2>
          <div className="ml-auto flex items-center gap-1.5">
             <button 
              onClick={() => {
                const label = prompt('Enter item label:');
                const data = prompt('Enter item content:');
                if (label && data) Kernel.backpack.addItem('snippet', label, data);
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition cursor-pointer"
             >
               <Plus className="w-4 h-4" />
             </button>
             <button 
              onClick={() => {
                if (confirm('Clear entire backpack?')) Kernel.backpack.clear();
              }}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
             >
               <Trash2 className="w-4 h-4" />
             </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text"
            placeholder="Search your backpack..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(['all', 'file', 'snippet', 'url', 'command'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-full text-[10px] font-medium transition cursor-pointer whitespace-nowrap capitalize ${
                activeTab === tab 
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                : 'bg-white/5 text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-2 opacity-50">
            <Briefcase className="w-12 h-12" />
            <p className="text-xs italic">Backpack is empty</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div 
              key={item.id}
              className="group p-3 rounded-xl bg-[#121620] border border-white/5 hover:border-white/10 hover:bg-[#161b28] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getItemIcon(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-white truncate">{item.label}</span>
                    <span className="text-[9px] text-gray-500 flex items-center gap-1 shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-2 break-all bg-black/20 p-1.5 rounded-lg border border-white/5 font-mono">
                    {item.data}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleCopy(item.data)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition flex items-center gap-1.5 text-[10px]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
                {item.type === 'url' && (
                  <button 
                    onClick={() => window.open(item.data, '_blank')}
                    className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button 
                  onClick={() => handleRemove(item.id)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500">
        <span className="flex items-center gap-1">
          <Briefcase className="w-3 h-3" />
          {items.length} items stored
        </span>
        <span className="italic">Persistent storage active</span>
      </div>
    </div>
  );
};
