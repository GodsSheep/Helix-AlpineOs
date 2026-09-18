// Helix OS Network & Wi-Fi Subsystem Engine
// Emulates real Linux network stack, wpa_supplicant, iw/iwconfig, iproute2, and DNS resolver

export type WifiSecurityType = 'WPA3-SAE' | 'WPA2-PSK' | 'WPA2-Enterprise' | 'Open' | 'WEP';
export type WifiBand = '2.4 GHz' | '5.0 GHz' | '6.0 GHz';
export type NetworkInterfaceName = 'wlan0' | 'eth0' | 'lo' | 'wg0';
export type IpConfigMode = 'dhcp' | 'static';

export interface WifiNetworkProfile {
  ssid: string;
  bssid: string;
  signal: number; // 0 - 100%
  rssi: number; // dBm e.g. -48
  frequency: string; // e.g. "5.180 GHz (Ch 36)"
  channel: number;
  band: WifiBand;
  security: WifiSecurityType;
  connected: boolean;
  saved: boolean;
  password?: string;
  autoConnect: boolean;
  speedMbps: number; // e.g. 866.7
  protocol: '802.11ax (Wi-Fi 6)' | '802.11ac (Wi-Fi 5)' | '802.11n (Wi-Fi 4)';
  hidden?: boolean;
}

export interface NetworkInterfaceConfig {
  name: NetworkInterfaceName;
  type: 'wireless' | 'ethernet' | 'loopback' | 'vpn';
  enabled: boolean;
  ipMode: IpConfigMode;
  ipv4: string;
  netmask: string;
  gateway: string;
  ipv6: string;
  dns: string[];
  macAddress: string;
  hardwareMac: string;
  randomizeMac: boolean;
  mtu: number;
  powerSave: boolean;
  rxPackets: number;
  txPackets: number;
  rxBytes: number;
  txBytes: number;
  speedMbps: number;
}

export interface HotspotConfig {
  enabled: boolean;
  ssid: string;
  password?: string;
  passphrase?: string;
  band: '2.4 GHz' | '5.0 GHz';
  channel: number;
  security: 'WPA2-PSK' | 'WPA3-SAE';
  connectedClients: number;
}

export interface HotspotClient {
  id: string;
  deviceName: string;
  ipAddress: string;
  macAddress: string;
  connectedTime: string;
  bandwidthUsage: string;
  signalStrength: number;
}

export interface ProxyConfig {
  enabled: boolean;
  type: 'http' | 'socks5';
  host: string;
  port: number;
  bypassList: string;
  authentication: boolean;
  username?: string;
  password?: string;
  routingMode: 'global' | 'bypass_lan' | 'rules';
}

export interface WireguardVpnConfig {
  enabled: boolean;
  connected?: boolean;
  address?: string;
  serverAddress: string;
  clientIp: string;
  publicKey: string;
  allowedIps: string;
  endpoint: string;
  dns: string;
  handshakeStatus: 'idle' | 'handshaking' | 'connected' | 'disconnected';
  lastHandshakeSecondsAgo: number;
  bytesTransferred: string;
}

export type NetworkInterfaceInfo = NetworkInterfaceConfig;

export interface PingResult {
  host: string;
  ip: string;
  packetsTransmitted: number;
  packetsReceived: number;
  packetLossPercent: number;
  minRttMs: number;
  avgRttMs: number;
  maxRttMs: number;
  output: string[];
}

export interface DnsLookupResult {
  host: string;
  addresses: string[];
  server: string;
  queryTimeMs: number;
}

export type NetworkListener = (service: NetworkServiceImpl) => void;

class NetworkServiceImpl {
  private listeners: Set<NetworkListener> = new Set();

  private isWifiPoweredOn: boolean = true;
  private isScanning: boolean = false;
  private activeSsid: string = 'Helix-VirtNet-5G';

