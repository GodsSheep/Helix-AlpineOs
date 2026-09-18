import { VFSFile } from './types';
import { ChangeJournal } from './ChangeJournal';

export class VirtualFileSystem {
  private db: IDBDatabase | null = null;
  private listeners: Set<() => void> = new Set();
  private isInitialized = false;
  private journal?: ChangeJournal;

  // In-memory atomic cache for zero-latency reads & high-frequency writes
  private cache: Map<string, VFSFile> = new Map();
  // Debounced dirty queues
  private dirtyWrites: Map<string, VFSFile> = new Map();
  private pendingDeletions: Set<string> = new Set();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isFlushing = false;
  private flushWaiters: Array<{ resolve: () => void; reject: (err: any) => void }> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushSync();
      });
      window.addEventListener('pagehide', () => {
        this.flushSync();
      });
    }
  }

  setJournal(journal: ChangeJournal) {
    this.journal = journal;
  }

  async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    return new Promise((resolve, reject) => {
      const req = indexedDB.open('HelixDrive', 2);

      req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'path' });
        }
      };

      req.onsuccess = async (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        await this.loadInitialCache();
        await this.seedDefaults();
        resolve();
      };

      req.onerror = (e) => {
        console.error('VFS IndexedDB Error:', e);
        reject(e);
      };
    });
  }

  private async loadInitialCache(): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db!.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.getAll();
      req.onsuccess = () => {
        const files = (req.result as VFSFile[]) || [];
        this.cache.clear();
        for (const file of files) {
          this.cache.set(file.path, file);
        }
        resolve();
      };
      req.onerror = () => resolve();
    });
  }

  normalizePath(path: string): string {
    let p = path.replace(/\\/g, '/');
    if (!p.startsWith('/')) p = '/' + p;
    p = p.replace(/\/\//g, '/');
    return p;
  }

  private async seedDefaults(): Promise<void> {
    if (this.cache.size === 0) {
      await this.write('/welcome.txt', 'Welcome to Helix OS v6 (Alpine Linux Architecture)\nDISPLAY=:0.0 (Virtual X11 / Wayland server online)\n');
      await this.write('/hello.py', 'print("Hello from Helix Kernel!")\n');
      await this.write('/demo.js', 'console.log("Helix V6");\n');
      await this.write('/calc_gui.py', 'import tkinter as tk\n\nroot = tk.Tk()\nroot.title("Alpine Tkinter Calculator")\nroot.geometry("400x360")\n\ntitle = tk.Label(root, text="Alpine GNU bc & Tkinter Calc", font=("Arial", 14, "bold"))\nres_lbl = tk.Label(root, text="Result: 0", font=("Arial", 12))\n\nent_a = tk.Entry(root, placeholder="Enter first number...")\nent_b = tk.Entry(root, placeholder="Enter second number...")\n\ndef calculate():\n    res_lbl.config(text="Computed")\n\nbtn = tk.Button(root, text="Compute (+)", command=calculate)\nbtn_rst = tk.Button(root, text="Reset", command="reset")\n\nroot.mainloop()\n');
      await this.write('/turtle_art.py', 'import turtle\n\nt = turtle.Turtle()\nturtle.title("Helix Turtle Spirograph Studio")\nt.speed(0)\nt.width(2)\n\nfor i in range(36):\n    t.color("#6ee7b7" if i % 2 == 0 else "#38bdf8")\n    t.circle(70)\n    t.right(10)\n\nturtle.done()\n');
      await this.write('/zenity_test.sh', '#!/bin/sh\nzenity --info --title="Kernel Status" --text="Virtual X11 Display Server running on :0.0"\nzenity --question --title="Alpine DE" --text="Launch GUI Studio IDE?"\n');
      await this.flush();
    }
  }

  /**
   * High-frequency write with immediate cache update and debounced atomic IndexedDB persistence
   */
  async write(path: string, content: string): Promise<void> {
    if (!this.isInitialized) await this.init();
    const normPath = this.normalizePath(path);

    const item: VFSFile = {
      path: normPath,
      content,
      timestamp: Date.now(),
    };

    // Update in-memory cache immediately for 0ms sequential read consistency
    this.cache.set(normPath, item);
    this.pendingDeletions.delete(normPath);
    this.dirtyWrites.set(normPath, item);

    if (this.journal) {
      this.journal.record('modify', normPath);
    }

    // Sync to Alpine emulator filesystem if running
    if (typeof window !== 'undefined' && (window as any).emulator?.create_file) {
      try {
        const cleanPath = normPath.replace(/^\//, '');
        (window as any).emulator.create_file(cleanPath, new TextEncoder().encode(content));
      } catch (err) {
        console.warn('V86 sync skipped:', err);
      }
    }

    // Notify listeners so UI updates instantly
    this.notifyPathListeners(normPath, content);
    this.notifyListeners();

    // Schedule debounced atomic flush to disk
    this.scheduleDebouncedFlush();
  }

  async read(path: string): Promise<string | null> {
    if (!this.isInitialized) await this.init();
    const normPath = this.normalizePath(path);

    // Read from cache first (including dirty uncommitted writes)
    const cached = this.cache.get(normPath);
    if (cached !== undefined) {
      return cached.content;
    }

    // Fallback directly to IndexedDB if not in cache
    if (!this.db) return null;
    return new Promise((resolve) => {
      const tx = this.db!.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.get(normPath);
      req.onsuccess = () => {
        const res = req.result as VFSFile | undefined;
        if (res) {
          this.cache.set(normPath, res);
          resolve(res.content);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  }

  private pathWatchers: Map<string, Set<(content: string | null) => void>> = new Map();

  async delete(path: string): Promise<void> {
    if (!this.isInitialized) await this.init();
    const normPath = this.normalizePath(path);

    this.cache.delete(normPath);
    this.dirtyWrites.delete(normPath);
    this.pendingDeletions.add(normPath);

    if (this.journal) {
      this.journal.record('delete', normPath);
    }

    this.notifyPathListeners(normPath, null);
    this.notifyListeners();
    this.scheduleDebouncedFlush();
  }

  async copy(srcPath: string, dstPath: string): Promise<boolean> {
    const content = await this.read(srcPath);
    if (content === null) return false;
    await this.write(dstPath, content);
    return true;
  }

  async move(srcPath: string, dstPath: string): Promise<boolean> {
    const content = await this.read(srcPath);
    if (content === null) return false;
    await this.write(dstPath, content);
    await this.delete(srcPath);
    return true;
  }

  async list(): Promise<VFSFile[]> {
    if (!this.isInitialized) await this.init();
    return Array.from(this.cache.values());
  }

  async mkdir(path: string): Promise<void> {
    const norm = this.normalizePath(path);
    if (this.journal) {
      this.journal.record('create', norm, 'vfs');
    }
    const marker = norm.endsWith('/') ? `${norm}.keep` : `${norm}/.keep`;
    await this.write(marker, '');
  }

  private scheduleDebouncedFlush() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    // 60ms debounce window consolidates rapid keystrokes/script outputs into a single atomic transaction
    this.debounceTimer = setTimeout(() => {
      this.flush().catch((err) => console.error('Debounced VFS flush error:', err));
    }, 60);
  }

  /**
   * Atomic flush: commits all dirty writes and pending deletions in a single atomic IndexedDB transaction
   */
  async flush(): Promise<void> {
    if (!this.db || !this.isInitialized) return;
    if (this.dirtyWrites.size === 0 && this.pendingDeletions.size === 0) return;

    if (this.isFlushing) {
      return new Promise((resolve, reject) => {
        this.flushWaiters.push({ resolve, reject });
      });
    }

    this.isFlushing = true;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Capture snapshots of queues to commit atomically
    const writesToCommit = Array.from(this.dirtyWrites.values());
    const deletesToCommit = Array.from(this.pendingDeletions.values());
    this.dirtyWrites.clear();
    this.pendingDeletions.clear();

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction('files', 'readwrite');
        const store = tx.objectStore('files');

        for (const file of writesToCommit) {
          store.put(file);
        }

        for (const path of deletesToCommit) {
          store.delete(path);
        }

        tx.oncomplete = () => {
          this.isFlushing = false;
          resolve();
          const waiters = [...this.flushWaiters];
          this.flushWaiters = [];
          waiters.forEach((w) => w.resolve());

          // If more dirty writes arrived while flushing, schedule another flush
          if (this.dirtyWrites.size > 0 || this.pendingDeletions.size > 0) {
            this.scheduleDebouncedFlush();
          }
        };

        tx.onerror = (e) => {
          this.isFlushing = false;
          console.error('Atomic VFS flush failed:', tx.error || e);
          // Restore items back to dirty queues so they are not lost
          writesToCommit.forEach((w) => this.dirtyWrites.set(w.path, w));
          deletesToCommit.forEach((d) => this.pendingDeletions.add(d));

          reject(tx.error);
          const waiters = [...this.flushWaiters];
          this.flushWaiters = [];
          waiters.forEach((w) => w.reject(tx.error));
        };
      } catch (err) {
        this.isFlushing = false;
        reject(err);
      }
    });
  }

  /**
   * Synchronous best-effort flush for page unload
   */
  private flushSync(): void {
    if (!this.db || (this.dirtyWrites.size === 0 && this.pendingDeletions.size === 0)) return;
    try {
      const tx = this.db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      for (const file of this.dirtyWrites.values()) {
        store.put(file);
      }
      for (const path of this.pendingDeletions.values()) {
        store.delete(path);
      }
      this.dirtyWrites.clear();
      this.pendingDeletions.clear();
    } catch {}
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => { this.listeners.delete(callback); };
  }

  watchPath(path: string, callback: (content: string | null) => void): () => void {
    const norm = this.normalizePath(path);
    if (!this.pathWatchers.has(norm)) {
      this.pathWatchers.set(norm, new Set());
    }
    this.pathWatchers.get(norm)!.add(callback);
    return () => {
      const set = this.pathWatchers.get(norm);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.pathWatchers.delete(norm);
      }
    };
  }

  private notifyPathListeners(path: string, content: string | null): void {
    const watchers = this.pathWatchers.get(path);
    if (watchers) {
      watchers.forEach((cb) => {
        try { cb(content); } catch (err) { console.error('VFS path watcher error:', err); }
      });
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => {
      try { cb(); } catch (err) { console.error('VFS listener error:', err); }
    });
  }
}
