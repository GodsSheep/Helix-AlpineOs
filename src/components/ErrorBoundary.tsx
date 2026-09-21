import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Terminal, FileText, Copy, Check, RotateCcw, Wrench, ShieldAlert } from 'lucide-react';
import { Kernel } from '../kernel';
import { Toast } from '../kernel/Toast';
import { SoundManager } from '../kernel/SoundManager';

interface WindowErrorBoundaryProps {
  appId: string;
  windowId: string;
  title?: string;
  children: ReactNode;
}

interface WindowErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isCopied: boolean;
}

/**
 * WindowErrorBoundary isolates application failures to their specific window frame,
 * preventing any single app crash from propagating to the desktop or other windows.
 */
export class WindowErrorBoundary extends Component<WindowErrorBoundaryProps, WindowErrorBoundaryState> {
  constructor(props: WindowErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isCopied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<WindowErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log to Kernel logger & error management system
    try {
      Kernel.logger?.log('APP', 'error', `Application "${this.props.appId}" encountered uncaught runtime error`, {
        appId: this.props.appId,
        windowId: this.props.windowId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
      Kernel.errors?.handleError(error);
    } catch {}

    try {
      SoundManager.play('error');
    } catch {}
  }

  handleRestart = () => {
    SoundManager.play('click');
    this.setState({ hasError: false, error: null, errorInfo: null, isCopied: false });
  };

  handleResetAndRestart = () => {
    SoundManager.play('click');
    try {
      // Clear any app-specific local state if applicable
      localStorage.removeItem(`helix_app_state_${this.props.appId}`);
      Toast.show(`Reset app state cache for ${this.props.appId}`, '🧹');
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null, isCopied: false });
  };

  handleCopyDump = async () => {
    SoundManager.play('click');
    const dump = {
      timestamp: new Date().toISOString(),
      appId: this.props.appId,
      windowId: this.props.windowId,
      error: {
        name: this.state.error?.name,
        message: this.state.error?.message,
        stack: this.state.error?.stack,
      },
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      memory: (performance as any)?.memory ? {
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      } : 'Not available',
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(dump, null, 2));
      this.setState({ isCopied: true });
      Toast.show('Crash diagnostic dump copied to clipboard', '📋');
      setTimeout(() => this.setState({ isCopied: false }), 3000);
    } catch {
      Toast.show('Failed to copy to clipboard', '⚠️');
    }
  };

  handleOpenSyslog = () => {
    SoundManager.play('click');
    Kernel.wm.launch('syslog');
  };

