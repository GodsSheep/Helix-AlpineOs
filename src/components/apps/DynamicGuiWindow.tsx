import React, { useState, useEffect, useRef } from 'react';
import { GuiDisplayServer, GuiWindowDescriptor, GuiWidget, CanvasCommand } from '../../kernel/GuiServer';
import { Toast } from '../../kernel/Toast';
import { Kernel } from '../../kernel';
import { Code, Terminal, Play, RotateCcw, Check, X, AlertTriangle, HelpCircle, Info, FileText } from 'lucide-react';

interface DynamicGuiWindowProps {
  guiId?: string;
  args?: Record<string, unknown>;
}

export const DynamicGuiWindow: React.FC<DynamicGuiWindowProps> = ({ guiId, args }) => {
  const targetId = guiId || (args?.guiId as string) || '';
  const [descriptor, setDescriptor] = useState<GuiWindowDescriptor | undefined>(() =>
    GuiDisplayServer.get().getWindow(targetId)
  );
  const [showLogs, setShowLogs] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsub = GuiDisplayServer.get().subscribe(() => {
      setDescriptor(GuiDisplayServer.get().getWindow(targetId));
    });
    return unsub;
  }, [targetId]);

  // Redraw canvas whenever canvasCommands change
  useEffect(() => {
    if (!descriptor || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset or draw background
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render grid lines for turtle/art canvas
    ctx.strokeStyle = '#ffffff08';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Execute drawing commands
    for (const cmd of descriptor.canvasCommands) {
      if (cmd.type === 'clear') {
        ctx.fillStyle = '#0a0c10';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (cmd.type === 'line' && cmd.x !== undefined && cmd.y !== undefined && cmd.x2 !== undefined && cmd.y2 !== undefined) {
        ctx.strokeStyle = cmd.color || '#6ee7b7';
        ctx.lineWidth = cmd.width || 2;
        ctx.beginPath();
        ctx.moveTo(cmd.x, cmd.y);
        ctx.lineTo(cmd.x2, cmd.y2);
        ctx.stroke();
      } else if (cmd.type === 'circle' && cmd.x !== undefined && cmd.y !== undefined && cmd.radius) {
        ctx.beginPath();
        ctx.arc(cmd.x, cmd.y, cmd.radius, 0, Math.PI * 2);
        if (cmd.fill) {
          ctx.fillStyle = cmd.color || '#6ee7b7';
          ctx.fill();
        } else {
          ctx.strokeStyle = cmd.color || '#6ee7b7';
          ctx.lineWidth = cmd.width || 2;
          ctx.stroke();
        }
      } else if (cmd.type === 'rect' && cmd.x !== undefined && cmd.y !== undefined && cmd.x2 && cmd.y2) {
        if (cmd.fill) {
          ctx.fillStyle = cmd.color || '#6ee7b7';
          ctx.fillRect(cmd.x, cmd.y, cmd.x2, cmd.y2);
        } else {
          ctx.strokeStyle = cmd.color || '#6ee7b7';
          ctx.lineWidth = cmd.width || 2;
          ctx.strokeRect(cmd.x, cmd.y, cmd.x2, cmd.y2);
        }
      }
    }
  }, [descriptor, descriptor?.canvasCommands, descriptor?.lastUpdated]);

  if (!descriptor) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400 select-none">
        <Info className="w-10 h-10 mb-2 text-[#6ee7b7]/60 animate-pulse" />
        <p className="text-sm font-semibold text-white">Connecting to Helix Display Server...</p>
        <p className="text-xs text-gray-500 mt-1">Waiting for window descriptor {targetId}</p>
      </div>
    );
  }

  const handleAction = (widgetId: string) => {
    GuiDisplayServer.get().triggerWidgetAction(descriptor.id, widgetId);
  };

  const handleInputChange = (widgetId: string, value: any) => {
    GuiDisplayServer.get().updateWidgetValue(descriptor.id, widgetId, value);
  };

  const handleSaveCodeToVFS = async () => {
    try {
      const filename = `/root/${descriptor.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.py`;
      await Kernel.vfs.write(filename, descriptor.sourceCode);
      Toast.show(`Saved script to ${filename}`, '💾');
    } catch {
      Toast.show('Failed to write script to VFS', '⚠️');
    }
  };

  // Render Zenity Dialog Mode
  if (descriptor.dialogConfig) {
    const cfg = descriptor.dialogConfig;
    return (
      <div className="flex flex-col h-full bg-[#10131a] text-white p-5 justify-between select-none">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
            {cfg.type === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-400" />}
            {cfg.type === 'error' && <X className="w-6 h-6 text-rose-400" />}
            {cfg.type === 'question' && <HelpCircle className="w-6 h-6 text-sky-400" />}
            {(cfg.type === 'info' || cfg.type === 'entry' || cfg.type === 'progress') && (
              <Info className="w-6 h-6 text-[#6ee7b7]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white mb-1">{cfg.title}</h3>
            <p className="text-xs text-gray-300 leading-relaxed">{cfg.text}</p>

            {cfg.type === 'entry' && (
              <input
                type="text"
                defaultValue={cfg.entryDefault || ''}
                onChange={(e) => handleInputChange('inputVal', e.target.value)}
                className="mt-3 w-full px-3 py-1.5 bg-black/40 border border-white/15 rounded-lg text-xs text-white focus:outline-none focus:border-[#6ee7b7]"
                placeholder="Enter value..."
              />
            )}

            {cfg.type === 'progress' && (
              <div className="mt-3">
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6ee7b7] transition-all duration-300"
                    style={{ width: `${cfg.percentage || 50}%` }}
                  />
                </div>
                <div className="text-[10px] text-gray-400 mt-1 text-right">{cfg.percentage || 50}% Completed</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
          {cfg.type === 'question' ? (
            <>
              <button
                onClick={() => {
                  Toast.show('Dialog dismissed: Response No (Exit code 1)', '❌');
                  GuiDisplayServer.get().closeWindow(descriptor.id);
                }}
                className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition cursor-pointer"
              >
                No
              </button>
              <button
                onClick={() => {
                  Toast.show('Dialog confirmed: Response Yes (Exit code 0)', '✓');
                  GuiDisplayServer.get().closeWindow(descriptor.id);
                }}
                className="px-4 py-1.5 rounded-lg bg-[#6ee7b7] hover:bg-[#5ee1aa] text-xs font-semibold text-black transition cursor-pointer"
              >
                Yes
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                Toast.show('Dialog acknowledged (Exit code 0)', '✓');
                GuiDisplayServer.get().closeWindow(descriptor.id);
              }}
              className="px-4 py-1.5 rounded-lg bg-[#6ee7b7] hover:bg-[#5ee1aa] text-xs font-semibold text-black transition cursor-pointer"
            >
              OK
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render Standard Python / Tkinter / Turtle / PySimpleGUI GUI Window
  const renderWidget = (w: GuiWidget) => {
    const isTouch = descriptor.displayMode === 'mobile-touch';
    const touchHeightClass = isTouch ? 'min-h-[44px] text-sm' : 'text-xs';

    switch (w.type) {
      case 'label':
        return (
          <div
            key={w.id}
            className={`${
              w.variant === 'primary'
                ? 'text-sm sm:text-base font-bold text-[#6ee7b7] pb-1 border-b border-white/10'
                : 'text-xs sm:text-sm text-gray-200'
            }`}
          >
            {w.text}
          </div>
        );

      case 'button':
        return (
          <button
            key={w.id}
            onClick={() => handleAction(w.id)}
            className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${touchHeightClass} ${
              w.variant === 'primary'
                ? 'bg-[#6ee7b7] hover:bg-[#5ee1aa] text-black shadow-md shadow-[#6ee7b7]/10'
                : w.variant === 'danger'
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
          >
            {w.label}
          </button>
        );

      case 'entry':
        return (
          <input
            key={w.id}
            type="text"
            placeholder={w.placeholder || 'Enter text...'}
            value={descriptor.state[w.id] !== undefined ? descriptor.state[w.id] : w.value || ''}
            onChange={(e) => handleInputChange(w.id, e.target.value)}
            className={`w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#6ee7b7] transition ${touchHeightClass}`}
          />
        );

      case 'textarea':
        return (
          <textarea
            key={w.id}
            rows={4}
            placeholder={w.placeholder || 'Enter content...'}
            value={descriptor.state[w.id] !== undefined ? descriptor.state[w.id] : w.value || ''}
            onChange={(e) => handleInputChange(w.id, e.target.value)}
            className="w-full p-3 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#6ee7b7] transition font-mono"
          />
        );

      case 'slider':
        const val = descriptor.state[w.id] !== undefined ? descriptor.state[w.id] : w.value || 50;
        return (
          <div key={w.id} className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-300">
              <span>{w.label}</span>
              <span className="font-mono text-[#6ee7b7] font-semibold">{val}</span>
            </div>
            <input
              type="range"
              min={w.min !== undefined ? w.min : 0}
              max={w.max !== undefined ? w.max : 100}
              step={w.step || 1}
              value={val}
              onChange={(e) => handleInputChange(w.id, Number(e.target.value))}
              className={`w-full accent-[#6ee7b7] cursor-pointer ${isTouch ? 'h-6' : 'h-2'}`}
            />
          </div>
        );

      case 'checkbox':
        const isChecked = Boolean(descriptor.state[w.id]);
        return (
          <label key={w.id} className={`flex items-center gap-2.5 text-xs sm:text-sm text-gray-300 cursor-pointer select-none ${isTouch ? 'py-1' : ''}`}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => handleInputChange(w.id, e.target.checked)}
              className={`rounded accent-[#6ee7b7] cursor-pointer ${isTouch ? 'w-5 h-5' : 'w-4 h-4'}`}
            />
            <span>{w.label}</span>
          </label>
        );

      case 'canvas':
        return (
          <div key={w.id} className="border border-white/15 rounded-2xl overflow-hidden shadow-inner bg-black w-full">
            <canvas ref={canvasRef} width={500} height={280} className="w-full h-auto block" />
          </div>
        );

      case 'webview':
        return (
          <div
            key={w.id}
            className="flex-1 w-full h-full min-h-[260px] border border-white/10 rounded-2xl overflow-auto bg-[#131620] p-4 text-xs"
            dangerouslySetInnerHTML={{ __html: w.text || '<p>Webview ready</p>' }}
          />
        );

      case 'row':
        const rowLayout = descriptor.displayMode === 'mobile-touch' 
          ? 'flex flex-col gap-2.5 w-full'
          : descriptor.displayMode === 'fluid-flow'
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 w-full'
          : 'flex items-center gap-2 flex-wrap';

        return (
          <div key={w.id} className={rowLayout}>
            {w.children?.map((child) => renderWidget(child))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0e1117] text-white select-none overflow-hidden">
      {/* Universal Screen Conversion & Mode Bar */}
      <div className="h-9 px-3 bg-[#141824] border-b border-white/10 flex items-center justify-between text-[11px] text-gray-300 shrink-0 gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          <span className="font-mono text-[#6ee7b7] text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#6ee7b7]/10 border border-[#6ee7b7]/20 uppercase">
            {descriptor.sourceType.replace('python-', '')}
          </span>
          
          <div className="h-3 w-px bg-white/20 mx-0.5" />

          {/* Conversion Modes */}
          <button
            onClick={() => GuiDisplayServer.get().setDisplayMode(descriptor.id, 'auto-fit')}
            className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold transition cursor-pointer flex items-center gap-1 border ${
              descriptor.displayMode === 'auto-fit'
                ? 'bg-[#6ee7b7] text-black border-[#6ee7b7]'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
            }`}
            title="Auto-Scale to fit any screen resolution perfectly"
          >
            <span>📐 Auto-Fit</span>
          </button>

          <button
            onClick={() => GuiDisplayServer.get().setDisplayMode(descriptor.id, 'fluid-flow')}
            className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold transition cursor-pointer flex items-center gap-1 border ${
              descriptor.displayMode === 'fluid-flow'
                ? 'bg-sky-400 text-black border-sky-400'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
            }`}
            title="Convert layout to responsive fluid grid"
          >
            <span>🌊 Fluid Grid</span>
          </button>

          <button
            onClick={() => GuiDisplayServer.get().setDisplayMode(descriptor.id, 'mobile-touch')}
            className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold transition cursor-pointer flex items-center gap-1 border ${
              descriptor.displayMode === 'mobile-touch'
                ? 'bg-amber-400 text-black border-amber-400'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
            }`}
            title="Expand touch targets to 44px min height for mobile / touchscreens"
          >
            <span>📱 Touch Mode</span>
          </button>

          <button
            onClick={() => GuiDisplayServer.get().setDisplayMode(descriptor.id, 'native')}
            className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold transition cursor-pointer flex items-center gap-1 border ${
              descriptor.displayMode === 'native'
                ? 'bg-purple-400 text-black border-purple-400'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
            }`}
            title="Native pixel layout"
          >
            <span>💻 Native</span>
          </button>
        </div>

        {/* Zoom & Code Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-black/40 border border-white/15 rounded-lg text-[10px] font-mono px-1">
            <button
              onClick={() => GuiDisplayServer.get().setScaleRatio(descriptor.id, (descriptor.scaleRatio || 1.0) - 0.1)}
              className="px-1 hover:text-[#6ee7b7] cursor-pointer"
            >
              -
            </button>
            <span className="px-1 text-gray-300">{Math.round((descriptor.scaleRatio || 1.0) * 100)}%</span>
            <button
              onClick={() => GuiDisplayServer.get().setScaleRatio(descriptor.id, (descriptor.scaleRatio || 1.0) + 0.1)}
              className="px-1 hover:text-[#6ee7b7] cursor-pointer"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setShowCode(!showCode)}
            className={`p-1 rounded hover:bg-white/10 transition cursor-pointer flex items-center gap-1 ${
              showCode ? 'text-[#6ee7b7] bg-white/10' : 'text-gray-400'
            }`}
            title="Inspect Source Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowLogs(!showLogs)}
            className={`p-1 rounded hover:bg-white/10 transition cursor-pointer flex items-center gap-1 ${
              showLogs ? 'text-[#6ee7b7] bg-white/10' : 'text-gray-400'
            }`}
            title="View Event Logs"
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Window Body with Dynamic Scaling Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div 
          className="w-full space-y-3 transition-all duration-300"
          style={{
            transform: descriptor.scaleRatio && descriptor.scaleRatio !== 1.0 ? `scale(${descriptor.scaleRatio})` : undefined,
            transformOrigin: 'top left'
          }}
        >
          {descriptor.widgets.map((w) => renderWidget(w))}
        </div>
      </div>

      {/* Event Logs Drawer */}
      {showLogs && (
        <div className="h-28 bg-[#090b0e] border-t border-white/15 p-2 font-mono text-[10px] text-gray-300 overflow-y-auto shrink-0 space-y-0.5">
          <div className="text-[10px] text-gray-500 font-bold mb-1 flex items-center justify-between">
            <span>HELIX-X11 EVENT BUS LOGS</span>
            <button
              onClick={() => GuiDisplayServer.get().triggerWidgetAction(descriptor.id, 'clear_log')}
              className="text-[#6ee7b7] hover:underline"
            >
              Clear
            </button>
          </div>
          {descriptor.logs.length === 0 && <div className="text-gray-600">No events yet.</div>}
          {descriptor.logs.map((l, idx) => (
            <div key={idx} className="leading-tight text-gray-300">
              {l}
            </div>
          ))}
        </div>
      )}

      {/* Source Code Modal / Drawer */}
      {showCode && (
        <div className="absolute inset-0 bg-[#0c0e14]/95 backdrop-blur-md z-50 p-4 flex flex-col text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#6ee7b7]" />
              <span className="font-bold text-white">Source Script ({descriptor.sourceType})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveCodeToVFS}
                className="px-2 py-1 rounded bg-[#6ee7b7]/20 border border-[#6ee7b7]/40 text-[#6ee7b7] text-[10px] font-semibold hover:bg-[#6ee7b7]/30 transition cursor-pointer"
              >
                Save to /root
              </button>
              <button
                onClick={() => setShowCode(false)}
                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <pre className="flex-1 overflow-auto font-mono text-[11px] text-gray-300 p-3 bg-black/50 rounded-lg border border-white/10 select-text">
            {descriptor.sourceCode || '# No source code available'}
          </pre>
        </div>
      )}
    </div>
  );
};
