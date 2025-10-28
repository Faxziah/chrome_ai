import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApiConfig, GeminiResponse, StreamChunk, DEFAULT_GEMINI_MODEL, DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS } from '../types';
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

  private getModelAndConfig(prompt: string, config?: Partial<ApiConfig>) {
    const model = this.genAI!.getGenerativeModel({ 
      model: config?.model || DEFAULT_GEMINI_MODEL
    });

    const generationConfig = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config?.temperature || DEFAULT_TEMPERATURE,
        maxOutputTokens: config?.maxTokens || DEFAULT_MAX_TOKENS,
      }
    };

    return { model, generationConfig };
  }

  static getApiConfig(apiConfig?: Partial<ApiConfig> | null): Partial<ApiConfig> {
    return {
      model: apiConfig?.model || DEFAULT_GEMINI_MODEL,
      temperature: apiConfig?.temperature || DEFAULT_TEMPERATURE,
      maxTokens: apiConfig?.maxTokens || DEFAULT_MAX_TOKENS
    };
  }

  async generateText(
    prompt: string, 
    config?: Partial<ApiConfig>
  ): Promise<GeminiResponse> {
    this.ensureInitialized();

    try {
      const { model, generationConfig } = this.getModelAndConfig(prompt, config);
      const result = await model.generateContent(generationConfig);

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

      // Handle 400 errors for bad request
      if (error.status === 400 || error.message?.includes('400') || error.message?.includes('Bad Request')) {
        throw new Error(
          'Invalid API request. ' +
          'Check request format and parameters. ' +
          `Details: ${error.message || 'Unknown error'}`
        );
      }
      
      // Handle 404 errors for model not found
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new Error('MODEL_NOT_AVAILABLE');
      }
      
      // Handle 401 errors for API key issues
      if (error.message?.includes('401') || error.message?.includes('API key')) {
        throw new Error(
          'API key is invalid or missing. ' +
          'Check your key in extension settings.'
        );
      }
      
      // Handle 429 errors for rate limits
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        throw new Error(
          'API rate limit exceeded. ' +
          'Please wait a few minutes and try again.'
        );
      }
      
      throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
    }
  }

  async *streamContent(
    prompt: string, 
    config?: Partial<ApiConfig>
  ): AsyncGenerator<StreamChunk, void, unknown> {
    this.ensureInitialized();

    try {
      const { model, generationConfig } = this.getModelAndConfig(prompt, config);
      const result = await model.generateContentStream(generationConfig);

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
      console.error('Error details:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        response: error.response?.data
      });
      
      // Handle 400 errors for bad request
      if (error.status === 400 || error.message?.includes('400') || error.message?.includes('Bad Request')) {
        throw new Error(
          'Invalid API request. ' +
          'Check request format and parameters. ' +
          `Details: ${error.message || 'Unknown error'}`
        );
      }
      
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new Error(
          'Model is not available for current API version. Please select another model in extension settings.'
        );
      }
      
      if (error.message?.includes('API key') || error.message?.includes('401')) {
        throw new Error(
          'API key is invalid or missing. Check your key in extension settings.'
        );
      }
      
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        throw new Error(
          'API rate limit exceeded. Please wait a few minutes and try again.'
        );
      }
      
      throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      this.ensureInitialized();
      await this.generateText('Test');
      return true;
    } catch (error: any) {
      console.error('API key validation failed:', error);
      
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
