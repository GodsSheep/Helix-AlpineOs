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
  priority?: 'critical' | 'high' | 'normal' | 'low';
}

export interface CategoryNotificationConfig {
  id: string;
  name: string;
  category: 'system' | 'kernel' | 'app' | 'security' | 'network' | 'cron';
  enabled: boolean;
  soundEnabled: boolean;
  soundTheme: 'chime' | 'scifi' | 'radar' | 'classic' | 'subtle';
  toastBannerEnabled: boolean;
  dndBypass: boolean; // Punch through Do Not Disturb
  priority: 'critical' | 'high' | 'normal' | 'low';
  colorTag: string;
}

export interface FullNotificationSettings {
  masterEnabled: boolean;
  dndEnabled: boolean;
  dndScheduleEnabled: boolean;
  dndStartTime: string;
  dndEndTime: string;
  globalSoundEnabled: boolean;
  globalSoundTheme: 'chime' | 'scifi' | 'radar' | 'classic' | 'subtle';
  toastPosition: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
  toastDurationMs: number;
  visualFlashOnCritical: boolean;
  badgeCountsEnabled: boolean;
  autoClearReadHours: number;
  categories: CategoryNotificationConfig[];
}

type NotificationListener = (notifications: HelixNotification[]) => void;
type SettingsListener = (settings: FullNotificationSettings) => void;

const DEFAULT_CATEGORIES: CategoryNotificationConfig[] = [
  {
    id: 'cat_kernel',
    name: 'Kernel & Memory State',
    category: 'kernel',
    enabled: true,
    soundEnabled: true,
    soundTheme: 'scifi',
    toastBannerEnabled: true,
    dndBypass: true,
    priority: 'critical',
    colorTag: '#6ee7b7',
  },
  {
    id: 'cat_security',
    name: 'Security & Firewall Intrusion',
    category: 'security',
    enabled: true,
    soundEnabled: true,
    soundTheme: 'radar',
    toastBannerEnabled: true,
    dndBypass: true,
    priority: 'critical',
    colorTag: '#f87171',
  },
  {
    id: 'cat_system',
    name: 'System Tasks & Daemons',
    category: 'system',
    enabled: true,
    soundEnabled: true,
    soundTheme: 'chime',
    toastBannerEnabled: true,
    dndBypass: false,
    priority: 'normal',
    colorTag: '#38bdf8',
  },
  {
    id: 'cat_network',
    name: 'Network & Sockets',
    category: 'network',
    enabled: true,
    soundEnabled: false,
    soundTheme: 'subtle',
    toastBannerEnabled: true,
    dndBypass: false,
    priority: 'normal',
    colorTag: '#fbbf24',
  },
  {
    id: 'cat_cron',
    name: 'Scheduled Cron Jobs',
    category: 'cron',
    enabled: true,
    soundEnabled: false,
    soundTheme: 'classic',
    toastBannerEnabled: false,
    dndBypass: false,
    priority: 'low',
    colorTag: '#c084fc',
  },
  {
    id: 'cat_app',
    name: 'Applications & Store Updates',
    category: 'app',
    enabled: true,
    soundEnabled: true,
    soundTheme: 'chime',
    toastBannerEnabled: true,
    dndBypass: false,
    priority: 'normal',
    colorTag: '#a7f3d0',
  },
];

const DEFAULT_FULL_SETTINGS: FullNotificationSettings = {
  masterEnabled: false, // Turn off toasts & notifications by default
  dndEnabled: true,     // DND enabled by default
  dndScheduleEnabled: false,
  dndStartTime: '22:00',
  dndEndTime: '07:00',
  globalSoundEnabled: false,
  globalSoundTheme: 'chime',
  toastPosition: 'top-right',
  toastDurationMs: 3500,
  visualFlashOnCritical: false,
  badgeCountsEnabled: false,
  autoClearReadHours: 24,
  categories: DEFAULT_CATEGORIES.map(cat => ({ ...cat, enabled: false, toastBannerEnabled: false })),
};

