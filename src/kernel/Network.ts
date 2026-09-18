import { StateManager } from './State';

export class NetworkManager {
  constructor(private state: StateManager) {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    this.state.update({ network: navigator.onLine ? 'online' : 'offline' });
  }

  private handleOnline = () => {
    this.state.update({ network: 'online' });
  };

  private handleOffline = () => {
    this.state.update({ network: 'offline' });
  };

  public destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}
