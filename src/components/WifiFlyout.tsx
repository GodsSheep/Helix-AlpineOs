import React, { useState, useEffect } from 'react';
import { Network, WifiNetworkProfile, WifiSecurityType } from '../kernel/NetworkService';
import { 
  Wifi, 
  WifiOff, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Check, 
  Sliders, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Radio, 
  ShieldCheck, 
  Zap, 
  Copy, 
  CheckCheck,
  Terminal as TerminalIcon
} from 'lucide-react';

interface WifiFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: (tab: string) => void;
  onOpenTerminal?: () => void;
}

export const WifiFlyout: React.FC<WifiFlyoutProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenTerminal,
}) => {
  const [isWifiOn, setIsWifiOn] = useState(Network.getIsWifiPoweredOn());
  const [activeNetwork, setActiveNetwork] = useState<WifiNetworkProfile | null>(Network.getActiveNetwork());
  const [networks, setNetworks] = useState<WifiNetworkProfile[]>(Network.getNetworks());
  const [isScanning, setIsScanning] = useState(Network.getIsScanning());
  const [showDetails, setShowDetails] = useState(false);
  
  // Password modal state
  const [connectingSsid, setConnectingSsid] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Hidden network modal state
  const [showAddHidden, setShowAddHidden] = useState(false);
  const [hiddenSsid, setHiddenSsid] = useState('');
  const [hiddenSecurity, setHiddenSecurity] = useState<WifiSecurityType>('WPA2-PSK');
  const [hiddenPassword, setHiddenPassword] = useState('');

  // Copied IP state
  const [copiedIp, setCopiedIp] = useState(false);

  useEffect(() => {
    const unsub = Network.subscribe((net) => {
      setIsWifiOn(net.getIsWifiPoweredOn());
      setActiveNetwork(net.getActiveNetwork());
      setNetworks(net.getNetworks());
      setIsScanning(net.getIsScanning());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleToggleWifi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    Network.setWifiPower(val);
  };

  const handleScan = async () => {
    await Network.scanNetworks();
  };

  const handleNetworkClick = (net: WifiNetworkProfile) => {
    if (net.connected) return;

    if (net.security === 'Open' || net.saved) {
      setIsConnecting(true);
      Network.connectNetwork(net.ssid, net.password).then((res) => {
        setIsConnecting(false);
        if (!res.success && res.error) {
          setPasswordError(res.error);
        }
      });
    } else {
      setConnectingSsid(net.ssid);
      setPasswordInput('');
      setPasswordError(null);
      setShowPassword(false);
    }
  };

  const handleConnectWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectingSsid) return;

    setIsConnecting(true);
    setPasswordError(null);

    const res = await Network.connectNetwork(connectingSsid, passwordInput);
    setIsConnecting(false);

    if (res.success) {
      setConnectingSsid(null);
      setPasswordInput('');
    } else {
      setPasswordError(res.error || 'Failed to connect');
    }
  };

  const handleAddHiddenNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hiddenSsid.trim()) return;

    setIsConnecting(true);
    const ok = await Network.addHiddenNetwork(hiddenSsid.trim(), hiddenSecurity, hiddenPassword);
    setIsConnecting(false);

    if (ok) {
      setShowAddHidden(false);
      setHiddenSsid('');
      setHiddenPassword('');
    }
  };

  const handleCopyIp = () => {
    const wlan = Network.getInterface('wlan0');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(wlan.ipv4);
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2000);
    }
  };

  const wlanIface = Network.getInterface('wlan0');

  return (
    <div className="absolute right-0 top-10 w-80 max-w-[calc(100vw-1rem)] bg-[#12141c]/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 p-3.5 space-y-3.5 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 text-left select-none text-xs text-white">
      {/* Header: Power Toggle & Scan */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-xl border ${isWifiOn ? 'bg-[#6ee7b7]/15 border-[#6ee7b7]/30 text-[#6ee7b7]' : 'bg-red-500/15 border-red-500/30 text-red-400'}`}>
            {isWifiOn ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </div>
          <div>
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <span>Wi-Fi Network</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isWifiOn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700 text-gray-400'}`}>
                wlan0
              </span>
            </div>
            <div className="text-[10px] text-gray-400">
              {isWifiOn ? (activeNetwork ? `Connected to ${activeNetwork.ssid}` : 'Ready to connect') : 'Hardware radio off'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isWifiOn && (
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer disabled:opacity-50"
              title="Rescan wireless channels"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-[#6ee7b7]' : ''}`} />
            </button>
          )}

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isWifiOn}
              onChange={handleToggleWifi}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6ee7b7]" />
          </label>
        </div>
      </div>

      {isWifiOn ? (
        <>
          {/* Active Network Card */}
          {activeNetwork ? (
            <div className="p-3 bg-white/[0.04] border border-[#6ee7b7]/30 rounded-xl space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs">{activeNetwork.ssid}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#6ee7b7]/20 text-[#6ee7b7] rounded font-semibold">
                      Connected
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono flex items-center gap-2">
                    <span>{activeNetwork.frequency}</span>
                    <span>•</span>
                    <span>{activeNetwork.rssi} dBm ({activeNetwork.signal}%)</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                    title="Toggle connection telemetry"
                  >
                    {showDetails ? <ChevronUp className="w-3.5 h-3.5 text-[#6ee7b7]" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Details */}
              {showDetails && (
                <div className="pt-2 border-t border-white/10 space-y-1.5 text-[10px] font-mono text-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">IPv4 Address:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-semibold">{wlanIface.ipv4}</span>
                      <button
                        onClick={handleCopyIp}
                        className="p-0.5 hover:text-[#6ee7b7] transition cursor-pointer"
                        title="Copy IP"
                      >
                        {copiedIp ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Default Gateway:</span>
                    <span>{wlanIface.gateway}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Security / Auth:</span>
                    <span className="text-[#6ee7b7]">{activeNetwork.security}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Link PHY Speed:</span>
                    <span>{activeNetwork.speedMbps} Mbps ({activeNetwork.protocol})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">BSSID AP MAC:</span>
                    <span>{activeNetwork.bssid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Device MAC:</span>
                    <span className={wlanIface.randomizeMac ? 'text-amber-300' : ''}>
                      {wlanIface.macAddress} {wlanIface.randomizeMac && '(Random)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">DNS Resolvers:</span>
                    <span>{wlanIface.dns.join(', ')}</span>
                  </div>

                  <div className="pt-2 flex justify-between gap-2">
                    <button
                      onClick={() => Network.disconnectNetwork()}
                      className="flex-1 py-1 px-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-[10px] font-sans font-semibold transition text-center cursor-pointer"
                    >
                      Disconnect
                    </button>
                    <button
                      onClick={() => Network.forgetNetwork(activeNetwork.ssid)}
                      className="py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-[10px] font-sans transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Forget</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5 bg-black/30 border border-dashed border-white/15 rounded-xl text-center space-y-1">
              <p className="text-gray-400 text-[11px]">No Wi-Fi Network Connected</p>
              <p className="text-[10px] text-gray-500">Select an available access point below</p>
            </div>
          )}

          {/* Password Prompt Modal if connecting to secured network */}
          {connectingSsid && (
            <form onSubmit={handleConnectWithPassword} className="p-3 bg-[#181b26] border border-[#6ee7b7]/40 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Enter Password for {connectingSsid}</span>
                <Lock className="w-3.5 h-3.5 text-[#6ee7b7]" />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Network password (min 8 chars)"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                  className="w-full bg-[#0d0f18] border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white pr-8 focus:outline-none focus:border-[#6ee7b7]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {passwordError && (
                <div className="text-[10px] text-red-400 font-sans">{passwordError}</div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConnectingSsid(null)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnecting || !passwordInput}
                  className="px-3 py-1 rounded-lg bg-[#6ee7b7] text-black font-semibold text-[11px] hover:bg-[#5eead4] disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  {isConnecting && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Connect</span>
                </button>
              </div>
            </form>
          )}

          {/* Hidden Network Dialog */}
          {showAddHidden && (
            <form onSubmit={handleAddHiddenNetwork} className="p-3 bg-[#181b26] border border-white/20 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Join Other / Hidden Network</span>
                <Radio className="w-3.5 h-3.5 text-[#6ee7b7]" />
              </div>

              <input
                type="text"
                placeholder="Network Name (SSID)"
                value={hiddenSsid}
                onChange={(e) => setHiddenSsid(e.target.value)}
                autoFocus
                className="w-full bg-[#0d0f18] border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#6ee7b7]"
              />

              <select
                value={hiddenSecurity}
                onChange={(e) => setHiddenSecurity(e.target.value as WifiSecurityType)}
                className="w-full bg-[#0d0f18] border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="WPA2-PSK">WPA2-Personal (PSK)</option>
                <option value="WPA3-SAE">WPA3-Personal (SAE)</option>
                <option value="Open">Open (No Security)</option>
              </select>

              {hiddenSecurity !== 'Open' && (
                <input
                  type="password"
                  placeholder="Security Passphrase"
                  value={hiddenPassword}
                  onChange={(e) => setHiddenPassword(e.target.value)}
                  className="w-full bg-[#0d0f18] border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#6ee7b7]"
                />
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddHidden(false)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!hiddenSsid.trim()}
                  className="px-3 py-1 rounded-lg bg-[#6ee7b7] text-black font-semibold text-[11px] hover:bg-[#5eead4] disabled:opacity-50 cursor-pointer"
                >
                  Join
                </button>
              </div>
            </form>
          )}

          {/* Available Access Points List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-gray-400 px-1">
              <span className="font-semibold tracking-wider uppercase">Available Networks ({networks.length})</span>
              <button
                onClick={() => setShowAddHidden(!showAddHidden)}
                className="hover:text-white flex items-center gap-1 cursor-pointer text-[#6ee7b7]"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>Join Hidden</span>
              </button>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
              {networks.map((net) => {
                const isSelected = net.connected;
                return (
                  <button
                    key={net.ssid}
                    onClick={() => handleNetworkClick(net)}
                    className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#6ee7b7]/15 text-white border border-[#6ee7b7]/30'
                        : 'hover:bg-white/5 text-gray-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <Wifi className={`w-3.5 h-3.5 ${net.signal > 70 ? 'text-[#6ee7b7]' : net.signal > 40 ? 'text-amber-400' : 'text-gray-400'}`} />
                      </div>
                      <div className="truncate">
                        <div className="font-medium text-white text-xs truncate flex items-center gap-1.5">
                          <span className="truncate">{net.ssid}</span>
                          {net.saved && (
                            <span className="text-[9px] px-1 py-0.1 bg-white/10 text-gray-300 rounded">
                              Saved
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {net.band} • {net.rssi} dBm
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {net.security !== 'Open' ? (
                        <span title={net.security}>
                          <Lock className="w-3 h-3 text-gray-400" />
                        </span>
                      ) : (
                        <span title="Open Network">
                          <Unlock className="w-3 h-3 text-gray-500" />
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-[#6ee7b7]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="p-6 text-center text-[#8b93a7] text-xs space-y-2">
          <WifiOff className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="font-semibold text-white">Wi-Fi is turned off.</p>
          <p className="text-[10px] text-gray-500 max-w-[220px] mx-auto">
            Enable Wi-Fi to scan 2.4/5GHz channels and connect to network nodes.
          </p>
        </div>
      )}

      {/* Footer Quick Links */}
      <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
        <button
          onClick={() => {
            onClose();
            onOpenSettings('network');
          }}
          className="text-[#6ee7b7] hover:underline cursor-pointer flex items-center gap-1.5 font-medium"
        >
          <Sliders className="w-3 h-3" />
          <span>Network Settings...</span>
        </button>

        {onOpenTerminal && (
          <button
            onClick={() => {
              onClose();
              onOpenTerminal();
            }}
            className="text-gray-400 hover:text-white transition cursor-pointer flex items-center gap-1 font-mono text-[10px]"
            title="Open Shell (iw / ip / nmcli)"
          >
            <TerminalIcon className="w-3 h-3 text-gray-400" />
            <span>nmcli</span>
          </button>
        )}
      </div>
    </div>
  );
};
