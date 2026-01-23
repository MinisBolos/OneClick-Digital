import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { WizardState, GeneratedContent } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey });

const salesCopySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: "Manchete de vendas de alta conversão." },
    benefits: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de 5 benefícios principais." },
    cta: { type: Type.STRING, description: "Chamada para ação forte (Call to Action)." }
  },
  required: ["headline", "benefits", "cta"]
};

const generatedProductSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Título comercial e chamativo para o produto digital." },
    subtitle: { type: Type.STRING, description: "Subtítulo convincente." },
    description: { type: Type.STRING, description: "Um parágrafo curto descrevendo o produto." },
    coverImageDescription: { type: Type.STRING, description: "Uma descrição visual detalhada de uma capa moderna e limpa." },
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING, description: "Conteúdo extremamente detalhado e extenso para este capítulo. Mínimo de 1000 palavras se possível." },
          imageDescription: { type: Type.STRING, description: "Uma descrição visual para uma ilustração que acompanhe este capítulo." }
        },
        required: ["title", "content", "imageDescription"]
      }
    },
    salesCopy: salesCopySchema,
    socialScripts: {
      type: Type.ARRAY,
      description: "3 roteiros de vídeo curtos (TikTok/Reels) para comercializar o produto.",
      items: {
        type: Type.OBJECT,
        properties: {
          platform: { type: Type.STRING },
          script: { type: Type.STRING }
        }
      }
    }
  },
  required: ["title", "subtitle", "description", "chapters", "salesCopy", "socialScripts"]
};

export const generateDigitalProduct = async (details: WizardState): Promise<GeneratedContent> => {
  // Use Gemini 3 Pro with Thinking for high quality product structures
  const modelId = "gemini-3-pro-preview"; 
  
  const prompt = `
    Atue como um estrategista de produtos digitais e autor best-seller.
    Crie um **E-BOOK COMPLETO E EXTENSO** (o mais próximo possível de um livro real) com base nestes parâmetros:
    
    - Nicho: ${details.niche}
    - Público-Alvo: ${details.targetAudience}
    - Idioma: ${details.language}
    - Plataforma: ${details.platform}
    - Objetivo: ${details.goal}
    
    DIRETRIZES CRÍTICAS:
    1. **EXTENSÃO**: Crie pelo menos 15 capítulos detalhados. O conteúdo deve ser profundo, não superficial.
    2. **IMAGENS**: Para CADA capítulo, forneça um 'imageDescription' detalhado para que eu possa gerar ilustrações.
    3. **VALOR**: Evite linguagem genérica de IA. Use exemplos práticos, passos acionáveis e tom de autoridade.
    
    A saída deve seguir estritamente o esquema JSON fornecido.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: generatedProductSchema,
        thinkingConfig: { thinkingBudget: 32768 } // Max thinking for best quality
      }
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("Sem resposta da IA");

    return JSON.parse(textResponse) as GeneratedContent;
  } catch (error) {
    console.error("Erro na Geração Gemini:", error);
    throw error;
  }
};

export const refineSalesCopy = async (
  niche: string, 
  audience: string, 
  currentCopy: any, 
  instruction: string
): Promise<{ headline: string, benefits: string[], cta: string }> => {
  const modelId = "gemini-3-flash-preview"; // Fast model for iteration

  const prompt = `
    Atue como um copywriter expert. Refine a seguinte copy de vendas para um produto no nicho de "${niche}" focado em "${audience}".
    
    Copy Atual:
    Headline: ${currentCopy.headline}
    CTA: ${currentCopy.cta}
    
    Instrução de Melhoria: ${instruction}
    
    Gere uma nova versão completa (Headline, Benefícios, CTA) seguindo a instrução.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: salesCopySchema,
      }
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("Sem resposta da IA");

    return JSON.parse(textResponse);
  } catch (error) {
    console.error("Erro ao refinar copy:", error);
    throw error;
  }
};

// Generic Image Generation (Safe fallback)
export const generateCoverImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // More accessible model
      contents: {
        parts: [
          {
            text: `Gere uma imagem profissional. Estilo: Moderno, clean. Contexto: ${prompt}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4", 
        }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("Nenhum dado de imagem encontrado na resposta");
  } catch (error) {
    console.error("Erro na Geração de Imagem Gemini:", error);
    // Return a placeholder or empty string if generation fails to avoid crashing UI
    return ""; 
  }
};

// Chapter Image Generation (Square)
export const generateChapterImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Ilustração para livro. Estilo minimalista e editorial. Contexto: ${prompt}` }
        ]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return "";
  } catch (error) {
    console.error("Failed to generate chapter image:", error);
    return "";
  }
};

