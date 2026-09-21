import React, { useState, useEffect } from 'react';
import { ThemeEngine, CustomThemeProfile } from '../../../kernel/ThemeEngine';
import { COLOR_SETTINGS, PRESET_THEMES, ColorPickerSetting } from '../../../kernel/CustomThemeService';
import { 
  Palette, 
  Terminal as TermIcon, 
  AppWindow, 
  LayoutGrid, 
  Sliders, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Eye, 
  Layers, 
  Cpu, 
  Copy 
} from 'lucide-react';

interface CustomThemeSettingsTabProps {
  notify: (msg: string) => void;
}

const DEFAULT_PROFILE: CustomThemeProfile = {
  terminalBg: '#0a0d14',
  terminalFg: '#e2e8f0',
  terminalCursor: '#6ee7b7',
  terminalPrompt: '#38bdf8',
  windowBg: '#11131f',
  windowBorder: '#1e293b',
  windowHeaderBg: '#0f172a',
  windowTitleFg: '#f8fafc',
  dockBg: '#0d1117',
  dockBorder: '#30363d',
  dockActiveDot: '#38bdf8',
  topBarBg: '#090d16',
  topBarFg: '#cbd5e1',
  accentPrimary: '#6ee7b7',
  accentSecondary: '#38bdf8',
};

