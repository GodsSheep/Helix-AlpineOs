/**
 * Universal Linux OS POSIX Wrapper & Command Dispatcher
 * Unifies the Helix Desktop Environment with full Linux OS emulation.
 * Handles POSIX syntax, piping, redirects, globbing, hardware bridges,
 * GUI app launching from terminal, and universal distro package managers.
 */

import { VirtualFileSystem } from './VFS';
import { RustEngine } from './RustEngine';

export interface LinuxOSContext {
  currentUser: string;
  isRoot: boolean;
  hostname: string;
  cwd: string;
  env: Record<string, string>;
  lastExitCode: number;
  aliases: Record<string, string>;
}

export class LinuxOSWrapper {
  private static defaultAliases: Record<string, string> = {
    ll: 'ls -la',
    la: 'ls -A',
    l: 'ls -CF',
    grep: 'grep --color=auto',
    cls: 'clear',
    md: 'mkdir -p',
    rd: 'rmdir',
  };

  /**
   * Parse shell command line respecting single and double quotes, and escaped characters
   */
  public static parseArgs(commandLine: string): string[] {
    const args: string[] = [];
    let current = '';
    let inDoubleQuote = false;
    let inSingleQuote = false;
    let escapeNext = false;

    for (let i = 0; i < commandLine.length; i++) {
      const char = commandLine[i];

      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\' && !inSingleQuote) {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }

      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        continue;
      }

      if (char === ' ' && !inDoubleQuote && !inSingleQuote) {
        if (current.length > 0) {
          args.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.length > 0) {
      args.push(current);
    }

    return args;
  }

  /**
   * Resolves a relative or tilde-prefixed path into an absolute POSIX path
   */
  public static resolvePath(target: string, cwd: string, currentUser: string, homeDir: string): string {
    const raw = (target || '').trim();
    const userHome = currentUser === 'root' ? '/root' : (homeDir || '/mnt/helix');
    if (!raw || raw === '~' || raw === '~/') return userHome;
    if (raw.startsWith('~/')) return userHome === '/' ? '/' + raw.substring(2) : `${userHome}/${raw.substring(2)}`;

    const full = raw.startsWith('/') ? raw : (cwd === '/' ? `/${raw}` : `${cwd}/${raw}`);
    const parts = full.split('/').filter(Boolean);
    const stack: string[] = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(part);
      }
    }
    return '/' + stack.join('/');
  }

  /**
   * Normalize VFS path: maps /mnt/helix/* to VFS internal root or preserves absolute POSIX path
   */
  public static toVfsPath(posixPath: string): string {
    const cleaned = posixPath.replace(/\/+/g, '/');
    if (cleaned.startsWith('/mnt/helix')) {
      const remainder = cleaned.slice('/mnt/helix'.length);
      return remainder.startsWith('/') ? remainder : (remainder ? `/${remainder}` : '/');
    }
    return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
  }

  /**
   * Helper to format human-readable bytes
   */
  public static formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}G`;
  }
}
