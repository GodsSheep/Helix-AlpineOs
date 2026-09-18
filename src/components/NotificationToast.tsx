import React, { useState, useEffect } from 'react';
import { Toast } from '../kernel/Toast';

interface ToastItem {
  id: number;
  message: string;
  icon: string;
}

export const NotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsub = Toast.subscribe((message, icon = '✓') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-3), { id, message, icon }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2600);
    });
    return unsub;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-12 right-3 z-50 flex flex-col gap-1.5 pointer-events-none select-none max-w-xs">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-[#12141c]/95 border border-white/20 text-[#edf1f7] text-xs px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <span className="text-sm shrink-0">{t.icon}</span>
          <span className="font-medium truncate">{t.message}</span>
        </div>
      ))}
    </div>
  );
};
