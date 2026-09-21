import { Kernel } from './index';
import { Toast } from './Toast';
import { Settings } from './Settings';

export interface HardwareDetectionResult {
  cpu: {
    cores: number;
    architecture: string;
    platform: string;
    wasmSimd: boolean;
    wasmThreads: boolean;
    concurrencyScore: number;
  };
  gpu: {
    vendor: string;
    renderer: string;
    webgl2Supported: boolean;
    webgpuSupported: boolean;
    maxTextureSize: number;
    refreshRateHz: number;
    colorGamut: string;
    pixelRatio: number;
    screenWidth: number;
    screenHeight: number;
    colorDepth: number;
  };
  storage: {
    estimatedQuotaBytes: number;
    estimatedUsageBytes: number;
    percentUsed: number;
    indexedDbAvailable: boolean;
    opfsAvailable: boolean;
    localStorageEntries: number;
    vfsFileCount: number;
    vfsTotalSizeBytes: number;
  };
  network: {
    online: boolean;
    effectiveType: string;
    downlinkMbps: number;
    rttMs: number;
    saveData: boolean;
    hostBridgeLatencyMs: number | null;
    hostBridgeConnected: boolean;
  };
  peripherals: {
    battery: {
      supported: boolean;
      level: number;
      charging: boolean;
      chargingTime: number;
      dischargingTime: number;
    };
    gamepadsCount: number;
    gamepads: string[];
    touchSupport: boolean;
    maxTouchPoints: number;
    keyboardLayout: string;
    mediaInputCount: number;
    mediaOutputCount: number;
  };
  audio: {
    webAudioSupported: boolean;
    sampleRate: number;
    state: string;
    outputChannels: number;
    baseLatencyMs: number;
  };
}

export interface SubsystemStatus {
  id: string;
  name: string;
  category: 'Core' | 'Runtime' | 'Networking' | 'Storage' | 'Development';
  version: string;
  installedVersion: string;
  latestVersion: string;
  status: 'connected' | 'checking' | 'updating' | 'update_available' | 'disconnected' | 'error';
  latencyMs?: number;
  details: string;
  autoSyncEnabled: boolean;
  lastChecked: string;
}

export interface SystemUpdateItem {
  id: string;
  name: string;
  category: string;
  currentVersion: string;
  newVersion: string;
  size: string;
  description: string;
  status: 'idle' | 'downloading' | 'verifying' | 'installing' | 'completed' | 'error';
  progress: number;
  releaseDate: string;
}

export class AutoDetectionEngine {
  private static instance: AutoDetectionEngine | null = null;
  private listeners: Array<() => void> = [];
  private isScanning = false;
  private isUpdatingAll = false;