class NotificationServiceEngine {
  private notifications: HelixNotification[] = [];
  private listeners: Set<NotificationListener> = new Set();
  private settingsListeners: Set<SettingsListener> = new Set();
  private settings: FullNotificationSettings = DEFAULT_FULL_SETTINGS;

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
        priority: 'critical',
      },
      {
        id: 'notif-2',
        title: 'Network Interface Active',
        message: 'Wisp Wasm socket connected. IP address 192.168.1.105 assigned.',
        icon: '📶',
        timestamp: now - 1000 * 60 * 12,
        category: 'network',
        isRead: false,
        actionAppId: 'netscan',
        priority: 'normal',
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
        priority: 'normal',
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
      const savedConfig = localStorage.getItem('helix_full_notification_settings');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        this.settings = {
          ...DEFAULT_FULL_SETTINGS,
          ...parsed,
          categories: DEFAULT_CATEGORIES.map((defCat) => {
            const match = (parsed.categories || []).find((c: CategoryNotificationConfig) => c.id === defCat.id);
            return match ? { ...defCat, ...match } : defCat;
          }),
        };
      } else {
        const dnd = localStorage.getItem('helix_dnd');
        if (dnd) {
          this.settings.dndEnabled = dnd === 'true';
        }
      }
    } catch {
      this.notifications = [];
      this.settings = DEFAULT_FULL_SETTINGS;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('helix_notifications', JSON.stringify(this.notifications.slice(0, 50)));
      localStorage.setItem('helix_full_notification_settings', JSON.stringify(this.settings));
      localStorage.setItem('helix_dnd', this.settings.dndEnabled ? 'true' : 'false');
    } catch {}
  }

  public getSettings(): FullNotificationSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<FullNotificationSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.saveToStorage();
    this.notifySettings();
  }

  public updateCategoryConfig(id: string, partial: Partial<CategoryNotificationConfig>) {
    this.settings.categories = this.settings.categories.map((cat) => (cat.id === id ? { ...cat, ...partial } : cat));
    this.saveToStorage();
    this.notifySettings();
  }

  public resetNotificationSettings() {
    this.settings = DEFAULT_FULL_SETTINGS;
    this.saveToStorage();
    this.notifySettings();
  }

  public getNotifications(): HelixNotification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  public getIsDndEnabled(): boolean {
    return this.settings.dndEnabled;
  }

  public toggleDnd(): boolean {
    this.settings.dndEnabled = !this.settings.dndEnabled;
    this.saveToStorage();
    this.notifySettings();
    this.notify();
    return this.settings.dndEnabled;
  }

  public add(item: Omit<HelixNotification, 'id' | 'timestamp' | 'isRead'> & { isRead?: boolean }): HelixNotification | null {
    // Check master switch
    if (!this.settings.masterEnabled) {
      return null;
    }

    // Check category settings
    const catConfig = this.settings.categories.find((c) => c.category === item.category);
    if (catConfig && !catConfig.enabled) {
      return null; // Category disabled
    }

    // Check DND
    if (this.settings.dndEnabled) {
      const allowBypass = catConfig ? catConfig.dndBypass : false;
      if (!allowBypass) {
        // DND active and no bypass -> record silently or ignore
      }
    }

    const newNotif: HelixNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      isRead: item.isRead ?? false,
      priority: catConfig ? catConfig.priority : item.priority || 'normal',
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

  public subscribeSettings(cb: SettingsListener): () => void {
    this.settingsListeners.add(cb);
    cb(this.getSettings());
    return () => this.settingsListeners.delete(cb);
  }

  private notify() {
    const list = this.getNotifications();
    this.listeners.forEach((cb) => cb(list));
  }

  private notifySettings() {
    const cfg = this.getSettings();
    this.settingsListeners.forEach((cb) => cb(cfg));
  }
}

export const NotificationService = new NotificationServiceEngine();
