import React, { useState, useEffect } from 'react';
import { GuiDisplayServer, GuiWindowDescriptor } from '../../kernel/GuiServer';
import { Toast } from '../../kernel/Toast';
import { Kernel } from '../../kernel';
import { 
  Play, 
  Terminal as TermIcon, 
  Save, 
  Copy, 
  Trash2, 
  Layers, 
  Monitor, 
  Check, 
  ExternalLink,
  Settings,
  Sparkles,
  RefreshCw,
  Box
} from 'lucide-react';

interface GuiTemplate {
  id: string;
  name: string;
  category: 'Tkinter' | 'Turtle' | 'PySimpleGUI' | 'WebGUI' | 'Zenity';
  filename: string;
  icon: string;
  code: string;
}

const TEMPLATES: GuiTemplate[] = [
  {
    id: 'calc',
    name: 'Tkinter Calculator',
    category: 'Tkinter',
    filename: 'calculator_gui.py',
    icon: '🧮',
    code: `import tkinter as tk

root = tk.Tk()
root.title("Tkinter Scientific Calculator")
root.geometry("400x380")

lbl_title = tk.Label(root, text="Alpine GNU bc & Tkinter Calc", font=("Arial", 14, "bold"))
lbl_res = tk.Label(root, text="Result: 0", font=("Arial", 12))

ent_a = tk.Entry(root, placeholder="Enter first number...")
ent_b = tk.Entry(root, placeholder="Enter second number...")

def do_add():
    try:
        val = float(ent_a.get()) + float(ent_b.get())
        lbl_res.config(text=f"Result: {val}")
    except:
        lbl_res.config(text="Error")

btn_add = tk.Button(root, text="Compute (+)", command=do_add)
btn_reset = tk.Button(root, text="Reset", command="reset")

root.mainloop()`
  },
  {
    id: 'monitor',
    name: 'System Telemetry GUI',
    category: 'Tkinter',
    filename: 'sys_monitor.py',
    icon: '📊',
    code: `import tkinter as tk
import os

root = tk.Tk()
root.title("Alpine Linux Hardware & Telemetry")
root.geometry("460x360")

header = tk.Label(root, text="Helix OS Realtime Hardware Monitor", font=("Arial", 14, "bold"))
cpu_lbl = tk.Label(root, text="CPU: Intel(R) Core(TM) Architecture (2.40 GHz)")
mem_lbl = tk.Label(root, text="RAM: 47MiB / 256MiB (Alpine Guest)")
uptime_lbl = tk.Label(root, text="Host: Linux helix-debian 6.6.14-virt")

slider_fan = tk.Scale(root, from_=20, to=100, label="Fan Speed RPM (%)")
chk_turbo = tk.Checkbutton(root, text="Enable JIT Turbo Governor")

btn_refresh = tk.Button(root, text="Refresh Telemetry", command="refresh")

root.mainloop()`
  },
  {
    id: 'turtle',
    name: 'Turtle Spirograph Art',
    category: 'Turtle',
    filename: 'turtle_spirograph.py',
    icon: '🐢',
    code: `import turtle

t = turtle.Turtle()
turtle.title("Helix Turtle Spirograph Studio")
t.speed(0)
t.width(2)

# Generate geometric algorithmic geometry
for i in range(36):
    t.color("#6ee7b7" if i % 2 == 0 else "#38bdf8")
    t.circle(70)
    t.right(10)

turtle.done()`
  },
  {
    id: 'tasks',
    name: 'Task & Notes Planner',
    category: 'Tkinter',
    filename: 'task_planner.py',
    icon: '📝',
    code: `import tkinter as tk

root = tk.Tk()
root.title("Helix Task & Workspace Planner")
root.geometry("440x360")

title = tk.Label(root, text="Alpine Daily Tasks & Notes", font=("Arial", 14, "bold"))
status = tk.Label(root, text="Status: 3 active workspace tasks")

task1 = tk.Checkbutton(root, text="Compile Linux Kernel modules")
task2 = tk.Checkbutton(root, text="Review Netfilter iptables rules")
task3 = tk.Checkbutton(root, text="Execute automated test suite")

new_task = tk.Entry(root, placeholder="Type a new task to add...")
btn_add = tk.Button(root, text="Add Task (+)", command="add")

root.mainloop()`
  },
  {
    id: 'synth',
    name: 'Cyberpunk Audio Synth',
    category: 'Tkinter',
    filename: 'audio_synth.py',
    icon: '🎛️',
    code: `import tkinter as tk

root = tk.Tk()
root.title("ALSA Audio Frequency Synthesizer")
root.geometry("450x380")

lbl = tk.Label(root, text="Web Audio Sine Oscillator (440Hz)", font=("Arial", 14, "bold"))
freq = tk.Scale(root, from_=100, to=2000, label="Frequency (Hz)")
vol = tk.Scale(root, from_=0, to=100, label="Master Gain (%)")

chk_filter = tk.Checkbutton(root, text="Enable Lowpass Biquad Filter (12dB)")

btn_play = tk.Button(root, text="Play Tone", command="play_audio")
btn_stop = tk.Button(root, text="Stop Audio", command="stop_audio")

root.mainloop()`
  },
  {
    id: 'form',
    name: 'PySimpleGUI User Form',
    category: 'PySimpleGUI',
    filename: 'user_registration.py',
    icon: '📋',
    code: `import PySimpleGUI as psg

layout = [
    [psg.Text("Alpine Developer Registration", font=("Arial", 14, "bold"))],
    [psg.Text("Username:"), psg.Input(key="user", placeholder="e.g. root")],
    [psg.Text("SSH Key Type:"), psg.Input(key="key", placeholder="ed25519 or rsa-4096")],
    [psg.Text("Disk Allocation (GB):"), psg.Slider(range=(1, 50), default_value=10)],
    [psg.Checkbox("Enable OpenSSH Daemon on boot", key="ssh", default=True)],
    [psg.Button("Register & Provision", key="submit")]
]

window = psg.Window("Alpine User Provisioning", layout)
window.read()`
  },
  {
    id: 'webview',
    name: 'PyWebView Dashboard',
    category: 'WebGUI',
    filename: 'webview_dashboard.py',
    icon: '🌐',
    code: `import webview

html = """
<div style="font-family: sans-serif; color: #f8fafc; padding: 20px; background: #0f172a; border-radius: 12px;">
  <h2 style="color: #38bdf8; margin-top: 0;">Helix WebGUI Dashboard</h2>
  <p>Rendered natively via the Python PyWebView client on Helix DE.</p>
  <div style="display: flex; gap: 10px; margin: 15px 0;">
    <div style="background: #1e293b; padding: 15px; border-radius: 8px; flex: 1;">
      <div style="font-size: 11px; color: #94a3b8;">STORAGE</div>
      <div style="font-size: 18px; font-weight: bold; color: #34d399;">1.8 GB FREE</div>
    </div>
    <div style="background: #1e293b; padding: 15px; border-radius: 8px; flex: 1;">
      <div style="font-size: 11px; color: #94a3b8;">X11 SOCKET</div>
      <div style="font-size: 18px; font-weight: bold; color: #38bdf8;">/tmp/.X11-unix</div>
    </div>
  </div>
  <button style="background: #38bdf8; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; color: #000;" onclick="alert('PyWebView RPC Triggered')">Test RPC</button>
</div>
"""

webview.create_window("Alpine WebGUI Portal", html=html)`
  },
  {
    id: 'zenity',
    name: 'Zenity Dialog Suite',
    category: 'Zenity',
    filename: 'zenity_showcase.sh',
    icon: '💬',
    code: `#!/bin/sh
# Helix OS Zenity Shell Script Showcase

# 1. Information dialog
zenity --info --title="Kernel Notification" --text="System integrity check passed."

# 2. User Input Entry prompt
HOSTNAME=$(zenity --entry --title="Host Setup" --text="Enter new virtual hostname:" --entry-text="alpine-node-01")

# 3. Confirmation Question
zenity --question --title="Reboot Required" --text="Apply configuration and restart daemon?"

# 4. Progress bar
zenity --progress --title="Syncing VFS" --text="Writing virtual filesystem..." --percentage=85`
  }
];

