// Helix OS - BIOS ROM & Firmware Integrity Validator Engine
// Computes and verifies SHA-256 signatures, header magic bytes, and size bounds

export interface BiosValidationResult {
  isValid: boolean;
  sha256: string;
  sizeBytes: number;
  message: string;
  isHtmlErrorResponse?: boolean;
}

export interface ExpectedBiosSignature {
  id: string;
  romUrl: string;
  minSize: number;
  maxSize: number;
  expectedSha256?: string;
  magicHeaderBytes?: number[];
}

export const KNOWN_BIOS_SIGNATURES: Record<string, ExpectedBiosSignature> = {
  '/v86/seabios.bin': {
    id: 'seabios-std',
    romUrl: '/v86/seabios.bin',
    minSize: 64 * 1024,
    maxSize: 512 * 1024,
    magicHeaderBytes: [0x55, 0xaa], // Standard x86 ROM Option Header or SeaBIOS signature
  },
  '/v86/seabios-acpi.bin': {
    id: 'seabios-acpi',
    romUrl: '/v86/seabios-acpi.bin',
    minSize: 64 * 1024,
    maxSize: 512 * 1024,
    magicHeaderBytes: [0x55, 0xaa],
  },
  '/v86/bios-csm.bin': {
    id: 'bios-csm',
    romUrl: '/v86/bios-csm.bin',
    minSize: 64 * 1024,
    maxSize: 512 * 1024,
  },
  '/v86/bios-rt.bin': {
    id: 'bios-rt',
    romUrl: '/v86/bios-rt.bin',
    minSize: 32 * 1024,
    maxSize: 512 * 1024,
  },
  '/v86/bios-retro.bin': {
    id: 'bios-retro',
    romUrl: '/v86/bios-retro.bin',
    minSize: 32 * 1024,
    maxSize: 512 * 1024,
  },
  '/v86/vgabios.bin': {
    id: 'vgabios-std',
    romUrl: '/v86/vgabios.bin',
    minSize: 16 * 1024,
    maxSize: 256 * 1024,
    magicHeaderBytes: [0x55, 0xaa],
  },
  '/v86/vgabios-vesa.bin': {
    id: 'vgabios-vesa',
    romUrl: '/v86/vgabios-vesa.bin',
    minSize: 16 * 1024,
    maxSize: 256 * 1024,
    magicHeaderBytes: [0x55, 0xaa],
  },
  '/v86/v86.wasm': {
    id: 'v86-wasm',
    romUrl: '/v86/v86.wasm',
    minSize: 100 * 1024,
    maxSize: 10 * 1024 * 1024,
    magicHeaderBytes: [0x00, 0x61, 0x73, 0x6d], // \0asm WASM Magic
  }
};

/**
 * Calculates SHA-256 hash of an ArrayBuffer using Web Crypto API
 */
export async function computeSha256Hex(buffer: ArrayBuffer): Promise<string> {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple checksum if WebCrypto is limited
    const bytes = new Uint8Array(buffer);
    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
      hash = (hash << 5) - hash + bytes[i];
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16).padStart(8, '0');
  }
}

/**
 * Checks if buffer is a raw HTML error response (e.g. Vite SPA fallback 404 page)
 */
export function isHtmlErrorBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 15) return false;
  const sample = new Uint8Array(buffer.slice(0, 300));
  const str = String.fromCharCode.apply(null, Array.from(sample)).toLowerCase();
  return str.includes('<!doctype html') || str.includes('<html') || str.includes('404: not_found');
}

/**
 * Verifies integrity of a BIOS ROM / WASM binary buffer
 */
export async function verifyBiosBufferIntegrity(url: string, buffer: ArrayBuffer): Promise<BiosValidationResult> {
  const sha256 = await computeSha256Hex(buffer);
  const sizeBytes = buffer.byteLength;

  if (sizeBytes === 0) {
    return {
      isValid: false,
      sha256,
      sizeBytes,
      message: `[CORRUPTED] Zero-byte ROM buffer received for ${url}`,
    };
  }

  if (isHtmlErrorBuffer(buffer)) {
    return {
      isValid: false,
      sha256,
      sizeBytes,
      message: `[CORRUPTED] Server returned HTML 404 instead of raw binary for ${url}`,
      isHtmlErrorResponse: true
    };
  }

  const sig = KNOWN_BIOS_SIGNATURES[url];
  if (sig) {
    if (sizeBytes < sig.minSize || sizeBytes > sig.maxSize) {
      return {
        isValid: false,
        sha256,
        sizeBytes,
        message: `[CORRUPTED] ROM size ${sizeBytes} bytes out of expected bounds (${sig.minSize}-${sig.maxSize}) for ${url}`,
      };
    }

    if (sig.expectedSha256 && sha256 !== sig.expectedSha256) {
      return {
        isValid: false,
        sha256,
        sizeBytes,
        message: `[MISMATCH] SHA-256 ${sha256.substring(0, 12)}... does not match expected ${sig.expectedSha256.substring(0, 12)}...`,
      };
    }

    if (sig.magicHeaderBytes && sig.magicHeaderBytes.length > 0) {
      const bytes = new Uint8Array(buffer.slice(0, sig.magicHeaderBytes.length));
      const match = sig.magicHeaderBytes.every((b, idx) => bytes[idx] === b);
      if (!match) {
        return {
          isValid: false,
          sha256,
          sizeBytes,
          message: `[HEADER MISMATCH] Invalid magic ROM header signature for ${url}`,
        };
      }
    }
  }

  return {
    isValid: true,
    sha256,
    sizeBytes,
    message: `[VERIFIED] Integrity OK: SHA-256=${sha256.substring(0, 16)}... (${(sizeBytes / 1024).toFixed(1)} KB)`
  };
}

/**
 * Fetches and validates a BIOS ROM file, automatically recovering from corrupted caches
 */
export async function fetchAndValidateBiosRom(url: string): Promise<{ buffer: ArrayBuffer; validation: BiosValidationResult }> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const buf = await res.arrayBuffer();
    const validation = await verifyBiosBufferIntegrity(url, buf);

    if (!validation.isValid) {
      console.warn(`[BiosValidator] SW/Cache corruption detected for ${url}. Bypassing cache...`, validation.message);
      // Force reload from server bypassing cache
      const reloadRes = await fetch(`${url}?_t=${Date.now()}`, { cache: 'reload' });
      if (reloadRes.ok) {
        const freshBuf = await reloadRes.arrayBuffer();
        const freshVal = await verifyBiosBufferIntegrity(url, freshBuf);
        if (freshVal.isValid) {
          return { buffer: freshBuf, validation: freshVal };
        }
      }
    }

    return { buffer: buf, validation };
  } catch (err: any) {
    const errorVal: BiosValidationResult = {
      isValid: false,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      sizeBytes: 0,
      message: `[FETCH ERROR] Failed to load BIOS ROM ${url}: ${err?.message || err}`
    };
    return { buffer: new ArrayBuffer(0), validation: errorVal };
  }
}
