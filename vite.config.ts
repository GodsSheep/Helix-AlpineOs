import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import {defineConfig, Plugin} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function getShell() {
  if (process.platform === 'win32') return process.env.COMSPEC || 'cmd.exe';
  if (fs.existsSync('/bin/bash')) return '/bin/bash';
  if (fs.existsSync('/bin/sh')) return '/bin/sh';
  return 'sh';
}

let hostTerminalCwd = process.cwd();

function realHostTerminalPlugin(): Plugin {
  return {
    name: 'vite-plugin-real-terminal',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] || '';

        // API Health
        if (url === '/api/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            status: 'ok',
            os: os.platform(),
            release: os.release(),
            arch: os.arch(),
            uptime: os.uptime(),
            cwd: hostTerminalCwd,
          }));
        }

        // System Telemetry Info
        if (url === '/api/system/info' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            platform: os.platform(),
            type: os.type(),
            release: os.release(),
            arch: os.arch(),
            hostname: os.hostname(),
            cpus: os.cpus(),
            totalmem: os.totalmem(),
            freemem: os.freemem(),
            uptime: os.uptime(),
            loadavg: os.loadavg(),
            userInfo: {
              username: os.userInfo().username,
              homedir: os.userInfo().homedir,
              shell: os.userInfo().shell,
            },
            networkInterfaces: os.networkInterfaces(),
            cwd: hostTerminalCwd,
          }));
        }

        // Real OS Terminal Command Execution
        if (url === '/api/terminal/exec' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const { command, cwd, env, timeout = 30000 } = parsed;

              if (typeof command !== 'string' || !command.trim()) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                  ok: false,
                  exitCode: 1,
                  stdout: '',
                  stderr: 'Error: No command provided',
                  durationMs: 0,
                  real: true,
                  cwd: hostTerminalCwd,
                }));
              }

              const trimmedCmd = command.trim();
              const startTime = Date.now();
              const targetCwd = cwd && fs.existsSync(cwd) ? cwd : hostTerminalCwd;
              const shell = getShell();

              if (trimmedCmd.startsWith('cd ') || trimmedCmd === 'cd') {
                const targetDir = trimmedCmd === 'cd' ? os.homedir() : trimmedCmd.slice(3).trim();
                const resolvedPath = path.resolve(targetCwd, targetDir.replace(/^~(?=$|\/|\\)/, os.homedir()));
                
                if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
                  hostTerminalCwd = resolvedPath;
                  const durationMs = Date.now() - startTime;
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({
                    ok: true,
                    exitCode: 0,
                    stdout: '',
                    stderr: '',
                    cwd: hostTerminalCwd,
                    durationMs,
                    real: true,
                  }));
                } else {
                  const durationMs = Date.now() - startTime;
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({
                    ok: false,
                    exitCode: 1,
                    stdout: '',
                    stderr: `cd: no such file or directory: ${targetDir}`,
                    cwd: hostTerminalCwd,
                    durationMs,
                    real: true,
                  }));
                }
              }

              let stdoutData = '';
              let stderrData = '';
              let isDone = false;

              const child = spawn(shell, ['-c', trimmedCmd], {
                cwd: targetCwd,
                env: {
                  ...process.env,
                  ...env,
                  TERM: 'xterm-256color',
                  COLORTERM: 'truecolor',
                  FORCE_COLOR: '1',
                },
                stdio: ['pipe', 'pipe', 'pipe'],
              });

              const timer = setTimeout(() => {
                if (!isDone) {
                  isDone = true;
                  try { child.kill('SIGKILL'); } catch {}
                  const durationMs = Date.now() - startTime;
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    ok: false,
                    exitCode: 124,
                    stdout: stdoutData,
                    stderr: stderrData + `\n[Command timed out after ${timeout / 1000}s]`,
                    cwd: hostTerminalCwd,
                    durationMs,
                    real: true,
                  }));
                }
              }, timeout);

              child.stdout?.on('data', (chunk) => {
                stdoutData += chunk.toString('utf-8');
              });

              child.stderr?.on('data', (chunk) => {
                stderrData += chunk.toString('utf-8');
              });

              child.on('error', (err) => {
                if (isDone) return;
                isDone = true;
                clearTimeout(timer);
                const durationMs = Date.now() - startTime;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  ok: false,
                  exitCode: 127,
                  stdout: stdoutData,
                  stderr: stderrData ? `${stderrData}\n${err.message}` : err.message,
                  cwd: hostTerminalCwd,
                  durationMs,
                  real: true,
                }));
              });

              child.on('close', (code) => {
                if (isDone) return;
                isDone = true;
                clearTimeout(timer);
                const durationMs = Date.now() - startTime;
                const exitCode = code ?? 0;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  ok: exitCode === 0,
                  exitCode,
                  stdout: stdoutData,
                  stderr: stderrData,
                  cwd: hostTerminalCwd,
                  durationMs,
                  real: true,
                }));
              });
            } catch (err: unknown) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: (err as Error).message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

