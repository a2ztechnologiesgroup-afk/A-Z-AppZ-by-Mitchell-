import React, { useState } from 'react';
import { Download, Package, ShieldCheck, AlertTriangle, FileCode, Smartphone, Monitor, History, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { AppPlatform, BuildStatus, AppVersion } from '../types';

interface BuildControlsProps {
  onBuild: (platform: AppPlatform) => void;
  status: BuildStatus;
  hasCode: boolean;
  versions: AppVersion[];
  onRestore: (version: AppVersion) => void;
}

const BuildControls: React.FC<BuildControlsProps> = ({ onBuild, status, hasCode, versions, onRestore }) => {
  const [showHistory, setShowHistory] = useState(false);

  const getIcon = (platform: AppPlatform) => {
    switch (platform) {
      case AppPlatform.WEB: return <FileCode size={18} />;
      case AppPlatform.ANDROID: return <Smartphone size={18} />;
      case AppPlatform.IOS: return <Package size={18} />;
      case AppPlatform.WINDOWS: return <Monitor size={18} />;
    }
  };

  return (
    <div className="flex flex-col bg-slate-800 border-t border-slate-700 relative">
      
      {/* Version History Drawer */}
      {showHistory && (
        <div className="absolute bottom-full left-0 right-0 bg-slate-900 border-t border-slate-700 shadow-2xl max-h-64 overflow-y-auto z-30 animate-in slide-in-from-bottom-2">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Version History ({versions.length})</span>
                <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white">
                    <ChevronDown size={16} />
                </button>
            </div>
            {versions.length === 0 ? (
                <div className="p-6 text-center text-slate-600 text-sm">No versions yet. Generate code to create a snapshot.</div>
            ) : (
                <div className="divide-y divide-slate-800">
                    {versions.map((version) => (
                        <div key={version.id} className="p-3 hover:bg-slate-800 transition-colors flex justify-between items-center group">
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="text-xs text-blue-400 font-mono mb-1">
                                    {new Date(version.timestamp).toLocaleTimeString()} 
                                    <span className="text-slate-600 mx-2">•</span> 
                                    {new Date(version.timestamp).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-slate-300 truncate font-medium" title={version.prompt}>
                                    {version.prompt || "No description"}
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    onRestore(version);
                                    setShowHistory(false);
                                }}
                                className="p-2 rounded bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-400 transition-all opacity-0 group-hover:opacity-100"
                                title="Restore this version"
                            >
                                <RotateCcw size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {/* Main Controls */}
      <div className="p-4 z-40 bg-slate-800">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
             <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Distribute & Export</h3>
             <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded transition-colors ${showHistory ? 'bg-blue-900/30 text-blue-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'}`}
             >
                <History size={12} />
                <span>Versions</span>
                {showHistory ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
             </button>
          </div>
          
          {status.isBuilding && (
            <div className="mb-4 bg-slate-900 rounded p-3 border border-blue-900/50">
              <div className="flex justify-between text-xs text-blue-400 mb-1">
                <span>{status.stage}...</span>
                <span>{status.progress}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            </div>
          )}

          {status.error && (
              <div className="mb-4 bg-red-900/20 border border-red-800 p-3 rounded text-red-400 text-xs flex gap-2 items-center">
                  <AlertTriangle size={16} />
                  {status.error}
              </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onBuild(AppPlatform.WEB)}
              disabled={!hasCode || status.isBuilding}
              className="flex flex-col items-center gap-1 p-3 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-600 text-slate-200"
            >
              {getIcon(AppPlatform.WEB)}
              <span className="text-[10px] font-medium">HTML5</span>
            </button>

            <button
              onClick={() => onBuild(AppPlatform.ANDROID)}
              disabled={!hasCode || status.isBuilding}
              className="flex flex-col items-center gap-1 p-3 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-600 text-green-400"
            >
              {getIcon(AppPlatform.ANDROID)}
              <span className="text-[10px] font-medium">APK</span>
            </button>

            <button
              onClick={() => onBuild(AppPlatform.IOS)}
              disabled={!hasCode || status.isBuilding}
              className="flex flex-col items-center gap-1 p-3 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-600 text-blue-400"
            >
              {getIcon(AppPlatform.IOS)}
              <span className="text-[10px] font-medium">IPA</span>
            </button>

            <button
              onClick={() => onBuild(AppPlatform.WINDOWS)}
              disabled={!hasCode || status.isBuilding}
              className="flex flex-col items-center gap-1 p-3 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-600 text-purple-400"
            >
              {getIcon(AppPlatform.WINDOWS)}
              <span className="text-[10px] font-medium">PC Installer</span>
            </button>
          </div>
        </div>
        
        <div className="text-[10px] text-slate-500 flex gap-1 items-center justify-center">
          <ShieldCheck size={12} />
          <span>Secure build environment active</span>
        </div>
      </div>
    </div>
  );
};

export default BuildControls;