import React, { useState, useEffect } from 'react';
import { 
  AutomatedTaskManager, 
  AutomatedSystemTask, 
  TaskImportance, 
  TaskCategory,
  MOCK_ALPINE_UPDATES,
  AlpinePackageUpdate
} from '../../../kernel/AutomatedTaskManager';
import { 
  Cpu, 
  ShieldAlert, 
  ShieldCheck, 
  Wrench, 
  Zap, 
  Clock, 
  HardDrive, 
  BatteryCharging, 
  RefreshCw, 
  Activity, 
  Play, 
  Search, 
  Filter, 
  AlertTriangle, 
  X, 
  RotateCcw, 
  Check, 
  Info,
  Layers,
  Settings,
  AlertCircle,
  Package,
  DownloadCloud,
  CheckCircle2
} from 'lucide-react';

interface AutomatedTaskSettingsTabProps {
  notify: (msg: string) => void;
}

export const AutomatedTaskSettingsTab: React.FC<AutomatedTaskSettingsTabProps> = ({ notify }) => {
  const [tasks, setTasks] = useState<AutomatedSystemTask[]>(AutomatedTaskManager.getTasks());
  const [searchQuery, setSearchQuery] = useState('');
  const [importanceFilter, setImportanceFilter] = useState<string>('all');
  
  // Real-Time Critical Task Warning Alert Modal State
  const [pendingDisableTask, setPendingDisableTask] = useState<AutomatedSystemTask | null>(null);
  const [showAlpineModal, setShowAlpineModal] = useState<boolean>(false);

  useEffect(() => {
    const unsub = AutomatedTaskManager.subscribe((updatedTasks) => {
      setTasks(updatedTasks);
    });
    return unsub;
  }, []);

  const handleToggleAttempt = (task: AutomatedSystemTask) => {
    const result = AutomatedTaskManager.toggleTask(task.id, false);
    if (result.requiresConfirmation) {
      // Show Real-Time Warning Alert Modal real quick!
      setPendingDisableTask(result.requiresConfirmation);
    } else {
      notify(`Automated task [${task.name}] status updated`);
    }
  };

  const handleConfirmDisableAnyway = () => {
    if (!pendingDisableTask) return;
    AutomatedTaskManager.toggleTask(pendingDisableTask.id, true); // force = true
    notify(`⚠️ Important Task [${pendingDisableTask.name}] Disabled`);
    setPendingDisableTask(null);
  };

  const handleCancelDisable = () => {
    setPendingDisableTask(null);
  };

  const handleRunNow = (task: AutomatedSystemTask) => {
    AutomatedTaskManager.executeTaskNow(task.id);
    notify(`Executed manual pass for [${task.name}]`);
  };

  const handleIntervalChange = (id: string, intervalMs: number) => {
    AutomatedTaskManager.updateTaskInterval(id, intervalMs);
    notify('Task execution interval updated');
  };

  const handleResetDefaults = () => {
    AutomatedTaskManager.resetAllToDefaults();
    notify('Automated system tasks reset to factory defaults');
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesQuery = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesImportance = importanceFilter === 'all' || t.importance === importanceFilter;
    return matchesQuery && matchesImportance;
  });

  const getImportanceBadge = (importance: TaskImportance) => {
    switch (importance) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold">CRITICAL</span>;
      case 'important':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">IMPORTANT</span>;
      case 'moderate':
        return <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">MODERATE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/40 text-[10px] font-mono font-bold">LOW</span>;
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'Wrench': return <Wrench className="w-4 h-4 text-amber-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'Zap': return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'Clock': return <Clock className="w-4 h-4 text-purple-400" />;
      case 'Cpu': return <Cpu className="w-4 h-4 text-blue-400" />;
      case 'HardDrive': return <HardDrive className="w-4 h-4 text-emerald-400" />;
      case 'BatteryCharging': return <BatteryCharging className="w-4 h-4 text-yellow-400" />;
      case 'RefreshCw': return <RefreshCw className="w-4 h-4 text-cyan-400" />;
      case 'Package': return <Package className="w-4 h-4 text-purple-400" />;
      case 'DownloadCloud': return <DownloadCloud className="w-4 h-4 text-cyan-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 relative">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-purple-950/30 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            Automated System Tasks & Daemons Manager
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage real-time background daemons, memory watchdogs, self-healing jobs, firewall guards, and periodic cron tasks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              AutomatedTaskManager.checkAlpinePackageUpdates(true);
              setShowAlpineModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Package className="w-3.5 h-3.5 text-purple-400" />
            <span>Check Alpine Updates</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Factory Defaults</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#12141b] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search automated tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Importance Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto font-mono text-xs">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400 text-xs">Importance:</span>
          <select
            value={importanceFilter}
            onChange={(e) => setImportanceFilter(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs cursor-pointer focus:outline-none"
          >
            <option value="all">All Levels</option>
            <option value="critical">Critical Only</option>
            <option value="important">Important Only</option>
            <option value="moderate">Moderate Only</option>
            <option value="low">Low Only</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 rounded-2xl border transition-all ${
              task.enabled
                ? 'bg-[#121522] border-white/10 hover:border-emerald-500/30'
                : 'bg-black/40 border-white/5 opacity-60'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Left Info */}
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {renderIcon(task.icon)}
                  <span className="font-bold text-white text-sm">{task.name}</span>
                  {getImportanceBadge(task.importance)}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    task.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  }`}>
                    {task.enabled ? 'RUNNING' : 'SUSPENDED'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
                  {task.description}
                </p>
              </div>

              {/* Right Controls & Telemetry */}
              <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-2 md:pt-0">
                {/* Interval Selector */}
                <div className="text-left md:text-right font-mono text-[11px]">
                  <span className="text-gray-500 block text-[10px]">Freq Interval</span>
                  <select
                    value={task.intervalMs}
                    onChange={(e) => handleIntervalChange(task.id, Number(e.target.value))}
                    className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-cyan-300 text-xs font-mono cursor-pointer"
                  >
                    <option value="3000">3s (Real-time)</option>
                    <option value="5000">5s (High-freq)</option>
                    <option value="10000">10s (Standard)</option>
                    <option value="15000">15s</option>
                    <option value="30000">30s</option>
                    <option value="60000">60s (1 min)</option>
                    <option value="300000">5 min</option>
                  </select>
                </div>

                {/* Telemetry metrics */}
                <div className="text-left md:text-right font-mono text-[11px] text-gray-400">
                  <span className="block text-white font-bold">{task.cpuPercent}% CPU • {task.memoryMb} MB</span>
                  <span className="text-gray-500 text-[10px]">Total Passes: {task.totalRunCount}</span>
                </div>

                {/* Run Now Button */}
                <button
                  onClick={() => handleRunNow(task)}
                  className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1"
                  title="Execute Manual Pass Now"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>

                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer ml-1">
                  <input
                    type="checkbox"
                    checked={task.enabled}
                    onChange={() => handleToggleAttempt(task)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* REAL-TIME WARNING ALERT MODAL FOR DISABLING IMPORTANT SYSTEM TASKS */}
      {pendingDisableTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#151722] border-2 border-red-500/60 rounded-2xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(239,68,68,0.3)] space-y-5 relative">
            {/* Header Alert Icon */}
            <div className="flex items-center gap-3 border-b border-red-500/30 pb-4">
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-2xl animate-pulse">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>CRITICAL SYSTEM TASK DISABLE WARNING</span>
                </h3>
                <span className="text-xs text-red-400 font-mono font-bold block">
                  Important function for system stability & protection
                </span>
              </div>
            </div>

            {/* Task Name & Warning Description */}
            <div className="space-y-3">
              <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{pendingDisableTask.name}</span>
                  {getImportanceBadge(pendingDisableTask.importance)}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed pt-1">
                  {pendingDisableTask.description}
                </p>
              </div>

              {/* Exact System Impact Risk Message */}
              <div className="p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-200 leading-relaxed space-y-2">
                <p className="font-semibold text-red-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{pendingDisableTask.riskWarningMessage}</span>
                </p>
              </div>

              {/* Impact Details Breakdown */}
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[11px] font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">System Stability Impact:</span>
                  <span className="text-amber-300 font-bold">{pendingDisableTask.impactDetails.stabilityImpact}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Security Boundary:</span>
                  <span className="text-cyan-300 font-bold">{pendingDisableTask.impactDetails.securityImpact}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Data Loss Risk:</span>
                  <span className="text-red-400 font-bold">{pendingDisableTask.impactDetails.dataLossRisk}</span>
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={handleCancelDisable}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Keep Task Enabled (Recommended)</span>
              </button>

              <button
                onClick={handleConfirmDisableAnyway}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4 text-red-400" />
                <span>Disable Task Anyway (Acknowledge Risks)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alpine Linux Package Updates Modal */}
      {showAlpineModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#10121a] border border-purple-500/30 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Alpine Linux Package Updates</h3>
              </div>
              <button
                onClick={() => setShowAlpineModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              The Alpine Linux Package Update Daemon periodically polls APK repositories to detect upstream security patches, kernel updates, and library bugfixes.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {MOCK_ALPINE_UPDATES.map((up) => (
                <div key={up.name} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2 font-mono font-bold text-white">
                      <span>{up.name}</span>
                      {up.securityPatch && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-300 border border-red-500/30">
                          CVE SECURITY PATCH
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{up.description}</div>
                  </div>
                  <div className="text-right font-mono text-[11px] shrink-0 ml-3">
                    <span className="text-gray-400">{up.currentVersion}</span>
                    <span className="text-gray-500 mx-1">→</span>
                    <span className="text-emerald-400 font-bold">{up.newVersion}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="text-[11px] text-gray-400 font-mono">Run <code className="bg-black/50 text-cyan-300 px-1 py-0.5 rounded">apk upgrade</code> in Terminal</span>
              <button
                onClick={() => {
                  notify('System upgrade queued via Alpine Package Daemon');
                  setShowAlpineModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulate APK Upgrade All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
