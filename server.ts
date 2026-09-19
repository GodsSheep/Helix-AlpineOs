import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import os from 'os';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to sanitize & get default shell
const getShell = () => {
  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'cmd.exe';
  }
  if (fs.existsSync('/bin/bash')) return '/bin/bash';
  if (fs.existsSync('/bin/sh')) return '/bin/sh';
  return 'sh';
};

// Track current working directory per session/global
let globalCwd = process.cwd();

// API Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    os: os.platform(),
    release: os.release(),
    arch: os.arch(),
    uptime: os.uptime(),
    cwd: globalCwd,
  });
});

// Real OS System Telemetry & Hardware Info
app.get('/api/system/info', (_req, res) => {
  res.json({
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
    cwd: globalCwd,
  });
});

// Real-Time OS Command Execution API
app.post('/api/terminal/exec', (req, res) => {
  const { command, cwd, env, timeout = 30000 } = req.body || {};

  if (typeof command !== 'string' || !command.trim()) {
    return res.status(400).json({
      ok: false,
      exitCode: 1,
      stdout: '',
      stderr: 'Error: No command provided',
      durationMs: 0,
      real: true,
      cwd: globalCwd,
    });
  }

  const trimmedCmd = command.trim();
  const startTime = Date.now();
  const targetCwd = cwd && fs.existsSync(cwd) ? cwd : globalCwd;
  const shell = getShell();

  // If command is a direct 'cd' command
  if (trimmedCmd.startsWith('cd ') || trimmedCmd === 'cd') {
    const targetDir = trimmedCmd === 'cd' ? os.homedir() : trimmedCmd.slice(3).trim();
    const resolvedPath = path.resolve(targetCwd, targetDir.replace(/^~(?=$|\/|\\)/, os.homedir()));
    
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
      globalCwd = resolvedPath;
      const durationMs = Date.now() - startTime;
      return res.json({
        ok: true,
        exitCode: 0,
        stdout: '',
        stderr: '',
        cwd: globalCwd,
        durationMs,
        real: true,
      });
    } else {
      const durationMs = Date.now() - startTime;
      return res.json({
        ok: false,
        exitCode: 1,
        stdout: '',
        stderr: `cd: no such file or directory: ${targetDir}`,
        cwd: globalCwd,
        durationMs,
        real: true,
      });
    }
  }

  let stdoutData = '';
  let stderrData = '';
  let isDone = false;

  const envVars = {
    ...process.env,
    ...env,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    FORCE_COLOR: '1',
  };

  const child = spawn(shell, ['-c', trimmedCmd], {
    cwd: targetCwd,
    env: envVars,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const timer = setTimeout(() => {
    if (!isDone) {
      isDone = true;
      try {
        child.kill('SIGKILL');
      } catch {}
      const durationMs = Date.now() - startTime;
      res.json({
        ok: false,
        exitCode: 124, // Standard timeout exit code
        stdout: stdoutData,
        stderr: stderrData + `\n[Command timed out after ${timeout / 1000}s]`,
        cwd: globalCwd,
        durationMs,
        real: true,
      });
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
    res.json({
      ok: false,
      exitCode: 127,
      stdout: stdoutData,
      stderr: stderrData ? `${stderrData}\n${err.message}` : err.message,
      cwd: globalCwd,
      durationMs,
      real: true,
    });
  });

  child.on('close', (code) => {
    if (isDone) return;
    isDone = true;
    clearTimeout(timer);
    const durationMs = Date.now() - startTime;
    const exitCode = code ?? 0;
    res.json({
      ok: exitCode === 0,
      exitCode,
      stdout: stdoutData,
      stderr: stderrData,
      cwd: globalCwd,
      durationMs,
      real: true,
    });
  });
});

// Real-Time Streaming OS Terminal Endpoint (Server-Sent Events)
app.get('/api/terminal/stream', (req, res) => {
  const command = req.query.cmd as string;
  const cwd = (req.query.cwd as string) || globalCwd;

  if (!command || !command.trim()) {
    return res.status(400).send('Missing cmd parameter');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const shell = getShell();
  const targetCwd = cwd && fs.existsSync(cwd) ? cwd : globalCwd;
  const startTime = Date.now();

  const child = spawn(shell, ['-c', command], {
    cwd: targetCwd,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      FORCE_COLOR: '1',
    },
  });

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  child.stdout?.on('data', (chunk) => {
    sendEvent('stdout', { text: chunk.toString('utf-8') });
  });

  child.stderr?.on('data', (chunk) => {
    sendEvent('stderr', { text: chunk.toString('utf-8') });
  });

  child.on('error', (err) => {
    sendEvent('error', { message: err.message });
    sendEvent('close', { exitCode: 127, durationMs: Date.now() - startTime });
    res.end();
  });

  child.on('close', (code) => {
    sendEvent('close', { exitCode: code ?? 0, durationMs: Date.now() - startTime, cwd: globalCwd });
    res.end();
  });

  req.on('close', () => {
    try {
      child.kill('SIGTERM');
    } catch {}
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Helix OS Host] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
