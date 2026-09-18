import React, { useState, useEffect } from 'react';
import { Kernel } from '../../kernel';
import { Toast } from '../../kernel/Toast';
import { Clock, Play, Plus, Trash2, Edit3, Save, RefreshCw, CheckCircle2, AlertCircle, Terminal, PanelLeftClose, PanelLeft } from 'lucide-react';

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

  useEffect(() => {
    try {
      localStorage.setItem('helix_crontab_jobs', JSON.stringify(jobs));
    } catch {}
    syncToVFS(jobs);
  }, [jobs]);

  const syncToVFS = async (currentJobs: CronJob[]) => {
    try {
      const lines = currentJobs.map((j) => {
        const prefix = j.enabled ? '' : '# ';
        const commentLine = j.comment ? `# ${j.comment}\n` : '';
        return `${commentLine}${prefix}${j.minute} ${j.hour} ${j.dom} ${j.month} ${j.dow} ${j.command}`;
      });
      const content = `# /etc/crontabs/root - Alpine Linux Helix OS\n# Generated automatically\n\n` + lines.join('\n\n') + '\n';
      await Kernel.vfs.write('/etc/crontabs/root', content);
    } catch {
      // ignore
    }
  };

  const handleCreateNew = () => {
    const newJob: CronJob = {
      id: Date.now().toString(),
      minute: '*/10',
      hour: '*',
      dom: '*',
      month: '*',
      dow: '*',
      command: 'echo "Heartbeat check" >> /var/log/cron.log',
      comment: 'Custom scheduled task',
      enabled: true,
    };
    setJobs([...jobs, newJob]);
    setSelectedJob(newJob);
    setEditMinute(newJob.minute);
    setEditHour(newJob.hour);
    setEditDom(newJob.dom);
    setEditMonth(newJob.month);
    setEditDow(newJob.dow);
    setEditCommand(newJob.command);
    setEditComment(newJob.comment || '');
    Toast.show('Created new cron job', '⏱️');
  };

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
    Toast.show('Crontab job saved to /etc/crontabs/root', '💾');
  };

  const handleDelete = (id: string) => {
    setJobs(jobs.filter((j) => j.id !== id));
    if (selectedJob?.id === id) {
      setSelectedJob(null);
    }
    Toast.show('Cron job removed', '🗑️');
  };

  const handleToggleEnabled = (id: string) => {
    setJobs(
      jobs.map((j) => {
        if (j.id === id) {
          const next = !j.enabled;
          Toast.show(`Task ${next ? 'enabled' : 'disabled'}`, '⏱️');
          return { ...j, enabled: next };
        }
        return j;
      })
    );
  };

  const handleRunNow = async (job: CronJob) => {
    setIsRunningTest(true);
    setTestOutput(`[crond] Spawning process: ${job.command}\nUID: 0 (root), GID: 0 (root)\nWorking directory: /root\n---------------------------------------\n`);
    try {
      const output = await Kernel.vm.executeCommand(job.command);
      setTestOutput((prev) => (prev || '') + (output ? output : '(Command executed silently with exit status 0)\n') + '\n[crond] Process exited with status: 0 (SUCCESS)');
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, lastRun: 'Just now', lastExitCode: 0 } : j))
      );
      Toast.show('Task executed successfully', '✓');
    } catch (err: any) {
      setTestOutput((prev) => (prev || '') + `\n[crond] Process execution error: ${err.message || err}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  const syncRawView = () => {
    const lines = jobs.map((j) => {
      const prefix = j.enabled ? '' : '# ';
      const commentLine = j.comment ? `# ${j.comment}\n` : '';
      return `${commentLine}${prefix}${j.minute} ${j.hour} ${j.dom} ${j.month} ${j.dow} ${j.command}`;
    });
    setRawText(lines.join('\n\n'));
    setActiveTab('raw');
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
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400 hidden sm:inline">
            /etc/crontabs/root
          </span>
        </div>
        <div className="flex items-center gap-2">
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
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${activeTab === 'visual' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-gray-400 hover:text-white'}`}
          >
            Visual Manager
          </button>
          <button
            onClick={syncRawView}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${activeTab === 'raw' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-gray-400 hover:text-white'}`}
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
                <span className="text-gray-400 font-mono text-[11px] uppercase tracking-wider">Scheduled Tasks ({jobs.length})</span>
                <button
                  onClick={handleCreateNew}
                  className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg flex items-center gap-1 transition cursor-pointer"
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
                    className={`p-2 rounded-xl border transition cursor-pointer ${
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
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                          job.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {job.enabled ? 'ON' : 'OFF'}
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
                        Last run: {job.lastRun}
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
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>{job.comment || job.command.slice(0, 15)}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 space-y-4">
            {selectedJob ? (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div>
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-emerald-400" />
                      Edit Task: {selectedJob.comment || 'Untitled'}
                    </h2>
                    <p className="text-gray-400 text-[11px]">Configure cron expression timing and execution shell command</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunNow(selectedJob)}
                      disabled={isRunningTest}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" />
                      <span>{isRunningTest ? 'Running...' : 'Run Now'}</span>
                    </button>
                    <button
                      onClick={handleSaveSelected}
                      className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded flex items-center gap-1.5 transition"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={() => handleDelete(selectedJob.id)}
                      className="p-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded transition"
                      title="Delete Job"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-400 text-[11px] mb-1">Job Description / Label</label>
                  <input
                    type="text"
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    placeholder="e.g. Daily database backup"
                    className="w-full bg-black/40 border border-white/15 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Timing Schedule Fields */}
                <div className="bg-[#141724] p-3 rounded-lg border border-white/10 space-y-2">
                  <div className="text-gray-300 font-semibold text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Cron Expression Schedule:
                  </div>
                  <div className="grid grid-cols-5 gap-2 font-mono">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Minute (0-59)</label>
                      <input
                        type="text"
                        value={editMinute}
                        onChange={(e) => setEditMinute(e.target.value)}
                        className="w-full bg-black/40 border border-white/15 rounded p-1.5 text-center text-emerald-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Hour (0-23)</label>
                      <input
                        type="text"
                        value={editHour}
                        onChange={(e) => setEditHour(e.target.value)}
                        className="w-full bg-black/40 border border-white/15 rounded p-1.5 text-center text-emerald-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Day/Month (1-31)</label>
                      <input
                        type="text"
                        value={editDom}
                        onChange={(e) => setEditDom(e.target.value)}
                        className="w-full bg-black/40 border border-white/15 rounded p-1.5 text-center text-emerald-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Month (1-12)</label>
                      <input
                        type="text"
                        value={editMonth}
                        onChange={(e) => setEditMonth(e.target.value)}
                        className="w-full bg-black/40 border border-white/15 rounded p-1.5 text-center text-emerald-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Day/Week (0-6)</label>
                      <input
                        type="text"
                        value={editDow}
                        onChange={(e) => setEditDow(e.target.value)}
                        className="w-full bg-black/40 border border-white/15 rounded p-1.5 text-center text-emerald-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  {/* Preset quick helpers */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-gray-500 self-center">Presets:</span>
                    {[
                      { label: 'Every 5m', m: '*/5', h: '*', dom: '*', mon: '*', dow: '*' },
                      { label: 'Hourly', m: '0', h: '*', dom: '*', mon: '*', dow: '*' },
                      { label: 'Daily (Midnight)', m: '0', h: '0', dom: '*', mon: '*', dow: '*' },
                      { label: 'Weekly (Sunday)', m: '0', h: '0', dom: '*', mon: '*', dow: '0' },
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
                        className="px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded text-[10px] text-gray-300 font-mono transition"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Command */}
                <div>
                  <label className="block text-gray-400 text-[11px] mb-1">Shell Command to Execute</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editCommand}
                      onChange={(e) => setEditCommand(e.target.value)}
                      placeholder="/bin/sh /path/to/script.sh"
                      className="w-full bg-black/40 border border-white/15 rounded px-2.5 py-1.5 text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Execution Output Console */}
                {testOutput && (
                  <div className="bg-black/80 border border-white/10 rounded-lg p-3 font-mono text-[11px] text-gray-300">
                    <div className="flex items-center justify-between pb-1 mb-2 border-b border-white/10 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Terminal className="w-3 h-3" />
                        Execution Console Output
                      </span>
                      <button onClick={() => setTestOutput(null)} className="hover:text-white">Clear</button>
                    </div>
                    <pre className="whitespace-pre-wrap max-h-40 overflow-y-auto text-emerald-300/90">{testOutput}</pre>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
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
            <span>Direct Crontab File Buffer (/etc/crontabs/root)</span>
            <span className="text-gray-500">Standard Vixie/BusyBox cron format</span>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="flex-1 w-full bg-black/50 border border-white/15 rounded p-3 font-mono text-emerald-400 text-xs focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              onClick={() => {
                Toast.show('Raw crontab synchronized', '✓');
                setActiveTab('visual');
              }}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded font-medium transition"
            >
              Apply to System
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
