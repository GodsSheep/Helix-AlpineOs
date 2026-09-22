import React, { useState } from 'react';
import { Terminal, Github, Server, Package } from 'lucide-react';
import { Kernel } from '../../kernel';
import { Toast } from '../../kernel/Toast';

export const DeveloperWorkspaceApp: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClone = async () => {
    if (!repoUrl) return;
    setLoading(true);
    try {
      await Kernel.vm.executeCommand(`git clone ${repoUrl}`);
      Toast.show(`Cloned ${repoUrl}`, '📂');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full p-4 bg-[#0d121c] text-white">
      <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Server className="w-5 h-5" /> Helix Developer Workspace
      </h1>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 bg-black rounded border border-white/10"
            placeholder="https://github.com/user/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
          <button onClick={handleClone} disabled={loading} className="px-4 py-2 bg-blue-600 rounded">
            {loading ? 'Cloning...' : <Github />}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => Kernel.wm.launch('term')} className="p-4 bg-white/5 rounded flex items-center gap-2"><Terminal /> Open Terminal</button>
          <button onClick={() => Kernel.wm.launch('node-webcontainer')} className="p-4 bg-white/5 rounded flex items-center gap-2"><Package /> Node Micro-OS</button>
        </div>
      </div>
    </div>
  );
};
