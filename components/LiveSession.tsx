import React, { useEffect, useRef, useState } from 'react';
import { getLiveClient } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';
import { LucideMic, LucideMicOff, LucideX, LucideAudioWaveform } from 'lucide-react';

interface LiveSessionProps {
    onClose: () => void;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState('Desconectado');
    const [isMuted, setIsMuted] = useState(false);
    
    // Audio Context Refs
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    useEffect(() => {
        return () => {
            handleDisconnect();
        };
    }, []);

    const handleConnect = async () => {
        setStatus('Conectando...');
        try {
            const liveClient = getLiveClient();
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            sessionPromiseRef.current = liveClient.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('Conectado');
                        setIsActive(true);
                        
                        // Setup Input Stream
                        const ctx = inputAudioContextRef.current!;
                        const source = ctx.createMediaStreamSource(stream);
                        const processor = ctx.createScriptProcessor(4096, 1, 1);
                        
                        processor.onaudioprocess = (e) => {
                            if (isMuted) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        source.connect(processor);
                        processor.connect(ctx.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            playAudio(base64Audio);
                        }
                        
                        if (msg.serverContent?.interrupted) {
                            stopAudio();
                        }
                    },
                    onclose: () => {
                        setStatus('Desconectado');
                        setIsActive(false);
                    },
                    onerror: (err) => {
                        console.error(err);
                        setStatus('Erro');
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                    }
                }
            });

        } catch (e) {
            console.error(e);
            setStatus('Falha na Conexão');
        }
    };

    const handleDisconnect = () => {
        sessionPromiseRef.current?.then(session => session.close());
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        stopAudio();
        setIsActive(false);
        setStatus('Desconectado');
    };

    const playAudio = async (base64: string) => {
        const ctx = outputAudioContextRef.current;
        if (!ctx) return;

        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Manual Decode (PCM 24k)
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        
        const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;
        
        sourcesRef.current.add(source);
        source.onended = () => sourcesRef.current.delete(source);
    };

    const stopAudio = () => {
        sourcesRef.current.forEach(s => s.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    };

    const createBlob = (data: Float32Array) => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        let binary = '';
        const bytes = new Uint8Array(int16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return {
            data: btoa(binary),
            mimeType: 'audio/pcm;rate=16000'
        };
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 w-full max-w-md rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"></div>
                
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                    <LucideX className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center py-8">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${isActive ? 'bg-indigo-600 shadow-[0_0_50px_rgba(79,70,229,0.5)] scale-105' : 'bg-slate-800'}`}>
                         {isActive ? (
                             <LucideAudioWaveform className="w-16 h-16 animate-pulse text-white" />
                         ) : (
                             <LucideMicOff className="w-12 h-12 text-slate-500" />
                         )}
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-2">Brainstorm ao Vivo</h2>
                    <p className="text-slate-400 mb-8">{status}</p>

                    {!isActive ? (
                        <button 
                            onClick={handleConnect}
                            className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition w-full"
                        >
                            Iniciar Sessão
                        </button>
                    ) : (
                        <div className="flex gap-4 w-full">
                            <button 
                                onClick={() => setIsMuted(!isMuted)}
                                className={`flex-1 py-3 rounded-full font-bold transition flex items-center justify-center gap-2 ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 hover:bg-slate-700'}`}
                            >
                                {isMuted ? <LucideMicOff className="w-4 h-4" /> : <LucideMic className="w-4 h-4" />}
                                {isMuted ? 'Mudo' : 'Mutar'}
                            </button>
                            <button 
                                onClick={handleDisconnect}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-full font-bold transition"
                            >
                                Encerrar
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="text-center text-xs text-slate-500 mt-4">
                    Powered by Gemini 2.5 Native Audio
                </div>
            </div>
        </div>
    );
};