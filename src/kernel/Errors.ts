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
  handleError(error: unknown) {
    if (error instanceof KernelError) {
      // Logic for kernel-aware error routing could go here
      console.error(`KernelError caught:`, error.message);
    } else {
      console.error(`Unknown system error caught:`, error);
    }
  }
}
