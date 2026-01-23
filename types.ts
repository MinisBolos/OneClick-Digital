export type ProductSize = 'Curto (Isca Digital)' | 'Médio (E-book Padrão)' | 'Longo (Guia Completo)';
export type ProductGoal = 'Venda Rápida' | 'Autoridade/Branding';
export type Platform = 'Amazon KDP' | 'Gumroad' | 'Hotmart' | 'Etsy';

export interface WizardState {
  niche: string;
  targetAudience: string;
  language: string;
  platform: Platform;
  goal: ProductGoal;
  size: ProductSize;
}

export interface Chapter {
  title: string;
  content: string; // Esboço ou resumo para o MVP
}

export interface GeneratedContent {
  title: string;
  subtitle: string;
  description: string;
  coverImageDescription: string;
  coverImageUrl?: string; 
  chapters: Chapter[];
  salesCopy: {
    headline: string;
    benefits: string[];
    cta: string;
  };
  socialScripts: {
    platform: string;
    script: string;
  }[];
}

export interface Product extends WizardState {
  id: string;
  createdAt: Date;
  status: 'draft' | 'completed';
  content?: GeneratedContent;
}

export type AppView = 'landing' | 'dashboard' | 'wizard' | 'product-detail' | 'studio';

// Studio Tool Types
export type StudioTool = 'video' | 'image' | 'live' | 'analyze';
