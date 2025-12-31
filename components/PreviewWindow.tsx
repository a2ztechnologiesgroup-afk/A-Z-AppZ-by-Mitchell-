import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Smartphone, Monitor, Globe, Wifi, Battery, AlertCircle } from 'lucide-react';

interface PreviewWindowProps {
  code: string;
  isBuilding: boolean;
}

const PreviewWindow: React.FC<PreviewWindowProps> = ({ code, isBuilding }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile');
  const [appMeta, setAppMeta] = useState<{ title: string; icon: string | null }>({ 
    title: 'Live Preview', 
    icon: null 
  });
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state on new code
    setRenderError(null);

    if (iframeRef.current && code) {
      try {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(code);
          doc.close();
        }

        // Extract metadata from the generated HTML
        const titleMatch = code.match(/<title>(.*?)<\/title>/i);
        const iconMatch = code.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*>/i);
        
        setAppMeta({
          title: titleMatch ? titleMatch[1] : 'Live Preview',
          icon: iconMatch ? iconMatch[1] : null
        });
      } catch (err) {
        console.error("Preview Render Error:", err);
        setRenderError("Failed to render the application preview.");
      }
    }
  }, [code]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
      {/* Enhanced Header with Icon Display */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 h-16">
        <div className="flex items-center gap-3">
            {appMeta.icon ? (
                <img 
                  src={appMeta.icon} 
                  alt="App Icon" 
                  className="w-9 h-9 rounded-lg shadow-sm border border-slate-600 bg-slate-700 object-cover" 
                />
            ) : (
                <div className="w-9 h-9 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center">
                    <Globe size={18} className="text-slate-400" />
                </div>
            )}
            <div>
                <h2 className="text-white font-semibold text-sm leading-tight truncate max-w-[200px]">
                  {appMeta.title}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isBuilding ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                        {isBuilding ? 'Compiling...' : 'Running'}
                    </span>
                </div>
            </div>
        </div>

        <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
           <button
            onClick={() => setViewMode('mobile')}
            className={`p-1.5 rounded transition-all ${viewMode === 'mobile' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            title="Mobile View"
          >
            <Smartphone size={16} />
          </button>
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-1.5 rounded transition-all ${viewMode === 'desktop' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            title="Desktop View"
          >
            <Monitor size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative flex justify-center items-center bg-slate-950/50 p-4">
        {isBuilding && (
          <div className="absolute inset-0 z-10 bg-slate-900/80 flex items-center justify-center flex-col gap-4 backdrop-blur-sm">
            <RefreshCw className="text-blue-500 animate-spin" size={48} />
            <p className="text-blue-400 font-mono animate-pulse">Compiling modules...</p>
          </div>
        )}
        
        {!code && !isBuilding && !renderError && (
          <div className="text-slate-500 text-center flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
                <Smartphone size={40} className="text-slate-600" />
            </div>
            <p className="font-medium text-slate-400">Preview Area</p>
            <p className="text-xs text-slate-600 mt-2 max-w-[200px]">Generated applications will run live in this secure sandbox.</p>
          </div>
        )}

        {renderError && (
            <div className="text-red-400 text-center flex flex-col items-center p-6 bg-red-900/10 rounded-xl border border-red-900/50">
                <AlertCircle size={32} className="mb-2" />
                <p>{renderError}</p>
            </div>
        )}

        <div className={`transition-all duration-500 shadow-2xl overflow-hidden bg-white relative ${
            viewMode === 'mobile' 
              ? 'w-[375px] h-[667px] rounded-[3rem] border-[8px] border-slate-800 ring-1 ring-slate-700' 
              : 'w-full h-full rounded-lg border border-slate-700'
          } ${!code ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
          
          {/* Mobile Status Bar Simulation (only in mobile view) */}
          {viewMode === 'mobile' && (
              <div className="absolute top-0 left-0 right-0 h-8 bg-black text-white flex justify-between items-center px-6 text-[10px] font-medium z-20 pointer-events-none select-none">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                     <Wifi size={12} />
                     <Battery size={12} />
                  </div>
              </div>
          )}

          <iframe
            ref={iframeRef}
            title="App Preview"
            className={`w-full h-full bg-white ${viewMode === 'mobile' ? 'pt-8' : ''}`}
            sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewWindow;