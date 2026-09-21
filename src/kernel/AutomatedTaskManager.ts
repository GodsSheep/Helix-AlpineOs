import { Toast } from './Toast';
import { NotificationService } from './NotificationService';

export type TaskImportance = 'critical' | 'important' | 'moderate' | 'low';
export type TaskCategory = 
  | 'kernel' 
  | 'security' 
  | 'performance' 
  | 'scheduling' 
  | 'hardware' 
  | 'maintenance' 
  | 'power' 
  | 'background' 
  | 'logging';

export interface AutomatedSystemTask {
  id: string;
  name: string;
  category: TaskCategory;
  importance: TaskImportance;
  description: string;
  enabled: boolean;
  intervalMs: number;
  status: 'running' | 'idle' | 'warning' | 'disabled';
  lastRunTimestamp: number;
  totalRunCount: number;
  cpuPercent: number;
  memoryMb: number;
  icon: string;
  isSystemCritical: boolean; // Flag to trigger instant warning alert when user attempts to toggle off
  riskWarningMessage: string;
  impactDetails: {
    stabilityImpact: string;
    securityImpact: string;
    dataLossRisk: string;
  };
}

export type AutomatedTaskListener = (tasks: AutomatedSystemTask[]) => void;

const DEFAULT_SYSTEM_TASKS: AutomatedSystemTask[] = [
  {
    id: 'safe_state_ram_watchdog',
    name: 'Safe-State RAM Pressure Watchdog',
    category: 'kernel',
    importance: 'critical',
    description: 'Monitors guest RAM pressure in real-time and automatically creates emergency RAM checkpoints when pressure exceeds threshold, preventing kernel panic crash loops.',
    enabled: true,
    intervalMs: 10000,
    status: 'running',
    lastRunTimestamp: Date.now() - 4000,
    totalRunCount: 1420,
    cpuPercent: 1.2,
    memoryMb: 8.4,
    icon: 'ShieldAlert',
    isSystemCritical: true,
    riskWarningMessage: 'CRITICAL KERNEL TASK! Disabling the Safe-State RAM Watchdog deactivates automatic OOM crash protection. If guest RAM spikes during heavy compute or compiler tasks, Helix OS may suffer unrecoverable Kernel Panics and memory state corruption!',
    impactDetails: {
      stabilityImpact: 'HIGH RISK — Kernel panic auto-rollback will be suspended.',
      securityImpact: 'LOW — Internal memory state management.',
      dataLossRisk: 'HIGH — Unsaved RAM data will be lost during unexpected crashes.',
    },
  },
  {
    id: 'self_healing_vfs_repair',
    name: 'VFS Integrity & Self-Healing Daemon',
    category: 'maintenance',
    importance: 'critical',
    description: 'Continuously verifies Virtual File System inode health, repairs corrupted superblock metadata, and cleans orphaned mount locks.',
    enabled: true,
    intervalMs: 15000,
    status: 'running',
    lastRunTimestamp: Date.now() - 8000,
    totalRunCount: 980,
    cpuPercent: 0.8,
    memoryMb: 6.2,
    icon: 'Wrench',
    isSystemCritical: true,
    riskWarningMessage: 'CRITICAL FILESYSTEM TASK! Disabling the Self-Healing Engine stops real-time VFS metadata verification and corruption repairs. Any sudden browser reload or ungraceful shutdown could lead to permanent VFS file loss or corrupt mount structures!',
    impactDetails: {
      stabilityImpact: 'CRITICAL — VFS corruptions will not be automatically repaired.',
      securityImpact: 'MEDIUM — Orphaned locks may stall system IO permissions.',
      dataLossRisk: 'CRITICAL — Filesystem corruption may permanently damage user files.',
    },
  },
  {
    id: 'firewall_intrusion_guard',
    name: 'Firewall & Network Intrusion Guard',
    category: 'security',
    importance: 'critical',
    description: 'Inspects incoming WebSocket/Wisp packets, detects port scans, and automatically blocks malformed or malicious payload requests.',
    enabled: true,
    intervalMs: 5000,
    status: 'running',
    lastRunTimestamp: Date.now() - 2000,
    totalRunCount: 3840,
    cpuPercent: 2.1,
    memoryMb: 12.5,
    icon: 'ShieldCheck',
    isSystemCritical: true,
    riskWarningMessage: 'IMPORTANT SECURITY FUNCTION! Disabling Firewall Intrusion Guard suspends packet payload inspection and auto-IP blocking, leaving the local network bridge vulnerable to unmonitored socket probes and untrusted payloads!',
    impactDetails: {
      stabilityImpact: 'MEDIUM — Unfiltered packets may overload socket queues.',
      securityImpact: 'CRITICAL — Suspends network intrusion detection & blocking.',
      dataLossRisk: 'LOW — Network traffic security boundary.',
    },
  },
  {
    id: 'v8_gc_memory_compactor',
    name: 'V8 Garbage Collector & Memory Compactor',
    category: 'performance',
    importance: 'important',
    description: 'Runs minor Scavenge and major Mark-Sweep GC sweeps across the V8 heap to reclaim unused memory blocks and mitigate memory leaks.',
    enabled: true,
    intervalMs: 20000,
    status: 'running',
    lastRunTimestamp: Date.now() - 11000,
    totalRunCount: 650,
    cpuPercent: 1.5,
    memoryMb: 14.8,
    icon: 'Zap',
    isSystemCritical: true,
    riskWarningMessage: 'IMPORTANT PERFORMANCE TASK! Disabling automatic V8 Memory Compaction allows heap fragmentation and detached node references to accumulate over time, leading to elevated browser memory pressure, lag, and browser tab crashes!',
    impactDetails: {
      stabilityImpact: 'MEDIUM — Memory leakage will degrade UI performance over time.',
      securityImpact: 'NONE — Internal V8 runtime memory management.',
      dataLossRisk: 'MEDIUM — Tab crash due to V8 OOM when heap bloats.',
    },
  },
  {
    id: 'cron_task_scheduler_daemon',
    name: 'System Cron & Periodic Task Scheduler',
    category: 'scheduling',
    importance: 'important',
    description: 'Handles background cron jobs, scheduled system maintenance scripts, backup rotations, and automated time-based events.',
    enabled: true,
    intervalMs: 30000,
    status: 'running',
    lastRunTimestamp: Date.now() - 15000,
    totalRunCount: 420,
    cpuPercent: 0.5,
    memoryMb: 5.1,
    icon: 'Clock',
    isSystemCritical: true,
    riskWarningMessage: 'IMPORTANT SYSTEM SCHEDULER! Disabling the Cron Scheduler suspends all user and system scheduled background jobs, preventing background syncs, scheduled backups, and automated time-based triggers from firing!',
    impactDetails: {
      stabilityImpact: 'MEDIUM — Scheduled maintenance tasks will stop running.',
      securityImpact: 'LOW — Automated security update checks will halt.',
      dataLossRisk: 'MEDIUM — Timed backup rotations will be skipped.',
    },
  },
  {
    id: 'auto_detection_hardware_bus',
    name: 'Hardware Hotplug & Auto-Detection Bus',
    category: 'hardware',
    importance: 'moderate',
    description: 'Polls USB devices, screen orientation changes, battery level telemetry, and external audio hardware changes.',
    enabled: true,
    intervalMs: 12000,
    status: 'running',
    lastRunTimestamp: Date.now() - 6000,
    totalRunCount: 880,
    cpuPercent: 0.4,
    memoryMb: 4.8,
    icon: 'Cpu',
    isSystemCritical: false,
    riskWarningMessage: 'Disabling Hardware Auto-Detection stops automatic hotplug detection for USB peripherals, battery level syncing, and audio device auto-switching.',
    impactDetails: {
      stabilityImpact: 'LOW — Hardware hotplug triggers must be invoked manually.',
      securityImpact: 'NONE — Hardware device status polling.',
      dataLossRisk: 'NONE — Sensor telemetry.',
    },
  },
  {
    id: 'disk_cache_garbage_collector',
    name: 'Disk Storage & IndexedDB Cache Purger',
    category: 'maintenance',
    importance: 'moderate',
    description: 'Manages temporary browser storage, purges stale web caches, and enforces configured VFS quota limits.',
    enabled: true,
    intervalMs: 60000,
    status: 'running',
    lastRunTimestamp: Date.now() - 45000,
    totalRunCount: 180,
    cpuPercent: 0.3,
    memoryMb: 7.2,
    icon: 'HardDrive',
    isSystemCritical: false,
    riskWarningMessage: 'Disabling Disk Cache Purging may cause IndexedDB storage to grow indefinitely and consume local disk space.',
    impactDetails: {
      stabilityImpact: 'LOW — Storage cache will accumulate without cleanup.',
      securityImpact: 'NONE — Disk quota cleanup.',
      dataLossRisk: 'NONE — Temporary cache cleanup.',
    },
  },
  {
    id: 'battery_saver_watchdog',
    name: 'Battery Saver & Thermal Governor',
    category: 'power',
    importance: 'moderate',
    description: 'Adjusts CPU governor profiles and dims display brightness when the device battery drops below configured thresholds.',
    enabled: true,
    intervalMs: 15000,
    status: 'running',
    lastRunTimestamp: Date.now() - 10000,
    totalRunCount: 310,
    cpuPercent: 0.2,
    memoryMb: 3.5,
    icon: 'BatteryCharging',
    isSystemCritical: false,
    riskWarningMessage: 'Disabling Battery Saver Watchdog prevents automatic energy conservation mode when running on low battery power.',
    impactDetails: {
      stabilityImpact: 'NONE — Thermal & battery profile governor.',
      securityImpact: 'NONE — Power management.',
      dataLossRisk: 'LOW — Sudden battery death if device drains faster.',
    },
  },
  {
    id: 'pwa_offline_sync_engine',
    name: 'PWA Offline Cache & ServiceWorker Sync',
    category: 'background',
    importance: 'low',
    description: 'Manages Service Worker cache strategies and background fetch synchronization for offline PWA functionality.',
    enabled: true,
    intervalMs: 45000,
    status: 'running',
    lastRunTimestamp: Date.now() - 20000,
    totalRunCount: 220,
    cpuPercent: 0.1,
    memoryMb: 3.8,
    icon: 'RefreshCw',
    isSystemCritical: false,
    riskWarningMessage: 'Disabling PWA Offline Sync stops background asset precaching for offline PWA operation.',
    impactDetails: {
      stabilityImpact: 'NONE — Service worker cache synchronization.',
      securityImpact: 'NONE — Offline assets caching.',
      dataLossRisk: 'NONE — Web asset precache.',
    },
  },
  {
    id: 'telemetry_and_metrics_collector',
    name: 'System Telemetry & Metrics Collector',
    category: 'logging',
    importance: 'low',
    description: 'Records CPU, RAM, disk I/O, and process performance metrics for the System Telemetry and Monitor tools.',
    enabled: true,
    intervalMs: 3000,
    status: 'running',
    lastRunTimestamp: Date.now() - 1000,
    totalRunCount: 5200,
    cpuPercent: 0.6,
    memoryMb: 6.0,
    icon: 'Activity',
    isSystemCritical: false,
    riskWarningMessage: 'Disabling System Telemetry stops background performance metrics logging for system graphs.',
    impactDetails: {
      stabilityImpact: 'NONE — Performance metric recording.',
      securityImpact: 'NONE — System usage diagnostics.',
      dataLossRisk: 'NONE — Telemetry charts.',
    },
  },
  {
    id: 'alpine_apk_update_checker',
    name: 'Alpine Linux Package Update Daemon',
    category: 'maintenance',
    importance: 'important',
    description: 'Periodically runs APK repository package index sweeps (apk update / apk list -u) to detect security patches and updated Alpine Linux packages.',
    enabled: true,
    intervalMs: 35000,
    status: 'running',
    lastRunTimestamp: Date.now() - 10000,
    totalRunCount: 185,
    cpuPercent: 0.4,
    memoryMb: 5.6,
    icon: 'Package',
    isSystemCritical: false,
    riskWarningMessage: 'Disabling the Alpine Package Update Daemon halts background checks for critical Alpine security patches, musl C library fixes, and Linux system upgrades.',
    impactDetails: {
      stabilityImpact: 'LOW — System package upgrades will require manual triggers.',
      securityImpact: 'HIGH — Automated notifications for security patches (CVEs) will stop.',
      dataLossRisk: 'NONE — Software index polling.',
    },
  },
];

