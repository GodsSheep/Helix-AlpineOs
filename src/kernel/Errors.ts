export interface SystemErrorReport {
  id: string;
  timestamp: number;
  subsystem: string;
  code: string;
  message: string;
  stack?: string;
  details?: any;
  recovered?: boolean;
}

export class KernelError extends Error {
  constructor(
    public readonly subsystem: string,
    public readonly code: string,
    message: string,
    public readonly details?: any
  ) {
    super(`[${subsystem}:${code}] ${message}`);
    this.name = 'KernelError';
  }
}

export class ErrorManager {
  private errorRingBuffer: SystemErrorReport[] = [];
  private readonly MAX_ERROR_HISTORY = 100;
  private listeners = new Set<(err: SystemErrorReport) => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        const msg = event.message || '';
        if (
          msg === 'Load failed' ||
          msg.includes('Load failed') ||
          msg === 'Failed to fetch' ||
          msg.includes('Failed to fetch') ||
          msg.includes('NetworkError') ||
          msg.includes('g.memory') ||
          msg.includes('evaluating \'g.memory\'') ||
          msg === 'ResizeObserver loop completed with undelivered notifications.' ||
          msg.includes('ResizeObserver loop') ||
          msg === 'Script error.'
        ) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }
        this.handleError(event.error || new Error(event.message));
      }, true);

      window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        const msg = reason instanceof Error ? reason.message : String(reason || '');
        if (
          msg === 'Load failed' ||
          msg.includes('Load failed') ||
          msg === 'Failed to fetch' ||
          msg.includes('Failed to fetch') ||
          msg.includes('NetworkError') ||
          msg.includes('g.memory') ||
          msg.includes('evaluating \'g.memory\'') ||
          msg === 'File not found' ||
          msg.includes('File not found')
        ) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }
        this.handleError(reason);
      }, true);
    }
  }

  public getErrors(): SystemErrorReport[] {
    return [...this.errorRingBuffer];
  }

  public getErrorCount(): number {
    return this.errorRingBuffer.length;
  }

  public clearErrors(): void {
    this.errorRingBuffer = [];
  }

  public subscribe(listener: (err: SystemErrorReport) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  handleError(error: unknown) {
    if (!error) return;
    
    let subsystem = 'KERNEL';
    let code = 'UNKNOWN_ERR';
    let message = 'An unexpected system error occurred';
    let stack: string | undefined;
    let details: any;

    if (error instanceof KernelError) {
      subsystem = error.subsystem;
      code = error.code;
      message = error.message;
      stack = error.stack;
      details = error.details;
      console.error(`[Helix Kernel] Subsystem: ${error.subsystem}, Code: ${error.code}`);
      console.error(error.message);
      if (error.details) console.dir(error.details);
    } else if (error instanceof Error) {
      if (
        error.message === 'File not found' ||
        error.message?.includes('File not found') ||
        error.message === 'Load failed' ||
        error.message?.includes('Load failed') ||
        error.message === 'Failed to fetch' ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('g.memory') ||
        error.message?.includes('evaluating \'g.memory\'')
      ) {
        // Benign rejection from transient network queries or V86 microVM filesystem synchronization
        return;
      }
      subsystem = 'SYSTEM';
      code = error.name || 'SYS_EXCEPTION';
      message = error.message;
      stack = error.stack;
      console.error(`[Helix System Error] ${error.name}: ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      message = String(error);
      console.error(`[Helix Unknown Error]`, error);
    }

    const report: SystemErrorReport = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      subsystem,
      code,
      message,
      stack,
      details,
      recovered: false,
    };

    this.errorRingBuffer.unshift(report);
    if (this.errorRingBuffer.length > this.MAX_ERROR_HISTORY) {
      this.errorRingBuffer.pop();
    }

    // Notify listeners
    this.listeners.forEach((fn) => {
      try {
        fn(report);
      } catch {}
    });
  }

  static report(subsystem: string, code: string, message: string, details?: any) {
    const err = new KernelError(subsystem, code, message, details);
    (window as any).Kernel?.errors?.handleError(err);
    return err;
  }
}
