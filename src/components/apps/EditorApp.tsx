import React, { useState, useEffect, useRef } from 'react';
import { Kernel, VFSFile } from '../../kernel';
import { GuiDisplayServer } from '../../kernel/GuiServer';
import { Toast } from '../../kernel/Toast';
import { 
  Play, 
  Save, 
  FileText, 
  Terminal, 
  Plus, 
  Folder, 
  X, 
  Download, 
  Check, 
  Code2, 
  FileCode,
  Sparkles,
  Sidebar,
  ZoomIn,
  ZoomOut,
  WrapText,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  Monitor,
  Briefcase
} from 'lucide-react';

export const EditorApp: React.FC<{ initialFile?: string }> = ({ initialFile }) => {
  const [activeFile, setActiveFile] = useState<string>(initialFile || '/hello.py');
  const [openTabs, setOpenTabs] = useState<string[]>([initialFile || '/hello.py']);
  const [content, setContent] = useState('');
  const [availableFiles, setAvailableFiles] = useState<VFSFile[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isSaved, setIsSaved] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [execDurationMs, setExecDurationMs] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState(13);
  const [wordWrap, setWordWrap] = useState(false);
  const [languageMode, setLanguageMode] = useState<string>('python');

  // In-app modal for creating new file
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFileNameInput, setNewFileNameInput] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const detectLanguage = (path: string) => {
    if (path.endsWith('.py')) return 'python';
    if (path.endsWith('.js') || path.endsWith('.ts')) return 'javascript';
    if (path.endsWith('.sh') || path.endsWith('.bash')) return 'shell';
    if (path.endsWith('.c') || path.endsWith('.cpp')) return 'c_cpp';
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.md')) return 'markdown';
    return 'text';
  };

  const loadFiles = async () => {
    const list = await Kernel.vfs.list();
    setAvailableFiles(list);
  };

  const loadFileContent = async (path: string) => {
    const data = await Kernel.vfs.read(path);
    if (data !== null) {
      setContent(data);
    } else {
      setContent('# New file in Helix OS\n');
    }
    setLanguageMode(detectLanguage(path));
    setIsSaved(true);
  };

  useEffect(() => {
    loadFiles();
    loadFileContent(activeFile);
    
    const unsubList = Kernel.vfs.subscribe(() => {
      loadFiles();
    });

    const unsubWatch = Kernel.vfs.watchPath(activeFile, (newContent) => {
      if (newContent !== null) {
        setContent(newContent);
        setIsSaved(true);
      }
    });

    return () => {
      unsubList();
      unsubWatch();
    };
  }, [activeFile]);

  useEffect(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [activeFile, content]);

  const handleSwitchTab = async (path: string) => {
    if (!isSaved && activeFile) {
      await Kernel.vfs.write(activeFile, content);
    }
    setActiveFile(path);
    if (!openTabs.includes(path)) {
      setOpenTabs((prev) => [...prev, path]);
    }
    await loadFileContent(path);
  };

  const handleCloseTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openTabs.filter((t) => t !== path);
    setOpenTabs(remaining);
    if (activeFile === path && remaining.length > 0) {
      handleSwitchTab(remaining[remaining.length - 1]);
    }
  };

  const handleSave = async () => {
    if (!activeFile) return;
    await Kernel.vfs.write(activeFile, content);
    setIsSaved(true);
  };

  const handleRun = async () => {
    setIsRunning(true);
    const start = performance.now();
    setOutput('Executing process on Alpine Linux Guest...');
    await handleSave();

    const normPath = activeFile.startsWith('/') ? activeFile : `/${activeFile}`;
    let cmd = 'sh ';
    if (activeFile.endsWith('.py')) {
      cmd = 'python3 ';
    } else if (activeFile.endsWith('.js')) {
      cmd = 'node ';
    } else if (activeFile.endsWith('.sh')) {
      cmd = 'sh ';
    } else if (activeFile.endsWith('.c') || activeFile.endsWith('.cpp')) {
      cmd = 'gcc ';
    }

    try {
      const res = await Kernel.vm.executeCommand(`${cmd}/mnt/helix${normPath}`);
      const duration = Math.round(performance.now() - start);
      setExecDurationMs(duration);
      setOutput(res || 'Process exited successfully with code 0 (no stdout).');
    } catch (e: unknown) {
      const duration = Math.round(performance.now() - start);
      setExecDurationMs(duration);
      setOutput(`Execution failed: ${(e as Error).message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunGui = async () => {
    setIsRunning(true);
    const start = performance.now();
    await handleSave();

    try {
      if (activeFile.endsWith('.py') || /tkinter|turtle|webview|pysimplegui/i.test(content)) {
        const res = GuiDisplayServer.get().parseAndLaunchPython(content, activeFile);
        const duration = Math.round(performance.now() - start);
        setExecDurationMs(duration);
        setOutput(`[Helix-X11] Virtual display connected on ${GuiDisplayServer.get().displayId}\n[Helix-X11] Launched client window in Helix DE (Window ID: ${res.windowId})\n` + res.logs.join('\n'));
        Toast.show(`Launched ${activeFile} GUI in Helix DE!`, '🚀');
      } else if (activeFile.endsWith('.sh') && content.includes('zenity')) {
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('zenity ')) {
            const args = trimmed.replace(/^zenity\s+/, '').split(/\s+/);
            GuiDisplayServer.get().launchZenityDialog(args);
          }
        }
        const duration = Math.round(performance.now() - start);
        setExecDurationMs(duration);
        setOutput(`[Helix-X11] Dispatched Zenity dialogs into Helix DE.`);
        Toast.show(`Dispatched Zenity GUI dialogs`, '💬');
      } else {
        await handleRun();
      }
    } catch (e: unknown) {
      const duration = Math.round(performance.now() - start);
      setExecDurationMs(duration);
      setOutput(`GUI Execution failed: ${(e as Error).message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '    ' + content.substring(end);
      setContent(newContent);
      setIsSaved(false);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleCreateNewFile = async () => {
    const name = newFileNameInput.trim();
    if (name) {
      const path = name.startsWith('/') ? name : `/${name}`;
      await Kernel.vfs.write(path, '# Created in Helix Code Editor\n');
      setOpenTabs((prev) => [...prev, path]);
      setActiveFile(path);
      setContent('# Created in Helix Code Editor\n');
      setIsSaved(true);
      loadFiles();
    }
    setIsNewFileModalOpen(false);
    setNewFileNameInput('');
  };

  const handleInsertTemplate = (type: 'python' | 'shell' | 'c' | 'node' | 'html') => {
    let template = '';
    if (type === 'python') {
      template = `\nimport sys\nimport math\n\ndef main():\n    print("Hello from Alpine Linux!")\n    print("Python version:", sys.version)\n    print("Square root of 144:", math.sqrt(144))\n\nif __name__ == "__main__":\n    main()\n`;
    } else if (type === 'shell') {
      template = `\n#!/bin/sh\n# Alpine Shell Script\necho "Running in Helix Alpine guest on $(date)"\nuname -a\n`;
    } else if (type === 'c') {
      template = `\n#include <stdio.h>\n\nint main() {\n    printf("Hello from C on Alpine Linux (musl libc)!\\n");\n    return 0;\n}\n`;
    } else if (type === 'node') {
      template = `\n// Node.js script\nconsole.log("Node version:", process.version);\nconsole.log("Platform:", process.platform, process.arch);\n`;
    } else {
      template = `\n<!DOCTYPE html>\n<html>\n  <head>\n    <title>Helix Web App</title>\n  </head>\n  <body>\n    <h1>Hello from Helix OS</h1>\n  </body>\n</html>\n`;
    }
    setContent((prev) => prev + template);
    setIsSaved(false);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.split('/').pop() || 'script.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = content.split('\n').length;
  const charCount = content.length;

  return (
    <div className="h-full flex flex-col bg-[#0d0f17] text-[#edf1f7] text-xs font-mono select-none overflow-hidden relative">
      {/* Top Action Toolbar */}
      <div className="p-2 border-b border-white/10 bg-[#12141e] flex items-center justify-between gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
            title="Toggle File Explorer Sidebar"
          >
            <Sidebar className="w-4 h-4" />
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-3 py-1.5 bg-[#6ee7b7] hover:bg-[#5cd4a6] text-black font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-[0_0_10px_rgba(110,231,183,0.3)]"
            title="Run active script in Alpine Guest (Ctrl+Enter)"
          >
            <Play className={`w-3.5 h-3.5 fill-black ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Run CLI'}</span>
          </button>

          <button
            onClick={handleRunGui}
            disabled={isRunning}
            className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-sky-500/40"
            title="Launch GUI Window in Helix DE (Tkinter / Turtle / Webview / Zenity)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Run GUI</span>
          </button>

          <button
            onClick={handleSave}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer border ${
              isSaved
                ? 'bg-white/5 border-white/10 text-gray-300'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
            }`}
            title="Save file (Ctrl+S)"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved' : 'Save *'}</span>
          </button>

          <button
            onClick={() => {
              Kernel.backpack.addItem('snippet', activeFile.split('/').pop() || 'Snippet', content);
              Toast.show('Saved to Backpack', '🎒');
            }}
            className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 font-semibold flex items-center gap-1.5 transition cursor-pointer border border-orange-500/40"
            title="Save snippet to System Backpack"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Backpack</span>
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          {/* Quick Code Templates Menu */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500 uppercase font-bold hidden md:inline">Snippet:</span>
            <button
              onClick={() => {
                setContent(`import tkinter as tk\n\nroot = tk.Tk()\nroot.title("Alpine Python GUI App")\nroot.geometry("420x340")\n\ntitle = tk.Label(root, text="Alpine Tkinter Interface", font=("Arial", 14, "bold"))\ninfo = tk.Label(root, text="Connected to Helix Virtual X11 (:0.0)")\n\nent = tk.Entry(root, placeholder="Type something...")\nbtn = tk.Button(root, text="Increment Counter (+)", command="increment")\n\nroot.mainloop()`);
                setIsSaved(false);
              }}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-emerald-300 text-[11px] cursor-pointer"
              title="Insert Tkinter Python GUI Template"
            >
              +TkGUI
            </button>
            <button
              onClick={() => handleInsertTemplate('python')}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-emerald-400 text-[11px] cursor-pointer"
              title="Insert Python Template"
            >
              +Py
            </button>
            <button
              onClick={() => handleInsertTemplate('node')}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-amber-400 text-[11px] cursor-pointer"
              title="Insert Node.js Template"
            >
              +JS
            </button>
            <button
              onClick={() => handleInsertTemplate('shell')}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-cyan-400 text-[11px] cursor-pointer"
              title="Insert Shell Script Template"
            >
              +Sh
            </button>
            <button
              onClick={() => handleInsertTemplate('c')}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-purple-400 text-[11px] cursor-pointer"
              title="Insert C Template"
            >
              +C
            </button>
          </div>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFontSize((f) => Math.max(10, f - 1))}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
            title="Decrease font size"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-gray-500 font-mono w-5 text-center">{fontSize}</span>
          <button
            onClick={() => setFontSize((f) => Math.min(20, f + 1))}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
            title="Increase font size"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`p-1.5 rounded transition ${wordWrap ? 'bg-[#6ee7b7]/20 text-[#6ee7b7]' : 'hover:bg-white/10 text-gray-400'}`}
            title="Toggle Word Wrap"
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
            title="Download file to device"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left File Tree Sidebar */}
        {showSidebar && (
          <div className="w-48 bg-[#0a0c12] border-r border-white/10 flex flex-col justify-between shrink-0">
            <div className="p-2 space-y-1 overflow-y-auto">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] text-gray-500 uppercase font-bold">
                <span>Workspace Files</span>
                <button
                  onClick={() => {
                    setNewFileNameInput(`/script_${Date.now().toString().slice(-4)}.py`);
                    setIsNewFileModalOpen(true);
                  }}
                  className="hover:text-white cursor-pointer"
                  title="Create New File"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {availableFiles.map((file) => {
                const isActive = activeFile === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => handleSwitchTab(file.path)}
                    className={`w-full px-2 py-1.5 rounded-lg flex items-center gap-2 text-left transition cursor-pointer text-xs truncate ${
                      isActive
                        ? 'bg-[#6ee7b7]/15 text-[#6ee7b7] font-semibold border border-[#6ee7b7]/30'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 shrink-0 text-[#6ee7b7]" />
                    <span className="truncate">{file.path.replace(/^\//, '')}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-2 border-t border-white/10 text-[10px] text-gray-500 space-y-0.5">
              <div>Runtime: Alpine POSIX</div>
              <div>Root: /mnt/helix</div>
            </div>
          </div>
        )}

        {/* Center Code Editor & Output */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0c12]">
          {/* File Tabs Bar */}
          <div className="flex items-center gap-1 px-2 pt-1.5 bg-[#090b10] border-b border-white/10 overflow-x-auto select-none no-scrollbar">
            {openTabs.map((tab) => {
              const isActive = activeFile === tab;
              const title = tab.split('/').pop() || tab;
              return (
                <div
                  key={tab}
                  onClick={() => handleSwitchTab(tab)}
                  className={`px-3 py-1.5 rounded-t-lg border-t border-x flex items-center gap-2 text-xs transition cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#0d0f17] border-white/20 text-white font-medium border-b-transparent'
                      : 'bg-white/[0.02] border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-[#6ee7b7]" />
                  <span>{title}</span>
                  {!isSaved && isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  {openTabs.length > 1 && (
                    <button
                      onClick={(e) => handleCloseTab(tab, e)}
                      className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => {
                setNewFileNameInput(`/script_${Date.now().toString().slice(-4)}.py`);
                setIsNewFileModalOpen(true);
              }}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white ml-1 cursor-pointer"
              title="New File"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Text Editor Area with Line Numbers */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Line Numbers Column */}
            <div
              ref={lineNumbersRef}
              className="w-10 bg-[#090b10] py-3 pr-2 text-right text-gray-600 select-none font-mono text-xs border-r border-white/5 overflow-y-hidden"
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Editable Text Area */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setIsSaved(false);
              }}
              onKeyDown={handleTextareaKeyDown}
              onScroll={handleScroll}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              className={`flex-1 p-3 bg-transparent text-[#edf1f7] outline-none resize-none font-mono selection:bg-[#6ee7b7]/30 ${
                wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
              }`}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: '1.6',
                tabSize: 4,
              }}
            />
          </div>

          {/* Bottom Run Console (Appears if Output exists) */}
          {output !== null && (
            <div className="h-44 bg-[#08090d] border-t border-white/15 flex flex-col select-text shrink-0 animate-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-1.5 bg-[#0e1017] border-b border-white/10 flex items-center justify-between text-xs select-none">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#6ee7b7]" />
                  <span className="font-semibold text-white">Execution Console</span>
                  {execDurationMs !== null && (
                    <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {execDurationMs}ms
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(output);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                    title="Copy output"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setOutput(null)}
                    className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                    title="Close Console"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-[#c9d4c8] whitespace-pre-wrap leading-relaxed">
                {output}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="h-6 px-3 bg-[#0a0c10] border-t border-white/10 flex items-center justify-between text-[11px] text-[#8b93a7] shrink-0 select-none font-mono">
        <div className="flex items-center gap-3">
          <span>{activeFile}</span>
          <span>•</span>
          <span>{lineCount} lines</span>
          <span>•</span>
          <span>{charCount} chars</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="uppercase text-[#6ee7b7] font-semibold">{languageMode}</span>
          <span>UTF-8</span>
          <span>Spaces: 4</span>
        </div>
      </div>

      {/* In-App New File Modal */}
      {isNewFileModalOpen && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-white/15 rounded-2xl shadow-2xl p-5 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-100">
            <div>
              <h3 className="font-bold text-sm text-white">Create New Script</h3>
              <p className="text-xs text-gray-400 mt-0.5">Enter filename (e.g. /my_task.py or /app.js)</p>
            </div>

            <input
              type="text"
              autoFocus
              value={newFileNameInput}
              onChange={(e) => setNewFileNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNewFile()}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#6ee7b7]"
              placeholder="/script.py"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsNewFileModalOpen(false)}
                className="px-3 py-1.5 rounded-lg hover:bg-white/10 text-gray-300 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewFile}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#6ee7b7] hover:bg-[#5cd4a6] text-black transition cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
