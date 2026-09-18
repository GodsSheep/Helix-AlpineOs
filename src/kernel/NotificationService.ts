import { Toast } from './Toast';

export interface HelixNotification {
  id: string;
  title: string;
  message: string;
  icon: string;
  timestamp: number;
  category: 'system' | 'kernel' | 'app' | 'security' | 'network' | 'cron';
  isRead: boolean;
  actionAppId?: string;
  actionArgs?: Record<string, unknown>;
}

type NotificationListener = (notifications: HelixNotification[]) => void;

class NotificationServiceEngine {
  private notifications: HelixNotification[] = [];
  private listeners: Set<NotificationListener> = new Set();
  private isDndEnabled = false;

  constructor() {
    this.loadFromStorage();

    // Hook into Toast notifications so every Toast creates a record in Notification Center
    Toast.subscribe((msg, icon) => {
      this.add({
        title: msg,
        message: 'System Event',
        icon: icon || '🔔',
        category: 'system',
      });
    });

    // Seed initial system notifications if empty
    if (this.notifications.length === 0) {
      this.seedInitial();
    }
  }

  private seedInitial() {
    const now = Date.now();
    this.notifications = [
      {
        id: 'notif-1',
        title: 'Alpine Linux 6.6 LTS Ready',
        message: 'Virtual Machine booted with WebAssembly V86 Core & OpenRC init.',
        icon: '⚡',
        timestamp: now - 1000 * 60 * 2,
        category: 'kernel',
        isRead: false,
        actionAppId: 'machine',
      },
      {
        id: 'notif-[#6ee7b7]',
        title: 'Network Interface Active',
        message: 'Wisp Wasm socket connected. IP address 192.168.1.105 assigned.',
        icon: '📶',
        timestamp: now - 1000 * 60 * 12,
        category: 'network',
        isRead: false,
        actionAppId: 'netscan',
      },
      {
        id: 'notif-3',
        title: 'Helix DE Wayland Compositor',
        message: 'Touch gestures enabled: Swipe down for Notification Center, swipe window titlebar to snap.',
        icon: '👆',
        timestamp: now - 1000 * 60 * 25,
        category: 'system',
        isRead: true,
        actionAppId: 'settings',
      },
    ];
    this.saveToStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('helix_notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
      }
      const dnd = localStorage.getItem('helix_dnd');
      if (dnd) {
        this.isDndEnabled = dnd === 'true';
      }
    } catch {
      this.notifications = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('helix_notifications', JSON.stringify(this.notifications.slice(0, 50)));
      localStorage.setItem('helix_dnd', this.isDndEnabled ? 'true' : 'false');
    } catch {}
  }

  public getNotifications(): HelixNotification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  public getIsDndEnabled(): boolean {
    return this.isDndEnabled;
  }

  public toggleDnd(): boolean {
    this.isDndEnabled = !this.isDndEnabled;
    this.saveToStorage();
    this.notify();
    return this.isDndEnabled;
  }

  public add(item: Omit<HelixNotification, 'id' | 'timestamp' | 'isRead'> & { isRead?: boolean }): HelixNotification {
    const newNotif: HelixNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      isRead: item.isRead ?? false,
      ...item,
    };

    // Prepend
    this.notifications = [newNotif, ...this.notifications].slice(0, 50);
    this.saveToStorage();
    this.notify();
    return newNotif;
  }

  public markAsRead(id: string) {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.saveToStorage();
    this.notify();
  }

  public markAllAsRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, isRead: true }));
    this.saveToStorage();
    this.notify();
  }

  public remove(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.saveToStorage();
    this.notify();
  }

  public clearAll() {
    this.notifications = [];
    this.saveToStorage();
    this.notify();
  }

  public subscribe(cb: NotificationListener): () => void {
    this.listeners.add(cb);
    cb(this.getNotifications());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const list = this.getNotifications();
    this.listeners.forEach((cb) => cb(list));
  }
}

export const NotificationService = new NotificationServiceEngine();
