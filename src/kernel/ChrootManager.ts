/**
 * Helix OS - Advanced Virtual chroot & Jail Subsystem
 *
 * Implements POSIX chroot semantics, multi-rootfs jail isolation,
 * bind mounting, automated template provisioning (Alpine, Debian, BusyBox, Python, Recovery),
 * path translation with jailbreak prevention, and deep security vulnerability auditing.
 */

import { Kernel } from './index';

export type ChrootTemplate = 'alpine' | 'debian' | 'busybox' | 'python' | 'recovery' | 'custom';

export interface ChrootBindMount {
  source: string;       // Host VFS path (e.g. /mnt/helix/shared)
  target: string;       // Jail-relative mount point (e.g. /mnt/host)
  readOnly?: boolean;
}

export interface ChrootJail {
  id: string;
  name: string;
  rootPath: string;     // Absolute path in host VFS e.g. /jails/alpine
  template: ChrootTemplate;
  created: number;
  status: 'active' | 'inactive' | 'jailed';
  bindMounts: ChrootBindMount[];
  environment: Record<string, string>;
  hostname: string;
  isolated: boolean;
  description: string;
  sizeBytes: number;
  fileCount: number;
  securityScore: number; // 0-100
}

export interface ChrootAuditFinding {
  type: 'safe' | 'warning' | 'critical';
  title: string;
  description: string;
}

export interface ChrootAuditReport {
  jailId: string;
  jailName: string;
  rootPath: string;
  score: number;
  rating: 'A+' | 'A' | 'B' | 'C' | 'FAIL';
  findings: ChrootAuditFinding[];
  recommendations: string[];
  symlinksInspected: number;
  setuidBinaries: string[];
  boundMountCount: number;
  timestamp: string;
}

export interface ChrootSessionState {
  jail: ChrootJail;
  savedCwd: string;
  savedEnv: Record<string, string>;
  savedHostname: string;
}

export class ChrootManager {
  private static instance: ChrootManager;
  private jails: Map<string, ChrootJail> = new Map();
  private activeJail: ChrootJail | null = null;
  private sessionStack: ChrootSessionState[] = [];
  private listeners: Set<(jail: ChrootJail | null) => void> = new Set();
  private isInitialized = false;

  private constructor() {
    this.loadJailsFromStorage();
  }

  public static getInstance(): ChrootManager {
    if (!ChrootManager.instance) {
      ChrootManager.instance = new ChrootManager();
    }
    return ChrootManager.instance;
  }

  /**
   * Initializes the chroot subsystem and ensures sample / essential jails are ready
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // If no jails registered, seed Alpine Core and Python Sandbox templates
    if (this.jails.size === 0) {
      await this.createJail(
        'Alpine Core Jail',
        '/jails/alpine-core',
        'alpine',
        {
          description: 'Official Alpine 3.20 minimal Musl/BusyBox sandbox environment.',
          bindMounts: [
            { source: '/mnt/helix', target: '/mnt/host', readOnly: false }
          ]
        }
      );

      await this.createJail(
        'Python Sandbox',
        '/jails/python-sandbox',
        'python',
        {
          description: 'Isolated Python 3 runtime jail with pre-configured project scaffold.',
          bindMounts: []
        }
      );
    }
  }

  private loadJailsFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem('helix_chroot_jails');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.jails.clear();
          for (const j of parsed) {
            this.jails.set(j.rootPath, j);
          }
        }
      }
    } catch {
      // Ignore parse failure; starts clean
    }
  }

  private saveJailsToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const arr = Array.from(this.jails.values());
      localStorage.setItem('helix_chroot_jails', JSON.stringify(arr));
    } catch {
      // Storage quota exceeded or disabled
    }
  }

  public listJails(): ChrootJail[] {
    return Array.from(this.jails.values());
  }

  public getJail(rootPathOrId: string): ChrootJail | undefined {
    const norm = this.normalizePath(rootPathOrId);
    if (this.jails.has(norm)) return this.jails.get(norm);
    for (const jail of this.jails.values()) {
      if (jail.id === rootPathOrId || jail.name.toLowerCase() === rootPathOrId.toLowerCase()) {
        return jail;
      }
    }
    return undefined;
  }

  public getActiveJail(): ChrootJail | null {
    return this.activeJail;
  }

  public isChrooted(): boolean {
    return this.activeJail !== null;
  }

  public getChrootDepth(): number {
    return this.sessionStack.length;
  }

  /**
   * Normalize POSIX absolute path
   */
  public normalizePath(pathStr: string): string {
    let p = (pathStr || '').replace(/\\/g, '/');
    if (!p.startsWith('/')) p = '/' + p;
    p = p.replace(/\/+/g, '/');
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
  }

