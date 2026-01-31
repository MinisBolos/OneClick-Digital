
import React, { useState, useRef, useEffect } from 'react';
import { Product, GeneratedContent } from '../types';
import { LucideArrowLeft, LucideDownload, LucideCopy, LucideShare2, LucideEdit3, LucideCheck, LucideX, LucideImage, LucideUpload, LucideSparkles, LucideLoader, LucideHeadphones, LucidePlay, LucideEye } from 'lucide-react';
import { generateCoverImage, generateSpeech, translateText, refineSalesCopy, generateChapterImage } from '../services/geminiService';

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
  const [aiPrompt, setAiPrompt] = useState(content?.coverImageDescription || '');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Audio State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [selectedLanguage, setSelectedLanguage] = useState(product.language || 'Português');

  // PDF Preview State
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Copy Refinement State
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyInstruction, setCopyInstruction] = useState('');
  const [isRefiningCopy, setIsRefiningCopy] = useState(false);

  // Auto-generate chapter images
  useEffect(() => {
    const generateImages = async () => {
        if (!content || !content.chapters) return;
        
        let hasChanges = false;
        const newChapters = [...content.chapters];

        for (let i = 0; i < newChapters.length; i++) {
            if (newChapters[i].imageDescription && !newChapters[i].imageUrl) {
                try {
                    const imgUrl = await generateChapterImage(newChapters[i].imageDescription);
                    if (imgUrl) {
                        newChapters[i] = { ...newChapters[i], imageUrl: imgUrl };
                        hasChanges = true;
                        
                        const updatedProduct = {
                            ...product,
                            content: {
                                ...content,
                                chapters: newChapters
                            }
                        };
                        onUpdateProduct(updatedProduct);
                    }
                } catch (e) {
                    console.error(`Failed image gen for chapter ${i}`, e);
                }
            }
        }
    };

    generateImages();
  }, []);

  const voices = [
      { name: 'Kore', gender: 'Feminino', style: 'Calmo' },
      { name: 'Puck', gender: 'Masculino', style: 'Energético' },
      { name: 'Charon', gender: 'Masculino', style: 'Profundo' },
      { name: 'Fenrir', gender: 'Masculino', style: 'Autoritário' },
      { name: 'Zephyr', gender: 'Feminino', style: 'Suave' },
  ];

  const languages = ['Português', 'English', 'Spanish', 'French', 'German', 'Italian', 'Japanese'];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format: 'PDF' | 'DOC' | 'MD') => {
    if (!content) return;
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(content, null, 2)], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${content.title ? content.title.replace(/\s+/g, '_') : 'ebook'}_export.${format.toLowerCase()}`;
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

  const handleRefineCopy = async () => {
    if (!copyInstruction || !content?.salesCopy) return;
    setIsRefiningCopy(true);
    try {
        const newCopy = await refineSalesCopy(product.niche, product.targetAudience, content.salesCopy, copyInstruction);
        const updatedProduct = {
            ...product,
            content: {
                ...content,
                salesCopy: newCopy
            }
        };
        onUpdateProduct(updatedProduct);
        setShowCopyModal(false);
        setCopyInstruction('');
    } catch (error) {
        console.error(error);
        alert("Falha ao refinar a copy.");
    } finally {
        setIsRefiningCopy(false);
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
    if (!content?.chapters?.[0]?.content) return;
    setIsGeneratingAudio(true);
    try {
        let textToRead = content.chapters[0].content.slice(0, 500); 
        
        if (selectedLanguage !== product.language) {
          textToRead = await translateText(textToRead, selectedLanguage);
        }

        const audioBuffer = await generateSpeech(textToRead, selectedVoice);
        const blob = new Blob([audioBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
    } catch (e) {
        alert("Falha ao gerar áudio.");
    } finally {
        setIsGeneratingAudio(false);
    }
  };

  if (!product || !content) return <div className="p-10 text-center">Erro ao carregar conteúdo do produto.</div>;

  return (
    <div className="bg-slate-50 min-h-screen relative">
      {/* PDF Preview Modal */}
      {showPdfPreview && (
        <div className="fixed inset-0 z-50 flex justify-center bg-slate-900/90 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
           <div className="fixed top-6 right-6 flex gap-3 z-50">
               <button onClick={() => handleExport('PDF')} className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-slate-100 flex items-center gap-2">
                   <LucideDownload className="w-4 h-4" /> Baixar PDF
               </button>
               <button onClick={() => setShowPdfPreview(false)} className="bg-slate-800 text-white p-2 rounded-full hover:bg-slate-700 shadow-lg">
                   <LucideX className="w-6 h-6" />
               </button>
           </div>
           <div className="bg-white w-[210mm] min-h-[297mm] h-fit shadow-2xl p-[20mm] text-slate-900 relative animate-scale-in origin-top">
                <div className="text-center border-b-2 border-slate-900 pb-12 mb-12">
                    <h1 className="text-4xl font-serif font-bold mb-4">{content.title}</h1>
                    <h2 className="text-xl text-slate-500 font-light">{content.subtitle}</h2>
                </div>
                {content.coverImageUrl && (
                    <div className="mb-12 flex justify-center">
                         <img src={content.coverImageUrl} className="w-[120mm] shadow-2xl rounded-sm object-cover border-l-8 border-slate-900/20" alt="Capa" />
                    </div>
                )}
                <div className="mb-16 text-center text-sm text-slate-400 font-serif italic">
                    Gerado por OneClick Digital • {product.niche} Series
                </div>
                <div className="space-y-16">
                    {content.chapters?.map((chapter, idx) => (
                        <div key={idx}>
                             <h3 className="text-2xl font-serif font-bold mb-6 flex items-baseline gap-3 border-b border-slate-200 pb-2 text-slate-800">
                                <span className="text-4xl text-slate-200 font-sans font-black">{idx + 1}</span>
                                {chapter.title}
                             </h3>
                             {chapter.imageUrl && (
                                <div className="mb-6 float-right ml-6 w-1/3">
                                    <img src={chapter.imageUrl} alt={chapter.title} className="rounded-lg shadow-xl w-full border border-slate-100" />
                                </div>
                             )}
                             <div className="prose prose-slate max-w-none font-serif text-justify leading-loose whitespace-pre-wrap text-lg text-slate-700">
                                 {chapter.content}
                             </div>
                             <div className="clear-both"></div>
                        </div>
                    ))}
                </div>
           </div>
        </div>
      )}

      {/* Copy Refinement Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Gerar Copy de Vendas com IA</h3>
              <button onClick={() => setShowCopyModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <LucideX className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Como você quer melhorar a copy?</label>
                    <textarea value={copyInstruction} onChange={(e) => setCopyInstruction(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-sm leading-relaxed h-32 resize-none" placeholder="Ex: Torne mais persuasiva, foque na dor do cliente, deixe mais curta..." />
                </div>
                <button onClick={handleRefineCopy} disabled={isRefiningCopy || !copyInstruction} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isRefiningCopy ? <LucideLoader className="w-5 h-5 animate-spin" /> : <LucideSparkles className="w-4 h-4" />} {isRefiningCopy ? 'Gerando...' : 'Gerar Nova Copy'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cover Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Atualizar Capa do Produto</h3>
              <button onClick={() => setShowCoverModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <LucideX className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Descrição Fotográfica da Capa</label>
                <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-sm leading-relaxed h-32 resize-none" placeholder="Ex: Fotografia de estúdio de um set de meditação, iluminação zen, ultra detalhado..." />
                <button onClick={handleAiGenerateCover} disabled={isGeneratingImage || !aiPrompt} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {isGeneratingImage ? <LucideLoader className="w-5 h-5 animate-spin" /> : <LucideSparkles className="w-4 h-4" />} Gerar Capa Realista
                </button>
              </div>
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
            <button onClick={() => setShowPdfPreview(true)} className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
              <LucideEye className="w-4 h-4" /> Visualizar PDF
            </button>
            <button className="bg-indigo-600 text-white px-4 py-2 text-sm font-bold rounded-lg hover:bg-indigo-700 transition">
              Publicar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-28">
            {/* Realism Mockup for Cover */}
            <div className="aspect-[3/4] bg-slate-200 rounded-lg mb-6 overflow-hidden relative group shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] perspective-1000">
                <img 
                    src={content.coverImageUrl || `https://picsum.photos/seed/${product.id}/400/600`} 
                    alt="Capa do Livro" 
                    className="w-full h-full object-cover transform transition duration-500 group-hover:scale-105"
                    style={{ borderLeft: '4px solid rgba(0,0,0,0.1)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer" onClick={() => setShowCoverModal(true)}>
                    <button className="text-white font-medium flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                        <LucideEdit3 className="w-4 h-4" /> Editar Capa
                    </button>
                </div>
            </div>
            
            <nav className="space-y-1">
                {['content', 'sales', 'social', 'audio'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition flex items-center justify-between ${activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                        {tab === 'content' && 'Conteúdo do E-Book'}
                        {tab === 'sales' && 'Copy da Página de Vendas'}
                        {tab === 'social' && 'Roteiros de Redes Sociais'}
                        {tab === 'audio' && 'Audiobook (Beta)'}
                        {activeTab === tab && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                    </button>
                ))}
            </nav>
          </div>
        </div>

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
                            {content.chapters?.map((chapter, idx) => (
                                <div key={idx} className="group">
                                    <h4 className="text-xl font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                        <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">{idx + 1}</span>
                                        {chapter.title}
                                    </h4>
                                    {chapter.imageUrl ? (
                                        <div className="mb-6 rounded-xl overflow-hidden shadow-2xl border border-white">
                                            <img src={chapter.imageUrl} alt={chapter.title} className="w-full h-80 object-cover" />
                                        </div>
                                    ) : (
                                        <div className="mb-6 h-24 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                                            <LucideLoader className="w-4 h-4 animate-spin mr-2" /> Gerando fotografia realista...
                                        </div>
                                    )}
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {chapter.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'sales' && content.salesCopy && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                     <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900">Copy de Vendas Premium</h3>
                        <button onClick={() => setShowCopyModal(true)} className="flex items-center gap-1 text-indigo-600 text-sm font-medium hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition">
                            <LucideSparkles className="w-4 h-4" /> Refinar Copy
                        </button>
                     </div>
                     <div className="space-y-6 border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50">
                        <div className="text-center">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">{content.salesCopy.headline}</h2>
                        </div>
                        <ul className="space-y-3 max-w-lg mx-auto">
                            {content.salesCopy.benefits?.map((benefit, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <LucideCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                    <span className="text-slate-700 font-medium">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="text-center pt-6">
                            <button className="bg-yellow-400 text-black px-8 py-4 rounded-full font-bold text-xl hover:bg-yellow-500 transition shadow-xl transform hover:scale-105">
                                {content.salesCopy.cta}
                            </button>
                        </div>
                     </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
