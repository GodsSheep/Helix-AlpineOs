import React, { useState, useEffect } from 'react';
import { Network, HotspotConfig, WireguardVpnConfig, ProxyConfig, HotspotClient } from '../../kernel/NetworkService';
import { 
  Wifi, 
  Shield, 
  Globe, 
  Server, 
  Terminal as TermIcon, 
  RefreshCw, 
  Power, 
  Plus, 
  X, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Lock,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export function NetworkMasterApp() {
  const [activeTab, setActiveTab] = useState<'hotspot' | 'vpn' | 'proxy'>('hotspot');
  
  // Local copies of Network Service States
  const [hotspot, setHotspot] = useState<HotspotConfig>(Network.getHotspotConfig());
  const [vpn, setVpn] = useState<WireguardVpnConfig>(Network.getWireguardConfig());
  const [proxy, setProxy] = useState<ProxyConfig>(Network.getProxyConfig());
  const [clients, setClients] = useState<HotspotClient[]>(Network.getHotspotClients());
  
  // Form input states
  const [ssid, setSsid] = useState(hotspot.ssid);
  const [password, setPassword] = useState(hotspot.passphrase || hotspot.password || '');
  const [band, setBand] = useState(hotspot.band);
  const [channel, setChannel] = useState(hotspot.channel);
  const [security, setSecurity] = useState(hotspot.security);
  
  // Custom Lease State
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceMac, setNewDeviceMac] = useState('');
  
  // VPN states
  const [selectedServer, setSelectedServer] = useState({
    id: 'is-sea',
    name: 'Seattle Cloud Gateway (US-West)',
    endpoint: '198.51.100.42:51820',
    ping: '15 ms',
    load: '24%',
    security: 'ECC-25519'
  });
  const [vpnLogs, setVpnLogs] = useState<string[]>([
    '[SYSTEM] Interface wg0 initialized.',
    '[SYSTEM] Default route metric configuration set to 50.'
  ]);
  const [connectingVpn, setConnectingVpn] = useState(false);
  const [bandwidthTx, setBandwidthTx] = useState(124); // KB/s
  const [bandwidthRx, setBandwidthRx] = useState(482); // KB/s

  // Proxy States
  const [proxyType, setProxyType] = useState<'http' | 'socks5'>(proxy.type);
  const [proxyHost, setProxyHost] = useState(proxy.host);
  const [proxyPort, setProxyPort] = useState(proxy.port);
  const [proxyBypass, setProxyBypass] = useState(proxy.bypassList);
  const [proxyAuth, setProxyAuth] = useState(proxy.authentication);
  const [proxyUser, setProxyUser] = useState(proxy.username || '');
  const [proxyPass, setProxyPass] = useState(proxy.password || '');
  const [proxyRoutingMode, setProxyRoutingMode] = useState<'global' | 'bypass_lan' | 'rules'>(proxy.routingMode);
  
  // Live Domain Tester State
  const [testUrl, setTestUrl] = useState('alpinelinux.org');
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'bypass' | 'idle';
    message: string;
    route: string;
  }>({ status: 'idle', message: '', route: '' });

  // Subscribe to Network Service mutations
  useEffect(() => {
    const unsubscribe = Network.subscribe((net) => {
      setHotspot(net.getHotspotConfig());
      setVpn(net.getWireguardConfig());
      setProxy(net.getProxyConfig());
      setClients(net.getHotspotClients());
    });
    return () => unsubscribe();
  }, []);

  // Sync client dynamic upload/download speeds
  useEffect(() => {
    const timer = setInterval(() => {
      if (hotspot.enabled) {
        // Randomly modify speeds for high-fidelity realism
        setClients(prev => 
          prev.map(c => {
            const txVal = (Math.random() * 2.1).toFixed(1);
            const rxVal = (Math.random() * 8.5).toFixed(1);
            const nextSignal = Math.min(100, Math.max(30, c.signalStrength + Math.floor(Math.random() * 5) - 2));
            return {
              ...c,
              bandwidthUsage: `↑ ${txVal} MB/s  ↓ ${rxVal} MB/s`,
              signalStrength: nextSignal
            };
          })
        );
        // Vary main speed meters
        setBandwidthTx(Math.floor(Math.random() * 140 + 20));
        setBandwidthRx(Math.floor(Math.random() * 800 + 150));
      } else {
        setBandwidthTx(0);
        setBandwidthRx(0);
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [hotspot.enabled]);

  // Handle AP settings save
  const handleSaveHotspot = (e: React.FormEvent) => {
    e.preventDefault();
    Network.setHotspotConfig({
      ssid,
      password,
      passphrase: password,
      band,
      channel: Number(channel),
      security
    });
    // Add success log or visual indicator
    setVpnLogs(prev => [`[HOSTAPD] Saved configuration: SSID=${ssid}, Band=${band}, Security=${security}`, ...prev]);
  };

  // Toggle Hotspot state
  const handleToggleHotspot = () => {
    const nextState = !hotspot.enabled;
    Network.toggleHotspot(nextState);
    if (nextState) {
      setVpnLogs(prev => [
        `[HOSTAPD] Daemon started (hostapd /etc/hostapd/hostapd.conf)`,
        `[HOSTAPD] Interface wlan1 configured as Access Point`,
        `[HOSTAPD] DHCP pool initialized: 192.168.42.100 - 192.168.42.250`,
        ...prev
      ]);
    } else {
      setVpnLogs(prev => [
        `[HOSTAPD] Stopping Access Point daemon`,
        `[HOSTAPD] Interface wlan1 administrative status set to DOWN`,
        ...prev
      ]);
    }
  };

  // Manual Client Lease Injection
  const handleAddLease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName) return;
    const cleanMac = newDeviceMac || '02:' + Array.from({ length: 5 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':').toUpperCase();

    const randomOctet = Math.floor(Math.random() * 150 + 100);
    const newClient: HotspotClient = {
      id: Date.now().toString(),
      deviceName: newDeviceName,
      ipAddress: `192.168.42.${randomOctet}`,
      macAddress: cleanMac,
      connectedTime: 'Just now',
      bandwidthUsage: '↑ 0.1 MB/s  ↓ 0.2 MB/s',
      signalStrength: 98
    };

    const nextClients = [...clients, newClient];
    Network.setHotspotClients(nextClients);
    setSsid(ssid); // Trigger component repaint
    setNewDeviceName('');
    setNewDeviceMac('');
    setVpnLogs(prev => [`[DHCPD] Lease granted: ${newClient.ipAddress} to ${newClient.macAddress} (${newClient.deviceName})`, ...prev]);
  };

  const handleDisconnectClient = (id: string, name: string) => {
    const nextClients = clients.filter(c => c.id !== id);
    Network.setHotspotClients(nextClients);
    setVpnLogs(prev => [`[HOSTAPD] Deauthenticated station: ${name}`, ...prev]);
  };

  // VPN Connection Logic
  const handleToggleVpn = () => {
    if (!vpn.enabled) {
      setConnectingVpn(true);
      setVpnLogs(prev => [
        `[WG0] Bringing up tunnel wg0 (wg-quick up wg0)`,
        `[WG0] Key exchange handshake initialized...`,
        ...prev
      ]);
      
      setTimeout(() => {
        Network.setWireguardConfig({
          enabled: true,
          endpoint: selectedServer.endpoint,
          serverAddress: selectedServer.endpoint,
          handshakeStatus: 'connected',
          bytesTransferred: '0 B received, 0 B sent'
        });
        setConnectingVpn(false);
        setVpnLogs(prev => [
          `[WG0] Handshake completed successfully with endpoint ${selectedServer.endpoint}`,
          `[WG0] Peer public key registered: ${selectedServer.security}`,
          `[WG0] Routing all traffic (0.0.0.0/0) through VPN tunnel`,
          `[WG0] MTU set to 1420. Keepalive active.`,
          ...prev
        ]);
      }, 1000);
    } else {
      Network.setWireguardConfig({ enabled: false });
      setVpnLogs(prev => [
        `[WG0] Deactivating tunnel wg0`,
        `[WG0] RESTORED default network routing tables.`,
        ...prev
      ]);
    }
  };

  // Save Proxy Configuration
  const handleSaveProxy = (e: React.FormEvent) => {
    e.preventDefault();
    Network.setProxyConfig({
      enabled: proxy.enabled,
      type: proxyType,
      host: proxyHost,
      port: Number(proxyPort),
      bypassList: proxyBypass,
      authentication: proxyAuth,
      username: proxyUser,
      password: proxyPass,
      routingMode: proxyRoutingMode
    });
    setVpnLogs(prev => [`[PROXY] Updated settings: ${proxyType}://${proxyHost}:${proxyPort}`, ...prev]);
  };

  const handleToggleProxy = () => {
    const nextState = !proxy.enabled;
    Network.setProxyConfig({
      ...proxy,
      enabled: nextState
    });
    setVpnLogs(prev => [`[PROXY] System-wide environment variables ${nextState ? 'EXPORTED' : 'CLEARED'} (all_proxy, http_proxy)`, ...prev]);
  };

  // Run URL Router Tester
  const handleTestUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrl) return;

    const hostname = testUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    
    // Check bypass list matches
    const bypasses = proxyBypass.split(',').map(b => b.trim().toLowerCase());
    const isBypass = bypasses.some(b => {
      if (b === hostname) return true;
      if (b.startsWith('*.') && hostname.endsWith(b.substring(2))) return true;
      return false;
    }) || hostname.endsWith('.local') || hostname === 'localhost' || hostname === '127.0.0.1';

    if (!proxy.enabled) {
      setTestResult({
        status: 'bypass',
        message: 'Proxy system is disabled. Domain is routed normally.',
        route: 'DIRECT'
      });
    } else if (proxyRoutingMode === 'global') {
      setTestResult({
        status: 'success',
        message: `Traffic to ${hostname} is force-routed globally.`,
        route: `PROXY (${proxyType.toUpperCase()} -> ${proxyHost}:${proxyPort})`
      });
    } else if (isBypass) {
      setTestResult({
        status: 'bypass',
        message: `Domain matched bypass rules (bypass list or local domain).`,
        route: 'DIRECT (BYPASSED)'
      });
    } else {
      setTestResult({
        status: 'success',
        message: `Domain routed correctly according to rule filter.`,
        route: `PROXY (${proxyType.toUpperCase()} -> ${proxyHost}:${proxyPort})`
      });
    }
  };

  const vpnServers = [
    { id: 'is-sea', name: 'Seattle Cloud Gateway (US-West)', endpoint: '198.51.100.42:51820', ping: '15 ms', load: '24%', security: 'ECC-25519' },
    { id: 'is-tok', name: 'Tokyo FastRoute Node (JP-East)', endpoint: '172.217.161.4:51820', ping: '112 ms', load: '62%', security: 'ECC-25519' },
    { id: 'is-fra', name: 'Frankfurt Core Tunnel (EU-Central)', endpoint: '139.162.242.1:51820', ping: '185 ms', load: '38%', security: 'ECC-25519' },
    { id: 'is-rek', name: 'Reykjavik Secure Vault (IS-North)', endpoint: '82.221.128.5:51820', ping: '210 ms', load: '12%', security: 'AES-256-GCM' },
    { id: 'is-sgp', name: 'Singapore Metro Hub (SG-South)', endpoint: '101.100.200.5:51820', ping: '144 ms', load: '55%', security: 'ECC-25519' }
  ];

  return (
    <div id="netmaster-app" className="flex flex-col h-full bg-[#111622] text-gray-200 select-none font-sans">
      
      {/* Top Banner Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#182030] border-b border-[#25324c]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-none">Helix NetMaster</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Alpine Network Core Engine & Routing Interface</p>
          </div>
        </div>

        {/* Global summary stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${hotspot.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-[11px] font-mono text-gray-300">AP: {hotspot.enabled ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${vpn.enabled ? 'bg-purple-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-[11px] font-mono text-gray-300">VPN: {vpn.enabled ? 'ACTIVE' : 'IDLE'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${proxy.enabled ? 'bg-amber-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-[11px] font-mono text-gray-300">PROXY: {proxy.enabled ? 'ACTIVE' : 'OFF'}</span>
          </div>
        </div>
      </div>

      {/* Main Body with Sidebar Tabs */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-52 bg-[#141b2a] border-r border-[#222e47] p-2 flex flex-col gap-1 justify-between">
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('hotspot')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${activeTab === 'hotspot' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'hover:bg-[#1a2336] text-gray-400 hover:text-white'}`}
            >
              <Wifi className="w-4 h-4" />
              <span>Wireless Hotpot AP</span>
            </button>
            <button 
              onClick={() => setActiveTab('vpn')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${activeTab === 'vpn' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'hover:bg-[#1a2336] text-gray-400 hover:text-white'}`}
            >
              <Shield className="w-4 h-4" />
              <span>VPN Tunneling</span>
            </button>
            <button 
              onClick={() => setActiveTab('proxy')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${activeTab === 'proxy' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'hover:bg-[#1a2336] text-gray-400 hover:text-white'}`}
            >
              <Globe className="w-4 h-4" />
              <span>HTTP/SOCKS5 Proxy</span>
            </button>
          </div>

          {/* Quick Info Box */}
          <div className="p-3 bg-[#182030]/60 rounded-lg border border-[#25324c] flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold uppercase tracking-wider">NIC Status (wg0)</span>
            </div>
            <div className="flex flex-col gap-1 text-[10px] font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">RX rate:</span>
                <span className="text-white">{bandwidthRx} KB/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">TX rate:</span>
                <span className="text-white">{bandwidthTx} KB/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#121824] flex flex-col gap-5">
          
          {/* TAB 1: WIRELESS HOTSPOT */}
          {activeTab === 'hotspot' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              
              {/* Hotspot Activation Toggle */}
              <div className="bg-[#182030] border border-[#25324c] p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${hotspot.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-700/20 text-gray-500'}`}>
                    <Wifi className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm">Hostapd Wireless Hotspot AP</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Share virtual Alpine Linux internet connectivity over Wi-Fi channels</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono font-semibold ${hotspot.enabled ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {hotspot.enabled ? 'DAEMON STATUS: RUNNING' : 'DAEMON STATUS: SHUTDOWN'}
                  </span>
                  <button 
                    onClick={handleToggleHotspot}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${hotspot.enabled ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/30' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/30'}`}
                  >
                    <Power className="w-4 h-4" />
                    <span>{hotspot.enabled ? 'Stop AP' : 'Start AP'}</span>
                  </button>
                </div>
              </div>

              {/* Grid: Hotspot Properties & Live Bandwidth */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Properties Form */}
                <div className="bg-[#182030] border border-[#25324c] p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-[#25324c] pb-2">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-white text-xs uppercase tracking-wide">AP Credentials & Channeling</h3>
                  </div>

                  <form onSubmit={handleSaveHotspot} className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-gray-400">Hotspot SSID</label>
                        <input 
                          type="text" 
                          value={ssid}
                          onChange={(e) => setSsid(e.target.value)}
                          className="bg-[#111622] border border-[#25324c] rounded-lg px-2.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-gray-400">Passphrase (min 8 chars)</label>
                        <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-[#111622] border border-[#25324c] rounded-lg px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-gray-400">Band</label>
                        <select 
                          value={band}
                          onChange={(e) => setBand(e.target.value as any)}
                          className="bg-[#111622] border border-[#25324c] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        >
                          <option value="2.4 GHz">2.4 GHz (Long Range)</option>
                          <option value="5.0 GHz">5.0 GHz (Ultra Fast)</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-gray-400">Channel</label>
                        <select 
                          value={channel}
                          onChange={(e) => setChannel(Number(e.target.value))}
                          className="bg-[#111622] border border-[#25324c] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        >
                          {band === '2.4 GHz' ? (
                            <>
                              <option value="1">Channel 1 (2.412 GHz)</option>
                              <option value="6">Channel 6 (2.437 GHz)</option>
                              <option value="11">Channel 11 (2.462 GHz)</option>
                            </>
                          ) : (
                            <>
                              <option value="36">Channel 36 (5.180 GHz)</option>
                              <option value="44">Channel 44 (5.220 GHz)</option>
                              <option value="149">Channel 149 (5.745 GHz)</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-gray-400">Security Standard</label>
                        <select 
                          value={security}
                          onChange={(e) => setSecurity(e.target.value as any)}
                          className="bg-[#111622] border border-[#25324c] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        >
                          <option value="WPA2-PSK">WPA2-PSK (AES)</option>
                          <option value="WPA3-SAE">WPA3-SAE (Protected)</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-cyan-600 hover:bg-cyan-500 transition text-white rounded-lg py-2 text-xs font-bold mt-2 cursor-pointer"
                    >
                      Update Hotspot Configuration
                    </button>
                  </form>
                </div>

                {/* DHCP Lease Injector (Authorize Custom Connection) */}
                <div className="bg-[#182030] border border-[#25324c] p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-[#25324c] pb-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-xs uppercase tracking-wide">Authorize Static DHCP Lease</h3>
                  </div>

                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Inject mock client requests into Alpine's virtual local subnet to stress-test your AP firewall limits.
                  </p>

                  <form onSubmit={handleAddLease} className="flex flex-col gap-2.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-gray-400">Device Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. iPad-Pro-Ari"
                          value={newDeviceName}
                          onChange={(e) => setNewDeviceName(e.target.value)}
                          className="bg-[#111622] border border-[#25324c] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-gray-400">MAC Address (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="Leave blank to randomize"
                          value={newDeviceMac}
                          onChange={(e) => setNewDeviceMac(e.target.value)}
                          className="bg-[#111622] border border-[#25324c] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 font-mono"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={!hotspot.enabled}
                      className="w-full bg-[#1e293b] text-gray-300 border border-gray-600/30 hover:bg-emerald-600/10 hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-40 disabled:hover:bg-[#1e293b] disabled:hover:text-gray-300 transition rounded-lg py-2 text-xs font-bold cursor-pointer"
                    >
                      Grant & Inject Lease
                    </button>
                  </form>
                </div>
              </div>

              {/* Connected DHCP Leases Table */}
              <div className="bg-[#182030] border border-[#25324c] rounded-xl overflow-hidden p-4">
                <div className="flex items-center justify-between border-b border-[#25324c] pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-xs uppercase tracking-wide">
                      Active Stations & DHCP Leases ({hotspot.enabled ? clients.length : 0})
                    </h3>
                  </div>
                  {hotspot.enabled && (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-mono">
                      <TrendingUp className="w-3.5 h-3.5" />
                      SYSTEM DHCP LEASE POOL ACTIVE
                    </span>
                  )}
                </div>

                {!hotspot.enabled ? (
                  <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center gap-2">
                    <Wifi className="w-8 h-8 text-gray-600" />
                    <p className="text-xs">Hotspot is currently offline. Enable the Access Point daemon to observe connected DHCP client leases.</p>
                  </div>
                ) : clients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-xs">No devices are currently connected to this Access Point.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-gray-500 border-b border-[#25324c]">
                          <th className="pb-2 font-semibold">Device Name</th>
                          <th className="pb-2 font-semibold">IP Lease</th>
                          <th className="pb-2 font-semibold">Hardware MAC</th>
                          <th className="pb-2 font-semibold font-mono text-right">Throughput Speeds</th>
                          <th className="pb-2 font-semibold text-center">Signal</th>
                          <th className="pb-2 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.map(c => (
                          <tr key={c.id} className="border-b border-[#25324c]/50 hover:bg-[#1a2336]/40 transition">
                            <td className="py-2.5 font-bold text-white">{c.deviceName}</td>
                            <td className="py-2.5 font-mono text-cyan-400">{c.ipAddress}</td>
                            <td className="py-2.5 font-mono text-gray-400">{c.macAddress}</td>
                            <td className="py-2.5 font-mono text-right text-emerald-400 font-semibold">{c.bandwidthUsage}</td>
                            <td className="py-2.5 text-center">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.signalStrength > 85 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                {c.signalStrength}%
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <button 
                                onClick={() => handleDisconnectClient(c.id, c.deviceName)}
                                className="p-1 text-gray-500 hover:text-rose-400 transition hover:bg-rose-500/10 rounded cursor-pointer"
                                title="Revoke DHCP Lease (Kick)"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VPN TUNNELING */}
          {activeTab === 'vpn' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              
              {/* WireGuard Status Header */}
              <div className="bg-[#182030] border border-[#25324c] p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${vpn.enabled ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-700/20 text-gray-500'}`}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm">Helix Cloud Guard & WireGuard VPN</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Secure kernel-level WireGuard VPN tunnel (wg0) for private networking</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono font-semibold ${vpn.enabled ? 'text-purple-400' : 'text-gray-500'}`}>
                    {connectingVpn ? 'ESTABLISHING SECURE HANDSHAKE...' : vpn.enabled ? 'TUNNEL ACTIVE (wg0)' : 'VPN STATUS: DISCONNECTED'}
                  </span>
                  <button 
                    onClick={handleToggleVpn}
                    disabled={connectingVpn}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50 ${vpn.enabled ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
                  >
                    {connectingVpn ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                    <span>{vpn.enabled ? 'Disconnect VPN' : 'Connect VPN'}</span>
                  </button>
                </div>
              </div>

              {/* Server List Selection & Active State Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Server Selection list */}
                <div className="bg-[#182030] border border-[#25324c] p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-[#25324c] pb-2">
                    <Server className="w-4 h-4 text-purple-400" />
                    <h3 className="font-bold text-white text-xs uppercase tracking-wide">Available Cloud Nodes</h3>
                  </div>

                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                    {vpnServers.map(srv => {
                      const isSelected = selectedServer.id === srv.id;
                      return (
                        <div 
                          key={srv.id}
                          onClick={() => {
                            if (!vpn.enabled && !connectingVpn) {
                              setSelectedServer(srv);
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition ${vpn.enabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${isSelected ? 'bg-purple-500/10 border-purple-500/40' : 'bg-[#111622] border-[#25324c] hover:border-[#3b4c73]'}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{srv.id === 'is-tok' ? '🇯🇵' : srv.id === 'is-fra' ? '🇩🇪' : srv.id === 'is-rek' ? '🇮🇸' : srv.id === 'is-sgp' ? '🇸🇬' : '🇺🇸'}</span>
                            <div>
                              <p className="font-bold text-white">{srv.name}</p>
                              <p className="text-[10px] text-gray-500 font-mono">{srv.endpoint}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-right">
                            <span className="text-[10px] font-mono text-gray-400">Ping: <strong className="text-emerald-400">{srv.ping}</strong></span>
                            <span className="text-[10px] font-mono text-gray-400">Load: <strong className="text-white">{srv.load}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Connection detail metadata cards */}
                <div className="bg-[#182030] border border-[#25324c] p-4 rounded-xl flex flex-col gap-3 justify-between">
                  <div>
                    <div className="flex items-center gap-2 border-b border-[#25324c] pb-2 mb-3">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <h3 className="font-bold text-white text-xs uppercase tracking-wide">Tunnel Parameters (wg0)</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-2.5 bg-[#111622] border border-[#25324c] rounded-lg">
                        <span className="text-[10px] text-gray-500 block uppercase font-bold">Public Key</span>
                        <span className="text-white truncate block mt-0.5" title={vpn.publicKey}>{vpn.publicKey}</span>
                      </div>
                      <div className="p-2.5 bg-[#111622] border border-[#25324c] rounded-lg">
                        <span className="text-[10px] text-gray-500 block uppercase font-bold">Interface IP</span>
                        <span className="text-white block mt-0.5">{vpn.clientIp}</span>
                      </div>
                      <div className="p-2.5 bg-[#111622] border border-[#25324c] rounded-lg">
                        <span className="text-[10px] text-gray-500 block uppercase font-bold">Endpoint Server</span>
                        <span className="text-white block mt-0.5">{vpn.enabled ? vpn.endpoint : 'None'}</span>
                      </div>
                      <div className="p-2.5 bg-[#111622] border border-[#25324c] rounded-lg">
                        <span className="text-[10px] text-gray-500 block uppercase font-bold">Cipher Engine</span>
                        <span className="text-purple-400 block mt-0.5">{selectedServer.security}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#111622] border border-[#25324c] p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-500">Bytes Transmitted:</span>
                    <span className="text-purple-300 font-semibold">{vpn.enabled ? '1.4 MiB received, 520 KiB sent' : '0 B received, 0 B sent'}</span>
                  </div>
                </div>
              </div>

              {/* Real-time VPN System Logs console */}
              <div className="bg-[#182030] border border-[#25324c] rounded-xl overflow-hidden p-4">
                <div className="flex items-center gap-2 border-b border-[#25324c] pb-2 mb-3">
                  <TermIcon className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-white text-xs uppercase tracking-wide">Secure VPN Logs Console</h3>
                </div>

                <div className="h-40 overflow-y-auto bg-[#0a0f18] rounded-lg p-3 font-mono text-[11px] leading-relaxed text-gray-400 border border-[#222e47]">
                  {vpnLogs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-gray-600">[{10 + i}:28:15]</span>
                      <span className={log.includes('Handshake completed') || log.includes('gran') ? 'text-emerald-400' : log.includes('ERROR') ? 'text-rose-400' : 'text-gray-300'}>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM HTTP / SOCKS5 PROXY */}
          {activeTab === 'proxy' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              
              {/* Proxy State Header */}
              <div className="bg-[#182030] border border-[#25324c] p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${proxy.enabled ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-700/20 text-gray-500'}`}>
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm">System HTTP & SOCKS5 Proxy</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Proxy engine to intercept, filter, and bypass HTTP/SOCKS5 server configurations</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono font-semibold ${proxy.enabled ? 'text-amber-400' : 'text-gray-500'}`}>
                    {proxy.enabled ? 'ENVIRONMENT STATUS: ENABLED' : 'ENVIRONMENT STATUS: DISABLED'}
                  </span>
                  <button 
                    onClick={handleToggleProxy}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${proxy.enabled ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white'}`}
                  >
                    <Power className="w-4 h-4" />
                    <span>{proxy.enabled ? 'Disable Proxy' : 'Enable Proxy'}</span>
                  </button>
                </div>
              </div>

              {/* Grid: Config Form & Route Tester */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Proxy Configuration Form */}
                <div className="bg-[#182030] border border-[#25324c] p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-[#25324c] pb-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-white text-xs uppercase tracking-wide">Proxy Server Rules</h3>
                  </div>

                  <form onSubmit={handleSaveProxy} className="flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5 col-span-1">
                        <label className="text-[11px] font-semibold text-gray-400">Protocol</label>
                        <select 
                          value={proxyType}
                          onChange={(e) => setProxyType(e.target.value as any)}
                          className="bg-[#111622] border border-[#25324c] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        >
                          <option value="socks5">SOCKS5</option>
                          <option value="http">HTTP</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5 col-span-1.5">
                        <label className="text-[11px] font-semibold text-gray-400">Host IP/DNS</label>
                        <input 
                          type="text" 
                          value={proxyHost}
                          onChange={(e) => setProxyHost(e.target.value)}
                          className="bg-[#111622] border border-[#25324c] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-gray-400">Port</label>
                        <input 
                          type="number" 
                          value={proxyPort}
                          onChange={(e) => setProxyPort(Number(e.target.value))}
                          className="bg-[#111622] border border-[#25324c] rounded-lg px-2.5 py-2 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-gray-400">Bypass List (Comma Separated)</label>
                      <input 
                        type="text" 
                        value={proxyBypass}
                        onChange={(e) => setProxyBypass(e.target.value)}
                        className="bg-[#111622] border border-[#25324c] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-gray-400">Routing Mode</label>
                      <select 
                        value={proxyRoutingMode}
                        onChange={(e) => setProxyRoutingMode(e.target.value as any)}
                        className="bg-[#111622] border border-[#25324c] rounded-lg px-2 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="bypass_lan">Bypass Localhost & Private Subnets (Default)</option>
                        <option value="global">Global (Route all traffic through Proxy)</option>
                        <option value="rules">Dynamic (Strict ACL Routing Rules)</option>
                      </select>
                    </div>

                    {/* Authentication Accordion Toggles */}
                    <div className="border border-[#25324c] p-2.5 rounded-lg bg-[#111622]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-gray-300">Proxy Authentication Required</span>
                        <input 
                          type="checkbox" 
                          checked={proxyAuth}
                          onChange={(e) => setProxyAuth(e.target.checked)}
                          className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {proxyAuth && (
                        <div className="grid grid-cols-2 gap-2 mt-2.5 border-t border-[#25324c] pt-2.5">
                          <input 
                            type="text" 
                            placeholder="Username" 
                            value={proxyUser}
                            onChange={(e) => setProxyUser(e.target.value)}
                            className="bg-[#182030] border border-[#25324c] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          />
                          <input 
                            type="password" 
                            placeholder="Password" 
                            value={proxyPass}
                            onChange={(e) => setProxyPass(e.target.value)}
                            className="bg-[#182030] border border-[#25324c] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-500 transition text-white rounded-lg py-2 text-xs font-bold mt-2 cursor-pointer"
                    >
                      Apply Proxy Settings
                    </button>
                  </form>
                </div>

                {/* Domain Route Analyzer Tester */}
                <div className="bg-[#182030] border border-[#25324c] p-4 rounded-xl flex flex-col gap-3 justify-between">
                  <div>
                    <div className="flex items-center gap-2 border-b border-[#25324c] pb-2">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <h3 className="font-bold text-white text-xs uppercase tracking-wide">Live Proxy Route Tester</h3>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-relaxed mt-1.5">
                      Enter any hostname or IP to test whether proxy bypass matching is operating correctly in Alpine Linux environment.
                    </p>

                    <form onSubmit={handleTestUrl} className="flex gap-2 mt-3">
                      <input 
                        type="text" 
                        value={testUrl}
                        onChange={(e) => setTestUrl(e.target.value)}
                        placeholder="e.g. alpinelinux.org"
                        className="bg-[#111622] border border-[#25324c] rounded-lg px-3 py-2 text-xs font-mono text-white flex-1 focus:outline-none"
                      />
                      <button 
                        type="submit"
                        className="bg-[#1e293b] border border-gray-600/30 hover:bg-amber-500/10 hover:border-amber-500/30 text-amber-400 px-4 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Analyze</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                  {/* Test Result Board */}
                  <div className="bg-[#111622] border border-[#25324c] p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 font-semibold font-mono">Routing Result:</span>
                      {testResult.status === 'success' && (
                        <span className="flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3.5 h-3.5" />
                          ROUTED
                        </span>
                      )}
                      {testResult.status === 'bypass' && (
                        <span className="flex items-center gap-1 font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                          <AlertCircle className="w-3.5 h-3.5" />
                          DIRECT ROUTE
                        </span>
                      )}
                      {testResult.status === 'idle' && (
                        <span className="text-gray-600 font-semibold italic">Awaiting evaluation...</span>
                      )}
                    </div>

                    {testResult.status !== 'idle' && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[11px] font-mono border-b border-[#25324c]/40 pb-1.5">
                          <span className="text-gray-500">Destination IP/Host:</span>
                          <span className="text-white font-bold">{testUrl}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-mono border-b border-[#25324c]/40 pb-1.5">
                          <span className="text-gray-500">Active Gate Gateway:</span>
                          <span className="text-cyan-300 font-bold">{testResult.route}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 italic mt-1 bg-[#182030]/40 p-2 rounded border border-[#25324c]/20">
                          {testResult.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
