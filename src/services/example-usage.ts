import { GeminiService, StorageService } from './index';
import { ApiConfig } from '../types';

export class ExampleUsage {
  private geminiService: GeminiService;
  private storageService: StorageService;

  constructor() {
    this.geminiService = new GeminiService();
    this.storageService = new StorageService();
  }

  async initializeWithStoredApiKey(): Promise<boolean> {
    try {
      const apiKey = await this.storageService.getApiKey();
      if (!apiKey) {
        console.log('No API key found in storage');
        return false;
      }

      this.geminiService.setApiKey(apiKey);
      return true;
    } catch (error) {
      console.error('Failed to initialize with stored API key:', error);
      return false;
    }
  }

  async setNewApiKey(apiKey: string): Promise<boolean> {
    try {
      const saved = await this.storageService.setApiKey(apiKey);
      if (saved) {
        this.geminiService.setApiKey(apiKey);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to set new API key:', error);
      return false;
    }
  }

  async generateAndSaveResponse(prompt: string, config?: Partial<ApiConfig>): Promise<string | null> {
    try {
      const response = await this.geminiService.generateContent(prompt, config);
      
      await this.storageService.saveToHistory({
        type: 'summarize',
        prompt,
        response: response.text,
        model: config?.model || 'gemini-pro'
      });

      return response.text;
    } catch (error) {
      console.error('Failed to generate and save response:', error);
      return null;
    }
  }

  async streamAndSaveResponse(prompt: string, config?: Partial<ApiConfig>): Promise<string> {
    let fullResponse = '';
    
    try {
      for await (const chunk of this.geminiService.streamContent(prompt, config)) {
        if (chunk.isComplete) {
          fullResponse = chunk.text;
        } else {
          fullResponse += chunk.text;
        }
      }

      await this.storageService.saveToHistory({
        type: 'summarize',
        prompt,
        response: fullResponse,
        model: config?.model || 'gemini-pro'
      });

      return fullResponse;
    } catch (error) {
      console.error('Failed to stream and save response:', error);
      throw error;
    }
  }

  async addToFavorites(prompt: string, response: string, tags?: string[]): Promise<boolean> {
    try {
      return await this.storageService.addToFavorites({
        type: 'summarize',
        prompt,
        response,
        model: 'gemini-pro',
        tags
      });
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      return false;
    }
  }

  async getChatHistory(): Promise<any[]> {
    try {
      return await this.storageService.getHistory();
    } catch (error) {
      console.error('Failed to get chat history:', error);
      return [];
    }
  }

  async getFavorites(): Promise<any[]> {
    try {
      return await this.storageService.getFavorites();
    } catch (error) {
      console.error('Failed to get favorites:', error);
      return [];
    }
  }

  async testApiConnection(): Promise<boolean> {
    try {
      return await this.geminiService.testConnection();
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}
