
import React, { useState, useRef } from 'react';
import { LucideVideo, LucideImage, LucideMic, LucideWand2, LucideLoader, LucideUpload, LucidePlay, LucideHistory, LucideArrowRight, LucideKey } from 'lucide-react';
import { generateVideo, generateProImage, editImage, analyzeImage, extendVideo } from '../services/geminiService';
import { LiveSession } from './LiveSession';

export const CreativeStudio: React.FC = () => {
    const [activeTool, setActiveTool] = useState<'veo' | 'image' | 'edit' | 'analyze' | 'extend'>('veo');
    const [showLive, setShowLive] = useState(false);
    
    // States for forms
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [imageSize, setImageSize] = useState('1K');
    
    const fileRef = useRef<HTMLInputElement>(null);

    const reassuringMessages = [
        "Iniciando motores de renderização...",
        "Ajustando iluminação e sombras cinemáticas...",
        "Sincronizando pixels de alta definição...",
        "Quase lá! Finalizando a compressão do vídeo...",
        "Polindo os últimos detalhes para você..."
    ];

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSelectedFile(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSelectKey = async () => {
        // @ts-ignore
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            // @ts-ignore
            await window.aistudio.openSelectKey();
        }
    };

    const handleAction = async () => {
        if (!prompt && activeTool !== 'analyze') return;
        setLoading(true);
        setResult(null);

        let msgIdx = 0;
        const msgInterval = setInterval(() => {
            setLoadingMsg(reassuringMessages[msgIdx % reassuringMessages.length]);
            msgIdx++;
        }, 5000);

        try {
            if (activeTool === 'veo') {
                const videoUrl = await generateVideo(prompt, selectedFile || undefined, aspectRatio as any);
                setResult(videoUrl);
            } else if (activeTool === 'image') {
                const imgUrl = await generateProImage(prompt, aspectRatio, imageSize);
                setResult(imgUrl);
            } else if (activeTool === 'edit' && selectedFile) {
                const imgUrl = await editImage(selectedFile, prompt);
                setResult(imgUrl);
            } else if (activeTool === 'analyze' && selectedFile) {
                const analysis = await analyzeImage(selectedFile, prompt || "Analise esta imagem em detalhes.");
                setResult(analysis);
            } else if (activeTool === 'extend' && result) {
                const extendedUrl = await extendVideo(prompt, result, aspectRatio as any);
                setResult(extendedUrl);
            }
        } catch (e: any) {
            console.error(e);
            const isHandled = e?.message?.includes('403') || e?.message?.includes('PERMISSION_DENIED');
            if (!isHandled) {
                alert('A operação falhou. Verifique sua chave API (é necessário um projeto com faturamento para modelos avançados como Veo).');
            }
        } finally {
            clearInterval(msgInterval);
            setLoading(false);
            setLoadingMsg('');
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            {showLive && <LiveSession onClose={() => setShowLive(false)} />}
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Estúdio Criativo</h1>
                    <p className="text-slate-500 mt-1">Gere ativos de marketing de nível mundial em segundos.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleSelectKey}
                        className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-full font-bold shadow-sm hover:bg-slate-50 transition flex items-center gap-2"
                    >
                        <LucideKey className="w-5 h-5" /> Configurar API
                    </button>
                    <button 
                        onClick={() => setShowLive(true)}
                        className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:bg-indigo-600 transition flex items-center gap-2 group"
                    >
                        <LucideMic className="w-5 h-5 group-hover:animate-pulse" /> Brainstorm ao Vivo
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[700px]">
                {/* Tools Sidebar */}
                <div className="w-full md:w-72 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Ferramentas</h3>
                    {[
                        { id: 'veo', label: 'Vídeo Veo', icon: LucideVideo },
                        { id: 'image', label: 'Imagem Pro', icon: LucideImage },
                        { id: 'edit', label: 'Edição Mágica', icon: LucideWand2 },
                        { id: 'analyze', label: 'Análise Visual', icon: LucideLoader },
                        { id: 'extend', label: 'Estender Vídeo', icon: LucideHistory, disabled: !result?.includes('video') }
                    ].map((tool: any) => (
                        <button 
                            key={tool.id}
                            disabled={tool.disabled}
                            onClick={() => {setActiveTool(tool.id); setResult(null); setSelectedFile(null); setPrompt('');}} 
                            className={`p-4 rounded-2xl text-left font-semibold transition flex items-center gap-4 ${activeTool === tool.id ? 'bg-white shadow-md text-indigo-600' : 'hover:bg-slate-200/50 text-slate-600 disabled:opacity-30'}`}
                        >
                            <tool.icon className="w-5 h-5" /> {tool.label}
                        </button>
                    ))}
                </div>

                {/* Workspace */}
                <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
                    <div className="max-w-3xl mx-auto">
                        <header className="mb-10">
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                                {activeTool === 'veo' && 'Gerador de Vídeo Veo'}
                                {activeTool === 'image' && 'Estúdio de Imagem Pro'}
                                {activeTool === 'edit' && 'Editor de Imagem Mágico'}
                                {activeTool === 'analyze' && 'Inteligência Visual'}
                                {activeTool === 'extend' && 'Expansão de Vídeo IA'}
                            </h2>
                            <p className="text-slate-500 text-lg">
                                {activeTool === 'veo' && 'Transforme prompts em vídeos cinematográficos de alta fidelidade.'}
                                {activeTool === 'image' && 'Qualidade de nível agência em 1K, 2K ou 4K.'}
                                {activeTool === 'edit' && 'Reimagine suas imagens com linguagem natural.'}
                                {activeTool === 'analyze' && 'Entenda o contexto, objetos e sentimentos em qualquer foto.'}
                                {activeTool === 'extend' && 'Adicione mais 7 segundos de ação ao seu vídeo gerado.'}
                            </p>
                        </header>

                        <div className="space-y-8">
                            {/* File Upload Area */}
                            {(activeTool === 'veo' || activeTool === 'edit' || activeTool === 'analyze') && (
                                <div 
                                    onClick={() => fileRef.current?.click()} 
                                    className="group border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300"
                                >
                                    <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                                    {selectedFile ? (
                                        <div className="relative max-h-64 mx-auto w-fit overflow-hidden rounded-2xl shadow-xl">
                                            <img src={selectedFile} className="h-full w-auto object-contain" alt="Upload" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition duration-300 text-white font-bold backdrop-blur-sm">Trocar Ativo</div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-indigo-600">
                                            <div className="bg-slate-100 p-5 rounded-full group-hover:bg-indigo-100 transition">
                                                <LucideUpload className="w-8 h-8" />
                                            </div>
                                            <span className="font-bold text-lg">Carregar imagem de referência</span>
                                            <span className="text-sm opacity-60">{activeTool === 'veo' ? '(Opcional: use como primeiro frame)' : '(Obrigatório para processamento)'}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Prompt Input */}
                            <div className="relative">
                                <label className="block text-sm font-bold text-slate-700 mb-3 ml-1 uppercase tracking-wider">Seu Comando Criativo</label>
                                <textarea 
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={activeTool === 'analyze' ? "O que você quer saber sobre a imagem?" : "Ex: Um robô cyberpunk andando em uma Tóquio chuvosa, luzes neon refletindo nas poças..."}
                                    className="w-full p-6 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none h-40 resize-none text-lg leading-relaxed shadow-sm transition-all"
                                />
                            </div>

                            {/* Configs Row */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                {(activeTool === 'veo' || activeTool === 'image' || activeTool === 'extend') && (
                                    <div className="flex-1">
                                         <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Formato</label>
                                         <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl bg-white font-medium shadow-sm outline-none focus:border-indigo-500 transition">
                                            <option value="16:9">16:9 Landscape</option>
                                            <option value="9:16">9:16 Portrait</option>
                                            <option value="1:1">1:1 Square</option>
                                            <option value="4:3">4:3 Standard</option>
                                        </select>
                                    </div>
                                )}
                                {activeTool === 'image' && (
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Resolução</label>
                                        <select value={imageSize} onChange={(e) => setImageSize(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl bg-white font-medium shadow-sm outline-none focus:border-indigo-500 transition">
                                            <option value="1K">1K High Def</option>
                                            <option value="2K">2K Ultra HD</option>
                                            <option value="4K">4K Extreme Quality</option>
                                        </select>
                                    </div>
                                )}
                                
                                <div className="flex-1 flex flex-col justify-end">
                                    <button 
                                        onClick={handleAction}
                                        disabled={loading || (activeTool !== 'analyze' && !prompt) || ((activeTool === 'edit' || activeTool === 'analyze') && !selectedFile)}
                                        className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                                    >
                                        {loading ? <LucideLoader className="animate-spin w-6 h-6" /> : <LucidePlay className="w-6 h-6" />}
                                        {loading ? 'Criando Mágica...' : (activeTool === 'extend' ? 'Estender Vídeo' : 'Gerar Agora')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Result Display Area */}
                        {(result || loading) && (
                            <div className="mt-12 p-8 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner min-h-[300px] flex flex-col items-center justify-center">
                                {loading ? (
                                    <div className="text-center animate-fade-in">
                                        <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-200 animate-bounce">
                                            <LucideWand2 className="w-10 h-10 text-white" />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-900 mb-2">Processando Requisição...</h4>
                                        <p className="text-slate-500 italic">{loadingMsg || "Isso pode levar alguns minutos para vídeos de alta qualidade."}</p>
                                    </div>
                                ) : (
                                    <div className="w-full animate-scale-in">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-black text-2xl text-slate-900">Resultado Final</h3>
                                            <div className="flex gap-2">
                                                {activeTool === 'veo' && (
                                                    <button 
                                                        onClick={() => setActiveTool('extend')}
                                                        className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-full transition flex items-center gap-2"
                                                    >
                                                        <LucideHistory className="w-4 h-4" /> Estender +7s
                                                    </button>
                                                )}
                                                <a href={result!} download="oneclick-studio-export" className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-slate-50 transition">
                                                    Download
                                                </a>
                                            </div>
                                        </div>
                                        
                                        <div className="rounded-