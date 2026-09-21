import React from 'react';
import { Kernel } from '../../../kernel';
import { HelixSettings, WindowSizePreset, WindowTitlebarHeight, WindowCornerRadius, WindowBorderWidth, WindowGlowEffect, WindowControlsStyle, WindowDoubleClickAction, WindowAspectLock, WindowPlacementStrategy } from '../../../kernel/Settings';
import { SoundManager } from '../../../kernel/SoundManager';
import { 
  AppWindow, 
  Columns2, 
  Maximize2, 
  Minimize2, 
  Move, 
  Sparkles, 
  Grid, 
  Layers, 
  Square, 
  ChevronsUpDown, 
  Sliders, 
  Eye, 
  RotateCcw,
  Check
} from 'lucide-react';

interface WindowSettingsTabProps {
  settings: HelixSettings;
  onUpdate: (partial: Partial<HelixSettings>) => void;
  notify: (msg: string) => void;
}

export const WindowSettingsTab: React.FC<WindowSettingsTabProps> = ({ settings, onUpdate, notify }) => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-emerald-950/30 border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <AppWindow className="w-5 h-5 text-cyan-400" />
            Window Fit, Sizing & Layout Engine
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure initial window dimensions, responsive snapping thresholds, border aesthetics, titlebar behaviors, and active glow effects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              Kernel.wm.tileAllWindows();
              notify('All windows tiled automatically across screen grid');
            }}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5" />
            Tile All
          </button>
          <button
            onClick={() => {
              Kernel.wm.cascadeAllWindows();
              notify('All windows organized in cascading stack');
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            Cascade All
          </button>
        </div>
      </div>

      {/* Section 1: Window Default Size Presets */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-emerald-400" />
            Default App Launch Dimensions & Presets
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">
            Choose the default bounding rectangle used when opening new applications.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {[
            { id: 'compact', name: 'Compact', dims: '640 × 440 px', desc: 'Space saving, great for dual view' },
            { id: 'standard', name: 'Standard (Default)', dims: '800 × 520 px', desc: 'Balanced golden viewport' },
            { id: 'large', name: 'Large Workstation', dims: '1024 × 640 px', desc: 'Spacious for code & editors' },
            { id: 'wide', name: 'Widescreen HD', dims: '1200 × 700 px', desc: 'Panoramic productivity' },
            { id: 'ultrawide', name: 'Ultrawide Max', dims: '1440 × 780 px', desc: 'For large 2K/4K displays' },
            { id: 'maximized', name: 'Auto-Maximize', dims: '100% Screen', desc: 'Open apps in full display' },
            { id: 'custom', name: 'Custom Sizing', dims: `${settings.windowCustomWidth || 800} × ${settings.windowCustomHeight || 520} px`, desc: 'Custom user defined pixel values' },
          ].map((preset) => {
            const isSelected = settings.windowDefaultSize === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onUpdate({ windowDefaultSize: preset.id as WindowSizePreset })}
                className={`p-3 rounded-xl text-left border transition cursor-pointer relative flex flex-col justify-between h-24 ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-500/40'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{preset.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-300/90 mt-0.5">{preset.dims}</div>
                </div>
                <div className="text-[10px] text-gray-400 truncate">{preset.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Custom Width and Height Sliders */}
        {settings.windowDefaultSize === 'custom' && (
          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/30 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Custom Initial Width</span>
                <span className="font-mono text-emerald-400">{settings.windowCustomWidth || 800} px</span>
              </div>
              <input
                type="range"
                min="400"
                max="1920"
                step="10"
                value={settings.windowCustomWidth || 800}
                onChange={(e) => onUpdate({ windowCustomWidth: Number(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Custom Initial Height</span>
                <span className="font-mono text-emerald-400">{settings.windowCustomHeight || 520} px</span>
              </div>
              <input
                type="range"
                min="300"
                max="1200"
                step="10"
                value={settings.windowCustomHeight || 520}
                onChange={(e) => onUpdate({ windowCustomHeight: Number(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Window Snapping, Magnetism & Placement */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            <Move className="w-4 h-4 text-cyan-400" />
            Snapping, Edge Magnetism & Placement Strategy
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">
            Fine-tune magnetic edge adherence distance, touch drag gestures, and launch positioning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div>
                <div className="text-xs font-medium text-white">Screen Edge Magnetism</div>
                <div className="text-[11px] text-gray-400">Snap window to screen perimeter automatically when dragged close</div>
              </div>
              <input
                type="checkbox"
                checked={settings.windowEdgeMagnetism}
                onChange={(e) => onUpdate({ windowEdgeMagnetism: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div>
                <div className="text-xs font-medium text-white">Aero Shake (Solo Focus)</div>
                <div className="text-[11px] text-gray-400">Rapidly shake a titlebar horizontally to minimize all background windows</div>
              </div>
              <input
                type="checkbox"
                checked={settings.windowAeroShake}
                onChange={(e) => onUpdate({ windowAeroShake: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Snapping Magnetic Threshold</span>
                <span className="font-mono text-cyan-400">{settings.windowSnapThreshold || 15} px</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={settings.windowSnapThreshold || 15}
                onChange={(e) => onUpdate({ windowSnapThreshold: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Subtle (5px)</span>
                <span>Standard (15px)</span>
                <span>Aggressive (50px)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
              <label className="text-xs font-medium text-gray-300">New Window Placement Strategy</label>
              <select
                value={settings.windowDefaultPlacement || 'cascade'}
                onChange={(e) => onUpdate({ windowDefaultPlacement: e.target.value as WindowPlacementStrategy })}
                className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
              >
                <option value="cascade">Smart Cascading Stacks</option>
                <option value="center">Always Center on Screen</option>
                <option value="tile">Auto-Tile Adjacent Slots</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Window Titlebar, Corners, Borders & Glow */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Window Geometry, Corner Radius & Visual Accents
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">
            Customize window frame curvature, border line weights, control button styles, and active focus luminescence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Titlebar Height */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Titlebar Height & Compactness</label>
            <select
              value={settings.windowTitlebarHeight || 'standard'}
              onChange={(e) => onUpdate({ windowTitlebarHeight: e.target.value as WindowTitlebarHeight })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="minimal">Minimal Compact (28px)</option>
              <option value="compact">Comfortable Medium (34px)</option>
              <option value="standard">Standard Default (40px)</option>
              <option value="spacious">Spacious Touch (48px)</option>
            </select>
          </div>

          {/* Corner Radius */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Corner Curvature (Border Radius)</label>
            <select
              value={settings.windowCornerRadius || 'modern'}
              onChange={(e) => onUpdate({ windowCornerRadius: e.target.value as WindowCornerRadius })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="sharp">Sharp Rectangular (0px)</option>
              <option value="subtle">Subtle Curve (8px)</option>
              <option value="modern">Modern Smooth (16px)</option>
              <option value="curved">Pill Curved (22px)</option>
              <option value="extra-round">Extra Round (28px)</option>
            </select>
          </div>

          {/* Border Width */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Window Border Thickness</label>
            <select
              value={settings.windowBorderWidth || '1px'}
              onChange={(e) => onUpdate({ windowBorderWidth: e.target.value as WindowBorderWidth })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="none">Borderless (0px)</option>
              <option value="1px">Subtle Outline (1px)</option>
              <option value="2px">Crisp Outline (2px)</option>
              <option value="3px">Bold Accent (3px)</option>
            </select>
          </div>

          {/* Window Controls Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Controls Style</label>
            <select
              value={settings.windowControlsStyle || 'linux'}
              onChange={(e) => onUpdate({ windowControlsStyle: e.target.value as WindowControlsStyle })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="linux">Linux Modern Right Pills</option>
              <option value="mac">macOS Left Traffic Lights</option>
              <option value="windows">Windows Right Square Buttons</option>
            </select>
          </div>

          {/* Titlebar Double-Click Action */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Titlebar Double-Click Action</label>
            <select
              value={settings.windowTitlebarDoubleClick || 'maximize'}
              onChange={(e) => onUpdate({ windowTitlebarDoubleClick: e.target.value as WindowDoubleClickAction })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="maximize">Maximize / Restore Window</option>
              <option value="shade">Roll-up to Titlebar (Window Shade)</option>
              <option value="center">Center Window on Screen</option>
              <option value="snap-left">Snap Window to Left Half</option>
              <option value="fit-screen">Refit Windows within Viewport</option>
              <option value="none">Do Nothing</option>
            </select>
          </div>

          {/* Active Window Glow */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Active Window Glow Effect</label>
            <select
              value={settings.windowGlowEffect || 'medium'}
              onChange={(e) => onUpdate({ windowGlowEffect: e.target.value as WindowGlowEffect })}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white cursor-pointer"
            >
              <option value="none">No Glow (Flat)</option>
              <option value="subtle">Subtle Shadow</option>
              <option value="medium">Medium Ambient Shadow</option>
              <option value="high">High Contrast Drop Shadow</option>
              <option value="neon">Neon Accent Halo Glow</option>
            </select>
          </div>
        </div>

        {/* Inactive Window Opacity Slider */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 font-medium">Inactive Background Window Opacity</span>
            <span className="font-mono text-purple-400">{settings.windowInactiveOpacity || 95}%</span>
          </div>
          <input
            type="range"
            min="60"
            max="100"
            step="1"
            value={settings.windowInactiveOpacity || 95}
            onChange={(e) => onUpdate({ windowInactiveOpacity: Number(e.target.value) })}
            className="w-full accent-purple-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Translucent (60%)</span>
            <span>Subtle Glass (85%)</span>
            <span>Fully Opaque (100%)</span>
          </div>
        </div>
      </div>

      {/* Section 4: Aspect Ratio Constraint Locking */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
        <div>
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            <Columns2 className="w-4 h-4 text-amber-400" />
            Aspect Ratio Lock on Manual Resize
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">
            Enforce strict geometric proportions when dragging corner resize handles.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'freeform', label: 'Freeform', desc: 'Any ratio' },
            { id: '16:9', label: '16:9', desc: 'Widescreen HD' },
            { id: '4:3', label: '4:3', desc: 'Standard TV' },
            { id: '16:10', label: '16:10', desc: 'Display Gold' },
            { id: '3:2', label: '3:2', desc: 'Photo / Paper' },
          ].map((item) => {
            const isSelected = (settings.windowAspectLock || 'freeform') === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onUpdate({ windowAspectLock: item.id as WindowAspectLock })}
                className={`p-2.5 rounded-xl text-center border transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/40 text-amber-300'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-gray-300'
                }`}
              >
                <div className="text-xs font-semibold">{item.label}</div>
                <div className="text-[10px] text-gray-400">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Batch Management Actions */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
        <h4 className="text-sm font-medium text-white">Live Batch Window Operations</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            onClick={() => {
              Kernel.wm.shadeAll();
              notify('All active windows collapsed to titlebars');
            }}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-cyan-400" />
            Shade All Windows
          </button>
          <button
            onClick={() => {
              Kernel.wm.unshadeAll();
              notify('All window shades restored');
            }}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            Unshade All
          </button>
          <button
            onClick={() => {
              Kernel.wm.refitWindows();
              notify('All window bounds safe-fitted inside viewport');
            }}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
            Safe Refit All
          </button>
          <button
            onClick={() => {
              Kernel.wm.closeAll();
              notify('All opened windows closed');
            }}
            className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Square className="w-3.5 h-3.5" />
            Close All Windows
          </button>
        </div>
      </div>
    </div>
  );
};
