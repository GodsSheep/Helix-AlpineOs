import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Kernel } from '../../kernel';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { 
  Clock, 
  Play, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  Terminal, 
  PanelLeftClose, 
  PanelLeft,
  FileCheck,
  HardDrive,
  Sliders,
  AlertCircle
} from 'lucide-react';

interface CronJob {
  id: string;
  minute: string;
  hour: string;
  dom: string;
  month: string;
  dow: string;
  command: string;
  comment?: string;
  enabled: boolean;
  lastRun?: string;
  lastExitCode?: number;
}

const DEFAULT_CRON_JOBS: CronJob[] = [
  {
    id: '1',
    minute: '0',
    hour: '*',
    dom: '*',
    month: '*',
    dow: '*',
    command: '/usr/sbin/logrotate /etc/logrotate.conf',
    comment: 'Hourly system log rotation',
    enabled: true,
    lastRun: '12 minutes ago',
    lastExitCode: 0,
  },
  {
    id: '2',
    minute: '*/15',
    hour: '*',
    dom: '*',
    month: '*',
    dow: '*',
    command: 'sync; echo 3 > /proc/sys/vm/drop_caches',
    comment: 'Flush kernel memory buffers every 15m',
    enabled: true,
    lastRun: '4 minutes ago',
    lastExitCode: 0,
  },
  {
    id: '3',
    minute: '0',
    hour: '3',
    dom: '*',
    month: '*',
    dow: '0',
    command: 'apk update && apk upgrade --available',
    comment: 'Weekly automated Alpine security update check',
    enabled: false,
  },
  {
    id: '4',
    minute: '*/5',
    hour: '*',
    dom: '*',
    month: '*',
    dow: '*',
    command: 'uptime >> /var/log/uptime.log',
    comment: 'System load average logging daemon',
    enabled: true,
    lastRun: '2 minutes ago',
    lastExitCode: 0,
  },
];

const VFS_CRON_PATHS = [
  '/etc/crontabs/root',
  '/etc/crontab',
  '/var/spool/cron/crontabs/helix',
];

/**
 * Parses raw crontab file contents into structured CronJob objects
 */
function parseCrontabText(raw: string): CronJob[] {
  const lines = raw.split('\n');
  const parsedJobs: CronJob[] = [];
  let pendingComment = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      pendingComment = '';
      continue;
    }

    // Check if whole line is comment or header
    if (line.startsWith('#')) {
      // Check if it's a commented-out cron expression
      const stripped = line.replace(/^#\s*/, '').trim();
      const parts = stripped.split(/\s+/);
      if (parts.length >= 6 && isCronExpression(parts.slice(0, 5))) {
        parsedJobs.push({
          id: `cron-${Date.now()}-${parsedJobs.length}-${Math.random().toString(36).slice(2, 6)}`,
          minute: parts[0],
          hour: parts[1],
          dom: parts[2],
          month: parts[3],
          dow: parts[4],
          command: parts.slice(5).join(' '),
          comment: pendingComment || 'Disabled Scheduled Task',
          enabled: false,
        });
        pendingComment = '';
        continue;
      }

      // It's a standard user description comment
      if (!line.includes('Alpine Linux') && !line.includes('Generated')) {
        pendingComment = stripped;
      }
      continue;
    }

    // Standard active cron line
    const parts = line.split(/\s+/);
    if (parts.length >= 6) {
      parsedJobs.push({
        id: `cron-${Date.now()}-${parsedJobs.length}-${Math.random().toString(36).slice(2, 6)}`,
        minute: parts[0],
        hour: parts[1],
        dom: parts[2],
        month: parts[3],
        dow: parts[4],
        command: parts.slice(5).join(' '),
        comment: pendingComment || 'Scheduled Task',
        enabled: true,
      });
      pendingComment = '';
    }
  }

  return parsedJobs;
}

function isCronExpression(parts: string[]): boolean {
  if (parts.length !== 5) return false;
  // Basic validation that each part is a valid cron field pattern
  const pattern = /^(\*|[0-9,\-\/]+|\*\/\d+)$/;
  return parts.every((p) => pattern.test(p));
}

