import { GeminiService } from '../services/gemini-api';
import { HistoryService } from '../services/history';
import { TranslatorConfig, TranslatorResult, LanguageCode } from '../types';

export class Translator {
  private geminiService: GeminiService;
  private historyService?: HistoryService;

  constructor(geminiService: GeminiService, historyService?: HistoryService) {
    this.geminiService = geminiService;
    this.historyService = historyService;
  }

  async translate(text: string, config: TranslatorConfig): Promise<TranslatorResult>;
  async translate(text: string, targetLanguage: string): Promise<TranslatorResult>;
  async translate(text: string, configOrTargetLanguage: TranslatorConfig | string): Promise<TranslatorResult> {
    if (typeof configOrTargetLanguage === 'string') {
      const config: TranslatorConfig = {
        sourceLanguage: 'auto',
        targetLanguage: configOrTargetLanguage as Exclude<LanguageCode, 'auto'>
      };
      return this.translateWithConfig(text, config);
    }
    return this.translateWithConfig(text, configOrTargetLanguage);
  }

  private async translateWithConfig(text: string, config: TranslatorConfig): Promise<TranslatorResult> {
    try {
      if (!text || text.trim().length === 0)
         {
        throw new Error('Text cannot be empty');
      }

      if (!config.targetLanguage || config.targetLanguage.trim().length === 0) {
        throw new Error('Target language is required');
      }

      const { sourceLanguage, targetLanguage, preserveFormatting = true } = config;
      const originalLength = text.length;

      const prompt = this.buildPrompt(text, sourceLanguage, targetLanguage, preserveFormatting);
      
      const response = await this.geminiService.generateContent(prompt, {
        temperature: 0.5,
        maxTokens: 2048
      });

      const translatedText = response.text.trim();
      const { detectedLanguage, cleanedText } = this.parseDetectedLanguage(translatedText);
      const finalTranslatedText = cleanedText;
      const translatedLength = finalTranslatedText.length;

      const finalSourceLanguage = detectedLanguage || sourceLanguage;

      const result = {
        translatedText: finalTranslatedText,
        sourceLanguage: finalSourceLanguage,
        targetLanguage,
        detectedLanguage,
        originalLength,
        translatedLength
      };

      if (this.historyService) {
        await this.historyService.addToHistory(
          'translate',
          text,
          finalTranslatedText,
          text,
          {
            sourceLanguage: finalSourceLanguage,
            targetLanguage,
            detectedLanguage,
            preserveFormatting: config.preserveFormatting,
            originalLength,
            translatedLength
          }
        );
      }

      return result;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async translateWithStream(
    text: string, 
    config: TranslatorConfig, 
    onChunk?: (chunk: string) => void
  ): Promise<TranslatorResult>;
  async translateWithStream(
    text: string, 
    targetLanguage: string, 
    onChunk?: (chunk: string) => void
  ): Promise<TranslatorResult>;
  async translateWithStream(
    text: string, 
    configOrTargetLanguage: TranslatorConfig | string, 
    onChunk?: (chunk: string) => void
  ): Promise<TranslatorResult> {
    if (typeof configOrTargetLanguage === 'string') {
      const config: TranslatorConfig = {
        sourceLanguage: 'auto',
        targetLanguage: configOrTargetLanguage as Exclude<LanguageCode, 'auto'>
      };
      return this.translateWithStreamConfig(text, config, onChunk);
    }
    return this.translateWithStreamConfig(text, configOrTargetLanguage, onChunk);
  }

  private async translateWithStreamConfig(
    text: string, 
    config: TranslatorConfig, 
    onChunk?: (chunk: string) => void
  ): Promise<TranslatorResult> {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      if (!config.targetLanguage || config.targetLanguage.trim().length === 0) {
        throw new Error('Target language is required');
      }

      const { sourceLanguage, targetLanguage, preserveFormatting = true } = config;
      const originalLength = text.length;

      const prompt = this.buildPrompt(text, sourceLanguage, targetLanguage, preserveFormatting);
      
      let fullTranslatedText = '';
      
      for await (const chunk of this.geminiService.streamContent(prompt, {
        temperature: 0.5,
        maxTokens: 2048
      })) {
        if (!chunk.isComplete) {
          fullTranslatedText += chunk.text;
          if (onChunk) {
            onChunk(chunk.text);
          }
        }
      }

      const { detectedLanguage, cleanedText } = this.parseDetectedLanguage(fullTranslatedText);
      const finalTranslatedText = cleanedText;
      const translatedLength = finalTranslatedText.length;

      const finalSourceLanguage = detectedLanguage || sourceLanguage;

      const result = {
        translatedText: finalTranslatedText,
        sourceLanguage: finalSourceLanguage,
        targetLanguage,
        detectedLanguage,
        originalLength,
        translatedLength
      };

      if (this.historyService) {
        await this.historyService.addToHistory(
          'translate',
          text,
          finalTranslatedText,
          text,
          {
            sourceLanguage: finalSourceLanguage,
            targetLanguage,
            detectedLanguage,
            preserveFormatting: config.preserveFormatting,
            originalLength,
            translatedLength
          }
        );
      }

      return result;
    } catch (error) {
      console.error('Streaming translation error:', error);
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(
    text: string, 
    sourceLanguage: string, 
    targetLanguage: string, 
    preserveFormatting: boolean
  ): string {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'ru': 'Russian',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'it': 'Italian',
      'pt': 'Portuguese',
      'auto': 'Auto-detect'
    };

    const targetLanguageName = languageNames[targetLanguage] || targetLanguage;
    const sourceLanguageName = languageNames[sourceLanguage] || sourceLanguage;

    let prompt = '';

    if (sourceLanguage === 'auto') {
      prompt += `Определи язык следующего текста и переведи его на ${targetLanguageName}.\n`;
    } else {
      prompt += `Переведи следующий текст с ${sourceLanguageName} на ${targetLanguageName}.\n`;
    }

    if (preserveFormatting) {
      prompt += 'Сохрани форматирование текста (переносы строк, списки, структуру).\n';
    }

    prompt += 'Предоставь только перевод без дополнительных объяснений.\n';

    if (sourceLanguage === 'auto') {
      prompt += 'В первой строке укажи обнаруженный язык в формате \'Detected: [код языка]\', затем с новой строки дай перевод.\n';
    }

    prompt += `Исходный текст:\n${text}\n\nПеревод:`;

    return prompt;
  }

  private parseDetectedLanguage(responseText: string): { detectedLanguage: string | undefined, cleanedText: string } {
    const detectedPattern = /^Detected:\s*([a-z]{2})(?:-[A-Z]{2})?/i;
    const match = responseText.match(detectedPattern);
    
    if (match) {
      const detectedLanguage = match[1].toLowerCase();
      const cleanedText = responseText.replace(/^Detected:\s*[a-z]{2}(?:-[A-Z]{2})?\s*\n?/i, '').trim();
      return { detectedLanguage, cleanedText };
    }
    
    return { detectedLanguage: undefined, cleanedText: responseText };
  }
}
