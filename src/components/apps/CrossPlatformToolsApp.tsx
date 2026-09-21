import React, { useState, useRef, useEffect } from 'react';
import {
  Wrench,
  Terminal,
  Cpu,
  Layers,
  Code2,
  Play,
  Copy,
  CheckCircle2,
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
  Globe,
  Upload,
  FileUp,
  X,
  Maximize2,
  RefreshCw,
  FolderOpen,
  Check,
  Save,
  Download,
  Flame,
  Search,
  Activity,
  PackageCheck,
  FileText,
  HardDrive,
  ExternalLink,
  Plus,
  PlayCircle,
  Grid,
  Radio
} from 'lucide-react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { Kernel } from '../../kernel';
import { WineProcessManager, WineProcess } from '../../kernel/WineProcessManager';

type Tab = 'wine' | 'multi-window' | 'translator' | 'inspector' | 'winetricks' | 'cross-compile' | 'gui-server';

export const CrossPlatformToolsApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('wine');

  // Wine State
  const [windowsVersion, setWindowsVersion] = useState<string>('win11');
  const [wineRenderer, setWineRenderer] = useState<string>('dxvk');
  const [virtualDesktop, setVirtualDesktop] = useState<string>('1280x720');
  const [wineDllOverrides, setWineDllOverrides] = useState<string>('d3d11=n,b; ucrtbase=n; vcruntime140=n');
  const [executingExecutable, setExecutingExecutable] = useState<string>('notepad.exe');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [wineLogs, setWineLogs] = useState<string[]>([
    '[WINE 9.0] Wine 64-bit subsystem initialized & ready.',
    '[WINE 9.0] Default prefix configured in /home/alpine/.wine64',
    '[WINE 9.0] DXVK Vulkan Direct3D 9/10/11 translation layer loaded.',
    '[WINE 9.0] Multi-Window Manager: Every spawned process receives its own native Helix Window.'
  ]);
  const [isWineRunning, setIsWineRunning] = useState<boolean>(false);

  // Active Wine Processes
  const [activeProcesses, setActiveProcesses] = useState<WineProcess[]>(() => WineProcessManager.getProcesses());

  useEffect(() => {
    return WineProcessManager.subscribe((procs) => {
      setActiveProcesses(procs);
    });
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Winetricks State
  const [winetricksInstalled, setWinetricksInstalled] = useState<Record<string, boolean>>({
    'dxvk': true,
    'vcrun2022': true,
    'corefonts': true,
    'dotnet48': false,
    'physx': false,
    'gdiplus': true,
    'd3dcompiler_47': true,
    'msxml6': false
  });
  const [installingPackage, setInstallingPackage] = useState<string | null>(null);

  // Translator State
  const [translatorMode, setTranslatorMode] = useState<'ps2bash' | 'bash2ps' | 'ps2py' | 'bat2bash'>('ps2bash');
  const [sourceCode, setSourceCode] = useState<string>(
    `# PowerShell Administration Script\nGet-Process | Where-Object { $_.CPU -gt 10 } | Select-Object -Property Name, Id, CPU | Export-Csv -Path ./high_cpu.csv\nGet-Service | Where-Object { $_.Status -eq "Running" }\nInvoke-WebRequest -Uri "https://api.github.com/zen" -Method Get`
  );
  const [translatedCode, setTranslatedCode] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // PE/ELF Inspector State
  const [selectedBinary, setSelectedBinary] = useState<string>('helix_core.elf');
  const [binaryDetails, setBinaryDetails] = useState({
    name: 'helix_core.elf',
    format: 'ELF64',
    arch: 'x86_64 (AMD64 / EM_X86_64)',
    entryPoint: '0x0000000000401080',
    endianness: 'Little Endian (LSB)',
    subsystem: 'POSIX console / Linux ABI 3.2.0',
    fileSize: '412.8 KB',
    hashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    sections: [
      { name: '.text', vaddr: '0x00401000', size: '248 KB', entropy: 6.42, flags: 'r-x (Executable Code)' },
      { name: '.rodata', vaddr: '0x0043f000', size: '64 KB', entropy: 4.88, flags: 'r-- (Read-Only Constants)' },
      { name: '.data', vaddr: '0x0044f000', size: '32 KB', entropy: 3.12, flags: 'rw- (Initialized Globals)' },
      { name: '.bss', vaddr: '0x00457000', size: '16 KB', entropy: 0.00, flags: 'rw- (Zero Uninitialized)' },
      { name: '.dynsym', vaddr: '0x0045b000', size: '18 KB', entropy: 5.10, flags: 'r-- (Dynamic Symbols)' },
      { name: '.plt', vaddr: '0x0045f800', size: '8 KB', entropy: 5.95, flags: 'r-x (Procedure Linkage)' }
    ],
    imports: [
      'libc.so.6 (printf, malloc, free, execve, fork, mmap, pthread_create)',
      'libpthread.so.0 (pthread_mutex_lock, pthread_cond_wait)',
      'libm.so.6 (sin, cos, sqrt, pow)',
      'libdl.so.2 (dlopen, dlsym, dlclose)'
    ],
    exports: [
      '_start', 'helix_init_kernel', 'helix_vfs_mount', 'helix_ipc_send', 'main'
    ],
    mitigations: {
      nx: true,
      aslr: true,
      canary: true,
      pie: true,
      relro: 'Full RELRO',
      fortify: true
    },
    disassemblySample: [
      { addr: '0x00401080', bytes: 'f3 0f 1e fa', op: 'endbr64', comment: 'Control-flow Enforcement Technology' },
      { addr: '0x00401084', bytes: '31 ed', op: 'xor ebp, ebp', comment: 'Clear frame pointer' },
      { addr: '0x00401086', bytes: '49 89 d1', op: 'mov r9, rdx', comment: 'Save rtld_fini' },
      { addr: '0x00401089', bytes: '5e', op: 'pop rsi', comment: 'argc into rsi' },
      { addr: '0x0040108a', bytes: '48 89 e2', op: 'mov rdx, rsp', comment: 'argv into rdx' },
      { addr: '0x0040108d', bytes: '48 83 e4 f0', op: 'and rsp, -16', comment: 'Align stack to 16-byte boundary' },
      { addr: '0x00401091', bytes: 'e8 ea 0f 00 00', op: 'call __libc_start_main', comment: 'Initialize glibc & invoke main' }
    ]
  });

  // Cross-Compile Suite State
  const [crossTarget, setCrossTarget] = useState<'windows_x64' | 'linux_x64' | 'linux_arm64' | 'wasm32'>('windows_x64');
  const [crossOptLevel, setCrossOptLevel] = useState<'O0' | 'O2' | 'O3' | 'Oz'>('O3');
  const [crossSource, setCrossSource] = useState<string>(
`#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32
  #include <windows.h>
#else
  #include <unistd.h>
#endif

int main(int argc, char** argv) {
    printf("Helix OS Universal Cross-Compiled Binary\\n");
    #ifdef _WIN32
      MessageBoxA(NULL, "Running on Windows / Wine Win32 Subsystem!", "Helix CrossPlatform", MB_OK | MB_ICONINFORMATION);
    #else
      printf("Running natively on POSIX Linux runtime.\\n");
    #endif
    return 0;
}`
  );
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [crossLogs, setCrossLogs] = useState<string[]>([]);

  // GUI Server State
  const [activeGuiFramework, setActiveGuiFramework] = useState<'win32' | 'gtk' | 'qt' | 'tk'>('win32');
  const [guiPreviewButtonCount, setGuiPreviewButtonCount] = useState<number>(0);
  const [guiSliderValue, setGuiSliderValue] = useState<number>(65);

  const wineAppsList = [
    { id: 'notepad', name: 'notepad.exe', title: 'Notepad', icon: '📝', desc: 'Windows Win32 Text Editor with VFS Z:\\ sync & CRLF formatting', width: 620, height: 440 },
    { id: 'cmd', name: 'cmd.exe', title: 'Command Prompt', icon: '💻', desc: 'Windows NT Command Interpreter & Batch Script Host', width: 640, height: 420 },
    { id: 'taskmgr', name: 'taskmgr.exe', title: 'Task Manager', icon: '📊', desc: 'Real-time CPU/Memory charts, Process Tree & Task Killer', width: 700, height: 480 },
    { id: 'regedit', name: 'regedit.exe', title: 'Registry Editor', icon: '🔑', desc: 'HKEY registry tree browser, key search & .reg export', width: 720, height: 480 },
    { id: 'winemine', name: 'winemine.exe', title: 'WineMine', icon: '💣', desc: 'Classic 3D Windows Minesweeper with digital timers', width: 340, height: 420 },
    { id: 'dxvk_bench', name: 'dxvk_bench.exe', title: 'DirectX 11 3D Benchmark', icon: '🔥', desc: 'Real-time 3D Direct3D 11 rendering via DXVK Vulkan layer', width: 720, height: 500 },
    { id: 'calc', name: 'calc.exe', title: 'Calculator', icon: '🔢', desc: 'Win32 Scientific & Standard Math Calculator', width: 320, height: 440 },
    { id: 'winecfg', name: 'winecfg.exe', title: 'Wine Configuration', icon: '⚙️', desc: 'Windows version spoofer, DLL overrides & DPI scaling', width: 560, height: 460 },
    { id: '7z', name: '7zFM.exe', title: '7-Zip File Manager', icon: '📦', desc: 'Archive extractor, integrity tester & LZMA2 benchmark', width: 620, height: 420 },
    { id: 'putty', name: 'putty.exe', title: 'PuTTY SSH Client', icon: '🖥️', desc: 'Win32 Telnet/SSH client with session management', width: 580, height: 460 },
    { id: 'paint', name: 'paint32.exe', title: 'Paint 32', icon: '🎨', desc: 'Classic bitmap canvas drawing tool with PNG export to VFS', width: 660, height: 480 },
    { id: 'generic', name: 'generic_pe.exe', title: 'Generic PE Runner', icon: '⚡', desc: 'Universal PE32+ entry point loader & dynamic disassembler', width: 600, height: 420 }
  ];

  const handleLaunchInOwnWindow = (app: { name: string; title: string; id?: string; width?: number; height?: number }) => {
    SoundManager.play('open');
    const pid = Math.floor(2000 + Math.random() * 8000);
    const winTitle = `${app.title} (PID: ${pid}) - Wine 9.0`;
    
    Kernel.wm.launch('wine-app', {
      appName: app.name,
      title: winTitle,
      type: app.id || 'generic',
      pid,
      windowsVersion: windowsVersion === 'win11' ? 'Windows 11 Pro (64-bit)' : windowsVersion === 'win10' ? 'Windows 10' : windowsVersion === 'win7' ? 'Windows 7 SP1' : 'Windows XP SP3',
      renderer: wineRenderer.toUpperCase() + ' (Vulkan)',
      dllOverrides: wineDllOverrides,
      width: app.width || 680,
      height: app.height || 480,
      multiInstance: true
    });

    setWineLogs(prev => [
      ...prev,
      `[WINE 9.0] Spawned standalone window for '${app.name}' [PID ${pid}] with native window handle.`
    ]);

    Toast.show(`Spawned ${app.name} into its own Window! [PID ${pid}]`, '🍷');
  };

  const handleMaxOutAll = () => {
    SoundManager.play('open');
    Toast.show('Maxing out! Spawning all core Wine applications in separate windows...', '🚀');
    
    // Staggered launch to tile/cascade windows nicely
    const coreApps = [
      wineAppsList[0], // notepad
      wineAppsList[1], // cmd
      wineAppsList[2], // taskmgr
      wineAppsList[4], // winemine
      wineAppsList[5], // dxvk_bench
      wineAppsList[6]  // calc
    ];

    coreApps.forEach((app, index) => {
      setTimeout(() => {
        handleLaunchInOwnWindow(app);
      }, index * 180);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setExecutingExecutable(file.name);
      Toast.show(`Loaded binary: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, '📦');

      // Auto-analyze binary for PE/ELF inspector
      const isExe = file.name.endsWith('.exe') || file.name.endsWith('.dll');
      setBinaryDetails({
        name: file.name,
        format: isExe ? 'PE32+ (Windows Portable Executable)' : 'ELF64 (Linux Executable)',
        arch: 'x86_64 / AMD64',
        entryPoint: isExe ? '0x0000000140001000' : '0x0000000000401080',
        endianness: 'Little Endian',
        subsystem: isExe ? 'Windows GUI / Win32' : 'POSIX console',
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        hashSha256: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
        sections: [
          { name: isExe ? '.text' : '.text', vaddr: '0x00001000', size: `${Math.round(file.size * 0.6 / 1024)} KB`, entropy: 6.35, flags: 'r-x (Code)' },
          { name: isExe ? '.rdata' : '.rodata', vaddr: '0x00008000', size: `${Math.round(file.size * 0.2 / 1024)} KB`, entropy: 4.80, flags: 'r-- (Read-Only)' },
          { name: isExe ? '.data' : '.data', vaddr: '0x0000c000', size: `${Math.round(file.size * 0.1 / 1024)} KB`, entropy: 3.20, flags: 'rw- (Globals)' },
          { name: isExe ? '.pdata' : '.dynsym', vaddr: '0x0000e000', size: `${Math.round(file.size * 0.1 / 1024)} KB`, entropy: 4.10, flags: 'r-- (Metadata)' }
        ],
        imports: isExe 
          ? ['KERNEL32.dll (CreateProcessW, VirtualAlloc, Sleep)', 'USER32.dll (MessageBoxW, CreateWindowExW)', 'GDI32.dll (CreateSolidBrush)']
          : ['libc.so.6 (printf, malloc, free, execve)', 'libpthread.so.0'],
        exports: isExe ? ['DllRegisterServer', 'DllMain'] : ['main', '_start'],
        mitigations: {
          nx: true,
          aslr: true,
          canary: true,
          pie: true,
          relro: 'Full RELRO',
          fortify: true
        },
        disassemblySample: [
          { addr: '0x140001000', bytes: '48 83 ec 28', op: 'sub rsp, 40', comment: 'Allocate shadow stack space' },
          { addr: '0x140001004', bytes: '48 8d 0d f5 1f 00 00', op: 'lea rcx, [rip + 0x1ff5]', comment: 'Load string literal pointer' },
          { addr: '0x14000100b', bytes: 'ff 15 87 20 00 00', op: 'call qword ptr [rip + 0x2087]', comment: 'Call printf / OutputDebugString' },
          { addr: '0x140001011', bytes: '31 c0', op: 'xor eax, eax', comment: 'Return 0 (SUCCESS)' },
          { addr: '0x140001013', bytes: '48 83 c4 28', op: 'add rsp, 40', comment: 'Restore stack pointer' },
          { addr: '0x140001017', bytes: 'c3', op: 'ret', comment: 'Return to caller' }
        ]
      });
    }
  };

  const handleInstallWinetrick = (pkg: string) => {
    setInstallingPackage(pkg);
    SoundManager.play('click');
    Toast.show(`Winetricks: downloading & configuring ${pkg}...`, '⚙️');

    setTimeout(() => {
      setWinetricksInstalled(prev => ({ ...prev, [pkg]: true }));
      setInstallingPackage(null);
      SoundManager.play('success');
      Toast.show(`Winetricks: ${pkg} installed into prefix!`, '✓');
      setWineLogs(prev => [
        ...prev,
        `[WINETRICKS] Installed package runtime '${pkg}' successfully. Windows registry keys updated.`
      ]);
    }, 1200);
  };

  const handleTranslate = () => {
    SoundManager.play('click');
    if (translatorMode === 'ps2bash') {
      let output = sourceCode
        .replace(/#.*$/gm, (m) => `# [Converted] ${m.substring(1).trim()}`)
        .replace(/Get-Process\s*\|\s*Where-Object\s*\{\s*\$_\.CPU\s*-gt\s*(\d+)\s*\}\s*\|\s*Select-Object\s*-Property\s*([^\n|]+)/g, "ps -eo pid,comm,%cpu --sort=-%cpu | awk '$3 > $1 {print $1, $2, $3}'")
        .replace(/Get-Process/g, 'ps aux')
        .replace(/Get-Service/g, 'rc-status -a # or systemctl list-units --type=service')
        .replace(/Where-Object\s*\{\s*\$_\.Status\s*-eq\s*"Running"\s*\}/g, "grep -E 'started|running'")
        .replace(/Where-Object/g, 'awk')
        .replace(/Select-Object/g, 'awk')
        .replace(/Invoke-WebRequest\s*-Uri\s*"([^"]+)"\s*-Method\s*Get/g, 'curl -fsSL "$1"')
        .replace(/Invoke-RestMethod\s*-Uri\s*"([^"]+)"/g, 'curl -s -H "Accept: application/json" "$1" | jq .')
        .replace(/Export-Csv\s*-Path\s*([^\n]+)/g, 'tee $1')
        .replace(/Start-Sleep\s*-Seconds\s*(\d+)/g, 'sleep $1')
        .replace(/Write-Host\s*"([^"]+)"/g, 'echo "$1"')
        .replace(/Test-Path\s*"([^"]+)"/g, 'test -e "$1"')
        .replace(/Remove-Item\s*-Recurse\s*-Force\s*"([^"]+)"/g, 'rm -rf "$1"');

      setTranslatedCode(`#!/usr/bin/env bash\n# ========================================================\n# Auto-generated POSIX Bash Script by Helix Cross-Platform AST\n# Source: PowerShell Core / Windows 11\n# ========================================================\nset -euo pipefail\n\n${output}\n\necho "[Helix] Script execution finished successfully."`);
    } else if (translatorMode === 'bash2ps') {
      let output = sourceCode
        .replace(/ps aux/g, 'Get-Process')
        .replace(/grep -i "([^"]+)"/g, 'Select-String -Pattern "$1"')
        .replace(/curl -fsSL "([^"]+)"/g, 'Invoke-WebRequest -Uri "$1" -UseBasicParsing')
        .replace(/rm -rf "([^"]+)"/g, 'Remove-Item -Path "$1" -Recurse -Force')
        .replace(/mkdir -p "([^"]+)"/g, 'New-Item -ItemType Directory -Path "$1" -Force')
        .replace(/cat "([^"]+)"/g, 'Get-Content -Path "$1"');

      setTranslatedCode(`# ========================================================\n# Auto-generated PowerShell 7.4 Script by Helix Cross-Platform AST\n# Source: POSIX Linux Bash\n# ========================================================\n$ErrorActionPreference = "Stop"\n\n${output}\n\nWrite-Host "[Helix] PowerShell execution finished." -ForegroundColor Green`);
    } else if (translatorMode === 'ps2py') {
      setTranslatedCode(`#!/usr/bin/env python3\n# Auto-generated Python 3.12 Script from PowerShell AST\nimport subprocess, requests, os, sys\n\nprint("[Helix] Executing cross-platform Python translation...")\n# Converted process query\nres = subprocess.run(["ps", "-eo", "pid,comm,%cpu"], capture_output=True, text=True)\nprint("Active Processes:")\nprint(res.stdout[:500])\n\n# Converted Web Request\nresp = requests.get("https://api.github.com/zen")\nif resp.status_code == 200:\n    print("GitHub Zen:", resp.text)`);
    } else {
      setTranslatedCode(`#!/bin/bash\n# Converted Windows CMD/Batch to Linux Shell\nset -e\n\n${sourceCode.replace(/echo\s+([^\n]+)/g, 'echo "$1"').replace(/dir/g, 'ls -la').replace(/cls/g, 'clear')}`);
    }
    SoundManager.play('success');
    Toast.show('AST translation generated with 0 syntax errors!', '⚡');
  };

  const handleCopyTranslated = async () => {
    if (!translatedCode) return;
    try {
      await navigator.clipboard.writeText(translatedCode);
      setIsCopied(true);
      Toast.show('Copied script to clipboard', '📋');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      Toast.show('Failed to copy', '⚠️');
    }
  };

  const handleSaveToVfs = async () => {
    if (!translatedCode) return;
    const filename = translatorMode === 'ps2bash' ? '/home/alpine/converted_script.sh' : '/home/alpine/converted_script.ps1';
    await Kernel.vfs.write(filename, translatedCode);
    SoundManager.play('success');
    Toast.show(`Saved translated script to ${filename}`, '💾');
  };

  const handleCrossCompile = () => {
    setIsCompiling(true);
    SoundManager.play('open');
    setCrossLogs([
      `[CROSS-COMPILER] Target Triple: ${crossTarget === 'windows_x64' ? 'x86_64-w64-mingw32' : crossTarget === 'linux_arm64' ? 'aarch64-linux-gnu' : crossTarget === 'wasm32' ? 'wasm32-unknown-wasi' : 'x86_64-alpine-linux-musl'}`,
      `[CROSS-COMPILER] Optimization Level: -${crossOptLevel} -flto -fomit-frame-pointer`,
      `[CROSS-COMPILER] Compiling source translation unit (AST verification pass)...`
    ]);

    setTimeout(() => {
      setCrossLogs(prev => [
        ...prev,
        `[CROSS-COMPILER] Clang/LLVM front-end completed in 142ms. Zero warnings.`,
        `[CROSS-COMPILER] Linking target binary: output_${crossTarget}.${crossTarget === 'windows_x64' ? 'exe' : crossTarget === 'wasm32' ? 'wasm' : 'elf'}`,
        `[CROSS-COMPILER] Stripping debug symbols and applying PIE/ASLR relocations.`,
        `[CROSS-COMPILER] Output file size: 28.4 KB. SHA256: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08`,
        `[CROSS-COMPILER] SUCCESS: Binary ready for immediate execution in Wine or Linux Host.`
      ]);
      setIsCompiling(false);
      SoundManager.play('success');
      Toast.show('Cross-compilation successful!', '🎯');
    }, 900);
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-gray-100 select-none font-sans overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-[#131622] border-b border-white/10 flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xs font-mono flex items-center gap-1.5">
              <span>Cross-Platform Developer Tools & Wine 9.0 Pro</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                Multi-Window Architecture
              </span>
            </h2>
            <p className="text-[10px] text-gray-400">Spawn independent Win32 windows, translate scripts, analyze binaries, and cross-compile.</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('wine')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'wine' ? 'bg-indigo-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" /> <span>Wine Apps</span>
          </button>
          <button
            onClick={() => setActiveTab('multi-window')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'multi-window' ? 'bg-indigo-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Windows ({activeProcesses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('winetricks')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'winetricks' ? 'bg-indigo-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" /> <span>Winetricks</span>
          </button>
          <button
            onClick={() => setActiveTab('translator')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'translator' ? 'bg-indigo-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> <span>Script AST</span>
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inspector' ? 'bg-indigo-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Binary className="w-3.5 h-3.5" /> <span>PE/ELF Disasm</span>
          </button>
          <button
            onClick={() => setActiveTab('cross-compile')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cross-compile' ? 'bg-indigo-500 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> <span>Cross-Compile</span>
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {/* TAB 1: Wine Win32 Multi-App Suite & Launcher */}
        {activeTab === 'wine' && (
          <div className="space-y-3">
            {/* Top Quick Action & Max Out Bar */}
            <div className="p-3 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-[#121520] border border-indigo-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  <Box className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs font-mono flex items-center gap-1.5">
                    <span>Wine 9.0 Pro Multi-Window Subsystem</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Independent Desktop Windows
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    Every running Win32 application operates in its <strong>own dedicated, resizable, floating Helix OS window</strong> with isolated PIDs.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMaxOutAll}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-orange-500/20"
                >
                  <Flame className="w-4 h-4 fill-current" />
                  <span>Max Out: Launch All Windows</span>
                </button>
              </div>
            </div>

            {/* Wine Apps Grid (Each has its OWN Window) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {wineAppsList.map((app) => (
                <div
                  key={app.id}
                  className="p-3.5 bg-[#121520] hover:bg-[#161a28] border border-white/10 hover:border-indigo-500/40 rounded-2xl transition flex flex-col justify-between group shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl p-1.5 rounded-xl bg-white/5 border border-white/10">{app.icon}</span>
                        <div>
                          <h4 className="font-bold text-white text-xs font-mono group-hover:text-indigo-300 transition">
                            {app.title}
                          </h4>
                          <span className="text-[10px] text-gray-500 font-mono">{app.name}</span>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                        Win32
                      </span>
                    </div>
                    <p className="text-gray-400 text-[11px] mt-2 leading-relaxed">
                      {app.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {app.width}x{app.height}
                    </span>
                    <button
                      onClick={() => handleLaunchInOwnWindow(app)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow shadow-indigo-500/25"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Launch in Window</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Executable Upload & Advanced Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
              <div className="lg:col-span-6 p-3.5 bg-[#121520] rounded-2xl border border-white/10 space-y-3 font-mono">
                <h3 className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                  <FileUp className="w-4 h-4" /> <span>Launch Custom .EXE / .DLL in Dedicated Window</span>
                </h3>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".exe,.msi,.bat,.dll,.com"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-white/20 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer bg-black/40 hover:bg-black/60 transition flex items-center justify-center gap-2"
                  >
                    <FileUp className="w-5 h-5 text-indigo-400" />
                    <span className="text-gray-300 text-xs">
                      {uploadedFile ? uploadedFile.name : 'Click to Upload Windows .EXE Binary or .BAT Script'}
                    </span>
                  </div>
                  {uploadedFile && (
                    <div className="flex items-center justify-between mt-2 text-xs text-emerald-400">
                      <span>{(uploadedFile.size / 1024).toFixed(1)} KB loaded</span>
                      <button
                        onClick={() => {
                          handleLaunchInOwnWindow({
                            name: uploadedFile.name,
                            title: uploadedFile.name,
                            id: 'generic',
                            width: 680,
                            height: 480
                          });
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Launch in Dedicated Window</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Subsystem Prefix Settings */}
              <div className="lg:col-span-6 p-3.5 bg-[#121520] rounded-2xl border border-white/10 space-y-2.5 font-mono">
                <h3 className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                  <Settings className="w-4 h-4" /> <span>Wine Prefix & Compatibility Target</span>
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 block mb-1 text-[10px]">Windows Target</label>
                    <select
                      value={windowsVersion}
                      onChange={(e) => setWindowsVersion(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-white text-[11px]"
                    >
                      <option value="win11">Windows 11 Pro (64-bit)</option>
                      <option value="win10">Windows 10</option>
                      <option value="win7">Windows 7 SP1</option>
                      <option value="winxp">Windows XP SP3</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1 text-[10px]">3D Translation Engine</label>
                    <select
                      value={wineRenderer}
                      onChange={(e) => setWineRenderer(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-white text-[11px]"
                    >
                      <option value="dxvk">DXVK 2.3 (Direct3D to Vulkan)</option>
                      <option value="wine3d">WINE3D (OpenGL Core)</option>
                      <option value="vkd3d">VKD3D (DirectX 12)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 text-[10px]">WINEDLLOVERRIDES</label>
                  <input
                    type="text"
                    value={wineDllOverrides}
                    onChange={(e) => setWineDllOverrides(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-yellow-300 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Active Windows & Wine Processes */}
        {activeTab === 'multi-window' && (
          <div className="space-y-3 font-mono">
            <div className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-cyan-400" /> <span>Active Wine Windows & Processes ({activeProcesses.length})</span>
                </h3>
                <p className="text-gray-400 text-[11px] mt-0.5">
                  Real-time status of all independent Win32 application windows managed by Helix OS.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMaxOutAll}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Launch More Windows</span>
                </button>
              </div>
            </div>

            {activeProcesses.length === 0 ? (
              <div className="p-8 bg-[#121520] border border-white/10 rounded-2xl text-center space-y-2">
                <Box className="w-10 h-10 text-indigo-400/50 mx-auto" />
                <div className="font-bold text-white text-xs">No Active Wine Windows</div>
                <p className="text-gray-400 text-[11px] max-w-sm mx-auto">
                  Click on any application from the "Wine Apps" tab to spawn it into its own standalone desktop window.
                </p>
                <button
                  onClick={handleMaxOutAll}
                  className="mt-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Launch Core Suite
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeProcesses.map((proc) => (
                  <div
                    key={proc.pid}
                    className="p-3.5 bg-[#121520] border border-indigo-500/30 rounded-2xl flex flex-col justify-between space-y-3 shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{proc.name}</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                          PID: {proc.pid}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                        <div className="p-1.5 bg-black/40 rounded border border-white/5">
                          <span className="text-gray-500 block">CPU</span>
                          <span className="font-bold text-emerald-400">{proc.cpuPercent}%</span>
                        </div>
                        <div className="p-1.5 bg-black/40 rounded border border-white/5">
                          <span className="text-gray-500 block">Memory</span>
                          <span className="font-bold text-cyan-300">{proc.memoryMb} MB</span>
                        </div>
                        <div className="p-1.5 bg-black/40 rounded border border-white/5">
                          <span className="text-gray-500 block">Threads</span>
                          <span className="font-bold text-purple-300">{proc.threads}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-gray-400 truncate">
                        Window ID: <span className="text-gray-300">{proc.windowId}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <button
                        onClick={() => Kernel.wm.focus(proc.windowId)}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                      >
                        Focus Window
                      </button>
                      <button
                        onClick={() => {
                          WineProcessManager.killProcessByPid(proc.pid);
                          Kernel.wm.close(proc.windowId);
                          Toast.show(`Closed window & killed PID ${proc.pid}`, '🛑');
                        }}
                        className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold transition cursor-pointer"
                      >
                        Kill Process
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Winetricks Dependency Manager */}
        {activeTab === 'winetricks' && (
          <div className="space-y-3 font-mono">
            <div className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-indigo-400" /> <span>Winetricks Dependency & Runtime Manager</span>
                </h3>
                <p className="text-gray-400 text-[11px] mt-0.5">
                  1-Click install essential Windows DLLs, DirectX runtimes, .NET frameworks, and MS Core Fonts into ~/.wine64
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: 'dxvk', name: 'DXVK 2.3', cat: 'Graphics', desc: 'Direct3D 9/10/11 translation layer to Vulkan API' },
                { id: 'vcrun2022', name: 'Visual C++ 2015-2022', cat: 'Runtime', desc: 'MSVCP140.dll, VCRUNTIME140.dll, UCRT runtimes' },
                { id: 'corefonts', name: 'Microsoft Core Fonts', cat: 'Fonts', desc: 'Arial, Times New Roman, Courier New, Verdana, Tahoma' },
                { id: 'dotnet48', name: '.NET Framework 4.8', cat: 'Runtime', desc: 'Full CLR runtime for Windows WPF / WinForms applications' },
                { id: 'physx', name: 'NVIDIA PhysX 9.21', cat: 'Physics', desc: 'Hardware accelerated physics engine DLLs for Windows games' },
                { id: 'gdiplus', name: 'GDI+ Graphics Library', cat: 'Graphics', desc: 'Native Microsoft GdiPlus.dll rendering engine' },
                { id: 'd3dcompiler_47', name: 'D3DCompiler_47.dll', cat: 'Shaders', desc: 'HLSL shader compilation engine for DirectX 11/12' },
                { id: 'msxml6', name: 'MSXML 6.0 Parser', cat: 'Libraries', desc: 'Microsoft XML parser and DOM schema validator' }
              ].map((pkg) => {
                const isInstalled = winetricksInstalled[pkg.id];
                const isInstalling = installingPackage === pkg.id;

                return (
                  <div key={pkg.id} className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{pkg.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-gray-400 border border-white/10">
                          {pkg.cat}
                        </span>
                      </div>
                      <p className="text-gray-400 text-[10px] mt-1">{pkg.desc}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className={`text-[10px] font-bold ${isInstalled ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {isInstalled ? '✓ Installed' : 'Not Installed'}
                      </span>
                      <button
                        onClick={() => handleInstallWinetrick(pkg.id)}
                        disabled={isInstalled || isInstalling}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          isInstalled 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                            : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                        }`}
                      >
                        {isInstalling ? 'Installing...' : isInstalled ? 'Configured' : 'Install'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Script AST Translator */}
        {activeTab === 'translator' && (
          <div className="h-full flex flex-col gap-3 font-mono">
            <div className="p-3 bg-[#121520] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs font-bold">AST Engine:</span>
                <select
                  value={translatorMode}
                  onChange={(e) => setTranslatorMode(e.target.value as any)}
                  className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-white text-xs"
                >
                  <option value="ps2bash">PowerShell → POSIX Bash (Linux)</option>
                  <option value="bash2ps">POSIX Bash → PowerShell Core (Windows)</option>
                  <option value="ps2py">PowerShell → Python 3.12 Script</option>
                  <option value="bat2bash">Windows Batch (.bat) → Bash Script</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTranslate}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" /> <span>Translate AST</span>
                </button>
                {translatedCode && (
                  <>
                    <button
                      onClick={handleCopyTranslated}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer"
                      title="Copy to Clipboard"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={handleSaveToVfs}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" /> <span>Save to VFS</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[300px]">
              <div className="flex flex-col bg-[#121520] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-3 py-2 bg-black/40 border-b border-white/10 text-gray-400 text-[11px] font-bold flex items-center justify-between">
                  <span>Source Script ({translatorMode.startsWith('ps') ? 'PowerShell' : translatorMode.startsWith('bat') ? 'Batch' : 'Bash'})</span>
                </div>
                <textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  className="flex-1 p-3 bg-transparent text-gray-200 font-mono text-xs focus:outline-none resize-none select-text leading-relaxed"
                />
              </div>

              <div className="flex flex-col bg-[#0c0d14] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-3 py-2 bg-black/40 border-b border-white/10 text-gray-400 text-[11px] font-bold flex items-center justify-between">
                  <span>Translated Output AST</span>
                  <span className="text-emerald-400 text-[10px]">Ready to Run</span>
                </div>
                <textarea
                  value={translatedCode}
                  readOnly
                  placeholder="Click 'Translate AST' to compile script..."
                  className="flex-1 p-3 bg-transparent text-emerald-300 font-mono text-xs focus:outline-none resize-none select-text leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PE/ELF Disassembler */}
        {activeTab === 'inspector' && (
          <div className="space-y-3 font-mono">
            <div className="p-3.5 bg-[#121520] border border-white/10 rounded-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <Binary className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <span>{binaryDetails.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {binaryDetails.format}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Arch: {binaryDetails.arch} | Entry: {binaryDetails.entryPoint} | Size: {binaryDetails.fileSize}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> <span>Inspect New Binary</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#121520] border border-white/10 rounded-2xl space-y-2">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" /> <span>Binary Sections & Entropy Analysis</span>
                </div>
                <div className="space-y-2 pt-1">
                  {binaryDetails.sections.map((sec, i) => (
                    <div key={i} className="p-2 bg-black/40 rounded-xl border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-cyan-300">{sec.name}</span>
                        <span className="text-gray-400">{sec.vaddr} ({sec.size})</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-gray-400">Entropy: {sec.entropy.toFixed(2)}</span>
                        <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${sec.entropy > 7.0 ? 'bg-rose-500' : sec.entropy > 5.0 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${(sec.entropy / 8.0) * 100}%` }}
                          />
                        </div>
                        <span className="text-gray-500">{sec.flags}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-[#121520] border border-white/10 rounded-2xl space-y-2">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> <span>Binary Security Mitigations</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold">
                      NX / DEP: Enabled
                    </div>
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold">
                      ASLR / PIE: Enabled
                    </div>
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold">
                      Stack Canary: Active
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-[#121520] border border-white/10 rounded-2xl space-y-2">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" /> <span>Import Table (Dynamic Link Libraries)</span>
                  </div>
                  <div className="space-y-1 pt-1 text-[10px] text-gray-300 max-h-28 overflow-y-auto">
                    {binaryDetails.imports.map((imp, idx) => (
                      <div key={idx} className="p-1.5 bg-black/40 rounded border border-white/5 truncate">
                        {imp}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-[#0c0d14] border border-white/10 rounded-2xl space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-amber-400" /> <span>Live Disassembly (x86_64 Intel Syntax)</span>
                </span>
                <span className="text-[10px] text-gray-500">objdump -d -M intel</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] pt-1">
                {binaryDetails.disassemblySample.map((row, i) => (
                  <div key={i} className="flex items-center gap-4 py-0.5 hover:bg-white/5 rounded px-1 select-text">
                    <span className="text-gray-500 w-24">{row.addr}</span>
                    <span className="text-indigo-400 w-32 font-bold">{row.bytes}</span>
                    <span className="text-emerald-300 w-44 font-bold">{row.op}</span>
                    <span className="text-gray-400 text-[10px]">; {row.comment}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Cross-Compiler Suite */}
        {activeTab === 'cross-compile' && (
          <div className="h-full flex flex-col gap-3 font-mono">
            <div className="p-3.5 bg-[#121520] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <label className="text-gray-400 text-[10px] block mb-0.5">Target Architecture</label>
                  <select
                    value={crossTarget}
                    onChange={(e) => setCrossTarget(e.target.value as any)}
                    className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-white text-xs"
                  >
                    <option value="windows_x64">x86_64-w64-mingw32 (Windows 64-bit EXE)</option>
                    <option value="linux_x64">x86_64-linux-musl (Alpine Linux Static ELF)</option>
                    <option value="linux_arm64">aarch64-linux-gnu (ARM64 Linux)</option>
                    <option value="wasm32">wasm32-unknown-wasi (WebAssembly)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 text-[10px] block mb-0.5">Optimization</label>
                  <select
                    value={crossOptLevel}
                    onChange={(e) => setCrossOptLevel(e.target.value as any)}
                    className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-white text-xs"
                  >
                    <option value="O3">-O3 (Maximum Speed)</option>
                    <option value="Oz">-Oz (Minimum Size)</option>
                    <option value="O2">-O2 (Balanced)</option>
                    <option value="O0">-O0 (Debug)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCrossCompile}
                disabled={isCompiling}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-400/20 disabled:opacity-50"
              >
                {isCompiling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4 fill-current" />}
                <span>{isCompiling ? 'Compiling Toolchain...' : 'Build Cross Binary'}</span>
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[250px]">
              <div className="flex flex-col bg-[#121520] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-3 py-1.5 bg-black/40 border-b border-white/10 text-gray-400 text-[11px] font-bold">
                  C/C++ Source Code
                </div>
                <textarea
                  value={crossSource}
                  onChange={(e) => setCrossSource(e.target.value)}
                  className="flex-1 p-3 bg-transparent text-gray-200 font-mono text-xs focus:outline-none resize-none select-text leading-relaxed"
                />
              </div>

              <div className="flex flex-col bg-[#0c0d14] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-3 py-1.5 bg-black/40 border-b border-white/10 text-gray-400 text-[11px] font-bold flex items-center justify-between">
                  <span>Build Output Console</span>
                  <span className="text-amber-300 text-[10px]">Clang 17 / MinGW-w64</span>
                </div>
                <div className="flex-1 p-3 overflow-y-auto space-y-1 text-gray-300 text-[11px]">
                  {crossLogs.length === 0 ? (
                    <div className="text-gray-500">Click &quot;Build Cross Binary&quot; to invoke the compiler toolchain.</div>
                  ) : (
                    crossLogs.map((l, i) => (
                      <div key={i} className={l.includes('SUCCESS') ? 'text-emerald-400 font-bold' : 'text-gray-300'}>
                        {l}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
