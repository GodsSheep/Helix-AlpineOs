import React from 'react';
import { HelixSettings, DockIconSize, DockStyle, DockAlignment } from '../../../kernel/Settings';
import { Layout, Sparkles, MoveHorizontal, Sliders, Eye, Trash2, Layers } from 'lucide-react';

interface DockSettingsTabProps {
  settings: HelixSettings;
  onUpdate: (partial: Partial<HelixSettings>) => void;
  notify: (msg: string) => void;
}

export const DockSettingsTab: React.FC<DockSettingsTabProps> = ({ settings, onUpdate, notify }) => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/30 border border-blue-500/20">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Layout className="w-5 h-5 text-blue-400" />
          Dock, Taskbar & Launcher Architecture
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Customize screen orientation, floating pill styles, magnification physics, and dynamic active indicators.
        </p>
      </div>

      {/* Section 1: Position & Style */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <MoveHorizontal className="w-4 h-4 text-blue-400" />
          Position, Alignment & Geometric Style
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Position */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Screen Anchor Position</label>
            <select
              value={settings.dockPosition || 'bottom'}
              onChange={(e) => onUpdate({ dockPosition: e.target.value as 'bottom' | 'top' | 'left' | 'right' })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="bottom">Bottom Edge (macOS / ChromeOS style)</option>
              <option value="top">Top Edge</option>
              <option value="left">Left Edge (Ubuntu style)</option>
              <option value="right">Right Edge</option>
            </select>
          </div>

          {/* Alignment */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Dock Alignment</label>
            <select
              value={settings.dockAlignment || 'center'}
              onChange={(e) => onUpdate({ dockAlignment: e.target.value as DockAlignment })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="center">Centered (Default)</option>
              <option value="start">Start (Left / Top)</option>
              <option value="end">End (Right / Bottom)</option>
            </select>
          </div>

          {/* Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Dock Container Style</label>
            <select
              value={settings.dockStyle || 'floating'}
              onChange={(e) => onUpdate({ dockStyle: e.target.value as DockStyle })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="floating">Floating Rounded Pill</option>
              <option value="full-width">Full Width Edge Taskbar</option>
              <option value="pill">Ultra Minimal Glass Strip</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Icon Sizing & Magnification */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Icon Sizes & Hover Magnification Physics
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Icon Size */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Dock Icon Sizing</label>
            <select
              value={settings.dockIconSize || 'medium'}
              onChange={(e) => onUpdate({ dockIconSize: e.target.value as DockIconSize })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="micro">Micro (28px) - High density</option>
              <option value="small">Small (36px)</option>
              <option value="medium">Medium (44px) - Default</option>
              <option value="large">Large (56px)</option>
              <option value="xlarge">Extra Large (68px) - Touch friendly</option>
            </select>
          </div>

          {/* Magnification scale */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300 font-medium">Hover Magnification Factor</span>
              <span className="font-mono text-purple-400">{settings.dockMagnification ? `${settings.dockMagnificationScale || 1.25}x` : 'OFF'}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="1.75"
              step="0.05"
              disabled={!settings.dockMagnification}
              value={settings.dockMagnificationScale || 1.25}
              onChange={(e) => onUpdate({ dockMagnificationScale: Number(e.target.value) })}
              className="w-full accent-purple-400 cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>

        {/* Feature Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Hover Icon Magnification</div>
              <div className="text-[11px] text-gray-400">Scale app icons dynamically on mouse hover</div>
            </div>
            <input
              type="checkbox"
              checked={settings.dockMagnification !== false}
              onChange={(e) => onUpdate({ dockMagnification: e.target.checked })}
              className="w-4 h-4 accent-blue-400 rounded cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Active App Indicator Glow</div>
              <div className="text-[11px] text-gray-400">Display luminous indicator pip beneath running apps</div>
            </div>
            <input
              type="checkbox"
              checked={settings.dockShowActiveIndicators !== false}
              onChange={(e) => onUpdate({ dockShowActiveIndicators: e.target.checked })}
              className="w-4 h-4 accent-blue-400 rounded cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Show Trash Can in Dock</div>
              <div className="text-[11px] text-gray-400">Quick access to recycle bin at the end of dock</div>
            </div>
            <input
              type="checkbox"
              checked={settings.dockShowTrash !== false}
              onChange={(e) => onUpdate({ dockShowTrash: e.target.checked })}
              className="w-4 h-4 accent-blue-400 rounded cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Icon Bounce on App Launch</div>
              <div className="text-[11px] text-gray-400">Play responsive bounce animation when an app is launched</div>
            </div>
            <input
              type="checkbox"
              checked={settings.dockBounceOnLaunch !== false}
              onChange={(e) => onUpdate({ dockBounceOnLaunch: e.target.checked })}
              className="w-4 h-4 accent-blue-400 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
