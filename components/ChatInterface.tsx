
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Loader2, Image as ImageIcon, X, Trash2, Cpu } from 'lucide-react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, file?: File) => void;
  isProcessing: boolean;
  selectedFile: File | null;
  onSetFile: (file: File | null) => void;
  onClear: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isProcessing,
  selectedFile,
  onSetFile,
  onClear
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if ((inputText.trim() || selectedFile) && !isProcessing) {
      onSendMessage(inputText, selectedFile || undefined);
      setInputText('');
      onSetFile(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      if (!isListening) {
        recognition.start();
        setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(prev => prev + ' ' + transcript);
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
      } else {
        recognition.stop();
        setIsListening(false);
      }
    } else {
      alert("Voice input not supported in this browser.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 z-20 shadow-sm h-16">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-slate-200 font-semibold leading-none">
             <Cpu size={18} className="text-blue-500" />
             <span>A²Z AppZ</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium ml-6 mt-0.5">by Mitchell</span>
        </div>
        <button 
            onClick={onClear}
            className="p-2 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
            title="Start New Project"
        >
            <Trash2 size={14} />
            <span>New App</span>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8 opacity-60">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                    <Paperclip size={24} className="text-blue-400" />
                </div>
                <h1 className="text-xl font-bold text-slate-200 mb-0.5">A²Z AppZ</h1>
                <p className="text-xs text-slate-400 mb-2 font-medium">by Mitchell</p>
                <p className="text-sm">Ready to architect your application.</p>
                <div className="text-xs mt-6 space-y-2 max-w-xs mx-auto text-slate-400">
                    <p>• "Create a weather app using open APIs"</p>
                    <p>• "Build a file converter with drag & drop"</p>
                    <p>• "Scan my requirements and export APK"</p>
                </div>
            </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
              }`}
            >
              {msg.attachment && (
                <div className="mb-2 rounded overflow-hidden border border-white/20">
                  <img src={msg.attachment.data} alt="Attachment" className="max-h-40 object-cover" />
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
              <div className="text-[10px] opacity-40 mt-1 text-right font-mono">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-700 shadow-md">
              <div className="flex gap-2 items-center text-blue-400 text-sm">
                <Loader2 className="animate-spin" size={16} />
                <span className="font-medium">Architecting Solution...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-10">
        
        {selectedFile && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-blue-900/20 rounded border border-blue-800/50 w-fit animate-in slide-in-from-bottom-2">
                <ImageIcon size={14} className="text-blue-400" />
                <span className="text-xs text-blue-200 max-w-[150px] truncate">{selectedFile.name}</span>
                <button onClick={() => onSetFile(null)} className="text-slate-500 hover:text-red-400 ml-2">
                    <X size={14} />
                </button>
            </div>
        )}

        <div className="flex gap-2 items-end">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    if (e.target.files?.[0]) onSetFile(e.target.files[0]);
                }}
            />
            
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700 hover:border-slate-600 shadow-sm"
                title="Upload App Icon / Reference"
            >
                <ImageIcon size={20} />
            </button>

            <button
                onClick={toggleVoice}
                className={`p-3 rounded-xl transition-all border shadow-sm ${
                    isListening 
                    ? 'bg-red-500/10 text-red-500 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700 hover:border-slate-600'
                }`}
                title="Voice Input"
            >
                <Mic size={20} className={isListening ? 'animate-pulse' : ''} />
            </button>

            <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors flex items-center p-1 shadow-inner focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20">
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your app features..."
                    className="w-full bg-transparent text-slate-200 p-3 max-h-32 min-h-[44px] focus:outline-none resize-none text-sm placeholder:text-slate-600"
                    rows={1}
                />
                <button
                    onClick={handleSend}
                    disabled={(!inputText.trim() && !selectedFile) || isProcessing}
                    className="p-2 mr-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-blue-500/20"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
