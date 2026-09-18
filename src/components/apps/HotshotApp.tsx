import React, { useState, useEffect, useRef } from 'react';
import { Toast } from '../../kernel/Toast';
import { Kernel } from '../../kernel';
import { SoundManager } from '../../kernel/SoundManager';
import { Settings } from '../../kernel/Settings';
import { 
  Camera, Image as ImageIcon, Crop, Save, Copy, Download, 
  Trash2, Brush, Type, Sparkles, Check, RefreshCw, 
  Sliders, Calendar, FileText, Monitor, AppWindow, Eye, Info
} from 'lucide-react';

interface CaptureHistoryItem {
  id: string;
  timestamp: string;
  dataUrl: string;
  name: string;
}

export const HotshotApp: React.FC = () => {
  const [captureMode, setCaptureMode] = useState<'screen' | 'window' | 'region'>('screen');
  const [delaySeconds, setDelaySeconds] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  
  // Editor State
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<'draw' | 'text' | 'shield' | 'none'>('draw');
  const [brushColor, setBrushColor] = useState('#6ee7b7'); // Emerald preset
  const [brushSize, setBrushSize] = useState(4);
  const [history, setHistory] = useState<CaptureHistoryItem[]>([]);
  const [annotations, setAnnotations] = useState<{ x: number; y: number; text: string }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawing = useRef(false);

  // Colors presets
  const colors = [
    { name: 'Emerald', hex: '#6ee7b7' },
    { name: 'Tokyo Cyan', hex: '#7aa2f7' },
    { name: 'Cyber Yellow', hex: '#fcee0a' },
    { name: 'Ruby Red', hex: '#ff5c5c' },
    { name: 'Gothic Purple', hex: '#ff79c6' },
  ];

  // Load history from VFS if available
  useEffect(() => {
    const loadSavedScreenshots = async () => {
      try {
        const files = await Kernel.vfs.list();
        const screenshotFiles = files.filter(f => f.path.startsWith('/home/alpine/Pictures/screenshot_'));
        const loaded: CaptureHistoryItem[] = [];
        for (const file of screenshotFiles) {
          const content = await Kernel.vfs.read(file.path);
          if (content && content.startsWith('data:image')) {
            loaded.push({
              id: file.path,
              name: file.path.split('/').pop() || 'Screenshot',
              timestamp: new Date(file.timestamp || Date.now()).toLocaleTimeString(),
              dataUrl: content,
            });
          }
        }
        setHistory(loaded.reverse());
        if (loaded.length > 0 && !activeImage) {
          setActiveImage(loaded[0].dataUrl);
        }
      } catch (err) {
        console.error('Failed to load screenshots from VFS:', err);
      }
    };
    loadSavedScreenshots();

    // Register a global listener for system-wide captures
    (window as any).__triggerHotshotCapture = (customDataUrl?: string) => {
      if (customDataUrl) {
        handleImportedCapture(customDataUrl);
      } else {
        triggerCaptureAction();
      }
    };

    return () => {
      delete (window as any).__triggerHotshotCapture;
    };
  }, []);

  // Update canvas when image or tool changes
  useEffect(() => {
    if (!activeImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = activeImage;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Render text annotations
      annotations.forEach(ann => {
        ctx.fillStyle = brushColor;
        ctx.font = 'bold 16px font-sans';
        ctx.fillText(ann.text, ann.x, ann.y);
      });
    };
  }, [activeImage, annotations]);

  const handleImportedCapture = (dataUrl: string) => {
    setActiveImage(dataUrl);
    const ts = new Date().toLocaleTimeString();
    const name = `screenshot_${Date.now().toString().slice(-6)}.png`;
    const newCap: CaptureHistoryItem = {
      id: `imported_${Date.now()}`,
      name,
      timestamp: ts,
      dataUrl,
    };
    setHistory(prev => [newCap, ...prev]);
    Toast.show(`Captured snapshot system-wide!`, '📸');
  };

  const triggerCaptureAction = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    if (delaySeconds > 0) {
      SoundManager.play('click');
      let count = delaySeconds;
      setCountdown(count);
      const timer = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(timer);
          setCountdown(null);
          executeMockVectorCapture();
        } else {
          setCountdown(count);
          SoundManager.play('click');
        }
      }, 1000);
    } else {
      executeMockVectorCapture();
    }
  };

  // Perform highly-realistic mock vector capture of the workspace
  const executeMockVectorCapture = async () => {
    // Stage 1: Play camera shutter simulation sounds
    SoundManager.play('click');
    setTimeout(() => SoundManager.play('success'), 80);

    // Stage 2: Trigger shutter flash effect
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 220);

    // Stage 3: Draw the desktop onto an offline canvas
    const drawCanvas = document.createElement('canvas');
    drawCanvas.width = window.innerWidth || 1280;
    drawCanvas.height = window.innerHeight || 800;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    // Get current Helix theme colors
    const theme = Settings.getActiveTheme();
    const settings = Settings.get();

    // 1. Draw wallpaper background
    const gradient = ctx.createRadialGradient(
      drawCanvas.width / 2, drawCanvas.height / 3, 0,
      drawCanvas.width / 2, drawCanvas.height / 2, drawCanvas.width
    );
    gradient.addColorStop(0, theme.panelSolid || '#1a1b26');
    gradient.addColorStop(1, theme.bg || '#07080b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);

    // 2. Draw matrix / neon grid line accents if cyber preset
    ctx.strokeStyle = theme.line || 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < drawCanvas.width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, drawCanvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < drawCanvas.height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(drawCanvas.width, y);
      ctx.stroke();
    }

    // 3. Draw Desktop Logo label watermark
    ctx.fillStyle = theme.accent || '#6ee7b7';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Helix OS Desktop', drawCanvas.width / 2, drawCanvas.height / 2 - 20);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '13px monospace';
    ctx.fillText('Alpine Linux VM Virtual Display Server :0', drawCanvas.width / 2, drawCanvas.height / 2 + 15);

    // 4. Draw shortcuts in column layout on the left side
    const shortcuts = settings.desktopShortcuts || ['term', 'files', 'settings'];
    shortcuts.forEach((appId, index) => {
      const app = Kernel.apps.get(appId as any);
      if (!app) return;
      const sx = 40;
      const sy = 80 + index * 90;
      
      // Icon Circle
      ctx.fillStyle = 'rgba(18, 20, 28, 0.6)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx + 35, sy + 35, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Icon symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(app.icon || '📄', sx + 35, sy + 35);

      // Icon Text label
      ctx.fillStyle = '#edf1f7';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(app.title, sx + 35, sy + 74);
    });

    // 5. Draw Open Windows
    // Get open window frames to render highly-realistic elements
    const wins = Kernel.wm.getWindows ? Kernel.wm.getWindows() : [];
    wins.forEach((win: any) => {
      if (win.appId === 'hotshot') return; // Don't snap hotshot itself if possible
      const wx = win.x || 150;
      const wy = win.y || 120;
      const ww = win.width || 500;
      const wh = win.height || 360;

      // Window drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(wx + 4, wy + 4, ww, wh);

      // Window background card
      ctx.fillStyle = '#12141c';
      ctx.fillRect(wx, wy, ww, wh);

      // Header Bar
      ctx.fillStyle = win.isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(wx, wy, ww, 30);

      // Title
      ctx.fillStyle = win.isActive ? '#6ee7b7' : '#8b93a7';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(win.title || 'Helix Window', wx + 12, wy + 15);

      // Control dots (Traffic lights)
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(wx + ww - 45, wy + 15, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#eab308'; ctx.beginPath(); ctx.arc(wx + ww - 30, wy + 15, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(wx + ww - 15, wy + 15, 4.5, 0, Math.PI * 2); ctx.fill();

      // Inside simulated client viewport content
      ctx.fillStyle = '#080a0f';
      ctx.fillRect(wx + 8, wy + 38, ww - 16, wh - 46);

      ctx.fillStyle = '#6ee7b7';
      ctx.font = '10px monospace';
      ctx.fillText(`$ [alpine@helix]: systemctl status ${win.appId}`, wx + 16, wy + 55);
      
      ctx.fillStyle = '#a6adc8';
      ctx.fillText(`• PID: ${Math.floor(Math.random() * 8000) + 120}`, wx + 16, wy + 72);
      ctx.fillText(`• Virtual RAM: ${(Math.floor(Math.random() * 64) + 16)} MB JIT Allocated`, wx + 16, wy + 88);
      ctx.fillText(`• Interface Hook: connected (x11-pipe)`, wx + 16, wy + 104);
    });

    // 6. Draw System Top Menu Bar
    ctx.fillStyle = 'rgba(18, 20, 28, 0.85)';
    ctx.fillRect(0, 0, drawCanvas.width, 36);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 35, drawCanvas.width, 1);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ HELIX ALPINE', 16, 18);

    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('v6.6-LTS', 135, 18);

    ctx.fillStyle = '#edf1f7';
    ctx.textAlign = 'right';
    ctx.fillText(`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, drawCanvas.width - 16, 18);

    // Turn canvas into active URL snapshot
    const dataUrl = drawCanvas.toDataURL('image/png');
    setActiveImage(dataUrl);

    // Save automatically to history and VFS to make it real and inspectable!
    const ts = new Date().toLocaleTimeString();
    const cleanTsName = new Date().toISOString().replace(/[:.]/g, '-');
    const name = `screenshot_${cleanTsName}.png`;
    const vfsPath = `/home/alpine/Pictures/${name}`;
    
    await Kernel.vfs.write(vfsPath, dataUrl);
    
    const newCap: CaptureHistoryItem = {
      id: vfsPath,
      name,
      timestamp: ts,
      dataUrl,
    };

    setHistory(prev => [newCap, ...prev]);
    Toast.show(`Saved ${vfsPath} to Virtual Storage!`, '📸');
    setIsCapturing(false);
  };

  // Drawing tools handler
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'none' || !canvasRef.current) return;
    isDrawing.current = true;
    drawOnCanvas(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    drawOnCanvas(e);
  };

  const handlePointerUp = () => {
    isDrawing.current = false;
  };

  const drawOnCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (selectedTool === 'draw') {
      ctx.fillStyle = brushColor;
      ctx.beginPath();
      ctx.arc(x, y, brushSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (selectedTool === 'shield') {
      // Sensitve blur / redacted pixel block shield
      ctx.fillStyle = '#000000';
      ctx.fillRect(x - 20, y - 10, 40, 20);
    } else if (selectedTool === 'text') {
      isDrawing.current = false;
      const text = prompt('Enter text annotation:');
      if (text) {
        setAnnotations(prev => [...prev, { x, y, text }]);
      }
    }
  };

  // Export functions
  const handleDownload = () => {
    if (!canvasRef.current) return;
    SoundManager.play('click');
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `helix_hotshot_${Date.now().toString().slice(-4)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    Toast.show('Downloaded snapshot file successfully', '💾');
  };

  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;
    SoundManager.play('click');
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          Toast.show('Screenshot copied to Clipboard buffer!', '📋');
        }
      });
    } catch {
      Toast.show('Clipboard writing not supported inside sandbox context', '⚠️');
    }
  };

  const handleSaveToVfs = async () => {
    if (!canvasRef.current || !activeImage) return;
    SoundManager.play('success');
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const cleanTsName = new Date().toISOString().replace(/[:.]/g, '-');
    const name = `screenshot_annotated_${cleanTsName}.png`;
    const vfsPath = `/home/alpine/Pictures/${name}`;
    await Kernel.vfs.write(vfsPath, dataUrl);
    
    setHistory(prev => [{
      id: vfsPath,
      name,
      timestamp: new Date().toLocaleTimeString(),
      dataUrl,
    }, ...prev]);

    Toast.show(`Saved version to ${vfsPath}`, '💾');
  };

  const clearHistory = () => {
    SoundManager.play('close');
    setHistory([]);
    setActiveImage(null);
    Toast.show('Capture logs cleared', '🗑️');
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-[#0b0c10] text-[#edf1f7] select-none overflow-hidden relative">
      
      {/* Dynamic Screen Capture Shutter Flash Layer */}
      {flashActive && (
        <div className="absolute inset-0 bg-white z-[99999] pointer-events-none animate-out fade-out duration-200" />
      )}

      {/* Interactive Countdown Delay HUD */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75 z-50 pointer-events-none">
          <div className="text-center space-y-4 animate-bounce">
            <div className="text-8xl font-black text-[#6ee7b7] font-mono">{countdown}</div>
            <div className="text-sm font-bold tracking-widest text-white uppercase">Preparing Camera Lens Shutter...</div>
          </div>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="px-4 py-3 bg-[#12141c] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/30">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-xs tracking-wide">Hotshot Pro Capture</h1>
            <p className="text-[10px] text-gray-400 font-mono">Precision Alpine System Snapshot and Annotation Toolkit</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 font-mono text-[10px] text-gray-400">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hotkey: <b className="text-white">Alt + S</b> takes immediate screenshot anywhere</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR: Controls & Tool settings */}
        <div className="w-64 bg-[#12141c]/40 border-r border-white/10 p-4 space-y-5 overflow-y-auto shrink-0">
          
          {/* Action Trigger */}
          <button
            onClick={triggerCaptureAction}
            className="w-full py-2.5 px-4 bg-[#6ee7b7] hover:bg-[#5eead4] text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#6ee7b7]/10 active:scale-95 transition cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Take Hotshot Capture</span>
          </button>

          {/* Capture Selection Area */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">Capture Mode</label>
            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={() => setCaptureMode('screen')}
                className={`py-2 px-3 text-left rounded-xl text-xs flex items-center gap-2.5 border transition cursor-pointer ${
                  captureMode === 'screen' 
                    ? 'bg-[#6ee7b7]/10 border-[#6ee7b7]/40 text-white font-semibold' 
                    : 'bg-transparent border-transparent hover:bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Entire Workspace</span>
              </button>
              <button
                onClick={() => setCaptureMode('window')}
                className={`py-2 px-3 text-left rounded-xl text-xs flex items-center gap-2.5 border transition cursor-pointer ${
                  captureMode === 'window' 
                    ? 'bg-[#6ee7b7]/10 border-[#6ee7b7]/40 text-white font-semibold' 
                    : 'bg-transparent border-transparent hover:bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <AppWindow className="w-3.5 h-3.5" />
                <span>Active Window Only</span>
              </button>
            </div>
          </div>

          {/* Shutter Delay */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">Shutter Countdown</label>
            <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
              {[0, 3, 5].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setDelaySeconds(sec)}
                  className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    delaySeconds === sec 
                      ? 'bg-[#6ee7b7] text-black' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {sec === 0 ? 'Instant' : `${sec}s`}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 space-y-4">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono block">Annotation Pen Colors</label>
            <div className="flex flex-wrap gap-1.5">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setBrushColor(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    brushColor === c.hex ? 'border-white scale-110 shadow-md' : 'border-black/50 hover:scale-105'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Annotation Brush Tools */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">Markup Brushes</label>
            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={() => setSelectedTool('draw')}
                className={`py-1.5 px-3 rounded-lg text-xs flex items-center justify-between border transition cursor-pointer ${
                  selectedTool === 'draw' ? 'bg-white/10 border-[#6ee7b7]/30 text-white' : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Brush className="w-3.5 h-3.5 text-[#6ee7b7]" />
                  <span>Free Draw Brush</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-[#6ee7b7]" />
              </button>

              <button
                onClick={() => setSelectedTool('text')}
                className={`py-1.5 px-3 rounded-lg text-xs flex items-center justify-between border transition cursor-pointer ${
                  selectedTool === 'text' ? 'bg-white/10 border-purple-500/30 text-white' : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Type className="w-3.5 h-3.5 text-purple-400" />
                  <span>Text Label Overlay</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              </button>

              <button
                onClick={() => setSelectedTool('shield')}
                className={`py-1.5 px-3 rounded-lg text-xs flex items-center justify-between border transition cursor-pointer ${
                  selectedTool === 'shield' ? 'bg-white/10 border-red-500/30 text-white' : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-red-400" />
                  <span>Redact Sensitive Info</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              </button>
            </div>
          </div>

          {/* Brush thickness slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-semibold text-gray-400">
              <span>Brush Size</span>
              <span>{brushSize}px</span>
            </div>
            <input
              type="range"
              min={2}
              max={15}
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full accent-[#6ee7b7] cursor-pointer"
            />
          </div>

        </div>

        {/* MAIN PANEL: Active snapshot display & canvas editor */}
        <div className="flex-1 bg-[#07080b] flex flex-col overflow-hidden relative">
          
          {activeImage ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Image Editor Actions */}
              <div className="px-4 py-2 bg-[#12141c]/50 border-b border-white/15 flex items-center justify-between shrink-0">
                <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Interactive Snapshot Frame</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyToClipboard}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleSaveToVfs}
                    className="px-2.5 py-1 rounded-lg bg-[#6ee7b7]/15 hover:bg-[#6ee7b7]/25 text-[#6ee7b7] border border-[#6ee7b7]/30 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Commit edits to persistent storage"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to VFS</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Download raw file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Real interactive Canvas Area */}
              <div className="flex-1 p-6 flex items-center justify-center overflow-auto min-h-0">
                <div className="relative shadow-2xl border border-white/10 rounded-lg overflow-hidden bg-black max-w-full max-h-full">
                  <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className="block cursor-crosshair max-w-full h-auto max-h-[60vh] object-contain"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">No System Capture Loaded</h3>
                <p className="text-xs text-gray-400 max-w-md mt-1.5 leading-relaxed">
                  Trigger an interactive system screenshot using the actions sidebar, or press <b className="text-emerald-400">Alt + S</b> on your physical keyboard to capture instantly!
                </p>
              </div>
            </div>
          )}

          {/* Capture History Slider Bar */}
          <div className="h-32 border-t border-white/10 bg-[#12141c]/40 flex flex-col shrink-0">
            <div className="px-4 py-1.5 bg-[#12141c]/60 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">Recent Capture logs ({history.length})</span>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[9px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Purge Logs</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-x-auto flex gap-3 p-3 items-center min-w-0 custom-scrollbar select-none">
              {history.length === 0 ? (
                <div className="w-full text-center text-[10px] text-gray-500 font-mono py-4">
                  History log list is empty. Snap screenshots to persist them.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      SoundManager.play('click');
                      setActiveImage(item.dataUrl);
                    }}
                    className={`h-20 w-32 border rounded-xl overflow-hidden relative shrink-0 transition duration-150 group cursor-pointer ${
                      activeImage === item.dataUrl
                        ? 'border-[#6ee7b7] shadow-lg shadow-[#6ee7b7]/5 ring-2 ring-[#6ee7b7]/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <img src={item.dataUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                    
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 px-2 py-1 text-[9px] font-mono text-gray-300 flex items-center justify-between truncate">
                      <span className="truncate flex-1 pr-1">{item.name}</span>
                      <span className="text-emerald-400 font-bold shrink-0">{item.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
