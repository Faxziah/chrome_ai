import { GeminiService } from '../services/gemini-api';
import { RephraserConfig, RephraserResult } from '../types';

export class Rephraser {
  private geminiService: GeminiService;

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
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

      const { style, preserveMeaning = true, language = 'Russian' } = config;
      const originalLength = text.length;

      const prompt = this.buildPrompt(text, style, preserveMeaning, language);
      const response = await this.geminiService.generateContent(prompt, {
        temperature: 0.7,
        maxTokens: 2048
      });

      const rephrasedText = response.text.trim();
      const rephrasedLength = rephrasedText.length;
      const lengthDelta = rephrasedLength - originalLength;

      return {
        rephrasedText,
        style,
        originalLength,
        rephrasedLength,
        lengthDelta
      };
    } catch (error) {
      console.error('Rephraser error:', error);
      throw new Error(`Failed to rephrase text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(text: string, style: string, preserveMeaning: boolean, language: string): string {
    const styleInstructions: Record<string, string> = {
      'casual': 'неформальный, разговорный стиль, как будто общаешься с другом. Используй простые слова и короткие предложения.',
      'formal': 'формальный, официальный стиль, подходящий для деловой переписки. Используй вежливые обороты и профессиональную лексику.',
      'professional': 'профессиональный стиль для рабочей среды. Четко, структурировано, без лишних эмоций.',
      'friendly': 'дружелюбный, теплый стиль. Позитивный тон, но не слишком неформальный.',
      'academic': 'академический, научный стиль. Используй терминологию, сложные конструкции, избегай разговорных выражений.'
    };

    const styleInstruction = styleInstructions[style] || styleInstructions['casual'];

    let prompt = `Перефразируй следующий текст в ${styleInstruction}`;
    
    if (preserveMeaning) {
      prompt += ' Сохрани точный смысл и все ключевые детали оригинала.';
    }
    
    prompt += `\nЯзык вывода: ${language}`;
    prompt += `\nИсходный текст:\n${text}`;
    prompt += '\nПерефразированный текст:';

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

      const { style, preserveMeaning = true, language = 'Russian' } = config;
      const originalLength = text.length;

      const prompt = this.buildPrompt(text, style, preserveMeaning, language);
      let fullRephrasedText = '';

      for await (const chunk of this.geminiService.streamContent(prompt, {
        temperature: 0.7,
        maxTokens: 2048
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

      return {
        rephrasedText,
        style,
        originalLength,
        rephrasedLength,
        lengthDelta
      };
    } catch (error) {
      console.error('Rephraser streaming error:', error);
      throw new Error(`Failed to rephrase text with streaming: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
