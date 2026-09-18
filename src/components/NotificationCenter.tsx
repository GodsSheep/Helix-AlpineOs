import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  BellOff, 
  Check, 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  Globe, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  ExternalLink, 
  CheckCheck, 
  ShieldAlert, 
  Radio, 
  Sparkles,
  X
} from 'lucide-react';
import { NotificationService, HelixNotification } from '../kernel/NotificationService';
import { Kernel } from '../kernel';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp: (appId: string, args?: Record<string, unknown>) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onOpenApp,
}) => {
  const [notifications, setNotifications] = useState<HelixNotification[]>([]);
  const [isDnd, setIsDnd] = useState(NotificationService.getIsDndEnabled());
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'kernel' | 'apps'>('all');
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());

  // Timer / Stopwatch state
  const [timerSeconds, setTimerSeconds] = useState(300); // default 5 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Swipe gesture state for individual notifications
  const [swipableId, setSwipableId] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = NotificationService.subscribe((list) => {
      setNotifications(list);
      setIsDnd(NotificationService.getIsDndEnabled());
    });
    return () => unsub();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            NotificationService.add({
              title: 'Countdown Timer Expired!',
              message: 'Helix DE timer completed.',
              icon: '⏱️',
              category: 'system',
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Click outside to close
  useEffect(() => {
    const handleOutside = (e: PointerEvent) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Prevent closing if clicking time clock button in menubar
        const target = e.target as HTMLElement;
        if (!target.closest('#time-clock-btn')) {
          onClose();
        }
      }
    };
    window.addEventListener('pointerdown', handleOutside);
    return () => window.removeEventListener('pointerdown', handleOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'kernel') return n.category === 'kernel' || n.category === 'network' || n.category === 'security';
    if (activeTab === 'apps') return n.category === 'app' || n.category === 'cron';
    return true;
  });

  const unreadCount = NotificationService.getUnreadCount();

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // World Clocks live times
  const getTimeInZone = (timeZone: string) => {
    try {
      return new Date().toLocaleTimeString([], { timeZone, hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 30) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Swipe notification card handlers
  const handleNotifTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleNotifTouchMove = (e: React.TouchEvent, id: string) => {
    if (!touchStartRef.current) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    if (dx < -40) {
      setSwipableId(id);
    } else if (dx > 20) {
      setSwipableId(null);
    }
  };

  const handleNotifTouchEnd = (id: string) => {
    if (swipableId === id) {
      // Swipe left removes notification
      NotificationService.remove(id);
      setSwipableId(null);
    }
    touchStartRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      style={{ top: 'calc(44px + env(safe-area-inset-top, 0px))' }}
      className="fixed right-2 sm:right-4 z-[9990] w-[calc(100vw-16px)] sm:w-[420px] max-h-[calc(100vh-60px)] bg-[#0d0f17]/98 border border-white/20 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col overflow-hidden text-[#edf1f7] text-xs animate-in slide-in-from-top-3 duration-200"
    >
      {/* Header Bar */}
      <div className="p-3.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#6ee7b7]/15 border border-[#6ee7b7]/30 flex items-center justify-center text-[#6ee7b7]">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
              Notification Center
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#6ee7b7] text-black">
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-gray-400">System Activity & Calendar Agenda Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const next = NotificationService.toggleDnd();
              setIsDnd(next);
            }}
            className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] font-medium ${
              isDnd
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
            title={isDnd ? 'Do Not Disturb Active' : 'Enable Do Not Disturb'}
          >
            {isDnd ? <BellOff className="w-3.5 h-3.5 text-amber-300" /> : <Bell className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">{isDnd ? 'DND' : 'Alerts'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        {/* Interactive Calendar & Agenda Widget */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#6ee7b7]" />
              <span className="font-bold text-sm text-white">{monthNames[month]} {year}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-[#6ee7b7] font-mono cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 transition cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px]">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-gray-500 font-bold py-0.5">{d}</div>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="py-1" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isToday =
                dayNum === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();
              const isSelected = dayNum === selectedDate;

              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDate(dayNum)}
                  className={`py-1 rounded-lg transition text-xs font-semibold cursor-pointer ${
                    isToday
                      ? 'bg-[#6ee7b7] text-black font-bold shadow-[0_0_10px_#6ee7b7]'
                      : isSelected
                      ? 'bg-white/20 text-white border border-[#6ee7b7]/50'
                      : 'hover:bg-white/10 text-gray-300'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Upcoming Agenda Items for Selected Day */}
          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">
              Agenda for {monthNames[month]} {selectedDate}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6ee7b7]" />
                  <span className="text-gray-200">System VFS Auto-Sync (`/mnt/helix`)</span>
                </div>
                <span className="font-mono text-gray-400 text-[10px]">08:00 AM</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="text-gray-200">Netfilter Firewall Rules Refresh</span>
                </div>
                <span className="font-mono text-gray-400 text-[10px]">12:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* World Clocks & Quick Timer */}
        <div className="grid grid-cols-2 gap-2">
          {/* World Clocks */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>World Clocks</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between text-gray-300">
                <span>Tokyo (JST)</span>
                <span className="text-[#6ee7b7] font-semibold">{getTimeInZone('Asia/Tokyo')}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>London (GMT)</span>
                <span className="text-cyan-300 font-semibold">{getTimeInZone('Europe/London')}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>New York (EDT)</span>
                <span className="text-amber-300 font-semibold">{getTimeInZone('America/New_York')}</span>
              </div>
            </div>
          </div>

          {/* Quick Timer */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Timer</span>
            </div>
            <div className="text-center font-mono text-lg font-bold text-amber-300">
              {formatTimer(timerSeconds)}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <button
                onClick={() => setIsTimerRunning((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  isTimerRunning ? 'bg-amber-500/30 text-amber-300' : 'bg-[#6ee7b7]/20 text-[#6ee7b7]'
                }`}
              >
                {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {isTimerRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(300);
                }}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 cursor-pointer"
                title="Reset to 5 mins"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
              {(['all', 'unread', 'kernel', 'apps'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-lg font-medium text-[11px] capitalize transition cursor-pointer ${
                    activeTab === tab
                      ? 'bg-[#6ee7b7] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => NotificationService.markAllAsRead()}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 transition cursor-pointer"
                  title="Mark All Read"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-[#6ee7b7]" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => NotificationService.clearAll()}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-red-400 transition cursor-pointer"
                  title="Clear All Notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
              <BellOff className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-gray-400 font-medium text-xs">No notifications in this category</p>
              <p className="text-[11px] text-gray-500">System events and app logs will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onTouchStart={(e) => handleNotifTouchStart(e, n.id)}
                  onTouchMove={(e) => handleNotifTouchMove(e, n.id)}
                  onTouchEnd={() => handleNotifTouchEnd(n.id)}
                  className={`group relative p-3 rounded-2xl border transition-all duration-200 ${
                    n.isRead
                      ? 'bg-white/[0.02] border-white/5 opacity-80 hover:opacity-100'
                      : 'bg-white/[0.07] border-[#6ee7b7]/30 shadow-lg'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg p-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                      {n.icon}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-bold text-xs truncate ${n.isRead ? 'text-gray-300' : 'text-white'}`}>
                          {n.title}
                        </h4>
                        <span className="text-[10px] font-mono text-gray-400 shrink-0">
                          {formatTimeAgo(n.timestamp)}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-300 leading-snug mt-0.5 line-clamp-2">
                        {n.message}
                      </p>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                          {n.actionAppId && (
                            <button
                              onClick={() => {
                                NotificationService.markAsRead(n.id);
                                onOpenApp(n.actionAppId!, n.actionArgs);
                                onClose();
                              }}
                              className="px-2 py-0.5 rounded-lg bg-[#6ee7b7]/15 hover:bg-[#6ee7b7]/25 text-[#6ee7b7] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Open App</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {!n.isRead && (
                            <button
                              onClick={() => NotificationService.markAsRead(n.id)}
                              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-[#6ee7b7] cursor-pointer"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => NotificationService.remove(n.id)}
                            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-3.5 py-2 bg-white/[0.02] border-t border-white/10 text-[10px] font-mono text-gray-400 flex items-center justify-between">
        <span>Helix Wayland Bus</span>
        <span>Swipe left on card to dismiss</span>
      </div>
    </div>
  );
};
