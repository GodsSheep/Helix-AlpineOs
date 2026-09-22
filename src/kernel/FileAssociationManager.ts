import { AppId } from './types';
import { Kernel } from './index';
import { Toast } from './Toast';
import { SoundManager } from './SoundManager';

export interface FileTypeHandler {
  extensions: string[];
  defaultApp: AppId;
  icon: string;
  category: 'code' | 'image' | 'audio' | 'video' | 'executable' | 'archive' | 'document' | 'data';
  description: string;
}

export class FileAssociationManager {
  private static handlers: FileTypeHandler[] = [
    {
      extensions: ['js', 'jsx', 'ts', 'tsx', 'py', 'rs', 'c', 'cpp', 'h', 'go', 'sh', 'bash', 'zsh', 'html', 'css', 'json', 'yml', 'yaml', 'toml', 'xml', 'md', 'txt', 'log', 'ini', 'conf'],
      defaultApp: 'edit',
      icon: '📝',
      category: 'code',
      description: 'Source Code & Text Document'
    },
    {
      extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'],
      defaultApp: 'paint',
      icon: '🖼️',
      category: 'image',
      description: 'Image & Graphic'
    },
    {
      extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'],
      defaultApp: 'media-player',
      icon: '🎵',
      category: 'audio',
      description: 'Audio Track & Sound Recording'
    },
    {
      extensions: ['mp4', 'webm', 'mkv', 'mov', 'avi'],
      defaultApp: 'media-player',
      icon: '🎬',
      category: 'video',
      description: 'Video Stream'
    },
    {
      extensions: ['exe', 'msi', 'bat', 'cmd'],
      defaultApp: 'wine-app',
      icon: '🍷',
      category: 'executable',
      description: 'Windows Win32 Application'
    },
    {
      extensions: ['apk'],
      defaultApp: 'apk-bridge',
      icon: '📱',
      category: 'executable',
      description: 'Android Application Package'
    },
    {
      extensions: ['nes', 'gb', 'gba', 'sfc', 'smc', 'ch8', 'rom'],
      defaultApp: 'retro-emulator',
      icon: '🕹️',
      category: 'executable',
      description: 'Retro ROM & Cartridge'
    },
    {
      extensions: ['zip', 'tar', 'gz', 'bz2', 'xz', '7z'],
      defaultApp: 'archive',
      icon: '📦',
      category: 'archive',
      description: 'Compressed Archive'
    },
    {
      extensions: ['sql', 'sqlite', 'db', 'csv'],
      defaultApp: 'universal-utils',
      icon: '📊',
      category: 'data',
      description: 'Structured Database Table'
    },
    {
      extensions: ['game', 'level'],
      defaultApp: 'visual-game-engine',
      icon: '🎮',
      category: 'data',
      description: 'Visual Game Engine Scene'
    }
  ];

  public static getExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length < 2) return '';
    return parts[parts.length - 1].toLowerCase();
  }

  public static getHandler(filename: string): FileTypeHandler | null {
    const ext = this.getExtension(filename);
    if (!ext) return null;
    return this.handlers.find(h => h.extensions.includes(ext)) || null;
  }

  public static getDefaultApp(filename: string): AppId {
    const handler = this.getHandler(filename);
    return handler ? handler.defaultApp : 'edit';
  }

  public static getIcon(filename: string, isFolder: boolean = false): string {
    if (isFolder) return '📁';
    const handler = this.getHandler(filename);
    return handler ? handler.icon : '📄';
  }

  public static openFile(path: string, preferredAppId?: AppId) {
    const filename = path.split('/').pop() || path;
    const targetApp = preferredAppId || this.getDefaultApp(filename);

    SoundManager.play('open');
    Toast.show(`Opening ${filename}`, this.getIcon(filename));

    // Pass file path into app launch arguments
    Kernel.wm.launch(targetApp, {
      filePath: path,
      path: path,
      fileName: filename,
      title: `${filename} — ${targetApp.toUpperCase()}`
    });
  }
}
