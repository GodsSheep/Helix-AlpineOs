// Helix OS - Full Workspace State, Settings & VFS Tar.Gz Archive Engine
// Encodes and decodes .tar.gz archives containing workspace settings, app states, and VFS files.

import { Settings } from './Settings';
import { Kernel } from './index';

export interface WorkspaceStateExport {
  version: string;
  timestamp: number;
  settings: ReturnType<typeof Settings.get>;
  vfsManifest: string[];
}

export class TarGzArchiveEngine {
  /**
   * Encodes string into ASCII/UTF-8 byte array with null padding
   */
  private static writeString(buffer: Uint8Array, offset: number, length: number, value: string): void {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(value);
    const writeLen = Math.min(encoded.length, length);
    buffer.set(encoded.subarray(0, writeLen), offset);
  }

  /**
   * Formats a number as an octal string padded to specified width
   */
  private static formatOctal(num: number, width: number): string {
    return num.toString(8).padStart(width - 1, '0') + '\0';
  }

  /**
   * Generates a 512-byte USTAR tar header block for a file or directory
   */
  private static createTarHeader(name: string, size: number, isDir = false): Uint8Array {
    const header = new Uint8Array(512);

    // Name (100 bytes)
    this.writeString(header, 0, 100, name);

    // Mode (8 bytes) - 0644 for files, 0755 for dirs
    this.writeString(header, 100, 8, isDir ? '0000755\0' : '0000644\0');

    // UID / GID (8 bytes each)
    this.writeString(header, 108, 8, '0000000\0');
    this.writeString(header, 116, 8, '0000000\0');

    // Size (12 bytes octal)
    this.writeString(header, 124, 12, this.formatOctal(isDir ? 0 : size, 12));

    // Mtime (12 bytes octal)
    const mtime = Math.floor(Date.now() / 1000);
    this.writeString(header, 136, 12, this.formatOctal(mtime, 12));

    // Checksum placeholder (8 spaces)
    for (let i = 148; i < 156; i++) {
      header[i] = 32; // ASCII space
    }

    // Typeflag: '0' for file, '5' for directory
    header[156] = isDir ? 53 : 48;

    // Magic "ustar\0" and version "00"
    this.writeString(header, 257, 6, 'ustar\0');
    this.writeString(header, 263, 2, '00');

    // User & Group name
    this.writeString(header, 265, 32, 'helix\0');
    this.writeString(header, 297, 32, 'helix\0');

    // Calculate header checksum
    let sum = 0;
    for (let i = 0; i < 512; i++) {
      sum += header[i];
    }

    // Write octal checksum into header
    const checksumOctal = sum.toString(8).padStart(6, '0') + '\0 ';
    this.writeString(header, 148, 8, checksumOctal);

    return header;
  }

  /**
   * Compresses byte array using native CompressionStream('gzip') with fallback
   */
  private static async compressGzip(rawBytes: Uint8Array): Promise<Uint8Array> {
    if (typeof CompressionStream !== 'undefined') {
      try {
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(rawBytes as unknown as BufferSource);
        writer.close();
        const arrayBuf = await new Response(cs.readable).arrayBuffer();
        return new Uint8Array(arrayBuf);
      } catch (err) {
        console.warn('CompressionStream failed, returning raw tar:', err);
      }
    }
    return rawBytes;
  }

