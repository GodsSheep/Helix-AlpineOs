/**
 * RealHostTerminal - Direct Real-Time Linux OS Execution Client
 * Executes all terminal commands directly against the real underlying Linux OS container.
 */

export interface RealExecutionResult {
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  output: string;
  cwd?: string;
  durationMs: number;
  real: boolean;
}

export interface RealHostSystemInfo {
  platform: string;
  type: string;
  release: string;
  arch: string;
  hostname: string;
  cpus: Array<{ model: string; speed: number }>;
  totalmem: number;
  freemem: number;
  uptime: number;
  loadavg: number[];
  userInfo: {
    username: string;
    homedir: string;
    shell: string;
  };
  cwd: string;
}

export class RealHostTerminalClient {
  private static backendAvailable: boolean | null = null;
  private static cachedSystemInfo: RealHostSystemInfo | null = null;

  /**
   * Check if the real OS backend execution API is available
   */
  public static async checkBackend(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('/api/health', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        this.backendAvailable = data.status === 'ok';
        return this.backendAvailable;
      }
    } catch {
      this.backendAvailable = false;
    }
    return false;
  }

  /**
   * Fetch real hardware & host telemetry
   */
  public static async getSystemInfo(): Promise<RealHostSystemInfo | null> {
    try {
      const res = await fetch('/api/system/info');
      if (res.ok) {
        const info = (await res.json()) as RealHostSystemInfo;
        this.cachedSystemInfo = info;
        return info;
      }
    } catch {}
    return this.cachedSystemInfo;
  }

  /**
   * Execute a command directly in the real OS container
   */
  public static async execute(
    command: string,
    cwd?: string,
    env?: Record<string, string>,
    timeoutMs: number = 30000
  ): Promise<RealExecutionResult> {
    const trimmed = command.trim();
    if (!trimmed) {
      return {
        ok: true,
        exitCode: 0,
        stdout: '',
        stderr: '',
        output: '',
        durationMs: 0,
        real: true,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs + 2000);

      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: trimmed,
          cwd,
          env,
          timeout: timeoutMs,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.backendAvailable = true;

        let output = '';
        if (data.stdout && data.stderr) {
          output = `${data.stdout}\n${data.stderr}`;
        } else if (data.stdout) {
          output = data.stdout;
        } else if (data.stderr) {
          output = data.stderr;
        }

        return {
          ok: Boolean(data.ok),
          exitCode: typeof data.exitCode === 'number' ? data.exitCode : 0,
          stdout: data.stdout || '',
          stderr: data.stderr || '',
          output: output.trimEnd(),
          cwd: data.cwd,
          durationMs: data.durationMs || 0,
          real: true,
        };
      }
    } catch (err: unknown) {
      // If server error or offline
      return {
        ok: false,
        exitCode: 1,
        stdout: '',
        stderr: `[Host Terminal Error]: ${(err as Error).message}`,
        output: `[Host Terminal Error]: ${(err as Error).message}`,
        durationMs: 0,
        real: false,
      };
    }

    return {
      ok: false,
      exitCode: 1,
      stdout: '',
      stderr: 'Failed to communicate with host OS terminal',
      output: 'Failed to communicate with host OS terminal',
      durationMs: 0,
      real: false,
    };
  }
}
