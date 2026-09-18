import { WindowInstance, AppId } from './types';
import { AppRegistry } from './AppRegistry';
import { SoundManager } from './SoundManager';

export class WindowManager {
  private windows: WindowInstance[] = [];
  private highestZ = 10;
  private listeners: Set<(windows: WindowInstance[]) => void> = new Set();
  private activeId: string | null = null;
  private resizeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleScreenResize);
      window.addEventListener('orientationchange', this.handleScreenResize);
    }
  }

  private handleScreenResize = () => {
    if (this.resizeDebounceTimer) clearTimeout(this.resizeDebounceTimer);
    this.resizeDebounceTimer = setTimeout(() => {
      this.refitWindows();
    }, 100);
  };

  /**
   * Refits all open windows to make sure none are clipped or pushed offscreen
   * when screen size changes, device rotates, or window is resized.
   */
  public refitWindows() {
    if (typeof window === 'undefined') return;
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const isMobile = sw < 640;

    let hasChanges = false;
    const updated = this.windows.map(win => {
      let { x, y, width, height, isMaximized } = win;
      let changed = false;

      if (isMobile) {
        // On mobile / iPhone, ensure windows fit within viewport bounds
        const maxMobileW = sw - 12;
        const maxMobileH = sh - 110;
        if (width > maxMobileW || width < 280) {
          width = maxMobileW;
          changed = true;
        }
        if (height > maxMobileH) {
          height = maxMobileH;
          changed = true;
        }
        if (x < 6 || x > sw - 60) {
          x = 6;
          changed = true;
        }
        if (y < 46 || y > sh - 60) {
          y = 48;
          changed = true;
        }
      } else {
        // Desktop bounds checking
        const maxW = sw - 20;
        const maxH = sh - 110;
        if (width > maxW) {
          width = maxW;
          changed = true;
        }
        if (height > maxH) {
          height = maxH;
          changed = true;
        }
        if (x + 60 > sw) {
          x = Math.max(10, sw - width - 10);
          changed = true;
        }
        if (x < 0) {
          x = 10;
          changed = true;
        }
        if (y + 40 > sh) {
          y = Math.max(48, sh - height - 60);
          changed = true;
        }
        if (y < 42) {
          y = 46;
          changed = true;
        }
      }

      if (changed) {
        hasChanges = true;
        return { ...win, x, y, width, height };
      }
      return win;
    });

    if (hasChanges) {
      this.windows = updated;
      this.notify();
    }
  }

  open(appId: AppId, args?: Record<string, unknown>): string | null {
    return this.launch(appId, args);
  }

  launch(appId: AppId, args?: Record<string, unknown>): string | null {
    const appDef = AppRegistry.get(appId);
    if (!appDef) return null;

    const allowMultiple = args?.multiInstance === true || appId === 'gui-window';

    // Focus or toggle if already open (for single-instance apps)
    if (!allowMultiple) {
      const existing = this.windows.find(w => w.appId === appId);
      if (existing) {
        if (existing.isMinimized) {
          this.focus(existing.id);
          return existing.id;
        }
        if (this.activeId === existing.id) {
          this.minimize(existing.id);
          return existing.id;
        }
        this.focus(existing.id);
        return existing.id;
      }
    }

    const sw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const sh = typeof window !== 'undefined' ? window.innerHeight : 768;
    const isMobile = sw < 640;

    const reqW = typeof args?.width === 'number' ? args.width : appDef.width;
    const reqH = typeof args?.height === 'number' ? args.height : appDef.height;

    const w = isMobile ? sw - 12 : Math.min(reqW, sw - 40);
    const h = isMobile ? sh - 110 : Math.min(reqH, sh - 120);
    const x = isMobile ? 6 : Math.max(20, Math.floor((sw - w) / 2) + ((this.windows.length % 6) * 22));
    const y = isMobile ? 48 : Math.max(50, Math.floor((sh - h) / 2) - 20 + ((this.windows.length % 6) * 18));
    
    this.highestZ++;
    
    const winTitle = (args?.title as string) || appDef.title;

    const newWin: WindowInstance = {
      id: `win-${appId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      appId,
      title: winTitle,
      x, y, width: w, height: h,
      zIndex: this.highestZ,
      isMinimized: false,
      isMaximized: isMobile, // Auto-maximize on small mobile displays
      args
    };

    this.windows = [...this.windows, newWin];
    this.activeId = newWin.id;
    this.notify();
    SoundManager.play('open');
    return newWin.id;
  }

  focus(id: string) {
    const win = this.windows.find(w => w.id === id);
    if (!win) return;
    
    if (this.activeId !== id) {
      SoundManager.play('focus');
    }

    this.highestZ++;
    this.windows = this.windows.map(w => 
      w.id === id ? { ...w, zIndex: this.highestZ, isMinimized: false } : w
    );
    this.activeId = id;
    this.notify();
  }

  close(id: string) {
    this.windows = this.windows.filter(w => w.id !== id);
    SoundManager.play('close');
    if (this.activeId === id) {
      const visible = this.windows.filter(w => !w.isMinimized);
      if (visible.length > 0) {
        const top = [...visible].sort((a, b) => b.zIndex - a.zIndex)[0];
        this.activeId = top.id;
      } else {
        this.activeId = null;
      }
    }
    this.notify();
  }

  /**
   * Closes all open instances of a specific application by appId
   */
  closeByAppId(appId: string) {
    SoundManager.play('close');
    this.windows = this.windows.filter(w => w.appId !== appId);
    const visible = this.windows.filter(w => !w.isMinimized);
    if (visible.length > 0) {
      const top = [...visible].sort((a, b) => b.zIndex - a.zIndex)[0];
      this.activeId = top.id;
    } else {
      this.activeId = null;
    }
    this.notify();
  }

  /**
   * Closes ALL open windows across the entire system
   */
  closeAll() {
    SoundManager.play('close');
    this.windows = [];
    this.activeId = null;
    this.notify();
  }

  /**
   * Minimizes all open instances of an application by appId
   */
  minimizeByAppId(appId: string) {
    SoundManager.play('minimize');
    this.windows = this.windows.map(w => 
      w.appId === appId ? { ...w, isMinimized: true } : w
    );
    const visible = this.windows.filter(w => !w.isMinimized);
    if (visible.length > 0) {
      const top = [...visible].sort((a, b) => b.zIndex - a.zIndex)[0];
      this.activeId = top.id;
    } else {
      this.activeId = null;
    }
    this.notify();
  }

  /**
   * Restores and brings to front all instances of an application by appId
   */
  restoreByAppId(appId: string) {
    SoundManager.play('focus');
    let topId: string | null = null;
    this.windows = this.windows.map(w => {
      if (w.appId === appId) {
        this.highestZ++;
        topId = w.id;
        return { ...w, zIndex: this.highestZ, isMinimized: false };
      }
      return w;
    });
    if (topId) {
      this.activeId = topId;
    }
    this.notify();
  }

  minimize(id: string) {
    SoundManager.play('minimize');
    this.windows = this.windows.map(w => 
      w.id === id ? { ...w, isMinimized: true } : w
    );
    if (this.activeId === id) {
      const visible = this.windows.filter(w => !w.isMinimized);
      if (visible.length > 0) {
        const top = [...visible].sort((a, b) => b.zIndex - a.zIndex)[0];
        this.activeId = top.id;
      } else {
        this.activeId = null;
      }
    }
    this.notify();
  }

  /**
   * Toggles window shade/roll-up state (collapses window to just its titlebar,
   * saving vertical screen space on small screens while keeping it accessible).
   */
  toggleShade(id: string) {
    SoundManager.play('shade');
    this.windows = this.windows.map(w => {
      if (w.id !== id) return w;
      return { ...w, isShaded: !w.isShaded };
    });
    this.notify();
  }

  /**
   * Collapses all other open windows to their titlebars so the specified
   * window has maximum screen space and focus (Accordion Mode).
   */
  collapseAllExcept(id: string) {
    SoundManager.play('shade');
    this.windows = this.windows.map(w => {
      if (w.id === id) {
        return { ...w, isShaded: false, isMinimized: false };
      }
      return { ...w, isShaded: true };
    });
    this.focus(id);
  }

  /**
   * Shades all open windows down to floating titlebars.
   */
  shadeAll() {
    SoundManager.play('shade');
    this.windows = this.windows.map(w => ({ ...w, isShaded: true }));
    this.notify();
  }

  /**
   * Unshades / expands all open windows back to full height.
   */
  unshadeAll() {
    SoundManager.play('open');
    this.windows = this.windows.map(w => ({ ...w, isShaded: false }));
    this.notify();
  }

  toggleMaximize(id: string) {
    SoundManager.play('maximize');
    this.windows = this.windows.map(w => {
      if (w.id !== id) return w;
      if (w.isMaximized) {
        return {
          ...w,
          isMaximized: false,
          isShaded: false,
          x: w.prevBounds?.x ?? w.x,
          y: w.prevBounds?.y ?? w.y,
          width: w.prevBounds?.width ?? w.width,
          height: w.prevBounds?.height ?? w.height,
        };
      } else {
        return {
          ...w,
          isMaximized: true,
          isShaded: false,
          prevBounds: { x: w.x, y: w.y, width: w.width, height: w.height }
        };
      }
    });
    this.notify();
  }

  snapLeft(id: string) {
    SoundManager.play('snap');
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const w = Math.floor(sw / 2) - 8;
    const h = sh - 110;
    this.windows = this.windows.map(win => {
      if (win.id !== id) return win;
      return {
        ...win,
        isMaximized: false,
        x: 6,
        y: 46,
        width: w,
        height: h,
        prevBounds: { x: win.x, y: win.y, width: win.width, height: win.height }
      };
    });
    this.focus(id);
  }

  snapRight(id: string) {
    SoundManager.play('snap');
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const w = Math.floor(sw / 2) - 8;
    const h = sh - 110;
    this.windows = this.windows.map(win => {
      if (win.id !== id) return win;
      return {
        ...win,
        isMaximized: false,
        x: Math.floor(sw / 2) + 2,
        y: 46,
        width: w,
        height: h,
        prevBounds: { x: win.x, y: win.y, width: win.width, height: win.height }
      };
    });
    this.focus(id);
  }

  centerWindow(id: string) {
    SoundManager.play('snap');
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    this.windows = this.windows.map(win => {
      if (win.id !== id) return win;
      const x = Math.max(10, Math.floor((sw - win.width) / 2));
      const y = Math.max(46, Math.floor((sh - win.height) / 2) - 20);
      return { ...win, x, y, isMaximized: false };
    });
    this.focus(id);
  }

  tileAllWindows() {
    SoundManager.play('snap');
    const visible = this.windows.filter(w => !w.isMinimized);
    if (visible.length === 0) return;

    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const topOffset = 46;
    const bottomOffset = 64;
    const availableH = sh - topOffset - bottomOffset;
    const count = visible.length;

    if (count === 1) {
      this.snapLeft(visible[0].id);
      this.windows = this.windows.map(w => w.id === visible[0].id ? { ...w, width: sw - 12 } : w);
    } else if (count === 2) {
      this.snapLeft(visible[0].id);
      this.snapRight(visible[1].id);
    } else {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellW = Math.floor((sw - 12) / cols);
      const cellH = Math.floor(availableH / rows);

      visible.forEach((win, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        this.updateBounds(win.id, {
          x: 6 + col * cellW,
          y: topOffset + row * cellH,
          width: cellW - 6,
          height: cellH - 6
        });
      });
    }
    this.notify();
  }

  cascadeAllWindows() {
    const visible = this.windows.filter(w => !w.isMinimized);
    visible.forEach((win, i) => {
      const x = 20 + (i * 28);
      const y = 52 + (i * 24);
      this.updateBounds(win.id, { x, y });
    });
    this.notify();
  }

  updatePosition(id: string, x: number, y: number) {
    this.windows = this.windows.map(w => 
      w.id === id ? { ...w, x, y } : w
    );
    this.notify();
  }

  updateBounds(id: string, bounds: { x?: number; y?: number; width?: number; height?: number }) {
    this.windows = this.windows.map(w => 
      w.id === id ? { ...w, ...bounds } : w
    );
    this.notify();
  }

  getWindows(): WindowInstance[] {
    return this.windows;
  }

  getAll(): WindowInstance[] {
    return this.windows;
  }

  getActiveId(): string | null {
    return this.activeId;
  }

  subscribe(cb: (windows: WindowInstance[]) => void) {
    this.listeners.add(cb);
    return () => { this.listeners.delete(cb); };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.windows));
  }
}