function rangeRequestsPlugin(): Plugin {
  return {
    name: 'vite-plugin-range-requests',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || (req.method !== 'GET' && req.method !== 'HEAD')) return next();
        const urlPath = req.url.split('?')[0];
        const filePath = path.join(process.cwd(), 'public', urlPath);

        try {
          if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            return next();
          }

          const stat = fs.statSync(filePath);
          const fileSize = stat.size;
          const range = req.headers.range;

          const getContentType = (p: string) => {
            if (p.endsWith('.wasm')) return 'application/wasm';
            if (p.endsWith('.iso')) return 'application/x-iso9660-image';
            if (p.endsWith('.bin')) return 'application/octet-stream';
            if (p.endsWith('.js')) return 'application/javascript';
            if (p.endsWith('.json')) return 'application/json';
            if (p.endsWith('.svg')) return 'image/svg+xml';
            if (p.endsWith('.png')) return 'image/png';
            return 'application/octet-stream';
          };

          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

          if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (isNaN(start) || start >= fileSize || (end && end >= fileSize) || start > end) {
              res.writeHead(416, {
                'Content-Range': `bytes */${fileSize}`,
              });
              return res.end();
            }

            const chunkSize = end - start + 1;
            const fileStream = fs.createReadStream(filePath, { start, end });

            res.writeHead(206, {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Content-Length': chunkSize,
              'Content-Type': getContentType(urlPath),
            });

            if (req.method === 'HEAD') {
              return res.end();
            }

            fileStream.pipe(res);
            return;
          }

          // If requesting v86 assets (.wasm, .bin, .iso), handle full response directly
          if (urlPath.startsWith('/v86/')) {
            res.writeHead(200, {
              'Content-Length': fileSize,
              'Content-Type': getContentType(urlPath),
              'Accept-Ranges': 'bytes',
              'Access-Control-Allow-Origin': '*',
              'Cross-Origin-Resource-Policy': 'cross-origin',
            });

            if (req.method === 'HEAD') {
              return res.end();
            }

            fs.createReadStream(filePath).pipe(res);
            return;
          }
        } catch (err) {
          console.warn('Range request handler error:', err);
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
        realHostTerminalPlugin(),
        rangeRequestsPlugin(), 
        react(), 
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
            manifest: {
              id: '/',
              name: 'Helix Alpine Desktop',
              short_name: 'HelixAlpine',
              description: 'Professional Linux-like desktop experience.',
              theme_color: '#050608',
              background_color: '#050608',
              display: 'standalone',
              start_url: '/',
              scope: '/',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                  purpose: 'any',
                },
                {
                  src: '/pwa-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any',
                },
                {
                  src: '/pwa-maskable-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MiB for full ISO/WASM/ROM images
              globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,bin,iso}'],
              runtimeCaching: [
                {
                  urlPattern: /\/v86\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'v86-firmware-and-kernel-cache',
                    expiration: {
                      maxEntries: 50,
                      maxAgeSeconds: 60 * 60 * 24 * 90, // 90 Days
                      purgeOnQuotaError: false, // Never evict core BIOS firmware!
                    },
                    cacheableResponse: {
                      statuses: [0, 200, 206],
                    },
                  },
                },
                {
                  urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'google-fonts-cache',
                    expiration: {
                      maxEntries: 10,
                      maxAgeSeconds: 60 * 60 * 24 * 365,
                    },
                    cacheableResponse: {
                      statuses: [0, 200],
                    },
                  },
                },
                {
                  urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'gstatic-fonts-cache',
                    expiration: {
                      maxEntries: 20,
                      maxAgeSeconds: 60 * 60 * 24 * 365,
                    },
                    cacheableResponse: {
                      statuses: [0, 200],
                    },
                  },
                },
                {
                  urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'helix-images-cache',
                    expiration: {
                      maxEntries: 50,
                      maxAgeSeconds: 60 * 60 * 24 * 14,
                      purgeOnQuotaError: true,
                    },
                  },
                },
                {
                  urlPattern: /\.(?:js|css)$/i,
                  handler: 'StaleWhileRevalidate',
                  options: {
                    cacheName: 'helix-static-resources',
                    expiration: {
                      maxEntries: 50,
                      maxAgeSeconds: 60 * 60 * 24 * 7,
                    },
                  },
                },
              ],
            },
            devOptions: {
              enabled: true,
              type: 'module',
            },
        })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
