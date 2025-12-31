
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Volume2, MessageSquare, Loader2 } from 'lucide-react';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

// Correct implementation of manually implemented encoding/decoding as per guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const SamuelVoiceAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<{ text: string; isUser: boolean }[]>([]);
  const [isSamuelSpeaking, setIsSamuelSpeaking] = useState(false);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    setIsConnecting(true);
    try {
      // Create a new instance right before use as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: OUTPUT_SAMPLE_RATE});
      const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: INPUT_SAMPLE_RATE});
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are Samuel, a low-latency AI companion for app builders. Be helpful and brief.',
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inputContext.createMediaStreamSource(streamRef.current!);
            const scriptProcessor = inputContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
               setTranscript(prev => [...prev.slice(-3), { text: message.serverContent!.outputTranscription!.text, isUser: false }]);
            }
            if (message.serverContent?.inputTranscription) {
               setTranscript(prev => [...prev.slice(-3), { text: message.serverContent!.inputTranscription!.text, isUser: true }]);
            }

            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64EncodedAudioString && audioContextRef.current) {
              setIsSamuelSpeaking(true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              const audioBuffer = await decodeAudioData(
                decode(base64EncodedAudioString),
                audioContextRef.current,
                OUTPUT_SAMPLE_RATE,
                1
              );
              const source = audioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContextRef.current.destination);
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
              sourcesRef.current.add(source);
              
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSamuelSpeaking(false);
              };
            }

            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current.values()) {
                source.stop();
                sourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
              setIsSamuelSpeaking(false);
            }
          },
          onclose: () => stopSession()
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    sessionRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-start gap-4 pointer-events-none">
      {isActive && transcript.length > 0 && (
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-3 rounded-2xl shadow-2xl max-w-xs pointer-events-auto">
          <div className="space-y-2">
            {transcript.map((t, i) => (
              <div key={i} className={`text-xs ${t.isUser ? 'text-slate-400 italic' : 'text-blue-200'}`}>
                <span className="font-bold mr-1">{t.isUser ? 'You:' : 'Samuel:'}</span>
                {t.text}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={isActive ? stopSession : startSession}
          disabled={isConnecting}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl ${
            isActive ? 'bg-blue-600 ring-4 ring-blue-500/30' : 'bg-slate-800 hover:bg-slate-700'
          }`}
        >
          {isConnecting ? <Loader2 className="text-blue-400 animate-spin" /> : isActive ? <Volume2 className="text-white" /> : <MessageSquare className="text-slate-400" />}
        </button>
      </div>
    </div>
  );
};

export default SamuelVoiceAssistant;
