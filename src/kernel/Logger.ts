export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type Subsystem = 'KERNEL' | 'VFS' | 'VM' | 'LINUX' | 'RPC' | 'PTY' | 'APP' | 'NETWORK' | 'SYNC' | 'UPDATE' | 'SECURITY' | 'PWA';

export interface LogEntry {
  id: string;
  timestamp: number;
  subsystem: Subsystem;
  level: LogLevel;
  event: string;
  requestId?: string;
  details?: Record<string, any>;
}

export class SystemLogger {
  private logs: LogEntry[] = [];
  private listeners = new Set<(entry: LogEntry) => void>();

  log(subsystem: Subsystem, level: LogLevel, event: string, details?: Record<string, any>, requestId?: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      subsystem,
      level,
      event,
      details,
      requestId
    };
    
    this.logs.push(entry);
    
    // Optional console mirror based on dev mode or local storage flag
    if (level === 'error' || level === 'critical') {
      console.error(`[${subsystem}] ${event}`, details || '');
    } else if (level === 'warn') {
      console.warn(`[${subsystem}] ${event}`, details || '');
    } else {
      console.log(`[${subsystem}] ${event}`, details || '');
    }

    // Notify listeners
    for (const listener of this.listeners) {
      listener(entry);
    }
  }

  getLogs() {
    return this.logs;
  }

  subscribe(cb: (entry: LogEntry) => void) {
    this.listeners.add(cb);
    return () => { this.listeners.delete(cb); };
  }
}
