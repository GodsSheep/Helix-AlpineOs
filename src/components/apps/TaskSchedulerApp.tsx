import React, { useState, useEffect } from 'react';
import { Kernel } from '../../kernel';
import { Clock, Play, Pause, Plus, Trash2, CheckCircle2, Shield, RefreshCw, Activity } from 'lucide-react';
import { SoundManager } from '../../kernel/SoundManager';

interface CronJob {
  id: string;
  schedule: string;
  command: string;
  enabled: boolean;
  lastRun?: string;
}

export const TaskSchedulerApp: React.FC = () => {
  const [jobs, setJobs] = useState<CronJob[]>([
    { id: '1', schedule: '0 * * * *', command: 'vfs sync --flush', enabled: true, lastRun: '10 mins ago' },
    { id: '2', schedule: '*/5 * * * *', command: 'telemetry --ping 1.1.1.1', enabled: true, lastRun: '2 mins ago' },
    { id: '3', schedule: '0 0 * * *', command: 'apk update && apk upgrade', enabled: false, lastRun: '1 day ago' },
  ]);

  const [newSchedule, setNewSchedule] = useState('*/10 * * * *');
  const [newCommand, setNewCommand] = useState('syslog --rotate');

  const [services, setServices] = useState([
    { name: 'sshd', desc: 'OpenSSH Daemon', status: 'running', port: 22 },
    { name: 'syslogd', desc: 'BusyBox Syslog Service', status: 'running', port: 514 },
    { name: 'helix-rpc-bus', desc: 'Framed Serial RPC Bus', status: 'running', port: 3000 },
    { name: 'virtio-9p', desc: '9P Filesystem Mount Service', status: 'running', port: 9000 },
  ]);

  const handleAddJob = () => {
    if (!newSchedule.trim() || !newCommand.trim()) return;
    SoundManager.play('success');
    const job: CronJob = {
      id: Date.now().toString(),
      schedule: newSchedule.trim(),
      command: newCommand.trim(),
      enabled: true,
      lastRun: 'Never',
    };
    setJobs([...jobs, job]);
    setNewCommand('');
  };

  const handleToggleJob = (id: string) => {
    SoundManager.play('click');
    setJobs(jobs.map(j => j.id === id ? { ...j, enabled: !j.enabled } : j));
  };

  const handleDeleteJob = (id: string) => {
    SoundManager.play('close');
    setJobs(jobs.filter(j => j.id !== id));
  };

  const handleToggleService = (name: string) => {
    SoundManager.play('click');
    setServices(services.map(s => s.name === name ? { ...s, status: s.status === 'running' ? 'stopped' : 'running' } : s));
  };

  return (
    <div className="h-full flex flex-col bg-[#0c0e15] text-[#edf1f7] text-xs font-sans select-none overflow-hidden p-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-sm text-emerald-400">Cron & Daemon Task Manager</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-gray-400">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>OpenRC Daemon Active</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto my-3 space-y-4">
        {/* OpenRC Service Status */}
        <div className="bg-[#121520] border border-white/10 rounded-2xl p-4 shadow-lg">
          <h3 className="font-bold text-xs text-white mb-3 flex items-center gap-2 font-mono">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>OpenRC System Daemons</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {services.map((s) => (
              <div key={s.name} className="p-2.5 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-emerald-300 text-xs">{s.name}</div>
                  <div className="text-[10px] text-gray-400">{s.desc}</div>
                </div>
                <button
                  onClick={() => handleToggleService(s.name)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition ${
                    s.status === 'running'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  }`}
                >
                  {s.status === 'running' ? '● RUNNING' : '○ STOPPED'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cron Job List */}
        <div className="bg-[#121520] border border-white/10 rounded-2xl p-4 shadow-lg">
          <h3 className="font-bold text-xs text-white mb-3 flex items-center gap-2 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Crontab Scheduled Jobs</span>
          </h3>

          <div className="space-y-2 mb-4">
            {jobs.map((job) => (
              <div key={job.id} className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between gap-3">
                <div className="flex-1 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                      {job.schedule}
                    </span>
                    <span className="text-white text-xs">{job.command}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">Last executed: {job.lastRun}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleJob(job.id)}
                    className={`p-1.5 rounded-lg cursor-pointer transition ${
                      job.enabled ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                  >
                    {job.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Job Controls */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/10 font-mono">
            <input
              type="text"
              value={newSchedule}
              onChange={(e) => setNewSchedule(e.target.value)}
              placeholder="Cron (e.g. */10 * * * *)"
              className="px-3 py-1.5 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400 sm:w-40"
            />
            <input
              type="text"
              value={newCommand}
              onChange={(e) => setNewCommand(e.target.value)}
              placeholder="Linux Command"
              className="flex-1 px-3 py-1.5 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={handleAddJob}
              className="px-4 py-1.5 bg-emerald-500 text-black font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-emerald-400 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Job</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