  /**
   * Decompresses gzip byte array using native DecompressionStream('gzip')
   */
  private static async decompressGzip(compressedBytes: Uint8Array): Promise<Uint8Array> {
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        writer.write(compressedBytes as unknown as BufferSource);
        writer.close();
        const arrayBuf = await new Response(ds.readable).arrayBuffer();
        return new Uint8Array(arrayBuf);
      } catch {
        // Fallback if data is already uncompressed tar
        return compressedBytes;
      }
    }
    return compressedBytes;
  }

  /**
   * Exports entire workspace settings, app configuration, and VFS files to a .tar.gz Blob
   */
  public static async exportWorkspaceTarGz(): Promise<Blob> {
    const vfsFiles = await Kernel.vfs.list();
    const settings = Settings.get();

    const workspaceExport: WorkspaceStateExport = {
      version: '2.4.0',
      timestamp: Date.now(),
      settings,
      vfsManifest: vfsFiles.map((f: { path: string }) => f.path),
    };

    const encoder = new TextEncoder();
    const entries: { name: string; data: Uint8Array; isDir: boolean }[] = [];

    // 1. Add workspace_state.json metadata file
    const stateJsonStr = JSON.stringify(workspaceExport, null, 2);
    entries.push({
      name: 'workspace_state.json',
      data: encoder.encode(stateJsonStr),
      isDir: false,
    });

    // 2. Add all VFS files under vfs/
    for (const file of vfsFiles) {
      const cleanPath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
      const archiveName = `vfs/${cleanPath}`;
      entries.push({
        name: archiveName,
        data: encoder.encode(file.content),
        isDir: false,
      });
    }

    // Calculate total tar byte length
    let totalTarLength = 0;
    for (const entry of entries) {
      totalTarLength += 512; // Header
      totalTarLength += Math.ceil(entry.data.length / 512) * 512; // Content padded to 512
    }
    totalTarLength += 1024; // End of archive blocks (2 zero headers)

    const tarBuffer = new Uint8Array(totalTarLength);
    let offset = 0;

    for (const entry of entries) {
      const header = this.createTarHeader(entry.name, entry.data.length, entry.isDir);
      tarBuffer.set(header, offset);
      offset += 512;

      if (entry.data.length > 0) {
        tarBuffer.set(entry.data, offset);
        const paddedLength = Math.ceil(entry.data.length / 512) * 512;
        offset += paddedLength;
      }
    }

    // Compress tar buffer with gzip
    const gzipBuffer = await this.compressGzip(tarBuffer);
    return new Blob([gzipBuffer as unknown as BlobPart], { type: 'application/gzip' });
  }

  /**
   * Imports a .tar.gz archive file, restoring workspace state, settings, and VFS files
   */
  public static async importWorkspaceTarGz(file: File | Blob): Promise<{ success: boolean; restoredFilesCount: number; message: string }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const rawTarBytes = await this.decompressGzip(new Uint8Array(arrayBuffer));

      let offset = 0;
      let restoredFilesCount = 0;
      let restoredState: WorkspaceStateExport | null = null;
      const decoder = new TextDecoder();

      while (offset + 512 <= rawTarBytes.length) {
        // Check for 512-byte zero block (end of archive)
        const isZeroHeader = rawTarBytes.subarray(offset, offset + 512).every((b) => b === 0);
        if (isZeroHeader) break;

        // Extract filename from header
        const fileName = decoder.decode(rawTarBytes.subarray(offset, offset + 100)).replace(/\0.*$/, '').trim();
        if (!fileName) break;

        // Extract octal size
        const sizeStr = decoder.decode(rawTarBytes.subarray(offset + 124, offset + 136)).replace(/\0.*$/, '').trim();
        const size = parseInt(sizeStr, 8) || 0;

        offset += 512; // Move past header

        if (size > 0) {
          const fileData = rawTarBytes.subarray(offset, offset + size);

          if (fileName === 'workspace_state.json') {
            try {
              const jsonStr = decoder.decode(fileData);
              restoredState = JSON.parse(jsonStr);
              if (restoredState && restoredState.settings) {
                Settings.update(restoredState.settings);
              }
            } catch (err) {
              console.warn('Failed to parse workspace_state.json from archive:', err);
            }
          } else if (fileName.startsWith('vfs/')) {
            const vfsPath = '/' + fileName.replace(/^vfs\//, '');
            const content = decoder.decode(fileData);
            await Kernel.vfs.write(vfsPath, content);
            restoredFilesCount++;
          }

          const paddedLength = Math.ceil(size / 512) * 512;
          offset += paddedLength;
        }
      }

      return {
        success: true,
        restoredFilesCount,
        message: `Successfully restored workspace state and ${restoredFilesCount} VFS files.`,
      };
    } catch (err: any) {
      return {
        success: false,
        restoredFilesCount: 0,
        message: `Failed to extract archive: ${err?.message || err}`,
      };
    }
  }
}

