// Fix: Removed incorrect/deprecated types GetVideosOperationResponse, VideosOperation, GenerateVideosRequest, GenerateContentRequest.
// Fix: Added correct types Content and GenerateVideosParameters.
import { GoogleGenAI, GenerateContentResponse, Modality, Type, Content, GenerateVideosParameters } from "@google/genai";

if (!process.env.API_KEY) {
  // This is a placeholder check.
  // In a real environment, the key would be set.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

// --- UTILITY FUNCTIONS ---
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error('Failed to convert blob to base64.'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// --- API FUNCTIONS ---

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });


export const generateSmsContent = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating content with Gemini API:", error);
    return "Error generating message. Please try again or write one manually.";
  }
};

export const generateChatResponse = async (
    // Fix: Replaced deprecated GenerateContentRequest['contents'] with Content[]
    history: Content[], 
    newMessage: string, 
    useSearch: boolean, 
    useMaps: boolean,
    useLite: boolean
): Promise<GenerateContentResponse> => {
    const ai = getAiClient();
    const tools: any[] = [];
    if (useSearch) tools.push({ googleSearch: {} });
    if (useMaps) tools.push({ googleMaps: {} });

    return await ai.models.generateContent({
        model: useLite ? 'gemini-flash-lite-latest' : 'gemini-2.5-flash',
        contents: [...history, { role: 'user', parts: [{ text: newMessage }] }],
        config: {
            tools: tools.length > 0 ? tools : undefined,
        }
    });
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio as any,
        },
    });
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { data: imageBase64, mimeType } }
            ]
        }
    });
    return response.text;
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { data: imageBase64, mimeType } }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error('No image was generated by the model.');
};

// Fix: Replaced deprecated GenerateVideosRequest with GenerateVideosParameters
export const generateVideo = async (request: GenerateVideosParameters): Promise<string> => {
    const ai = getAiClient();
    // Fix: Removed explicit type annotation for operation as types are not exported.
    let operation = await ai.models.generateVideos(request);
    
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Fix: Removed cast on operation.
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed to produce a download link.");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

export const generateSpeech = async (text: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            }
        }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("TTS generation failed.");
    return base64Audio;
};

export const analyzeVideoByFrames = async (prompt: string, frames: {mimeType: string, data: string}[]): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: {
            parts: [
                { text: prompt },
                ...frames.map(frame => ({ inlineData: frame }))
            ]
        }
    });
    return response.text;
};


export const runComplexQuery = async (prompt: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text;
};