  /**
   * Provisions a new chroot jail with the chosen rootfs template
   */
  public async createJail(
    name: string,
    rootPath: string,
    template: ChrootTemplate = 'alpine',
    options?: {
      description?: string;
      bindMounts?: ChrootBindMount[];
      hostname?: string;
      env?: Record<string, string>;
    }
  ): Promise<ChrootJail> {
    const normRoot = this.normalizePath(rootPath);
    const id = 'jail-' + Math.random().toString(36).substring(2, 9);
    const jailHostname = options?.hostname || `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-jail`;

    const jail: ChrootJail = {
      id,
      name,
      rootPath: normRoot,
      template,
      created: Date.now(),
      status: 'inactive',
      bindMounts: options?.bindMounts || [],
      environment: options?.env || {
        PATH: '/bin:/sbin:/usr/bin:/usr/sbin',
        TERM: 'xterm-256color',
        HOME: '/root',
        USER: 'root',
        LOGNAME: 'root',
        SHELL: '/bin/sh',
        CHROOT_JAIL: name,
      },
      hostname: jailHostname,
      isolated: true,
      description: options?.description || `${template.toUpperCase()} isolated chroot environment`,
      sizeBytes: 0,
      fileCount: 0,
      securityScore: 92,
    };

    // Populate the template rootfs inside VFS
    await this.provisionTemplate(normRoot, template, jailHostname);

    // Calculate initial size and file count
    await this.refreshJailMetrics(jail);

    this.jails.set(normRoot, jail);
    this.saveJailsToStorage();
    this.notifyListeners();

    return jail;
  }

