import React, { useState, useMemo } from 'react';
import { Layout, Code, Monitor, Box } from 'lucide-react';
import { UniversalGuiStudioApp } from './UniversalGuiStudioApp';
import { PythonShowcaseApp } from './PythonShowcaseApp';
import { RustCppStudioApp } from './RustCppStudioApp';

// Memoize child apps to prevent unnecessary re-renders
const MemoizedUniversalGui = React.memo(UniversalGuiStudioApp);
const MemoizedPythonShowcase = React.memo(PythonShowcaseApp);
const MemoizedRustCpp = React.memo(RustCppStudioApp);

export const HelixUnifiedStudio: React.FC = () => {
  const [activeStudio, setActiveStudio] = useState<'gui' | 'python' | 'native'>('gui');

  return (
    <div className="flex h-full bg-[var(--bg)] text-white">
      {/* Sidebar Navigation */}
      <div className="w-48 bg-[var(--panel-solid)] border-r border-white/5 flex flex-col p-3 space-y-1">
        <h1 className="text-[10px] font-bold text-gray-500 p-2 uppercase tracking-widest">Helix Studio</h1>
        <button
          onClick={() => setActiveStudio('gui')}
          className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeStudio === 'gui' ? 'bg-[var(--accent)]/15 text-[var(--accent)] shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
        >
          <Layout className="w-4 h-4" />
          GUI Frameworks
        </button>
        <button
          onClick={() => setActiveStudio('python')}
          className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeStudio === 'python' ? 'bg-[var(--accent)]/15 text-[var(--accent)] shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
        >
          <Code className="w-4 h-4" />
          Python Showcase
        </button>
        <button
          onClick={() => setActiveStudio('native')}
          className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeStudio === 'native' ? 'bg-[var(--accent)]/15 text-[var(--accent)] shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
        >
          <Box className="w-4 h-4" />
          Native Studio
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-[var(--bg)]">
        {activeStudio === 'gui' && <MemoizedUniversalGui />}
        {activeStudio === 'python' && <MemoizedPythonShowcase />}
        {activeStudio === 'native' && <MemoizedRustCpp />}
      </div>
    </div>
  );
};
