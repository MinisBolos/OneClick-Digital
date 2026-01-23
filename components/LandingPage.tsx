import React from 'react';
import { LucideRocket, LucideBookOpen, LucideGlobe, LucideDollarSign, LucideCheckCircle, LucideArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <LucideRocket className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">OneClick Digital</span>
        </div>
        <div className="hidden md:flex gap-8 text-slate-600 font-medium">
          <a href="#" className="hover:text-indigo-600 transition">Funcionalidades</a>
          <a href="#" className="hover:text-indigo-600 transition">Preços</a>
          <a href="#" className="hover:text-indigo-600 transition">Depoimentos</a>
        </div>
        <button 
          onClick={onGetStarted}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-medium hover:bg-indigo-600 transition shadow-lg shadow-indigo-200">
          Entrar
        </button>
      </nav>

      {/* Hero */}
      <header className="flex-1 flex flex-col items-center justify-center text-center px-6 mt-12 mb-20">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-8 border border-indigo-100">
          <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
          Novo: Integração Gemini 3.0
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight max-w-4xl leading-tight">
          Transforme suas ideias em <span className="text-indigo-600">Produtos Digitais</span> em minutos.
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Crie e-books, guias e páginas de vendas instantaneamente com IA. Sem necessidade de conhecimentos técnicos. Comece seu negócio digital global hoje.
        </p>
        <button 
          onClick={onGetStarted}
          className="group bg-indigo-600 text-white text-lg px-10 py-4 rounded-full font-bold hover:bg-indigo-700 transition shadow-xl shadow-indigo-300 flex items-center gap-3">
          Criar Meu Primeiro Produto
          <LucideArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
        </button>
        
        <div className="mt-16 flex flex-col md:flex-row gap-8 text-sm text-slate-500 font-medium">
          <div className="flex items-center gap-2"><LucideCheckCircle className="text-green-500 w-5 h-5" /> 100% Conteúdo Original</div>
          <div className="flex items-center gap-2"><LucideCheckCircle className="text-green-500 w-5 h-5" /> Direitos Comerciais Incluídos</div>
          <div className="flex items-center gap-2"><LucideCheckCircle className="text-green-500 w-5 h-5" /> Exportar para PDF e Markdown</div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="bg-white py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition">
              <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <LucideBookOpen className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">E-Books Instantâneos</h3>
              <p className="text-slate-600">Gere capítulos completos, esboços e estruturas de conteúdo profissional sob medida para o seu nicho.</p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition">
              <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <LucideGlobe className="text-purple-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Alcance Global</h3>
              <p className="text-slate-600">Suporte multilíngue permite atingir mercados em todo o mundo. Crie em Inglês, Espanhol, Português e mais.</p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <LucideDollarSign className="text-green-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Pronto para Venda</h3>
              <p className="text-slate-600">Nós não escrevemos apenas o livro. Geramos copy de vendas de alta conversão, manchetes e roteiros para redes sociais.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <p>© 2024 OneClick Digital. Desenvolvido com Gemini. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};