  private interfaces: Record<NetworkInterfaceName, NetworkInterfaceConfig> = {
    wlan0: {
      name: 'wlan0',
      type: 'wireless',
      enabled: true,
      ipMode: 'dhcp',
      ipv4: '192.168.1.105',
      netmask: '255.255.255.0',
      gateway: '192.168.1.1',
      ipv6: 'fe80::5054:ff:fe12:3456/64',
      dns: ['1.1.1.1', '8.8.8.8'],
      macAddress: '52:54:00:12:34:56',
      hardwareMac: '52:54:00:12:34:56',
      randomizeMac: false,
      mtu: 1500,
      powerSave: true,
      rxPackets: 24810,
      txPackets: 18942,
      rxBytes: 18492014,
      txBytes: 4291048,
      speedMbps: 866.7,
    },
    eth0: {
      name: 'eth0',
      type: 'ethernet',
      enabled: true,
      ipMode: 'dhcp',
      ipv4: '10.0.2.15',
      netmask: '255.255.255.0',
      gateway: '10.0.2.2',
      ipv6: 'fe80::5054:00ff:fe12:3457/64',
      dns: ['1.1.1.1', '1.0.0.1'],
      macAddress: '52:54:00:12:34:57',
      hardwareMac: '52:54:00:12:34:57',
      randomizeMac: false,
      mtu: 1500,
      powerSave: false,
      rxPackets: 1240,
      txPackets: 980,
      rxBytes: 942010,
      txBytes: 412090,
      speedMbps: 1000,
    },
    lo: {
      name: 'lo',
      type: 'loopback',
      enabled: true,
      ipMode: 'static',
      ipv4: '127.0.0.1',
      netmask: '255.0.0.0',
      gateway: '0.0.0.0',
      ipv6: '::1/128',
      dns: ['127.0.0.1'],
      macAddress: '00:00:00:00:00:00',
      hardwareMac: '00:00:00:00:00:00',
      randomizeMac: false,
      mtu: 65536,
      powerSave: false,
      rxPackets: 512,
      txPackets: 512,
      rxBytes: 52428,
      txBytes: 52428,
      speedMbps: 10000,
    },
    wg0: {
      name: 'wg0',
      type: 'vpn',
      enabled: false,
      ipMode: 'static',
      ipv4: '10.13.13.2',
      netmask: '255.255.255.0',
      gateway: '10.13.13.1',
      ipv6: 'fd86:ea04:1115::2/64',
      dns: ['10.13.13.1', '1.1.1.1'],
      macAddress: '00:00:00:00:00:00',
      hardwareMac: '00:00:00:00:00:00',
      randomizeMac: false,
      mtu: 1420,
      powerSave: false,
      rxPackets: 0,
      txPackets: 0,
      rxBytes: 0,
      txBytes: 0,
      speedMbps: 500,
    },
  };

  private networks: WifiNetworkProfile[] = [
    {
      ssid: 'Helix-VirtNet-5G',
      bssid: '00:c0:ca:9b:12:4a',
      signal: 94,
      rssi: -48,
      frequency: '5.180 GHz (Ch 36)',
      channel: 36,
      band: '5.0 GHz',
      security: 'WPA3-SAE',
      connected: true,
      saved: true,
      autoConnect: true,
      speedMbps: 866.7,
      protocol: '802.11ax (Wi-Fi 6)',
    },
    {
      ssid: 'Alpine-Edge-Lab',
      bssid: '04:18:d6:e2:89:11',
      signal: 82,
      rssi: -58,
      frequency: '5.240 GHz (Ch 48)',
      channel: 48,
      band: '5.0 GHz',
      security: 'WPA2-PSK',
      connected: false,
      saved: true,
      autoConnect: false,
      speedMbps: 650.0,
      protocol: '802.11ac (Wi-Fi 5)',
    },
    {
      ssid: 'VirtIO-Bridge-LAN',
      bssid: 'a0:04:60:11:ff:30',
      signal: 68,
      rssi: -66,
      frequency: '2.437 GHz (Ch 6)',
      channel: 6,
      band: '2.4 GHz',
      security: 'WPA2-PSK',
      connected: false,
      saved: false,
      autoConnect: false,
      speedMbps: 300.0,
      protocol: '802.11n (Wi-Fi 4)',
    },
    {
      ssid: 'Helix-Guest-Open',
      bssid: 'a0:04:60:11:ff:31',
      signal: 55,
      rssi: -72,
      frequency: '2.412 GHz (Ch 1)',
      channel: 1,
      band: '2.4 GHz',
      security: 'Open',
      connected: false,
      saved: false,
      autoConnect: false,
      speedMbps: 144.0,
      protocol: '802.11n (Wi-Fi 4)',
    },
    {
      ssid: 'FiberMesh-9AX-Ultra',
      bssid: 'e8:65:d4:32:01:99',
      signal: 48,
      rssi: -75,
      frequency: '5.745 GHz (Ch 149)',
      channel: 149,
      band: '5.0 GHz',
      security: 'WPA3-SAE',
      connected: false,
      saved: false,
      autoConnect: false,
      speedMbps: 1201.0,
      protocol: '802.11ax (Wi-Fi 6)',
    },
    {
      ssid: 'Starlink-Mobile-Hotspot',
      bssid: '74:83:c2:91:0a:b4',
      signal: 40,
      rssi: -80,
      frequency: '2.462 GHz (Ch 11)',
      channel: 11,
      band: '2.4 GHz',
      security: 'WPA2-PSK',
      connected: false,
      saved: false,
      autoConnect: false,
      speedMbps: 220.0,
      protocol: '802.11ac (Wi-Fi 5)',
    },
  ];

