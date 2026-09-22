import React from 'react';
import { Kernel } from '../kernel';
import { SoundManager } from '../kernel/SoundManager';

interface SnapLayoutsOverlayProps {
  windowId: string;
  onSelect: () => void;
}

export const SnapLayoutsOverlay: React.FC<SnapLayoutsOverlayProps> = ({ windowId, onSelect }) => {
  const snapTo = (xPct: number, yPct: number, wPct: number, hPct: number) => {
    if (typeof window === 'undefined') return;
    const sw = window.innerWidth;
    const topBarHeight = 36;
    const bottomDockHeight = 60;
    const availableH = window.innerHeight - topBarHeight - bottomDockHeight;

    const x = Math.round(xPct * sw);
    const y = Math.round(topBarHeight + yPct * availableH);
    const width = Math.round(wPct * sw);
    const height = Math.round(hPct * availableH);

    Kernel.wm.updateBounds(windowId, {
      x,
      y,
      width,
      height,
      isMaximized: false,
      isShaded: false
    });

    SoundManager.play('snap');
    onSelect();
  };

  return (
    <div className="absolute top-8 right-0 z-50 p-3 bg-[#0e131f]/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col gap-2.5 animate-scale-in text-gray-200 select-none w-64">
      <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider px-1">
        Windows 11 Snap Layouts
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Layout 1: 50 / 50 Split */}
        <div className="p-1.5 rounded-xl bg-black/40 border border-white/10 flex gap-1 h-14 hover:border-emerald-500/50 transition">
          <button
            onClick={() => snapTo(0, 0, 0.5, 1)}
            className="flex-1 bg-white/10 hover:bg-emerald-500/30 hover:border hover:border-emerald-400/80 rounded-md transition cursor-pointer"
            title="Snap to Left Half"
          />
          <button
            onClick={() => snapTo(0.5, 0, 0.5, 1)}
            className="flex-1 bg-white/10 hover:bg-emerald-500/30 hover:border hover:border-emerald-400/80 rounded-md transition cursor-pointer"
            title="Snap to Right Half"
          />
        </div>

        {/* Layout 2: 65 / 35 Split */}
        <div className="p-1.5 rounded-xl bg-black/40 border border-white/10 flex gap-1 h-14 hover:border-emerald-500/50 transition">
          <button
            onClick={() => snapTo(0, 0, 0.65, 1)}
            className="w-[65%] bg-white/10 hover:bg-emerald-500/30 hover:border hover:border-emerald-400/80 rounded-md transition cursor-pointer"
            title="Snap to Wide Left"
          />
          <button
            onClick={() => snapTo(0.65, 0, 0.35, 1)}
            className="w-[35%] bg-white/10 hover:bg-emerald-500/30 hover:border hover:border-emerald-400/80 rounded-md transition cursor-pointer"
            title="Snap to Narrow Right"
          />
        </div>

        {/* Layout 3: 3-Column Split */}
        <div className="p-1.5 rounded-xl bg-black/40 border border-white/10 flex gap-1 h-14 hover:border-emerald-500/50 transition">
          <button
            onClick={() => snapTo(0, 0, 0.333, 1)}
            className="flex-1 bg-white/10 hover:bg-emerald-500/30 hover:border hover:border-emerald-400/80 rounded-md transition cursor-pointer"
            title="Snap Left 1/3"
          />
          <button
            onClick={() => snapTo(0.333, 0, 0.334, 1)}
            className="flex-1 bg-white/10 hover:bg-emerald-500/30 hover:border hover:border-emerald-400/80 rounded-md transition cursor-pointer"
            title="Snap Center 1/3"
          />
          <button
            onClick={() => snapTo(0.667, 0, 0.333, 1)}
            className="flex-1 bg-white/10 hover:bg-emerald-500/30 hover:border hover:border-emerald-400/80 rounded-md transition cursor-pointer"
            title="Snap Right 1/3"
          />
        </div>

        {/* Layout 4: 4-Quadrant Bento Grid */}
        <div className="p-1.5 rounded-xl bg-black/40 border border-white/10 grid grid-cols-2 grid-rows-2 gap-1 h-14 hover:border-emerald-500/50 transition">
          <button
            onClick={() => snapTo(0, 0, 0.5, 0.5)}
            className="bg-white/10 hover:bg-emerald-500/30 hover:border hover:border-emerald-400/80 rounded-sm transition cursor-pointer"
            title="Top Left"
          />
          <button
            onClick={() => snapTo(0.5, 0, 0.5, 0.5)}
            className="bg-white/10 hover:bg-emerald-500/30 hover:border hover:border-emerald-400/80 rounded-sm transition cursor-pointer"
            title="Top Right"
          />
          <button
            onClick={() => snapTo(0, 0.5, 0.5, 0.5)}
            className="bg-white/10 hover:bg-emerald-500/30 hover:border hover:border-emerald-400/80 rounded-sm transition cursor-pointer"
            title="Bottom Left"
          />
          <button
            onClick={() => snapTo(0.5, 0.5, 0.5, 0.5)}
            className="bg-white/10 hover:bg-emerald-500/30 hover:border hover:border-emerald-400/80 rounded-sm transition cursor-pointer"
            title="Bottom Right"
          />
        </div>
      </div>
    </div>
  );
};