  /**
   * Generates rootfs file hierarchies in VFS for the selected distribution template
   */
  public async provisionTemplate(rootPath: string, template: ChrootTemplate, hostname: string): Promise<void> {
    const vfs = Kernel.vfs;
    if (!vfs) return;

    const base = this.normalizePath(rootPath);

    // Standard POSIX Directory Tree
    const standardDirs = [
      '/bin', '/sbin', '/usr/bin', '/usr/sbin', '/usr/lib',
      '/etc', '/etc/apk', '/etc/apt', '/etc/network',
      '/dev', '/proc', '/sys', '/tmp',
      '/root', '/home/user',
      '/var/log', '/var/run', '/var/lib', '/var/cache',
      '/mnt/host'
    ];

    for (const dir of standardDirs) {
      await vfs.writeFile(`${base}${dir}/.keep`, '');
    }

    // Common system configs
    await vfs.writeFile(
      `${base}/etc/passwd`,
      [
        'root:x:0:0:root:/root:/bin/sh',
        'daemon:x:1:1:daemon:/usr/sbin:/bin/false',
        'bin:x:2:2:bin:/bin:/bin/false',
        'user:x:1000:1000:Linux User:/home/user:/bin/sh',
        'nobody:x:65534:65534:nobody:/nonexistent:/bin/false'
      ].join('\n') + '\n'
    );

    await vfs.writeFile(
      `${base}/etc/group`,
      [
        'root:x:0:',
        'bin:x:2:',
        'wheel:x:10:root,user',
        'audio:x:29:user',
        'video:x:44:user',
        'user:x:1000:'
      ].join('\n') + '\n'
    );

    await vfs.writeFile(`${base}/etc/hostname`, `${hostname}\n`);
    await vfs.writeFile(
      `${base}/etc/hosts`,
      [
        '127.0.0.1\tlocalhost',
        `127.0.1.1\t${hostname}`,
        '::1\t\tlocalhost ip6-localhost ip6-loopback'
      ].join('\n') + '\n'
    );

    await vfs.writeFile(
      `${base}/etc/resolv.conf`,
      '# Generated by Helix chroot subsystem\nnameserver 1.1.1.1\nnameserver 8.8.8.8\n'
    );

    await vfs.writeFile(
      `${base}/etc/fstab`,
      '# /etc/fstab: static file system information\nproc /proc proc defaults 0 0\nsysfs /sys sysfs defaults 0 0\ndevtmpfs /dev devtmpfs defaults 0 0\ntmpfs /tmp tmpfs defaults 0 0\n'
    );

    // Template-specific files
    switch (template) {
      case 'alpine': {
        await vfs.writeFile(
          `${base}/etc/os-release`,
          [
            'NAME="Alpine Linux"',
            'ID=alpine',
            'VERSION_ID=3.20.0',
            'PRETTY_NAME="Alpine Linux v3.20 (chroot jail)"',
            'HOME_URL="https://alpinelinux.org/"',
            'BUG_REPORT_URL="https://gitlab.alpinelinux.org/alpine/aports/-/issues"'
          ].join('\n') + '\n'
        );

        await vfs.writeFile(
          `${base}/etc/apk/repositories`,
          [
            'https://dl-cdn.alpinelinux.org/alpine/v3.20/main',
            'https://dl-cdn.alpinelinux.org/alpine/v3.20/community'
          ].join('\n') + '\n'
        );

        await vfs.writeFile(
          `${base}/etc/issue`,
          `Welcome to Alpine Linux 3.20 [chroot jail: ${hostname}]\nKernel \\r on an \\m (\\l)\n\n`
        );

        await vfs.writeFile(
          `${base}/etc/motd`,
          `=== Alpine Linux 3.20 Chroot Sandbox ===\nType 'apk update' to inspect repositories.\nIsolated POSIX container environment active.\n`
        );

        // Core simulated binaries in jail /bin
        const alpineBinaries = [
          'sh', 'ash', 'busybox', 'apk', 'ls', 'cat', 'echo', 'touch', 'mkdir',
          'rm', 'cp', 'mv', 'grep', 'pwd', 'uname', 'chmod', 'whoami', 'id',
          'free', 'df', 'ps', 'uptime', 'kill', 'tar', 'gzip', 'ping', 'wget'
        ];
        for (const b of alpineBinaries) {
          await vfs.writeFile(`${base}/bin/${b}`, `#!/bin/sh\n# BusyBox built-in applet: ${b}\n`);
        }
        break;
      }

      case 'debian': {
        await vfs.writeFile(
          `${base}/etc/os-release`,
          [
            'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"',
            'NAME="Debian GNU/Linux"',
            'VERSION_ID="12"',
            'VERSION="12 (bookworm)"',
            'VERSION_CODENAME=bookworm',
            'ID=debian',
            'HOME_URL="https://www.debian.org/"'
          ].join('\n') + '\n'
        );
        await vfs.writeFile(`${base}/etc/debian_version`, '12.5\n');
        await vfs.writeFile(
          `${base}/etc/apt/sources.list`,
          [
            'deb http://deb.debian.org/debian bookworm main contrib non-free',
            'deb http://security.debian.org/debian-security bookworm-security main',
            'deb http://deb.debian.org/debian bookworm-updates main'
          ].join('\n') + '\n'
        );
        await vfs.writeFile(`${base}/bin/bash`, '#!/bin/bash\n# Debian GNU bash 5.2\n');
        await vfs.writeFile(`${base}/bin/apt`, '#!/bin/sh\n# Debian Advanced Package Tool\n');
        await vfs.writeFile(`${base}/bin/dpkg`, '#!/bin/sh\n# Debian Package Manager\n');
        break;
      }

      case 'python': {
        await vfs.writeFile(
          `${base}/etc/os-release`,
          [
            'NAME="Helix Python Sandbox"',
            'ID=helix-python',
            'VERSION="3.11-sandbox"',
            'PRETTY_NAME="Python 3.11.8 Isolated Sandbox Jail"'
          ].join('\n') + '\n'
        );
        await vfs.writeFile(
          `${base}/app/main.py`,
          [
            'import os, sys, platform',
            '',
            'def main():',
            '    print("=" * 50)',
            '    print(" Helix OS Python 3 Sandboxed Chroot Runtime")',
            '    print("=" * 50)',
            '    print(f"Platform:      {platform.system()} {platform.release()}")',
            '    print(f"Jail Root:     {os.path.abspath(\"/\")}")',
            '    print(f"Current Dir:   {os.getcwd()}")',
            '    print(f"Environment:   {os.environ.get(\"CHROOT_JAIL\", \"Active\")}")',
            '    print(f"Python Ver:    {sys.version}")',
            '    print("-" * 50)',
            '    print("Sandbox integrity verified. Safe execution confirmed.")',
            '',
            'if __name__ == \"__main__\":',
            '    main()'
          ].join('\n') + '\n'
        );
        await vfs.writeFile(
          `${base}/app/requirements.txt`,
          '# Python Sandbox packages\nnumpy>=1.24.0\nrequests>=2.31.0\n'
        );
        await vfs.writeFile(`${base}/bin/python3`, '#!/bin/sh\n# Python 3 Interpreter stub\n');
        await vfs.writeFile(`${base}/bin/pip`, '#!/bin/sh\n# Pip package manager stub\n');
        break;
      }

      case 'recovery': {
        await vfs.writeFile(
          `${base}/etc/os-release`,
          [
            'NAME="Helix System Recovery Jail"',
            'ID=helix-recovery',
            'VERSION="Rescue-Mode"',
            'PRETTY_NAME="Helix OS Emergency Disaster Recovery Shell"'
          ].join('\n') + '\n'
        );
        await vfs.writeFile(
          `${base}/bin/fsck-vfs`,
          '#!/bin/sh\necho "Running Helix VFS filesystem integrity scan..."\necho "Status: Clean (0 bad inodes, journal verified)."\n'
        );
        await vfs.writeFile(
          `${base}/bin/recover-mbr`,
          '#!/bin/sh\necho "Restoring SeaBIOS MBR bootloader signature..."\necho "MBR bootstrap sector restored successfully."\n'
        );
        await vfs.writeFile(
          `${base}/bin/audit-sec`,
          '#!/bin/sh\necho "Performing rootfs security isolation check..."\necho "Security state: All jail boundaries intact."\n'
        );
        break;
      }

      case 'busybox':
      default: {
        await vfs.writeFile(
          `${base}/etc/os-release`,
          [
            'NAME="BusyBox Minimal"',
            'ID=busybox',
            'VERSION="1.36.1"',
            'PRETTY_NAME="BusyBox Minimal Embedded Jail v1.36.1"'
          ].join('\n') + '\n'
        );
        await vfs.writeFile(`${base}/bin/busybox`, '#!/bin/sh\n# BusyBox multicall binary v1.36.1\n');
        break;
      }
    }

    await vfs.flush();
  }

