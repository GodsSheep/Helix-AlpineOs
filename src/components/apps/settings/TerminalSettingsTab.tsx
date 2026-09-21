import React from 'react';
import { HelixSettings } from '../../../kernel/Settings';
import { Terminal, Type, Sparkles, Sliders, Bell, Copy, MousePointer } from 'lucide-react';

interface TerminalSettingsTabProps {
  settings: HelixSettings;
  onUpdate: (partial: Partial<HelixSettings>) => void;
  notify: (msg: string) => void;
}

export const TerminalSettingsTab: React.FC<TerminalSettingsTabProps> = ({ settings, onUpdate, notify }) => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-green-950/30 border border-emerald-500/20">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          Terminal & Shell Environment Customization
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Configure terminal font typography, cursor geometries, buffer depths, and interactive shell behaviors.
        </p>
      </div>

      {/* Section 1: Typography & Font Family */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Type className="w-4 h-4 text-emerald-400" />
          Terminal Font & Typography Engine
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Monospace Font Family</label>
            <select
              value={settings.terminalFontFamily || 'JetBrains Mono, Fira Code, Menlo, Monaco, monospace'}
              onChange={(e) => onUpdate({ terminalFontFamily: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer font-mono"
            >
              <option value="JetBrains Mono, Fira Code, Menlo, Monaco, monospace">JetBrains Mono (Default)</option>
              <option value="'Fira Code', Menlo, Monaco, monospace">Fira Code (Ligatures)</option>
              <option value="'Courier New', Courier, monospace">Courier New (Classic Retro)</option>
              <option value="Menlo, Monaco, Consolas, monospace">Menlo / Monaco / Consolas</option>
              <option value="'Source Code Pro', monospace">Source Code Pro</option>
              <option value="monospace">System Default Monospace</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300 font-medium">Terminal Font Size</span>
              <span className="font-mono text-emerald-400">{settings.terminalFontSize || 13} px</span>
            </div>
            <input
              type="range"
              min="10"
              max="24"
              step="1"
              value={settings.terminalFontSize || 13}
              onChange={(e) => onUpdate({ terminalFontSize: Number(e.target.value) })}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Compact (10px)</span>
              <span>Default (13px)</span>
              <span>Spacious (24px)</span>
            </div>
          </div>
        </div>

        {/* Live Terminal Preview Box */}
        <div 
          className="p-3 rounded-xl bg-[#08090d] border border-emerald-500/30 text-emerald-400 font-mono text-xs overflow-x-auto select-none"
          style={{ 
            fontFamily: settings.terminalFontFamily || 'monospace', 
            fontSize: `${settings.terminalFontSize || 13}px`,
            opacity: (settings.terminalOpacity || 95) / 100 
          }}
        >
          <div className="text-gray-500"># Helix Linux Terminal Preview</div>
          <div><span className="text-cyan-400">helix@user</span>:<span className="text-amber-300">~</span>$ uname -a</div>
          <div className="text-gray-300">Linux helix-vm 6.6.14-helix-x86_64 SMP PREEMPT x86_64 GNU/Linux</div>
          <div><span className="text-cyan-400">helix@user</span>:<span className="text-amber-300">~</span>$ echo "Terminal styling verified"</div>
          <div className="text-emerald-300">Terminal styling verified</div>
        </div>
      </div>

      {/* Section 2: Cursor & Buffer Configuration */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          Cursor, Buffer & Interaction Preferences
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Cursor Geometry Style</label>
            <select
              value={settings.terminalCursor || 'block'}
              onChange={(e) => onUpdate({ terminalCursor: e.target.value as 'block' | 'underline' | 'bar' })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="block">Solid Block (█)</option>
              <option value="underline">Underline Accent (_)</option>
              <option value="bar">Thin Vertical Bar (|)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Scrollback History Buffer</label>
            <select
              value={settings.terminalScrollback || 5000}
              onChange={(e) => onUpdate({ terminalScrollback: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="1000">1,000 lines (Low RAM)</option>
              <option value="5000">5,000 lines (Standard)</option>
              <option value="10000">10,000 lines (Deep History)</option>
              <option value="50000">50,000 lines (Power User)</option>
            </select>
          </div>
        </div>

        {/* Toggles grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-200">Cursor Blinking Animation</span>
            </div>
            <input
              type="checkbox"
              checked={settings.terminalCursorBlink !== false}
              onChange={(e) => onUpdate({ terminalCursorBlink: e.target.checked })}
              className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-200">Audio Bell on ASCII \a / Error</span>
            </div>
            <input
              type="checkbox"
              checked={settings.terminalBellSound !== false}
              onChange={(e) => onUpdate({ terminalBellSound: e.target.checked })}
              className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-200">Auto-Copy on Mouse Selection</span>
            </div>
            <input
              type="checkbox"
              checked={!!settings.terminalCopyOnSelect}
              onChange={(e) => onUpdate({ terminalCopyOnSelect: e.target.checked })}
              className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-200">Right-Click to Paste Clipboard</span>
            </div>
            <input
              type="checkbox"
              checked={settings.terminalRightClickPaste !== false}
              onChange={(e) => onUpdate({ terminalRightClickPaste: e.target.checked })}
              className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Terminal Window Opacity Slider */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 font-medium">Terminal Window Background Opacity</span>
            <span className="font-mono text-emerald-400">{settings.terminalOpacity || 95}%</span>
          </div>
          <input
            type="range"
            min="60"
            max="100"
            step="1"
            value={settings.terminalOpacity || 95}
            onChange={(e) => onUpdate({ terminalOpacity: Number(e.target.value) })}
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
