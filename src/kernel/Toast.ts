// Lightweight high-performance toast manager for Helix OS
import { SoundManager } from './SoundManager';

type ToastCallback = (message: string, icon?: string) => void;

class ToastManager {
  private listeners = new Set<ToastCallback>();

  subscribe(cb: ToastCallback) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  show(message: string, icon = '✓') {
    if (icon === '❌' || icon === '⚠️' || icon.toLowerCase().includes('err')) {
      SoundManager.play('error');
    } else {
      SoundManager.play('toast');
    }
    // Defer listener updates to next tick to prevent React "Cannot update a component while rendering a different component" warnings
    queueMicrotask(() => {
      this.listeners.forEach((cb) => {
        try {
          cb(message, icon);
        } catch (e) {
          console.warn('Toast listener error:', e);
        }
      });
    });
  }
}

export const Toast = new ToastManager();
