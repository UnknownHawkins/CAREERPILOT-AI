import Groq from 'groq-sdk';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

let groqClient: Groq | null = null;

export const initializeGroq = (): void => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      logger.warn('GROQ_API_KEY is not defined or is placeholder. AI features may fail.');
      // We don't throw here to allow the app to boot, but services should check.
    }
    
    groqClient = new Groq({
      apiKey: apiKey === 'your_groq_api_key_here' ? '' : apiKey,
    });
    
    logger.info('Groq AI initialized successfully');
  } catch (error: any) {
    logger.error('Groq initialization error:', error?.message || error);
    throw error;
  }
};

export const getGroqClient = (): Groq => {
  if (!groqClient) {
    initializeGroq();
  }
  if (!groqClient) {
    throw new Error('Groq client not initialized');
  }
  return groqClient;
};

/**
 * Universal helper for Groq text and vision completions
 */
export const generateGroqContent = async <T = string>(
  messages: any[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    imageData?: {
      buffer: Buffer;
      mimeType: string;
    };
  }
): Promise<T> => {
  try {
    const client = getGroqClient();
    const model = options?.model || (options?.imageData ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile');

    // If image data is provided, append it to the LAST user message
    if (options?.imageData) {
      const lastUserIndex = messages.map(m => m.role).lastIndexOf('user');
      if (lastUserIndex !== -1) {
        const base64Image = options.imageData.buffer.toString('base64');
        const originalContent = messages[lastUserIndex].content;
        
        messages[lastUserIndex].content = [
          { type: 'text', text: typeof originalContent === 'string' ? originalContent : 'Analyze this image.' },
          {
            type: 'image_url',
            image_url: {
              url: `data:${options.imageData.mimeType};base64,${base64Image}`,
            },
          },
        ];
      }
    }

    const completion = await client.chat.completions.create({
      messages,
      model,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 4096,
      response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    if (options?.jsonMode) {
      try {
        return JSON.parse(responseText) as T;
      } catch (parseError) {
        logger.error('Failed to parse Groq JSON response:', responseText);
        throw new Error('AI returned invalid JSON format');
      }
    }

    return responseText as unknown as T;
  } catch (error) {
    logger.error('Groq content generation error:', error);
    throw error;
  }
};
