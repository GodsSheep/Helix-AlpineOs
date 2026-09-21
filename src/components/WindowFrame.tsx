import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WindowInstance, Kernel } from '../kernel';
import { Settings, HelixSettings } from '../kernel/Settings';
import { 
  Minus, 
  Square, 
  X, 
  Copy, 
  Columns2, 
  Menu, 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown,
  Grid,
  Maximize2,
  Minimize2,
  AlignCenter,
  Layers,
  Sparkles,
  Move
} from 'lucide-react';

interface WindowFrameProps {
  win: WindowInstance;
  icon: string;
  isActive: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onToggleShade?: () => void;
  onUpdatePosition: (x: number, y: number) => void;
  onUpdateSize?: (width: number, height: number) => void;
  onOpenAppMenu?: (x: number, y: number, appId: string) => void;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  win,
  icon,
  isActive,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onToggleShade,
  onUpdatePosition,
  onUpdateSize,
  onOpenAppMenu,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDir, setResizeDir] = useState<string | null>(null);
  const [showSnapMenu, setShowSnapMenu] = useState(false);
  const [settings, setSettings] = useState<HelixSettings>(Settings.get());

  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number; lastX: number; shakeCount: number; lastShakeDir: number; lastShakeTime: number; startTime: number; pointerType: string } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; initX: number; initY: number; initW: number; initH: number } | null>(null);
  const snapMenuRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  const isShaded = !!win.isShaded;

  // Subscribe to Settings
  useEffect(() => {
    const unsub = Settings.subscribe((s) => setSettings(s));
    return unsub;
  }, []);

  // Hold-down (long press) detection on window titlebar
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStartPos = useRef<{ x: number; y: number } | null>(null);

  const cancelHoldDown = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    holdStartPos.current = null;
  }, []);

  const startHoldDown = useCallback((clientX: number, clientY: number) => {
    cancelHoldDown();
    holdStartPos.current = { x: clientX, y: clientY };
    longPressTimer.current = setTimeout(() => {
      if (onOpenAppMenu) {
        if ('vibrate' in navigator) navigator.vibrate?.(35);
        onOpenAppMenu(clientX, clientY, win.appId);
      }
      cancelHoldDown();
    }, 450);
  }, [cancelHoldDown, onOpenAppMenu, win.appId]);

  // Close snap menu on outside pointer
  useEffect(() => {
    const handleOutsideClick = (e: PointerEvent) => {
      if (snapMenuRef.current && !snapMenuRef.current.contains(e.target as Node)) {
        setShowSnapMenu(false);
      }
    };
    if (showSnapMenu) {
      window.addEventListener('pointerdown', handleOutsideClick);
    }
    return () => {
      window.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [showSnapMenu]);

  const handleTitlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onFocus();

    // Start hold-down timer for long press
    if (e.button === 0) {
      startHoldDown(e.clientX, e.clientY);
    }

    if (win.isMaximized) return;

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: win.x,
      initY: win.y,
      lastX: e.clientX,
      shakeCount: 0,
      lastShakeDir: 0,
      lastShakeTime: Date.now(),
      startTime: Date.now(),
      pointerType: e.pointerType,
    };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleResizePointerDown = (dir: string, e: React.PointerEvent) => {
    e.stopPropagation();
    onFocus();
    if (win.isMaximized || isShaded) return;

    setResizeDir(dir);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: win.x,
      initY: win.y,
      initW: win.width,
      initH: win.height,
    };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      // Cancel hold down if pointer moves more than 8px
      if (holdStartPos.current) {
        const dist = Math.hypot(e.clientX - holdStartPos.current.x, e.clientY - holdStartPos.current.y);
        if (dist > 8) {
          cancelHoldDown();
        }
      }

      // Aero Shake detection
      if (isDragging && dragRef.current && settings.windowAeroShake) {
        const cur = dragRef.current;
        const now = Date.now();
        const diffX = e.clientX - cur.lastX;
        if (Math.abs(diffX) > 25 && now - cur.lastShakeTime > 40) {
          const dir = diffX > 0 ? 1 : -1;
          if (dir !== cur.lastShakeDir) {
            cur.shakeCount++;
            cur.lastShakeDir = dir;
            cur.lastShakeTime = now;
            if (cur.shakeCount >= 5) {
              Kernel.wm.shakeToMinimizeOthers(win.id);
              cur.shakeCount = 0;
            }
          }
        }
        cur.lastX = e.clientX;
      }

      if (isDragging && dragRef.current) {
        if (rafId.current) cancelAnimationFrame(rafId.current);
        const curDrag = dragRef.current;
        rafId.current = requestAnimationFrame(() => {
          const dx = e.clientX - curDrag.startX;
          const dy = e.clientY - curDrag.startY;
          const sw = window.innerWidth;
          const sh = window.innerHeight;

          let newX = curDrag.initX + dx;
          let newY = curDrag.initY + dy;

          // Edge magnetism snapping if enabled
          if (settings.windowEdgeMagnetism) {
            const threshold = settings.windowSnapThreshold || 15;
            if (Math.abs(newX - 6) < threshold) newX = 6;
            if (Math.abs(newX + win.width - (sw - 6)) < threshold) newX = sw - win.width - 6;
            if (Math.abs(newY - 46) < threshold) newY = 46;
          }

          newX = Math.max(0, Math.min(sw - 60, newX));
          newY = Math.max(42, Math.min(sh - 40, newY));
          onUpdatePosition(newX, newY);
        });
      }

      if (resizeDir && resizeRef.current && onUpdateSize && !isShaded) {
        if (rafId.current) cancelAnimationFrame(rafId.current);
        const curResize = resizeRef.current;
        const curDir = resizeDir;
        rafId.current = requestAnimationFrame(() => {
          const dx = e.clientX - curResize.startX;
          const dy = e.clientY - curResize.startY;
          const sw = window.innerWidth;
          const sh = window.innerHeight;

          let newW = curResize.initW;
          let newH = curResize.initH;
          let newX = curResize.initX;
          let newY = curResize.initY;

          // Aspect ratio multiplier if locked
          const aspect = settings.windowAspectLock;
          let ratio: number | null = null;
          if (aspect === '16:9') ratio = 16 / 9;
          else if (aspect === '4:3') ratio = 4 / 3;
          else if (aspect === '16:10') ratio = 16 / 10;
          else if (aspect === '3:2') ratio = 3 / 2;

          if (curDir.includes('e')) {
            newW = Math.max(260, Math.min(sw - curResize.initX - 8, curResize.initW + dx));
          }
          if (curDir.includes('w')) {
            const proposedW = Math.max(260, curResize.initW - dx);
            newX = curResize.initX + (curResize.initW - proposedW);
            newW = proposedW;
          }
          if (curDir.includes('s')) {
            newH = Math.max(140, Math.min(sh - curResize.initY - 64, curResize.initH + dy));
          }
          if (curDir.includes('n')) {
            const proposedH = Math.max(140, curResize.initH - dy);
            newY = curResize.initY + (curResize.initH - proposedH);
            newH = proposedH;
          }

          if (ratio !== null) {
            newH = Math.round(newW / ratio);
          }

          if (newX !== win.x || newY !== win.y) {
            onUpdatePosition(newX, newY);
          }
          onUpdateSize(newW, newH);
        });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      cancelHoldDown();
      if (rafId.current) cancelAnimationFrame(rafId.current);

      if (isDragging && dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        // Detect touch swipe gesture on window titlebar (quick flick only, touch/pen devices)
        const isTouchFlick = (dragRef.current.pointerType === 'touch' || dragRef.current.pointerType === 'pen') &&
          (Date.now() - dragRef.current.startTime < 250);

        if (isTouchFlick && absX > 85 && absY < 45) {
          if ('vibrate' in navigator) navigator.vibrate?.(25);
          if (dx > 0) {
            Kernel.wm.snapRight(win.id);
          } else {
            Kernel.wm.snapLeft(win.id);
          }
        } else if (isTouchFlick && absY > 85 && absX < 45) {
          if ('vibrate' in navigator) navigator.vibrate?.(25);
          if (dy < 0) {
            onMaximize();
          } else {
            if (onToggleShade) onToggleShade();
            else Kernel.wm.toggleShade(win.id);
          }
        }

        setIsDragging(false);
        dragRef.current = null;
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
      }
      if (resizeDir) {
        setResizeDir(null);
        resizeRef.current = null;
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
      }
    };

    if (isDragging || resizeDir || holdStartPos.current) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isDragging, resizeDir, onUpdatePosition, onUpdateSize, win.x, win.y, win.width, win.height, win.id, cancelHoldDown, isShaded, onMaximize, onToggleShade, settings]);

  const isTransforming = isDragging || resizeDir !== null;

  // Titlebar height calculation
  let titlebarHeightClass = 'h-10 text-xs';
  let titlebarPx = 40;
  if (settings.windowTitlebarHeight === 'minimal') {
    titlebarHeightClass = 'h-7 text-[11px]';
    titlebarPx = 28;
  } else if (settings.windowTitlebarHeight === 'compact') {
    titlebarHeightClass = 'h-8.5 text-[11.5px]';
    titlebarPx = 34;
  } else if (settings.windowTitlebarHeight === 'spacious') {
    titlebarHeightClass = 'h-12 text-sm';
    titlebarPx = 48;
  }

  // Corner radius class calculation
  let radiusClass = 'rounded-2xl';
  if (settings.windowCornerRadius === 'sharp') radiusClass = 'rounded-none';
  else if (settings.windowCornerRadius === 'subtle') radiusClass = 'rounded-lg';
  else if (settings.windowCornerRadius === 'curved') radiusClass = 'rounded-3xl';
  else if (settings.windowCornerRadius === 'extra-round') radiusClass = 'rounded-[28px]';

  // Border width class calculation
  let borderClass = 'border';
  if (settings.windowBorderWidth === 'none') borderClass = 'border-0';
  else if (settings.windowBorderWidth === '2px') borderClass = 'border-2';
  else if (settings.windowBorderWidth === '3px') borderClass = 'border-[3px]';

  // Glow calculation
  let activeGlowClass = 'border-[var(--accent)]/60 shadow-[0_20px_60px_rgba(0,0,0,0.8)] ring-1 ring-[var(--accent)]/30';
  if (settings.windowGlowEffect === 'none') {
    activeGlowClass = 'border-[var(--accent)]/40 shadow-xl';
  } else if (settings.windowGlowEffect === 'subtle') {
    activeGlowClass = 'border-[var(--accent)]/50 shadow-[0_12px_40px_rgba(0,0,0,0.6)]';
  } else if (settings.windowGlowEffect === 'high') {
    activeGlowClass = 'border-[var(--accent)]/80 shadow-[0_25px_80px_rgba(0,0,0,0.9)] ring-2 ring-[var(--accent)]/50';
  } else if (settings.windowGlowEffect === 'neon') {
    activeGlowClass = 'border-[var(--accent)] ring-2 ring-[var(--accent)] shadow-[0_0_35px_var(--accent)]';
  }

  // Window Shade / Collapse Style calculations
  let style: React.CSSProperties;

  if (win.isMaximized) {
    style = {
      position: 'fixed',
      top: 'calc(42px + env(safe-area-inset-top, 0px))',
      left: 'env(safe-area-inset-left, 0px)',
      right: 'env(safe-area-inset-right, 0px)',
      bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
      width: 'calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))',
      height: isShaded ? `${titlebarPx}px` : 'calc(100dvh - 106px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
      zIndex: win.zIndex,
      display: win.isMinimized ? 'none' : 'flex',
      transform: 'translate3d(0, 0, 0)',
    };
  } else {
    style = {
      position: 'fixed',
      left: win.x,
      top: win.y,
      width: win.width,
      height: isShaded ? titlebarPx : win.height,
      maxWidth: 'calc(100vw - 8px)',
      maxHeight: isShaded ? titlebarPx : 'calc(100dvh - 100px)',
      zIndex: win.zIndex,
      display: win.isMinimized ? 'none' : 'flex',
      transform: 'translate3d(0, 0, 0)',
      willChange: isTransforming ? 'left, top, width, height' : 'auto',
      opacity: isActive ? 1.0 : (settings.windowInactiveOpacity || 95) / 100,
    };
  }

  const handleDoubleClick = () => {
    const action = settings.windowTitlebarDoubleClick || 'maximize';
    if (action === 'maximize') {
      onMaximize();
    } else if (action === 'shade') {
      if (onToggleShade) onToggleShade();
      else Kernel.wm.toggleShade(win.id);
    } else if (action === 'center') {
      Kernel.wm.centerWindow(win.id);
    } else if (action === 'snap-left') {
      Kernel.wm.snapLeft(win.id);
    } else if (action === 'fit-screen') {
      Kernel.wm.refitWindows();
    }
  };

  const handleShadeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleShade) {
      onToggleShade();
    } else {
      Kernel.wm.toggleShade(win.id);
    }
  };

  const isMacStyle = settings.windowControlsStyle === 'mac';

  return (
    <div
      ref={frameRef}
      style={style}
      onPointerDown={onFocus}
      onContextMenu={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (onOpenAppMenu) {
          onOpenAppMenu(e.clientX, e.clientY, win.appId);
        }
      }}
      className={`bg-[#12141c] ${radiusClass} flex flex-col overflow-hidden ${borderClass} ${
        isTransforming ? 'transition-none pointer-events-auto' : 'transition-all duration-300 ease-in-out'
      } ${
        isActive
          ? activeGlowClass
          : 'border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.4)]'
      } ${isShaded ? 'border-b-[var(--accent)]/40 shadow-lg' : ''}`}
    >
      {/* Title Bar */}
      <div
        onPointerDown={handleTitlePointerDown}
        onPointerUp={cancelHoldDown}
        onPointerLeave={cancelHoldDown}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onOpenAppMenu) {
            onOpenAppMenu(e.clientX, e.clientY, win.appId);
          }
        }}
        className={`${titlebarHeightClass} px-2 sm:px-3 bg-white/[0.04] border-b border-white/10 flex items-center justify-between cursor-grab active:cursor-grabbing select-none touch-none shrink-0 ${
          isShaded ? 'bg-gradient-to-r from-white/[0.06] via-cyan-950/20 to-white/[0.04]' : ''
        }`}
      >
        {/* macOS Traffic Lights on Left */}
        {isMacStyle && (
          <div className="flex items-center gap-1.5 mr-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition cursor-pointer flex items-center justify-center group"
              title="Close"
            >
              <X className="w-2 h-2 text-black opacity-0 group-hover:opacity-100" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMinimize(); }}
              className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition cursor-pointer flex items-center justify-center group"
              title="Minimize to Background"
            >
              <Minus className="w-2 h-2 text-black opacity-0 group-hover:opacity-100" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMaximize(); }}
              className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition cursor-pointer flex items-center justify-center group"
              title={win.isMaximized ? 'Restore' : 'Maximize'}
            >
              <Maximize2 className="w-2 h-2 text-black opacity-0 group-hover:opacity-100" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 mr-2">
          {/* App Menu Trigger Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenAppMenu) {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                onOpenAppMenu(rect.left, rect.bottom + 4, win.appId);
              }
            }}
            className="p-1 rounded-md hover:bg-white/10 text-gray-300 hover:text-[#6ee7b7] transition cursor-pointer flex items-center gap-1 shrink-0"
            title={`${win.title} Menu (Click, right-click, or hold down)`}
          >
            <span className="text-sm shrink-0">{icon}</span>
            <Menu className="w-3 h-3 opacity-60 hover:opacity-100" />
          </button>

          <span className="font-semibold text-white tracking-wide truncate">
            {win.title}
          </span>

          {isShaded && (
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono tracking-tighter shrink-0 animate-pulse">
              SHADED
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* Collapse / Shade Roll-up Button */}
          <button
            onClick={handleShadeClick}
            className={`w-6 h-6 rounded-md flex items-center justify-center transition cursor-pointer ${
              isShaded
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'hover:bg-white/10 text-[#8b93a7] hover:text-[#6ee7b7]'
            }`}
            title={isShaded ? 'Expand Window (Double click titlebar)' : 'Collapse to Titlebar (Window Shade)'}
          >
            {isShaded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Snap / Tile Dropdown Button */}
          <div className="relative" ref={snapMenuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSnapMenu(!showSnapMenu);
              }}
              className="w-6 h-6 rounded-md hover:bg-white/10 text-[#8b93a7] hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Snap & Screen Layout options"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>

            {showSnapMenu && (
              <div className="absolute right-0 top-7 w-56 bg-[#161922] border border-white/15 rounded-xl shadow-2xl p-2 z-50 text-[11px] space-y-1.5 backdrop-blur-xl animate-fade-in max-h-[440px] overflow-y-auto">
                <div className="text-[10px] font-mono text-gray-400 px-2 py-0.5 uppercase tracking-wider font-semibold">
                  Window Snapping & Layout
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => { Kernel.wm.snapLeft(win.id); setShowSnapMenu(false); }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-left cursor-pointer flex items-center justify-between"
                  >
                    <span>◧ Left 50%</span>
                  </button>
                  <button
                    onClick={() => { Kernel.wm.snapRight(win.id); setShowSnapMenu(false); }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-left cursor-pointer flex items-center justify-between"
                  >
                    <span>◨ Right 50%</span>
                  </button>
                  <button
                    onClick={() => { Kernel.wm.snapTop(win.id); setShowSnapMenu(false); }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-left cursor-pointer flex items-center justify-between"
                  >
                    <span>⬒ Top 50%</span>
                  </button>
                  <button
                    onClick={() => { Kernel.wm.snapBottom(win.id); setShowSnapMenu(false); }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-left cursor-pointer flex items-center justify-between"
                  >
                    <span>⬓ Bottom 50%</span>
                  </button>
                </div>

                <div className="text-[10px] font-mono text-gray-400 px-2 py-0.5 uppercase tracking-wider font-semibold">
                  Quadrant Snapping (25%)
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => { Kernel.wm.snapQuadrant(win.id, 'tl'); setShowSnapMenu(false); }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-left cursor-pointer"
                  >
                    <span>◰ Top-Left</span>
                  </button>
                  <button
                    onClick={() => { Kernel.wm.snapQuadrant(win.id, 'tr'); setShowSnapMenu(false); }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-left cursor-pointer"
                  >
                    <span>◲ Top-Right</span>
                  </button>
                  <button
                    onClick={() => { Kernel.wm.snapQuadrant(win.id, 'bl'); setShowSnapMenu(false); }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-left cursor-pointer"
                  >
                    <span>◱ Bottom-Left</span>
                  </button>
                  <button
                    onClick={() => { Kernel.wm.snapQuadrant(win.id, 'br'); setShowSnapMenu(false); }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-left cursor-pointer"
                  >
                    <span>◳ Bottom-Right</span>
                  </button>
                </div>

                <div className="text-[10px] font-mono text-gray-400 px-2 py-0.5 uppercase tracking-wider font-semibold">
                  Three Columns (33%)
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => { Kernel.wm.snapThird(win.id, 'left'); setShowSnapMenu(false); }}
                    className="px-1.5 py-1 rounded bg-white/5 hover:bg-white/10 text-center cursor-pointer"
                  >
                    1/3 Left
                  </button>
                  <button
                    onClick={() => { Kernel.wm.snapThird(win.id, 'center'); setShowSnapMenu(false); }}
                    className="px-1.5 py-1 rounded bg-white/5 hover:bg-white/10 text-center cursor-pointer"
                  >
                    1/3 Mid
                  </button>
                  <button
                    onClick={() => { Kernel.wm.snapThird(win.id, 'right'); setShowSnapMenu(false); }}
                    className="px-1.5 py-1 rounded bg-white/5 hover:bg-white/10 text-center cursor-pointer"
                  >
                    1/3 Right
                  </button>
                </div>

                <div className="text-[10px] font-mono text-gray-400 px-2 py-0.5 uppercase tracking-wider font-semibold">
                  Size Presets
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => { Kernel.wm.resizePreset(win.id, 'compact'); setShowSnapMenu(false); }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-left cursor-pointer flex justify-between"
                  >
                    <span>Compact</span>
                    <span className="text-gray-400 text-[10px]">640x440</span>
                  </button>
                  <button
                    onClick={() => { Kernel.wm.resizePreset(win.id, 'standard'); setShowSnapMenu(false); }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-left cursor-pointer flex justify-between"
                  >
                    <span>Standard</span>
                    <span className="text-gray-400 text-[10px]">800x520</span>
                  </button>
                  <button
                    onClick={() => { Kernel.wm.resizePreset(win.id, 'large'); setShowSnapMenu(false); }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-left cursor-pointer flex justify-between"
                  >
                    <span>Large</span>
                    <span className="text-gray-400 text-[10px]">1024x640</span>
                  </button>
                  <button
                    onClick={() => { Kernel.wm.resizePreset(win.id, 'wide'); setShowSnapMenu(false); }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-left cursor-pointer flex justify-between"
                  >
                    <span>Wide</span>
                    <span className="text-gray-400 text-[10px]">1200x700</span>
                  </button>
                </div>

                <div className="h-[1px] bg-white/10 my-1" />

                <button
                  onClick={() => { Kernel.wm.centerWindow(win.id); setShowSnapMenu(false); }}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <AlignCenter className="w-3.5 h-3.5 text-blue-400" />
                  <span>Center on Screen</span>
                </button>

                <button
                  onClick={() => { Kernel.wm.collapseAllExcept(win.id); setShowSnapMenu(false); }}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 text-cyan-300 flex items-center justify-between cursor-pointer"
                  title="Collapse all other windows for maximum focus"
                >
                  <span className="flex items-center gap-1.5">
                    <ChevronsUpDown className="w-3.5 h-3.5" />
                    <span>Focus Solo (Aero)</span>
                  </span>
                </button>

                <button
                  onClick={() => { Kernel.wm.tileAllWindows(); setShowSnapMenu(false); }}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 text-[#6ee7b7] cursor-pointer flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5" />
                    <span>Tile All Windows</span>
                  </span>
                  <span className="text-[10px] text-gray-400">Auto</span>
                </button>

                <button
                  onClick={() => { Kernel.wm.cascadeAllWindows(); setShowSnapMenu(false); }}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 text-purple-300 cursor-pointer flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Cascade All</span>
                  </span>
                </button>

                <button
                  onClick={() => { Kernel.wm.shadeAll(); setShowSnapMenu(false); }}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 text-amber-300 cursor-pointer flex items-center justify-between"
                >
                  <span>Collapse / Shade All</span>
                </button>
              </div>
            )}
          </div>

          {!isMacStyle && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimize();
                }}
                className="px-1.5 h-6 rounded-md hover:bg-white/10 text-[#8b93a7] hover:text-[#6ee7b7] flex items-center gap-1 transition cursor-pointer text-[10px]"
                title="Add to Background"
              >
                <Minus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Background</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMaximize();
                }}
                className="w-6 h-6 rounded-md hover:bg-white/10 text-[#8b93a7] hover:text-white flex items-center justify-center transition cursor-pointer"
                title={win.isMaximized ? 'Restore' : 'Maximize'}
              >
                {win.isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-6 h-6 rounded-md hover:bg-[#ff6b7a] text-[#8b93a7] hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Window Body - hidden when collapsed/shaded to save rendering resources & battery */}
      {!isShaded && (
        <div className="flex-1 overflow-hidden bg-[#0c0e14] relative contain-paint">
          {children}
        </div>
      )}

      {/* 8-Direction Resize Handles (Only active when not maximized and not shaded) */}
      {!win.isMaximized && !isShaded && (
        <>
          {/* East edge */}
          <div
            onPointerDown={(e) => handleResizePointerDown('e', e)}
            className="absolute top-10 right-0 w-3 bottom-3 cursor-ew-resize z-40 hover:bg-[#6ee7b7]/20 transition-colors touch-none"
          />
          {/* West edge */}
          <div
            onPointerDown={(e) => handleResizePointerDown('w', e)}
            className="absolute top-10 left-0 w-3 bottom-3 cursor-ew-resize z-40 hover:bg-[#6ee7b7]/20 transition-colors touch-none"
          />
          {/* South edge */}
          <div
            onPointerDown={(e) => handleResizePointerDown('s', e)}
            className="absolute bottom-0 left-3 right-3 h-3 cursor-ns-resize z-40 hover:bg-[#6ee7b7]/20 transition-colors touch-none"
          />
          {/* North edge */}
          <div
            onPointerDown={(e) => handleResizePointerDown('n', e)}
            className="absolute top-0 left-3 right-3 h-2 cursor-ns-resize z-40 hover:bg-[#6ee7b7]/20 transition-colors touch-none"
          />
          {/* South-East corner handle */}
          <div
            onPointerDown={(e) => handleResizePointerDown('se', e)}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-end justify-end p-1 group touch-none"
            title="Drag to resize window"
          >
            <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-gray-400/60 group-hover:border-[#6ee7b7] group-active:border-[#6ee7b7] transition-colors" />
          </div>
          {/* South-West corner handle */}
          <div
            onPointerDown={(e) => handleResizePointerDown('sw', e)}
            className="absolute bottom-0 left-0 w-5 h-5 cursor-nesw-resize z-50 touch-none"
          />
          {/* North-East corner handle */}
          <div
            onPointerDown={(e) => handleResizePointerDown('ne', e)}
            className="absolute top-0 right-0 w-5 h-5 cursor-nesw-resize z-50 touch-none"
          />
          {/* North-West corner handle */}
          <div
            onPointerDown={(e) => handleResizePointerDown('nw', e)}
            className="absolute top-0 left-0 w-5 h-5 cursor-nwse-resize z-50 touch-none"
          />
        </>
      )}
    </div>
  );
};
