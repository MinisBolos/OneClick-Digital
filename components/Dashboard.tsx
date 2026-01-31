import React from 'react';
import { Product } from '../types';
import { LucidePlus, LucideFileText, LucideCalendar, LucideChevronRight, LucideDownload } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  onCreateNew: () => void;
  onViewProduct: (product: Product) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ products, onCreateNew, onViewProduct }) => {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meu Painel</h1>
          <p className="text-slate-500 mt-1">Gerencie seus produtos digitais e ativos.</p>
        </div>
        <button 
          onClick={onCreateNew}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center gap-2"
        >
          <LucidePlus className="w-5 h-5" />
          Criar Novo Produto
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <LucideFileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum produto ainda</h3>
          <p className="text-slate-500 mb-6 max-w-sm">
            Você ainda não gerou nenhum produto digital. Comece criando seu primeiro e-book ou guia.
          </p>
          <button 
            onClick={onCreateNew}
            className="text-indigo-600 font-bold hover:underline"
          >
            Iniciar Assistente de Criação &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New Product Card Button */}
          <button 
            onClick={onCreateNew}
            className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-300 flex flex-col items-center justify-center p-6 min-h-[300px] group cursor-pointer text-left"
          >
             <div className="w-16 h-16 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition text-indigo-600">
                <LucidePlus className="w-8 h-8" />
             </div>
             <h3 className="text-lg font-bold text-slate-900">Criar Novo</h3>
             <p className="text-sm text-slate-500">Usar Assistente IA</p>
          </button>

          {products.map((product) => (
            <div 
              key={product.id}
              onClick={() => onViewProduct(product)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group"
            >
              {/* Mock Cover Area */}
              <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 relative p-6 flex items-end">
                 <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition"></div>
                 <h3 className="text-white font-bold text-xl relative z-10 line-clamp-2">
                   {product.content?.title || product.niche}
                 </h3>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-3 uppercase tracking-wider">
                  <span className="bg-indigo-50 px-2 py-1 rounded-md">{product.size.split(' ')[0]}</span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{product.platform}</span>
                </div>
                
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                  {product.content?.description || `Um guia gerado para ${product.targetAudience} sobre ${product.niche}.`}
                </p>

                <div className="flex items-center justify-between text-slate-400 text-sm pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-1">
                    <LucideCalendar className="w-3 h-3" />
                    {new Date(product.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="group-hover:text-indigo-600 transition flex items-center gap-1 font-medium">
                    Ver Detalhes <LucideChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Quick View (Mock) */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl">
            <p className="text-slate-400 text-sm mb-1">Total de Produtos</p>
            <p className="text-3xl font-bold">{products.length}</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-2xl">
            <p className="text-slate-500 text-sm mb-1">Valor Estimado</p>
            <p className="text-3xl font-bold text-slate-900">R${products.length * 150}</p>
        </div>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:opacity-90 transition">
            <div>
              <p className="font-bold text-lg">Desbloquear Pro</p>
              <p className="text-indigo-100 text-sm">Obtenha tradução e audiobooks</p>
            </div>
            <LucideChevronRight className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};