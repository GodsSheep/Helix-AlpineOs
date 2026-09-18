import React, { useState, useEffect, useRef } from 'react';
import { GuiDisplayServer, GuiWindowDescriptor, DisplayMode } from '../../kernel/GuiServer';
import { PythonEngine } from '../../kernel/PythonEngine';
import { SoundManager } from '../../kernel/SoundManager';
import { Toast } from '../../kernel/Toast';
import { Kernel } from '../../kernel';
import { 
  Play, 
  Terminal, 
  Monitor, 
  Code, 
  Layout, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  Plus, 
  Maximize2, 
  Copy, 
  Check, 
  Trash2, 
  Settings, 
  Sliders, 
  Smartphone, 
  Grid, 
  Cpu, 
  Activity, 
  Zap, 
  Box,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Download,
  Save,
  Share2,
  Package,
  Wand2,
  MousePointer,
  FormInput,
  ToggleLeft,
  Square,
  FileCode,
  HardDrive
} from 'lucide-react';

interface TemplatePreset {
  id: string;
  name: string;
  framework: 'Tkinter' | 'CustomTkinter' | 'PySimpleGUI' | 'PyQt6' | 'Turtle' | 'Pygame' | 'PyWebView' | 'Zenity';
  icon: string;
  filename: string;
  description: string;
  code: string;
}

const TEMPLATES: TemplatePreset[] = [
  {
    id: 'tkinter-calc',
    name: 'Tkinter Scientific Calc',
    framework: 'Tkinter',
    icon: '🧮',
    filename: 'calculator_gui.py',
    description: 'Classic Python Tkinter desktop calculator layout with buttons & inputs',
    code: `import tkinter as tk

root = tk.Tk()
root.title("Alpine Tkinter Scientific Calculator")
root.geometry("420x380")

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

btn_add = tk.Button(root, text="Compute Sum (+)", command=do_add)
btn_reset = tk.Button(root, text="Reset Engine", command="reset")

root.mainloop()`
  },
  {
    id: 'customtkinter-dark',
    name: 'CustomTkinter Dark Suite',
    framework: 'CustomTkinter',
    icon: '✨',
    filename: 'custom_dark.py',
    description: 'Modern high-contrast dark theme CustomTkinter controls',
    code: `import customtkinter as ctk

app = ctk.CTk()
app.title("Helix CustomTkinter Dark Suite")
app.geometry("480x390")

title = ctk.CTkLabel(app, text="CustomTkinter High-Contrast Suite", font=("Roboto", 16, "bold"))
info = ctk.CTkLabel(app, text="Accelerated Virtual X11 Display Server (:0.0)")

slider = ctk.CTkSlider(app, from_=0, to=100, number_of_steps=20)
chk = ctk.CTkCheckBox(app, text="Enable Hardware VirtIO 3D Direct Pipeline")
btn = ctk.CTkButton(app, text="Execute High-Performance Job", fg_color="emerald")

app.mainloop()`
  },
  {
    id: 'pysimplegui-form',
    name: 'PySimpleGUI QuickForm',
    framework: 'PySimpleGUI',
    icon: '📋',
    filename: 'quick_form.py',
    description: 'Declarative layout array with inputs, dropdowns and file dialogs',
    code: `import PySimpleGUI as sg

layout = [
    [sg.Text("PySimpleGUI Rapid Form", font=("Helvetica", 14, "bold"))],
    [sg.Text("Enter Operator Name:"), sg.Input(key="-NAME-")],
    [sg.Text("System Memory Allocation:"), sg.Slider(range=(1, 64), default_value=16, orientation="h")],
    [sg.Checkbox("Enable High-Throughput Async 9P I/O Worker Thread")],
    [sg.Button("Submit Data", button_color="green"), sg.Button("Exit")]
]

window = sg.Window("System Profiler", layout, size=(460, 320))
window.read()`
  },
  {
    id: 'pyqt-dashboard',
    name: 'PyQt6 Performance Dashboard',
    framework: 'PyQt6',
    icon: '⚡',
    filename: 'pyqt_dashboard.py',
    description: 'Qt6 widget tree with progress bars, labels, and action signals',
    code: `from PyQt6.QtWidgets import QApplication, QWidget, QVBoxLayout, QLabel, QPushButton, QProgressBar, QLineEdit

app = QApplication([])
window = QWidget()
window.setWindowTitle("PyQt6 System Performance Metrics")
window.resize(440, 340)

layout = QVBoxLayout()
lbl = QLabel("Qt6 Signal/Slot Event Loop active on X11 :0.0")
lbl.setStyleSheet("font-size: 14px; font-weight: bold; color: #6ee7b7;")

pbar = QProgressBar()
pbar.setValue(85)

inp = QLineEdit()
inp.setPlaceholderText("Filter active processes...")

btn = QPushButton("Refresh Qt6 Render Stack")
btn.setStyleSheet("background-color: #3b82f6; color: white; padding: 6px;")

layout.addWidget(lbl)
layout.addWidget(inp)
layout.addWidget(pbar)
layout.addWidget(btn)

window.setLayout(layout)
window.show()
app.exec()`
  },
  {
    id: 'turtle-spiro',
    name: 'Turtle Vector Spirograph',
    framework: 'Turtle',
    icon: '🐢',
    filename: 'spirograph.py',
    description: 'Interactive Turtle graphics vector drawing canvas',
    code: `import turtle

t = turtle.Turtle()
t.speed(0)

colors = ["#6ee7b7", "#38bdf8", "#a855f7", "#f43f5e"]

for i in range(36):
    t.color(colors[i % 4])
    t.circle(80)
    t.left(10)

turtle.done()`
  },
  {
    id: 'pygame-canvas',
    name: 'Pygame 2D Canvas Engine',
    framework: 'Pygame',
    icon: '🎮',
    filename: 'pygame_render.py',
    description: 'Pygame 2D frame buffer render loop with animation',
    code: `import pygame

pygame.init()
screen = pygame.display.set_mode((480, 320))
pygame.display.set_caption("Pygame 2D Hardware Acceleration Canvas")

running = True
clock = pygame.time.Clock()

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
            
    screen.fill((16, 18, 24))
    pygame.draw.circle(screen, (110, 231, 183), (240, 160), 60)
    pygame.display.flip()
    clock.tick(60)`
  }
];

