import React, { useState, useRef } from 'react';
import { Product, GeneratedContent } from '../types';
import { LucideArrowLeft, LucideDownload, LucideCopy, LucideShare2, LucideEdit3, LucideCheck, LucideX, LucideImage, LucideUpload, LucideSparkles, LucideLoader, LucideHeadphones, LucidePlay } from 'lucide-react';
import { generateCoverImage, generateSpeech } from '../services/geminiService';

interface ProductViewProps {
  product: Product;
  onBack: () => void;
  onUpdateProduct: (product: Product) => void;
}

export const ProductView: React.FC<ProductViewProps> = ({ product, onBack, onUpdateProduct }) => {
  const content = product.content as GeneratedContent;
  const [activeTab, setActiveTab] = useState<'content' | 'sales' | 'social' | 'audio'>('content');
  const [copied, setCopied] = useState(false);
  
  // Edit Cover Modal State
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [modalTab, setModalTab] = useState<'ai' | 'upload'>('ai');
  const [aiPrompt, setAiPrompt] = useState(content.coverImageDescription || '');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Audio State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format: 'PDF' | 'DOC' | 'MD') => {
    // Simulation of export
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(content, null, 2)], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${content.title.replace(/\s+/g, '_')}_export.${format.toLowerCase()}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleAiGenerateCover = async () => {
    if (!aiPrompt) return;
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateCoverImage(aiPrompt);
      const updatedProduct = {
        ...product,
        content: {
          ...content,
          coverImageUrl: imageUrl
        }
      };
      onUpdateProduct(updatedProduct);
      setShowCoverModal(false);
    } catch (error) {
      console.error("Falha ao gerar capa:", error);
      alert("Falha ao gerar imagem. Por favor, tente novamente.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        const updatedProduct = {
            ...product,
            content: {
              ...content,
              coverImageUrl: imageUrl
            }
        };
        onUpdateProduct(updatedProduct);
        setShowCoverModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true);
    try {
        // Combine first chapter for demo
        const textToRead = content.chapters[0].content.slice(0, 500); // Limit length for demo speed
        const audioBuffer = await generateSpeech(textToRead);
        const blob = new Blob([audioBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
    } catch (e) {
        alert("Falha ao gerar áudio.");
    } finally {
        setIsGeneratingAudio(false);
    }
  };

  if (!content) return <div>Erro ao carregar conteúdo</div>;

  return (
    <div className="bg-slate-50 min-h-screen relative">
      {/* Edit Cover Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Atualizar Capa do Produto</h3>
              <button 
                onClick={() => setShowCoverModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <LucideX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-2 bg-slate-50 flex border-b border-slate-100">
              <button 
                onClick={() => setModalTab('ai')}
                className={`flex-1 py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition ${modalTab === 'ai' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LucideSparkles className="w-4 h-4" /> Geração IA
              </button>
              <button 
                onClick={() => setModalTab('upload')}
                className={`flex-1 py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition ${modalTab === 'upload' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LucideUpload className="w-4 h-4" /> Carregar Imagem
              </button>
            </div>

            <div className="p-6">
              {modalTab === 'ai' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Descrição da Capa</label>
                    <textarea 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-sm leading-relaxed h-32 resize-none"
                      placeholder="Descreva a imagem de capa que você deseja..."
                    />
                  </div>
                  <button 
                    onClick={handleAiGenerateCover}
                    disabled={isGeneratingImage || !aiPrompt}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGeneratingImage ? (
                      <>
                        <LucideLoader className="w-5 h-5 animate-spin" /> Gerando...
                      </>
                    ) : (
                      <>
                        Gerar Capa <LucideSparkles className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-400 transition cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LucideImage className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Clique para Carregar</h4>
                  <p className="text-slate-500 text-sm mb-4">SVG, PNG, JPG (máx. 5MB)</p>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden" 
                    accept="image/*"
                  />
                  <button className="text-indigo-600 font-medium hover:underline text-sm">Procurar Arquivos</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition">
              <LucideArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 truncate max-w-md">{content.title}</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleExport('PDF')}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            >
              <LucideDownload className="w-4 h-4" /> Exportar PDF
            </button>
            <button className="bg-indigo-600 text-white px-4 py-2 text-sm font-bold rounded-lg hover:bg-indigo-700 transition">
              Publicar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Sidebar - Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-28">
            <div className="aspect-[3/4] bg-slate-100 rounded-lg mb-6 overflow-hidden relative group">
                <img 
                    src={content.coverImageUrl || `https://picsum.photos/seed/${product.id}/400/600`} 
                    alt="Capa do Livro" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer" onClick={() => setShowCoverModal(true)}>
                    <button className="text-white font-medium flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                        <LucideEdit3 className="w-4 h-4" /> Editar Capa
                    </button>
                </div>
            </div>
            
            <nav className="space-y-1">
                <button 
                    onClick={() => setActiveTab('content')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition flex items-center justify-between ${activeTab === 'content' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    Conteúdo do E-Book
                    {activeTab === 'content' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('sales')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition flex items-center justify-between ${activeTab === 'sales' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    Copy da Página de Vendas
                    {activeTab === 'sales' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('social')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition flex items-center justify-between ${activeTab === 'social' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    Roteiros de Redes Sociais
                    {activeTab === 'social' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('audio')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition flex items-center justify-between ${activeTab === 'audio' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    Audiobook (Beta)
                    {activeTab === 'audio' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                </button>
            </nav>

             <div className="mt-8 pt-8 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Detalhes do Produto</h4>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Idioma</span>
                        <span className="text-slate-900 font-medium">{product.language}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Plataforma</span>
                        <span className="text-slate-900 font-medium">{product.platform}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Nicho</span>
                        <span className="text-slate-900 font-medium truncate max-w-[150px]">{product.niche}</span>
                    </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-2 space-y-6">
            
            {activeTab === 'content' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <div className="text-center mb-10 pb-8 border-b border-slate-100">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">{content.title}</h2>
                        <h3 className="text-xl text-slate-500 font-light">{content.subtitle}</h3>
                    </div>
                    
                    <div className="prose prose-slate max-w-none">
                        <p className="lead text-lg text-slate-600 italic mb-8 border-l-4 border-indigo-500 pl-4 bg-slate-50 py-4 pr-4 rounded-r-lg">
                            {content.description}
                        </p>

                        <div className="space-y-8">
                            {content.chapters.map((chapter, idx) => (
                                <div key={idx} className="group">
                                    <h4 className="text-xl font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                        <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">{idx + 1}</span>
                                        {chapter.title}
                                    </h4>
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {chapter.content}
                                    </div>
                                    <div className="mt-2 text-right opacity-0 group-hover:opacity-100 transition">
                                         <button onClick={() => handleCopy(chapter.content)} className="text-xs font-medium text-slate-400 hover:text-indigo-600 flex items-center gap-1 justify-end ml-auto">
                                            {copied ? <LucideCheck className="w-3 h-3"/> : <LucideCopy className="w-3 h-3" />}
                                            {copied ? 'Copiado' : 'Copiar Texto'}
                                         </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'sales' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                     <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900">Página de Vendas de Alta Conversão</h3>
                        <button onClick={() => handleCopy(JSON.stringify(content.salesCopy, null, 2))} className="text-indigo-600 text-sm font-medium hover:underline">Copiar Tudo</button>
                     </div>

                     <div className="space-y-6 border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50">
                        {/* Headline */}
                        <div className="text-center">
                            <span className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-2 block">Manchete</span>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">{content.salesCopy.headline}</h2>
                        </div>

                        {/* Benefits */}
                        <div className="py-8">
                            <span className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-4 block text-center">Benefícios Chave</span>
                            <ul className="space-y-3 max-w-lg mx-auto">
                                {content.salesCopy.benefits.map((benefit, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <LucideCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-700 font-medium">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* CTA */}
                        <div className="text-center pt-6">
                            <span className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-4 block">Chamada para Ação</span>
                            <button className="bg-yellow-400 text-black px-8 py-4 rounded-full font-bold text-xl hover:bg-yellow-500 transition shadow-lg transform hover:scale-105 duration-200">
                                {content.salesCopy.cta}
                            </button>
                        </div>
                     </div>
                </div>
            )}

            {activeTab === 'social' && (
                <div className="space-y-6">
                     <h3 className="text-xl font-bold text-slate-900 px-2">Roteiros de Vídeos Virais</h3>
                     <div className="grid gap-6">
                         {content.socialScripts.map((item, idx) => (
                             <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                 <div className="flex items-center justify-between mb-4">
                                     <div className="flex items-center gap-2">
                                         <div className="bg-pink-100 text-pink-600 p-2 rounded-lg">
                                             <LucideShare2 className="w-4 h-4" />
                                         </div>
                                         <span className="font-bold text-slate-900">{item.platform}</span>
                                     </div>
                                     <button onClick={() => handleCopy(item.script)} className="text-slate-400 hover:text-indigo-600 transition">
                                         <LucideCopy className="w-4 h-4" />
                                     </button>
                                 </div>
                                 <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-sm whitespace-pre-wrap">
                                     {item.script}
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>
            )}

            {activeTab === 'audio' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center">
                    <div className="bg-indigo-100 p-4 rounded-full text-indigo-600 mb-4">
                        <LucideHeadphones className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Gerar Audiobook</h3>
                    <p className="text-slate-500 max-w-md mb-8">
                        Transforme seu primeiro capítulo em uma narração de áudio profissional usando Gemini 2.5 TTS.
                    </p>
                    
                    {!audioUrl ? (
                        <button 
                            onClick={handleGenerateAudio}
                            disabled={isGeneratingAudio}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition flex items-center gap-2"
                        >
                            {isGeneratingAudio ? (
                                <>
                                    <LucideLoader className="w-5 h-5 animate-spin" /> Gerando Áudio...
                                </>
                            ) : (
                                <>
                                    <LucidePlay className="w-5 h-5" /> Gerar Capítulo de Amostra
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="w-full max-w-md p-4 bg-slate-50 rounded-xl border border-slate-200">
                             <audio controls src={audioUrl} className="w-full" />
                             <button onClick={() => setAudioUrl(null)} className="text-sm text-slate-400 mt-2 hover:text-indigo-600">Gerar Novo</button>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};