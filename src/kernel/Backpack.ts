import { AppId } from './types';

export type BackpackItemType = 'file' | 'snippet' | 'url' | 'command';

export interface BackpackItem {
  id: string;
  type: BackpackItemType;
  label: string;
  data: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class BackpackService {
  private items: BackpackItem[] = [];
  private listeners: Set<(items: BackpackItem[]) => void> = new Set();

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem('helix_backpack');
      if (saved) {
        this.items = JSON.parse(saved);
      }
    } catch (err) {
      console.error('Backpack load error:', err);
      this.items = [];
    }
  }

  private save() {
    try {
      localStorage.setItem('helix_backpack', JSON.stringify(this.items));
      this.notify();
    } catch (err) {
      console.error('Backpack save error:', err);
    }
  }

  public addItem(type: BackpackItemType, label: string, data: string, metadata?: Record<string, any>): string {
    const id = crypto.randomUUID();
    const item: BackpackItem = {
      id,
      type,
      label,
      data,
      timestamp: Date.now(),
      metadata,
    };
    this.items.unshift(item); // Newest first
    this.save();
    return id;
  }

  public removeItem(id: string) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
  }

  public clear() {
    this.items = [];
    this.save();
  }

  public getItems(): BackpackItem[] {
    return [...this.items];
  }

  public subscribe(callback: (items: BackpackItem[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getItems());
    return () => this.listeners.delete(callback);
  }

  private notify() {
    const items = this.getItems();
    this.listeners.forEach(cb => cb(items));
  }
}
