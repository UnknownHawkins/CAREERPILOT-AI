import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { logger } from '../utils/logger';

let geminiClient: GoogleGenerativeAI | null = null;
let geminiModel: GenerativeModel | null = null;

export const initializeGemini = (): void => {
  try {
    const apiKey = "rgwARr5EWMS4W1JMFvRZcoqCg3Q2x1bDFEgMRdEkSMwOo7ixUU9qUc2xC7_iT4Hj";
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    
    geminiClient = new GoogleGenerativeAI(apiKey);
    geminiModel = geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    logger.info('Gemini AI initialized successfully');
  } catch (error: any) {
    logger.error('Gemini initialization error:', error?.response || error?.message || error);
    throw error;
  }
};

export const getGeminiModel = (): GenerativeModel => {
  if (!geminiModel) {
    initializeGemini();
  }
  if (!geminiModel) {
    throw new Error('Gemini model not initialized');
  }
  return geminiModel;
};

export const generateContent = async (
  prompt: string,
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  }
): Promise<string> => {
  try {
    const model = getGeminiModel();
    
    const generationConfig = {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxOutputTokens ?? 2048,
      topP: options?.topP ?? 0.8,
      topK: options?.topK ?? 40,
    };
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });
    
    const response = result.response;
    return response.text();
  } catch (error) {
    logger.error('Gemini content generation error:', error);
    throw error;
  }
};

export const generateStructuredContent = async <T>(
  prompt: string,
  schema: object,
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
    imageData?: {
      buffer: Buffer;
      mimeType: string;
    };
  }
): Promise<T> => {
  try {
    const model = getGeminiModel();
    
    const generationConfig = {
      temperature: options?.temperature ?? 0.2,
      maxOutputTokens: options?.maxOutputTokens ?? 4096,
      responseMimeType: 'application/json',
    };

    const parts: any[] = [{ text: prompt }];
    if (options?.imageData) {
      parts.push({
        inlineData: {
          data: options.imageData.buffer.toString('base64'),
          mimeType: options.imageData.mimeType,
        },
      });
    }
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig,
    });
    
    let responseText = result.response.text();
    
    // Strip markdown formatting if the model still wraps the JSON
    if (responseText.includes('```')) {
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    }
    
    return JSON.parse(responseText) as T;
  } catch (error: any) {
    logger.error('Gemini structured content generation error detailed:', error?.response || error?.message || error);
    throw error;
  }
};

export const generateChatResponse = async (
  messages: { role: 'user' | 'model'; content: string }[],
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
  }
): Promise<string> => {
  try {
    const model = getGeminiModel();
    const chat = model.startChat({
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 2048,
      },
    });
    
    // Send history
    for (const message of messages.slice(0, -1)) {
      if (message.role === 'user') {
        await chat.sendMessage(message.content);
      }
    }
    
    // Send final message
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    
    return result.response.text();
  } catch (error) {
    logger.error('Gemini chat response error:', error);
    throw error;
  }
};