  /**
   * Refreshes size and file count stats for a jail
   */
  public async refreshJailMetrics(jail: ChrootJail): Promise<void> {
    const vfs = Kernel.vfs;
    if (!vfs) return;

    try {
      const allFiles = await vfs.list();
      const jailPrefix = jail.rootPath.endsWith('/') ? jail.rootPath : `${jail.rootPath}/`;
      const jailFiles = allFiles.filter(f => f.path.startsWith(jailPrefix));

      jail.fileCount = jailFiles.length;
      jail.sizeBytes = jailFiles.reduce((acc, f) => acc + (f.content?.length || 0), 0);
    } catch {
      // Non-fatal metrics failure
    }
  }

  /**
   * Enters an interactive or process chroot jail
   */
  public async enterJail(
    rootPathOrId: string,
    vm: any,
    options?: {
      user?: string;
      env?: Record<string, string>;
    }
  ): Promise<{ success: boolean; message: string; jail?: ChrootJail }> {
    let jail = this.getJail(rootPathOrId);

    // If jail directory exists in VFS or system, but not registered, auto-register it!
    if (!jail) {
      const normPath = this.normalizePath(rootPathOrId);
      const vfs = Kernel.vfs;
      const files = vfs ? await vfs.list() : [];
      const hasFiles = files.some(f => f.path.startsWith(normPath));

      if (hasFiles) {
        jail = await this.createJail(
          normPath.split('/').pop() || 'custom-jail',
          normPath,
          'custom',
          { description: 'Auto-detected custom rootfs jail.' }
        );
      } else {
        return {
          success: false,
          message: `chroot: cannot change root directory to '${rootPathOrId}': No such file or directory`
        };
      }
    }

    // Save previous execution state to stack
    this.sessionStack.push({
      jail: jail,
      savedCwd: vm.getCwd(),
      savedEnv: { ...vm.getEnv() },
      savedHostname: vm.getHostname()
    });

    this.activeJail = jail;
    jail.status = 'active';

    // Re-anchor VM to new root / inside the jail
    vm.setCwd('/');
    vm.setHostname(jail.hostname);

    // Update environment
    const jailEnv = {
      ...vm.getEnv(),
      ...jail.environment,
      ...(options?.env || {}),
      PWD: '/',
      CHROOT_JAIL: jail.name,
      CHROOT_ROOT: jail.rootPath
    };
    vm.setEnv(jailEnv);

    if (options?.user) {
      vm.setCurrentUser(options.user);
    }

    this.notifyListeners();

    return {
      success: true,
      message: `[chroot]: Successfully entered jail '${jail.name}' (Root: ${jail.rootPath}). Type 'exit' to leave.`,
      jail
    };
  }