  handleOpenTerminal = () => {
    SoundManager.play('click');
    Kernel.wm.launch('term');
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { appId, title } = this.props;
      const errorMsg = this.state.error?.message || 'An unexpected runtime error occurred.';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <div className="h-full w-full bg-[#0d0f17] text-gray-200 p-6 flex flex-col justify-between overflow-y-auto font-sans select-none">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3.5 pb-4 border-b border-red-500/20">
              <div className="p-3 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/30 shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white font-mono truncate">
                    {title || appId} Crashed Safely
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono border border-red-500/30">
                    App Isolated
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Helix OS isolated this application failure to prevent desktop instability. The microkernel and other running processes remain completely healthy.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="bg-[#151824] border border-white/10 rounded-2xl p-4 font-mono space-y-2">
              <div className="text-[11px] font-bold text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Exception Details:</span>
              </div>
              <div className="text-xs text-red-300/90 font-mono bg-red-950/30 border border-red-900/40 rounded-xl p-3 select-text break-words">
                {errorMsg}
              </div>

              {componentStack && (
                <details className="mt-2 text-[10px] text-gray-400 cursor-pointer">
                  <summary className="hover:text-gray-200 transition">View React Component Stack Trace</summary>
                  <pre className="mt-2 p-2.5 bg-black/40 rounded-lg text-gray-400 overflow-x-auto select-text font-mono text-[9px] leading-tight">
                    {componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={this.handleRestart}
                className="px-3.5 py-1.5 rounded-xl bg-[#6ee7b7] text-black font-bold text-xs flex items-center gap-1.5 hover:bg-[#5cd4a5] transition cursor-pointer shadow-md shadow-[#6ee7b7]/15 font-mono"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restart App</span>
              </button>

              <button
                onClick={this.handleResetAndRestart}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs flex items-center gap-1.5 transition cursor-pointer font-mono"
                title="Clear local state cache and restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Cache & Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={this.handleCopyDump}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs flex items-center gap-1.5 transition cursor-pointer font-mono"
                title="Copy full crash diagnostic dump to clipboard"
              >
                {this.state.isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{this.state.isCopied ? 'Copied!' : 'Copy Dump'}</span>
              </button>

              <button
                onClick={this.handleOpenSyslog}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 border border-white/10 transition cursor-pointer"
                title="Open Syslog & Kernel Logs"
              >
                <FileText className="w-4 h-4" />
              </button>

              <button
                onClick={this.handleOpenTerminal}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 hover:text-emerald-300 border border-white/10 transition cursor-pointer"
                title="Open Terminal Shell"
              >
                <Terminal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface RootErrorBoundaryProps {
  children: ReactNode;
}

interface RootErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isConfirmingReset: boolean;
  isRepairing: boolean;
  repairStatus: string | null;
}

/**
 * RootErrorBoundary provides a catastrophic system fallback if the root UI fails.
 */
export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isConfirmingReset: false,
      isRepairing: false,
      repairStatus: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<RootErrorBoundaryState> {
    return { hasError: true, error };
  }

  handleSafeModeReboot = () => {
    try {
      localStorage.setItem('helix_safe_mode', 'true');
      // Clear potentially corrupt transient UI state
      localStorage.removeItem('helix_windows');
      localStorage.removeItem('helix_active_win');
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  handleQuickSelfRepair = async () => {
    this.setState({ isRepairing: true, repairStatus: 'Running automated self-repair...' });
    try {
      // Clear corrupt transient states
      localStorage.removeItem('helix_windows');
      localStorage.removeItem('helix_active_win');
      localStorage.setItem('helix_safe_mode', 'true');

      // Sanitize settings
      try {
        const raw = localStorage.getItem('helix_settings');
        if (raw) JSON.parse(raw);
      } catch {
        localStorage.removeItem('helix_settings');
      }

      this.setState({ repairStatus: 'Sanitized configurations. Reloading...' });
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err: any) {
      this.setState({ isRepairing: false, repairStatus: `Notice: ${err?.message || 'Reloading...'}` });
      setTimeout(() => window.location.reload(), 800);
    }
  };

  handleFactoryReset = async () => {
    try {
      localStorage.clear();
      if (typeof indexedDB !== 'undefined') {
        indexedDB.deleteDatabase('HelixDrive');
        indexedDB.deleteDatabase('helix_vfs');
      }
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys().catch(() => []);
        for (const k of keys) {
          await caches.delete(k).catch(() => {});
        }
      }
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
        for (const reg of regs) {
          await reg.unregister().catch(() => {});
        }
      }
    } catch {}
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#07080c] text-gray-200 flex flex-col items-center justify-center p-6 font-mono z-[99999]">
          <div className="max-w-lg w-full bg-[#121520] border border-red-500/30 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white tracking-wide">Helix OS Safe Recovery Console</h1>
              <p className="text-xs text-gray-400 leading-relaxed">
                A critical exception occurred at the desktop compositor root. Safe recovery environment is active.
              </p>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-2xl p-4 text-left text-xs text-red-300 select-text overflow-x-auto max-h-32">
              {this.state.error?.message || 'Unknown root exception'}
            </div>

            {this.state.repairStatus && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
                {this.state.repairStatus}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={this.handleSafeModeReboot}
                className="w-full py-2.5 rounded-xl bg-[#6ee7b7] text-black font-bold text-xs hover:bg-[#5cd4a5] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reboot in Safe Mode</span>
              </button>

              <button
                onClick={this.handleQuickSelfRepair}
                disabled={this.state.isRepairing}
                className="w-full py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Quick Self-Repair & Clean Reboot</span>
              </button>

              {!this.state.isConfirmingReset ? (
                <button
                  onClick={() => this.setState({ isConfirmingReset: true })}
                  className="w-full py-2.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Factory Reset (Clear All Local Storage)</span>
                </button>
              ) : (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
                  <p className="text-xs text-red-400 font-semibold">
                    Are you sure? This will wipe all local disks, caches, and storage.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={this.handleFactoryReset}
                      className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-500 transition cursor-pointer"
                    >
                      Confirm Full Wipe
                    </button>
                    <button
                      onClick={() => this.setState({ isConfirmingReset: false })}
                      className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-xs hover:bg-white/20 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
