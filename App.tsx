
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ChatInterface from './components/ChatInterface';
import PreviewWindow from './components/PreviewWindow';
import BuildControls from './components/BuildControls';
import InstallerModal from './components/InstallerModal';
import SamuelVoiceAssistant from './components/SamuelVoiceAssistant';
import { generateAppCode } from './services/geminiService';
import { Message, BuildStatus, AppPlatform, AppVersion } from './types';
import { Share2, Smartphone, Monitor, Globe, Box, X, Upload, ShieldCheck, Sparkles } from 'lucide-react';
import JSZip from 'jszip';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHealing, setIsHealing] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>({
    isBuilding: false,
    progress: 0,
    stage: 'Idle',
    completed: false
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const [showInstaller, setShowInstaller] = useState(false);
  const [targetPlatform, setTargetPlatform] = useState<AppPlatform>(AppPlatform.WEB);
  
  const [isSelfExport, setIsSelfExport] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Watchdog Script for Auto-Correction
  const WATCHDOG_SCRIPT = `
<script>
(function() {
  window.onerror = function(message, source, lineno, colno, error) {
    window.parent.postMessage({
      type: 'APP_ERROR',
      error: { message: message, line: lineno, col: colno, stack: error ? error.stack : '' }
    }, '*');
    return false;
  };
  window.onunhandledrejection = function(event) {
    window.parent.postMessage({
      type: 'APP_ERROR',
      error: { message: 'Unhandled Promise Rejection: ' + event.reason, stack: event.reason ? event.reason.stack : '' }
    }, '*');
  };
  console.log('A²Z Watchdog Active: Monitoring for autonomous repairs.');
})();
</script>
`;

  const handleClear = useCallback(() => {
     if (confirm("Are you sure you want to start a new project? This will clear the current session.")) {
        setMessages([]);
        setGeneratedCode('');
        setVersions([]);
        setSelectedFile(null);
     }
  }, []);

  // Autonomous Error Recovery
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'APP_ERROR' && !isProcessing && !isHealing && generatedCode) {
        console.warn("Autonomous System Detected Error:", event.data.error);
        await autoHeal(event.data.error);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [generatedCode, isProcessing, isHealing]);

  const autoHeal = async (errorData: any) => {
    setIsHealing(true);
    const errorMsg = `AUTONOMOUS REPAIR TRIGGERED: The app crashed with the following error: "${errorData.message}". 
    Stack Trace: ${errorData.stack || 'N/A'}. 
    Please analyze the current code and provide a fixed, bug-free version. 
    Ensure all API calls and variable references are correctly defined.`;

    try {
      const fixedCode = await generateAppCode(errorMsg, messages, undefined, undefined, generatedCode);
      processAndSetCode(fixedCode, "Autonomous Self-Repair (Bug Fixed)");
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "I detected a runtime error in the preview and have autonomously applied a fix. The app should now be functional.", 
        timestamp: Date.now() 
      }]);
    } catch (err) {
      console.error("Self-Healing Failed:", err);
    } finally {
      setIsHealing(false);
    }
  };

  const processAndSetCode = (rawCode: string, promptText: string) => {
      if (!rawCode) return;
      let finalCode = rawCode;
      if (finalCode.includes('</body>')) {
          finalCode = finalCode.replace('</body>', WATCHDOG_SCRIPT + '\n</body>');
      } else {
          finalCode += WATCHDOG_SCRIPT;
      }
      setGeneratedCode(finalCode);
      const newVersion: AppVersion = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          code: finalCode,
          prompt: promptText
      };
      setVersions(prev => [newVersion, ...prev]);
  };

  const handleSendMessage = useCallback(async (text: string, file?: File) => {
    let attachmentData: { name: string; type: string; data: string } | undefined;
    if (file) {
      const reader = new FileReader();
      attachmentData = await new Promise((resolve) => {
        reader.onload = (e) => resolve({
          name: file.name,
          type: file.type,
          data: e.target?.result as string
        });
        reader.readAsDataURL(file);
      });
    }
    const newMessage: Message = { role: 'user', content: text, attachment: attachmentData, timestamp: Date.now() };
    setMessages(prev => [...prev, newMessage]);
    setIsProcessing(true);
    try {
      const code = await generateAppCode(text, messages, attachmentData?.data.split(',')[1], attachmentData?.type);
      setMessages(prev => [...prev, { role: 'model', content: "Architecture update complete. Monitoring runtime for stability...", timestamp: Date.now() }]);
      processAndSetCode(code, text);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Engine error: " + (error instanceof Error ? error.message : "Failed to compile."), timestamp: Date.now() }]);
    } finally {
      setIsProcessing(false);
    }
  }, [messages]);

  // Fix for line 250: Added missing handleRestoreVersion function
  const handleRestoreVersion = useCallback((version: AppVersion) => {
    setGeneratedCode(version.code);
    setMessages(prev => [...prev, { 
      role: 'model', 
      content: `System: Restored project to version from ${new Date(version.timestamp).toLocaleString()} (${version.prompt})`, 
      timestamp: Date.now() 
    }]);
  }, []);

  const initiateBuild = (platform: AppPlatform) => {
    if (!generatedCode) return;
    setTargetPlatform(platform);
    setIsSelfExport(false);
    setShowInstaller(true);
  };

  const initiateSelfExport = (platform: AppPlatform) => {
    setTargetPlatform(platform);
    setIsSelfExport(true);
    setShowExportMenu(false);
    setShowInstaller(true);
  }

  const handleInstallerComplete = async () => {
      await generateProjectPackage(targetPlatform, isSelfExport);
      setShowInstaller(false);
      setIsSelfExport(false);
      setBuildStatus({ isBuilding: false, progress: 100, stage: 'Exported', completed: true, platform: targetPlatform });
      setTimeout(() => setBuildStatus(prev => ({ ...prev, stage: 'Idle', completed: false })), 3000);
  };

  const generateProjectPackage = async (platform: AppPlatform, isSelf: boolean) => {
    const sourceCode = isSelf ? `<!DOCTYPE html>\n${document.documentElement.outerHTML}` : generatedCode;
    const appName = "A2Z_Gen_App";
    const ts = new Date().getTime();

    if (platform === AppPlatform.WEB) {
        const blob = new Blob([sourceCode], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = isSelf ? `A2Z-Builder-${ts}.html` : `App-${ts}.html`;
        a.click();
        URL.revokeObjectURL(url);
    } else if (platform === AppPlatform.WINDOWS) {
        const zip = new JSZip();
        const folder = zip.folder(`${appName}-Windows`);
        folder?.file("package.json", JSON.stringify({
            name: appName.toLowerCase(),
            version: "1.0.0",
            main: "main.js",
            scripts: { "start": "electron .", "dist": "electron-builder" },
            devDependencies: { "electron": "^28.0.0", "electron-builder": "^24.0.0" }
        }, null, 2));
        folder?.file("main.js", `const { app, BrowserWindow } = require('electron'); app.whenReady().then(() => { const win = new BrowserWindow({ width: 1280, height: 800 }); win.loadFile('index.html'); });`);
        folder?.file("index.html", sourceCode);
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${appName}-Windows-${ts}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    } else if (platform === AppPlatform.ANDROID) {
        const zip = new JSZip();
        const folder = zip.folder(`${appName}-Android`);
        folder?.file("www/index.html", sourceCode);
        folder?.file("config.xml", `<?xml version='1.0' encoding='utf-8'?><widget id="com.a2z.app" version="1.0.0"><name>${appName}</name><content src="index.html" /></widget>`);
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${appName}-Android-${ts}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    } else if (platform === AppPlatform.IOS) {
        const zip = new JSZip();
        const folder = zip.folder(`${appName}-iOS`);
        folder?.file("www/index.html", sourceCode);
        folder?.file("capacitor.config.json", JSON.stringify({ appId: "com.a2z.app", appName: appName, webDir: "www" }, null, 2));
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${appName}-iOS-${ts}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden relative">
      <SamuelVoiceAssistant />
      <InstallerModal isOpen={showInstaller} platform={targetPlatform} onClose={() => setShowInstaller(false)} onComplete={handleInstallerComplete} />

      <div className="w-1/3 min-w-[350px] max-w-[500px] flex flex-col border-r border-slate-800 h-full relative z-20 shadow-xl bg-slate-900/50 backdrop-blur-md">
        <ChatInterface messages={messages} onSendMessage={handleSendMessage} isProcessing={isProcessing || isHealing} selectedFile={selectedFile} onSetFile={setSelectedFile} onClear={handleClear} />
        
        {/* Status Bar */}
        <div className="px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[10px] bg-slate-900/80">
            <div className="flex items-center gap-2">
                <ShieldCheck size={12} className={isHealing ? 'text-yellow-500' : 'text-green-500'} />
                <span className="uppercase tracking-widest font-bold">Health: {isHealing ? 'Repairing' : 'Optimal'}</span>
            </div>
            {isHealing && (
                <div className="flex items-center gap-2 text-yellow-500 animate-pulse">
                    <Sparkles size={12} />
                    <span>AUTONOMOUS FIX IN PROGRESS</span>
                </div>
            )}
        </div>

        <BuildControls onBuild={initiateBuild} status={buildStatus} hasCode={!!generatedCode} versions={versions} onRestore={handleRestoreVersion} />
      </div>

      <div className="flex-1 h-full relative z-10">
        <PreviewWindow code={generatedCode} isBuilding={isProcessing || isHealing} />
      </div>

      <div className="absolute bottom-6 right-6 z-40 flex flex-col items-end gap-2">
         {showExportMenu && (
             <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-2 mb-2 min-w-[160px] animate-in zoom-in duration-200 origin-bottom-right">
                 <button onClick={() => initiateSelfExport(AppPlatform.WEB)} className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded text-left text-sm text-slate-200 transition-colors">
                     <Globe size={16} className="text-blue-400" /> Web (HTML5)
                 </button>
                 <button onClick={() => initiateSelfExport(AppPlatform.ANDROID)} className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded text-left text-sm text-slate-200 transition-colors">
                     <Smartphone size={16} className="text-green-400" /> Android (APK)
                 </button>
                 <button onClick={() => initiateSelfExport(AppPlatform.IOS)} className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded text-left text-sm text-slate-200 transition-colors">
                     <Box size={16} className="text-blue-400" /> iOS (IPA)
                 </button>
                 <button onClick={() => initiateSelfExport(AppPlatform.WINDOWS)} className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded text-left text-sm text-slate-200 transition-colors">
                     <Monitor size={16} className="text-purple-400" /> Windows (EXE)
                 </button>
             </div>
         )}
         <button onClick={() => setShowExportMenu(!showExportMenu)} className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 border border-slate-700 ${showExportMenu ? 'bg-red-500 rotate-45 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}`}>
            {showExportMenu ? <X size={24} /> : <Share2 size={24} />}
         </button>
      </div>
    </div>
  );
}

export default App;
