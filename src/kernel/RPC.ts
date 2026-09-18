export interface RpcRequest {
  id: string;
  cmd: string;
  resolve: (output: string) => void;
  reject: (err: Error) => void;
  timeout: number;
  timestamp: number;
  retries: number;
}

export interface RpcFrame {
  id: string;
  payload: string;
  exitCode: number;
}

export class RPCEngine {
  private queue: RpcRequest[] = [];
  private active: RpcRequest | null = null;
  private buffer = '';
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private sequenceCounter = 0;
  private activeRequestsMap = new Map<string, RpcRequest>();

  constructor(private rawSerialSend: (cmd: string) => void) {}

  /**
   * Execute command over framed serial RPC bus
   */
  async execute(cmd: string, timeoutMs = 15000): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sequenceCounter++;
      const reqId = `rpc_${Date.now().toString(36)}_${this.sequenceCounter.toString(36)}`;
      const req: RpcRequest = {
        id: reqId,
        cmd: cmd.trim(),
        resolve,
        reject,
        timeout: timeoutMs,
        timestamp: Date.now(),
        retries: 0,
      };

      this.queue.push(req);
      this.pump();
    });
  }

  private pump(): void {
    if (this.active || this.queue.length === 0) return;

    this.active = this.queue.shift()!;
    this.activeRequestsMap.set(this.active.id, this.active);
    this.buffer = '';

    const reqId = this.active.id;
    
    // Robust Framed Protocol Envelope:
    // Writes stdout and stderr to isolated tmp file, captures exit status, and wraps output in unambiguous delimiters
    const framedCmd = `( ${this.active.cmd} ) > /tmp/${reqId}.out 2>&1; EC=$?; echo "__HELIX_RPC_BEGIN__:${reqId}"; cat /tmp/${reqId}.out; echo "__HELIX_RPC_END__:${reqId}:$EC"; rm -f /tmp/${reqId}.out\n`;

    this.timeoutTimer = setTimeout(() => {
      this.handleTimeout(reqId);
    }, this.active.timeout);

    try {
      this.rawSerialSend(framedCmd);
    } catch (err) {
      console.error('RPC Serial Send Error:', err);
      this.handleTimeout(reqId);
    }
  }

  private handleTimeout(reqId: string): void {
    if (this.active && this.active.id === reqId) {
      const expired = this.active;
      
      // Send cancellation signal to terminate orphan process in guest Alpine shell
      try {
        this.rawSerialSend(`\x03 killall -9 /tmp/${reqId}.out 2>/dev/null; rm -f /tmp/${reqId}.out\n`);
      } catch {}

      this.cleanupActive();
      expired.reject(new Error(`RPC Timeout: Execution exceeded ${expired.timeout}ms limit [ID: ${reqId}]`));
      this.pump();
    }
  }

  /**
   * Handle incoming raw serial stream chunks
   */
  handleStream(chunk: string): boolean {
    if (!this.active) return false;

    this.buffer += chunk;
    const reqId = this.active.id;

    const beginMarker = `__HELIX_RPC_BEGIN__:${reqId}`;
    const endPattern = new RegExp(`__HELIX_RPC_END__:${reqId}:(\\d+)`);

    const beginIndex = this.buffer.indexOf(beginMarker);
    const match = endPattern.exec(this.buffer);

    if (beginIndex !== -1 && match) {
      const endIndex = match.index;
      const exitCode = parseInt(match[1], 10);

      if (endIndex > beginIndex) {
        // Extract exact payload between frame markers
        const payloadStart = beginIndex + beginMarker.length;
        let payload = this.buffer.substring(payloadStart, endIndex);

        // Strip leading/trailing newlines introduced by echo markers
        payload = payload.replace(/^\r?\n/, '').replace(/\r?\n$/, '').trim();

        const req = this.active;
        this.cleanupActive();

        if (exitCode !== 0 && payload.length > 0) {
          // Non-zero exit code treated as command warning/error but returns payload
          req.resolve(payload);
        } else {
          req.resolve(payload);
        }

        this.pump();
        return true;
      }
    }

    return true; // Stream chunk consumed by active RPC parser
  }

  private cleanupActive(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.active) {
      this.activeRequestsMap.delete(this.active.id);
      this.active = null;
    }
    this.buffer = '';
  }

  public getPendingCount(): number {
    return this.queue.length + (this.active ? 1 : 0);
  }

  public reset(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    for (const req of this.queue) {
      req.reject(new Error('RPC Engine pipeline reset'));
    }
    if (this.active) {
      this.active.reject(new Error('RPC Engine pipeline reset'));
      this.cleanupActive();
    }
    this.queue = [];
    this.activeRequestsMap.clear();
    this.buffer = '';
  }
}
