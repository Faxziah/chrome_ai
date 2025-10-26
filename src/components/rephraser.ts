import { GeminiService } from '../services/gemini-api';
import { HistoryService } from '../services/history';
import { StorageService } from '../services/storage';
import { RephraserConfig, RephraserResult } from '../types';

export class Rephraser {
  private geminiService: GeminiService;
  private readonly historyService?: HistoryService;
  private readonly storageService: StorageService;

  constructor(geminiService: GeminiService, historyService?: HistoryService, storageService?: StorageService) {
    this.geminiService = geminiService;
    this.historyService = historyService;
    this.storageService = storageService || new StorageService();
  }

  private getLanguageName(languageCode: string): string {
    const languageMap: Record<string, string> = {
      'en': 'English',
      'ru': 'Russian',
      'de': 'German',
      'fr': 'French',
      'zh': 'Chinese',
      'es': 'Spanish',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'hi': 'Hindi'
    };
    
    return languageMap[languageCode] || 'English';
  }

  // Overload for simple style-based rephrasing
  async rephrase(text: string, style: string): Promise<RephraserResult>;
  // Overload for config-based rephrasing
  async rephrase(text: string, config: RephraserConfig): Promise<RephraserResult>;
  // Implementation
  async rephrase(text: string, styleOrConfig: string | RephraserConfig): Promise<RephraserResult> {
    const config: RephraserConfig = typeof styleOrConfig === 'string' 
      ? { style: styleOrConfig as RephraserConfig['style'] }
      : styleOrConfig;
    
    return this.rephraseWithConfig(text, config);
  }

  private async rephraseWithConfig(text: string, config: RephraserConfig): Promise<RephraserResult> {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      const { style, preserveMeaning = true } = config;
      
      // Get user's interface language
      const userLanguage = await this.storageService.getLanguage();
      const language = this.getLanguageName(userLanguage!);
      const originalLength = text.length;

      const prompt = this.buildPrompt(text, style, preserveMeaning, language);
      
      // Load saved API configuration
      const apiConfig = await this.storageService.getApiConfig();
      
      const response = await this.geminiService.generateContent(prompt, {
        model: apiConfig?.model || 'gemini-2.5-flash',
        temperature: apiConfig?.temperature || 0.7,
        maxTokens: apiConfig?.maxTokens || 2048
      });

      const rephrasedText = response.text.trim();
      const rephrasedLength = rephrasedText.length;
      const lengthDelta = rephrasedLength - originalLength;

      const result = {
        rephrasedText,
        style,
        originalLength,
        rephrasedLength,
        lengthDelta
      };

      if (this.historyService) {
        await this.historyService.addToHistory(
          'rephrase',
          text,
          rephrasedText,
          text,
          {
            style,
            preserveMeaning: config.preserveMeaning,
            language: config.language,
            lengthDelta
          }
        );
      }

      return result;
    } catch (error) {
      console.error('Rephraser error:', error);
      throw new Error(`Failed to rephrase text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(text: string, style: string, preserveMeaning: boolean, language: string): string {
    const styleInstructions: Record<string, string> = {
      'casual': 'casual, conversational style, as if talking to a friend. Use simple words and short sentences.',
      'formal': 'formal, official style suitable for business correspondence. Use polite phrases and professional vocabulary.',
      'professional': 'professional style for work environment. Clear, structured, without unnecessary emotions.',
      'friendly': 'friendly, warm style. Positive tone, but not too informal.',
      'academic': 'academic, scientific style. Use terminology, complex constructions, avoid colloquial expressions.'
    };

    const styleInstruction = styleInstructions[style] || styleInstructions['casual'];

    let prompt = `Rephrase the following text in ${styleInstruction}`;
    
    if (preserveMeaning) {
      prompt += ' Preserve the exact meaning and all key details of the original.';
    }
    
    prompt += `\nOutput language: ${language}`;
    prompt += `\nSource text:\n${text}`;
    prompt += '\nRephrased text:';

    return prompt;
  }

  // Overload for simple style-based streaming rephrasing
  async rephraseWithStream(text: string, style: string, onChunk?: (chunk: string) => void): Promise<RephraserResult>;
  // Overload for config-based streaming rephrasing
  async rephraseWithStream(text: string, config: RephraserConfig, onChunk?: (chunk: string) => void): Promise<RephraserResult>;
  // Implementation
  async rephraseWithStream(
    text: string, 
    styleOrConfig: string | RephraserConfig, 
    onChunk?: (chunk: string) => void
  ): Promise<RephraserResult> {
    const config: RephraserConfig = typeof styleOrConfig === 'string' 
      ? { style: styleOrConfig as RephraserConfig['style'] }
      : styleOrConfig;
    
    return this.rephraseWithStreamConfig(text, config, onChunk);
  }

  private async rephraseWithStreamConfig(
    text: string, 
    config: RephraserConfig, 
    onChunk?: (chunk: string) => void
  ): Promise<RephraserResult> {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      const { style, preserveMeaning = true } = config;
      
      // Get user's interface language
      const userLanguage = await this.storageService.getLanguage();
      const language = this.getLanguageName(userLanguage!);
      const originalLength = text.length;

      const prompt = this.buildPrompt(text, style, preserveMeaning, language);
      let fullRephrasedText = '';

      // Load saved API configuration
      const apiConfig = await this.storageService.getApiConfig();
      
      for await (const chunk of this.geminiService.streamContent(prompt, {
        model: apiConfig?.model || 'gemini-2.5-flash',
        temperature: apiConfig?.temperature || 0.7,
        maxTokens: apiConfig?.maxTokens || 2048
      })) {
        if (!chunk.isComplete) {
          fullRephrasedText += chunk.text;
          if (onChunk) {
            onChunk(chunk.text);
          }
        }
      }

      const rephrasedText = fullRephrasedText.trim();
      const rephrasedLength = rephrasedText.length;
      const lengthDelta = rephrasedLength - originalLength;

      const result = {
        rephrasedText,
        style,
        originalLength,
        rephrasedLength,
        lengthDelta
      };

      if (this.historyService) {
        await this.historyService.addToHistory(
          'rephrase',
          text,
          rephrasedText,
          text,
          {
            style,
            preserveMeaning: config.preserveMeaning,
            language: config.language,
            lengthDelta
          }
        );
      }

      return result;
    } catch (error) {
      console.error('Rephraser streaming error:', error);
      throw new Error(`Failed to rephrase text with streaming: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
