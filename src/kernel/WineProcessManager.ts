export interface WineProcess {
  pid: number;
  windowId: string;
  name: string;
  exePath: string;
  type: 'notepad' | 'cmd' | 'regedit' | 'taskmgr' | 'calc' | 'winemine' | 'dxvk_bench' | 'winecfg' | '7z' | 'putty' | 'paint' | 'generic';
  cpuPercent: number;
  memoryMb: number;
  threads: number;
  startTime: number;
  status: 'running' | 'suspended' | 'terminating';
  windowsVersion: string;
  renderer: string;
  dllOverrides: string;
}

type ProcessListener = (processes: WineProcess[]) => void;

class WineProcessManagerService {
  private processes: WineProcess[] = [];
  private listeners: Set<ProcessListener> = new Set();
  private nextPid = 2480;
  private intervalTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startTelemetryLoop();
  }

  private startTelemetryLoop() {
    if (typeof window === 'undefined') return;
    this.intervalTimer = setInterval(() => {
      if (this.processes.length === 0) return;
      let changed = false;
      this.processes = this.processes.map(p => {
        if (p.status === 'running') {
          // Add small realistic fluctuation
          const jitter = (Math.random() - 0.5) * 1.5;
          const newCpu = Math.max(0.1, Math.min(45.0, Number((p.cpuPercent + jitter).toFixed(1))));
          return { ...p, cpuPercent: newCpu };
        }
        return p;
      });
      this.notify();
    }, 2000);
  }

  public registerProcess(proc: Omit<WineProcess, 'pid' | 'startTime' | 'status'> & { pid?: number }): WineProcess {
    const pid = proc.pid || this.nextPid++;
    const fullProc: WineProcess = {
      ...proc,
      pid,
      startTime: Date.now(),
      status: 'running'
    };
    this.processes = [...this.processes, fullProc];
    this.notify();
    return fullProc;
  }

  public unregisterProcess(windowId: string) {
    this.processes = this.processes.filter(p => p.windowId !== windowId);
    this.notify();
  }

  public killProcessByPid(pid: number) {
    const proc = this.processes.find(p => p.pid === pid);
    if (proc) {
      this.processes = this.processes.filter(p => p.pid !== pid);
      this.notify();
    }
  }

  public getProcesses(): WineProcess[] {
    return [...this.processes];
  }

  public getProcessByWindowId(windowId: string): WineProcess | undefined {
    return this.processes.find(p => p.windowId === windowId);
  }

  public subscribe(listener: ProcessListener): () => void {
    this.listeners.add(listener);
    listener(this.processes);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.processes));
  }
}

export const WineProcessManager = new WineProcessManagerService();
