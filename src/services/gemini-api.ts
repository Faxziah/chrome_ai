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
        model: config?.model || 'gemini-pro'
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: config?.temperature || 0.7,
          maxOutputTokens: config?.maxTokens || 2048,
        }
      });
      const response = await result.response;
      const text = response.text();

      return {
        text,
        usage: {
          promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
          candidatesTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
        }
      };
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *streamContent(
    prompt: string, 
    config?: Partial<ApiConfig>
  ): AsyncGenerator<StreamChunk, void, unknown> {
    this.ensureInitialized();

    try {
      const model = this.genAI!.getGenerativeModel({ 
        model: config?.model || 'gemini-pro'
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

    } catch (error) {
      console.error('Error streaming content:', error);
      throw new Error(`Failed to stream content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      this.ensureInitialized();
      await this.generateContent('Test connection');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
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
