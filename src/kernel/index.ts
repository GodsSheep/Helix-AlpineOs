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
    
    // Start Alpine Host Engine boot sequence
    setTimeout(() => {
      this.logger.log('VM', 'info', 'Booting Alpine Linux Host Engine...');
      this.vm.start();
    }, 100);

    // Start Reinforcement Health Monitor
    this.startHealthMonitor();
  }

  private startHealthMonitor() {
    setInterval(() => {
      const stats = {
        vfs: 'online',
        vm: this.vm.getState(),
        wm: this.wm.getWindows().length,
        ts: Date.now()
      };
      this.state.update({ health: stats });
      
      // Auto-reconcile if VM is stuck (Reinforcement)
      if (stats.vm === 'error') {
        this.logger.log('REINFORCEMENT', 'warn', 'VM failure detected. Attempting hot reload...');
        this.vm.start();
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