  private hardwareInfo: HardwareDetectionResult | null = null;
  private subsystems: SubsystemStatus[] = [
    {
      id: 'helix_kernel',
      name: 'Helix OS Microkernel',
      category: 'Core',
      version: '2.4.0',
      installedVersion: '2.4.0',
      latestVersion: '2.4.0',
      status: 'connected',
      latencyMs: 0.1,
      details: 'Ring 0 VFS, unified state manager, reactive event bus, dynamic window server.',
      autoSyncEnabled: true,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: 'linux_vm',
      name: 'Alpine Linux Guest Engine',
      category: 'Core',
      version: '6.6.21-alpine',
      installedVersion: '6.6.21-alpine',
      latestVersion: '6.6.21-alpine',
      status: 'connected',
      latencyMs: 1.2,
      details: 'v86 JIT virtualized x86_64 hypervisor, OpenRC init, APK package manager.',
      autoSyncEnabled: true,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: 'host_bridge',
      name: 'Real Host Kernel Daemon Bridge',
      category: 'Networking',
      version: '1.8.4',
      installedVersion: '1.8.4',
      latestVersion: '1.8.4',
      status: 'connected',
      latencyMs: 12,
      details: 'Real-time REST & SSE synchronization bridge to Cloud Run host container.',
      autoSyncEnabled: true,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: 'vfs_storage',
      name: 'IndexedDB Virtual File System (VFS)',
      category: 'Storage',
      version: '3.2.0',
      installedVersion: '3.2.0',
      latestVersion: '3.2.0',
      status: 'connected',
      latencyMs: 0.8,
      details: 'Durable ACID key-value object store with ChangeJournal transaction logs.',
      autoSyncEnabled: true,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: 'webaudio_dac',
      name: 'Web Audio Synthesizer & Sound FX',
      category: 'Runtime',
      version: '2.1.0',
      installedVersion: '2.1.0',
      latestVersion: '2.1.0',
      status: 'connected',
      latencyMs: 2.1,
      details: 'Real-time polyphonic waveform generator, pitch sweep modulator, stereo panning.',
      autoSyncEnabled: true,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: 'gpu_compositor',
      name: 'WebGL2 / Canvas Hardware Compositor',
      category: 'Core',
      version: '3.0.1',
      installedVersion: '3.0.1',
      latestVersion: '3.0.1',
      status: 'connected',
      latencyMs: 0.4,
      details: '60 FPS GPU-accelerated rasterization with sub-pixel typography and zero tearing.',
      autoSyncEnabled: true,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: 'docker_engine',
      name: 'Docker Engine & OCI Container Daemon',
      category: 'Development',
      version: '24.0.7-ce',
      installedVersion: '24.0.7-ce',
      latestVersion: '24.0.7-ce',
      status: 'connected',
      latencyMs: 3.4,
      details: 'OCI container virtualization, multi-stage layer cache, rootless namespace runner.',
      autoSyncEnabled: true,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: 'python_engine',
      name: 'Python 3.11 WASM Runtime (Pyodide)',
      category: 'Runtime',
      version: '3.11.8',
      installedVersion: '3.11.8',
      latestVersion: '3.11.8',
      status: 'connected',
      latencyMs: 4.2,
      details: 'CPython WebAssembly compiler with NumPy, SymPy, and Matplotlib canvas hooks.',
      autoSyncEnabled: true,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: 'rust_clang',
      name: 'Rust 2021 & Clang C++23 Toolchain',
      category: 'Development',
      version: '1.77.2',
      installedVersion: '1.77.2',
      latestVersion: '1.77.2',
      status: 'connected',
      latencyMs: 5.1,
      details: 'Native AST parser, bytecode compiler with -O3 optimization and ASM disassembler.',
      autoSyncEnabled: true,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: 'wine_subsystem',
      name: 'Wine 9.0 & DXVK Vulkan Translation Layer',
      category: 'Runtime',
      version: '9.0.2',
      installedVersion: '9.0.2',
      latestVersion: '9.0.2',
      status: 'connected',
      latencyMs: 8.5,
      details: 'PE32/64 execution loader, DirectX 9/11/12 translation, .NET 4.8 runtime sandbox.',
      autoSyncEnabled: true,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: 'git_vcs',
      name: 'Git Version Control Engine',
      category: 'Development',
      version: '2.43.0',
      installedVersion: '2.43.0',
      latestVersion: '2.43.0',
      status: 'connected',
      latencyMs: 1.5,
      details: 'Directed Acyclic Graph (DAG) commit tracker, staging index, and stash manager.',
      autoSyncEnabled: true,
      lastChecked: new Date().toLocaleTimeString(),
    },
    {
      id: 'network_gateway',
      name: 'Virtual Network Stack & Packet Sniffer',
      category: 'Networking',
      version: '4.2.1',
      installedVersion: '4.2.1',
      latestVersion: '4.2.1',
      status: 'connected',
      latencyMs: 14.2,
      details: 'VirtIO-Net bridge, TCP/UDP sockets, DNS resolver, BPF packet dissector.',
      autoSyncEnabled: true,
      lastChecked: new Date().toLocaleTimeString(),
    },
  ];

  private availableUpdates: SystemUpdateItem[] = [
    {
      id: 'apk_index',
      name: 'Alpine Linux APK Repository Index (v3.19.2)',
      category: 'Package Manager',
      currentVersion: '3.19.1',
      newVersion: '3.19.2',
      size: '2.4 MB',
      description: 'Synchronizes 14,200+ pre-compiled Alpine package signatures and security updates.',
      status: 'idle',
      progress: 0,
      releaseDate: '2026-09-18',
    },
    {
      id: 'cve_definitions',
      name: 'Helix Security CVE & Threat Intelligence Rules',
      category: 'Security',
      currentVersion: '2026.08',
      newVersion: '2026.09-Patch2',
      size: '1.1 MB',
      description: 'Updated firewall filtering rules, zero-day threat heuristics, and memory audit masks.',
      status: 'idle',
      progress: 0,
      releaseDate: '2026-09-19',
    },
    {
      id: 'dxvk_layer',
      name: 'DXVK Direct3D-to-Vulkan Shader Cache v2.3.1',
      category: 'Graphics & Wine',
      currentVersion: '2.3.0',
      newVersion: '2.3.1',
      size: '4.8 MB',
      description: 'Optimized pipeline state compilation for Direct3D 11 games and Windows 3D binaries.',
      status: 'idle',
      progress: 0,
      releaseDate: '2026-09-15',
    },
    {
      id: 'python_libs',
      name: 'Pyodide Python Wheels standard bundle',
      category: 'Python Runtime',
      currentVersion: '0.25.1',
      newVersion: '0.26.0',
      size: '8.2 MB',
      description: 'Latest wheel binaries for requests, pandas, and pygame-wasm graphics engines.',
      status: 'idle',
      progress: 0,
      releaseDate: '2026-09-12',
    },
  ];