export interface AlpinePackageUpdate {
  name: string;
  currentVersion: string;
  newVersion: string;
  repo: string;
  securityPatch: boolean;
  description: string;
}

export const MOCK_ALPINE_UPDATES: AlpinePackageUpdate[] = [
  { name: 'musl', currentVersion: '1.2.4-r1', newVersion: '1.2.4-r2', repo: 'main', securityPatch: true, description: 'Standard C library heap allocation security patch for x86_64' },
  { name: 'alpine-baselayout', currentVersion: '3.4.3-r0', newVersion: '3.4.3-r1', repo: 'main', securityPatch: false, description: 'Alpine layout base configuration & init scripts' },
  { name: 'busybox', currentVersion: '1.36.1-r2', newVersion: '1.36.1-r3', repo: 'main', securityPatch: true, description: 'Core system utilities suite (sh, ls, grep, tar)' },
  { name: 'openssl', currentVersion: '3.1.3-r0', newVersion: '3.1.4-r0', repo: 'main', securityPatch: true, description: 'SSL/TLS cryptographic protocols & cert tools' },
  { name: 'linux-virt', currentVersion: '6.6.14-r0', newVersion: '6.6.15-r0', repo: 'main', securityPatch: true, description: 'Alpine Linux LTS kernel VM image' },
];

