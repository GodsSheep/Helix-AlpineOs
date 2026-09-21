import { VirtualFileSystem } from './VFS';
import { VirtualMachineEngine } from './VM';
import { WindowManager } from './WM';
import { AppRegistry } from './AppRegistry';
import { StateManager } from './State';
import { NetworkManager } from './Network';
import { SystemLogger } from './Logger';
import { ErrorManager } from './Errors';
import { ChangeJournal } from './ChangeJournal';
import { ConfigManager } from './ConfigManager';
import { CacheManager } from './CacheManager';
import { Settings, SettingsService } from './Settings';
import { GuiDisplayServer } from './GuiServer';
import { SoundManager } from './SoundManager';
import { NativeEngine } from './NativeEngine';
import { BackpackService } from './Backpack';
import { OSSaveManager } from './OSSaveManager';

import { TrashManager } from './TrashManager';
import { ThemeEngine } from './ThemeEngine';
import { HostKernelBridge } from './HostKernelBridge';
import { AutoDetectionEngine } from './AutoDetectionEngine';
import { ChrootManager } from './ChrootManager';

class HelixKernel {
  public state = new StateManager();
  public logger = new SystemLogger();
  public errors = new ErrorManager();
  public journal = new ChangeJournal(this.logger);
  public cache = new CacheManager(this.logger);
  public settings = Settings;
  public theme = ThemeEngine;
  public trash = TrashManager;
  public sound = SoundManager;
  public native = NativeEngine;
  public backpack = new BackpackService();
  public saveManager = OSSaveManager;
  public host = HostKernelBridge;
  public autodetect = AutoDetectionEngine.get();
  public chroot = ChrootManager.getInstance();
  
  public vfs = new VirtualFileSystem();
  public config = new ConfigManager(this.vfs);
  public vm = new VirtualMachineEngine(this.vfs);
  public wm = new WindowManager();
  public apps = AppRegistry;
  public network = new NetworkManager(this.state);
  public gui = GuiDisplayServer.get();

  async init() {
    this.logger.log('KERNEL', 'info', 'Kernel initializing...');
    NativeEngine.init();
    
    // Wire dependencies
    this.vfs.setJournal(this.journal);
    this.gui.setWindowManager(this.wm);
    this.vm.setWindowManager(this.wm);
    
    await this.vfs.init();
    await this.chroot.init();
    
    // Check and initialize host sync
    const isHostOnline = await HostKernelBridge.checkAvailability();
    if (isHostOnline) {
      this.logger.log('HOST', 'info', 'Real Linux Host Kernel connected');
      // Auto-restore any existing profile user data
      await HostKernelBridge.restoreUserData('alpine', this.vfs).catch(() => {});
      // Start background synchronization
      HostKernelBridge.startAutoSync(this.vfs, 'alpine');
    }
    
    // Read initial config and log it
    const version = await this.config.get('version', '6.0.0');
    this.logger.log('KERNEL', 'info', `Loaded Helix version: ${version}`);

    // Wire up VM state to unified StateManager
    this.vm.onStateChange((linuxState) => {
      this.state.update({ linux: linuxState });
      this.logger.log('VM', 'info', `Linux state transitioned to: ${linuxState}`);
    });

    this.state.update({ helix: 'ready' });
    this.logger.log('KERNEL', 'info', 'Kernel ready');

    // Mount global for V86 callbacks if needed
    (window as any).Kernel = this;
    
    // Check if Safe Mode is requested
    const isSafeMode = typeof localStorage !== 'undefined' && localStorage.getItem('helix_safe_mode') === 'true';
    if (!isSafeMode) {
      // Start Alpine Host Engine boot sequence
      setTimeout(() => {
        this.logger.log('VM', 'info', 'Booting Alpine Linux Host Engine...');
        this.vm.start().catch((err) => {
          this.logger.log('VM', 'warn', `Alpine Host Engine boot notice: ${err?.message || err}`);
        });
      }, 100);
    } else {
      this.logger.log('KERNEL', 'warn', 'Helix Safe Mode active: Skipping automated microVM boot.');
    }

    // Start Reinforcement Health Monitor
    this.startHealthMonitor();
  }

  private startHealthMonitor() {
    let consecutiveVmFailures = 0;
    setInterval(() => {
      const stats = {
        vfs: 'online',
        vm: this.vm.getState(),
        wm: this.wm.getWindows().length,
        ts: Date.now()
      };
      this.state.update({ health: stats });
      
      // Auto-reconcile if VM is stuck (Reinforcement) with backoff
      if (stats.vm === 'error' && consecutiveVmFailures < 2) {
        consecutiveVmFailures++;
        this.logger.log('REINFORCEMENT', 'warn', `VM failure detected. Attempting hot reload (attempt ${consecutiveVmFailures}/2)...`);
        this.vm.start().catch(() => {});
      } else if (stats.vm === 'ready') {
        consecutiveVmFailures = 0;
      }
    }, 5000);
  }
}

export const Kernel = new HelixKernel();
export * from './types';
export * from './State';
export * from './Logger';
export * from './Errors';
export * from './ChangeJournal';
export * from './ConfigManager';
export * from './CacheManager';
export * from './Settings';
export * from './NetworkService';
export * from './SoundManager';
export * from './NativeEngine';
export * from './TrashManager';
export * from './ThemeEngine';
export * from './OSSaveManager';
export * from './HostKernelBridge';
export * from './AutoDetectionEngine';
export * from './SelfHealingEngine';
export * from './NotificationService';
export * from './AutomatedTaskManager';
