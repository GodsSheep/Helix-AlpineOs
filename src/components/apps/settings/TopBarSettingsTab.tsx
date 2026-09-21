import React from 'react';
import { HelixSettings } from '../../../kernel/Settings';
import { Clock, Battery, Wifi, Activity, Terminal, Sparkles, Sliders, Layout, Bell, Shield, Smartphone } from 'lucide-react';

interface TopBarSettingsTabProps {
  settings: HelixSettings;
  onUpdate: (partial: Partial<HelixSettings>) => void;
  notify: (msg: string) => void;
}

export const TopBarSettingsTab: React.FC<TopBarSettingsTabProps> = ({ settings, onUpdate, notify }) => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-blue-950/30 border border-emerald-500/20">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Layout className="w-5 h-5 text-emerald-400" />
          Top Bar, Menubar & Status Indicators
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Select which quick access shortcuts, system telemetry badges, hardware meters, and clock formats appear in the top menubar.
        </p>
      </div>

      {/* Section 1: Clock & Time Display */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Clock & Date Time Format
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Hour Format</label>
            <select
              value={settings.topbarClockFormat || '12h'}
              onChange={(e) => onUpdate({ topbarClockFormat: e.target.value as '12h' | '24h' })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="12h">12-Hour (AM/PM)</option>
              <option value="24h">24-Hour (Military / ISO)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Show Seconds (:ss)</div>
              <div className="text-[11px] text-gray-400">Continuous second ticking</div>
            </div>
            <input
              type="checkbox"
              checked={!!settings.topbarShowClockSeconds}
              onChange={(e) => onUpdate({ topbarShowClockSeconds: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Show Calendar Date</div>
              <div className="text-[11px] text-gray-400">Day and month label</div>
            </div>
            <input
              type="checkbox"
              checked={settings.topbarShowDate !== false}
              onChange={(e) => onUpdate({ topbarShowDate: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Granular Status Bar Items */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          Status Bar Buttons & Telemetry Monitors
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { id: 'topbarShowOsBadge', label: 'Helix OS Logo Badge', desc: 'Left corner logo dropdown', icon: Sparkles, val: settings.topbarShowOsBadge },
            { id: 'topbarShowShellButton', label: 'Terminal Shell Shortcut', desc: 'Direct topbar shell button', icon: Terminal, val: settings.topbarShowShellButton },
            { id: 'topbarShowActivityButton', label: 'CPU Activity Monitor', desc: 'Real-time CPU spike sparkline', icon: Activity, val: settings.topbarShowActivityButton },
            { id: 'topbarShowBattery', label: 'Battery Icon & Status', desc: 'Device charge meter', icon: Battery, val: settings.topbarShowBattery },
            { id: 'topbarShowWifi', label: 'Wi-Fi & Network Status', desc: 'Connection indicator', icon: Wifi, val: settings.topbarShowWifi },
            { id: 'topbarShowNotificationBell', label: 'Notification Center Bell', desc: 'Activity alert feed', icon: Bell, val: settings.topbarShowNotificationBell },
            { id: 'topbarShowQuickSettings', label: 'Quick Control Center Drawer', desc: 'Slider drawer button', icon: Sliders, val: settings.topbarShowQuickSettings },
            { id: 'topbarShowLinuxStatus', label: 'Linux Microkernel Status', desc: 'VFS & VM execution pip', icon: Shield, val: settings.topbarShowLinuxStatus },
            { id: 'topbarShowPwaInstall', label: 'PWA Install Prompt Button', desc: 'Install app to home screen', icon: Smartphone, val: settings.topbarShowPwaInstall },
          ].map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-white">{item.label}</span>
                </div>
                <div className="text-[10px] text-gray-400">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={item.val !== false}
                onChange={(e) => onUpdate({ [item.id]: e.target.checked })}
                className="w-4 h-4 accent-emerald-400 rounded cursor-pointer ml-2"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
