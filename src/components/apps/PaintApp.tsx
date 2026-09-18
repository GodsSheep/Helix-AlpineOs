import React, { useRef, useState, useEffect } from 'react';
import { Toast } from '../../kernel/Toast';
import { Kernel } from '../../kernel';
import { Palette, Brush, Eraser, Square, Circle, Minus, RotateCcw, RotateCw, Download, Save, Trash2, Pipette } from 'lucide-react';

export const PaintApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<'pencil' | 'brush' | 'eraser' | 'line' | 'rect' | 'circle'>('brush');
  const [color, setColor] = useState('#6ee7b7');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white/light canvas background by default
    ctx.fillStyle = '#161822';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(0, historyIdx + 1), data]);
    setHistoryIdx((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIdx <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const targetIdx = historyIdx - 1;
    ctx.putImageData(history[targetIdx], 0, 0);
    setHistoryIdx(targetIdx);
  };

  const handleRedo = () => {
    if (historyIdx >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const targetIdx = historyIdx + 1;
    ctx.putImageData(history[targetIdx], 0, 0);
    setHistoryIdx(targetIdx);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getTouchCoords = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
  };

  const startDrawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getTouchCoords(e);
    setIsDrawing(true);
    setStartPos(coords);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = tool === 'eraser' ? '#161822' : color;
      ctx.lineWidth = tool === 'pencil' ? 1 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getTouchCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawTouch = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveState();
    setStartPos(null);
  };

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `helix_artwork_${Date.now()}.png`;
      a.click();
      Toast.show('Downloaded artwork PNG', '📥');
    } catch {
      Toast.show('Export error', '⚠️');
    }
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = tool === 'eraser' ? '#161822' : color;
      ctx.lineWidth = tool === 'pencil' ? 1 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas || !startPos) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.stroke();
    } else if (tool === 'rect') {
      ctx.beginPath();
      ctx.rect(startPos.x, startPos.y, coords.x - startPos.x, coords.y - startPos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.stroke();
    } else if (tool === 'circle') {
      const radius = Math.hypot(coords.x - startPos.x, coords.y - startPos.y);
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.stroke();
    }

    saveState();
    setStartPos(null);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#161822';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
    Toast.show('Canvas cleared', '🧹');
  };

  const handleSaveToVFS = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      await Kernel.vfs.write('/root/drawing.png', dataUrl);
      Toast.show('Saved image to /root/drawing.png', '💾');
    } catch {
      Toast.show('Failed saving drawing to VFS', '⚠️');
    }
  };

  const PALETTE = [
    '#6ee7b7', '#3b82f6', '#ec4899', '#f59e0b', '#10b981',
    '#8b5cf6', '#ef4444', '#ffffff', '#9ca3af', '#000000',
  ];

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-sans select-none overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141724] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-pink-400" />
          <span className="font-semibold text-sm">Pixel & Vector Studio</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-400">
            KolourPaint / Pinta
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleUndo} disabled={historyIdx <= 0} className="p-1 hover:text-white disabled:opacity-30">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleRedo} disabled={historyIdx >= history.length - 1} className="p-1 hover:text-white disabled:opacity-30">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownloadPNG}
            className="p-1 hover:text-cyan-400"
            title="Download PNG to Computer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-white/10" />
          <button onClick={handleClear} className="p-1 hover:text-rose-400" title="Clear Canvas">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSaveToVFS}
            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded flex items-center gap-1.5 font-medium transition"
          >
            <Save className="w-3 h-3" />
            <span>Save to /root</span>
          </button>
        </div>
      </div>

      {/* Tools & Settings Ribbon */}
      <div className="px-3 py-2 bg-[#10121d] border-b border-white/10 flex items-center justify-between gap-4 shrink-0 flex-wrap">
        {/* Tool selectors */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setTool('brush')}
            className={`p-1.5 rounded transition ${tool === 'brush' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
            title="Smooth Brush"
          >
            <Brush className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('pencil')}
            className={`p-1.5 rounded transition ${tool === 'pencil' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
            title="Precision Pencil"
          >
            <span className="text-xs">✏️</span>
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded transition ${tool === 'eraser' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
            title="Eraser"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('line')}
            className={`p-1.5 rounded transition ${tool === 'line' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
            title="Line Tool"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('rect')}
            className={`p-1.5 rounded transition ${tool === 'rect' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
            title="Rectangle"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-1.5 rounded transition ${tool === 'circle' ? 'bg-emerald-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
            title="Ellipse / Circle"
          >
            <Circle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Brush Size Slider */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-[11px] font-mono">Size: {brushSize}px</span>
          <input
            type="range"
            min="1"
            max="32"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
            className="w-24 accent-emerald-400"
          />
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-5 h-5 rounded-full border transition ${
                color === c ? 'border-white scale-110 shadow' : 'border-transparent hover:scale-105'
              }`}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
          />
        </div>
      </div>

      {/* Drawing Canvas Area */}
      <div className="flex-1 overflow-auto bg-[#07080c] p-4 flex items-center justify-center touch-none">
        <canvas
          ref={canvasRef}
          width={800}
          height={550}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDrawTouch}
          onTouchMove={drawTouch}
          onTouchEnd={stopDrawTouch}
          className="border border-white/15 rounded-lg shadow-2xl bg-[#161822] cursor-crosshair max-w-full"
        />
      </div>
    </div>
  );
};
