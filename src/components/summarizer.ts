import { GeminiService } from '../services/gemini-api';
import { HistoryService } from '../services/history';
import { StorageService } from '../services/storage';
import { GeminiResponse, DEFAULT_MAX_TOKENS } from '../types';

export interface SummarizerConfig {
  maxLength?: number;
  style?: 'brief' | 'detailed' | 'bullet-points';
  language?: string;
}

export interface SummarizerResult {
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
}

export class Summarizer {
  private geminiService: GeminiService;
  private readonly historyService?: HistoryService;
  private readonly storageService: StorageService;

  constructor(geminiService: GeminiService, historyService?: HistoryService, storageService?: StorageService) {
    this.geminiService = geminiService;
    this.historyService = historyService;
    this.storageService = storageService || new StorageService();
  }

  async summarize(text: string, config?: SummarizerConfig): Promise<SummarizerResult> {
    return this.summarizeInternal(text, config);
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

  private buildPrompt(text: string, maxLength: number, style: string, language: string): string {
    const styleInstructions: Record<string, string> = {
      'brief': 'brief summary in 2-3 sentences',
      'detailed': 'detailed summary with main points',
      'bullet-points': 'summary as a bulleted list'
    };

    const styleInstruction = styleInstructions[style] || styleInstructions['brief'];

    return `Create a ${styleInstruction} of the following text in ${language}. 
Maximum summary length: ${maxLength} characters.

Text to summarize:
${text}

Summary:`;
  }

  async summarizeWithStream(
    text: string, 
    config?: SummarizerConfig,
    onChunk?: (chunk: string) => void
  ): Promise<SummarizerResult> {
    return this.summarizeInternal(text, config, onChunk);
  }

  private async summarizeInternal(
    text: string, 
    config?: SummarizerConfig,
    onChunk?: (chunk: string) => void
  ): Promise<SummarizerResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const originalLength = text.length;
    const maxLength = config?.maxLength || Math.max(100, Math.floor(originalLength * 0.3));
    const style = config?.style || 'brief';
    
    // Get user's interface language
    const userLanguage = await this.storageService.getLanguage();
    const language = this.getLanguageName(userLanguage!);

    const prompt = this.buildPrompt(text, maxLength, style, language);

    try {
      // Load saved API configuration
      const apiConfig = await this.storageService.getApiConfig();
      
      let fullSummary = '';
      
      for await (const chunk of this.geminiService.streamContent(prompt, {
        ...GeminiService.getApiConfig(apiConfig),
        temperature: apiConfig?.temperature || 0.3,
        maxTokens: apiConfig?.maxTokens || Math.min(DEFAULT_MAX_TOKENS, maxLength * 2)
      })) {
        if (!chunk.isComplete) {
          fullSummary += chunk.text;
        }
        if (onChunk && !chunk.isComplete) {
          onChunk(chunk.text);
        }
      }

      const summary = fullSummary.trim();
      const summaryLength = summary.length;
      const compressionRatio = originalLength > 0 ? summaryLength / originalLength : 0;

      const result = {
        summary,
        originalLength,
        summaryLength,
        compressionRatio
      };

      if (this.historyService) {
        await this.historyService.addToHistory(
          'summarize',
          text,
          summary,
          text,
          {
            style: config?.style || 'brief',
            language: config?.language || 'English',
            maxLength: config?.maxLength,
            compressionRatio
          }
        );
      }

      return result;
    } catch (error) {
      console.error('Summarization error:', error);
      throw new Error(`Failed to summarize text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
