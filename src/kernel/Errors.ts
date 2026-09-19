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
  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        const msg = event.message || '';
        if (
          msg === 'Load failed' ||
          msg.includes('Load failed') ||
          msg === 'ResizeObserver loop completed with undelivered notifications.' ||
          msg === 'Script error.'
        ) {
          event.preventDefault();
          return;
        }
        this.handleError(event.error || new Error(event.message));
      });
      window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        const msg = reason instanceof Error ? reason.message : String(reason || '');
        if (
          msg === 'Load failed' ||
          msg.includes('Load failed') ||
          msg === 'Failed to fetch' ||
          msg.includes('Failed to fetch') ||
          msg.includes('NetworkError') ||
          msg === 'File not found' ||
          msg.includes('File not found')
        ) {
          event.preventDefault();
          return;
        }
        this.handleError(reason);
      });
    }
  }

  handleError(error: unknown) {
    if (!error) return;
    if (error instanceof KernelError) {
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
        error.message?.includes('NetworkError')
      ) {
        // Benign rejection from transient network queries or V86 microVM filesystem synchronization
        return;
      }
      console.error(`[Helix System Error] ${error.name}: ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      if (error !== undefined && error !== null) {
        console.error(`[Helix Unknown Error]`, error);
      }
    }
  }

  static report(subsystem: string, code: string, message: string, details?: any) {
    const err = new KernelError(subsystem, code, message, details);
    (window as any).Kernel?.errors.handleError(err);
    return err;
  }
}
