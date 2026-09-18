import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  BatteryCharging, 
  BatteryFull, 
  BatteryMedium, 
  BatteryLow, 
  BatteryWarning, 
  Plug, 
  Sliders, 
  ChevronRight, 
  ShieldCheck, 
  Flame, 
  Leaf, 
  Activity, 
  Moon,
  AlertTriangle,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { Settings, RealDeviceHardwareInfo, PowerProfile } from '../kernel/Settings';
import { Kernel } from '../kernel';

interface BatteryIndicatorProps {
  onOpenSettings?: (tab?: string) => void;
  className?: string;
  showPercentage?: boolean;
}

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({
  onOpenSettings,
  className = '',
  showPercentage = true,
}) => {
  const [hardware, setHardware] = useState<RealDeviceHardwareInfo>(Settings.getHardwareInfo());
  const [settings, setSettings] = useState(Settings.get());
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Real-time battery and hardware sync
  useEffect(() => {
    const unsubHw = Settings.subscribeHardware((info) => {
      setHardware({ ...info });
    });
    const unsubSet = Settings.subscribe((s) => {
      setSettings({ ...s });
    });

    // Also attach direct navigator.getBattery listeners for immediate reactivity
    let batteryObj: any = null;
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryObj = battery;
        const sync = () => {
          setHardware((prev) => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
            isCharging: battery.charging,
            chargingTime: Number.isFinite(battery.chargingTime) ? battery.chargingTime : null,
            dischargingTime: Number.isFinite(battery.dischargingTime) ? battery.dischargingTime : null,
          }));
        };
        sync();
        battery.addEventListener('levelchange', sync);
        battery.addEventListener('chargingchange', sync);
        battery.addEventListener('chargingtimechange', sync);
        battery.addEventListener('dischargingtimechange', sync);
      }).catch(() => {
        // Desktop fallback without battery sensor
      });
    }

    return () => {
      unsubHw();
      unsubSet();
    };
  }, []);

  // Close popover on outside click or Escape key
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const level = hardware.batteryLevel !== null ? hardware.batteryLevel : 100;
  const isCharging = hardware.isCharging;
  const isLow = level <= settings.lowBatteryThreshold && !isCharging;
  const isCritical = level <= 10 && !isCharging;

  // Format time remaining / time to full
  const formatTimeEstimate = () => {
    if (isCharging) {
      if (level >= 100) return 'Fully charged';
      if (hardware.chargingTime && hardware.chargingTime > 0) {
        const hrs = Math.floor(hardware.chargingTime / 3600);
        const mins = Math.floor((hardware.chargingTime % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m until full`;
        return `${mins} min until full`;
      }
      return 'Fast charging on AC power';
    } else {
      if (hardware.dischargingTime && hardware.dischargingTime > 0) {
        const hrs = Math.floor(hardware.dischargingTime / 3600);
        const mins = Math.floor((hardware.dischargingTime % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m remaining`;
        return `${mins} min remaining`;
      }
      // Algorithmic estimate based on battery level & power profile
      const multiplier = settings.powerProfile === 'powersave' || settings.powerProfile === 'eco' ? 0.08 : 0.05;
      const estimatedHours = Math.max(0.5, Math.round((level * multiplier) * 10) / 10);
      return `~${estimatedHours} hours remaining`;
    }
  };

  const handleSetProfile = (profile: PowerProfile) => {
    Settings.setPowerProfile(profile);
  };

  const handleOpenPowerSettings = () => {
    setIsOpen(false);
    if (onOpenSettings) {
      onOpenSettings('power');
    } else {
      Kernel.wm.launch('settings');
    }
  };

  const handleTriggerSuspend = () => {
    setIsOpen(false);
    Kernel.state.update({ linux: 'suspended' });
  };

  // Determine battery color
  const getBatteryColor = () => {
    if (isCharging) return '#34d399'; // Emerald
    if (level <= 15) return '#f87171'; // Red
    if (level <= 35) return '#fbbf24'; // Amber
    return '#6ee7b7'; // Mint Teal
  };

  return (
    <div className="relative inline-block select-none" ref={popoverRef}>
      {/* Trigger Button in Menubar */}
      <button
        ref={triggerRef}
        id="menubar-battery-indicator"
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group px-2 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer border ${
          isOpen
            ? 'bg-[#6ee7b7]/20 border-[#6ee7b7]/60 text-white shadow-[0_0_12px_rgba(110,231,183,0.35)]'
            : isCritical
            ? 'bg-red-500/20 border-red-500/60 text-red-300 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]'
            : isLow
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
            : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-gray-200'
        } ${className}`}
        title={`Battery: ${level}% (${isCharging ? 'Charging' : 'On Battery'}) • Profile: ${settings.powerProfile}`}
        aria-label={`Battery Status ${level} percent, ${isCharging ? 'Charging' : 'Discharging'}`}
        aria-expanded={isOpen}
      >
        {/* Custom High-Fidelity Battery Capsule Icon */}
        <div className="relative flex items-center">
          <div 
            className="w-[20px] h-[11px] rounded-[3px] border p-[1px] flex items-center transition-colors"
            style={{ 
              borderColor: isCritical ? '#f87171' : isLow ? '#fbbf24' : isCharging ? '#34d399' : 'rgba(255,255,255,0.4)' 
            }}
          >
            {/* Battery Fill Bar */}
            <div
              className="h-full rounded-[1.5px] transition-all duration-500"
              style={{
                width: `${Math.max(8, Math.min(100, level))}%`,
                backgroundColor: getBatteryColor(),
                boxShadow: isCharging ? '0 0 6px rgba(52, 211, 153, 0.6)' : undefined,
              }}
            />
          </div>
          {/* Battery Cathode Nipple */}
          <div 
            className="w-[2px] h-[5px] rounded-r-[1px] -ml-[0.5px]"
            style={{ 
              backgroundColor: isCritical ? '#f87171' : isLow ? '#fbbf24' : 'rgba(255,255,255,0.4)' 
            }}
          />

          {/* Lightning Bolt Badge for Charging */}
          {isCharging && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Zap className="w-2.5 h-2.5 text-black fill-emerald-300 stroke-black drop-shadow-[0_0_3px_#34d399] animate-pulse" />
            </div>
          )}
        </div>

        {/* Battery Percentage Number */}
        {showPercentage && (
          <span className="font-mono text-[11px] font-semibold tracking-tight text-white/90">
            {level}%
          </span>
        )}

        {/* Power Profile Dot Indicator */}
        <span 
          className={`w-1.5 h-1.5 rounded-full hidden sm:inline-block ${
            settings.powerProfile === 'performance'
              ? 'bg-amber-400 shadow-[0_0_5px_#f59e0b]'
              : settings.powerProfile === 'powersave' || settings.powerProfile === 'eco'
              ? 'bg-emerald-400 shadow-[0_0_5px_#10b981]'
              : 'bg-cyan-400'
          }`} 
          title={`Active Profile: ${settings.powerProfile}`}
        />
      </button>

      {/* Interactive Battery Popover Flyout */}
      {isOpen && (
        <div 
          className="absolute right-0 top-10 w-72 sm:w-80 bg-[#10121a]/95 border border-white/15 rounded-2xl shadow-2xl p-4 space-y-3.5 backdrop-blur-2xl z-50 text-left animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-label="Power and Battery Status"
        >
          {/* Top Status Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-mono text-white">
                  {level}%
                </span>
                <span 
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase flex items-center gap-1 ${
                    isCharging 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : isLow
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-white/10 text-gray-300 border border-white/10'
                  }`}
                >
                  {isCharging ? (
                    <>
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      <span>Charging</span>
                    </>
                  ) : (
                    <>
                      <Plug className="w-2.5 h-2.5" />
                      <span>Battery</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {formatTimeEstimate()}
              </p>
            </div>

            {/* Visual Icon Box */}
            <div 
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isCharging 
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                  : isLow 
                  ? 'bg-red-500/15 border-red-500/30 text-red-400' 
                  : 'bg-white/5 border-white/10 text-[#6ee7b7]'
              }`}
            >
              {isCharging ? (
                <BatteryCharging className="w-5 h-5 animate-pulse" />
              ) : level > 70 ? (
                <BatteryFull className="w-5 h-5" />
              ) : level > 30 ? (
                <BatteryMedium className="w-5 h-5" />
              ) : (
                <BatteryLow className="w-5 h-5" />
              )}
            </div>
          </div>

          {/* Low Battery Alert Banner */}
          {isLow && (
            <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-2 text-red-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-[11px]">
                <p className="font-semibold text-red-300">Battery Low ({level}%)</p>
                <p className="text-red-300/80">Connect to AC power or switch to Power Saver profile to extend battery life.</p>
              </div>
            </div>
          )}

          {/* Power Profiles Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-gray-400 px-0.5 font-medium">
              <span>Power Mode Profile</span>
              <span className="text-[#6ee7b7] font-mono text-[10px] capitalize">
                {settings.powerProfile}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => handleSetProfile('performance')}
                className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                  settings.powerProfile === 'performance'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title="Lock high clocks for maximum performance"
              >
                <Flame className="w-3.5 h-3.5" />
                <span className="text-[10px]">Perf</span>
              </button>

              <button
                onClick={() => handleSetProfile('balanced')}
                className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                  settings.powerProfile === 'balanced'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title="Dynamic CPU frequency scaling"
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="text-[10px]">Balanced</span>
              </button>

              <button
                onClick={() => handleSetProfile('powersave')}
                className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                  settings.powerProfile === 'powersave' || settings.powerProfile === 'eco'
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title="Throttle clocks to preserve battery life"
              >
                <Leaf className="w-3.5 h-3.5" />
                <span className="text-[10px]">Eco</span>
              </button>
            </div>
          </div>

          {/* Hardware Telemetry Card */}
          <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-gray-400">
              <span>Power Source:</span>
              <span className="font-semibold text-white">
                {isCharging ? 'Power Adapter (AC)' : 'Internal Battery'}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-400">
              <span>Hardware Sensor API:</span>
              <span className="font-mono text-emerald-400 text-[10px]">
                {typeof navigator !== 'undefined' && 'getBattery' in navigator ? 'Active (Live)' : 'Emulated / AC'}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-400">
              <span>CPU Governor:</span>
              <span className="font-mono text-cyan-400 text-[10px] uppercase">
                {settings.cpuGovernor}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-400">
              <span>Auto-Dim on Low Battery:</span>
              <span className={settings.autoDimOnLowBattery ? 'text-emerald-400 font-semibold' : 'text-gray-500'}>
                {settings.autoDimOnLowBattery ? `≤${settings.lowBatteryThreshold}%` : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Action Links & Suspend */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
            <button
              onClick={handleTriggerSuspend}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
              title="Suspend Linux VM state"
            >
              <Moon className="w-3 h-3 text-purple-400" />
              <span>Suspend</span>
            </button>

            <button
              onClick={handleOpenPowerSettings}
              className="px-3 py-1.5 rounded-xl bg-[#6ee7b7]/15 hover:bg-[#6ee7b7]/25 text-[#6ee7b7] text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <span>Power Settings</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
