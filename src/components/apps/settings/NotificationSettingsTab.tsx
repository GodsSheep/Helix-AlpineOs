import React, { useState, useEffect } from 'react';
import { 
  NotificationService, 
  FullNotificationSettings, 
  CategoryNotificationConfig 
} from '../../../kernel/NotificationService';
import { SoundManager } from '../../../kernel/SoundManager';
import { 
  Bell, 
  Moon, 
  Volume2, 
  VolumeX, 
  Sliders, 
  ShieldAlert, 
  Sparkles, 
  Clock, 
  Check, 
  RotateCcw, 
  Eye, 
  Zap, 
  Radio, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Send,
  Layers,
  Settings2
} from 'lucide-react';

interface NotificationSettingsTabProps {
  notify: (msg: string) => void;
}

export const NotificationSettingsTab: React.FC<NotificationSettingsTabProps> = ({ notify }) => {
  const [config, setConfig] = useState<FullNotificationSettings>(NotificationService.getSettings());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = NotificationService.subscribeSettings((newCfg) => {
      setConfig(newCfg);
    });
    return unsub;
  }, []);

  const handleUpdateGlobal = (partial: Partial<FullNotificationSettings>) => {
    NotificationService.updateSettings(partial);
    notify('Notification settings saved');
  };

  const handleUpdateCategory = (id: string, partial: Partial<CategoryNotificationConfig>) => {
    NotificationService.updateCategoryConfig(id, partial);
    notify('Category notification rule updated');
  };

  const handleReset = () => {
    NotificationService.resetNotificationSettings();
    notify('Notification settings restored to defaults');
  };

  const handleSendTestNotification = (cat: CategoryNotificationConfig) => {
    SoundManager.play('toast');
    NotificationService.add({
      title: `Test Alert: ${cat.name}`,
      message: `This is a test notification for priority [${cat.priority.toUpperCase()}]. Sound & DND rules verified.`,
      category: cat.category,
      icon: '🔔',
      priority: cat.priority,
    });
    notify(`Test notification sent for ${cat.name}`);
  };

  const filteredCategories = config.categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-indigo-950/30 border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            Notification Center & Alert Engine
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure global Do Not Disturb schedules, toast popup locations, auto-dismiss timers, and granular per-category alert behavior.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              NotificationService.toggleDnd();
              notify(`Do Not Disturb: ${!config.dndEnabled ? 'ENABLED' : 'DISABLED'}`);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              config.dndEnabled
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{config.dndEnabled ? 'DND Active' : 'Enable DND'}</span>
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Section 1: Master Controls & DND */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Master Switch & DND Card */}
        <div className="p-4 rounded-2xl bg-[#12141b] border border-white/10 space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-cyan-400" />
            Master Notification Controls
          </h4>

          {/* Master Enabled Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
            <div>
              <span className="text-xs font-semibold text-gray-200 block">System Notifications Master Switch</span>
              <span className="text-[11px] text-gray-400">Allow system apps and daemons to dispatch toasts & alerts</span>
            </div>
            <input
              type="checkbox"
              checked={config.masterEnabled}
              onChange={(e) => handleUpdateGlobal({ masterEnabled: e.target.checked })}
              className="w-4 h-4 accent-[#6ee7b7] cursor-pointer"
            />
          </div>

          {/* DND Toggle & Schedule */}
          <div className="space-y-3 p-3 rounded-xl bg-black/30 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-200 block flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-purple-400" />
                  Do Not Disturb (DND) Mode
                </span>
                <span className="text-[11px] text-gray-400">Silence all standard toasts & chime sounds</span>
              </div>
              <input
                type="checkbox"
                checked={config.dndEnabled}
                onChange={(e) => handleUpdateGlobal({ dndEnabled: e.target.checked })}
                className="w-4 h-4 accent-purple-400 cursor-pointer"
              />
            </div>

            {/* DND Schedule */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Scheduled Quiet Hours</span>
                <input
                  type="checkbox"
                  checked={config.dndScheduleEnabled}
                  onChange={(e) => handleUpdateGlobal({ dndScheduleEnabled: e.target.checked })}
                  className="w-3.5 h-3.5 accent-purple-400 cursor-pointer"
                />
              </div>
              {config.dndScheduleEnabled && (
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Quiet Hours Start</label>
                    <input
                      type="time"
                      value={config.dndStartTime}
                      onChange={(e) => handleUpdateGlobal({ dndStartTime: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Quiet Hours End</label>
                    <input
                      type="time"
                      value={config.dndEndTime}
                      onChange={(e) => handleUpdateGlobal({ dndEndTime: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Sound & Visual Layout Card */}
        <div className="p-4 rounded-2xl bg-[#12141b] border border-white/10 space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            Sound & Visual Display Layout
          </h4>

          {/* Sound Settings */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-200 block">Notification Sound Effects</span>
                <span className="text-[11px] text-gray-400">Play audio chime on incoming toast notifications</span>
              </div>
              <input
                type="checkbox"
                checked={config.globalSoundEnabled}
                onChange={(e) => handleUpdateGlobal({ globalSoundEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#6ee7b7] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Global Sound Theme</label>
                <select
                  value={config.globalSoundTheme}
                  onChange={(e) => handleUpdateGlobal({ globalSoundTheme: e.target.value as any })}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs cursor-pointer"
                >
                  <option value="chime">Chime (Default)</option>
                  <option value="scifi">Sci-Fi Synth</option>
                  <option value="radar">Radar Pulse</option>
                  <option value="classic">Classic Bell</option>
                  <option value="subtle">Subtle Click</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Toast Position</label>
                <select
                  value={config.toastPosition}
                  onChange={(e) => handleUpdateGlobal({ toastPosition: e.target.value as any })}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs cursor-pointer"
                >
                  <option value="top-right">Top Right</option>
                  <option value="top-center">Top Center</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-center">Bottom Center</option>
                </select>
              </div>
            </div>
          </div>

          {/* Toast Duration Slider */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300 font-semibold">Toast Banner Duration</span>
              <span className="font-mono text-[#6ee7b7] font-bold">{(config.toastDurationMs / 1000).toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="1000"
              max="10000"
              step="500"
              value={config.toastDurationMs}
              onChange={(e) => handleUpdateGlobal({ toastDurationMs: Number(e.target.value) })}
              className="w-full accent-[#6ee7b7] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>1.0s (Fast)</span>
              <span>5.0s</span>
              <span>10.0s (Sticky)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Per-Category Customization ("Customization for Everything") */}
      <div className="p-4 rounded-2xl bg-[#12141b] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Per-Category Granular Customization Rules
            </h4>
            <p className="text-xs text-gray-400">
              Customize sounds, priority levels, toast banners, and DND bypass rules for every system category.
            </p>
          </div>

          {/* Search Category */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search category rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 w-full sm:w-56"
            />
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3 hover:border-white/15 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: cat.colorTag }}
                  />
                  <span className="font-bold text-white text-xs">{cat.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendTestNotification(cat)}
                    className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
                    title="Send Test Notification"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="checkbox"
                    checked={cat.enabled}
                    onChange={(e) => handleUpdateCategory(cat.id, { enabled: e.target.checked })}
                    className="w-4 h-4 accent-[#6ee7b7] cursor-pointer"
                  />
                </div>
              </div>

              {cat.enabled ? (
                <div className="space-y-2 text-xs pt-1 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Sound Toggle */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <span className="text-[11px] text-gray-300">Play Audio Chime</span>
                      <input
                        type="checkbox"
                        checked={cat.soundEnabled}
                        onChange={(e) => handleUpdateCategory(cat.id, { soundEnabled: e.target.checked })}
                        className="w-3.5 h-3.5 accent-[#6ee7b7] cursor-pointer"
                      />
                    </div>

                    {/* Toast Banner Toggle */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <span className="text-[11px] text-gray-300">Show Toast Banner</span>
                      <input
                        type="checkbox"
                        checked={cat.toastBannerEnabled}
                        onChange={(e) => handleUpdateCategory(cat.id, { toastBannerEnabled: e.target.checked })}
                        className="w-3.5 h-3.5 accent-[#6ee7b7] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Priority Selector */}
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Priority Level</label>
                      <select
                        value={cat.priority}
                        onChange={(e) => handleUpdateCategory(cat.id, { priority: e.target.value as any })}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-white text-xs cursor-pointer font-mono"
                      >
                        <option value="critical">Critical (Red)</option>
                        <option value="high">High (Amber)</option>
                        <option value="normal">Normal (Blue)</option>
                        <option value="low">Low (Gray)</option>
                      </select>
                    </div>

                    {/* DND Bypass Switch */}
                    <div className="flex flex-col justify-end">
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-purple-950/20 border border-purple-500/20">
                        <span className="text-[10px] text-purple-300 font-semibold flex items-center gap-1">
                          <Moon className="w-3 h-3 text-purple-400" />
                          DND Bypass
                        </span>
                        <input
                          type="checkbox"
                          checked={cat.dndBypass}
                          onChange={(e) => handleUpdateCategory(cat.id, { dndBypass: e.target.checked })}
                          className="w-3.5 h-3.5 accent-purple-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 text-[11px]">
                  Notifications disabled for this category.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
