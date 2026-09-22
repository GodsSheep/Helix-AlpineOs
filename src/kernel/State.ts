export interface SystemState {
  helix: 'booting' | 'ready' | 'error';
  linux: 'cold' | 'booting' | 'ready' | 'stopping' | 'stopped' | 'suspended' | 'error';
  network: 'online' | 'offline';
  sync: 'paused' | 'waiting' | 'synced' | 'error';
  health?: {
    vfs: string;
    vm: string;
    wm: number;
    ts: number;
  };
}

export class StateManager {
  private state: SystemState = this.loadState();
  private listeners = new Set<(state: SystemState) => void>();

  private loadState(): SystemState {
    const saved = localStorage.getItem('helix_system_state');
    return saved ? JSON.parse(saved) : {
      helix: 'booting',
      linux: 'cold',
      network: navigator.onLine ? 'online' : 'offline',
      sync: 'paused'
    };
  }

  get current() {
    return this.state;
  }

  update(partial: Partial<SystemState>) {
    this.state = { ...this.state, ...partial };
    localStorage.setItem('helix_system_state', JSON.stringify(this.state));
    this.notify();
  }

  subscribe(cb: (state: SystemState) => void) {
    this.listeners.add(cb);
    return () => { this.listeners.delete(cb); };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