class AutomatedTaskManagerEngine {
  private tasks: AutomatedSystemTask[] = [];
  private listeners: Set<AutomatedTaskListener> = new Set();
  private loopTimer: number | null = null;

  constructor() {
    this.loadFromStorage();
    this.startBackgroundLoop();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('helix_automated_tasks');
      if (saved) {
        const parsed: AutomatedSystemTask[] = JSON.parse(saved);
        // Merge with DEFAULT_SYSTEM_TASKS in case new tasks were added
        this.tasks = DEFAULT_SYSTEM_TASKS.map((defTask) => {
          const match = parsed.find((p) => p.id === defTask.id);
          if (match) {
            return {
              ...defTask,
              enabled: match.enabled,
              intervalMs: match.intervalMs || defTask.intervalMs,
              totalRunCount: match.totalRunCount || defTask.totalRunCount,
              status: match.enabled ? 'running' : 'disabled',
            };
          }
          return defTask;
        });
      } else {
        this.tasks = DEFAULT_SYSTEM_TASKS;
      }
    } catch {
      this.tasks = DEFAULT_SYSTEM_TASKS;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('helix_automated_tasks', JSON.stringify(this.tasks));
    } catch {}
  }

  private startBackgroundLoop() {
    if (typeof window === 'undefined') return;
    this.loopTimer = window.setInterval(() => {
      let updated = false;
      const now = Date.now();

      this.tasks = this.tasks.map((task) => {
        if (!task.enabled) return task;

        if (now - task.lastRunTimestamp >= task.intervalMs) {
          updated = true;
          // Simulate slight variations in CPU & memory
          const cpuVar = Math.max(0.1, +(task.cpuPercent + (Math.random() * 0.4 - 0.2)).toFixed(1));
          const memVar = Math.max(1.0, +(task.memoryMb + (Math.random() * 0.6 - 0.3)).toFixed(1));

          if (task.id === 'alpine_apk_update_checker') {
            this.checkAlpinePackageUpdates(false);
          }

          return {
            ...task,
            lastRunTimestamp: now,
            totalRunCount: task.totalRunCount + 1,
            cpuPercent: cpuVar,
            memoryMb: memVar,
            status: 'running',
          };
        }
        return task;
      });

      if (updated) {
        this.saveToStorage();
        this.notify();
      }
    }, 2000);
  }

  public getTasks(): AutomatedSystemTask[] {
    return [...this.tasks];
  }

  public getTaskById(id: string): AutomatedSystemTask | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  public isImportantOrCriticalTask(id: string): AutomatedSystemTask | null {
    const task = this.getTaskById(id);
    if (!task) return null;
    if (task.enabled && (task.isSystemCritical || task.importance === 'critical' || task.importance === 'important')) {
      return task;
    }
    return null;
  }

  public toggleTask(id: string, force = false): { success: boolean; task?: AutomatedSystemTask; requiresConfirmation?: AutomatedSystemTask } {
    const task = this.getTaskById(id);
    if (!task) return { success: false };

    // If task is currently enabled and is critical/important, check if force flag was supplied
    if (task.enabled && (task.isSystemCritical || task.importance === 'critical' || task.importance === 'important') && !force) {
      return { success: false, requiresConfirmation: task };
    }

    const nextState = !task.enabled;
    this.tasks = this.tasks.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          enabled: nextState,
          status: nextState ? 'running' : 'disabled',
          lastRunTimestamp: nextState ? Date.now() : t.lastRunTimestamp,
        };
      }
      return t;
    });

    this.saveToStorage();
    this.notify();

    const updatedTask = this.getTaskById(id);

    if (nextState) {
      Toast.show(`System Task [${task.name}] ENABLED`, '⚙️');
      NotificationService.add({
        title: `Automated Task Started: ${task.name}`,
        message: `Task is running active background sweeps every ${Math.round(task.intervalMs / 1000)}s.`,
        category: 'system',
        icon: '🟢',
      });
    } else {
      Toast.show(`⚠️ System Task [${task.name}] DISABLED`, '🛑');
      NotificationService.add({
        title: `Automated Task Suspended: ${task.name}`,
        message: `User manually disabled background task. ${task.riskWarningMessage}`,
        category: 'security',
        icon: '⚠️',
      });
    }

    return { success: true, task: updatedTask };
  }

  public checkAlpinePackageUpdates(showNotification = false): { updates: AlpinePackageUpdate[]; securityCount: number } {
    const securityCount = MOCK_ALPINE_UPDATES.filter((u) => u.securityPatch).length;
    if (showNotification) {
      Toast.show(`📦 Alpine Linux Updates Available (${MOCK_ALPINE_UPDATES.length} pkgs, ${securityCount} CVE patches)`, '🚀');
      NotificationService.add({
        title: `Alpine Linux Update Alert`,
        message: `APK daemon detected ${MOCK_ALPINE_UPDATES.length} package updates (${securityCount} security patches including musl & openssl). Run 'apk upgrade' in Terminal to install.`,
        category: 'system',
        icon: '📦',
      });
    }
    return { updates: MOCK_ALPINE_UPDATES, securityCount };
  }

  public executeTaskNow(id: string): boolean {
    const task = this.getTaskById(id);
    if (!task) return false;

    if (id === 'alpine_apk_update_checker') {
      this.checkAlpinePackageUpdates(true);
    }

    this.tasks = this.tasks.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          lastRunTimestamp: Date.now(),
          totalRunCount: t.totalRunCount + 1,
          status: 'running',
        };
      }
      return t;
    });

    this.saveToStorage();
    this.notify();

    Toast.show(`Task [${task.name}] Executed Now`, '⚡');
    NotificationService.add({
      title: `Manual Execution: ${task.name}`,
      message: `System task completed manual execution pass cleanly.`,
      category: 'system',
      icon: '⚡',
    });

    return true;
  }

  public updateTaskInterval(id: string, intervalMs: number): boolean {
    this.tasks = this.tasks.map((t) => {
      if (t.id === id) {
        return { ...t, intervalMs: Math.max(1000, intervalMs) };
      }
      return t;
    });

    this.saveToStorage();
    this.notify();
    Toast.show('Task execution interval updated', '⏱️');
    return true;
  }

  public resetAllToDefaults() {
    this.tasks = DEFAULT_SYSTEM_TASKS;
    this.saveToStorage();
    this.notify();
    Toast.show('Automated System Tasks restored to default state', '🔄');
  }

  public subscribe(listener: AutomatedTaskListener): () => void {
    this.listeners.add(listener);
    listener([...this.tasks]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const list = [...this.tasks];
    this.listeners.forEach((cb) => cb(list));
  }
}

export const AutomatedTaskManager = new AutomatedTaskManagerEngine();