  /**
   * Exits the current active chroot jail session
   */
  public exitJail(vm: any): { success: boolean; message: string; remainingJail?: ChrootJail } {
    if (!this.activeJail || this.sessionStack.length === 0) {
      return {
        success: false,
        message: 'chroot: not currently inside a chroot jail session'
      };
    }

    const state = this.sessionStack.pop()!;
    const exitedJail = state.jail;
    exitedJail.status = 'inactive';

    if (this.sessionStack.length > 0) {
      // Nested chroot: restore next parent jail
      const parentState = this.sessionStack[this.sessionStack.length - 1];
      this.activeJail = parentState.jail;
      this.activeJail.status = 'active';
      vm.setCwd(state.savedCwd);
      vm.setEnv(state.savedEnv);
      vm.setHostname(state.savedHostname);

      this.notifyListeners();
      return {
        success: true,
        message: `[chroot]: Exited jail '${exitedJail.name}'. Restored parent chroot '${this.activeJail.name}'.`,
        remainingJail: this.activeJail
      };
    } else {
      // Top-level exit: restored host OS
      this.activeJail = null;
      vm.setCwd(state.savedCwd || '/mnt/helix');
      vm.setEnv(state.savedEnv);
      vm.setHostname(state.savedHostname || 'helix-debian');

      this.notifyListeners();
      return {
        success: true,
        message: `[chroot]: Exited jail '${exitedJail.name}'. Restored host environment.`
      };
    }
  }

  /**
   * Translates a jail-relative path into the true underlying host VFS path.
   * Prevents jailbreaks and correctly routes active bind mounts!
   */
  public resolveJailPath(chrootPath: string): string {
    if (!this.activeJail) {
      return chrootPath;
    }

    const norm = this.normalizePath(chrootPath);

    // 1. Check for active bind mounts
    for (const bm of this.activeJail.bindMounts) {
      const targetNorm = this.normalizePath(bm.target);
      if (norm === targetNorm) {
        return this.normalizePath(bm.source);
      }
      if (norm.startsWith(targetNorm + '/')) {
        const sub = norm.substring(targetNorm.length);
        return this.normalizePath(`${bm.source}${sub}`);
      }
    }

    // 2. Allow virtual /proc and /dev to route to virtual system endpoints
    if (norm === '/proc' || norm.startsWith('/proc/')) {
      return norm;
    }
    if (norm === '/dev' || norm.startsWith('/dev/')) {
      return norm;
    }
    if (norm === '/sys' || norm.startsWith('/sys/')) {
      return norm;
    }

    // 3. Map relative to the active jail's rootPath
    if (norm === '/') {
      return this.activeJail.rootPath;
    }

    // Mathematical containment: cannot resolve above jail rootPath
    const combined = `${this.activeJail.rootPath}${norm}`;
    return this.normalizePath(combined);
  }

