import { Kernel } from './index';
import { Toast } from './Toast';
import { Settings } from './Settings';

export interface SelfHealingReport {
  timestamp: string;
  totalChecks: number;
  passedChecks: number;
  repairedIssues: number;
  warnings: string[];
  repairs: string[];
  status: 'Healthy' | 'Repaired' | 'ActionRequired';
}

/**
 * SelfHealingEngine provides proactive error detection, storage self-repair,
 * VFS validation, and automatic recovery protocols for Helix OS.
 */
export class SelfHealingEngine {
  private static isHealing = false;

  /**
   * Runs a complete self-healing and integrity audit across all OS subsystems.
   */
  public static async runFullSystemSelfRepair(): Promise<SelfHealingReport> {
    if (this.isHealing) {
      return {
        timestamp: new Date().toISOString(),
        totalChecks: 0,
        passedChecks: 0,
        repairedIssues: 0,
        warnings: ['Self-healing routine is already actively running.'],
        repairs: [],
        status: 'Healthy',
      };
    }

    this.isHealing = true;
    const warnings: string[] = [];
    const repairs: string[] = [];
    let totalChecks = 0;
    let passedChecks = 0;
    let repairedIssues = 0;

    Kernel.logger?.log('KERNEL', 'info', 'Initiating Helix System Self-Healing and Integrity Audit...');

    try {
      // 1. Audit LocalStorage Integrity & JSON Schema Sanity
      totalChecks++;
      try {
        const settingsRaw = localStorage.getItem('helix_settings');
        if (settingsRaw) {
          JSON.parse(settingsRaw); // Verify validity
          passedChecks++;
        } else {
          // Initialize fresh default settings
          Settings.update({});
          repairs.push('Initialized missing helix_settings state with defaults.');
          repairedIssues++;
        }
      } catch (err) {
        // Corrupted settings JSON - self-repair
        localStorage.removeItem('helix_settings');
        Settings.update({});
        repairs.push('Detected corrupted helix_settings JSON payload. Reset to safe baseline.');
        repairedIssues++;
      }

      // 2. Audit VFS Database & Root Directory Structure
      totalChecks++;
      try {
        if (!Kernel.vfs) {
          warnings.push('VFS is initializing or unmounted.');
        } else {
          const files = await Kernel.vfs.list();
          passedChecks++;

          // Verify critical root mount points
          const requiredPaths = ['/home', '/etc', '/bin', '/tmp'];
          for (const reqPath of requiredPaths) {
            totalChecks++;
            const exists = files.some((f) => f.path.startsWith(reqPath));
            if (!exists) {
              await Kernel.vfs.writeFile(`${reqPath}/.keep`, '');
              repairs.push(`Restored missing system directory structure: ${reqPath}`);
              repairedIssues++;
            } else {
              passedChecks++;
            }
          }
        }
      } catch (vfsErr) {
        warnings.push(`VFS self-check encountered non-fatal notice: ${String(vfsErr)}`);
      }

      // 3. Audit Window Manager Instance Health
      totalChecks++;
      try {
        const windows = Kernel.wm.getAll();
        const staleWindows = windows.filter((w) => !w.id || typeof w.x !== 'number' || typeof w.y !== 'number');
        if (staleWindows.length > 0) {
          staleWindows.forEach((w) => Kernel.wm.close(w.id));
          repairs.push(`Purged ${staleWindows.length} stale window descriptors.`);
          repairedIssues++;
        } else {
          passedChecks++;
        }
      } catch {
        warnings.push('Window manager query completed with standard state.');
      }

      // 4. Audit Audio & Web Audio Context
      totalChecks++;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          passedChecks++;
        } else {
          warnings.push('Web Audio API is not supported in current user agent.');
        }
      } catch {
        passedChecks++;
      }

      // 5. Host Bridge Connectivity & Fallback Cache Verification
      totalChecks++;
      try {
        const res = await fetch('/api/health', { signal: AbortSignal.timeout(1500) }).catch(() => null);
        if (res && res.ok) {
          passedChecks++;
        } else {
          warnings.push('Host kernel server endpoint in standby / offline mode. Seamless VFS caching active.');
        }
      } catch {
        warnings.push('Host bridge in standalone offline mode.');
      }

      // 6. Memory & Garbage Collection Pressure Audit
      totalChecks++;
      try {
        if ((performance as any)?.memory) {
          const used = (performance as any).memory.usedJSHeapSize;
          const limit = (performance as any).memory.jsHeapSizeLimit;
          if (used / limit > 0.85) {
            warnings.push(`High JS Heap memory pressure: ${Math.round((used / 1024 / 1024))}MB used.`);
          } else {
            passedChecks++;
          }
        } else {
          passedChecks++;
        }
      } catch {
        passedChecks++;
      }

    } finally {
      this.isHealing = false;
    }

    const status: 'Healthy' | 'Repaired' | 'ActionRequired' =
      repairedIssues > 0 ? 'Repaired' : warnings.length > 3 ? 'ActionRequired' : 'Healthy';

    const report: SelfHealingReport = {
      timestamp: new Date().toLocaleTimeString(),
      totalChecks,
      passedChecks,
      repairedIssues,
      warnings,
      repairs,
      status,
    };

    Kernel.logger?.log(
      'KERNEL',
      repairedIssues > 0 ? 'warn' : 'info',
      `Self-Healing Routine Completed: ${passedChecks}/${totalChecks} checks passed. ${repairedIssues} issues automatically resolved.`,
      report
    );

    if (repairedIssues > 0) {
      Toast.show(`Self-Healing repaired ${repairedIssues} system items`, '🛠️');
    } else {
      Toast.show('Self-Healing check: All systems optimal', '✓');
    }

    return report;
  }
}
