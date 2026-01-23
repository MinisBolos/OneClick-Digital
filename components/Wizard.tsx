import React, { useState } from 'react';
import { WizardState, ProductSize, ProductGoal, Platform } from '../types';
import { LucideChevronRight, LucideChevronLeft, LucideLoader, LucideSparkles } from 'lucide-react';

interface WizardProps {
  onComplete: (data: WizardState) => void;
  onCancel: () => void;
  isGenerating: boolean;
}

const steps = [
  { id: 1, title: 'Nicho & Tópico', description: 'Sobre o que é o seu produto?' },
  { id: 2, title: 'Público-Alvo', description: 'Para quem é isso?' },
  { id: 3, title: 'Idioma', description: 'Idioma principal do conteúdo' },
  { id: 4, title: 'Plataforma', description: 'Onde você vai vender isso?' },
  { id: 5, title: 'Objetivo', description: 'Qual é o seu objetivo principal?' },
  { id: 6, title: 'Tamanho', description: 'Quão abrangente deve ser?' },
];

export const Wizard: React.FC<WizardProps> = ({ onComplete, onCancel, isGenerating }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardState>({
    niche: '',
    targetAudience: '',
    language: 'Português',
    platform: 'Hotmart',
    goal: 'Venda Rápida',
    size: 'Médio (E-book Padrão)'
  });

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const updateField = (field: keyof WizardState, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const progress = (currentStep / steps.length) * 100;

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
          <LucideSparkles className="w-16 h-16 text-indigo-600 relative z-10 animate-bounce" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Criando Seu Produto</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Nossa IA está gerando capítulos, escrevendo a copy de vendas e projetando sua estratégia de lançamento. Isso geralmente leva cerca de 30 segundos...
        </p>
        <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Passo {currentStep} de {steps.length}</h2>
          <span className="text-sm font-medium text-indigo-600">{Math.round(progress)}% Concluído</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 min-h-[400px] flex flex-col">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">{steps[currentStep - 1].title}</h3>
          <p className="text-slate-500 mb-8">{steps[currentStep - 1].description}</p>

          {/* Step 1: Niche */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Digite seu nicho ou tópico</label>
              <input
                type="text"
                value={formData.niche}
                onChange={(e) => updateField('niche', e.target.value)}
                placeholder="ex: Dieta Keto para Iniciantes, Produtividade no Trabalho Remoto..."
                className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-lg"
                autoFocus
              />
              <div className="flex gap-2 flex-wrap mt-4">
                 {['Finanças Pessoais', 'Fitness', 'Marketing Digital', 'Autoajuda'].map(suggestion => (
                   <button 
                    key={suggestion}
                    onClick={() => updateField('niche', suggestion)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs text-slate-600 transition"
                   >
                     {suggestion}
                   </button>
                 ))}
              </div>
            </div>
          )}

          {/* Step 2: Audience */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Quem é seu cliente ideal?</label>
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => updateField('targetAudience', e.target.value)}
                placeholder="ex: Mães ocupadas acima de 30, Estudantes universitários, Pequenos empresários..."
                className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-lg"
                autoFocus
              />
            </div>
          )}

          {/* Step 3: Language */}
          {currentStep === 3 && (
            <div className="grid grid-cols-2 gap-4">
              {['Português', 'English', 'Spanish', 'French', 'German', 'Italian'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => updateField('language', lang)}
                  className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                    formData.language === lang 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' 
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium">{lang}</span>
                  {formData.language === lang && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Platform */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 gap-4">
              {(['Hotmart', 'Amazon KDP', 'Gumroad', 'Etsy'] as Platform[]).map((plat) => (
                <button
                  key={plat}
                  onClick={() => updateField('platform', plat)}
                  className={`p-4 rounded-xl border text-left transition ${
                    formData.platform === plat
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium block">{plat}</span>
                  <span className="text-xs opacity-70">Melhor para {plat === 'Amazon KDP' ? 'livros' : 'downloads digitais'}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 5: Goal */}
          {currentStep === 5 && (
            <div className="grid grid-cols-1 gap-4">
              {(['Venda Rápida', 'Autoridade/Branding'] as ProductGoal[]).map((g) => (
                <button
                  key={g}
                  onClick={() => updateField('goal', g)}
                  className={`p-6 rounded-xl border text-left transition ${
                    formData.goal === g
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold block text-lg mb-1">{g}</span>
                  <span className="text-sm opacity-80">
                    {g === 'Venda Rápida' 
                      ? 'Foco em tópicos em alta e guias práticos rápidos.' 
                      : 'Foco em profundidade, qualidade e estabelecimento de expertise.'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Step 6: Size */}
          {currentStep === 6 && (
            <div className="space-y-4">
              {(['Curto (Isca Digital)', 'Médio (E-book Padrão)', 'Longo (Guia Completo)'] as ProductSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => updateField('size', s)}
                  className={`w-full p-4 rounded-xl border text-left transition ${
                    formData.size === s
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8 mt-4 border-t border-slate-100">
          <button
            onClick={currentStep === 1 ? onCancel : handleBack}
            className="text-slate-500 font-medium px-6 py-3 hover:text-slate-800 transition"
          >
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </button>
          
          <button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !formData.niche) || 
              (currentStep === 2 && !formData.targetAudience)
            }
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            {currentStep === steps.length ? (
              <>
                Gerar Produto <LucideSparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                Próximo <LucideChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};