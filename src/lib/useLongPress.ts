import { useRef, useCallback } from 'react';

interface LongPressOptions {
  onLongPress: (e: React.MouseEvent | React.TouchEvent) => void;
  onClick?: (e: React.MouseEvent | React.TouchEvent) => void;
  delay?: number;
}

export function useLongPress({
  onLongPress,
  onClick,
  delay = 380,
}: LongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      isLongPressRef.current = false;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      startPosRef.current = { x: clientX, y: clientY };

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(35);
        }
        onLongPress(e);
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(
    (e: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (shouldTriggerClick && !isLongPressRef.current && onClick) {
        onClick(e);
      }
      startPosRef.current = null;
    },
    [onClick]
  );

  const move = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!startPosRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const dist = Math.hypot(clientX - startPosRef.current.x, clientY - startPosRef.current.y);
    if (dist > 10) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  return {
    onMouseDown: (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only primary mouse button for long-press
      start(e);
    },
    onMouseUp: (e: React.MouseEvent) => clear(e, true),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onMouseMove: move,
    onTouchStart: (e: React.TouchEvent) => start(e),
    onTouchEnd: (e: React.TouchEvent) => clear(e, true),
    onTouchMove: move,
  };
}
