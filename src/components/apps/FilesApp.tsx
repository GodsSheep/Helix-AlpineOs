import React, { useState, useEffect, useRef } from 'react';
import { Kernel, VFSFile } from '../../kernel';
import { SoundManager } from '../../kernel/SoundManager';
import { 
  Folder, 
  File, 
  FileCode, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  ArrowLeft, 
  ArrowUp, 
  RefreshCw, 
  Grid, 
  List, 
  Search, 
  ExternalLink,
  Terminal,
  HardDrive,
  FolderPlus,
  Play,
  Eye,
  Check,
  X,
  ChevronRight,
  Info,
  PanelLeftClose,
  PanelLeft,
  Briefcase
} from 'lucide-react';

interface FilesAppProps {
  onOpenFileInEditor: (path: string) => void;
}

export const FilesApp: React.FC<FilesAppProps> = ({ onOpenFileInEditor }) => {
  const [files, setFiles] = useState<VFSFile[]>([]);
  const [currentDir, setCurrentDir] = useState<string>('/mnt/helix');
  const [selectedFile, setSelectedFile] = useState<VFSFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [history, setHistory] = useState<string[]>(['/mnt/helix']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);

  // In-app modal dialog states (replaces browser prompt / confirm)
  const [modalType, setModalType] = useState<'new_file' | 'new_folder' | 'rename' | 'delete' | null>(null);
  const [modalInput, setModalInput] = useState('');
  const [modalTarget, setModalTarget] = useState<VFSFile | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadFiles = async () => {
    const list = await Kernel.vfs.list();
    setFiles(list);
  };

  useEffect(() => {
    loadFiles();
    return Kernel.vfs.subscribe(loadFiles);
  }, []);

  const lastClickTimeRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  const navigateTo = (dir: string) => {
    SoundManager.play('open');
    const clean = dir.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    setCurrentDir(clean);
    setSelectedFile(null);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), clean]);
    setHistoryIndex((prev) => prev + 1);
  };

  const navigateUp = () => {
    if (currentDir === '/' || currentDir === '') return;
    SoundManager.play('click');
    const parts = currentDir.split('/').filter(Boolean);
    parts.pop();
    const parent = parts.length > 0 ? `/${parts.join('/')}` : '/';
    navigateTo(parent);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      SoundManager.play('click');
      setHistoryIndex((idx) => idx - 1);
      setCurrentDir(history[historyIndex - 1]);
      setSelectedFile(null);
    }
  };

  const handleFolderInteraction = (folderName: string) => {
    const fullPath = `${currentDir}/${folderName}`;
    const now = Date.now();
    if (lastClickTimeRef.current.id === `folder_${folderName}` && now - lastClickTimeRef.current.time < 350) {
      // Double click or double tap -> navigate in
      navigateTo(fullPath);
      lastClickTimeRef.current = { id: '', time: 0 };
    } else {
      SoundManager.play('click');
      lastClickTimeRef.current = { id: `folder_${folderName}`, time: now };
    }
  };

  const handleFileInteraction = (file: VFSFile) => {
    const now = Date.now();
    if (lastClickTimeRef.current.id === `file_${file.path}` && now - lastClickTimeRef.current.time < 350) {
      // Double click or double tap -> open in editor
      SoundManager.play('open');
      onOpenFileInEditor(file.path);
      lastClickTimeRef.current = { id: '', time: 0 };
    } else {
      SoundManager.play('click');
      setSelectedFile(file);
      lastClickTimeRef.current = { id: `file_${file.path}`, time: now };
    }
  };

  const getDirContents = () => {
    const prefix = currentDir === '/' ? '/' : `${currentDir}/`;
    const subfolders = new Set<string>();
    const currentFiles: VFSFile[] = [];

    if (currentDir === '/') {
      ['bin', 'etc', 'mnt', 'dev', 'home', 'proc', 'root', 'tmp', 'usr', 'var'].forEach((d) => subfolders.add(d));
    } else if (currentDir === '/mnt') {
      ['helix'].forEach((d) => subfolders.add(d));
    } else if (currentDir === '/mnt/helix') {
      ['documents', 'scripts', 'downloads'].forEach((d) => subfolders.add(d));
    }

    files.forEach((f) => {
      const normalizedPath = f.path.startsWith('/mnt/helix')
        ? f.path
        : `/mnt/helix${f.path.startsWith('/') ? f.path : `/${f.path}`}`;

      if (normalizedPath.startsWith(prefix)) {
        const remainder = normalizedPath.slice(prefix.length);
        const slashIdx = remainder.indexOf('/');
        if (slashIdx !== -1) {
          subfolders.add(remainder.slice(0, slashIdx));
        } else if (remainder.length > 0) {
          if (!f.path.endsWith('.keep')) {
            currentFiles.push(f);
          }
        }
      }
    });

    return {
      folders: Array.from(subfolders).filter((f) => f.toLowerCase().includes(searchQuery.toLowerCase())),
      files: currentFiles.filter((f) => f.path.toLowerCase().includes(searchQuery.toLowerCase())),
    };
  };

  const { folders, files: visibleFiles } = getDirContents();

  // Modal actions
  const openNewFileModal = () => {
    setModalInput(`script_${Date.now().toString().slice(-4)}.py`);
    setModalType('new_file');
  };

  const openNewFolderModal = () => {
    setModalInput(`folder_${Date.now().toString().slice(-4)}`);
    setModalType('new_folder');
  };

  const openRenameModal = (file: VFSFile) => {
    setModalTarget(file);
    setModalInput(file.path.split('/').pop() || '');
    setModalType('rename');
  };

  const openDeleteModal = (file: VFSFile) => {
    setModalTarget(file);
    setModalType('delete');
  };

  const handleModalSubmit = async () => {
    if (modalType === 'new_file') {
      const cleanName = modalInput.trim().replace(/^\//, '');
      if (cleanName) {
        const fullPath = currentDir === '/' || currentDir === '/mnt/helix' ? `/${cleanName}` : `${currentDir}/${cleanName}`.replace(/^\/mnt\/helix/, '');
        await Kernel.vfs.write(fullPath, '# File created in Helix OS\n');
        SoundManager.play('success');
        notify(`Created file ${cleanName}`);
      }
    } else if (modalType === 'new_folder') {
      const cleanFolder = modalInput.trim().replace(/^\//, '');
      if (cleanFolder) {
        const dummyFile = currentDir === '/' || currentDir === '/mnt/helix' ? `/${cleanFolder}/.keep` : `${currentDir}/${cleanFolder}/.keep`.replace(/^\/mnt\/helix/, '');
        await Kernel.vfs.write(dummyFile, '');
        SoundManager.play('success');
        notify(`Created folder ${cleanFolder}`);
      }
    } else if (modalType === 'rename' && modalTarget) {
      const newName = modalInput.trim();
      if (newName) {
        const dir = modalTarget.path.substring(0, modalTarget.path.lastIndexOf('/'));
        const newPath = dir ? `${dir}/${newName}` : `/${newName}`;
        await Kernel.vfs.write(newPath, modalTarget.content);
        await Kernel.vfs.delete(modalTarget.path);
        setSelectedFile(null);
        SoundManager.play('success');
        notify(`Renamed to ${newName}`);
      }
    } else if (modalType === 'delete' && modalTarget) {
      await Kernel.trash.trash(modalTarget.path);
      if (selectedFile?.path === modalTarget.path) setSelectedFile(null);
      notify(`Moved ${modalTarget.path} to Trash`);
    }

    setModalType(null);
    setModalTarget(null);
    setModalInput('');
    loadFiles();
  };

  const handleDownloadFile = (file: VFSFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || 'download.txt';
    a.click();
    URL.revokeObjectURL(url);
    notify(`Downloaded ${a.download}`);
  };

  // Drag and drop file upload
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const uploadedFiles = Array.from(e.dataTransfer.files);
    uploadedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        const normPath = currentDir === '/' || currentDir === '/mnt/helix' ? `/${file.name}` : `${currentDir}/${file.name}`.replace(/^\/mnt\/helix/, '');
        await Kernel.vfs.write(normPath, content);
        loadFiles();
        notify(`Imported ${file.name}`);
      };
      reader.readAsText(file);
    });
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    uploadedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        const normPath = currentDir === '/' || currentDir === '/mnt/helix' ? `/${file.name}` : `${currentDir}/${file.name}`.replace(/^\/mnt\/helix/, '');
        await Kernel.vfs.write(normPath, content);
        loadFiles();
        notify(`Imported ${file.name}`);
      };
      reader.readAsText(file);
    });
  };

  const handleRunInTerminal = async (file: VFSFile) => {
    Kernel.wm.launch('term');
    const normPath = file.path.startsWith('/') ? file.path : `/${file.path}`;
    let cmd = `sh /mnt/helix${normPath}`;
    if (file.path.endsWith('.py')) cmd = `python3 /mnt/helix${normPath}`;
    else if (file.path.endsWith('.js')) cmd = `node /mnt/helix${normPath}`;
    
    setTimeout(() => {
      Kernel.vm.executeCommand(cmd);
    }, 400);
  };

  const getFileIcon = (path: string) => {
    if (path.endsWith('.py')) return <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (path.endsWith('.js') || path.endsWith('.ts')) return <FileCode className="w-4 h-4 text-amber-400 shrink-0" />;
    if (path.endsWith('.sh')) return <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />;
    if (path.endsWith('.json')) return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
    if (path.endsWith('.md') || path.endsWith('.txt')) return <FileText className="w-4 h-4 text-purple-400 shrink-0" />;
    return <File className="w-4 h-4 text-gray-400 shrink-0" />;
  };

  const totalUsedBytes = files.reduce((acc, f) => acc + f.content.length, 0);
  const breadcrumbParts = currentDir.split('/').filter(Boolean);

  return (
    <div 
      className="h-full flex flex-col bg-[#0c0e14] text-[#edf1f7] text-xs select-none relative overflow-hidden"
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay notice */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-[#6ee7b7]/15 backdrop-blur-sm border-2 border-dashed border-[#6ee7b7] z-50 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <Upload className="w-10 h-10 text-[#6ee7b7] animate-bounce" />
          <span className="text-sm font-bold text-white">Drop files to import into {currentDir}</span>
        </div>
      )}

      {/* Top Action Toolbar */}
      <div className="p-2 bg-[#12141c] border-b border-white/10 flex items-center justify-between gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showSidebar ? 'bg-[#6ee7b7]/15 text-[#6ee7b7] border-[#6ee7b7]/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
            }`}
            title={showSidebar ? 'Collapse Locations Sidebar' : 'Expand Locations Sidebar'}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>

          <button
            onClick={handleBack}
            disabled={historyIndex === 0}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={navigateUp}
            disabled={currentDir === '/' || currentDir === ''}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Up one directory"
          >
            <ArrowUp className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          {/* Interactive Breadcrumbs Bar */}
          <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 text-[11px] font-mono">
            <button
              onClick={() => navigateTo('/')}
              className="hover:text-[#6ee7b7] transition cursor-pointer"
            >
              /
            </button>
            {breadcrumbParts.map((part, idx) => {
              const full = '/' + breadcrumbParts.slice(0, idx + 1).join('/');
              return (
                <React.Fragment key={full}>
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                  <button
                    onClick={() => navigateTo(full)}
                    className={`hover:text-[#6ee7b7] transition cursor-pointer ${
                      idx === breadcrumbParts.length - 1 ? 'text-white font-bold' : 'text-gray-400'
                    }`}
                  >
                    {part}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1 bg-black/40 border border-white/10 rounded-lg text-xs text-white outline-none w-32 sm:w-44 focus:border-[#6ee7b7]"
            />
          </div>

          <button
            onClick={openNewFileModal}
            className="px-2.5 py-1 rounded-lg bg-[#6ee7b7]/15 hover:bg-[#6ee7b7]/25 text-[#6ee7b7] border border-[#6ee7b7]/30 flex items-center gap-1.5 transition font-medium cursor-pointer"
            title="New File"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New File</span>
          </button>

          <button
            onClick={openNewFolderModal}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 flex items-center gap-1.5 transition cursor-pointer"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Folder</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer"
            title="Upload Files from Device"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleManualUpload}
          />

          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

          <button
            onClick={() => setViewMode((m) => (m === 'list' ? 'grid' : 'list'))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer"
            title={viewMode === 'list' ? 'Switch to Grid View' : 'Switch to List View'}
          >
            {viewMode === 'list' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Split Body: Sidebar Tree/Quick Folders + File List + File Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Quick Navigation Bar */}
        {showSidebar && (
          <div className="w-44 bg-[#0f1118] border-r border-white/10 p-2 space-y-1 shrink-0 flex flex-col transition-all">
            <span className="text-[10px] uppercase font-bold text-[#8b93a7] px-2 py-1 block">
              Locations
            </span>
            <button
              onClick={() => navigateTo('/mnt/helix')}
              className={`w-full px-2 py-1.5 rounded-lg flex items-center gap-2 text-left transition cursor-pointer ${
                currentDir === '/mnt/helix'
                  ? 'bg-[#6ee7b7]/15 text-[#6ee7b7] font-semibold'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-[#6ee7b7]" />
              <span className="truncate">Helix Home (~)</span>
            </button>

            <button
              onClick={() => navigateTo('/')}
              className={`w-full px-2 py-1.5 rounded-lg flex items-center gap-2 text-left transition cursor-pointer ${
                currentDir === '/'
                  ? 'bg-[#6ee7b7]/15 text-[#6ee7b7] font-semibold'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate">Root (/)</span>
            </button>

            <button
              onClick={() => navigateTo('/etc')}
              className={`w-full px-2 py-1.5 rounded-lg flex items-center gap-2 text-left transition cursor-pointer ${
                currentDir === '/etc'
                  ? 'bg-[#6ee7b7]/15 text-[#6ee7b7] font-semibold'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">/etc (Config)</span>
            </button>

            <button
              onClick={() => navigateTo('/var/log')}
              className={`w-full px-2 py-1.5 rounded-lg flex items-center gap-2 text-left transition cursor-pointer ${
                currentDir === '/var/log'
                  ? 'bg-[#6ee7b7]/15 text-[#6ee7b7] font-semibold'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">/var/log</span>
            </button>

            <div className="pt-3 border-t border-white/10 mt-auto px-2 text-[10px] text-[#8b93a7] space-y-1">
              <span className="block font-semibold">Alpine VirtIO Mount</span>
              <span>Filesystem: 9P2000.L</span>
              <span>Status: Mounted (rw)</span>
            </div>
          </div>
        )}

        {/* Center File Area */}
        <div className="flex-1 overflow-y-auto p-3">
          {folders.length === 0 && visibleFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#8b93a7] space-y-2">
              <Folder className="w-10 h-10 text-gray-600 stroke-1" />
              <p>This directory is empty</p>
              <p className="text-[11px] text-gray-500">Drag & drop files or click "New File" above.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {folders.map((folder) => (
                <div
                  key={folder}
                  onClick={() => handleFolderInteraction(folder)}
                  onDoubleClick={() => navigateTo(`${currentDir}/${folder}`)}
                  className="p-3 bg-[#131620] hover:bg-[#1a1e2b] border border-white/10 hover:border-[#6ee7b7]/40 rounded-xl flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition group"
                >
                  <Folder className="w-10 h-10 text-cyan-400 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-medium text-white truncate max-w-full">{folder}</span>
                </div>
              ))}

              {visibleFiles.map((file) => {
                const name = file.path.split('/').pop() || file.path;
                const isSel = selectedFile?.path === file.path;
                return (
                  <div
                    key={file.path}
                    onClick={() => handleFileInteraction(file)}
                    onDoubleClick={() => {
                      SoundManager.play('open');
                      onOpenFileInEditor(file.path);
                    }}
                    className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition group ${
                      isSel
                        ? 'bg-[#6ee7b7]/15 border-[#6ee7b7]/50 shadow-[0_0_15px_rgba(110,231,183,0.15)]'
                        : 'bg-[#131620] hover:bg-[#1a1e2b] border-white/10'
                    }`}
                  >
                    <div className="group-hover:scale-105 transition-transform">{getFileIcon(file.path)}</div>
                    <span className="text-xs text-white truncate max-w-full">{name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{file.content.length} B</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {/* Folder items */}
              {folders.map((folder) => (
                <div
                  key={folder}
                  onClick={() => handleFolderInteraction(folder)}
                  onDoubleClick={() => navigateTo(`${currentDir}/${folder}`)}
                  className="p-2 rounded-lg hover:bg-white/5 flex items-center justify-between transition cursor-pointer text-gray-300 hover:text-white group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Folder className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-medium text-xs truncate">{folder}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono">Directory</span>
                </div>
              ))}

              {/* File items */}
              {visibleFiles.map((file) => {
                const name = file.path.split('/').pop() || file.path;
                const isSel = selectedFile?.path === file.path;
                return (
                  <div
                    key={file.path}
                    onClick={() => handleFileInteraction(file)}
                    onDoubleClick={() => {
                      SoundManager.play('open');
                      onOpenFileInEditor(file.path);
                    }}
                    className={`p-2 rounded-lg flex items-center justify-between transition cursor-pointer ${
                      isSel
                        ? 'bg-[#6ee7b7]/15 text-white border border-[#6ee7b7]/30'
                        : 'hover:bg-white/5 text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {getFileIcon(file.path)}
                      <span className="text-xs truncate">{name}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono shrink-0">
                      <span>{file.content.length} bytes</span>
                      <span className="hidden sm:inline">
                        {new Date(file.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Inspector / Preview Pane (Visible if file is selected) */}
        {selectedFile && (
          <div className="w-64 bg-[#10121a] border-l border-white/10 p-3 flex flex-col justify-between overflow-y-auto shrink-0 animate-in slide-in-from-right-4 duration-150">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFile.path)}
                  <span className="font-bold text-xs text-white truncate max-w-[140px]">
                    {selectedFile.path.split('/').pop()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-gray-400 hover:text-white rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* File details card */}
              <div className="p-2.5 bg-black/40 rounded-lg border border-white/5 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-400">Path:</span>
                  <span className="font-mono text-gray-200 truncate max-w-[120px]">{selectedFile.path}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Size:</span>
                  <span className="font-mono text-gray-200">{selectedFile.content.length} bytes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Modified:</span>
                  <span className="text-gray-200 font-mono text-[10px]">
                    {new Date(selectedFile.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Preview Box */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <Eye className="w-3 h-3 text-[#6ee7b7]" /> File Preview
                </span>
                <div className="p-2 bg-black/60 rounded-lg border border-white/5 text-[10px] font-mono text-gray-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {selectedFile.content.slice(0, 300) || '<Empty File>'}
                </div>
              </div>
            </div>

            {/* Quick File Action Buttons */}
            <div className="space-y-1.5 pt-3 border-t border-white/10">
              <button
                onClick={() => onOpenFileInEditor(selectedFile.path)}
                className="w-full py-1.5 bg-[#6ee7b7]/15 hover:bg-[#6ee7b7]/25 text-[#6ee7b7] border border-[#6ee7b7]/30 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Open in Editor</span>
              </button>

              <button
                onClick={() => handleRunInTerminal(selectedFile)}
                className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                <span>Run in Terminal</span>
              </button>

              <button
        onClick={() => {
          if (selectedFile) {
            Kernel.backpack.addItem('file', selectedFile.path.split('/').pop() || 'File', selectedFile.content);
            notify('Added to Backpack 🎒');
          }
        }}
        className="w-full py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
      >
        <Briefcase className="w-3.5 h-3.5" />
        <span>Add to Backpack</span>
      </button>

      <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => openRenameModal(selectedFile)}
                  className="py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition cursor-pointer text-center"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDownloadFile(selectedFile)}
                  className="py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition cursor-pointer text-center"
                >
                  Download
                </button>
              </div>

              <button
                onClick={() => openDeleteModal(selectedFile)}
                className="w-full py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition cursor-pointer text-center text-[11px]"
              >
                Delete File
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="h-7 px-3 bg-[#0a0c12] border-t border-white/10 flex items-center justify-between text-[11px] text-[#8b93a7] shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span>{visibleFiles.length + folders.length} items</span>
          <span>•</span>
          <span>{totalUsedBytes} bytes used</span>
        </div>

        {notification ? (
          <span className="text-[#6ee7b7] font-semibold animate-pulse">{notification}</span>
        ) : (
          <span className="font-mono text-[10px]">IndexedDB VFS Synced</span>
        )}
      </div>

      {/* In-App Action Modal */}
      {modalType && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-white/15 rounded-2xl shadow-2xl p-5 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-100">
            <div>
              <h3 className="font-bold text-sm text-white">
                {modalType === 'new_file' && 'Create New File'}
                {modalType === 'new_folder' && 'Create New Directory'}
                {modalType === 'rename' && 'Rename Item'}
                {modalType === 'delete' && 'Delete File'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {modalType === 'delete'
                  ? `Are you sure you want to permanently delete "${modalTarget?.path}"?`
                  : 'Specify the name inside the current directory path.'}
              </p>
            </div>

            {modalType !== 'delete' && (
              <input
                type="text"
                autoFocus
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleModalSubmit()}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#6ee7b7]"
                placeholder="Enter name..."
              />
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalType(null)}
                className="px-3 py-1.5 rounded-lg hover:bg-white/10 text-gray-300 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  modalType === 'delete'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-[#6ee7b7] hover:bg-[#5cd4a6] text-black'
                }`}
              >
                {modalType === 'delete' ? 'Delete' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
