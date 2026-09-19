import React, { useState } from 'react';
import {
  Wrench,
  Terminal,
  Cpu,
  Layers,
  Code2,
  Play,
  Copy,
  CheckCircle,
  FileCode,
  ShieldAlert,
  Sliders,
  Settings,
  Sparkles,
  Monitor,
  Box,
  Binary,
  ArrowLeftRight,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { Kernel } from '../../kernel';

type Tab = 'wine' | 'translator' | 'inspector' | 'gui-server';

export const CrossPlatformToolsApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('wine');

  // Wine State
  const [windowsVersion, setWindowsVersion] = useState<string>('win11');
  const [wineRenderer, setWineRenderer] = useState<string>('dxvk');
  const [virtualDesktop, setVirtualDesktop] = useState<string>('1280x720');
  const [wineDllOverrides, setWineDllOverrides] = useState<string>('d3d11=n,b; ucrtbase=n; vcruntime140=n');
  const [executingExecutable, setExecutingExecutable] = useState<string>('notepad.exe');
  const [wineLogs, setWineLogs] = useState<string[]>([]);
  const [isWineRunning, setIsWineRunning] = useState<boolean>(false);

  // Translator State
  const [translatorMode, setTranslatorMode] = useState<'ps2bash' | 'bash2ps'>('ps2bash');
  const [sourceCode, setSourceCode] = useState<string>(
    `Get-Process | Where-Object { $_.CPU -gt 10 } | Select-Object -Property Name, Id, CPU`
  );
  const [translatedCode, setTranslatedCode] = useState<string>('');

  // PE/ELF Inspector State
  const [selectedBinary, setSelectedBinary] = useState<string>('helix_core.elf');
  const [binaryDetails, setBinaryDetails] = useState({
    arch: 'x86_64 (64-bit LSB ELF)',
    entryPoint: '0x0000000000401080',
    sections: [
      { name: '.text', size: '142 KB', flags: 'r-x (Executable Code)' },
      { name: '.rodata', size: '28 KB', flags: 'r-- (Read-Only Data)' },
      { name: '.data', size: '12 KB', flags: 'rw- (Read-Write Globals)' },
      { name: '.bss', size: '8 KB', flags: 'rw- (Uninitialized Data)' }
    ],
    imports: ['libc.so.6 (printf, malloc, execve)', 'libpthread.so.0', 'libm.so.6'],
    mitigations: {
      nx: true,
      aslr: true,
      canary: true,
      pie: true,
      safeSeh: true
    }
  });

  // GUI Server State
  const [activeGuiFramework, setActiveGuiFramework] = useState<'win32' | 'gtk' | 'qt' | 'tk'>('win32');
  const [guiPreviewTitle, setGuiPreviewTitle] = useState<string>('Win32 API Control Panel - DISPLAY=:0.0');

  const handleRunWineExecutable = () => {
    setIsWineRunning(true);
    SoundManager.play('open');
    setWineLogs(['[WINE 9.0] Booting Wine emulation engine on Helix Alpine kernel...']);

    setTimeout(() => {
      setWineLogs([
        `[WINE 9.0] Host OS: Alpine Linux 6.6 LTS (x86_64)`,
        `[WINE 9.0] Emulation Mode: ${windowsVersion.toUpperCase()} | Graphics API: ${wineRenderer.toUpperCase()}`,
        `[WINE 9.0] Virtual Desktop Resolution: ${virtualDesktop}`,
        `[WINE 9.0] DLL Overrides Applied: ${wineDllOverrides}`,
        `0024:fixme:kernel32:SetThreadStackGuarantee (0x0000000000100000): stub`,
        `0024:info:dxvk:DXVK 2.3 initialized for ${executingExecutable}`,
        `0024:success: Win32 process ${executingExecutable} started with PID 4092. GUI window mounted on Wayland display :0.0`
      ]);
      setIsWineRunning(false);
      SoundManager.play('success');
      Toast.show(`Wine executed ${executingExecutable} successfully`, '🍷');
    }, 800);
  };

  const handleTranslate = () => {
    SoundManager.play('click');
    if (translatorMode === 'ps2bash') {
      const output = sourceCode
        .replace(/Get-Process/g, 'ps aux')
        .replace(/Where-Object/g, 'awk')
        .replace(/Select-Object/g, 'grep')
        .replace(/\$_/g, '$');
      setTranslatedCode(`# Generated Bash script from PowerShell AST\n#!/bin/bash\n\n${output} | grep -v 'root'`);
    } else {
      setTranslatedCode(`# Generated PowerShell script from Bash script\n#Requires -Version 5.1\n\nGet-ChildItem -Path ./ | Where-Object { $_.Length -gt 100 }`);
    }
    Toast.show('Script translated successfully', '⚡');
  };

  return (
    <div className="h-full flex flex-col bg-[#0f111a] text-gray-100 select-none font-sans overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-[#151824] border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Cross-Platform Developer Tools</h2>
            <p className="text-[11px] text-gray-400">Wine Win32 emulation, PS/Bash translation, and PE/ELF inspection</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('wine')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'wine' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" /> Wine Win32
          </button>
          <button
            onClick={() => setActiveTab('translator')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'translator' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> Script Translator
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inspector' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Binary className="w-3.5 h-3.5" /> PE/ELF Inspector
          </button>
          <button
            onClick={() => setActiveTab('gui-server')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gui-server' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" /> GUI Display Server
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* TAB 1: Wine Win32 Emulation */}
        {activeTab === 'wine' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-full">
            <div className="p-3 bg-[#131622] rounded-2xl border border-white/10 space-y-3">
              <h3 className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                <Settings className="w-4 h-4" /> Wine Prefix Configuration
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-gray-400 block mb-1">Windows Target Version</label>
                  <select
                    value={windowsVersion}
                    onChange={(e) => setWindowsVersion(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option value="win11">Windows 11 (build 22631)</option>
                    <option value="win10">Windows 10 (build 19045)</option>
                    <option value="win7">Windows 7 SP1</option>
                    <option value="winxp">Windows XP SP3</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Graphics Backend</label>
                  <select
                    value={wineRenderer}
                    onChange={(e) => setWineRenderer(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option value="dxvk">DXVK (Direct3D 9/10/11 to Vulkan)</option>
                    <option value="wine3d">WINE3D (Direct3D to OpenGL)</option>
                    <option value="vkd3d">VKD3D (Direct3D 12 to Vulkan)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Virtual Desktop Mode</label>
                  <select
                    value={virtualDesktop}
                    onChange={(e) => setVirtualDesktop(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option value="1280x720">1280 x 720 (HD)</option>
                    <option value="1920x1080">1920 x 1080 (Full HD)</option>
                    <option value="1024x768">1024 x 768 (XGA)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">WINEDLLOVERRIDES</label>
                  <input
                    type="text"
                    value={wineDllOverrides}
                    onChange={(e) => setWineDllOverrides(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-yellow-300 font-mono"
                  />
                </div>

                <div className="pt-2">
                  <label className="text-gray-400 block mb-1">Target Binary Executable</label>
                  <input
                    type="text"
                    value={executingExecutable}
                    onChange={(e) => setExecutingExecutable(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>

                <button
                  onClick={handleRunWineExecutable}
                  disabled={isWineRunning}
                  className="w-full py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 mt-3 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isWineRunning ? 'Emulating...' : 'Run Win32 Application'}</span>
                </button>
              </div>
            </div>

            {/* Logs Console */}
            <div className="md:col-span-2 p-3 bg-black/80 rounded-2xl border border-white/10 font-mono text-xs text-green-400 space-y-1 overflow-y-auto min-h-[220px]">
              <div className="text-gray-500 text-[11px] border-b border-white/10 pb-1 flex items-center justify-between">
                <span>WINE EMULATION CONSOLE OUTPUT</span>
                <span>DISPLAY=:0.0</span>
              </div>
              {wineLogs.length === 0 ? (
                <div className="text-gray-600 italic py-4 text-center">Click "Run Win32 Application" to trigger emulation logs...</div>
              ) : (
                wineLogs.map((log, idx) => <div key={idx}>{log}</div>)
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PowerShell <-> Bash Translator */}
        {activeTab === 'translator' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-[#131622] p-2 rounded-xl border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTranslatorMode('ps2bash')}
                  className={`px-3 py-1 rounded-lg transition font-bold ${
                    translatorMode === 'ps2bash' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  PowerShell ➔ Bash
                </button>
                <button
                  onClick={() => setTranslatorMode('bash2ps')}
                  className={`px-3 py-1 rounded-lg transition font-bold ${
                    translatorMode === 'bash2ps' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Bash ➔ PowerShell
                </button>
              </div>

              <button
                onClick={handleTranslate}
                className="px-4 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" /> Translate Script
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">
                  Source Code ({translatorMode === 'ps2bash' ? 'PowerShell .ps1' : 'Bash .sh'})
                </label>
                <textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  className="w-full h-64 bg-black/80 border border-white/15 rounded-xl p-3 font-mono text-xs text-yellow-300 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">
                  Translated Output ({translatorMode === 'ps2bash' ? 'Bash .sh' : 'PowerShell .ps1'})
                </label>
                <textarea
                  readOnly
                  value={translatedCode || '# Click "Translate Script" to view translated syntax...'}
                  className="w-full h-64 bg-black/90 border border-white/15 rounded-xl p-3 font-mono text-xs text-emerald-300 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Binary Inspector */}
        {activeTab === 'inspector' && (
          <div className="space-y-3">
            <div className="p-3 bg-[#131622] rounded-xl border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Binary className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white">Selected Binary:</span>
                <select
                  value={selectedBinary}
                  onChange={(e) => setSelectedBinary(e.target.value)}
                  className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-white font-mono"
                >
                  <option value="helix_core.elf">helix_core.elf (ELF64 Linux Executable)</option>
                  <option value="wine_host.exe">wine_host.exe (PE32+ Windows Executable)</option>
                  <option value="libpython3.11.so">libpython3.11.so (Shared Object)</option>
                </select>
              </div>

              <span className="font-mono text-indigo-300 font-bold">{binaryDetails.arch}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Sections list */}
              <div className="p-3 bg-[#131622] rounded-2xl border border-white/10 space-y-2">
                <h4 className="font-bold text-xs text-gray-300">Binary Headers & Sections</h4>
                <div className="space-y-1.5 text-xs font-mono">
                  {binaryDetails.sections.map((sec, i) => (
                    <div key={i} className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-yellow-400 font-bold">{sec.name}</span>
                      <span className="text-gray-400">{sec.size}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Mitigations */}
              <div className="p-3 bg-[#131622] rounded-2xl border border-white/10 space-y-2">
                <h4 className="font-bold text-xs text-gray-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security Mitigations
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span>NX / DEP (Data Execution Prevention)</span>
                    <span className="text-emerald-400 font-bold">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span>ASLR / PIE (Position Independent)</span>
                    <span className="text-emerald-400 font-bold">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span>Stack Canary Guard</span>
                    <span className="text-emerald-400 font-bold">Enabled</span>
                  </div>
                </div>
              </div>

              {/* Imports */}
              <div className="p-3 bg-[#131622] rounded-2xl border border-white/10 space-y-2">
                <h4 className="font-bold text-xs text-gray-300">Imported Dynamic Libraries</h4>
                <div className="space-y-1.5 text-xs font-mono text-cyan-300">
                  {binaryDetails.imports.map((imp, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-black/40 border border-white/5 truncate">
                      {imp}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GUI Display Server */}
        {activeTab === 'gui-server' && (
          <div className="p-4 bg-[#131622] rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Alpine Virtual Wayland / X11 Server</h3>
                <p className="text-xs text-gray-400">Rendering cross-platform Win32, GTK, Qt & Tkinter widgets on DISPLAY=:0.0</p>
              </div>

              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => setActiveGuiFramework('win32')}
                  className={`px-2.5 py-1 rounded-lg transition font-bold ${
                    activeGuiFramework === 'win32' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Win32 API
                </button>
                <button
                  onClick={() => setActiveGuiFramework('gtk')}
                  className={`px-2.5 py-1 rounded-lg transition font-bold ${
                    activeGuiFramework === 'gtk' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  GTK 4
                </button>
                <button
                  onClick={() => setActiveGuiFramework('qt')}
                  className={`px-2.5 py-1 rounded-lg transition font-bold ${
                    activeGuiFramework === 'qt' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Qt 6
                </button>
              </div>
            </div>

            <div className="p-4 bg-black/90 border border-white/20 rounded-2xl space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-mono text-indigo-300 font-bold">{guiPreviewTitle}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                  60 FPS Hardware Accelerated
                </span>
              </div>

              <div className="p-4 bg-[#1e2230] rounded-xl border border-white/10 space-y-3">
                <h4 className="font-bold text-sm text-white">Cross-Platform Dialog Window</h4>
                <p className="text-xs text-gray-300">
                  This native widget is rendered seamlessly via Alpine Linux X11 server inside Helix OS context.
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <button className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition cursor-pointer">
                    Primary Action
                  </button>
                  <button className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 text-xs transition cursor-pointer">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
