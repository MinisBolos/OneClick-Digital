
import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Wizard } from './components/Wizard';
import { ProductView } from './components/ProductView';
import { CreativeStudio } from './components/CreativeStudio';
import { AppView, Product, WizardState } from './types';
import { generateDigitalProduct } from './services/geminiService';
import { LucideLayoutDashboard, LucideLogOut, LucideSettings, LucideWand2, LucideKey, LucideExternalLink, LucideAlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Load products from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('oneclick_products');
    if (saved) {
      setProducts(JSON.parse(saved));
    }
  }, []);

  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('oneclick_products', JSON.stringify(newProducts));
  };

  const handleCreateProduct = async (wizardData: WizardState) => {
    setIsGenerating(true);
    setGlobalError(null);
    try {
      const generatedContent = await generateDigitalProduct(wizardData);
      
      const newProduct: Product = {
        ...wizardData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        status: 'completed',
        content: generatedContent
      };

      const updatedProducts = [newProduct, ...products];
      saveProducts(updatedProducts);
      setSelectedProduct(newProduct);
      setCurrentView('product-detail');
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.message || "";
      const isHandled = errorMsg.includes('403') || errorMsg.includes('PERMISSION_DENIED') || errorMsg.includes('Requested entity');
      
      if (isHandled) {
        setGlobalError("Acesso negado. Os modelos avançados (Gemini 3 Pro) requerem uma chave de API de um projeto com faturamento ativado.");
      } else {
        alert("Falha ao gerar o produto. Por favor, verifique sua conexão e tente novamente.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const updatedList = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    saveProducts(updatedList);
    setSelectedProduct(updatedProduct);
  };

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onGetStarted={() => setCurrentView('dashboard')} />;
      
      case 'dashboard':
        return (
          <Dashboard 
            products={products}
            onCreateNew={() => setCurrentView('wizard')}
            onViewProduct={(p) => {
              setSelectedProduct(p);
              setCurrentView('product-detail');
            }}
          />
        );
      
      case 'studio':
        return <CreativeStudio />;

      case 'wizard':
        return (
          <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
             <div className="w-full max-w-7xl mb-8 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
                    &larr; Voltar ao Painel
                </div>
                <button 
                  onClick={handleSelectKey}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  <LucideKey className="w-4 h-4" /> Configurar Chave API
                </button>
             </div>
             
             {globalError && (
               <div className="w-full max-w-2xl mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 animate-fade-in">
                  <LucideAlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-900">{globalError}</p>
                    <button onClick={handleSelectKey} className="text-xs text-red-600 underline font-bold mt-1">Trocar Chave de API Agora</button>
                  </div>
               </div>
             )}

             <Wizard 
               onComplete={handleCreateProduct}
               onCancel={() => setCurrentView('dashboard')}
               isGenerating={isGenerating}
             />
          </div>
        );

      case 'product-detail':
        return selectedProduct ? (
          <ProductView 
            product={selectedProduct} 
            onBack={() => setCurrentView('dashboard')} 
            onUpdateProduct={handleUpdateProduct}
          />
        ) : (
          <Dashboard products={products} onCreateNew={() => setCurrentView('wizard')} onViewProduct={() => {}} />
        );

      default:
        return <div>Não encontrado</div>;
    }
  };

  // Simplified Layout Wrapper for internal pages
  if (currentView === 'landing') return renderContent();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
       {/* Sidebar for Desktop */}
       {currentView !== 'wizard' && currentView !== 'product-detail' && (
         <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
            <div className="p-6">
                <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">OC</div>
                    OneClick
                </div>
            </div>
            
            <nav className="flex-1 px-4 space-y-2">
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg w-full transition ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <LucideLayoutDashboard className="w-5 h-5" /> Painel
                </button>
                
                <button 
                  onClick={() => setCurrentView('studio')}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg w-full transition ${currentView === 'studio' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <LucideWand2 className="w-5 h-5" /> Estúdio Criativo
                </button>

                 <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg w-full transition">
                    <LucideSettings className="w-5 h-5" /> Configurações
                </button>

                <div className="pt-4 mt-4 border-t border-slate-100">
                    <button 
                      onClick={handleSelectKey}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg w-full transition"
                    >
                        <LucideKey className="w-5 h-5" /> Configurar API
                    </button>
                    <a 
                      href="https://ai.google.dev/gemini-api/docs/billing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 text-xs font-medium text-slate-400 hover:text-slate-600 transition"
                    >
                        <LucideExternalLink className="w-4 h-4" /> Info Faturamento
                    </a>
                </div>
            </nav>

            <div className="p-4 border-t border-slate-100">
                 <button 
                  onClick={() => setCurrentView('landing')}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg w-full transition"
                 >
                    <LucideLogOut className="w-5 h-5" /> Sair
                </button>
            </div>
         </aside>
       )}

       {/* Mobile Header */}
       <div className="md:hidden bg-white p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-20">
          <span className="font-bold text-slate-900">OneClick Digital</span>
          <button onClick={() => setCurrentView('landing')} className="text-sm text-slate-500">Sair</button>
       </div>

       {/* Main Content */}
       <main className="flex-1 overflow-y-auto">
          {renderContent()}
       </main>
    </div>
  );
};

export default App;
