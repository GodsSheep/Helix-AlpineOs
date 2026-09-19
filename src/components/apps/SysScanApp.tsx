import React, { useState, useEffect } from 'react';
import { Kernel } from '../../kernel';
import { 
  Search, 
  ShieldCheck, 
  Cpu, 
  Network, 
  Database, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Briefcase,
  Layers,
  ChevronRight,
  RefreshCw,
  Plus,
  Activity
} from 'lucide-react';
import { SoundManager } from '../../kernel/SoundManager';
import { Toast } from '../../kernel/Toast';

interface ScanItem {
  id: string;
  name: string;
  type: 'endpoint' | 'file' | 'hardware' | 'app';
  status: 'online' | 'missing' | 'warning';
  details: string;
  category: string;
}

export const SysScanApp: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [foundItems, setFoundItems] = useState<ScanItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const startScan = () => {
    setIsScanning(true);
    setProgress(0);
    setFoundItems([]);
    SoundManager.play('click');

    const steps = [
      { p: 10, msg: 'Initializing Kernel Scanner...' },
      { p: 25, msg: 'Probing Network Endpoints...' },
      { p: 45, msg: 'Auditing VFS Integrity...' },
      { p: 70, msg: 'Mapping Hardware Nodes...' },
      { p: 90, msg: 'Checking App Registry...' },
      { p: 100, msg: 'Scan Complete.' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        
        // Mock finding items based on progress
        if (steps[currentStep].p === 25) {
          setFoundItems(prev => [
            ...prev,
            { id: 'ep1', name: 'api.helix.os', type: 'endpoint', status: 'online', details: 'REST/JSON Endpoint responsive on :443', category: 'Network' },
            { id: 'ep2', name: 'auth.v6.internal', type: 'endpoint', status: 'warning', details: 'High latency detected (450ms)', category: 'Network' },
            { id: 'ep3', name: 'metrics.helix.local', type: 'endpoint', status: 'missing', details: 'Node unreachable or firewalled', category: 'Network' },
          ]);
        }
        if (steps[currentStep].p === 45) {
           setFoundItems(prev => [
            ...prev,
            { id: 'f1', name: '/etc/helix.conf', type: 'file', status: 'online', details: 'Configuration valid', category: 'FileSystem' },
            { id: 'f2', name: '/mnt/helix/backup.tar.gz', type: 'file', status: 'warning', details: 'Checksum mismatch', category: 'FileSystem' },
          ]);
        }
        if (steps[currentStep].p === 70) {
           setFoundItems(prev => [
            ...prev,
            { id: 'h1', name: 'WASM JIT Engine', type: 'hardware', status: 'online', details: 'Optimal performance (Tier 4)', category: 'Hardware' },
            { id: 'h2', name: 'VirtIO 9P Drive', type: 'hardware', status: 'online', details: 'Mounted @ /mnt/helix', category: 'Hardware' },
          ]);
        }
        if (steps[currentStep].p === 90) {
           setFoundItems(prev => [
            ...prev,
            { id: 'a1', name: 'Helix Unified Studio', type: 'app', status: 'online', details: 'Latest version installed', category: 'Registry' },
            { id: 'a2', name: 'Deep Intelligence SDK', type: 'app', status: 'missing', details: 'Framework components missing', category: 'Registry' },
          ]);
        }

        currentStep++;
      } else {
        clearInterval(interval);
        setIsScanning(false);
        SoundManager.play('success');
      }
    }, 400);
  };

  const categories = ['All', 'Network', 'FileSystem', 'Hardware', 'Registry'];
  const filteredItems = selectedCategory === 'All' ? foundItems : foundItems.filter(i => i.category === selectedCategory);

  const handleAddToBackpack = (item: ScanItem) => {
    Kernel.backpack.addItem('snippet', `Scan Result: ${item.name}`, JSON.stringify(item, null, 2));
    Toast.show(`Added ${item.name} to Backpack`, '🎒');
    SoundManager.play('click');
  };

  const handleAddAll = () => {
    filteredItems.forEach(item => {
      Kernel.backpack.addItem('snippet', `Scan Result: ${item.name}`, JSON.stringify(item, null, 2));
    });
    Toast.show(`Added ${filteredItems.length} items to Backpack`, '🎒');
    SoundManager.play('success');
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0c12] text-gray-200 overflow-hidden font-mono select-none">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-indigo-600/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tighter uppercase text-white">System Intelligence</h2>
              <p className="text-[10px] text-gray-400">Scan, discover & carry system components</p>
            </div>
          </div>
          <button
            onClick={startScan}
            disabled={isScanning}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Deep Scanning...' : 'Start Intelligence Scan'}</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-gray-500">
           <span>{isScanning ? 'Scanning system layers...' : 'Ready for scan'}</span>
           <span>{progress}%</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Filters */}
        <div className="w-40 border-r border-white/5 p-2 space-y-1 shrink-0">
          <p className="px-2 py-1 text-[9px] font-bold text-gray-500 uppercase">Layer Filters</p>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full px-3 py-1.5 rounded-lg text-[10px] text-left transition flex items-center justify-between ${
                selectedCategory === cat 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              <span>{cat}</span>
              {selectedCategory === cat && <ChevronRight className="w-3 h-3" />}
            </button>
          ))}
        </div>

        {/* List Area */}
        <div className="flex-1 flex flex-col overflow-hidden p-2">
          {foundItems.length > 0 && (
            <div className="flex items-center justify-between px-2 py-1.5 mb-2">
               <span className="text-[10px] text-gray-500 uppercase font-bold">Discoveries ({filteredItems.length})</span>
               <button 
                onClick={handleAddAll}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition"
               >
                 <Plus className="w-3 h-3" />
                 <span>Add All to Backpack</span>
               </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {foundItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-40 space-y-4">
                <Layers className="w-16 h-16 stroke-1" />
                <p className="text-xs italic">Run scan to identify system items</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <div 
                  key={item.id}
                  className="p-3 bg-[#131620] border border-white/5 rounded-xl hover:border-indigo-500/30 transition group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${
                        item.status === 'online' ? 'text-emerald-400' :
                        item.status === 'warning' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {item.type === 'endpoint' && <Network className="w-4 h-4" />}
                        {item.type === 'file' && <Database className="w-4 h-4" />}
                        {item.type === 'hardware' && <Cpu className="w-4 h-4" />}
                        {item.type === 'app' && <Zap className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{item.name}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] uppercase font-bold ${
                             item.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' :
                             item.status === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">{item.details}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAddToBackpack(item)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-gray-500 hover:text-indigo-300 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Add to Backpack"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {foundItems.filter(i => i.status === 'online').length} Optimal
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            {foundItems.filter(i => i.status === 'warning').length} Alerts
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-rose-500" />
            {foundItems.filter(i => i.status === 'missing').length} Critical
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-indigo-400" />
          <span>Intelligent System Audit Engine</span>
        </div>
      </div>
    </div>
  );
};
