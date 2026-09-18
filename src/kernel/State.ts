export interface SystemState {
  helix: 'booting' | 'ready' | 'error';
  linux: 'cold' | 'booting' | 'ready' | 'stopping' | 'stopped' | 'suspended' | 'error';
  network: 'online' | 'offline';
  sync: 'paused' | 'waiting' | 'synced' | 'error';
}

export class StateManager {
  private state: SystemState = {
    helix: 'booting',
    linux: 'cold',
    network: navigator.onLine ? 'online' : 'offline',
    sync: 'paused'
  };

  private listeners = new Set<(state: SystemState) => void>();

  get current() {
    return this.state;
  }

  update(partial: Partial<SystemState>) {
    this.state = { ...this.state, ...partial };
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
