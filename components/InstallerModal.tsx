
import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, Loader2, Lock, Monitor, Smartphone, HardDrive, Wifi, Cpu, Globe, Layout, Package } from 'lucide-react';
import { AppPlatform } from '../types';

interface InstallerModalProps {
  isOpen: boolean;
  platform: AppPlatform;
  onClose: () => void;
  onComplete: () => void;
}

const InstallerModal: React.FC<InstallerModalProps> = ({ isOpen, platform, onClose, onComplete }) => {
  const [step, setStep] = useState<'scanning' | 'warning' | 'installing' | 'complete'>('scanning');
  const [logs, setLogs] = useState<string[]>([]);
  const [overrideInput, setOverrideInput] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setStep('scanning');
      setLogs([]);
      setOverrideInput('');
      return;
    }

    // REAL SYSTEM CHECKS
    const performSystemScan = async () => {
        const newLogs: string[] = [];
        let hasCriticalError = false;

        newLogs.push(`Target Platform: ${platform}`);
        newLogs.push(`Host Environment: ${navigator.userAgent.includes('Win') ? 'Windows' : 'Unix/Linux'}`);
        
        if (!navigator.onLine) {
            newLogs.push('WARNING: Offline mode. CDN assets may not load in preview.');
        }

        setLogs(newLogs);

        setTimeout(() => {
            if (hasCriticalError) {
                 setStep('warning');
            } else {
                 startInstall();
            }
        }, 1200);
    };

    setStep('scanning');
    performSystemScan();

  }, [isOpen, platform]);

  const startInstall = () => {
    setStep('installing');
    
    const installLogs = [];

    if (platform === AppPlatform.WINDOWS) {
        installLogs.push('Generating Electron Main Process...');
        installLogs.push('Configuring package.json for electron-builder...');
        installLogs.push('Packaging Assets into ZIP...');
    } else if (platform === AppPlatform.ANDROID) {
        installLogs.push('Structuring for Cordova/Capacitor...');
        installLogs.push('Generating config.xml...');
        installLogs.push('Packaging WWW assets...');
    } else if (platform === AppPlatform.WEB) {
        installLogs.push('Optimizing Single Page Application...');
        installLogs.push('Finalizing HTML...');
    } else {
        installLogs.push('Packaging Assets...');
    }

    setLogs(prev => [...prev, ...installLogs]);
    
    setTimeout(() => {
      setStep('complete');
      onComplete();
    }, 2000);
  };

  const getPlatformIcon = () => {
      switch(platform) {
          case AppPlatform.WINDOWS: return <Monitor size={18} className="text-purple-400" />;
          case AppPlatform.ANDROID: return <Smartphone size={18} className="text-green-400" />;
          case AppPlatform.IOS: return <Smartphone size={18} className="text-blue-400" />;
          case AppPlatform.WEB: return <Layout size={18} className="text-orange-400" />;
          default: return <Monitor size={18} />;
      }
  }

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <h3 className="font-semibold text-slate-100 flex items-center gap-2">
            {getPlatformIcon()}
            {platform} Builder
          </h3>
          {step === 'complete' && (
            <button onClick={onClose} className="text-slate-400 hover:text-white">Close</button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {step === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 size={48} className="animate-spin text-blue-500" />
              <p className="text-slate-300 animate-pulse font-mono">Analyzing Requirements...</p>
            </div>
          )}

          {step === 'installing' && (
            <div className="space-y-4">
               <div className="flex items-center gap-3 text-blue-400">
                  <Package size={24} className="animate-pulse" />
                  <span className="font-mono font-bold">Packaging Source...</span>
               </div>
               <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div className="h-full bg-blue-600 w-2/3 animate-[loading_1s_ease-in-out_infinite]"></div>
               </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">Build Package Ready</h4>
                <p className="text-slate-400 text-sm mt-2">
                  {platform === AppPlatform.WEB 
                    ? "The HTML file is ready for download." 
                    : "The source project has been zipped. Extract it and follow the README to build the final binary."}
                </p>
              </div>
            </div>
          )}
          
          {/* Console Logs */}
          <div className="mt-6 p-3 bg-black/80 rounded border border-slate-800 font-mono text-[10px] text-green-400/80 max-h-32 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">
                <span className="text-blue-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                {log}
              </div>
            ))}
            <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallerModal;
