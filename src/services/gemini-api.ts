import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApiConfig, GeminiResponse, StreamChunk } from '../types';
import { validateApiKey } from './utils';

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.setApiKey(apiKey);
    }
  }

  setApiKey(apiKey: string): void {
    if (!validateApiKey(apiKey)) {
      throw new Error('Invalid API key format');
    }
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private ensureInitialized(): void {
    if (!this.genAI || !this.apiKey) {
      throw new Error('GeminiService not initialized. Please set API key first.');
    }
  }

  async generateContent(
    prompt: string, 
    config?: Partial<ApiConfig>
  ): Promise<GeminiResponse> {
    this.ensureInitialized();

    try {
      const model = this.genAI!.getGenerativeModel({ 
        model: config?.model || 'gemini-2.5-flash'
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: config?.temperature || 0.7,
          maxOutputTokens: config?.maxTokens || 2048,
        }
      });
      const response = result.response;
      const text = response.text();

      return {
        text,
        usage: {
          promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
          candidatesTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
        }
      };
    } catch (error: any) {
      console.error('Error generating content:', error);
      
      // Handle 404 errors for model not found
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new Error('MODEL_NOT_AVAILABLE');
      }
      
      // Handle 401 errors for API key issues
      if (error.message?.includes('401') || error.message?.includes('API key')) {
        throw new Error(
          'API ключ некорректный или отсутствует. ' +
          'Проверьте ключ в настройках расширения.'
        );
      }
      
      // Handle 429 errors for rate limits
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        throw new Error(
          'Превышен лимит запросов к API. ' +
          'Пожалуйста, подождите несколько минут и попробуйте снова.'
        );
      }
      
      throw new Error(`Ошибка Gemini API: ${error.message || 'Неизвестная ошибка'}`);
    }
  }

  async *streamContent(
    prompt: string, 
    config?: Partial<ApiConfig>
  ): AsyncGenerator<StreamChunk, void, unknown> {
    this.ensureInitialized();

    try {
      const model = this.genAI!.getGenerativeModel({ 
        model: config?.model || 'gemini-2.5-flash'
      });

      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: config?.temperature || 0.7,
          maxOutputTokens: config?.maxTokens || 2048,
        }
      });
      
      let fullText = '';
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        
        yield {
          text: chunkText,
          isComplete: false
        };
      }

      yield {
        text: fullText,
        isComplete: true
      };

    } catch (error: any) {
      console.error('Error streaming content:', error);
      
      // Проверка на 404 ошибку модели
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new Error(
          'Модель недоступна для текущей версии API. ' +
          'Пожалуйста, выберите другую модель в настройках расширения. ' +
          'Доступные модели: gemini-1.5-flash, gemini-1.5-pro.'
        );
      }
      
      // Проверка на ошибку API ключа
      if (error.message?.includes('API key') || error.message?.includes('401')) {
        throw new Error(
          'API ключ некорректный или отсутствует. ' +
          'Проверьте ключ в настройках расширения.'
        );
      }
      
      // Проверка на rate limit
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        throw new Error(
          'Превышен лимит запросов к API. ' +
          'Пожалуйста, подождите несколько минут и попробуйте снова.'
        );
      }
      
      // Общая ошибка
      throw new Error(`Ошибка Gemini API: ${error.message || 'Неизвестная ошибка'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      this.ensureInitialized();
      await this.generateContent('Test', { temperature: 0.1, maxTokens: 10 });
      return true;
    } catch (error: any) {
      console.error('API key validation failed:', error);
      
      // Логировать конкретную причину
      if (error.message?.includes('404') || error.message?.includes('MODEL_NOT_AVAILABLE')) {
        console.error('Model not found');
      } else if (error.message?.includes('401') || error.message?.includes('API key')) {
        console.error('Invalid API key');
      } else if (error.message?.includes('429') || error.message?.includes('quota')) {
        console.error('Rate limit exceeded');
      }
      
      return false;
    }
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  isInitialized(): boolean {
    return this.genAI !== null && this.apiKey !== null;
  }
}
