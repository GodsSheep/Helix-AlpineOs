import { Toast } from './Toast';

export interface P2PNode {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'phone' | 'tablet';
  ipAddress: string;
  status: 'connected' | 'pairing' | 'offline';
  lastSyncTimestamp: number;
  latencyMs: number;
  sharedClipboardText?: string;
}

export interface P2PFileTransferItem {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  progressPercent: number;
  senderNodeId: string;
  targetNodeId: string;
  status: 'transferring' | 'completed' | 'failed';
}

type MeshListener = (nodes: P2PNode[], transfers: P2PFileTransferItem[]) => void;

class P2PMeshSyncEngine {
  private nodeId: string;
  private deviceName: string;
  private deviceType: 'desktop' | 'phone' | 'tablet' = 'desktop';
  private nodes: P2PNode[] = [];
  private transfers: P2PFileTransferItem[] = [];
  private sharedClipboard = '';
  private listeners: Set<MeshListener> = new Set();

  constructor() {
    this.nodeId = `node-${Math.random().toString(36).substring(2, 8)}`;
    this.deviceName = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)
      ? 'Helix Mobile Node'
      : 'Helix Workstation Desktop';
    this.deviceType = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)
      ? 'phone'
      : 'desktop';

    this.seedInitialNodes();
  }

  private seedInitialNodes() {
    const now = Date.now();
    this.nodes = [
      {
        id: 'node-macbook-pro',
        deviceName: 'Helix Workstation Pro (Desktop)',
        deviceType: 'desktop',
        ipAddress: '192.168.1.102',
        status: 'connected',
        lastSyncTimestamp: now - 1000 * 3,
        latencyMs: 4,
        sharedClipboardText: 'https://helix.os/kernel/v9.3-lts',
      },
      {
        id: 'node-galaxy-s24',
        deviceName: 'Helix Android Companion (Phone)',
        deviceType: 'phone',
        ipAddress: '192.168.1.145',
        status: 'connected',
        lastSyncTimestamp: now - 1000 * 12,
        latencyMs: 14,
        sharedClipboardText: 'Auth token: 94a1-b8ef-4100',
      },
      {
        id: 'node-ipad-air',
        deviceName: 'Helix Workspace Pad (Tablet)',
        deviceType: 'tablet',
        ipAddress: '192.168.1.188',
        status: 'pairing',
        lastSyncTimestamp: now - 1000 * 45,
        latencyMs: 22,
      },
    ];
  }

  public getNodes(): P2PNode[] {
    return [...this.nodes];
  }

  public getTransfers(): P2PFileTransferItem[] {
    return [...this.transfers];
  }

  public getSharedClipboard(): string {
    return this.sharedClipboard;
  }

  public syncClipboard(text: string) {
    this.sharedClipboard = text;
    this.nodes = this.nodes.map((n) =>
      n.status === 'connected' ? { ...n, sharedClipboardText: text, lastSyncTimestamp: Date.now() } : n
    );
    this.notify();
    Toast.show('📋 P2P Clipboard Synced across Mesh Nodes', '✨');
  }

  public connectNewNode(deviceName: string, deviceType: 'desktop' | 'phone' | 'tablet'): P2PNode {
    const newNode: P2PNode = {
      id: `node-${Math.random().toString(36).substring(2, 8)}`,
      deviceName,
      deviceType,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 150) + 100}`,
      status: 'connected',
      lastSyncTimestamp: Date.now(),
      latencyMs: Math.floor(Math.random() * 15) + 3,
    };
    this.nodes.push(newNode);
    this.notify();
    Toast.show(`Node Connected: ${deviceName}`, '📶');
    return newNode;
  }

  public sendFileToNode(targetNodeId: string, file: File) {
    const transferItem: P2PFileTransferItem = {
      id: `transfer-${Date.now()}`,
      fileName: file.name,
      fileSizeBytes: file.size,
      progressPercent: 0,
      senderNodeId: this.nodeId,
      targetNodeId,
      status: 'transferring',
    };

    this.transfers.push(transferItem);
    this.notify();

    // Simulate P2P Chunk Transfer
    let pct = 0;
    const interval = setInterval(() => {
      pct += 25;
      if (pct >= 100) {
        pct = 100;
        clearInterval(interval);
        this.transfers = this.transfers.map((t) =>
          t.id === transferItem.id ? { ...t, progressPercent: 100, status: 'completed' } : t
        );
        Toast.show(`File Transfer Complete: ${file.name}`, '📁');
      } else {
        this.transfers = this.transfers.map((t) =>
          t.id === transferItem.id ? { ...t, progressPercent: pct } : t
        );
      }
      this.notify();
    }, 300);
  }

  public subscribe(cb: MeshListener): () => void {
    this.listeners.add(cb);
    cb(this.getNodes(), this.getTransfers());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.getNodes(), this.getTransfers()));
  }
}

export const P2PMeshSync = new P2PMeshSyncEngine();
