import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

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
    plugins: [rangeRequestsPlugin(), react(), tailwindcss()],
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