export const GuiRunnerApp: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<GuiTemplate>(TEMPLATES[0]);
  const [code, setCode] = useState<string>(TEMPLATES[0].code);
  const [filename, setFilename] = useState<string>(TEMPLATES[0].filename);
  const [activeWindows, setActiveWindows] = useState<GuiWindowDescriptor[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `[Helix-X11] Server listening on ${GuiDisplayServer.get().displayId}`,
    `[Helix-X11] Protocol: ${GuiDisplayServer.get().protocolVersion}`,
    `[Helix-X11] Supported runtimes: Python Tkinter, Turtle, PySimpleGUI, WebGUI, Zenity`,
    'Ready for GUI execution.'
  ]);

  useEffect(() => {
    const unsub = GuiDisplayServer.get().subscribe((wins) => {
      setActiveWindows(wins);
    });
    return unsub;
  }, []);

  const handleSelectTemplate = (tmpl: GuiTemplate) => {
    setSelectedTemplate(tmpl);
    setCode(tmpl.code);
    setFilename(tmpl.filename);
  };

  const handleLaunchGui = () => {
    if (selectedTemplate.category === 'Zenity' || filename.endsWith('.sh')) {
      // Execute shell script with Zenity
      const lines = code.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('zenity ')) {
          const args = trimmed.replace(/^zenity\s+/, '').split(/\s+/);
          GuiDisplayServer.get().launchZenityDialog(args);
        }
      }
      setConsoleLogs((prev) => [
        `[SHELL] Executed Zenity script '${filename}' -> Window dispatched to Helix DE`,
        ...prev
      ]);
      Toast.show(`Executed Zenity dialogs in Helix DE`, '💬');
    } else {
      // Execute Python GUI
      const result = GuiDisplayServer.get().parseAndLaunchPython(code, filename);
      setConsoleLogs((prev) => [
        `[PYTHON] Launched '${filename}' (Window ID: ${result.windowId})`,
        ...result.logs,
        ...prev
      ]);
      Toast.show(`Launched ${filename} in Helix DE!`, '🚀');
    }
  };

  const handleSaveToVFS = async () => {
    try {
      await Kernel.vfs.write(`/mnt/helix/${filename}`, code);
      Toast.show(`Saved ${filename} to /mnt/helix/`, '💾');
      setConsoleLogs((prev) => [`[VFS] Saved script to /mnt/helix/${filename}`, ...prev]);
    } catch {
      Toast.show('Failed writing script to VFS', '⚠️');
    }
  };

  const handleRunInTerminal = async () => {
    await handleSaveToVFS();
    Kernel.wm.launch('term');
    setTimeout(() => {
      Kernel.vm.broadcastTerminal(`\npython3 /mnt/helix/${filename}\n`);
      Kernel.vm.executeCommand(`python3 /mnt/helix/${filename}`);
    }, 400);
    Toast.show(`Running python3 /mnt/helix/${filename} in Terminal`, '🖥️');
  };

  const handleCloseClient = (id: string) => {
    GuiDisplayServer.get().closeWindow(id);
    Toast.show(`Closed GUI client window ${id}`, '🧹');
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0e14] text-white select-none">
      {/* Top Telemetry & Status Bar */}
      <div className="h-12 px-4 bg-[#12141c] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6ee7b7]/10 border border-[#6ee7b7]/30 flex items-center justify-center text-[#6ee7b7]">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              Helix GUI Studio & X11 Server
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                DISPLAY=:0.0 ONLINE
              </span>
            </div>
            <div className="text-[10px] text-gray-400">
              Protocol: {GuiDisplayServer.get().protocolVersion} • Active Windows: {activeWindows.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLaunchGui}
            className="px-3.5 py-1.5 rounded-lg bg-[#6ee7b7] hover:bg-[#5ee1aa] text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#6ee7b7]/20 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Launch GUI in Helix DE
          </button>

          <button
            onClick={handleRunInTerminal}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            title="Execute script directly in Terminal shell"
          >
            <TermIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shell</span>
          </button>

          <button
            onClick={handleSaveToVFS}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white transition cursor-pointer"
            title="Save script to VFS disk"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Templates & Active Windows */}
        <div className="w-60 bg-[#0f1118] border-r border-white/10 flex flex-col shrink-0">
          <div className="p-3 border-b border-white/10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              GUI Starter Apps ({TEMPLATES.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className={`w-full text-left px-2.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2.5 ${
                  selectedTemplate.id === tmpl.id
                    ? 'bg-[#6ee7b7]/15 border border-[#6ee7b7]/30 text-white shadow-sm'
                    : 'hover:bg-white/5 text-gray-400 hover:text-gray-200 border border-transparent'
                }`}
              >
                <span className="text-base shrink-0">{tmpl.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{tmpl.name}</div>
                  <div className="text-[10px] text-gray-500 font-mono truncate">{tmpl.category}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Active Client Windows Monitor */}
          <div className="p-3 border-t border-white/10 bg-[#0c0e14]">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#6ee7b7]" />
                Active Clients ({activeWindows.length})
              </span>
            </div>

            {activeWindows.length === 0 ? (
              <div className="text-[10px] text-gray-500 py-1">No active GUI windows</div>
            ) : (
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {activeWindows.map((win) => (
                  <div
                    key={win.id}
                    className="flex items-center justify-between px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px]"
                  >
                    <span className="truncate flex-1 mr-1 text-gray-300 font-medium">
                      {win.icon} {win.title}
                    </span>
                    <button
                      onClick={() => handleCloseClient(win.id)}
                      className="text-gray-400 hover:text-rose-400 transition"
                      title="Terminate client"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Live Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#090b0e]">
          <div className="h-9 px-4 bg-[#11131b] border-b border-white/10 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="font-mono text-white text-xs">{filename}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400 font-mono">
                {selectedTemplate.category}
              </span>
            </div>
            <div className="text-[10px] text-gray-500">
              Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-gray-300">Launch</kbd> to view in Helix DE
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex">
            {/* Line Numbers */}
            <div className="w-10 bg-[#0a0c10] py-3 text-right pr-2 select-none font-mono text-[11px] text-gray-600 border-r border-white/5 space-y-1">
              {code.split('\n').map((_, idx) => (
                <div key={idx} className="leading-tight">
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 p-3 bg-transparent text-gray-200 font-mono text-xs leading-tight resize-none focus:outline-none focus:ring-0 select-text"
            />
          </div>

          {/* Bottom Console Log Drawer */}
          <div className="h-28 bg-[#0a0c10] border-t border-white/10 p-2.5 font-mono text-[11px] text-gray-300 overflow-y-auto shrink-0 space-y-0.5">
            <div className="text-[10px] text-gray-500 font-bold mb-1 flex items-center justify-between">
              <span>X11 / DISPLAY SERVER CONSOLE OUTPUT</span>
              <button
                onClick={() => setConsoleLogs(['Display server cleared.'])}
                className="text-[#6ee7b7] hover:underline"
              >
                Clear
              </button>
            </div>
            {consoleLogs.map((log, idx) => (
              <div key={idx} className="text-gray-300 leading-tight">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