  private hotspot: HotspotConfig = {
    enabled: false,
    ssid: 'Helix-Alpine-AP',
    password: 'alpinepassword123',
    band: '5.0 GHz',
    channel: 36,
    security: 'WPA2-PSK',
    connectedClients: 0,
  };

  private wireguard: WireguardVpnConfig = {
    enabled: false,
    serverAddress: 'vpn.helix-cloud.net:51820',
    clientIp: '10.13.13.2/24',
    publicKey: 'aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890=',
    allowedIps: '0.0.0.0/0, ::/0',
    endpoint: '198.51.100.42:51820',
    dns: '1.1.1.1',
    handshakeStatus: 'idle',
    lastHandshakeSecondsAgo: 0,
    bytesTransferred: '0 B received, 0 B sent',
  };

  private proxy: ProxyConfig = {
    enabled: false,
    type: 'socks5',
    host: '127.0.0.1',
    port: 1080,
    bypassList: 'localhost, 127.0.0.1, *.local, 192.168.*',
    authentication: false,
    routingMode: 'bypass_lan',
  };

  private hotspotClients: HotspotClient[] = [
    { id: '1', deviceName: 'MacBookPro-Local', ipAddress: '192.168.42.10', macAddress: '04:D4:C4:F4:A4:B4', connectedTime: '12m ago', bandwidthUsage: '2.5 MB', signalStrength: 95 },
    { id: '2', deviceName: 'iPhone-Testbed', ipAddress: '192.168.42.11', macAddress: 'BC:60:A7:28:90:CD', connectedTime: '5m ago', bandwidthUsage: '840 KB', signalStrength: 82 }
  ];

  constructor() {
    this.loadPersistedState();
  }

