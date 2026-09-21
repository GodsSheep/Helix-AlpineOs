import React, { useState, useEffect, useRef } from 'react';
import { Toast } from '../../kernel/Toast';
import { SoundManager } from '../../kernel/SoundManager';
import { 
  Gamepad2, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Layers, 
  Sparkles, 
  Grid, 
  Sliders, 
  Download, 
  Upload, 
  Code2, 
  Zap, 
  ChevronRight,
  Music,
  Activity,
  CheckCircle2,
  Share2,
  Volume2
} from 'lucide-react';

interface ScriptNode {
  id: string;
  type: 'event' | 'action' | 'condition' | 'variable';
  title: string;
  trigger: string;
  action: string;
  x: number;
  y: number;
}

interface GameObject {
  id: string;
  name: string;
  type: 'player' | 'platform' | 'coin' | 'enemy' | 'goal';
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  color: string;
  collected?: boolean;
}

export const VisualGameEngineApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'nodes' | 'playtest' | 'templates'>('playtest');
  const [isPlaying, setIsPlaying] = useState(true);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedTool, setSelectedTool] = useState<'player' | 'platform' | 'coin' | 'enemy' | 'goal'>('coin');
  const [gameTheme, setGameTheme] = useState<'cyber' | 'retro' | 'dungeon'>('cyber');

  // Canvas ref for 2D Playtest
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Script Nodes
  const [nodes, setNodes] = useState<ScriptNode[]>([
    { id: 'n1', type: 'event', title: 'On Key Press (Arrow Keys)', trigger: 'Key: Left / Right', action: 'Move Player (X +/- 4)', x: 40, y: 50 },
    { id: 'n2', type: 'event', title: 'On Key Press (Space / Up)', trigger: 'Key: Space', action: 'Player Jump (VY = -10)', x: 40, y: 160 },
    { id: 'n3', type: 'condition', title: 'On Collision (Player ➔ Coin)', trigger: 'Hit: Coin', action: 'Score + 10 & Play Sound', x: 280, y: 50 },
    { id: 'n4', type: 'condition', title: 'On Collision (Player ➔ Enemy)', trigger: 'Hit: Enemy', action: 'Lives - 1 & Reset Pos', x: 280, y: 160 },
    { id: 'n5', type: 'action', title: 'On Win (Player ➔ Goal)', trigger: 'Hit: Goal Portal', action: 'Show Victory Banner', x: 500, y: 100 },
  ]);

  // Game World Objects
  const [gameObjects, setGameObjects] = useState<GameObject[]>([
    { id: 'player', name: 'Player Hero', type: 'player', x: 50, y: 280, width: 24, height: 24, vx: 0, vy: 0, color: '#38bdf8' },
    { id: 'floor', name: 'Ground Floor', type: 'platform', x: 0, y: 340, width: 600, height: 40, vx: 0, vy: 0, color: '#334155' },
    { id: 'plat1', name: 'Platform 1', type: 'platform', x: 120, y: 260, width: 100, height: 16, vx: 0, vy: 0, color: '#475569' },
    { id: 'plat2', name: 'Platform 2', type: 'platform', x: 280, y: 200, width: 110, height: 16, vx: 0, vy: 0, color: '#475569' },
    { id: 'plat3', name: 'Platform 3', type: 'platform', x: 440, y: 140, width: 90, height: 16, vx: 0, vy: 0, color: '#475569' },
    { id: 'c1', name: 'Coin 1', type: 'coin', x: 160, y: 220, width: 16, height: 16, vx: 0, vy: 0, color: '#facc15' },
    { id: 'c2', name: 'Coin 2', type: 'coin', x: 330, y: 160, width: 16, height: 16, vx: 0, vy: 0, color: '#facc15' },
    { id: 'c3', name: 'Coin 3', type: 'coin', x: 480, y: 100, width: 16, height: 16, vx: 0, vy: 0, color: '#facc15' },
    { id: 'e1', name: 'Patrol Drone', type: 'enemy', x: 220, y: 316, width: 24, height: 24, vx: 1.5, vy: 0, color: '#f43f5e' },
    { id: 'goal', name: 'Warp Gate', type: 'goal', x: 520, y: 90, width: 30, height: 45, vx: 0, vy: 0, color: '#10b981' },
  ]);

  // Keys state for game physics
  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 60fps Game Loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (canvasRef.current && isPlaying) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // 1. Clear background
          ctx.fillStyle = gameTheme === 'cyber' ? '#0b0f19' : gameTheme === 'retro' ? '#18181b' : '#090d16';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Grid pattern
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.lineWidth = 1;
          for (let x = 0; x < canvas.width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          for (let y = 0; y < canvas.height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }

          // 2. Update player physics
          const player = gameObjects.find((o) => o.id === 'player');
          if (player) {
            // Horizontal move
            if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) player.vx = -3.5;
            else if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) player.vx = 3.5;
            else player.vx *= 0.8;

            // Jump
            if ((keysRef.current['Space'] || keysRef.current['ArrowUp'] || keysRef.current['KeyW']) && Math.abs(player.vy) < 0.2) {
              player.vy = -9.5;
              SoundManager.play('click');
            }

            // Gravity
            player.vy += 0.45;
            player.x += player.vx;
            player.y += player.vy;

            // Bound checks
            if (player.x < 0) player.x = 0;
            if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;

            // Platform collisions
            gameObjects
              .filter((o) => o.type === 'platform')
              .forEach((p) => {
                if (
                  player.x + player.width > p.x &&
                  player.x < p.x + p.width &&
                  player.y + player.height > p.y &&
                  player.y + player.height - player.vy <= p.y + 10
                ) {
                  player.y = p.y - player.height;
                  player.vy = 0;
                }
              });

            // Enemy movement & collision
            gameObjects
              .filter((o) => o.type === 'enemy')
              .forEach((e) => {
                e.x += e.vx;
                if (e.x > 380 || e.x < 180) e.vx *= -1;

                // Hit player
                if (
                  player.x + player.width > e.x &&
                  player.x < e.x + e.width &&
                  player.y + player.height > e.y &&
                  player.y < e.y + e.height
                ) {
                  setLives((l) => {
                    const next = l - 1;
                    if (next <= 0) {
                      Toast.show('Game Over! Restarting level...', '💀');
                      return 3;
                    }
                    Toast.show('Hit enemy drone! Lives remaining: ' + next, '⚠️');
                    return next;
                  });
                  player.x = 50;
                  player.y = 280;
                  player.vy = 0;
                  SoundManager.play('trash');
                }
              });

            // Coin collection
            gameObjects
              .filter((o) => o.type === 'coin' && !o.collected)
              .forEach((c) => {
                if (
                  player.x + player.width > c.x &&
                  player.x < c.x + c.width &&
                  player.y + player.height > c.y &&
                  player.y < c.y + c.height
                ) {
                  c.collected = true;
                  setScore((s) => s + 10);
                  SoundManager.play('success');
                  Toast.show('+10 Points: Diamond Collected!', '💎');
                }
              });

            // Goal detection
            const goal = gameObjects.find((o) => o.id === 'goal');
            if (
              goal &&
              player.x + player.width > goal.x &&
              player.x < goal.x + goal.width &&
              player.y + player.height > goal.y &&
              player.y < goal.y + goal.height
            ) {
              SoundManager.play('success');
              Toast.show('🎉 Level Completed! You Won!', '🏆');
              player.x = 50;
              player.y = 280;
            }
          }

          // 3. Render Game Objects
          gameObjects.forEach((obj) => {
            if (obj.collected) return;
            ctx.fillStyle = obj.color;

            if (obj.type === 'player') {
              // Glowing Hero Box
              ctx.shadowColor = '#38bdf8';
              ctx.shadowBlur = 10;
              ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
              ctx.shadowBlur = 0;

              // Eyes
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(obj.x + 14, obj.y + 6, 4, 6);
            } else if (obj.type === 'coin') {
              // Shiny Diamond Coin
              ctx.beginPath();
              ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, 0, Math.PI * 2);
              ctx.fill();
            } else if (obj.type === 'goal') {
              // Neon Portal
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 3;
              ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
              ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
              ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            } else {
              ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            }
          });
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, gameObjects, gameTheme]);

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setGameObjects((prev) =>
      prev.map((o) => {
        if (o.id === 'player') return { ...o, x: 50, y: 280, vx: 0, vy: 0 };
        if (o.type === 'coin') return { ...o, collected: false };
        return o;
      })
    );
    SoundManager.play('click');
    Toast.show('Game reset to initial state', '🔄');
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'editor') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = Math.floor(e.clientX - rect.left);
    const clickY = Math.floor(e.clientY - rect.top);

    const newObj: GameObject = {
      id: `obj-${Date.now()}`,
      name: `${selectedTool.toUpperCase()} Node`,
      type: selectedTool,
      x: clickX - 10,
      y: clickY - 10,
      width: selectedTool === 'platform' ? 80 : 20,
      height: selectedTool === 'platform' ? 14 : 20,
      vx: 0,
      vy: 0,
      color:
        selectedTool === 'coin'
          ? '#facc15'
          : selectedTool === 'enemy'
          ? '#f43f5e'
          : selectedTool === 'platform'
          ? '#475569'
          : '#38bdf8'
    };

    setGameObjects((prev) => [...prev, newObj]);
    SoundManager.play('click');
    Toast.show(`Placed ${selectedTool} at (${clickX}, ${clickY})`, '📍');
  };

  return (
    <div className="h-full flex flex-col bg-[#080b11] text-gray-200 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#0d111a] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              Visual Game Engine (No-Code Studio)
              <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-mono border border-pink-500/30">
                2D Physics & Visual Scripting
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Create 2D platformers, arcade games, and puzzles with drag-and-drop visual logic nodes.
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Resume'}</span>
          </button>
          <button
            onClick={resetGame}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 px-4 pt-2 bg-[#0b0f17] border-b border-white/10 overflow-x-auto shrink-0">
        {[
          { id: 'playtest', label: 'Playtest Canvas', icon: <Play className="w-3.5 h-3.5" /> },
          { id: 'nodes', label: 'Visual Scripting Nodes', icon: <Zap className="w-3.5 h-3.5" /> },
          { id: 'editor', label: 'Level Object Placer', icon: <Grid className="w-3.5 h-3.5" /> },
          { id: 'templates', label: 'Game Presets', icon: <Sparkles className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              SoundManager.play('click');
            }}
            className={`px-3 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#121824] text-white border-t-2 border-pink-500 border-x border-white/10 shadow'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#080b11] flex flex-col">
        {/* Playtest / Level Canvas */}
        {(activeTab === 'playtest' || activeTab === 'editor') && (
          <div className="flex flex-col items-center justify-center space-y-3">
            {/* HUD Status Bar */}
            <div className="w-full max-w-[600px] flex items-center justify-between p-3 rounded-2xl bg-[#101522] border border-white/10 font-mono text-xs">
              <div className="flex items-center gap-4">
                <span className="text-yellow-400 font-bold flex items-center gap-1.5">
                  💎 Score: {score}
                </span>
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  ❤️ Lives: {lives}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Controls: WASD / Arrow Keys + Space</span>
              </div>
            </div>

            {/* Level Editor Toolbar */}
            {activeTab === 'editor' && (
              <div className="w-full max-w-[600px] flex items-center justify-between p-2 rounded-2xl bg-[#101522] border border-white/10 text-xs">
                <span className="text-gray-400 font-mono pl-2">Click to place:</span>
                <div className="flex items-center gap-1.5">
                  {(['coin', 'platform', 'enemy'] as const).map((tool) => (
                    <button
                      key={tool}
                      onClick={() => setSelectedTool(tool)}
                      className={`px-3 py-1 rounded-xl font-bold uppercase transition cursor-pointer ${
                        selectedTool === tool ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* The 2D Stage Canvas */}
            <div className="rounded-2xl border border-white/15 overflow-hidden shadow-2xl bg-black">
              <canvas
                ref={canvasRef}
                width={600}
                height={380}
                onClick={handleCanvasClick}
                className="cursor-crosshair block"
              />
            </div>
          </div>
        )}

        {/* Visual Scripting Nodes */}
        {activeTab === 'nodes' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#101522] border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-pink-400" />
                  Visual Event & Action Flowchart
                </h3>
                <p className="text-xs text-gray-400">
                  Wired triggers execute 2D physics, animation responses, and audio without compiling code.
                </p>
              </div>

              <button
                onClick={() => {
                  const newNode: ScriptNode = {
                    id: `n-${Date.now()}`,
                    type: 'action',
                    title: 'Custom Action Trigger',
                    trigger: 'Event: Custom Collision',
                    action: 'Spawn Particle FX & Add Score',
                    x: 100,
                    y: 100
                  };
                  setNodes((n) => [...n, newNode]);
                  SoundManager.play('click');
                  Toast.show('Added new visual logic node', '⚡');
                }}
                className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Node</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-2.5 relative group hover:border-pink-500/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono text-[10px] font-bold border border-pink-500/30">
                      {node.type.toUpperCase()}
                    </span>
                    <button
                      onClick={() => setNodes((n) => n.filter((x) => x.id !== node.id))}
                      className="text-gray-500 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-bold text-xs text-white">{node.title}</h4>

                  <div className="space-y-1 font-mono text-[11px] bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <div className="text-cyan-400">INPUT: {node.trigger}</div>
                    <div className="text-emerald-400">OUTPUT: {node.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Templates */}
        {activeTab === 'templates' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: 'Cyber Jump Platformer', desc: 'Precision platforming with moving hazard drones and glowing collectables.' },
                { title: 'Asteroid Defender', desc: 'Space shooter mechanics with 360 degree projectile physics and debris.' },
                { title: 'Dungeon Rogue Explorer', desc: 'Top-down maze exploration with keys, doors, and trapped corridors.' },
              ].map((tmpl, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#101522] border border-white/10 space-y-2 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-white mb-1">{tmpl.title}</h4>
                    <p className="text-xs text-gray-400">{tmpl.desc}</p>
                  </div>

                  <button
                    onClick={() => {
                      resetGame();
                      SoundManager.play('success');
                      Toast.show(`Loaded ${tmpl.title} template!`, '🎮');
                      setActiveTab('playtest');
                    }}
                    className="mt-3 w-full py-1.5 bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white rounded-xl text-xs font-bold transition border border-pink-500/30 cursor-pointer"
                  >
                    Load Preset
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