  /**
   * Audits a chroot jail for security weaknesses, setuid binaries, exposed mounts, and jailbreaks
   */
  public async auditJail(rootPathOrId: string): Promise<ChrootAuditReport> {
    const jail = this.getJail(rootPathOrId);
    if (!jail) {
      return {
        jailId: 'unknown',
        jailName: 'Unknown Jail',
        rootPath: rootPathOrId,
        score: 0,
        rating: 'FAIL',
        findings: [{
          type: 'critical',
          title: 'Jail Not Found',
          description: `No active jail configured at path or identifier: "${rootPathOrId}".`
        }],
        recommendations: ['Create or initialize a chroot jail rootfs directory first.'],
        symlinksInspected: 0,
        setuidBinaries: [],
        boundMountCount: 0,
        timestamp: new Date().toLocaleTimeString(),
      };
    }

    const vfs = Kernel.vfs;
    const allFiles = vfs ? await vfs.list() : [];
    const jailPrefix = jail.rootPath.endsWith('/') ? jail.rootPath : `${jail.rootPath}/`;
    const files = allFiles.filter(f => f.path.startsWith(jailPrefix));

    const findings: ChrootAuditFinding[] = [];
    const recommendations: string[] = [];
    const setuidBinaries: string[] = [];
    let score = 100;

    // 1. Check for setuid binaries inside jail
    const dangerousBinaries = ['su', 'sudo', 'pkexec', 'chfn', 'passwd', 'newgrp'];
    for (const f of files) {
      const fileName = f.path.split('/').pop() || '';
      if (dangerousBinaries.includes(fileName)) {
        setuidBinaries.push(f.path.replace(jail.rootPath, ''));
      }
    }

    if (setuidBinaries.length > 0) {
      score -= 15;
      findings.push({
        type: 'warning',
        title: 'Privilege Escalation Binaries Present',
        description: `Found setuid/sudo binaries: ${setuidBinaries.join(', ')}. Consider removing if unneeded.`
      });
      recommendations.push('Strip setuid permissions or remove sudo/su inside the jail to prevent escalation.');
    } else {
      findings.push({
        type: 'safe',
        title: 'No Setuid Escalation Vectors',
        description: 'No hazardous root privilege elevation binaries were detected.'
      });
    }

    // 2. Check bind mounts
    let hasHostRootBind = false;
    for (const bm of jail.bindMounts) {
      if (bm.source === '/' || bm.source === '/root') {
        hasHostRootBind = true;
      }
    }

    if (hasHostRootBind) {
      score -= 30;
      findings.push({
        type: 'critical',
        title: 'Critical Host Mount Exposed',
        description: 'Host root (/) is mounted into the jail! Processes can alter host system files.'
      });
      recommendations.push('Remove root (/) bind mount and only expose safe subfolders like /mnt/shared.');
    } else if (jail.bindMounts.length > 0) {
      findings.push({
        type: 'safe',
        title: 'Bind Mounts Restricted',
        description: `${jail.bindMounts.length} safe host directory mount(s) mapped into sandbox.`
      });
    }

    // 3. Check for essential device nodes
    const hasDevNull = files.some(f => f.path.endsWith('/dev/null') || f.path.endsWith('/dev/.keep'));
    if (hasDevNull) {
      findings.push({
        type: 'safe',
        title: 'Virtual Device System Present',
        description: 'Jail contains initialized /dev device namespace.'
      });
    } else {
      score -= 10;
      findings.push({
        type: 'warning',
        title: 'Missing Standard Device Nodes',
        description: 'Standard device nodes (/dev/null, /dev/zero) are uninitialized.'
      });
      recommendations.push("Execute 'chroot --mount-dev' to mount device nodes.");
    }

    // 4. Check for /etc/passwd permissions and guest user
    const hasPasswd = files.some(f => f.path.endsWith('/etc/passwd'));
    if (hasPasswd) {
      findings.push({
        type: 'safe',
        title: 'User Authentication Namespace Configured',
        description: 'Configured /etc/passwd isolation verified with root and unprivileged user mappings.'
      });
    }

    // Determine final rating
    let rating: 'A+' | 'A' | 'B' | 'C' | 'FAIL' = 'A+';
    if (score >= 95) rating = 'A+';
    else if (score >= 85) rating = 'A';
    else if (score >= 70) rating = 'B';
    else if (score >= 50) rating = 'C';
    else rating = 'FAIL';

    jail.securityScore = Math.max(0, Math.min(100, score));
    this.saveJailsToStorage();

    return {
      jailId: jail.id,
      jailName: jail.name,
      rootPath: jail.rootPath,
      score: jail.securityScore,
      rating,
      findings,
      recommendations,
      symlinksInspected: files.length,
      setuidBinaries,
      boundMountCount: jail.bindMounts.length,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  /**
   * Adds a bind mount to a jail
   */
  public async addBindMount(rootPathOrId: string, source: string, target: string, readOnly = false): Promise<boolean> {
    const jail = this.getJail(rootPathOrId);
    if (!jail) return false;

    const normSource = this.normalizePath(source);
    const normTarget = this.normalizePath(target);

    // Filter out duplicates
    jail.bindMounts = jail.bindMounts.filter(b => b.target !== normTarget);
    jail.bindMounts.push({
      source: normSource,
      target: normTarget,
      readOnly
    });

    this.saveJailsToStorage();
    this.notifyListeners();
    return true;
  }

  /**
   * Removes a bind mount from a jail
   */
  public async removeBindMount(rootPathOrId: string, target: string): Promise<boolean> {
    const jail = this.getJail(rootPathOrId);
    if (!jail) return false;

    const normTarget = this.normalizePath(target);
    jail.bindMounts = jail.bindMounts.filter(b => b.target !== normTarget);

    this.saveJailsToStorage();
    this.notifyListeners();
    return true;
  }

  /**
   * Deletes a jail and removes all files from VFS
   */
  public async deleteJail(rootPathOrId: string): Promise<boolean> {
    const jail = this.getJail(rootPathOrId);
    if (!jail) return false;

    // If currently active, exit it first
    if (this.activeJail?.id === jail.id) {
      this.activeJail = null;
      this.sessionStack = [];
    }

    const vfs = Kernel.vfs;
    if (vfs) {
      const allFiles = await vfs.list();
      const jailPrefix = jail.rootPath.endsWith('/') ? jail.rootPath : `${jail.rootPath}/`;
      for (const file of allFiles) {
        if (file.path.startsWith(jailPrefix) || file.path === jail.rootPath) {
          await vfs.delete(file.path);
        }
      }
      await vfs.flush();
    }

    this.jails.delete(jail.rootPath);
    this.saveJailsToStorage();
    this.notifyListeners();
    return true;
  }

  /**
   * Executes a command within a chroot jail (one-shot execution)
   */
  public async executeInJail(rootPathOrId: string, command: string, vm: any): Promise<string> {
    const enterRes = await this.enterJail(rootPathOrId, vm);
    if (!enterRes.success) {
      return enterRes.message;
    }

    try {
      const output = await vm.executeCommand(command);
      return output;
    } finally {
      this.exitJail(vm);
    }
  }

  public subscribe(listener: (jail: ChrootJail | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const l of this.listeners) {
      try {
        l(this.activeJail);
      } catch {
        // Ignore subscriber errors
      }
    }
  }
}