  private loadPersistedState() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('helix_network_config_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.isWifiPoweredOn !== undefined) this.isWifiPoweredOn = parsed.isWifiPoweredOn;
          if (parsed.activeSsid) this.activeSsid = parsed.activeSsid;
          if (parsed.interfaces) this.interfaces = { ...this.interfaces, ...parsed.interfaces };
          if (parsed.hotspot) this.hotspot = { ...this.hotspot, ...parsed.hotspot };
          if (parsed.wireguard) this.wireguard = { ...this.wireguard, ...parsed.wireguard };
          if (parsed.proxy) this.proxy = { ...this.proxy, ...parsed.proxy };
          if (parsed.hotspotClients) this.hotspotClients = parsed.hotspotClients;
          if (parsed.savedNetworks && Array.isArray(parsed.savedNetworks)) {
            // merge saved passwords / autoConnect flags
            for (const sNet of parsed.savedNetworks) {
              const target = this.networks.find(n => n.ssid === sNet.ssid);
              if (target) {
                target.saved = true;
                target.password = sNet.password;
                target.autoConnect = sNet.autoConnect ?? true;
              } else if (sNet.hidden) {
                this.networks.push({
                  ...sNet,
                  signal: sNet.signal || 75,
                  rssi: sNet.rssi || -60,
                  connected: false,
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load network persistence:', e);
      }
    }
  }

  public savePersistedState() {
    if (typeof localStorage !== 'undefined') {
      try {
        const data = {
          isWifiPoweredOn: this.isWifiPoweredOn,
          activeSsid: this.activeSsid,
          interfaces: this.interfaces,
          hotspot: this.hotspot,
          wireguard: this.wireguard,
          proxy: this.proxy,
          hotspotClients: this.hotspotClients,
          savedNetworks: this.networks.filter(n => n.saved).map(n => ({
            ssid: n.ssid,
            bssid: n.bssid,
            security: n.security,
            password: n.password,
            autoConnect: n.autoConnect,
            hidden: n.hidden,
            band: n.band,
            channel: n.channel,
            frequency: n.frequency,
            protocol: n.protocol,
            speedMbps: n.speedMbps,
          })),
        };
        localStorage.setItem('helix_network_config_v1', JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to save network persistence:', e);
      }
    }
  }

  // --- Subscription ---

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.savePersistedState();
    this.listeners.forEach(fn => {
      try {
        fn(this);
      } catch (err) {
        console.error('Network listener error:', err);
      }
    });
  }

  // --- Getters ---

  public getIsWifiPoweredOn(): boolean {
    return this.isWifiPoweredOn;
  }

  public getIsScanning(): boolean {
    return this.isScanning;
  }

  public getActiveNetwork(): WifiNetworkProfile | null {
    if (!this.isWifiPoweredOn) return null;
    return this.networks.find(n => n.connected) || null;
  }

  public getNetworks(): WifiNetworkProfile[] {
    return [...this.networks];
  }

  public getInterface(name: NetworkInterfaceName): NetworkInterfaceConfig {
    return { ...this.interfaces[name] };
  }

  public getAllInterfaces(): NetworkInterfaceConfig[] {
    return Object.values(this.interfaces).map(i => ({ ...i }));
  }

  public getHotspotConfig(): HotspotConfig {
    return { 
      ...this.hotspot, 
      passphrase: this.hotspot.password || this.hotspot.passphrase || 'alpinepassword123' 
    };
  }

  public getProxyConfig(): ProxyConfig {
    return { ...this.proxy };
  }

  public getHotspotClients(): HotspotClient[] {
    return [...this.hotspotClients];
  }

  public toggleProxy(enabled?: boolean): void {
    const nextState = enabled !== undefined ? enabled : !this.proxy.enabled;
    this.setProxyConfig({ enabled: nextState });
  }

  public getWireguardConfig(): WireguardVpnConfig {
    return { 
      ...this.wireguard,
      connected: this.wireguard.enabled,
      address: this.wireguard.clientIp
    };
  }

  public getVpnConfig(): WireguardVpnConfig {
    return this.getWireguardConfig();
  }

  public toggleVpn(enabled?: boolean): void {
    const nextState = enabled !== undefined ? enabled : !this.wireguard.enabled;
    this.setWireguardConfig({ enabled: nextState });
  }

  public toggleHotspot(enabled?: boolean): void {
    const nextState = enabled !== undefined ? enabled : !this.hotspot.enabled;
    this.setHotspotConfig({ enabled: nextState });
  }

  // --- Actions ---

  public setWifiPower(powered: boolean): void {
    this.isWifiPoweredOn = powered;
    this.interfaces.wlan0.enabled = powered;
    if (!powered) {
      this.networks.forEach(n => (n.connected = false));
    } else {
      // Reconnect to active or best auto-connect network
      const autoNet = this.networks.find(n => n.ssid === this.activeSsid && n.saved) || this.networks.find(n => n.saved && n.autoConnect);
      if (autoNet) {
        autoNet.connected = true;
      }
    }
    this.notify();
  }

  public scanNetworks(): Promise<WifiNetworkProfile[]> {
    this.isScanning = true;
    this.notify();
    return new Promise(resolve => {
      setTimeout(() => {
        this.isScanning = false;
        // slightly jitter RSSI/signals for realism
        this.networks.forEach(net => {
          const delta = Math.floor(Math.random() * 5) - 2;
          net.signal = Math.min(100, Math.max(20, net.signal + delta));
          net.rssi = -Math.round(100 - net.signal * 0.65);
        });
        this.notify();
        resolve([...this.networks]);
      }, 700);
    });
  }

  public connectNetwork(ssid: string, password?: string): Promise<{ success: boolean; error?: string }> {
    return new Promise(resolve => {
      const net = this.networks.find(n => n.ssid === ssid);
      if (!net) {
        resolve({ success: false, error: 'Network not found' });
        return;
      }

      if (net.security !== 'Open' && !net.saved && (!password || password.length < 8)) {
        resolve({ success: false, error: 'Password must be at least 8 characters for WPA/WPA2/WPA3' });
        return;
      }

      this.isScanning = true;
      this.notify();

      setTimeout(() => {
        this.isScanning = false;
        this.networks.forEach(n => (n.connected = false));

        net.connected = true;
        net.saved = true;
        if (password) net.password = password;
        this.activeSsid = net.ssid;

        // Update interface wlan0 details based on connected AP
        this.interfaces.wlan0.speedMbps = net.speedMbps;
        this.interfaces.wlan0.rxBytes += 4096;
        this.interfaces.wlan0.txBytes += 2048;

        this.notify();
        resolve({ success: true });
      }, 650);
    });
  }

  public disconnectNetwork(): void {
    this.networks.forEach(n => (n.connected = false));
    this.notify();
  }

  public forgetNetwork(ssid: string): void {
    const net = this.networks.find(n => n.ssid === ssid);
    if (net) {
      net.saved = false;
      net.connected = false;
      delete net.password;
      net.autoConnect = false;
      this.notify();
    }
  }

  public addHiddenNetwork(ssid: string, security: WifiSecurityType, password?: string): Promise<boolean> {
    const existing = this.networks.find(n => n.ssid === ssid);
    if (existing) {
      return this.connectNetwork(ssid, password).then(r => r.success);
    }

    const newNet: WifiNetworkProfile = {
      ssid,
      bssid: '02:00:00:' + Math.floor(Math.random() * 89 + 10) + ':' + Math.floor(Math.random() * 89 + 10) + ':01',
      signal: 88,
      rssi: -52,
      frequency: '5.180 GHz (Ch 36)',
      channel: 36,
      band: '5.0 GHz',
      security,
      connected: false,
      saved: true,
      password,
      autoConnect: true,
      speedMbps: 866.7,
      protocol: '802.11ax (Wi-Fi 6)',
      hidden: true,
    };

    this.networks.unshift(newNet);
    return this.connectNetwork(ssid, password).then(r => r.success);
  }

  public updateInterfaceConfig(name: NetworkInterfaceName, updates: Partial<NetworkInterfaceConfig>): void {
    if (this.interfaces[name]) {
      this.interfaces[name] = {
        ...this.interfaces[name],
        ...updates,
      };

      if (updates.randomizeMac !== undefined && updates.randomizeMac) {
        const randHex = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':');
        this.interfaces[name].macAddress = '02:' + randHex.substring(3);
      } else if (updates.randomizeMac === false) {
        this.interfaces[name].macAddress = this.interfaces[name].hardwareMac;
      }

      this.notify();
    }
  }

  public setHotspotConfig(updates: Partial<HotspotConfig>): void {
    this.hotspot = {
      ...this.hotspot,
      ...updates,
    };
    this.notify();
  }

  public setWireguardConfig(updates: Partial<WireguardVpnConfig>): void {
    this.wireguard = {
      ...this.wireguard,
      ...updates,
    };
    if (updates.enabled) {
      this.wireguard.handshakeStatus = 'connected';
      this.wireguard.lastHandshakeSecondsAgo = 2;
      this.wireguard.bytesTransferred = '1.2 MiB received, 420 KiB sent';
      this.interfaces.wg0.enabled = true;
    } else if (updates.enabled === false) {
      this.wireguard.handshakeStatus = 'disconnected';
      this.interfaces.wg0.enabled = false;
    }
    this.notify();
  }

  public setProxyConfig(updates: Partial<ProxyConfig>): void {
    this.proxy = {
      ...this.proxy,
      ...updates,
    };
    this.notify();
  }

  public setHotspotClients(clients: HotspotClient[]): void {
    this.hotspotClients = clients;
    this.notify();
  }

  // --- Network Diagnostics (Ping, Traceroute, DNS Query) ---

  public runPing(host: string = '1.1.1.1', count: number = 4): Promise<PingResult> {
    return new Promise(resolve => {
      const isDomain = host.includes('.');
      const resolvedIp = host === '1.1.1.1' ? '1.1.1.1' : host === '8.8.8.8' ? '8.8.8.8' : host === 'alpinelinux.org' ? '151.101.1.130' : host === 'google.com' ? '142.250.190.46' : '192.168.1.1';
      
      const rtts: number[] = [];
      const lines: string[] = [`PING ${host} (${resolvedIp}): 56 data bytes`];
      
      for (let i = 0; i < count; i++) {
        const time = Number((Math.random() * 4 + 8.2).toFixed(2));
        rtts.push(time);
        lines.push(`64 bytes from ${resolvedIp}: seq=${i} ttl=58 time=${time} ms`);
      }

      const min = Math.min(...rtts);
      const max = Math.max(...rtts);
      const avg = Number((rtts.reduce((a, b) => a + b, 0) / rtts.length).toFixed(2));

      lines.push(`--- ${host} ping statistics ---`);
      lines.push(`${count} packets transmitted, ${count} packets received, 0% packet loss`);
      lines.push(`round-trip min/avg/max = ${min}/${avg}/${max} ms`);

      resolve({
        host,
        ip: resolvedIp,
        packetsTransmitted: count,
        packetsReceived: count,
        packetLossPercent: 0,
        minRttMs: min,
        avgRttMs: avg,
        maxRttMs: max,
        output: lines,
      });
    });
  }

  public runDnsQuery(host: string = 'alpinelinux.org'): Promise<DnsLookupResult> {
    return new Promise(resolve => {
      const ips: Record<string, string[]> = {
        'alpinelinux.org': ['151.101.1.130', '151.101.65.130', '151.101.129.130'],
        'google.com': ['142.250.190.46', '142.250.190.78'],
        'github.com': ['140.82.114.3', '140.82.112.4'],
        'cloudflare.com': ['104.16.132.229', '104.16.133.229'],
      };

      const resolved = ips[host] || ['93.184.216.34'];
      const server = this.interfaces.wlan0.dns[0] || '1.1.1.1';
      const queryTime = Math.floor(Math.random() * 8 + 4);

      resolve({
        host,
        addresses: resolved,
        server: `${server}#53`,
        queryTimeMs: queryTime,
      });
    });
  }

  public runTraceroute(target: string = 'alpinelinux.org'): Promise<string[]> {
    return new Promise(resolve => {
      const lines: string[] = [
        `traceroute to ${target} (151.101.1.130), 30 hops max, 46 byte packets`,
        ` 1  192.168.1.1 (192.168.1.1)  1.214 ms  1.102 ms  0.985 ms`,
        ` 2  10.240.0.1 (10.240.0.1)  4.321 ms  3.890 ms  4.012 ms`,
        ` 3  172.16.8.1 (172.16.8.1)  7.450 ms  6.912 ms  7.120 ms`,
        ` 4  151.101.1.130 (151.101.1.130)  11.842 ms  11.450 ms  11.602 ms`
      ];
      resolve(lines);
    });
  }

  // --- Real POSIX Linux Output Generators for VM CLI ---

  public generateIwDevLink(): string {
    const active = this.getActiveNetwork();
    if (!this.isWifiPoweredOn || !active) {
      return 'Not connected.';
    }
    return [
      `Connected to ${active.bssid} (on wlan0)`,
      `\tSSID: ${active.ssid}`,
      `\tfreq: ${active.frequency.split(' ')[0]}`,
      `\tRX: ${this.interfaces.wlan0.rxBytes} bytes (${this.interfaces.wlan0.rxPackets} packets)`,
      `\tTX: ${this.interfaces.wlan0.txBytes} bytes (${this.interfaces.wlan0.txPackets} packets)`,
      `\tsignal: ${active.rssi} dBm`,
      `\ttx bitrate: ${active.speedMbps} MBit/s VHT-MCS 9 80MHz short GI VHT-NSS 2`,
      '',
      `\tbss flags:\tshort-preamble short-slot-time`,
      `\tdtim period:\t1`,
      `\tbeacon int:\t100`
    ].join('\n');
  }

  public generateIwDevScan(): string {
    if (!this.isWifiPoweredOn) return 'wlan0: Interface is down';
    const lines: string[] = [];
    this.networks.forEach(net => {
      lines.push(`BSS ${net.bssid}(on wlan0) -- associated: ${net.connected ? 'yes' : 'no'}`);
      lines.push(`\tTSF: ${Date.now()}000 usec`);
      lines.push(`\tfreq: ${net.frequency.split(' ')[0]}`);
      lines.push(`\tbeacon interval: 100 TUs`);
      lines.push(`\tcapability: ESS Privacy ShortPreamble SpectrumMgmt (0x0131)`);
      lines.push(`\tsignal: ${net.rssi}.00 dBm`);
      lines.push(`\tSSID: ${net.ssid}`);
      lines.push(`\tSupported rates: 6.0* 9.0 12.0* 18.0 24.0* 36.0 48.0 54.0 `);
      lines.push(`\tRSN:\t * Version: 1`);
      lines.push(`\t\t * Group cipher: CCMP`);
      lines.push(`\t\t * Pairwise ciphers: CCMP`);
      lines.push(`\t\t * Authentication suites: ${net.security.includes('WPA3') ? 'SAE' : 'PSK'}`);
      lines.push(`\t\t * Capabilities: 1-PTKSA-RC 1-GTKSA-RC (0x0000)`);
      lines.push('');
    });
    return lines.join('\n');
  }

  public generateWpaCliStatus(): string {
    const active = this.getActiveNetwork();
    if (!this.isWifiPoweredOn || !active) {
      return 'wpa_state=DISCONNECTED\naddress=' + this.interfaces.wlan0.macAddress;
    }
    return [
      `bssid=${active.bssid}`,
      `freq=${active.frequency.split(' ')[0].replace('.', '').replace('GHz', '0')}`,
      `ssid=${active.ssid}`,
      `id=0`,
      `mode=station`,
      `pairwise_cipher=CCMP`,
      `group_cipher=CCMP`,
      `key_mgmt=${active.security.includes('WPA3') ? 'SAE' : 'WPA2-PSK'}`,
      `wpa_state=COMPLETED`,
      `ip_address=${this.interfaces.wlan0.ipv4}`,
      `address=${this.interfaces.wlan0.macAddress}`,
      `uuid=42e12810-7fa1-4952-823c-helix0000001`
    ].join('\n');
  }

  public generateNmcliDevWifi(): string {
    if (!this.isWifiPoweredOn) return 'IN-USE  BSSID              SSID                  MODE   CHAN  RATE        SIGNAL  BARS  SECURITY\n(Wi-Fi disabled)';
    const header = 'IN-USE  BSSID              SSID                  MODE   CHAN  RATE        SIGNAL  BARS  SECURITY';
    const rows = this.networks.map(n => {
      const inUse = n.connected ? '*' : ' ';
      const bssid = n.bssid.padEnd(18, ' ');
      const ssid = n.ssid.padEnd(21, ' ');
      const mode = 'Infra ';
      const chan = String(n.channel).padEnd(5, ' ');
      const rate = `${Math.round(n.speedMbps)} Mbit/s`.padEnd(11, ' ');
      const signal = String(n.signal).padEnd(7, ' ');
      const bars = n.signal > 75 ? '▂▄▆█' : n.signal > 50 ? '▂▄▆_' : '▂▄__';
      const sec = n.security;
      return `${inUse}       ${bssid} ${ssid} ${mode} ${chan} ${rate} ${signal} ${bars}  ${sec}`;
    });
    return [header, ...rows].join('\n');
  }

  public generateIfconfig(): string {
    const ifaces = Object.values(this.interfaces);
    const sections: string[] = [];

    for (const iface of ifaces) {
      if (!iface.enabled && iface.name !== 'lo') continue;
      const hwType = iface.type === 'wireless' ? 'IEEE 802.11' : iface.type === 'ethernet' ? 'Ethernet' : iface.type === 'vpn' ? 'UNSPEC' : 'Local Loopback';
      const header = `${iface.name.padEnd(9, ' ')} Link encap:${hwType}  ${iface.name !== 'lo' && iface.name !== 'wg0' ? 'HWaddr ' + iface.macAddress : ''}`.trimEnd();
      const inet = `          inet addr:${iface.ipv4}  ${iface.name !== 'lo' ? 'Bcast:' + iface.ipv4.replace(/\.\d+$/, '.255') + '  ' : ''}Mask:${iface.netmask}`;
      const inet6 = `          inet6 addr: ${iface.ipv6} Scope:${iface.name === 'lo' ? 'Host' : 'Link'}`;
      const flags = `          UP ${iface.name !== 'lo' ? 'BROADCAST RUNNING MULTICAST' : 'LOOPBACK RUNNING'}  MTU:${iface.mtu}  Metric:1`;
      const rx = `          RX packets:${iface.rxPackets} errors:0 dropped:0 overruns:0 frame:0`;
      const tx = `          TX packets:${iface.txPackets} errors:0 dropped:0 overruns:0 carrier:0`;
      const coll = `          collisions:0 txqueuelen:${iface.name === 'lo' ? '1000' : '1000'}`;
      const bytes = `          RX bytes:${iface.rxBytes} (${(iface.rxBytes / (1024 * 1024)).toFixed(1)} MiB)  TX bytes:${iface.txBytes} (${(iface.txBytes / (1024 * 1024)).toFixed(1)} MiB)`;
      sections.push([header, inet, inet6, flags, rx, tx, coll, bytes].join('\n'));
    }

    return sections.join('\n\n');
  }

  public generateIpAddr(): string {
    const lines: string[] = [];
    let idx = 1;

    for (const iface of Object.values(this.interfaces)) {
      if (!iface.enabled && iface.name !== 'lo') continue;
      const state = iface.enabled ? 'UP' : 'DOWN';
      const lowerUp = iface.enabled ? ',LOWER_UP' : '';
      const flags = iface.name === 'lo' ? 'LOOPBACK,UP,LOWER_UP' : `BROADCAST,MULTICAST,${state}${lowerUp}`;
      
      lines.push(`${idx}: ${iface.name}: <${flags}> mtu ${iface.mtu} qdisc pfifo_fast state ${state} group default qlen 1000`);
      if (iface.name === 'lo') {
        lines.push('    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00');
      } else {
        lines.push(`    link/ether ${iface.macAddress} brd ff:ff:ff:ff:ff:ff`);
      }
      lines.push(`    inet ${iface.ipv4}/24 brd ${iface.ipv4.replace(/\.\d+$/, '.255')} scope global ${iface.name}`);
      lines.push('       valid_lft forever preferred_lft forever');
      lines.push(`    inet6 ${iface.ipv6} scope link`);
      lines.push('       valid_lft forever preferred_lft forever');
      idx++;
    }

    return lines.join('\n');
  }

  public generateIpRoute(): string {
    const active = this.getActiveNetwork();
    const wlan = this.interfaces.wlan0;
    const eth = this.interfaces.eth0;

    if (this.isWifiPoweredOn && active) {
      return [
        `default via ${wlan.gateway} dev wlan0 proto dhcp src ${wlan.ipv4} metric 600`,
        `default via ${eth.gateway} dev eth0 proto dhcp src ${eth.ipv4} metric 100`,
        `10.0.2.0/24 dev eth0 proto kernel scope link src ${eth.ipv4}`,
        `192.168.1.0/24 dev wlan0 proto kernel scope link src ${wlan.ipv4}`
      ].join('\n');
    }

    return [
      `default via ${eth.gateway} dev eth0 proto dhcp src ${eth.ipv4} metric 100`,
      `10.0.2.0/24 dev eth0 proto kernel scope link src ${eth.ipv4}`
    ].join('\n');
  }

  public generateResolvConf(): string {
    const dnsList = this.interfaces.wlan0.dns;
    return [
      '# Generated by Helix NetworkManager / resolvconf',
      ...dnsList.map(d => `nameserver ${d}`),
      'options edns0 trust-ad timeout:2 attempts:3'
    ].join('\n');
  }

  public generateWpaSupplicantConf(): string {
    const lines = [
      'ctrl_interface=/var/run/wpa_supplicant',
      'ctrl_interface_group=wheel',
      'update_config=1',
      'country=US',
      ''
    ];

    this.networks.filter(n => n.saved).forEach(n => {
      lines.push('network={');
      lines.push(`\tssid="${n.ssid}"`);
      if (n.bssid) lines.push(`\tbssid=${n.bssid}`);
      if (n.hidden) lines.push('\tscan_ssid=1');
      if (n.security === 'Open') {
        lines.push('\tkey_mgmt=NONE');
      } else if (n.security.includes('WPA3')) {
        lines.push('\tkey_mgmt=SAE');
        lines.push(`\tpsk="${n.password || 'password123'}"`);
        lines.push('\tieee80211w=2');
      } else {
        lines.push('\tkey_mgmt=WPA-PSK');
        lines.push(`\tpsk="${n.password || 'password123'}"`);
      }
      lines.push(`\tpriority=${n.connected ? 10 : 5}`);
      lines.push('}');
      lines.push('');
    });

    return lines.join('\n');
  }

  public generateNetworkInterfaces(): string {
    return [
      '# /etc/network/interfaces -- Alpine Linux networking configuration',
      'auto lo',
      'iface lo inet loopback',
      '',
      'auto eth0',
      `iface eth0 inet ${this.interfaces.eth0.ipMode}`,
      this.interfaces.eth0.ipMode === 'static' ? `\taddress ${this.interfaces.eth0.ipv4}\n\tnetmask ${this.interfaces.eth0.netmask}\n\tgateway ${this.interfaces.eth0.gateway}` : '',
      '',
      'auto wlan0',
      `iface wlan0 inet ${this.interfaces.wlan0.ipMode}`,
      '\twpa-conf /etc/wpa_supplicant/wpa_supplicant.conf',
      this.interfaces.wlan0.ipMode === 'static' ? `\taddress ${this.interfaces.wlan0.ipv4}\n\tnetmask ${this.interfaces.wlan0.netmask}\n\tgateway ${this.interfaces.wlan0.gateway}` : '',
    ].filter(Boolean).join('\n');
  }
}

export const Network = new NetworkServiceImpl();
