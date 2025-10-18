import { GeminiService } from '../services/gemini-api';
import { HistoryService } from '../services/history';
import { GeminiResponse } from '../types';

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
  private historyService?: HistoryService;

  constructor(geminiService: GeminiService, historyService?: HistoryService) {
    this.geminiService = geminiService;
    this.historyService = historyService;
  }

  async summarize(text: string, config?: SummarizerConfig): Promise<SummarizerResult> {
    return this.summarizeInternal(text, config);
  }

  private buildPrompt(text: string, maxLength: number, style: string, language: string): string {
    const styleInstructions: Record<string, string> = {
      'brief': 'краткое резюме в 2-3 предложениях',
      'detailed': 'подробное резюме с основными пунктами',
      'bullet-points': 'резюме в виде маркированного списка'
    };

    const styleInstruction = styleInstructions[style] || styleInstructions['brief'];

    return `Создай ${styleInstruction} следующего текста на языке ${language}. 
Максимальная длина резюме: ${maxLength} символов.

Текст для резюмирования:
${text}

Резюме:`;
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
    const language = config?.language || 'Russian';

    const prompt = this.buildPrompt(text, maxLength, style, language);

    try {
      let fullSummary = '';
      
      for await (const chunk of this.geminiService.streamContent(prompt, {
        temperature: 0.3,
        maxTokens: Math.min(2048, maxLength * 2)
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
            language: config?.language || 'Russian',
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
