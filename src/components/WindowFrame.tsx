import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WindowInstance, Kernel } from '../kernel';
import { Minus, Square, X, Copy, Columns2, Menu, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

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

  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; initW: number; initH: number } | null>(null);
  const snapMenuRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  const isShaded = !!win.isShaded;

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

      if (isDragging && dragRef.current) {
        if (rafId.current) cancelAnimationFrame(rafId.current);
        const curDrag = dragRef.current;
        rafId.current = requestAnimationFrame(() => {
          const dx = e.clientX - curDrag.startX;
          const dy = e.clientY - curDrag.startY;
          const sw = window.innerWidth;
          const sh = window.innerHeight;
          const newX = Math.max(0, Math.min(sw - 60, curDrag.initX + dx));
          const newY = Math.max(42, Math.min(sh - 40, curDrag.initY + dy));
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

          if (curDir.includes('e')) {
            newW = Math.max(260, Math.min(sw - win.x - 8, curResize.initW + dx));
          }
          if (curDir.includes('s')) {
            newH = Math.max(140, Math.min(sh - win.y - 64, curResize.initH + dy));
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

        // Detect touch swipe gesture on window titlebar
        if (absX > 75 && absY < 45) {
          if ('vibrate' in navigator) navigator.vibrate?.(25);
          if (dx > 0) {
            Kernel.wm.snapRight(win.id);
          } else {
            Kernel.wm.snapLeft(win.id);
          }
        } else if (absY > 75 && absX < 45) {
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
  }, [isDragging, resizeDir, onUpdatePosition, onUpdateSize, win.x, win.y, cancelHoldDown, isShaded]);

  const isTransforming = isDragging || resizeDir !== null;

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
      height: isShaded ? '40px' : 'calc(100dvh - 106px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
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
      height: isShaded ? 40 : win.height,
      maxWidth: 'calc(100vw - 8px)',
      maxHeight: isShaded ? 40 : 'calc(100dvh - 100px)',
      zIndex: win.zIndex,
      display: win.isMinimized ? 'none' : 'flex',
      transform: 'translate3d(0, 0, 0)',
      willChange: isTransforming ? 'left, top, width, height' : 'auto',
    };
  }

  const handleDoubleClick = () => {
    if (onToggleShade) {
      onToggleShade();
    } else {
      Kernel.wm.toggleShade(win.id);
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
      className={`bg-[#12141c] rounded-2xl flex flex-col overflow-hidden shadow-2xl border ${
        isTransforming ? 'transition-none pointer-events-auto' : 'transition-[height,box-shadow,border-color] duration-150'
      } ${
        isActive
          ? 'border-[#6ee7b7]/60 shadow-[0_16px_50px_rgba(0,0,0,0.7)] ring-1 ring-[#6ee7b7]/30'
          : 'border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.4)]'
      } ${isShaded ? 'rounded-b-xl border-b-cyan-500/30' : ''}`}
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
        className={`h-10 px-2 sm:px-3 bg-white/[0.04] border-b border-white/10 flex items-center justify-between cursor-grab active:cursor-grabbing select-none touch-none shrink-0 ${
          isShaded ? 'bg-gradient-to-r from-white/[0.06] via-cyan-950/20 to-white/[0.04]' : ''
        }`}
      >
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

          <span className="text-xs font-semibold text-white tracking-wide truncate">
            {win.title}
          </span>

          {isShaded && (
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono tracking-tighter shrink-0 animate-pulse">
              COLLAPSED
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
              <div className="absolute right-0 top-7 w-44 bg-[#161922] border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 text-[11px] space-y-1 backdrop-blur-xl">
                <button
                  onClick={() => {
                    Kernel.wm.collapseAllExcept(win.id);
                    setShowSnapMenu(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 text-cyan-300 flex items-center justify-between cursor-pointer"
                  title="Collapse all other windows for maximum focus"
                >
                  <span className="flex items-center gap-1.5">
                    <ChevronsUpDown className="w-3.5 h-3.5" />
                    <span>Focus / Solo</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">100%</span>
                </button>

                <div className="h-[1px] bg-white/10 my-1" />

                <button
                  onClick={() => {
                    Kernel.wm.snapLeft(win.id);
                    setShowSnapMenu(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 flex items-center justify-between cursor-pointer"
                >
                  <span>Snap Left</span>
                  <span className="text-gray-400">50%</span>
                </button>
                <button
                  onClick={() => {
                    Kernel.wm.snapRight(win.id);
                    setShowSnapMenu(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 flex items-center justify-between cursor-pointer"
                >
                  <span>Snap Right</span>
                  <span className="text-gray-400">50%</span>
                </button>
                <button
                  onClick={() => {
                    Kernel.wm.centerWindow(win.id);
                    setShowSnapMenu(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  Center Window
                </button>
                <div className="h-[1px] bg-white/10 my-1" />
                <button
                  onClick={() => {
                    Kernel.wm.tileAllWindows();
                    setShowSnapMenu(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 text-[#6ee7b7] cursor-pointer flex items-center justify-between"
                >
                  <span>Tile All Windows</span>
                  <span className="text-[10px] text-gray-400">Auto</span>
                </button>
                <button
                  onClick={() => {
                    Kernel.wm.shadeAll();
                    setShowSnapMenu(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 text-amber-300 cursor-pointer flex items-center justify-between"
                >
                  <span>Collapse All</span>
                  <span className="text-[10px] text-gray-400">Shade</span>
                </button>
              </div>
            )}
          </div>

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
        </div>
      </div>

      {/* Window Body - hidden when collapsed/shaded to save rendering resources & battery */}
      {!isShaded && (
        <div className="flex-1 overflow-hidden bg-[#0c0e14] relative contain-paint">
          {children}
        </div>
      )}

      {/* Resize Handles (Only active when not maximized and not shaded) */}
      {!win.isMaximized && !isShaded && (
        <>
          {/* East edge */}
          <div
            onPointerDown={(e) => handleResizePointerDown('e', e)}
            className="absolute top-10 right-0 w-3 bottom-3 cursor-ew-resize z-40 hover:bg-[#6ee7b7]/20 transition-colors touch-none"
          />
          {/* South edge */}
          <div
            onPointerDown={(e) => handleResizePointerDown('s', e)}
            className="absolute bottom-0 left-3 right-3 h-3 cursor-ns-resize z-40 hover:bg-[#6ee7b7]/20 transition-colors touch-none"
          />
          {/* South-East corner handle */}
          <div
            onPointerDown={(e) => handleResizePointerDown('se', e)}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-end justify-end p-1 group touch-none"
            title="Drag to resize window"
          >
            <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-gray-400/60 group-hover:border-[#6ee7b7] group-active:border-[#6ee7b7] transition-colors" />
          </div>
        </>
      )}
    </div>
  );
};

