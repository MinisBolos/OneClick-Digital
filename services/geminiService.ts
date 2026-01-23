import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { WizardState, GeneratedContent } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey });

const generatedProductSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Título comercial e chamativo para o produto digital." },
    subtitle: { type: Type.STRING, description: "Subtítulo convincente." },
    description: { type: Type.STRING, description: "Um parágrafo curto descrevendo o produto." },
    coverImageDescription: { type: Type.STRING, description: "Uma descrição visual de uma capa moderna e limpa." },
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING, description: "Um esboço detalhado e pontos-chave para este capítulo (aprox. 150 palavras)." }
        }
      }
    },
    salesCopy: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING, description: "Manchete de vendas de alta conversão." },
        benefits: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de 5 benefícios principais." },
        cta: { type: Type.STRING, description: "Chamada para ação forte (Call to Action)." }
      }
    },
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
    Atue como um estrategista de produtos digitais e copywriter de classe mundial.
    Crie uma estrutura completa de produto digital com base nos seguintes parâmetros:
    
    - Nicho: ${details.niche}
    - Público-Alvo: ${details.targetAudience}
    - Idioma do Conteúdo: ${details.language}
    - Plataforma de Venda: ${details.platform}
    - Objetivo: ${details.goal}
    - Tamanho/Profundidade: ${details.size}

    O conteúdo deve ser de alto valor, original e comercialmente viável.
    Evite frases genéricas que pareçam IA. Concentre-se em valor acionável.
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

export const generateCoverImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Gere uma imagem de capa de livro profissional e de alta qualidade. Estilo: Moderno, minimalista, comercial. Contexto: ${prompt}`,
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
    throw error;
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
            // @ts-ignore
            await window.aistudio.openSelectKey();
            // Re-instantiate AI client to pick up new key if needed, though usually env var is injected
        }
    }

    const config = {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    };

    if (imageBase64) {
      // Image-to-Video
      const mimeType = imageBase64.split(';')[0].split(':')[1];
      const data = imageBase64.split(',')[1];
      
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
            imageBytes: data,
            mimeType: mimeType
        },
        config: config
      });
    } else {
      // Text-to-Video
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: config
      });
    }

    // Polling
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Falha na geração do vídeo");
    
    // Append API key for fetching
    return `${videoUri}&key=${apiKey}`;

  } catch (error) {
    console.error("Erro na Geração Veo:", error);
    throw error;
  }
};

// 2. TTS Generation
export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("Nenhum áudio gerado");

        // Decode base64 to ArrayBuffer
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

// 3. Pro Image Generation
export const generateProImage = async (prompt: string, aspectRatio: string = "1:1", size: string = "1K"): Promise<string> => {
    try {
         // Check for API Key selection for Pro Image
        // @ts-ignore
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            // @ts-ignore
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                // @ts-ignore
                await window.aistudio.openSelectKey();
            }
        }

        const response = await ai.models.generateContent({
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
    } catch (error) {
        console.error("Erro Pro Image:", error);
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
