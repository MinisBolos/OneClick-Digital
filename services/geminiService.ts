
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { WizardState, GeneratedContent } from "../types";

// Helper to ensure we have an API Key and handle the UI for key selection if needed
const ensureApiKey = async (): Promise<string> => {
  // @ts-ignore
  if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  }
  return process.env.API_KEY || '';
};

const handleApiError = async (error: any) => {
  const errorMsg = error?.message || error?.toString() || "";
  const status = error?.status;
  
  // Explicitly handle 403 (Permission Denied) and 404 (Requested entity not found) 
  // which are common when advanced models (Gemini 3, Veo) are used with non-paid project keys.
  if (
    errorMsg.includes("403") || 
    errorMsg.includes("PERMISSION_DENIED") || 
    errorMsg.includes("Requested entity was not found") ||
    status === 403 ||
    status === 404
  ) {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // Prompt for key again as this usually means the project is not eligible
      // @ts-ignore
      await window.aistudio.openSelectKey();
      return true;
    }
  }
  return false;
};

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
          content: { type: Type.STRING, description: "Conteúdo extremamente detalhado e extenso para este capítulo. Mínimo de 1000 palavras." },
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
  const apiKey = await ensureApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-pro-preview"; 
  
  const prompt = `
    Atue como um estrategista de produtos digitais e autor best-seller.
    Crie um **E-BOOK COMPLETO E EXTENSO** com base nestes parâmetros:
    - Nicho: ${details.niche}
    - Público-Alvo: ${details.targetAudience}
    - Idioma: ${details.language}
    - Plataforma: ${details.platform}
    - Objetivo: ${details.goal}
    
    DIRETRIZES Visuais para Imagens (MUITO IMPORTANTE):
    - Peça imagens fotorrealistas, 8k, iluminação cinematográfica, estilo fotografia de estúdio.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: generatedProductSchema,
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    if (!response.text) throw new Error("Sem resposta da IA");
    return JSON.parse(response.text) as GeneratedContent;
  } catch (error: any) {
    await handleApiError(error);
    throw error;
  }
};

export const generateCoverImage = async (prompt: string): Promise<string> => {
  const apiKey = await ensureApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `High-end professional physical book cover, premium photography, ultra-realistic textures, studio lighting, cinematic atmosphere, 8k resolution, elegant design. Subject: ${prompt}` }],
      },
      config: { 
        imageConfig: { 
          aspectRatio: "3:4",
          imageSize: "1K"
        } 
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return "";
  } catch (error: any) {
    await handleApiError(error);
    throw error;
  }
};

export const generateChapterImage = async (prompt: string, retries = 2): Promise<string> => {
  const apiKey = await ensureApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Highly detailed realistic editorial photography for a premium book, sharp focus, professional color grading, clean composition. Scene: ${prompt}` }]
      },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return "";
  } catch (error: any) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 2000));
      return generateChapterImage(prompt, retries - 1);
    }
    await handleApiError(error);
    throw error;
  }
};

export const generateVideo = async (prompt: string, imageBase64?: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string> => {
  const apiKey = await ensureApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const config = { numberOfVideos: 1, resolution: '720p' as const, aspectRatio };

  try {
    let operation;
    if (imageBase64) {
      const mimeType = imageBase64.split(';')[0].split(':')[1];
      const data = imageBase64.split(',')[1];
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `Cinematic high-fidelity video, professional color grading: ${prompt}`,
        image: { imageBytes: data, mimeType },
        config
      });
    } else {
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `Cinematic high-fidelity video, professional color grading: ${prompt}`,
        config
      });
    }

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) throw new Error("Video generation failed");
    return `${uri}&key=${apiKey}`;
  } catch (error: any) {
    await handleApiError(error);
    throw error;
  }
};

export const generateProImage = async (prompt: string, aspectRatio: string = "1:1", size: string = "1K"): Promise<string> => {
  const apiKey = await ensureApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: `Award-winning professional photography, 8k resolution, photorealistic, highly detailed, masterwork. ${prompt}` }] },
      config: { imageConfig: { aspectRatio, imageSize: size as any } },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("No image generated");
  } catch (error: any) {
    await handleApiError(error);
    throw error;
  }
};

export const refineSalesCopy = async (niche: string, audience: string, currentCopy: any, instruction: string): Promise<{ headline: string, benefits: string[], cta: string }> => {
  const apiKey = await ensureApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-flash-preview";
  const prompt = `Refine a copy de vendas para um produto no nicho de "${niche}" focado em "${audience}". Copy Atual: ${JSON.stringify(currentCopy)} Instrução: ${instruction}`;
  
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: salesCopySchema }
    });
    if (!response.text) throw new Error("Sem resposta da IA");
    return JSON.parse(response.text);
  } catch (error: any) {
    await handleApiError(error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<ArrayBuffer> => {
  const apiKey = await ensureApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes.buffer;
  } catch (error: any) {
    await handleApiError(error);
    throw error;
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  const apiKey = await ensureApiKey();
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: `Translate to ${targetLanguage}: ${text}` });
    return response.text || text;
  } catch (error: any) {
    await handleApiError(error);
    throw error;
  }
};

export const editImage = async (imageBase64: string, prompt: string): Promise<string> => {
  const apiKey = await ensureApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const mimeType = imageBase64.split(';')[0].split(':')[1];
  const data = imageBase64.split(',')[1];
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ inlineData: { data, mimeType } }, { text: prompt }] } });
    for (const part of response.candidates[0].content.parts) { if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`; }
    throw new Error("No edited image");
  } catch (error: any) {
    await handleApiError(error);
    throw error;
  }
};

export const analyzeImage = async (imageBase64: string, prompt: string): Promise<string> => {
  const apiKey = await ensureApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const mimeType = imageBase64.split(';')[0].split(':')[1];
  const data = imageBase64.split(',')[1];
  try {
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: { parts: [{ inlineData: { data, mimeType } }, { text: prompt }] } });
    return response.text || "Sem análise.";
  } catch (error: any) {
    await handleApiError(error);
    throw error;
  }
};

export const getLiveClient = async () => {
    const apiKey = await ensureApiKey();
    const ai = new GoogleGenAI({ apiKey });
    return ai.live;
};

export const extendVideo = async (prompt: string, videoUri: string, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    const apiKey = await ensureApiKey();
    const ai = new GoogleGenAI({ apiKey });
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            prompt,
            video: { uri: videoUri },
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
        });
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }
        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        return `${uri}&key=${apiKey}`;
    } catch (error: any) {
        await handleApiError(error);
        throw error;
    }
}
