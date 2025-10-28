import { GeminiService, HistoryService, StorageService } from '../services';
import { TranslatorConfig, TranslatorResult, LanguageCode, DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE_FOR_TRANSLATIONS } from '../types';

export class Translator {
  private geminiService: GeminiService;
  private readonly historyService?: HistoryService;
  private readonly storageService: StorageService;

  constructor(geminiService: GeminiService, historyService?: HistoryService, storageService?: StorageService) {
    this.geminiService = geminiService;
    this.historyService = historyService;
    this.storageService = storageService || new StorageService();
  }

  private validateTranslationInput(text: string, config: TranslatorConfig): void {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    if (!config.targetLanguage || config.targetLanguage.trim().length === 0) {
      throw new Error('Target language is required');
    }
  }

  private processTranslationResult(
    translatedText: string, 
    sourceLanguage: string, 
    targetLanguage: string, 
    originalLength: number
  ): TranslatorResult {
    const { detectedLanguage, cleanedText } = this.parseDetectedLanguage(translatedText);
    const finalTranslatedText = cleanedText;
    const translatedLength = finalTranslatedText.length;
    const finalSourceLanguage = detectedLanguage || sourceLanguage;

    return {
      translatedText: finalTranslatedText,
      sourceLanguage: finalSourceLanguage,
      targetLanguage,
      detectedLanguage,
      originalLength,
      translatedLength,
      compressionRatio: originalLength > 0 ? translatedLength / originalLength : 1
    };
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
      this.validateTranslationInput(text, config);

      const { sourceLanguage, targetLanguage, preserveFormatting = true } = config;
      const originalLength = text.length;

      const prompt = this.buildPrompt(text, sourceLanguage, targetLanguage, preserveFormatting);
      
      // Load saved API configuration
      const apiConfig = await this.storageService.getApiConfig();
      
      const response = await this.geminiService.generateText(prompt, {
        ...GeminiService.getApiConfig(apiConfig),
        temperature: apiConfig?.temperature || DEFAULT_TEMPERATURE_FOR_TRANSLATIONS,
        maxTokens: apiConfig?.maxTokens || DEFAULT_MAX_TOKENS
      });

      const translatedText = response.text.trim();
      const result = this.processTranslationResult(translatedText, sourceLanguage, targetLanguage, originalLength);

      if (this.historyService) {
        await this.historyService.addToHistory(
          'translate',
          text,
          result.translatedText,
          text,
          {
            sourceLanguage: result.sourceLanguage,
            targetLanguage: result.targetLanguage,
            detectedLanguage: result.detectedLanguage,
            preserveFormatting: config.preserveFormatting,
            originalLength: result.originalLength,
            translatedLength: result.translatedLength
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
      this.validateTranslationInput(text, config);

      const { sourceLanguage, targetLanguage, preserveFormatting = true } = config;
      const originalLength = text.length;

      const prompt = this.buildPrompt(text, sourceLanguage, targetLanguage, preserveFormatting);
      
      let fullTranslatedText = '';
      
      // Load saved API configuration
      const apiConfig = await this.storageService.getApiConfig();
      
      for await (const chunk of this.geminiService.streamContent(prompt, {
        ...GeminiService.getApiConfig(apiConfig),
        temperature: apiConfig?.temperature || DEFAULT_TEMPERATURE_FOR_TRANSLATIONS,
        maxTokens: apiConfig?.maxTokens || DEFAULT_MAX_TOKENS
      })) {
        if (!chunk.isComplete) {
          fullTranslatedText += chunk.text;
          if (onChunk) {
            onChunk(chunk.text);
          }
        }
      }

      const result = this.processTranslationResult(fullTranslatedText, sourceLanguage, targetLanguage, originalLength);

      if (this.historyService) {
        await this.historyService.addToHistory(
          'translate',
          text,
          result.translatedText,
          text,
          {
            sourceLanguage: result.sourceLanguage,
            targetLanguage: result.targetLanguage,
            detectedLanguage: result.detectedLanguage,
            preserveFormatting: config.preserveFormatting,
            originalLength: result.originalLength,
            translatedLength: result.translatedLength
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
      'ar': 'Arabic',
      'hi': 'Hindi',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'tr': 'Turkish',
      'pl': 'Polish',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'cs': 'Czech',
      'hu': 'Hungarian',
      'ro': 'Romanian',
      'bg': 'Bulgarian',
      'hr': 'Croatian',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'et': 'Estonian',
      'lv': 'Latvian',
      'lt': 'Lithuanian',
      'el': 'Greek',
      'he': 'Hebrew',
      'fa': 'Persian',
      'ur': 'Urdu',
      'bn': 'Bengali',
      'ta': 'Tamil',
      'te': 'Telugu',
      'ml': 'Malayalam',
      'kn': 'Kannada',
      'gu': 'Gujarati',
      'pa': 'Punjabi',
      'mr': 'Marathi',
      'ne': 'Nepali',
      'si': 'Sinhala',
      'my': 'Burmese',
      'km': 'Khmer',
      'lo': 'Lao',
      'ka': 'Georgian',
      'am': 'Amharic',
      'sw': 'Swahili',
      'zu': 'Zulu',
      'af': 'Afrikaans',
      'sq': 'Albanian',
      'az': 'Azerbaijani',
      'be': 'Belarusian',
      'bs': 'Bosnian',
      'ca': 'Catalan',
      'cy': 'Welsh',
      'eu': 'Basque',
      'gl': 'Galician',
      'is': 'Icelandic',
      'ga': 'Irish',
      'mk': 'Macedonian',
      'mt': 'Maltese',
      'sr': 'Serbian',
      'uk': 'Ukrainian',
      'auto': 'Auto-detect'
    };

    const targetLanguageName = languageNames[targetLanguage] || targetLanguage;
    const sourceLanguageName = languageNames[sourceLanguage] || sourceLanguage;

    let prompt = '';

    if (sourceLanguage === 'auto') {
      prompt += `Detect the language of the following text and translate it to ${targetLanguageName}.\n`;
    } else {
      prompt += `Translate the following text from ${sourceLanguageName} to ${targetLanguageName}.\n`;
    }

    if (preserveFormatting) {
      prompt += 'Preserve text formatting (line breaks, lists, structure).\n';
    }

    prompt += 'Provide only the translation without additional explanations.\n';

    if (sourceLanguage === 'auto') {
      prompt += 'In the first line, specify the detected language in the format \'Detected: [language code]\', then provide the translation on a new line.\n';
    }

    prompt += `Source text:\n${text}\n\nTranslation:`;

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