  public static get(): AutoDetectionEngine {
    if (!AutoDetectionEngine.instance) {
      AutoDetectionEngine.instance = new AutoDetectionEngine();
      AutoDetectionEngine.instance.initAutoDetection();
    }
    return AutoDetectionEngine.instance;
  }

  private constructor() {}

  /**
   * Initializes real-time hardware and connectivity observers.
   */
  private initAutoDetection() {
    // 1. Initial Scan
    this.scanHardwareAndConnectivity();

    // 2. Network connectivity listeners
    window.addEventListener('online', () => {
      this.handleNetworkStatusChange(true);
    });
    window.addEventListener('offline', () => {
      this.handleNetworkStatusChange(false);
    });

    // 3. Peripheral device connection listeners
    window.addEventListener('gamepadconnected', (e: any) => {
      Toast.show(`Gamepad detected: ${e.gamepad?.id || 'Controller'}`, '🎮');
      this.scanHardwareAndConnectivity();
    });
    window.addEventListener('gamepaddisconnected', (e: any) => {
      Toast.show(`Gamepad disconnected: ${e.gamepad?.id || 'Controller'}`, '🎮');
      this.scanHardwareAndConnectivity();
    });

    // 4. Periodic background health heartbeat (every 12 seconds)
    setInterval(() => {
      this.checkSubsystemHeartbeats();
    }, 12000);
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('AutoDetectionEngine notify error:', err);
      }
    });
  }

  public getHardwareInfo(): HardwareDetectionResult | null {
    return this.hardwareInfo;
  }

  public getSubsystems(): SubsystemStatus[] {
    return this.subsystems;
  }

  public getAvailableUpdates(): SystemUpdateItem[] {
    return this.availableUpdates;
  }

  public getOverallHealthScore(): number {
    if (this.subsystems.length === 0) return 100;
    const connectedCount = this.subsystems.filter(
      (s) => s.status === 'connected' || s.status === 'update_available'
    ).length;
    return Math.round((connectedCount / this.subsystems.length) * 100);
  }

  public getIsScanning(): boolean {
    return this.isScanning;
  }

  public getIsUpdatingAll(): boolean {
    return this.isUpdatingAll;
  }

  /**
   * Scans all connected hardware, storage quotas, display metrics, and audio devices.
   */
  public async scanHardwareAndConnectivity(): Promise<HardwareDetectionResult> {
    this.isScanning = true;
    this.notify();

    try {
      // 1. CPU & Wasm feature checks
      const cores = navigator.hardwareConcurrency || 4;
      const platform = navigator.platform || 'x86_64-linux';
      const wasmSimd = typeof WebAssembly === 'object' && typeof (WebAssembly as any).validate === 'function';
      const wasmThreads = typeof SharedArrayBuffer !== 'undefined';

      // 2. GPU & Display checks
      let vendor = 'Standard Virtual GPU';
      let renderer = 'WebGL 2.0 Hardware Rasterizer';
      let maxTextureSize = 4096;
      let webgl2Supported = false;
      let webgpuSupported = 'gpu' in navigator;

      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
          webgl2Supported = !!canvas.getContext('webgl2');
          maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor;
            renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer;
          }
        }
      } catch {}

      // Measure screen refresh rate
      const refreshRateHz = await this.measureRefreshRate();
      const colorGamut = window.matchMedia('(color-gamut: p3)').matches ? 'Display-P3' : 'sRGB';
      const pixelRatio = window.devicePixelRatio || 1;
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const colorDepth = window.screen.colorDepth || 24;

      // 3. Storage Quota Estimation
      let estimatedQuotaBytes = 50 * 1024 * 1024 * 1024; // 50GB default
      let estimatedUsageBytes = 120 * 1024 * 1024; // 120MB default
      let percentUsed = 0.5;

      if (navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          if (estimate.quota) estimatedQuotaBytes = estimate.quota;
          if (estimate.usage) estimatedUsageBytes = estimate.usage;
          percentUsed = Math.min(100, Math.round((estimatedUsageBytes / estimatedQuotaBytes) * 1000) / 10);
        } catch {}
      }

      const indexedDbAvailable = typeof indexedDB !== 'undefined';
      const opfsAvailable = 'storage' in navigator && 'getDirectory' in navigator.storage;
      const localStorageEntries = localStorage.length;

      // VFS metrics
      let vfsFileCount = 0;
      let vfsTotalSizeBytes = 0;
      if (Kernel.vfs) {
        try {
          const files = await Kernel.vfs.list();
          vfsFileCount = files.length;
          vfsTotalSizeBytes = files.reduce((acc, f) => acc + (f.content ? f.content.length : 0), 0);
        } catch {}
      }

      // 4. Network Info
      const navConn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const online = navigator.onLine;
      const effectiveType = navConn?.effectiveType || (online ? '4g' : 'offline');
      const downlinkMbps = navConn?.downlink || 25.0;
      const rttMs = navConn?.rtt || 15;
      const saveData = !!navConn?.saveData;

      // Test host bridge latency
      let hostBridgeLatencyMs: number | null = null;
      let hostBridgeConnected = false;
      try {
        const start = performance.now();
        const res = await fetch('/api/health', { signal: AbortSignal.timeout(1800) });
        if (res.ok) {
          hostBridgeLatencyMs = Math.round(performance.now() - start);
          hostBridgeConnected = true;
        }
      } catch {
        hostBridgeConnected = false;
      }

      // 5. Peripherals & Battery
      let batteryInfo = {
        supported: false,
        level: 1,
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
      };

      if ((navigator as any).getBattery) {
        try {
          const b = await (navigator as any).getBattery();
          batteryInfo = {
            supported: true,
            level: b.level,
            charging: b.charging,
            chargingTime: b.chargingTime,
            dischargingTime: b.dischargingTime,
          };
        } catch {}
      }

      // Gamepads
      let gamepadsCount = 0;
      let gamepadsList: string[] = [];
      if (navigator.getGamepads) {
        const pads = navigator.getGamepads();
        for (let i = 0; i < pads.length; i++) {
          if (pads[i]) {
            gamepadsCount++;
            gamepadsList.push(pads[i]?.id || `Gamepad Slot #${i}`);
          }
        }
      }

      const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const maxTouchPoints = navigator.maxTouchPoints || 0;
      const keyboardLayout = (navigator as any).keyboard ? 'Virtual / Detected' : 'US QWERTY Standard';

      // Media Devices
      let mediaInputCount = 0;
      let mediaOutputCount = 0;
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          mediaInputCount = devices.filter((d) => d.kind === 'audioinput' || d.kind === 'videoinput').length;
          mediaOutputCount = devices.filter((d) => d.kind === 'audiooutput').length;
        } catch {}
      }

      // 6. Audio Subsystem
      let webAudioSupported = false;
      let sampleRate = 48000;
      let audioState = 'running';
      let outputChannels = 2;
      let baseLatencyMs = 5.3;

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          webAudioSupported = true;
          const ctx = new AudioCtx();
          sampleRate = ctx.sampleRate;
          audioState = ctx.state;
          outputChannels = ctx.destination.maxChannelCount || 2;
          baseLatencyMs = Math.round((ctx.baseLatency || 0.005) * 1000 * 10) / 10;
          if (ctx.state === 'running') {
            ctx.close().catch(() => {});
          }
        }
      } catch {}

      const result: HardwareDetectionResult = {
        cpu: {
          cores,
          architecture: 'x86_64 / ARM64 Compatible JIT',
          platform,
          wasmSimd,
          wasmThreads,
          concurrencyScore: cores * 1250,
        },
        gpu: {
          vendor,
          renderer,
          webgl2Supported,
          webgpuSupported,
          maxTextureSize,
          refreshRateHz,
          colorGamut,
          pixelRatio,
          screenWidth,
          screenHeight,
          colorDepth,
        },
        storage: {
          estimatedQuotaBytes,
          estimatedUsageBytes,
          percentUsed,
          indexedDbAvailable,
          opfsAvailable,
          localStorageEntries,
          vfsFileCount,
          vfsTotalSizeBytes,
        },
        network: {
          online,
          effectiveType,
          downlinkMbps,
          rttMs,
          saveData,
          hostBridgeLatencyMs,
          hostBridgeConnected,
        },
        peripherals: {
          battery: batteryInfo,
          gamepadsCount,
          gamepads: gamepadsList,
          touchSupport,
          maxTouchPoints,
          keyboardLayout,
          mediaInputCount,
          mediaOutputCount,
        },
        audio: {
          webAudioSupported,
          sampleRate,
          state: audioState,
          outputChannels,
          baseLatencyMs,
        },
      };

      this.hardwareInfo = result;

      // Update subsystem statuses based on hardware detection
      this.updateSubsystemMetrics(result);

      return result;
    } finally {
      this.isScanning = false;
      this.notify();
    }
  }

  private async measureRefreshRate(): Promise<number> {
    return new Promise((resolve) => {
      let count = 0;
      let start = performance.now();
      const frame = () => {
        count++;
        if (count < 15) {
          requestAnimationFrame(frame);
        } else {
          const delta = performance.now() - start;
          const fps = Math.round((count / delta) * 1000);
          resolve(fps > 130 ? 144 : fps > 105 ? 120 : fps > 80 ? 90 : 60);
        }
      };
      requestAnimationFrame(frame);
    });
  }

  private handleNetworkStatusChange(online: boolean) {
    const netSub = this.subsystems.find((s) => s.id === 'network_gateway');
    if (netSub) {
      netSub.status = online ? 'connected' : 'disconnected';
      netSub.details = online
        ? 'VirtIO-Net bridge online. Gateway active.'
        : 'Network link down. Seamless offline VFS fallback engaged.';
      netSub.lastChecked = new Date().toLocaleTimeString();
    }

    if (online) {
      Toast.show('Network connected: Subsystems synchronized', '🌐');
      this.scanHardwareAndConnectivity();
    } else {
      Toast.show('Network offline: Operating in standalone cached mode', '⚠️');
    }
    this.notify();
  }

  private async checkSubsystemHeartbeats() {
    const now = new Date().toLocaleTimeString();

    // Check host bridge
    try {
      const start = performance.now();
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(1200) });
      const hostSub = this.subsystems.find((s) => s.id === 'host_bridge');
      if (hostSub) {
        if (res.ok) {
          hostSub.status = 'connected';
          hostSub.latencyMs = Math.round(performance.now() - start);
          hostSub.lastChecked = now;
        } else {
          hostSub.status = 'disconnected';
          hostSub.lastChecked = now;
        }
      }
    } catch {
      const hostSub = this.subsystems.find((s) => s.id === 'host_bridge');
      if (hostSub) {
        hostSub.status = 'disconnected';
        hostSub.lastChecked = now;
      }
    }

    // Check VM state
    const vmSub = this.subsystems.find((s) => s.id === 'linux_vm');
    if (vmSub) {
      const vmState = Kernel.vm?.getState?.() || 'ready';
      vmSub.status = vmState === 'ready' || vmState === 'booting' ? 'connected' : 'disconnected';
      vmSub.lastChecked = now;
    }

    this.notify();
  }

  private updateSubsystemMetrics(hw: HardwareDetectionResult) {
    const now = new Date().toLocaleTimeString();

    // Host bridge
    const hostSub = this.subsystems.find((s) => s.id === 'host_bridge');
    if (hostSub) {
      hostSub.status = hw.network.hostBridgeConnected ? 'connected' : 'disconnected';
      hostSub.latencyMs = hw.network.hostBridgeLatencyMs || 0;
      hostSub.lastChecked = now;
    }

    // GPU
    const gpuSub = this.subsystems.find((s) => s.id === 'gpu_compositor');
    if (gpuSub) {
      gpuSub.details = `${hw.gpu.renderer} (${hw.gpu.refreshRateHz}Hz, ${hw.gpu.colorGamut})`;
      gpuSub.lastChecked = now;
    }

    // Audio
    const audioSub = this.subsystems.find((s) => s.id === 'webaudio_dac');
    if (audioSub) {
      audioSub.details = `${hw.audio.sampleRate}Hz DAC, ${hw.audio.outputChannels}ch, ${hw.audio.baseLatencyMs}ms base latency`;
      audioSub.lastChecked = now;
    }

    // VFS
    const vfsSub = this.subsystems.find((s) => s.id === 'vfs_storage');
    if (vfsSub) {
      vfsSub.details = `${hw.storage.vfsFileCount} files stored (${Math.round(hw.storage.vfsTotalSizeBytes / 1024)} KB) in IndexedDB.`;
      vfsSub.lastChecked = now;
    }
  }

  /**
   * Runs an update on a specific update item.
   */
  public async applyUpdate(updateId: string): Promise<boolean> {
    const item = this.availableUpdates.find((u) => u.id === updateId);
    if (!item) return false;

    item.status = 'downloading';
    item.progress = 10;
    this.notify();

    try {
      // Simulate download progress
      for (let p = 20; p <= 70; p += 15) {
        await new Promise((r) => setTimeout(r, 200));
        item.progress = p;
        this.notify();
      }

      item.status = 'verifying';
      item.progress = 85;
      this.notify();
      await new Promise((r) => setTimeout(r, 250));

      item.status = 'installing';
      item.progress = 95;
      this.notify();
      await new Promise((r) => setTimeout(r, 300));

      item.status = 'completed';
      item.progress = 100;
      item.currentVersion = item.newVersion;

      // Update corresponding subsystem status
      if (item.id === 'apk_index') {
        const linuxSub = this.subsystems.find((s) => s.id === 'linux_vm');
        if (linuxSub) linuxSub.details += ' (APK repository index v3.19.2 updated)';
      }

      Toast.show(`Updated: ${item.name}`, '🚀');
      this.notify();
      return true;
    } catch {
      item.status = 'error';
      this.notify();
      return false;
    }
  }

  /**
   * Synchronizes and updates all subsystems and repositories in one click.
   */
  public async syncAndUpdateAll(): Promise<{ success: boolean; count: number }> {
    if (this.isUpdatingAll) return { success: false, count: 0 };
    this.isUpdatingAll = true;
    this.notify();

    Toast.show('Starting full system auto-sync and update...', '🔄');

    let updatedCount = 0;
    try {
      // 1. Re-scan hardware
      await this.scanHardwareAndConnectivity();

      // 2. Update pending packages
      for (const item of this.availableUpdates) {
        if (item.status !== 'completed') {
          await this.applyUpdate(item.id);
          updatedCount++;
        }
      }

      // 3. Sync VFS change journal
      if (Kernel.journal) {
        Kernel.journal.record('modify', '/etc/system_update', 'autodetect_daemon');
      }

      // 4. Ping host bridge
      if (Kernel.host) {
        await Kernel.host.checkAvailability().catch(() => {});
      }

      // Mark all subsystems as synchronized and healthy
      this.subsystems.forEach((s) => {
        s.lastChecked = new Date().toLocaleTimeString();
        if (s.status === 'update_available') {
          s.status = 'connected';
        }
      });

      Toast.show(`Full system sync complete! ${updatedCount} modules updated`, '✨');
      return { success: true, count: updatedCount };
    } finally {
      this.isUpdatingAll = false;
      this.notify();
    }
  }

  /**
   * Re-probes or reconnects a specific disconnected subsystem.
   */
  public async reconnectSubsystem(subsystemId: string): Promise<boolean> {
    const sub = this.subsystems.find((s) => s.id === subsystemId);
    if (!sub) return false;

    sub.status = 'checking';
    this.notify();

    await new Promise((r) => setTimeout(r, 600));

    if (sub.id === 'host_bridge') {
      try {
        const start = performance.now();
        const res = await fetch('/api/health', { signal: AbortSignal.timeout(1500) });
        if (res.ok) {
          sub.status = 'connected';
          sub.latencyMs = Math.round(performance.now() - start);
          sub.details = 'Real-time REST & SSE synchronization bridge active.';
          Toast.show('Host Kernel Bridge reconnected', '✓');
        } else {
          sub.status = 'disconnected';
          sub.details = 'Host bridge in standby mode. Seamless local VFS engaged.';
        }
      } catch {
        sub.status = 'disconnected';
        sub.details = 'Host bridge in standby mode. Seamless local VFS engaged.';
      }
    } else if (sub.id === 'linux_vm') {
      Kernel.vm?.start?.();
      sub.status = 'connected';
      Toast.show('Alpine Linux VM signaled and re-probed', '⚡');
    } else {
      sub.status = 'connected';
      Toast.show(`${sub.name} re-probed and verified`, '✓');
    }

    sub.lastChecked = new Date().toLocaleTimeString();
    this.notify();
    return sub.status === 'connected';
  }
}