interface VisualComponent {
  id: string;
  type: 'label' | 'button' | 'entry' | 'slider' | 'checkbox' | 'progress';
  title: string;
  varName: string;
  color?: string;
}

export const UniversalGuiStudioApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'builder' | 'x11' | 'converter' | 'ai' | 'repl'>('editor');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplatePreset>(TEMPLATES[0]);
  const [code, setCode] = useState<string>(TEMPLATES[0].code);
  const [copied, setCopied] = useState(false);
  const [activeWindows, setActiveWindows] = useState<GuiWindowDescriptor[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('auto-fit');
  const [scaleRatio, setScaleRatio] = useState<number>(1.0);
  const [replCode, setReplCode] = useState<string>('import sys, math, random\nprint(f"Python {sys.version}")\nprint(f"Random seed: {random.randint(1000, 9999)}")');
  const [replOutput, setReplOutput] = useState<string | null>(null);

  // Visual Designer Components State
  const [builderFramework, setBuilderFramework] = useState<'Tkinter' | 'CustomTkinter' | 'PySimpleGUI' | 'PyQt6'>('Tkinter');
  const [builderComponents, setBuilderComponents] = useState<VisualComponent[]>([
    { id: '1', type: 'label', title: 'System Diagnostics & Control Panel', varName: 'lbl_title', color: '#6ee7b7' },
    { id: '2', type: 'entry', title: 'Enter query parameters...', varName: 'ent_query' },
    { id: '3', type: 'slider', title: 'Power Level Allocation', varName: 'sld_power' },
    { id: '4', type: 'checkbox', title: 'Enable Hardware Acceleration', varName: 'chk_accel' },
    { id: '5', type: 'button', title: 'Execute Automated Workflow', varName: 'btn_exec', color: '#3b82f6' },
  ]);

  // AI Prompt Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  useEffect(() => {
    const unsub = GuiDisplayServer.get().subscribe(wins => {
      setActiveWindows(wins);
    });
    setActiveWindows(GuiDisplayServer.get().getAllWindows());
    return unsub;
  }, []);

  const handleSelectTemplate = (tpl: TemplatePreset) => {
    SoundManager.play('click');
    setSelectedTemplate(tpl);
    setCode(tpl.code);
    Toast.show(`Loaded ${tpl.name} template`, 'info');
  };

  const handleRunGui = () => {
    SoundManager.play('open');
    try {
      const res = GuiDisplayServer.get().parseAndLaunchPython(code, selectedTemplate.filename);
      if (!res.success) {
        Toast.show(`GUI Runtime Error in script`, 'error');
      } else {
        Toast.show(`Launched ${selectedTemplate.framework} GUI window on X11 :0.0`, 'success');
      }
    } catch (err: any) {
      Toast.show(`Execution Error: ${err.message}`, 'error');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    SoundManager.play('click');
    setCopied(true);
    Toast.show('Code copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunRepl = () => {
    SoundManager.play('click');
    const res = PythonEngine.execute(replCode);
    setReplOutput(res.stdout + (res.stderr ? `\n[ERR] ${res.stderr}` : ''));
  };

  const handleSaveToVfs = () => {
    SoundManager.play('click');
    const fname = selectedTemplate.filename || 'gui_script.py';
    Kernel.vfs.write(`/${fname}`, code);
    Toast.show(`Saved script to VFS /${fname}`, 'success');
  };

  const handleDownloadPy = () => {
    SoundManager.play('click');
    const blob = new Blob([code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedTemplate.filename || 'gui_app.py';
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('Downloaded Python script', 'info');
  };

  const handleAddDesktopShortcut = () => {
    SoundManager.play('click');
    const title = selectedTemplate.name;
    const fname = selectedTemplate.filename;
    Kernel.vfs.write(`/${fname}`, code);
    Kernel.apps.addApp({
      id: `custom-${selectedTemplate.id}-${Date.now().toString().slice(-4)}` as any,
      title,
      icon: selectedTemplate.icon,
      category: 'Development',
      description: `Python ${selectedTemplate.framework} app: ${selectedTemplate.description}`,
      width: 580,
      height: 440,
      pinnedToDock: true,
    });
    Toast.show(`Added "${title}" shortcut to Desktop & Start Menu!`, 'success');
  };

  // Generate Python Code from Visual Builder
  const handleGenerateFromBuilder = () => {
    SoundManager.play('click');
    let generated = '';

    if (builderFramework === 'Tkinter') {
      generated = `import tkinter as tk\n\nroot = tk.Tk()\nroot.title("Visual Generated GUI - Tkinter")\nroot.geometry("460x400")\n\n`;
      builderComponents.forEach((comp, idx) => {
        if (comp.type === 'label') {
          generated += `${comp.varName} = tk.Label(root, text="${comp.title}", font=("Arial", 12, "bold"))\n${comp.varName}.pack(pady=8)\n\n`;
        } else if (comp.type === 'entry') {
          generated += `${comp.varName} = tk.Entry(root, width=35)\n${comp.varName}.pack(pady=6)\n\n`;
        } else if (comp.type === 'button') {
          generated += `def action_${idx}():\n    print("Clicked ${comp.title}")\n\n${comp.varName} = tk.Button(root, text="${comp.title}", command=action_${idx}, bg="${comp.color || '#3b82f6'}")\n${comp.varName}.pack(pady=8)\n\n`;
        } else if (comp.type === 'slider') {
          generated += `${comp.varName} = tk.Scale(root, from_=0, to=100, orient="horizontal", label="${comp.title}")\n${comp.varName}.pack(pady=6)\n\n`;
        } else if (comp.type === 'checkbox') {
          generated += `${comp.varName} = tk.Checkbutton(root, text="${comp.title}")\n${comp.varName}.pack(pady=6)\n\n`;
        }
      });
      generated += `root.mainloop()`;
    } else if (builderFramework === 'CustomTkinter') {
      generated = `import customtkinter as ctk\n\napp = ctk.CTk()\napp.title("Visual Generated CustomTkinter")\napp.geometry("480x420")\n\n`;
      builderComponents.forEach((comp) => {
        if (comp.type === 'label') {
          generated += `${comp.varName} = ctk.CTkLabel(app, text="${comp.title}", font=("Roboto", 14, "bold"))\n${comp.varName}.pack(pady=8)\n\n`;
        } else if (comp.type === 'entry') {
          generated += `${comp.varName} = ctk.CTkEntry(app, placeholder_text="${comp.title}", width=320)\n${comp.varName}.pack(pady=6)\n\n`;
        } else if (comp.type === 'button') {
          generated += `${comp.varName} = ctk.CTkButton(app, text="${comp.title}", fg_color="emerald")\n${comp.varName}.pack(pady=8)\n\n`;
        } else if (comp.type === 'slider') {
          generated += `${comp.varName} = ctk.CTkSlider(app, from_=0, to=100)\n${comp.varName}.pack(pady=6)\n\n`;
        } else if (comp.type === 'checkbox') {
          generated += `${comp.varName} = ctk.CTkCheckBox(app, text="${comp.title}")\n${comp.varName}.pack(pady=6)\n\n`;
        }
      });
      generated += `app.mainloop()`;
    } else if (builderFramework === 'PySimpleGUI') {
      generated = `import PySimpleGUI as sg\n\nlayout = [\n`;
      builderComponents.forEach((comp) => {
        if (comp.type === 'label') generated += `    [sg.Text("${comp.title}", font=("Helvetica", 12, "bold"))],\n`;
        else if (comp.type === 'entry') generated += `    [sg.Text("${comp.title}"), sg.Input(key="-INPUT-")],\n`;
        else if (comp.type === 'button') generated += `    [sg.Button("${comp.title}", button_color="green")],\n`;
        else if (comp.type === 'slider') generated += `    [sg.Text("${comp.title}"), sg.Slider(range=(0,100), orientation="h")],\n`;
        else if (comp.type === 'checkbox') generated += `    [sg.Checkbox("${comp.title}")],\n`;
      });
      generated += `]\n\nwindow = sg.Window("PySimpleGUI Layout", layout, size=(460, 360))\nwindow.read()`;
    } else {
      generated = `from PyQt6.QtWidgets import QApplication, QWidget, QVBoxLayout, QLabel, QPushButton, QLineEdit, QSlider\n\napp = QApplication([])\nwindow = QWidget()\nwindow.setWindowTitle("PyQt6 Visual Layout")\nlayout = QVBoxLayout()\n\n`;
      builderComponents.forEach((comp) => {
        if (comp.type === 'label') generated += `layout.addWidget(QLabel("${comp.title}"))\n`;
        else if (comp.type === 'entry') generated += `layout.addWidget(QLineEdit("${comp.title}"))\n`;
        else if (comp.type === 'button') generated += `layout.addWidget(QPushButton("${comp.title}"))\n`;
        else if (comp.type === 'slider') generated += `layout.addWidget(QSlider())\n`;
      });
      generated += `\nwindow.setLayout(layout)\nwindow.show()\napp.exec()`;
    }

    setCode(generated);
    setActiveTab('editor');
    Toast.show('Generated Python code from visual builder!', 'success');
  };

  const addBuilderComponent = (type: VisualComponent['type']) => {
    SoundManager.play('click');
    const count = builderComponents.length + 1;
    let newComp: VisualComponent = {
      id: Date.now().toString(),
      type,
      title: type === 'button' ? `Button #${count}` : type === 'label' ? `Header Label #${count}` : `Input field #${count}`,
      varName: `${type}_${count}`
    };
    setBuilderComponents([...builderComponents, newComp]);
  };

  const removeBuilderComponent = (id: string) => {
    SoundManager.play('click');
    setBuilderComponents(builderComponents.filter(c => c.id !== id));
  };

  // AI Prompt Recipe Generator
  const handleGenerateAiApp = (promptText: string) => {
    setIsAiGenerating(true);
    SoundManager.play('click');
    setTimeout(() => {
      let generatedCode = '';
      if (promptText.toLowerCase().includes('calculator')) {
        generatedCode = TEMPLATES[0].code;
      } else if (promptText.toLowerCase().includes('game') || promptText.toLowerCase().includes('snake')) {
        generatedCode = `import pygame, random\npygame.init()\nscreen = pygame.display.set_mode((480, 360))\npygame.display.set_caption("Python 2D Snake Game")\nprint("Game initialized on X11 Display Server!")`;
      } else {
        generatedCode = `import customtkinter as ctk\n\napp = ctk.CTk()\napp.title("AI Generated: ${promptText.slice(0, 30)}")\napp.geometry("480x380")\n\ntitle = ctk.CTkLabel(app, text="${promptText.slice(0, 40)}", font=("Roboto", 14, "bold"))\ntitle.pack(pady=12)\n\nbtn = ctk.CTkButton(app, text="Execute Primary Action", fg_color="emerald")\nbtn.pack(pady=8)\n\napp.mainloop()`;
      }
      setCode(generatedCode);
      setIsAiGenerating(false);
      setActiveTab('editor');
      Toast.show('AI generated custom Python GUI code!', 'success');
    }, 600);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0d12] text-gray-100 font-sans select-none overflow-hidden">
      {/* Top Studio Bar */}
      <div className="px-4 py-2 bg-[#121520] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-black font-black shadow-lg">
            ✨
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide font-mono flex items-center gap-2">
              <span>Universal Helix GUI Studio & X11 Engine</span>
              <span className="px-2 py-0.5 text-[9px] rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-extrabold">v4.0 PERFECT</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-mono">CPython 3.12 • Virtual X11 (:0.0) • Visual Designer • PySimpleGUI • PyQt6</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/10 rounded-xl">
          <button
            onClick={() => { SoundManager.play('click'); setActiveTab('editor'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Code Studio</span>
          </button>

          <button
            onClick={() => { SoundManager.play('click'); setActiveTab('builder'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'builder'
                ? 'bg-emerald-400 text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Visual Builder</span>
          </button>

          <button
            onClick={() => { SoundManager.play('click'); setActiveTab('x11'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer relative ${
              activeTab === 'x11'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>X11 Monitor</span>
            {activeWindows.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => { SoundManager.play('click'); setActiveTab('converter'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'converter'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Screen Adapter</span>
          </button>

          <button
            onClick={() => { SoundManager.play('click'); setActiveTab('ai'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-sky-400 text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => { SoundManager.play('click'); setActiveTab('repl'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'repl'
                ? 'bg-rose-400 text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>CLI REPL</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-3 relative">
        {/* TAB 1: Code Studio & Templates */}
        {activeTab === 'editor' && (
          <div className="h-full flex flex-col md:flex-row gap-3">
            {/* Sidebar: Framework Presets */}
            <div className="w-full md:w-64 bg-[#121520] border border-white/10 rounded-2xl p-3 flex flex-col shadow-xl shrink-0 overflow-y-auto">
              <h2 className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-cyan-400" />
                <span>GUI Framework Presets</span>
              </h2>

              <div className="space-y-1.5 flex-1">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                      selectedTemplate.id === tpl.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg'
                        : 'bg-black/30 border-white/5 text-gray-300 hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <span className="text-xl shrink-0">{tpl.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs truncate flex items-center justify-between">
                        <span>{tpl.name}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">{tpl.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Export & Actions */}
              <div className="pt-3 border-t border-white/10 mt-3 space-y-1.5">
                <button
                  onClick={handleSaveToVfs}
                  className="w-full py-1.5 px-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-200 flex items-center gap-2 transition cursor-pointer"
                >
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Save to VFS (/mnt/helix)</span>
                </button>

                <button
                  onClick={handleDownloadPy}
                  className="w-full py-1.5 px-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-200 flex items-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download .py Script</span>
                </button>

                <button
                  onClick={handleAddDesktopShortcut}
                  className="w-full py-1.5 px-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-200 flex items-center gap-2 transition cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pin to Desktop / Start Menu</span>
                </button>
              </div>
            </div>

            {/* Code Editor Panel */}
            <div className="flex-1 bg-[#121520] border border-white/10 rounded-2xl p-3.5 flex flex-col shadow-2xl overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-cyan-400 font-bold">{selectedTemplate.filename}</span>
                  <span className="text-gray-500">•</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10 text-[10px]">
                    {selectedTemplate.framework}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-gray-300 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleRunGui}
                    className="px-4 py-1.5 bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-extrabold rounded-xl flex items-center gap-1.5 hover:brightness-110 shadow-lg shadow-emerald-500/20 transition cursor-pointer text-xs"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run GUI on X11 (:0.0)</span>
                  </button>
                </div>
              </div>

              {/* Code Editor Textarea */}
              <div className="flex-1 relative font-mono text-xs">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-full p-3 bg-black/80 border border-white/10 rounded-xl text-emerald-300 font-mono text-xs focus:outline-none focus:border-cyan-400 transition resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Visual Drag & Drop Builder */}
        {activeTab === 'builder' && (
          <div className="h-full flex flex-col md:flex-row gap-3">
            {/* Component Palette */}
            <div className="w-full md:w-64 bg-[#121520] border border-white/10 rounded-2xl p-3.5 flex flex-col shadow-xl shrink-0">
              <h3 className="font-bold text-xs text-emerald-400 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MousePointer className="w-3.5 h-3.5" />
                <span>Component Toolbox</span>
              </h3>

              <div className="space-y-1.5 flex-1">
                <button
                  onClick={() => addBuilderComponent('label')}
                  className="w-full p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs text-left font-semibold text-gray-200 flex items-center gap-2 cursor-pointer transition"
                >
                  <FormInput className="w-4 h-4 text-cyan-400" />
                  <span>Add Header / Text Label</span>
                </button>

                <button
                  onClick={() => addBuilderComponent('entry')}
                  className="w-full p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs text-left font-semibold text-gray-200 flex items-center gap-2 cursor-pointer transition"
                >
                  <FormInput className="w-4 h-4 text-emerald-400" />
                  <span>Add Text Entry / Input Box</span>
                </button>

                <button
                  onClick={() => addBuilderComponent('button')}
                  className="w-full p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs text-left font-semibold text-gray-200 flex items-center gap-2 cursor-pointer transition"
                >
                  <Square className="w-4 h-4 text-blue-400" />
                  <span>Add Action Button</span>
                </button>

                <button
                  onClick={() => addBuilderComponent('slider')}
                  className="w-full p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs text-left font-semibold text-gray-200 flex items-center gap-2 cursor-pointer transition"
                >
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Add Range Slider</span>
                </button>

                <button
                  onClick={() => addBuilderComponent('checkbox')}
                  className="w-full p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs text-left font-semibold text-gray-200 flex items-center gap-2 cursor-pointer transition"
                >
                  <ToggleLeft className="w-4 h-4 text-purple-400" />
                  <span>Add Checkbox Toggle</span>
                </button>
              </div>

              {/* Target Framework Switcher */}
              <div className="pt-3 border-t border-white/10 mt-3 space-y-2">
                <label className="text-[10px] text-gray-400 font-mono block">Export Target Framework:</label>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                  {(['Tkinter', 'CustomTkinter', 'PySimpleGUI', 'PyQt6'] as const).map((fw) => (
                    <button
                      key={fw}
                      onClick={() => setBuilderFramework(fw)}
                      className={`py-1 px-2 rounded-lg border text-center transition cursor-pointer ${
                        builderFramework === fw
                          ? 'bg-emerald-500 text-black font-extrabold border-emerald-400'
                          : 'bg-black/30 border-white/10 text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {fw}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerateFromBuilder}
                  className="w-full py-2 bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-black text-xs rounded-xl shadow-lg hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileCode className="w-4 h-4" />
                  <span>Generate Python Code</span>
                </button>
              </div>
            </div>

            {/* Visual Canvas Viewport */}
            <div className="flex-1 bg-[#121520] border border-white/10 rounded-2xl p-4 flex flex-col shadow-2xl overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold font-mono text-cyan-300 flex items-center gap-1.5">
                  <Layout className="w-4 h-4" />
                  <span>Live Visual Stage ({builderFramework})</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">{builderComponents.length} components placed</span>
              </div>

              {/* Visual Drag-and-Drop Form Container */}
              <div className="w-full max-w-lg mx-auto bg-[#181b28] border border-white/20 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="text-center pb-3 border-b border-white/10">
                  <h3 className="font-bold text-sm text-white font-mono">Generated GUI App Title</h3>
                  <p className="text-[10px] text-gray-400 font-mono">Interactive Form Stage</p>
                </div>

                {builderComponents.map((comp) => (
                  <div key={comp.id} className="p-3 bg-black/40 border border-white/10 rounded-xl relative group flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {comp.type === 'label' && (
                        <p className="font-bold text-sm text-emerald-300 truncate">{comp.title}</p>
                      )}
                      {comp.type === 'entry' && (
                        <input
                          type="text"
                          readOnly
                          value=""
                          placeholder={comp.title}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-gray-300 outline-none"
                        />
                      )}
                      {comp.type === 'button' && (
                        <button className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow">
                          {comp.title}
                        </button>
                      )}
                      {comp.type === 'slider' && (
                        <div>
                          <p className="text-[10px] text-gray-400 mb-1">{comp.title}</p>
                          <input type="range" readOnly className="w-full accent-cyan-400 h-1.5" />
                        </div>
                      )}
                      {comp.type === 'checkbox' && (
                        <label className="flex items-center gap-2 text-xs text-gray-200">
                          <input type="checkbox" readOnly defaultChecked className="accent-emerald-400" />
                          <span>{comp.title}</span>
                        </label>
                      )}
                    </div>

                    <button
                      onClick={() => removeBuilderComponent(comp.id)}
                      className="text-gray-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition p-1 cursor-pointer"
                      title="Remove component"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: X11 Monitor */}
        {activeTab === 'x11' && (
          <div className="space-y-4 overflow-y-auto h-full">
            <div className="p-4 bg-[#121520] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
              <div>
                <h2 className="font-bold text-sm text-purple-400 mb-1 flex items-center gap-2 font-mono">
                  <Monitor className="w-4 h-4 text-purple-400" />
                  <span>Virtual X11 Display Server Inspector (:0.0)</span>
                </h2>
                <p className="text-xs text-gray-300">
                  Real-time client process tree, active window descriptors, frame rates and IPC message stream.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  ● X11 RUNNING (60 FPS)
                </span>
              </div>
            </div>

            {/* Active Window Table */}
            <div className="bg-[#121520] border border-white/10 rounded-2xl p-4 shadow-xl">
              <h3 className="font-bold text-xs text-gray-300 font-mono mb-3">Active X11 Windows ({activeWindows.length})</h3>

              {activeWindows.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs italic border border-dashed border-white/10 rounded-xl">
                  No active Python GUI windows running on X11 :0.0. Go to Code Studio and click "Run GUI on X11"!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 text-[10px]">
                        <th className="p-2">WINDOW ID</th>
                        <th className="p-2">TITLE</th>
                        <th className="p-2">FRAMEWORK</th>
                        <th className="p-2">GEOMETRY</th>
                        <th className="p-2">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeWindows.map((win) => (
                        <tr key={win.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-2 font-bold text-purple-400">{win.id}</td>
                          <td className="p-2 text-white">{win.title}</td>
                          <td className="p-2 text-cyan-300">{win.sourceType}</td>
                          <td className="p-2 text-gray-400">{win.width}x{win.height}</td>
                          <td className="p-2">
                            <button
                              onClick={() => {
                                SoundManager.play('click');
                                GuiDisplayServer.get().closeWindow(win.id);
                                Toast.show(`Closed window ${win.title}`, 'info');
                              }}
                              className="px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-500 hover:text-black transition cursor-pointer text-[10px]"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Screen Adapter */}
        {activeTab === 'converter' && (
          <div className="space-y-4 overflow-y-auto h-full">
            <div className="p-4 bg-[#121520] border border-white/10 rounded-2xl">
              <h2 className="font-bold text-sm text-cyan-400 mb-1 flex items-center gap-2 font-mono">
                <Layout className="w-4 h-4 text-cyan-400" />
                <span>Universal Display Mode & Screen Adapter Engine</span>
              </h2>
              <p className="text-xs text-gray-300">
                Configures default scaling rules for Python GUI client windows across various display densities and screen resolutions:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => { SoundManager.play('click'); setDisplayMode('auto-fit'); }}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  displayMode === 'auto-fit'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-xl'
                    : 'bg-[#121520] border-white/10 text-gray-400 hover:bg-white/5'
                }`}
              >
                <div>
                  <div className="font-bold text-sm mb-1 font-mono">📐 Auto-Fit Screen</div>
                  <div className="text-[11px] opacity-80">Scales containers & canvas aspect ratios to fit window viewport without clipping.</div>
                </div>
                <div className="mt-3 text-[10px] font-mono font-bold text-cyan-400">● DEFAULT MODE</div>
              </button>

              <button
                onClick={() => { SoundManager.play('click'); setDisplayMode('fluid-flow'); }}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  displayMode === 'fluid-flow'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-xl'
                    : 'bg-[#121520] border-white/10 text-gray-400 hover:bg-white/5'
                }`}
              >
                <div>
                  <div className="font-bold text-sm mb-1 font-mono">🌊 Fluid Grid</div>
                  <div className="text-[11px] opacity-80">Converts inline horizontal rows into CSS grid columns with responsive reflow.</div>
                </div>
                <div className="mt-3 text-[10px] font-mono font-bold text-sky-400">SELECT MODE</div>
              </button>

              <button
                onClick={() => { SoundManager.play('click'); setDisplayMode('mobile-touch'); }}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  displayMode === 'mobile-touch'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-xl'
                    : 'bg-[#121520] border-white/10 text-gray-400 hover:bg-white/5'
                }`}
              >
                <div>
                  <div className="font-bold text-sm mb-1 font-mono">📱 Mobile Touch</div>
                  <div className="text-[11px] opacity-80">Enforces 44px min tap targets for buttons, inputs, and sliders on touchscreens.</div>
                </div>
                <div className="mt-3 text-[10px] font-mono font-bold text-amber-400">SELECT MODE</div>
              </button>

              <button
                onClick={() => { SoundManager.play('click'); setDisplayMode('native'); }}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  displayMode === 'native'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-xl'
                    : 'bg-[#121520] border-white/10 text-gray-400 hover:bg-white/5'
                }`}
              >
                <div>
                  <div className="font-bold text-sm mb-1 font-mono">💻 Native Geometry</div>
                  <div className="text-[11px] opacity-80">Renders exact fixed pixel width/height specified in original Python code.</div>
                </div>
                <div className="mt-3 text-[10px] font-mono font-bold text-purple-400">SELECT MODE</div>
              </button>
            </div>

            {/* Scale Ratio Controller */}
            <div className="p-4 bg-[#121520] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="font-bold text-sm text-white font-mono">Global Viewport Scale Ratio ({Math.round(scaleRatio * 100)}%)</div>
                <div className="text-xs text-gray-400">Adjust scaling factor for high-DPI displays or small screens</div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-64">
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={scaleRatio}
                  onChange={(e) => setScaleRatio(parseFloat(e.target.value))}
                  className="flex-1 accent-cyan-400 cursor-pointer h-2"
                />
                <span className="font-mono text-cyan-300 font-bold">{Math.round(scaleRatio * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AI Prompt Assistant */}
        {activeTab === 'ai' && (
          <div className="space-y-4 overflow-y-auto h-full">
            <div className="p-4 bg-[#121520] border border-white/10 rounded-2xl shadow-xl">
              <h2 className="font-bold text-sm text-sky-400 mb-1 flex items-center gap-2 font-mono">
                <Wand2 className="w-4 h-4 text-sky-400" />
                <span>AI Python GUI Code Generator & Recipe Studio</span>
              </h2>
              <p className="text-xs text-gray-300 mb-3">
                Select a pre-built recipe or type a natural language prompt to generate complete working Python GUI scripts:
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Build a scientific calculator with dark theme..."
                  className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white outline-none focus:border-sky-400"
                />
                <button
                  onClick={() => handleGenerateAiApp(aiPrompt || 'Calculator')}
                  disabled={isAiGenerating}
                  className="px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:brightness-110 transition disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiGenerating ? 'Generating...' : 'Generate App'}</span>
                </button>
              </div>
            </div>

            {/* Prompt Recipes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { title: '🧮 Scientific Calculator', prompt: 'Tkinter Scientific Calculator' },
                { title: '📊 System Dashboard', prompt: 'CustomTkinter System Performance Dashboard' },
                { title: '🎮 2D Snake Arcade Game', prompt: 'Pygame 2D Arcade Snake Game' },
                { title: '📋 Rapid Survey Form', prompt: 'PySimpleGUI Rapid Input Form' },
                { title: '📝 Markdown Notepad', prompt: 'PyQt6 Text Editor & File Reader' },
                { title: '🐢 Turtle Spirograph', prompt: 'Turtle Graphics Animated Spirograph' }
              ].map((rec) => (
                <button
                  key={rec.title}
                  onClick={() => handleGenerateAiApp(rec.prompt)}
                  className="p-3.5 bg-[#121520] border border-white/10 hover:border-sky-400/50 rounded-2xl text-left transition cursor-pointer hover:bg-white/5"
                >
                  <h3 className="font-bold text-xs text-white mb-1 font-mono">{rec.title}</h3>
                  <p className="text-[11px] text-gray-400">Instantly generate complete code preset</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: Python REPL */}
        {activeTab === 'repl' && (
          <div className="h-full flex flex-col md:flex-row gap-3">
            <div className="flex-1 bg-[#121520] border border-white/10 rounded-2xl p-3.5 flex flex-col shadow-xl">
              <div className="flex justify-between items-center mb-2 font-mono text-xs">
                <span className="text-purple-400 font-bold flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  <span>Python 3.12 CLI REPL Editor</span>
                </span>
                <button
                  onClick={handleRunRepl}
                  className="px-4 py-1.5 bg-purple-400 text-black font-extrabold rounded-xl flex items-center gap-1.5 hover:bg-purple-300 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Script</span>
                </button>
              </div>

              <textarea
                value={replCode}
                onChange={(e) => setReplCode(e.target.value)}
                className="flex-1 w-full min-h-[220px] p-3 bg-black/80 border border-white/10 rounded-xl font-mono text-xs text-emerald-300 focus:outline-none focus:border-purple-400 transition resize-none"
              />
            </div>

            <div className="w-full md:w-80 bg-[#121520] border border-white/10 rounded-2xl p-3.5 flex flex-col shadow-xl">
              <span className="text-emerald-400 font-bold font-mono text-xs mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Standard Console Output (stdout)</span>
              </span>
              <div className="flex-1 bg-black/80 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-gray-200 overflow-y-auto whitespace-pre-wrap min-h-[160px]">
                {replOutput !== null ? replOutput : <span className="text-gray-500 italic">Click "Execute Script" to evaluate Python standard library code...</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
