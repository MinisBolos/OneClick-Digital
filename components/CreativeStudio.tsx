import React, { useState, useRef } from 'react';
import { LucideVideo, LucideImage, LucideMic, LucideWand2, LucideLoader, LucideUpload, LucidePlay } from 'lucide-react';
import { generateVideo, generateProImage, editImage, analyzeImage } from '../services/geminiService';
import { LiveSession } from './LiveSession';

export const CreativeStudio: React.FC = () => {
    const [activeTool, setActiveTool] = useState<'veo' | 'image' | 'edit' | 'analyze'>('veo');
    const [showLive, setShowLive] = useState(false);
    
    // States for forms
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [imageSize, setImageSize] = useState('1K');
    
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSelectedFile(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleAction = async () => {
        if (!prompt && activeTool !== 'analyze') return;
        setLoading(true);
        setResult(null);

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
            }
        } catch (e) {
            alert('A operação falhou. Verifique o console ou as permissões da chave API.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            {showLive && <LiveSession onClose={() => setShowLive(false)} />}
            
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Estúdio Criativo</h1>
                    <p className="text-slate-500">Ferramentas avançadas de IA para criação multimídia.</p>
                </div>
                <button 
                    onClick={() => setShowLive(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2 animate-pulse"
                >
                    <LucideMic className="w-5 h-5" /> Iniciar Brainstorm ao Vivo
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col md:flex-row">
                {/* Tools Sidebar */}
                <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col gap-2">
                    <button onClick={() => {setActiveTool('veo'); setResult(null); setSelectedFile(null);}} className={`p-4 rounded-xl text-left font-medium transition flex items-center gap-3 ${activeTool === 'veo' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-200 text-slate-600'}`}>
                        <LucideVideo className="w-5 h-5" /> Vídeo Veo
                    </button>
                    <button onClick={() => {setActiveTool('image'); setResult(null); setSelectedFile(null);}} className={`p-4 rounded-xl text-left font-medium transition flex items-center gap-3 ${activeTool === 'image' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-200 text-slate-600'}`}>
                        <LucideImage className="w-5 h-5" /> Geração Imagem Pro
                    </button>
                    <button onClick={() => {setActiveTool('edit'); setResult(null); setSelectedFile(null);}} className={`p-4 rounded-xl text-left font-medium transition flex items-center gap-3 ${activeTool === 'edit' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-200 text-slate-600'}`}>
                        <LucideWand2 className="w-5 h-5" /> Edição Mágica
                    </button>
                    <button onClick={() => {setActiveTool('analyze'); setResult(null); setSelectedFile(null);}} className={`p-4 rounded-xl text-left font-medium transition flex items-center gap-3 ${activeTool === 'analyze' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-200 text-slate-600'}`}>
                        <LucideLoader className="w-5 h-5" /> Análise de Imagem
                    </button>
                </div>

                {/* Workspace */}
                <div className="flex-1 p-8">
                    <div className="max-w-2xl mx-auto">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                {activeTool === 'veo' && 'Gerador de Vídeo Veo'}
                                {activeTool === 'image' && 'Estúdio de Imagem Pro'}
                                {activeTool === 'edit' && 'Editor de Imagem Mágico'}
                                {activeTool === 'analyze' && 'Inteligência Visual'}
                            </h2>
                            <p className="text-slate-500 text-sm">
                                {activeTool === 'veo' && 'Crie vídeos em 720p/1080p a partir de texto ou anime imagens.'}
                                {activeTool === 'image' && 'Gere imagens em 1K, 2K ou 4K com proporções específicas.'}
                                {activeTool === 'edit' && 'Edite imagens usando comandos em linguagem natural.'}
                                {activeTool === 'analyze' && 'Extraia insights e descrições de imagens.'}
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* File Upload for tools that need it */}
                            {(activeTool === 'veo' || activeTool === 'edit' || activeTool === 'analyze') && (
                                <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition bg-slate-50">
                                    <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                                    {selectedFile ? (
                                        <div className="relative h-48 mx-auto w-fit">
                                            <img src={selectedFile} className="h-full rounded-lg shadow-md object-contain" alt="Upload" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition rounded-lg text-white font-bold">Trocar Imagem</div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-500">
                                            <LucideUpload className="w-8 h-8 mb-2" />
                                            <span className="font-medium">Clique para carregar uma imagem</span>
                                            <span className="text-xs">{activeTool === 'veo' ? '(Opcional para vídeo)' : '(Obrigatório)'}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Prompt Input */}
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={activeTool === 'analyze' ? "O que devo procurar? (Opcional)" : "Descreva o que você quer criar..."}
                                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none h-32 resize-none"
                            />

                            {/* Configs */}
                            <div className="flex flex-wrap gap-4">
                                {(activeTool === 'veo' || activeTool === 'image') && (
                                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="p-3 border rounded-lg bg-white">
                                        <option value="16:9">16:9 Paisagem</option>
                                        <option value="9:16">9:16 Retrato</option>
                                        <option value="1:1">1:1 Quadrado</option>
                                        <option value="4:3">4:3 Padrão</option>
                                    </select>
                                )}
                                {activeTool === 'image' && (
                                    <select value={imageSize} onChange={(e) => setImageSize(e.target.value)} className="p-3 border rounded-lg bg-white">
                                        <option value="1K">Resolução 1K</option>
                                        <option value="2K">Resolução 2K</option>
                                        <option value="4K">Resolução 4K</option>
                                    </select>
                                )}
                                
                                <button 
                                    onClick={handleAction}
                                    disabled={loading || (activeTool !== 'analyze' && !prompt) || ((activeTool === 'edit' || activeTool === 'analyze') && !selectedFile)}
                                    className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <LucideLoader className="animate-spin" /> : <LucidePlay className="w-4 h-4" />}
                                    {loading ? 'Processando...' : 'Gerar'}
                                </button>
                            </div>
                        </div>

                        {/* Result Area */}
                        {result && (
                            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
                                <h3 className="font-bold mb-4 text-slate-900">Resultado:</h3>
                                {activeTool === 'analyze' ? (
                                    <p className="whitespace-pre-wrap text-slate-700">{result}</p>
                                ) : activeTool === 'veo' ? (
                                    <video src={result} controls className="w-full rounded-lg shadow-lg" />
                                ) : (
                                    <img src={result} alt="Gerado" className="w-full rounded-lg shadow-lg" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};