// --- Novas Funcionalidades ---

// 1. Veo Video Generation
export const generateVideo = async (prompt: string, imageBase64?: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string> => {
  try {
    let operation;
    
    // Check for API Key selection for Veo
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            try {
                // @ts-ignore
                await window.aistudio.openSelectKey();
                // We must create a new client or retry? 
                // In this setup, we proceed. If it fails again, we catch 403.
            } catch (e) {
                console.error("User cancelled key selection", e);
                throw new Error("Seleção de chave cancelada.");
            }
        }
    }

    // Force new client instance to ensure key is picked up if changed
    const freshAi = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

    const config = {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    };

    try {
        if (imageBase64) {
          const mimeType = imageBase64.split(';')[0].split(':')[1];
          const data = imageBase64.split(',')[1];
          
          operation = await freshAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: { imageBytes: data, mimeType: mimeType },
            config: config
          });
        } else {
          operation = await freshAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: config
          });
        }
    } catch (e: any) {
        // Handle 403 specifically
        if (e.message?.includes('403') || e.status === 403) {
             // @ts-ignore
             if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
                 // @ts-ignore
                 await window.aistudio.openSelectKey();
                 throw new Error("Chave API inválida ou sem permissão. Por favor, selecione uma chave paga e tente novamente.");
             }
        }
        throw e;
    }

    // Polling
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await freshAi.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Falha na geração do vídeo");
    
    return `${videoUri}&key=${apiKey}`;

  } catch (error) {
    console.error("Erro na Geração Veo:", error);
    throw error;
  }
};

// 2. TTS Generation
export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<ArrayBuffer> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName }, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("Nenhum áudio gerado");

        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;

    } catch (error) {
        console.error("Erro TTS:", error);
        throw error;
    }
}

// 2.1 Translate Text
export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text to ${targetLanguage}. Return only the translated text, do not add any preamble or markdown.\n\nText: ${text}`,
    });
    return response.text || text;
  } catch (error) {
    console.error("Translation Error:", error);
    return text;
  }
}

// 3. Pro Image Generation
export const generateProImage = async (prompt: string, aspectRatio: string = "1:1", size: string = "1K"): Promise<string> => {
    try {
        // @ts-ignore
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            // @ts-ignore
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                // @ts-ignore
                await window.aistudio.openSelectKey();
            }
        }
        
        const freshAi = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

        const response = await freshAi.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                    imageSize: size
                }
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("Nenhuma imagem gerada");
    } catch (error: any) {
        console.error("Erro Pro Image:", error);
        if (error.message?.includes('403') || error.status === 403) {
             // @ts-ignore
             if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
                 // @ts-ignore
                 await window.aistudio.openSelectKey();
                 throw new Error("Permissão negada. Por favor, selecione uma chave API paga.");
             }
        }
        throw error;
    }
}

// 4. Image Editing (Nano Banana)
export const editImage = async (imageBase64: string, prompt: string): Promise<string> => {
    try {
        const mimeType = imageBase64.split(';')[0].split(':')[1];
        const data = imageBase64.split(',')[1];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: data,
                            mimeType: mimeType
                        }
                    },
                    { text: prompt }
                ]
            }
        });

        for (const part of response.candidates[0].content.parts) {
             if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("Nenhuma imagem editada retornada");
    } catch (error) {
        console.error("Erro Edição Imagem:", error);
        throw error;
    }
}

// 5. Image Analysis
export const analyzeImage = async (imageBase64: string, prompt: string): Promise<string> => {
    try {
        const mimeType = imageBase64.split(';')[0].split(':')[1];
        const data = imageBase64.split(',')[1];
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: data,
                            mimeType: mimeType
                        }
                    },
                    { text: prompt }
                ]
            }
        });
        
        return response.text || "Nenhuma análise gerada.";
    } catch (error) {
        console.error("Erro Análise:", error);
        throw error;
    }
}

// 6. Live API Connection Helper
export const getLiveClient = () => {
    return ai.live;
}