export const CustomThemeSettingsTab: React.FC<CustomThemeSettingsTabProps> = ({ notify }) => {
  const [profile, setProfile] = useState<CustomThemeProfile>(() => {
    try {
      const saved = localStorage.getItem('helix_custom_theme_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PROFILE;
  });

  const [activeCategory, setActiveCategory] = useState<'all' | 'terminal' | 'window' | 'dock' | 'topbar'>('all');

  useEffect(() => {
    // Apply live to DOM
    ThemeEngine.setCustomProfile(profile);
    try {
      localStorage.setItem('helix_custom_theme_profile', JSON.stringify(profile));
    } catch {}
  }, [profile]);

  const handleColorChange = (key: keyof CustomThemeProfile, colorHex: string) => {
    setProfile((prev) => ({
      ...prev,
      [key]: colorHex,
    }));
  };

  const handleApplyPreset = (presetProfile: CustomThemeProfile, presetName: string) => {
    setProfile(presetProfile);
    notify(`Applied preset theme: ${presetName}`);
  };

  const handleResetDefaults = () => {
    setProfile(DEFAULT_PROFILE);
    notify('Theme reset to default Helix dark profile');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `helix-theme-${Date.now()}.json`);
    dlAnchorElem.click();
    notify('Exported custom theme JSON profile');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          setProfile((prev) => ({ ...prev, ...parsed }));
          notify('Successfully imported theme profile!');
        }
      } catch {
        notify('Failed to parse theme JSON file');
      }
    };
    reader.readAsText(file);
  };

  const filteredColorSettings = COLOR_SETTINGS.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory || item.category === 'accent'
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-cyan-950/30 border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            Custom Theme Creator & Studio
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Pick custom primary, secondary, and accent colors for Terminal, Window Frames, Dock, and Top Bar with live canvas preview.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Theme</span>
          </button>
          <label className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Preset Theme Quick Selector */}
      <div className="p-4 rounded-2xl bg-[#12141b] border border-white/10 space-y-3">
        <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Featured Preset Themes
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESET_THEMES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset.profile, preset.name)}
              className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-purple-500/40 text-left transition cursor-pointer group space-y-2"
            >
              <span className="text-xs font-bold text-gray-200 group-hover:text-white block truncate">
                {preset.name}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: preset.profile.terminalBg }} />
                <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: preset.profile.accentPrimary }} />
                <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: preset.profile.accentSecondary }} />
                <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: preset.profile.windowBorder }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview Canvas Frame */}
      <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/10 space-y-3">
        <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-cyan-400" />
          Real-Time Canvas Mockup Preview
        </span>

        {/* Desktop Container Preview */}
        <div className="rounded-xl border p-4 space-y-4 transition-all" style={{ backgroundColor: profile.windowBg, borderColor: profile.windowBorder }}>
          {/* Topbar Preview */}
          <div
            className="p-2 rounded-lg border flex items-center justify-between text-xs font-mono"
            style={{ backgroundColor: profile.topBarBg, color: profile.topBarFg, borderColor: profile.windowBorder }}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold">Helix OS</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">v9.3 LTS</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>CPU: 4%</span>
              <span style={{ color: profile.accentPrimary }}>RAM: 1.2 GB</span>
              <span>10:42 AM</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Terminal Preview */}
            <div
              className="p-3 rounded-xl border font-mono text-xs space-y-2 shadow-lg"
              style={{ backgroundColor: profile.terminalBg, color: profile.terminalFg, borderColor: profile.windowBorder }}
            >
              <div className="flex items-center justify-between text-[10px] pb-1 border-b opacity-60" style={{ borderColor: profile.windowBorder }}>
                <span>root@helix-vm:~</span>
                <span>bash</span>
              </div>
              <div className="space-y-1">
                <div>
                  <span style={{ color: profile.terminalPrompt }}>root@helix-vm:~$</span> helix-ai --status
                </div>
                <div className="text-[11px] opacity-80">
                  Helix Kernel v9.3 WASM ready. GPU WebGPU active.
                </div>
                <div className="flex items-center gap-1">
                  <span style={{ color: profile.terminalPrompt }}>root@helix-vm:~$</span>
                  <span className="w-2 h-4 inline-block animate-pulse" style={{ backgroundColor: profile.terminalCursor }} />
                </div>
              </div>
            </div>

            {/* Window Frame Preview */}
            <div
              className="rounded-xl border shadow-lg overflow-hidden flex flex-col"
              style={{ backgroundColor: profile.windowBg, borderColor: profile.windowBorder }}
            >
              <div
                className="p-2.5 flex items-center justify-between border-b text-xs font-semibold"
                style={{ backgroundColor: profile.windowHeaderBg, color: profile.windowTitleFg, borderColor: profile.windowBorder }}
              >
                <div className="flex items-center gap-2">
                  <AppWindow className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Settings — Custom Theme Preview</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                </div>
              </div>
              <div className="p-3 text-xs space-y-2">
                <p style={{ color: profile.windowTitleFg }}>Custom theme applied instantly across all DE sub-components.</p>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-black font-bold text-[11px]" style={{ backgroundColor: profile.accentPrimary }}>
                    Primary Accent Button
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-black font-bold text-[11px]" style={{ backgroundColor: profile.accentSecondary }}>
                    Secondary Accent Button
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dock Preview */}
          <div
            className="p-2 rounded-2xl border flex items-center justify-center gap-4 max-w-sm mx-auto shadow-2xl"
            style={{ backgroundColor: profile.dockBg, borderColor: profile.dockBorder }}
          >
            {['Terminal', 'Files', 'IDE', 'Settings'].map((app, idx) => (
              <div key={app} className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white text-xs font-bold">
                  {app[0]}
                </div>
                {idx === 0 && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: profile.dockActiveDot }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="p-4 rounded-2xl bg-[#12141b] border border-white/10 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            Component Color Customization Controls
          </h4>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 font-mono text-xs bg-black/40 p-1 rounded-xl border border-white/5">
            {[
              { id: 'all', label: 'All Colors' },
              { id: 'terminal', label: 'Terminal' },
              { id: 'window', label: 'Window' },
              { id: 'dock', label: 'Dock' },
              { id: 'topbar', label: 'Top Bar' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color Pickers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredColorSettings.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between gap-3 hover:border-white/15 transition"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-gray-200 block">{item.label}</span>
                <span className="text-[10px] font-mono text-gray-400 uppercase">{profile[item.key]}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={profile[item.key]}
                  onChange={(e) => handleColorChange(item.key, e.target.value)}
                  className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