function serializeJobsToCrontab(jobsList: CronJob[]): string {
  const lines = jobsList.map((j) => {
    const prefix = j.enabled ? '' : '# ';
    const commentLine = j.comment ? `# ${j.comment}\n` : '';
    return `${commentLine}${prefix}${j.minute} ${j.hour} ${j.dom} ${j.month} ${j.dow} ${j.command}`;
  });
  return `# /etc/crontabs/root - Alpine Linux Helix OS\n# Automatically synchronized with VFS\n\n` + lines.join('\n\n') + '\n';
}

export const CronManagerApp: React.FC = () => {
  const [jobs, setJobs] = useState<CronJob[]>(() => {
    try {
      const saved = localStorage.getItem('helix_crontab_jobs');
      return saved ? JSON.parse(saved) : DEFAULT_CRON_JOBS;
    } catch {
      return DEFAULT_CRON_JOBS;
    }
  });

  const [crondRunning, setCrondRunning] = useState(true);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [editMinute, setEditMinute] = useState('*');
  const [editHour, setEditHour] = useState('*');
  const [editDom, setEditDom] = useState('*');
  const [editMonth, setEditMonth] = useState('*');
  const [editDow, setEditDow] = useState('*');
  const [editCommand, setEditCommand] = useState('');
  const [editComment, setEditComment] = useState('');
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'raw'>('visual');
  const [rawText, setRawText] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [vfsSyncTime, setVfsSyncTime] = useState<string>('Just now');
  const [isVfsLoading, setIsVfsLoading] = useState(false);

  const isInitialMount = useRef(true);

  // Sync state to VFS on changes
  const persistJobsToVFS = useCallback(async (currentJobs: CronJob[]) => {
    try {
      const content = serializeJobsToCrontab(currentJobs);
      for (const p of VFS_CRON_PATHS) {
        await Kernel.vfs.write(p, content);
      }
      try {
        localStorage.setItem('helix_crontab_jobs', JSON.stringify(currentJobs));
      } catch {}
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setVfsSyncTime(time);
    } catch (err) {
      console.warn('VFS Cron sync error:', err);
    }
  }, []);

  // Load from VFS on initial mount
  useEffect(() => {
    const loadFromVFS = async () => {
      setIsVfsLoading(true);
      try {
        const vfsContent = await Kernel.vfs.read('/etc/crontabs/root');
        if (vfsContent && vfsContent.trim().length > 0) {
          const parsed = parseCrontabText(vfsContent);
          if (parsed.length > 0) {
            setJobs(parsed);
            if (!selectedJob && parsed.length > 0) {
              handleSelectJob(parsed[0]);
            }
          }
        } else {
          // If file didn't exist in VFS, write defaults immediately to VFS
          await persistJobsToVFS(jobs);
        }
      } catch (err) {
        console.warn('Failed to load crontab from VFS:', err);
      } finally {
        setIsVfsLoading(false);
      }
    };

    loadFromVFS();
  }, []);

  // Auto-persist to VFS after any state change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    persistJobsToVFS(jobs);
  }, [jobs, persistJobsToVFS]);

  const handleSelectJob = (job: CronJob) => {
    setSelectedJob(job);
    setEditMinute(job.minute);
    setEditHour(job.hour);
    setEditDom(job.dom);
    setEditMonth(job.month);
    setEditDow(job.dow);
    setEditCommand(job.command);
    setEditComment(job.comment || '');
  };

  const handleCreateNew = () => {
    const newJob: CronJob = {
      id: Date.now().toString(),
      minute: '*/10',
      hour: '*',
      dom: '*',
      month: '*',
      dow: '*',
      command: 'echo "Task checkpoint" >> /var/log/cron.log',
      comment: 'Custom scheduled task',
      enabled: true,
    };
    const updated = [...jobs, newJob];
    setJobs(updated);
    handleSelectJob(newJob);
    SoundManager.play('click');
    Toast.show('Created new cron job (saved to VFS)', '⏱️');
  };

  const handleSaveSelected = () => {
    if (!selectedJob) return;
    const updated = jobs.map((j) => {
      if (j.id === selectedJob.id) {
        return {
          ...j,
          minute: editMinute,
          hour: editHour,
          dom: editDom,
          month: editMonth,
          dow: editDow,
          command: editCommand,
          comment: editComment,
        };
      }
      return j;
    });
    setJobs(updated);
    setSelectedJob({
      ...selectedJob,
      minute: editMinute,
      hour: editHour,
      dom: editDom,
      month: editMonth,
      dow: editDow,
      command: editCommand,
      comment: editComment,
    });
    SoundManager.play('click');
    Toast.show('Task saved & synced to /etc/crontabs/root', '💾');
  };

  const handleDelete = (id: string) => {
    const remaining = jobs.filter((j) => j.id !== id);
    setJobs(remaining);
    if (selectedJob?.id === id) {
      setSelectedJob(remaining[0] || null);
      if (remaining[0]) {
        handleSelectJob(remaining[0]);
      }
    }
    SoundManager.play('click');
    Toast.show('Cron job removed from VFS', '🗑️');
  };

  const handleToggleEnabled = (id: string) => {
    setJobs(
      jobs.map((j) => {
        if (j.id === id) {
          const next = !j.enabled;
          Toast.show(`Task ${next ? 'enabled' : 'disabled'} in /etc/crontabs/root`, '⏱️');
          return { ...j, enabled: next };
        }
        return j;
      })
    );
  };

  const handleRunNow = async (job: CronJob) => {
    setIsRunningTest(true);
    SoundManager.play('key');
    setTestOutput(`[crond] Spawning process: ${job.command}\nUID: 0 (root), GID: 0 (root)\nWorking directory: /root\nVFS Target: /etc/crontabs/root\n---------------------------------------\n`);
    try {
      const output = await Kernel.vm.executeCommand(job.command);
      setTestOutput((prev) => (prev || '') + (output ? output : '(Command executed silently with exit status 0)\n') + '\n[crond] Process exited with status: 0 (SUCCESS)');
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, lastRun: 'Just now', lastExitCode: 0 } : j))
      );
      SoundManager.play('click');
      Toast.show('Task executed successfully', '✓');
    } catch (err: any) {
      SoundManager.play('error');
      setTestOutput((prev) => (prev || '') + `\n[crond] Process execution error: ${err.message || err}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleReloadFromVFS = async () => {
    setIsVfsLoading(true);
    try {
      const content = await Kernel.vfs.read('/etc/crontabs/root');
      if (content) {
        const parsed = parseCrontabText(content);
        if (parsed.length > 0) {
          setJobs(parsed);
          setSelectedJob(parsed[0] || null);
          Toast.show(`Loaded ${parsed.length} tasks from VFS`, '📁');
        }
      } else {
        Toast.show('No crontab found in VFS; generated fresh file', '📁');
        await persistJobsToVFS(jobs);
      }
    } catch {
      Toast.show('Error reading from VFS', '⚠️');
    } finally {
      setIsVfsLoading(false);
    }
  };

  const syncRawView = () => {
    setRawText(serializeJobsToCrontab(jobs));
    setActiveTab('raw');
  };

  const applyRawToVFS = async () => {
    try {
      const parsed = parseCrontabText(rawText);
      if (parsed.length > 0) {
        setJobs(parsed);
        setSelectedJob(parsed[0]);
      }
      for (const p of VFS_CRON_PATHS) {
        await Kernel.vfs.write(p, rawText);
      }
      SoundManager.play('click');
      Toast.show('Raw crontab persisted to VFS (/etc/crontabs/root)', '✓');
      setActiveTab('visual');
    } catch (err) {
      Toast.show('Failed to parse crontab buffer', '⚠️');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141724] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          {activeTab === 'visual' && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                showSidebar ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
              }`}
              title={showSidebar ? 'Collapse Tasks Sidebar' : 'Expand Tasks Sidebar'}
            >
              {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
          )}
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm">Cron Task Scheduler</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 hidden sm:inline-flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-emerald-400" />
            <span>VFS Synced (/etc/crontabs/root)</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReloadFromVFS}
            disabled={isVfsLoading}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Reload crontab directly from Virtual Filesystem"
          >
            <RefreshCw className={`w-3 h-3 ${isVfsLoading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Reload VFS</span>
          </button>

          <button
            onClick={() => setCrondRunning(!crondRunning)}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer ${
              crondRunning ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${crondRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            crond: {crondRunning ? 'ACTIVE' : 'STOPPED'}
          </button>

          <div className="h-4 w-px bg-white/10" />

          <button
            onClick={() => setActiveTab('visual')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${activeTab === 'visual' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            Visual Tasks
          </button>
          <button
            onClick={syncRawView}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${activeTab === 'raw' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            Crontab Raw
          </button>
        </div>
      </div>

      {activeTab === 'visual' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Jobs List Sidebar */}
          {showSidebar && (
            <div className="w-72 border-r border-white/10 flex flex-col bg-[#10121d] shrink-0">
              <div className="p-2 border-b border-white/10 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 font-mono text-[11px] uppercase tracking-wider">Tasks ({jobs.length})</span>
                  <span className="text-[9px] text-emerald-400 font-mono" title="Last synced to IndexedDB / VFS">
                    ✓ {vfsSyncTime}
                  </span>
                </div>
                <button
                  onClick={handleCreateNew}
                  className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg flex items-center gap-1 transition cursor-pointer border border-emerald-500/30"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Task</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer ${
                      selectedJob?.id === job.id
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white shadow-sm'
                        : 'bg-white/5 border-white/5 hover:border-white/15 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[11px] truncate max-w-[170px]">
                        {job.comment || 'Untitled Cron Job'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleEnabled(job.id);
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono transition cursor-pointer ${
                          job.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold' : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {job.enabled ? 'ACTIVE' : 'MUTED'}
                      </button>
                    </div>
                    <div className="font-mono text-[10px] text-emerald-400/90 truncate">
                      {job.minute} {job.hour} {job.dom} {job.month} {job.dow}
                    </div>
                    <div className="font-mono text-[10px] text-gray-400 truncate mt-0.5">
                      $ {job.command}
                    </div>
                    {job.lastRun && (
                      <div className="text-[9px] text-gray-500 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                        <span>Last run: {job.lastRun}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job Editor & Details */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-black/20">
            {/* Fallback task switcher when sidebar is collapsed */}
            {!showSidebar && (
              <div className="px-3 py-1.5 bg-[#141724] border-b border-white/10 flex items-center gap-1.5 overflow-x-auto shrink-0 font-mono text-[11px]">
                <button
                  onClick={handleCreateNew}
                  className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-1 shrink-0 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      selectedJob?.id === job.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>{job.comment || 'Task'}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${job.enabled ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 space-y-4 max-w-3xl">
              {selectedJob ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Task Configuration</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Auto-persisted to VFS
                        </span>
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Changes automatically write to /etc/crontabs/root and survive VM reboots.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRunNow(selectedJob)}
                        disabled={isRunningTest}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl flex items-center gap-1.5 transition cursor-pointer font-medium disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{isRunningTest ? 'Running...' : 'Run Now'}</span>
                      </button>

                      <button
                        onClick={handleSaveSelected}
                        className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded-xl flex items-center gap-1.5 transition cursor-pointer font-medium"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>

                      <button
                        onClick={() => handleDelete(selectedJob.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition cursor-pointer"
                        title="Delete cron job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Comment / Name */}
                  <div className="space-y-1">
                    <label className="block text-[11px] text-gray-400">Task Label / Description</label>
                    <input
                      type="text"
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      placeholder="e.g. Hourly backup script"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  {/* Cron Time Matrix */}
                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl space-y-3 font-mono">
                    <span className="text-[11px] text-gray-400 font-sans font-semibold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Schedule Expression (Vixie / Busybox Cron)</span>
                    </span>

                    <div className="grid grid-cols-5 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 text-center font-sans">Minute (0-59)</label>
                        <input
                          type="text"
                          value={editMinute}
                          onChange={(e) => setEditMinute(e.target.value)}
                          className="w-full bg-black/60 border border-white/15 rounded-lg p-2 text-center text-emerald-300 focus:outline-none focus:border-emerald-500 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 text-center font-sans">Hour (0-23)</label>
                        <input
                          type="text"
                          value={editHour}
                          onChange={(e) => setEditHour(e.target.value)}
                          className="w-full bg-black/60 border border-white/15 rounded-lg p-2 text-center text-emerald-300 focus:outline-none focus:border-emerald-500 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 text-center font-sans">Day/Mon (1-31)</label>
                        <input
                          type="text"
                          value={editDom}
                          onChange={(e) => setEditDom(e.target.value)}
                          className="w-full bg-black/60 border border-white/15 rounded-lg p-2 text-center text-emerald-300 focus:outline-none focus:border-emerald-500 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 text-center font-sans">Month (1-12)</label>
                        <input
                          type="text"
                          value={editMonth}
                          onChange={(e) => setEditMonth(e.target.value)}
                          className="w-full bg-black/60 border border-white/15 rounded-lg p-2 text-center text-emerald-300 focus:outline-none focus:border-emerald-500 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 text-center font-sans">Day/Wk (0-6)</label>
                        <input
                          type="text"
                          value={editDow}
                          onChange={(e) => setEditDow(e.target.value)}
                          className="w-full bg-black/60 border border-white/15 rounded-lg p-2 text-center text-emerald-300 focus:outline-none focus:border-emerald-500 font-bold text-xs"
                        />
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 font-sans">
                      <span className="text-[10px] text-gray-400">Quick Presets:</span>
                      {[
                        { label: 'Every 5m', m: '*/5', h: '*', dom: '*', mon: '*', dow: '*' },
                        { label: 'Every 15m', m: '*/15', h: '*', dom: '*', mon: '*', dow: '*' },
                        { label: 'Hourly', m: '0', h: '*', dom: '*', mon: '*', dow: '*' },
                        { label: 'Daily (00:00)', m: '0', h: '0', dom: '*', mon: '*', dow: '*' },
                        { label: 'Weekly (Sun)', m: '0', h: '0', dom: '*', mon: '*', dow: '0' },
                        { label: 'Monthly (1st)', m: '0', h: '0', dom: '1', mon: '*', dow: '*' },
                      ].map((p) => (
                        <button
                          key={p.label}
                          onClick={() => {
                            setEditMinute(p.m);
                            setEditHour(p.h);
                            setEditDom(p.dom);
                            setEditMonth(p.mon);
                            setEditDow(p.dow);
                          }}
                          className="px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded-md text-[10px] text-gray-300 transition cursor-pointer border border-white/10"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Command Input */}
                  <div className="space-y-1">
                    <label className="block text-gray-400 text-[11px]">Shell Command to Execute</label>
                    <input
                      type="text"
                      value={editCommand}
                      onChange={(e) => setEditCommand(e.target.value)}
                      placeholder="/bin/sh /path/to/script.sh"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  {/* Execution Output Console */}
                  {testOutput && (
                    <div className="bg-black/80 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-gray-300">
                      <div className="flex items-center justify-between pb-1 mb-2 border-b border-white/10 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <Terminal className="w-3 h-3" />
                          Execution Console Output
                        </span>
                        <button onClick={() => setTestOutput(null)} className="hover:text-white cursor-pointer">
                          Clear
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap max-h-40 overflow-y-auto text-emerald-300/90">{testOutput}</pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500 space-y-2">
                  <Clock className="w-8 h-8 text-gray-600" />
                  <p>Select a task from the list or click "Add Task" to create one</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-300 font-mono">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Direct Crontab Buffer (/etc/crontabs/root)</span>
            </span>
            <span className="text-gray-500">Standard BusyBox / Vixie Crontab</span>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="flex-1 w-full bg-black/50 border border-white/15 rounded-xl p-3.5 font-mono text-emerald-400 text-xs focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
            placeholder="# Enter cron expressions here..."
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-gray-500 font-mono">
              Changes will be parsed and written to /etc/crontabs/root and /var/spool/cron/crontabs/helix
            </span>
            <button
              onClick={applyRawToVFS}
              className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply & Save to VFS</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
