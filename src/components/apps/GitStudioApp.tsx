import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  FolderGit2,
  FileCode,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Code2,
  Sparkles,
  ShieldCheck,
  Tag,
  Archive
} from 'lucide-react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { Kernel } from '../../kernel';

interface Commit {
  hash: string;
  author: string;
  message: string;
  date: string;
  branch: string;
  tags?: string[];
}

interface StagedFile {
  path: string;
  status: 'modified' | 'added' | 'deleted';
  diff: string;
  staged: boolean;
}

export const GitStudioApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'graph' | 'changes' | 'branches' | 'stash'>('graph');
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [currentBranch, setCurrentBranch] = useState('main');
  const [newBranchName, setNewBranchName] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Commits History (DAG)
  const [commits, setCommits] = useState<Commit[]>([
    {
      hash: '7f8a1bc',
      author: 'root <alpine@helix.os>',
      message: 'feat(kernel): stabilize fault-tolerant WindowErrorBoundary and SelfHealingEngine',
      date: '10 mins ago',
      branch: 'main',
      tags: ['v2.4.0-release']
    },
    {
      hash: '3d9e2a4',
      author: 'root <alpine@helix.os>',
      message: 'feat(vfs): optimize 9P asynchronous virtio file transfer thread',
      date: '1 hour ago',
      branch: 'main'
    },
    {
      hash: 'a1b2c3d',
      author: 'root <alpine@helix.os>',
      message: 'fix(wine): add DXVK 2.3 Direct3D to Vulkan translation support',
      date: '3 hours ago',
      branch: 'main'
    },
    {
      hash: '9e8d7c6',
      author: 'developer <dev@helix.os>',
      message: 'feat(games): implement 60fps arcade engine with SoundManager synthesized audio',
      date: '5 hours ago',
      branch: 'feature/arcade'
    },
    {
      hash: '5b4a3c2',
      author: 'root <alpine@helix.os>',
      message: 'chore(init): initial commit of Helix OS unified distribution architecture',
      date: '1 day ago',
      branch: 'main',
      tags: ['v2.0.0']
    }
  ]);

  // Working directory changes
  const [files, setFiles] = useState<StagedFile[]>([
    {
      path: 'src/components/apps/CrossPlatformToolsApp.tsx',
      status: 'modified',
      diff: '@@ -35,6 +35,12 @@\n+ import { PackageCheck, Winetricks } from "lucide-react";\n+ const [winetricksInstalled, setWinetricksInstalled] = useState({});\n- const [wineLogs, setWineLogs] = useState([]);\n+ const [wineLogs, setWineLogs] = useState(["Wine 9.0 ready"]);',
      staged: true
    },
    {
      path: 'src/kernel/Errors.ts',
      status: 'modified',
      diff: '@@ -12,4 +12,8 @@\n+ export class KernelError extends Error {\n+   timestamp: number = Date.now();\n+ }',
      staged: true
    },
    {
      path: 'src/components/apps/DockerApp.tsx',
      status: 'added',
      diff: '@@ -0,0 +1,120 @@\n+ import React from "react";\n+ export const DockerApp = () => { ... }',
      staged: false
    }
  ]);

  // Branches list
  const [branches, setBranches] = useState<string[]>(['main', 'develop', 'feature/arcade', 'release/v2.4']);

  // Stash list
  const [stashes, setStashes] = useState<{ id: string; message: string; date: string }[]>([
    { id: 'stash@{0}', message: 'WIP on compiler: temporary IR dump', date: '2 hours ago' }
  ]);

  const toggleStage = (path: string) => {
    SoundManager.play('click');
    setFiles(prev =>
      prev.map(f => (f.path === path ? { ...f, staged: !f.staged } : f))
    );
  };

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;

    const stagedFiles = files.filter(f => f.staged);
    if (stagedFiles.length === 0) {
      Toast.show('No changes staged for commit!', '⚠️');
      return;
    }

    const newHash = Math.random().toString(36).substring(2, 9);
    const newCommit: Commit = {
      hash: newHash,
      author: 'root <alpine@helix.os>',
      message: commitMessage.trim(),
      date: 'Just now',
      branch: currentBranch
    };

    setCommits(prev => [newCommit, ...prev]);
    setFiles(prev => prev.filter(f => !f.staged));
    setCommitMessage('');
    SoundManager.play('success');
    Toast.show(`Committed [${newHash}] on ${currentBranch}`, '✓');
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    const branchName = newBranchName.trim().replace(/\s+/g, '-');
    if (branches.includes(branchName)) {
      Toast.show('Branch already exists', '⚠️');
      return;
    }
    setBranches(prev => [...prev, branchName]);
    setCurrentBranch(branchName);
    setNewBranchName('');
    SoundManager.play('success');
    Toast.show(`Created and checked out branch '${branchName}'`, '🌿');
  };

  const handleCheckoutBranch = (branch: string) => {
    SoundManager.play('click');
    setCurrentBranch(branch);
    Toast.show(`Switched to branch '${branch}'`, '🌿');
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-gray-100 select-none font-sans overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-[#131622] border-b border-white/10 flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xs font-mono flex items-center gap-1.5">
              <span>Git Version Control Studio</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-orange-500/20 text-orange-300 border border-orange-500/30 font-mono">
                git v2.43.0
              </span>
            </h2>
            <p className="text-[10px] text-gray-400">Visual DAG commit tree, interactive staging, branching, diff viewer, and stash manager.</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'graph' ? 'bg-orange-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" /> <span>DAG History ({commits.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('changes')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'changes' ? 'bg-orange-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" /> <span>Changes ({files.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('branches')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'branches' ? 'bg-orange-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" /> <span>Branches ({branches.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('stash')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stash' ? 'bg-orange-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Archive className="w-3.5 h-3.5" /> <span>Stash ({stashes.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {/* TAB 1: DAG Commit Graph */}
        {activeTab === 'graph' && (
          <div className="space-y-3 font-mono">
            {/* Branch Indicator Bar */}
            <div className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-orange-400" />
                <span className="text-gray-400 text-xs">Current HEAD:</span>
                <span className="font-bold text-white text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {currentBranch}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    SoundManager.play('click');
                    Toast.show('git fetch origin: All branches up to date', '✓');
                  }}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 text-[11px] font-bold cursor-pointer transition flex items-center gap-1"
                >
                  <ArrowDownLeft className="w-3 h-3 text-blue-400" /> <span>Fetch</span>
                </button>
                <button
                  onClick={() => {
                    SoundManager.play('success');
                    Toast.show(`git push origin ${currentBranch}: Everything up to date`, '🚀');
                  }}
                  className="px-2.5 py-1 bg-orange-500 hover:bg-orange-400 rounded-lg text-white text-[11px] font-bold cursor-pointer transition flex items-center gap-1 shadow"
                >
                  <ArrowUpRight className="w-3 h-3" /> <span>Push</span>
                </button>
              </div>
            </div>

            {/* Commit Log DAG List */}
            <div className="space-y-2">
              {commits.map((c, i) => (
                <div
                  key={c.hash}
                  onClick={() => setSelectedCommit(c)}
                  className={`p-3 bg-[#121520] border rounded-2xl flex flex-wrap items-center justify-between gap-3 cursor-pointer transition hover:border-orange-500/40 ${
                    selectedCommit?.hash === c.hash ? 'border-orange-500 bg-orange-500/5' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-orange-400 ring-4 ring-orange-500/20" />
                      {i < commits.length - 1 && <div className="w-0.5 h-6 bg-white/10 my-0.5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs truncate">{c.message}</span>
                        {c.tags && c.tags.map(t => (
                          <span key={t} className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 font-mono">
                            <Tag className="w-2.5 h-2.5" /> {t}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-3">
                        <span className="text-orange-300 font-bold">{c.hash}</span>
                        <span>•</span>
                        <span>{c.author}</span>
                        <span>•</span>
                        <span>{c.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10 font-mono">
                      {c.branch}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Working Directory Staging & Commit Builder */}
        {activeTab === 'changes' && (
          <div className="h-full grid grid-cols-1 md:grid-cols-12 gap-3 font-mono">
            {/* Left: Files Staging */}
            <div className="md:col-span-5 p-3.5 bg-[#121520] border border-white/10 rounded-2xl flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <span className="font-bold text-white text-xs">Changed Files ({files.length})</span>
                  <button
                    onClick={() => {
                      setFiles(prev => prev.map(f => ({ ...f, staged: true })));
                      Toast.show('Staged all changes', '✓');
                    }}
                    className="text-orange-400 hover:text-orange-300 text-[10px]"
                  >
                    Stage All
                  </button>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {files.map((f) => (
                    <div
                      key={f.path}
                      onClick={() => toggleStage(f.path)}
                      className="p-2 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between gap-2 hover:border-white/20 transition cursor-pointer"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={f.staged}
                          onChange={() => {}}
                          className="accent-orange-500 rounded cursor-pointer"
                        />
                        <span className="text-white text-[11px] truncate">{f.path}</span>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        f.status === 'added' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commit Input Box */}
              <form onSubmit={handleCommit} className="space-y-2 pt-2 border-t border-white/10">
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Commit message (e.g. feat(kernel): add feature)..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-2 text-white font-mono text-xs focus:outline-none focus:border-orange-400 h-20 resize-none"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow flex items-center justify-center gap-1.5"
                >
                  <GitCommit className="w-3.5 h-3.5" /> <span>Commit to {currentBranch}</span>
                </button>
              </form>
            </div>

            {/* Right: Diff Viewer */}
            <div className="md:col-span-7 bg-[#0c0d14] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
              <div className="px-3 py-2 bg-[#131622] border-b border-white/10 flex items-center justify-between text-[11px]">
                <span className="font-bold text-white">Unified Diff View</span>
                <span className="text-gray-400">git diff --cached</span>
              </div>
              <div className="flex-1 p-3 overflow-y-auto space-y-1 font-mono text-[11px] select-text leading-relaxed">
                {files.filter(f => f.staged).map((f) => (
                  <div key={f.path} className="space-y-1 pb-3">
                    <div className="text-cyan-300 font-bold">diff --git a/{f.path} b/{f.path}</div>
                    <div className="text-gray-500">--- a/{f.path}</div>
                    <div className="text-gray-500">+++ b/{f.path}</div>
                    {f.diff.split('\n').map((line, idx) => (
                      <div
                        key={idx}
                        className={
                          line.startsWith('+') ? 'text-emerald-300 bg-emerald-500/10 px-1 rounded' :
                          line.startsWith('-') ? 'text-rose-300 bg-rose-500/10 px-1 rounded' :
                          line.startsWith('@@') ? 'text-indigo-400 font-bold' : 'text-gray-300'
                        }
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Branches */}
        {activeTab === 'branches' && (
          <div className="space-y-3 font-mono">
            {/* Create Branch Bar */}
            <form onSubmit={handleCreateBranch} className="p-3.5 bg-[#121520] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex-1 max-w-md flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New branch name (e.g. feature/new-ui)..."
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-orange-400"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Create Branch</span>
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {branches.map((b) => (
                <div key={b} className="p-3.5 bg-[#121520] border border-white/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className={`w-4 h-4 ${currentBranch === b ? 'text-orange-400' : 'text-gray-500'}`} />
                    <span className={`font-bold text-xs ${currentBranch === b ? 'text-orange-300' : 'text-white'}`}>{b}</span>
                    {currentBranch === b && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-orange-500/20 text-orange-300">
                        HEAD
                      </span>
                    )}
                  </div>

                  {currentBranch !== b && (
                    <button
                      onClick={() => handleCheckoutBranch(b)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition"
                    >
                      Checkout
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Stash */}
        {activeTab === 'stash' && (
          <div className="space-y-3 font-mono">
            <div className="p-3.5 bg-[#121520] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-orange-400" /> <span>Git Stash Storage Stack</span>
                </h3>
                <p className="text-gray-400 text-[11px] mt-0.5">Temporarily shelves changes to keep working directory clean.</p>
              </div>
              <button
                onClick={() => {
                  SoundManager.play('click');
                  const newStash = {
                    id: `stash@{${stashes.length}}`,
                    message: 'WIP on working tree changes',
                    date: 'Just now'
                  };
                  setStashes(prev => [newStash, ...prev]);
                  Toast.show('Saved working directory to stash', '📦');
                }}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition cursor-pointer text-xs"
              >
                + git stash push
              </button>
            </div>

            <div className="space-y-2">
              {stashes.map((s) => (
                <div key={s.id} className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-orange-300 text-xs">{s.id}: </span>
                    <span className="text-white text-xs">{s.message}</span>
                    <div className="text-gray-500 text-[10px] mt-0.5">{s.date}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        SoundManager.play('success');
                        setStashes(prev => prev.filter(x => x.id !== s.id));
                        Toast.show(`Applied and popped ${s.id}`, '✓');
                      }}
                      className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Apply & Pop
                    </button>
                    <button
                      onClick={() => {
                        setStashes(prev => prev.filter(x => x.id !== s.id));
                        Toast.show(`Dropped ${s.id}`, '🗑️');
                      }}
                      className="text-rose-400 hover:text-rose-300 text-[10px] cursor-pointer"
                    >
                      Drop
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
